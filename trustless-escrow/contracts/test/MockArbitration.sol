// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IEscrow.sol";

/**
 * @notice Test stub for Arbitration.
 *         Returns a fixed disputeId=1 from createDispute().
 *         Exposes callResolve() so tests can simulate the callback.
 */
contract MockArbitration {
    uint256 public nextDisputeId = 1;

    function createDispute(address /*escrowAddress*/) external returns (uint256) {
        return nextDisputeId++;
    }

    /// @notice Called by tests to simulate dispute resolution.
    function callResolve(
        address escrow,
        address winner,
        uint256 amountToFreelancer
    ) external {
        IEscrow(escrow).resolveDispute(winner, amountToFreelancer);
    }
}
