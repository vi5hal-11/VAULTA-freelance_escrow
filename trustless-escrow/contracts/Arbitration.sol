// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Escrow.sol";

contract Arbitration {

    error InsufficientStake();
    error NotSelectedJuror();
    error AlreadyVoted();
    error DisputeAlreadyResolved();
    error JurorPoolTooSmall();

    event JurorStaked(address juror, uint256 amount);
    event DisputeCreated(uint256 disputeId, address escrow);
    event VoteCast(address juror, uint256 disputeId, uint8 decision);
    event DisputeResolved(uint256 disputeId, uint8 winner);

    struct Juror {
        uint256 stake;
        bool active;
    }

    struct Dispute {
        address escrow;
        address[] jurors;
        uint256 votesForClient;
        uint256 votesForFreelancer;
        bool resolved;
        mapping(address => bool) hasVoted;
    }

    mapping(address => Juror) public jurors;
    mapping(uint256 => Dispute) public disputes;
    
    address[] public jurorPool;
    uint256 public disputeCount;

    uint256 public constant MIN_STAKE = 0.1 ether; // Lowered for testing
    uint256 public constant JURORS_PER_DISPUTE = 3;

    function stake() external payable {
        if (msg.value < MIN_STAKE) revert InsufficientStake();

        if (!jurors[msg.sender].active) {
            jurorPool.push(msg.sender);
        }

        jurors[msg.sender].stake += msg.value;
        jurors[msg.sender].active = true;

        emit JurorStaked(msg.sender, msg.value);
    }

    function createDispute(address escrow) external returns (uint256) {
        if (jurorPool.length < JURORS_PER_DISPUTE) revert JurorPoolTooSmall();

        disputeCount++;
        Dispute storage d = disputes[disputeCount];
        d.escrow = escrow;
        d.resolved = false;

        // Pseudo-random juror selection
        uint256 rand = uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, disputeCount)));
        
        for (uint256 i = 0; i < JURORS_PER_DISPUTE; i++) {
            uint256 index = (rand + i) % jurorPool.length;
            d.jurors.push(jurorPool[index]);
        }

        emit DisputeCreated(disputeCount, escrow);
        return disputeCount;
    }

    function vote(uint256 disputeId, uint8 decision) external {
        Dispute storage d = disputes[disputeId];
        if (d.resolved) revert DisputeAlreadyResolved();

        bool isJuror = false;
        for (uint256 i = 0; i < d.jurors.length; i++) {
            if (d.jurors[i] == msg.sender) {
                isJuror = true;
                break;
            }
        }

        if (!isJuror) revert NotSelectedJuror();
        if (d.hasVoted[msg.sender]) revert AlreadyVoted();

        d.hasVoted[msg.sender] = true;

        if (decision == 0) {
            d.votesForClient++;
        } else {
            d.votesForFreelancer++;
        }

        emit VoteCast(msg.sender, disputeId, decision);

        // Check for majority
        uint256 majorityThreshold = (JURORS_PER_DISPUTE / 2) + 1;
        
        if (d.votesForClient >= majorityThreshold) {
            _resolve(disputeId, 0);
        } else if (d.votesForFreelancer >= majorityThreshold) {
            _resolve(disputeId, 1);
        }
    }

    function _resolve(uint256 disputeId, uint8 winner) internal {
        Dispute storage d = disputes[disputeId];
        d.resolved = true;

        // Call the Escrow contract to release funds
        Escrow(payable(d.escrow)).resolveDispute(winner, 0);

        emit DisputeResolved(disputeId, winner);
    }

    // Getters for frontend
    function getJurors(uint256 disputeId) external view returns (address[] memory) {
        return disputes[disputeId].jurors;
    }

    function getVotingStatus(uint256 disputeId) external view returns (uint256 clientVotes, uint256 freelancerVotes, bool resolved) {
        Dispute storage d = disputes[disputeId];
        return (d.votesForClient, d.votesForFreelancer, d.resolved);
    }
}