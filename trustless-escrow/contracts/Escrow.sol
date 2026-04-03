// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract Escrow is ReentrancyGuard {
    using SafeERC20 for IERC20;

    /*//////////////////////////////////////////////////////////////
                            ERRORS
    //////////////////////////////////////////////////////////////*/

    error NotClient();
    error NotFreelancer();
    error NotArbitrator();
    error InvalidState();
    error MilestoneNotSubmitted();
    error MilestoneNotApproved();
    error InsufficientBalance();
    error TransferFailed();

    /*//////////////////////////////////////////////////////////////
                            EVENTS
    //////////////////////////////////////////////////////////////*/

    event EscrowFunded(address client, uint256 amount, address token);
    event JobAccepted(address freelancer);
    event MilestoneSubmitted(uint256 milestoneId);
    event MilestoneApproved(uint256 milestoneId);
    event PaymentReleased(address freelancer, uint256 amount);
    event DisputeRaised(uint256 disputeId);
    event DisputeResolved(uint256 winner); // 0: Client, 1: Freelancer

    /*//////////////////////////////////////////////////////////////
                            STRUCTS
    //////////////////////////////////////////////////////////////*/

    enum JobState {
        Created,
        Funded,
        Accepted,
        Disputed,
        Resolved,
        Completed
    }

    struct Milestone {
        uint256 amount;
        bool submitted;
        bool approved;
        bool paid;
        string metadataHash; // IPFS hash for milestone details
    }

    /*//////////////////////////////////////////////////////////////
                            STORAGE
    //////////////////////////////////////////////////////////////*/

    address public client;
    address public freelancer;
    address public arbitration;
    address public token; // address(0) for Native ETH

    JobState public state;
    string public jobMetadataHash; // IPFS hash for the entire job

    Milestone[] public milestones;
    uint256 public currentMilestone;
    uint256 public totalAmount;

    /*//////////////////////////////////////////////////////////////
                            CONSTRUCTOR
    //////////////////////////////////////////////////////////////*/

    constructor(
        address _client,
        address _freelancer,
        address _arbitration,
        address _token,
        string memory _jobMetadataHash
    ) {
        client = _client;
        freelancer = _freelancer;
        arbitration = _arbitration;
        token = _token;
        jobMetadataHash = _jobMetadataHash;
        state = JobState.Created;
    }

    /*//////////////////////////////////////////////////////////////
                            MODIFIERS
    //////////////////////////////////////////////////////////////*/

    modifier onlyClient() {
        if (msg.sender != client) revert NotClient();
        _;
    }

    modifier onlyFreelancer() {
        if (msg.sender != freelancer) revert NotFreelancer();
        _;
    }

    modifier onlyArbitrator() {
        if (msg.sender != arbitration) revert NotArbitrator();
        _;
    }

    /*//////////////////////////////////////////////////////////////
                        CORE FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    function addMilestones(
        uint256[] memory amounts,
        string[] memory metadataHashes
    ) external onlyClient {
        if (state != JobState.Created) revert InvalidState();
        require(amounts.length == metadataHashes.length, "Mismatched arrays");

        for (uint256 i = 0; i < amounts.length; i++) {
            milestones.push(
                Milestone({
                    amount: amounts[i],
                    submitted: false,
                    approved: false,
                    paid: false,
                    metadataHash: metadataHashes[i]
                })
            );
            totalAmount += amounts[i];
        }
    }

    function fundEscrow() external payable onlyClient {
        if (state != JobState.Created) revert InvalidState();
        
        if (token == address(0)) {
            if (msg.value < totalAmount) revert InsufficientBalance();
        } else {
            IERC20(token).safeTransferFrom(msg.sender, address(this), totalAmount);
        }

        state = JobState.Funded;
        emit EscrowFunded(msg.sender, totalAmount, token);
    }

    function acceptJob() external onlyFreelancer {
        if (state != JobState.Funded) revert InvalidState();
        state = JobState.Accepted;
        emit JobAccepted(msg.sender);
    }

    function submitMilestone(uint256 index) external onlyFreelancer {
        if (state != JobState.Accepted) revert InvalidState();
        Milestone storage m = milestones[index];
        m.submitted = true;
        emit MilestoneSubmitted(index);
    }

    function approveMilestone(uint256 index) external onlyClient {
        Milestone storage m = milestones[index];
        if (!m.submitted) revert MilestoneNotSubmitted();
        m.approved = true;
        emit MilestoneApproved(index);
    }

    function releaseMilestonePayment(uint256 index) external onlyClient nonReentrant {
        Milestone storage m = milestones[index];
        if (!m.approved) revert MilestoneNotApproved();
        if (m.paid) revert InvalidState();

        m.paid = true;
        _transferFunds(freelancer, m.amount);

        emit PaymentReleased(freelancer, m.amount);
        currentMilestone++;

        if (currentMilestone == milestones.length) {
            state = JobState.Completed;
        }
    }

    function raiseDispute(uint256 disputeId) external {
        if (msg.sender != client && msg.sender != freelancer) revert InvalidState();
        if (state != JobState.Accepted) revert InvalidState();

        state = JobState.Disputed;
        emit DisputeRaised(disputeId);
    }

    function resolveDispute(uint8 winner, uint256 amountToFreelancer) external onlyArbitrator nonReentrant {
        if (state != JobState.Disputed) revert InvalidState();

        state = JobState.Resolved;

        if (winner == 0) { // Client Wins
            _transferFunds(client, address(this).balance > 0 ? address(this).balance : IERC20(token).balanceOf(address(this)));
        } else if (winner == 1) { // Freelancer Wins
            _transferFunds(freelancer, address(this).balance > 0 ? address(this).balance : IERC20(token).balanceOf(address(this)));
        } else { // Split decision
            _transferFunds(freelancer, amountToFreelancer);
            _transferFunds(client, (token == address(0) ? address(this).balance : IERC20(token).balanceOf(address(this))));
        }

        emit DisputeResolved(winner);
    }

    function _transferFunds(address to, uint256 amount) internal {
        if (token == address(0)) {
            (bool success, ) = to.call{value: amount}("");
            if (!success) revert TransferFailed();
        } else {
            IERC20(token).safeTransfer(to, amount);
        }
    }

    // Function to get the number of milestones
    function getMilestoneCount() external view returns (uint256) {
        return milestones.length;
    }

    receive() external payable {}
}