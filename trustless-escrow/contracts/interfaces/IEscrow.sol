// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IEscrow {
    function resolveDispute(address winner, uint256 amountToFreelancer) external;
}
