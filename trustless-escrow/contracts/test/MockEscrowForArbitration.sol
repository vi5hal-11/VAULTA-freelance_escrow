// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IArbitration.sol";

/**
 * @notice Test stub for an Escrow contract, used by Arbitration tests.
 *         - triggerCreateDispute() acts as if the real Escrow called it from raiseDispute().
 *         - resolveDispute() records the resolution for test assertions.
 */
contract MockEscrowForArbitration {
    address public client;
    address public freelancer;
    address public arbitrationContract;

    address public resolvedWinner;
    uint256 public resolvedAmount;
    bool public disputeResolved;

    constructor(address _client, address _freelancer, address _arbitration) {
        client = _client;
        freelancer = _freelancer;
        arbitrationContract = _arbitration;
    }

    /// @notice Simulates Escrow.raiseDispute() calling Arbitration.createDispute().
    function triggerCreateDispute(address arbitration) external returns (uint256) {
        return IArbitration(arbitration).createDispute(address(this));
    }

    /// @notice Called by Arbitration._resolve() via IEscrow.resolveDispute().
    function resolveDispute(address winner, uint256 amountToFreelancer) external {
        require(msg.sender == arbitrationContract, "Not arbitration");
        resolvedWinner = winner;
        resolvedAmount = amountToFreelancer;
        disputeResolved = true;
    }

    receive() external payable {}
}
