

# Trustless Freelance Escrow Protocol

![Solidity](https://img.shields.io/badge/Solidity-0.8.x-blue)
![Hardhat](https://img.shields.io/badge/Framework-Hardhat-yellow)
![License](https://img.shields.io/badge/License-MIT-green)
![Status](https://img.shields.io/badge/Project-Active-success)

A decentralized escrow system enabling trustless freelance payments with milestone-based releases and decentralized dispute resolution.

## Protocol Architecture
Client
   │
   ▼
EscrowFactory
   │
   ▼
Escrow Contract
   │
   ▼
Arbitration Contract
   │
   ▼
Juror Pool



Freelancers and clients require trust to exchange work and payments.
Traditional platforms act as intermediaries and charge high fees.
This protocol removes the intermediary by using smart contracts.
Smart contract escrow locks funds until milestones are approved.
Disputes are resolved through decentralized juror voting.
Client → Escrow Contract → Arbitration Contract → Juror Pool

**#features**
✔ Milestone-based payments
✔ Dispute resolution
✔ Juror staking
✔ Factory contract deployment
✔ Automated Hardhat test suite

**#tech-stack**
Solidity
Hardhat
Ethers.js
Mocha / Chai
OpenZeppelin Contracts

## Security Considerations

The protocol implements several smart contract security practices:

- Reentrancy protection using OpenZeppelin ReentrancyGuard
- Access control modifiers
- State machine validation
- Custom Solidity errors for gas optimization
- Event logging for transparency

## Outcomes

This project demonstrates understanding of:

- Smart contract architecture
- Escrow systems
- Decentralized arbitration
- State machine design
- Hardhat testing
- Solidity security patterns

## Workflow Example

1. Client creates escrow contract
2. Client funds escrow
3. Freelancer accepts job
4. Freelancer submits milestone
5. Client approves milestone
6. Escrow releases payment

If a dispute occurs:

1. Dispute raised
2. Arbitration contract selects jurors
3. Jurors vote
4. Dispute resolved

**project Structure**

trustless-freelance-escrow
│
├ contracts
│   Escrow.sol
│   Arbitration.sol
│   EscrowFactory.sol
│
├ test
│   escrow.test.js
│   arbitration.test.js
│   factory.test.js
│
├ scripts
│   deploy.js
│
├ docs
│   architecture.md
│   workflow.md
│   security.md
│
├ hardhat.config.js
├ package.json
└ README.md
