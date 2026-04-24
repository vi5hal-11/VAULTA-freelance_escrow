// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IEscrowFactory {
    function isValidEscrow(address escrow) external view returns (bool);
}
