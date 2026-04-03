const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EscrowFactory", function () {
  let factory;
  let client;
  let freelancer;
  let arbitration;

  beforeEach(async function () {
    [client, freelancer, arbitration] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory("EscrowFactory");

    factory = await Factory.deploy();

    await factory.waitForDeployment();
  });

  it("should create escrow contracts", async function () {
    await factory.createEscrow(
      freelancer.address,
      arbitration.address,
      3 * 24 * 60 * 60,
    );

    const count = await factory.getEscrowCount();

    expect(count).to.equal(1n);
  });

  it("should store escrow address", async function () {
    await factory.createEscrow(
      freelancer.address,
      arbitration.address,
      3 * 24 * 60 * 60,
    );

    const escrowAddress = await factory.getEscrow(0);

    expect(escrowAddress).to.not.equal(ethers.ZeroAddress);
  });
});
