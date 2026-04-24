// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/IArbitration.sol";

/**
 * @title Escrow
 * @notice Per-job escrow contract managing milestones, funds, and dispute flow.
 *         Always deployed by EscrowFactory — never directly.
 *
 * Status flow:
 *   Created → Funded → Accepted → Completed
 *                             ↘ Disputed → Resolved → (Completed)
 */
contract Escrow is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ─── Errors ──────────────────────────────────────────────────────────────

    error NotClient();
    error NotFreelancer();
    error NotArbitration();
    error NotClientOrFreelancer();
    error InvalidState();
    error NoMilestones();
    error MismatchedArrays();
    error InvalidAmount();
    error InsufficientFunds();
    error MilestoneNotSubmitted();
    error MilestoneNotApproved();
    error MilestoneAlreadyPaid();
    error DisputeAlreadyRaised();
    error TransferFailed();

    // ─── Events ──────────────────────────────────────────────────────────────

    event MilestonesAdded(address indexed escrow, uint256 count, uint256 totalAmount);
    event EscrowFunded(address indexed escrow, address indexed client, uint256 totalAmount, address token);
    event JobAccepted(address indexed escrow, address indexed freelancer);
    event MilestoneSubmitted(address indexed escrow, address indexed freelancer, uint256 indexed index);
    event MilestoneApproved(address indexed escrow, address indexed client, uint256 indexed index);
    event PaymentReleased(address indexed escrow, address indexed freelancer, uint256 indexed index, uint256 amount);
    event DisputeRaised(address indexed escrow, address indexed raisedBy, uint256 disputeId);
    event DisputeResolved(address indexed escrow, address indexed winner, uint256 amountToFreelancer);

    // ─── Types ───────────────────────────────────────────────────────────────

    enum EscrowStatus {
        Created,   // 0
        Funded,    // 1
        Accepted,  // 2
        Disputed,  // 3
        Resolved,  // 4
        Completed  // 5
    }

    struct Milestone {
        uint256 amount;
        bytes32 metadataHash;
        bool submitted;
        bool approved;
        bool paid;
    }

    // ─── Storage ─────────────────────────────────────────────────────────────

    address public immutable client;
    address public immutable freelancer;
    address public immutable arbitrationContract;
    address public immutable token; // address(0) = native ETH

    bytes32 public jobMetadataHash;
    EscrowStatus public status;

    Milestone[] public milestones;
    uint256 public totalAmount;
    uint256 public releasedAmount;
    uint256 public disputeId; // 0 = no dispute

    // ─── Constructor ─────────────────────────────────────────────────────────

    constructor(
        address _client,
        address _freelancer,
        address _arbitrationContract,
        address _token,
        bytes32 _jobMetadataHash
    ) {
        client = _client;
        freelancer = _freelancer;
        arbitrationContract = _arbitrationContract;
        token = _token;
        jobMetadataHash = _jobMetadataHash;
        status = EscrowStatus.Created;
    }

    // ─── Modifiers ───────────────────────────────────────────────────────────

    modifier onlyClient() {
        if (msg.sender != client) revert NotClient();
        _;
    }

    modifier onlyFreelancer() {
        if (msg.sender != freelancer) revert NotFreelancer();
        _;
    }

    modifier onlyArbitration() {
        if (msg.sender != arbitrationContract) revert NotArbitration();
        _;
    }

    modifier inStatus(EscrowStatus required) {
        if (status != required) revert InvalidState();
        _;
    }

    // ─── Client Actions ──────────────────────────────────────────────────────

    /**
     * @notice Add milestone payment schedule. Callable multiple times while in
     *         Created state (allows the client to revise before funding).
     *         Each call REPLACES the previous milestone list.
     */
    function addMilestones(
        uint256[] calldata amounts,
        bytes32[] calldata metadataHashes
    ) external onlyClient inStatus(EscrowStatus.Created) {
        if (amounts.length == 0) revert NoMilestones();
        if (amounts.length != metadataHashes.length) revert MismatchedArrays();

        // Replace existing milestones so client can revise before funding.
        delete milestones;
        totalAmount = 0;

        for (uint256 i = 0; i < amounts.length; i++) {
            if (amounts[i] == 0) revert InvalidAmount();
            milestones.push(Milestone({
                amount: amounts[i],
                metadataHash: metadataHashes[i],
                submitted: false,
                approved: false,
                paid: false
            }));
            totalAmount += amounts[i];
        }

        emit MilestonesAdded(address(this), amounts.length, totalAmount);
    }

    /**
     * @notice Lock funds in the escrow. For ETH: msg.value must equal totalAmount.
     *         For ERC-20: caller must have approved this contract beforehand.
     */
    function fundEscrow() external payable onlyClient inStatus(EscrowStatus.Created) nonReentrant {
        if (milestones.length == 0) revert NoMilestones();

        if (token == address(0)) {
            if (msg.value != totalAmount) revert InsufficientFunds();
        } else {
            if (msg.value != 0) revert InsufficientFunds(); // reject accidental ETH
            IERC20(token).safeTransferFrom(msg.sender, address(this), totalAmount);
        }

        status = EscrowStatus.Funded;
        emit EscrowFunded(address(this), msg.sender, totalAmount, token);
    }

    /**
     * @notice Approve a submitted milestone. Must call releaseMilestonePayment
     *         separately to actually transfer funds.
     */
    function approveMilestone(uint256 index)
        external
        onlyClient
        inStatus(EscrowStatus.Accepted)
    {
        if (index >= milestones.length) revert InvalidState();
        Milestone storage m = milestones[index];
        if (!m.submitted) revert MilestoneNotSubmitted();
        if (m.approved) revert InvalidState();

        m.approved = true;
        emit MilestoneApproved(address(this), msg.sender, index);
    }

    /**
     * @notice Transfer approved milestone payment to the freelancer.
     *         Also callable after Resolved state (to pay out arbitration-determined amounts).
     */
    function releaseMilestonePayment(uint256 index)
        external
        onlyClient
        nonReentrant
    {
        if (status != EscrowStatus.Accepted && status != EscrowStatus.Resolved) revert InvalidState();
        if (index >= milestones.length) revert InvalidState();

        Milestone storage m = milestones[index];
        if (!m.approved) revert MilestoneNotApproved();
        if (m.paid) revert MilestoneAlreadyPaid();

        // CEI: update state before transfer
        m.paid = true;
        uint256 amount = m.amount;
        releasedAmount += amount;

        // Transition to Completed only from Accepted; Resolved stays until explicitly finished
        if (status == EscrowStatus.Accepted && releasedAmount == totalAmount) {
            status = EscrowStatus.Completed;
        }

        _transferFunds(freelancer, amount);

        emit PaymentReleased(address(this), freelancer, index, amount);
    }

    // ─── Freelancer Actions ──────────────────────────────────────────────────

    /// @notice Freelancer accepts the job. State: Funded → Accepted.
    function acceptJob() external onlyFreelancer inStatus(EscrowStatus.Funded) {
        status = EscrowStatus.Accepted;
        emit JobAccepted(address(this), msg.sender);
    }

    /// @notice Freelancer marks a milestone as submitted for client review.
    function submitMilestone(uint256 index)
        external
        onlyFreelancer
        inStatus(EscrowStatus.Accepted)
    {
        if (index >= milestones.length) revert InvalidState();
        Milestone storage m = milestones[index];
        if (m.submitted) revert InvalidState();
        if (m.paid) revert MilestoneAlreadyPaid();

        m.submitted = true;
        emit MilestoneSubmitted(address(this), msg.sender, index);
    }

    // ─── Dispute ─────────────────────────────────────────────────────────────

    /**
     * @notice Raise a dispute. Either party can call this.
     *         Internally calls Arbitration.createDispute() so only ONE transaction
     *         is needed (no pre-obtained disputeId required).
     *         State: Accepted → Disputed.
     */
    function raiseDispute()
        external
        nonReentrant
        inStatus(EscrowStatus.Accepted)
    {
        if (msg.sender != client && msg.sender != freelancer) revert NotClientOrFreelancer();
        if (disputeId != 0) revert DisputeAlreadyRaised();

        // CEI: set state before external call
        status = EscrowStatus.Disputed;

        uint256 newDisputeId = IArbitration(arbitrationContract).createDispute(address(this));
        disputeId = newDisputeId;

        emit DisputeRaised(address(this), msg.sender, newDisputeId);
    }

    /**
     * @notice Called exclusively by the Arbitration contract after juror voting.
     *         Lump-sum resolution model:
     *           - winner == freelancer → amountToFreelancer is sent to freelancer;
     *             remaining balance refunded to client.
     *           - winner == client    → full remaining balance refunded to client.
     *         State: Disputed → Resolved.
     */
    function resolveDispute(address winner, uint256 amountToFreelancer)
        external
        onlyArbitration
        nonReentrant
        inStatus(EscrowStatus.Disputed)
    {
        require(winner == client || winner == freelancer, "Invalid winner");

        status = EscrowStatus.Resolved;

        uint256 remaining = _contractBalance();

        if (winner == freelancer) {
            if (amountToFreelancer > remaining) amountToFreelancer = remaining;
            uint256 refund = remaining - amountToFreelancer;

            if (amountToFreelancer > 0) _transferFunds(freelancer, amountToFreelancer);
            if (refund > 0) _transferFunds(client, refund);
        } else {
            // Client wins: full remaining balance back to client
            if (remaining > 0) _transferFunds(client, remaining);
        }

        emit DisputeResolved(address(this), winner, amountToFreelancer);
    }

    // ─── View Functions ──────────────────────────────────────────────────────

    function getStatus() external view returns (EscrowStatus) {
        return status;
    }

    function getMilestone(uint256 index) external view returns (Milestone memory) {
        return milestones[index];
    }

    function getMilestoneCount() external view returns (uint256) {
        return milestones.length;
    }

    function getBalance() external view returns (uint256) {
        return _contractBalance();
    }

    function getDisputeId() external view returns (uint256) {
        return disputeId;
    }

    // ─── Internal Helpers ────────────────────────────────────────────────────

    function _contractBalance() internal view returns (uint256) {
        if (token == address(0)) {
            return address(this).balance;
        } else {
            return IERC20(token).balanceOf(address(this));
        }
    }

    function _transferFunds(address to, uint256 amount) internal {
        if (token == address(0)) {
            (bool success, ) = to.call{value: amount}("");
            if (!success) revert TransferFailed();
        } else {
            IERC20(token).safeTransfer(to, amount);
        }
    }

    receive() external payable {}
}
