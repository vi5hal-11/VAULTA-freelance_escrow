// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IEscrow.sol";
import "./interfaces/IEscrowFactory.sol";

/**
 * @title Arbitration
 * @notice Shared dispute resolution contract.
 *         Jurors stake ETH to join the pool, are pseudo-randomly selected per
 *         dispute (3 jurors), and vote on the outcome. A 2/3 majority auto-
 *         resolves the dispute by calling back into the Escrow contract.
 *
 * Access model:
 *   - createDispute() is callable only by Escrow contracts registered in the factory.
 *   - vote() is callable only by the 3 jurors selected for that dispute.
 */
contract Arbitration is ReentrancyGuard {
    // ─── Errors ──────────────────────────────────────────────────────────────

    error InsufficientStake();
    error NotSelectedJuror();
    error AlreadyVoted();
    error DisputeAlreadyResolved();
    error JurorPoolTooSmall();
    error NotValidEscrow();
    error StakeLockedInActiveDispute();
    error InvalidDecision();

    // ─── Events ──────────────────────────────────────────────────────────────

    event JurorStaked(address indexed juror, uint256 amount);
    event StakeWithdrawn(address indexed juror, uint256 amount);
    event DisputeCreated(uint256 indexed disputeId, address indexed escrowAddress, address[3] jurors);
    event VoteCast(uint256 indexed disputeId, address indexed juror, uint8 decision);
    event DisputeResolved(uint256 indexed disputeId, address indexed winner);

    // ─── Types ───────────────────────────────────────────────────────────────

    struct Juror {
        uint256 stakedAmount;
        bool active;
        uint256 activeDisputeCount; // number of disputes where this juror has not yet voted
    }

    struct Dispute {
        address escrowAddress;
        address[3] jurors;
        bool[3] hasVoted;
        uint8 clientVotes;
        uint8 freelancerVotes;
        bool resolved;
        uint256 createdAt;
    }

    // ─── Storage ─────────────────────────────────────────────────────────────

    address public immutable factory;

    uint256 public minimumStake;
    uint256 public constant JURORS_PER_DISPUTE = 3;

    address[] public jurorList;
    mapping(address => Juror) public jurors;

    uint256 public disputeCount;
    mapping(uint256 => Dispute) public disputes;

    // ─── Constructor ─────────────────────────────────────────────────────────

    constructor(uint256 _minimumStake, address _factory) {
        require(_minimumStake > 0, "Minimum stake must be > 0");
        require(_factory != address(0), "Invalid factory address");
        minimumStake = _minimumStake;
        factory = _factory;
    }

    // ─── Juror Management ────────────────────────────────────────────────────

    /**
     * @notice Stake ETH to become eligible for juror selection.
     *         Can be called multiple times to top up stake.
     */
    function stake() external payable {
        if (msg.value < minimumStake && jurors[msg.sender].stakedAmount + msg.value < minimumStake) {
            revert InsufficientStake();
        }

        if (!jurors[msg.sender].active) {
            jurorList.push(msg.sender);
        }

        jurors[msg.sender].stakedAmount += msg.value;
        jurors[msg.sender].active = true;

        emit JurorStaked(msg.sender, msg.value);
    }

    /**
     * @notice Withdraw staked ETH. Blocked if the juror still has pending votes
     *         in active disputes.
     */
    function withdrawStake() external nonReentrant {
        Juror storage j = jurors[msg.sender];
        if (!j.active) revert InsufficientStake();
        if (j.activeDisputeCount > 0) revert StakeLockedInActiveDispute();

        uint256 amount = j.stakedAmount;
        j.stakedAmount = 0;
        j.active = false;

        (bool ok, ) = msg.sender.call{value: amount}("");
        require(ok, "Transfer failed");

        emit StakeWithdrawn(msg.sender, amount);
    }

    // ─── Dispute Lifecycle ───────────────────────────────────────────────────

    /**
     * @notice Create a new dispute. Only callable by factory-registered Escrow
     *         contracts (enforced via IEscrowFactory.isValidEscrow).
     * @param escrowAddress The Escrow contract raising the dispute.
     * @return newDisputeId The ID assigned to this dispute.
     */
    function createDispute(address escrowAddress) external returns (uint256 newDisputeId) {
        if (!IEscrowFactory(factory).isValidEscrow(msg.sender)) revert NotValidEscrow();
        if (jurorList.length < JURORS_PER_DISPUTE) revert JurorPoolTooSmall();

        disputeCount++;
        newDisputeId = disputeCount;

        Dispute storage d = disputes[newDisputeId];
        d.escrowAddress = escrowAddress;
        d.resolved = false;
        d.createdAt = block.timestamp;

        // Pseudo-random juror selection (sufficient for MVP; upgrade to VRF in V2)
        address[3] memory selected = _selectJurors(newDisputeId);
        d.jurors = selected;

        // Increment active dispute counter for selected jurors
        for (uint256 i = 0; i < JURORS_PER_DISPUTE; i++) {
            jurors[selected[i]].activeDisputeCount++;
        }

        emit DisputeCreated(newDisputeId, escrowAddress, selected);
    }

    /**
     * @notice Cast a vote on an active dispute.
     *         decision: 0 = vote for client, 1 = vote for freelancer.
     *         Auto-resolves when a 2/3 majority is reached.
     */
    function vote(uint256 disputeId, uint8 decision) external nonReentrant {
        if (decision > 1) revert InvalidDecision();

        Dispute storage d = disputes[disputeId];
        if (d.resolved) revert DisputeAlreadyResolved();

        // Find juror index (only 3 elements — O(1) in practice)
        uint256 jurorIndex = JURORS_PER_DISPUTE; // sentinel
        for (uint256 i = 0; i < JURORS_PER_DISPUTE; i++) {
            if (d.jurors[i] == msg.sender) {
                jurorIndex = i;
                break;
            }
        }
        if (jurorIndex == JURORS_PER_DISPUTE) revert NotSelectedJuror();
        if (d.hasVoted[jurorIndex]) revert AlreadyVoted();

        // CEI: record vote before external call
        d.hasVoted[jurorIndex] = true;
        jurors[msg.sender].activeDisputeCount--;

        if (decision == 0) {
            d.clientVotes++;
        } else {
            d.freelancerVotes++;
        }

        emit VoteCast(disputeId, msg.sender, decision);

        // Auto-resolve on 2/3 majority
        uint8 majority = uint8(JURORS_PER_DISPUTE / 2) + 1; // = 2
        if (d.clientVotes >= majority) {
            _resolve(disputeId, 0);
        } else if (d.freelancerVotes >= majority) {
            _resolve(disputeId, 1);
        }
    }

    // ─── View Functions ──────────────────────────────────────────────────────

    function getJurors(uint256 disputeId) external view returns (address[3] memory) {
        return disputes[disputeId].jurors;
    }

    function getVotingStatus(uint256 disputeId)
        external
        view
        returns (
            uint8 clientVotes,
            uint8 freelancerVotes,
            bool resolved
        )
    {
        Dispute storage d = disputes[disputeId];
        return (d.clientVotes, d.freelancerVotes, d.resolved);
    }

    function getDisputeEscrow(uint256 disputeId) external view returns (address) {
        return disputes[disputeId].escrowAddress;
    }

    function getJurorInfo(address juror) external view returns (uint256 stakedAmount, bool active) {
        Juror storage j = jurors[juror];
        return (j.stakedAmount, j.active);
    }

    // ─── Internal Helpers ────────────────────────────────────────────────────

    /**
     * @dev Pseudo-randomly selects JURORS_PER_DISPUTE unique active jurors.
     *      Uses block data + disputeId as entropy. Upgrade to Chainlink VRF in V2.
     */
    function _selectJurors(uint256 disputeId) internal view returns (address[3] memory selected) {
        uint256 poolLen = jurorList.length;
        uint256 rand = uint256(
            keccak256(abi.encodePacked(block.timestamp, block.prevrandao, disputeId, msg.sender))
        );

        bool[3] memory filled;
        uint256 count = 0;
        uint256 attempts = 0;

        while (count < JURORS_PER_DISPUTE && attempts < poolLen * 2) {
            uint256 idx = (rand + attempts) % poolLen;
            address candidate = jurorList[idx];

            // Skip inactive jurors and duplicates
            bool duplicate = false;
            for (uint256 j = 0; j < count; j++) {
                if (selected[j] == candidate) {
                    duplicate = true;
                    break;
                }
            }

            if (!duplicate && jurors[candidate].active) {
                selected[count] = candidate;
                filled[count] = true;
                count++;
            }

            attempts++;
        }

        // Fallback: if pool has fewer than 3 unique active jurors, reuse from start
        // (JurorPoolTooSmall guard in createDispute prevents this in practice)
        if (count < JURORS_PER_DISPUTE) revert JurorPoolTooSmall();
    }

    function _resolve(uint256 disputeId, uint8 winnerDecision) internal {
        Dispute storage d = disputes[disputeId];
        d.resolved = true;

        // Determine winner address from the escrow contract
        address escrow = d.escrowAddress;

        // winnerDecision 0 = client, 1 = freelancer
        // We pass the actual address + amount to the escrow's resolveDispute.
        // Read client/freelancer addresses from the escrow.
        address winner;
        uint256 amountToFreelancer;

        if (winnerDecision == 1) {
            // Freelancer wins: full remaining balance
            winner = _getFreelancer(escrow);
            // Signal full payment by passing type(uint256).max as sentinel;
            // Escrow.resolveDispute clamps to its actual balance.
            amountToFreelancer = type(uint256).max;
        } else {
            // Client wins: nothing to freelancer
            winner = _getClient(escrow);
            amountToFreelancer = 0;
        }

        emit DisputeResolved(disputeId, winner);

        // Cross-contract call — CEI respected: state already updated above
        IEscrow(escrow).resolveDispute(winner, amountToFreelancer);
    }

    function _getClient(address escrow) internal view returns (address) {
        // Low-level call to avoid tight coupling; the Escrow exposes client() as public.
        (bool ok, bytes memory data) = escrow.staticcall(abi.encodeWithSignature("client()"));
        require(ok && data.length == 32, "client() call failed");
        return abi.decode(data, (address));
    }

    function _getFreelancer(address escrow) internal view returns (address) {
        (bool ok, bytes memory data) = escrow.staticcall(abi.encodeWithSignature("freelancer()"));
        require(ok && data.length == 32, "freelancer() call failed");
        return abi.decode(data, (address));
    }
}
