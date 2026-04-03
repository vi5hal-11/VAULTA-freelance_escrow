// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Escrow.sol";

contract EscrowFactory {

    address[] public escrows;
    mapping(address => address[]) public userEscrows;

    event EscrowCreated(address escrow, address client, address freelancer, address token);

    function createEscrow(
        address freelancer,
        address arbitration,
        address token,
        string memory jobMetadataHash
    ) external {

        Escrow e = new Escrow(
            msg.sender, // client
            freelancer,
            arbitration,
            token,
            jobMetadataHash
        );

        address escrowAddr = address(e);
        escrows.push(escrowAddr);
        userEscrows[msg.sender].push(escrowAddr);
        userEscrows[freelancer].push(escrowAddr);

        emit EscrowCreated(escrowAddr, msg.sender, freelancer, token);
    }

    function getEscrowCount() external view returns (uint256) {
        return escrows.length;
    }

    function getUserEscrows(address user) external view returns (address[] memory) {
        return userEscrows[user];
    }
}