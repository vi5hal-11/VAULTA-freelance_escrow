// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IArbitration {
    function createDispute(address escrowAddress) external returns (uint256 disputeId);
}
