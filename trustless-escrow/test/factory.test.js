const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EscrowFactory", function () {
  let factory;
  let arbitration;
  let client, freelancer, other;

  const TOKEN_ADDR = ethers.ZeroAddress; // native ETH
  const JOB_HASH = ethers.encodeBytes32String("ipfs://job");

  beforeEach(async function () {
    [client, freelancer, other] = await ethers.getSigners();

    // Use a mock arbitration address (just a signer address for factory tests)
    arbitration = other;

    const Factory = await ethers.getContractFactory("EscrowFactory");
    factory = await Factory.deploy(arbitration.address);
    await factory.waitForDeployment();
  });

  // ── createEscrow ──────────────────────────────────────────────────────────

  it("creates an escrow and increments count", async function () {
    await factory.connect(client).createEscrow(freelancer.address, TOKEN_ADDR, JOB_HASH);
    expect(await factory.getEscrowCount()).to.equal(1n);
  });

  it("registers escrow in isValidEscrow mapping", async function () {
    const tx = await factory
      .connect(client)
      .createEscrow(freelancer.address, TOKEN_ADDR, JOB_HASH);
    const receipt = await tx.wait();
    const event = receipt.logs.find(
      (l) => l.fragment && l.fragment.name === "EscrowCreated"
    );
    const escrowAddr = event.args[0];
    expect(await factory.isValidEscrow(escrowAddr)).to.equal(true);
  });

  it("stores escrow in clientEscrows and freelancerEscrows", async function () {
    await factory.connect(client).createEscrow(freelancer.address, TOKEN_ADDR, JOB_HASH);

    const clientList = await factory.getClientEscrows(client.address);
    const freelancerList = await factory.getFreelancerEscrows(freelancer.address);

    expect(clientList.length).to.equal(1);
    expect(freelancerList.length).to.equal(1);
    expect(clientList[0]).to.equal(freelancerList[0]);
  });

  it("returns both lists via getUserEscrows", async function () {
    await factory.connect(client).createEscrow(freelancer.address, TOKEN_ADDR, JOB_HASH);
    const [asClient, asFreelancer] = await factory.getUserEscrows(client.address);
    expect(asClient.length).to.equal(1);
    expect(asFreelancer.length).to.equal(0);
  });

  it("reverts when freelancer == client", async function () {
    await expect(
      factory.connect(client).createEscrow(client.address, TOKEN_ADDR, JOB_HASH)
    ).to.be.revertedWith("Client and freelancer must differ");
  });

  it("reverts when freelancer is zero address", async function () {
    await expect(
      factory.connect(client).createEscrow(ethers.ZeroAddress, TOKEN_ADDR, JOB_HASH)
    ).to.be.revertedWith("Invalid freelancer address");
  });

  it("isValidEscrow returns false for random address", async function () {
    expect(await factory.isValidEscrow(other.address)).to.equal(false);
  });

  it("deploys multiple escrows and tracks them correctly", async function () {
    const HASH2 = ethers.encodeBytes32String("ipfs://job2");
    await factory.connect(client).createEscrow(freelancer.address, TOKEN_ADDR, JOB_HASH);
    await factory.connect(client).createEscrow(freelancer.address, TOKEN_ADDR, HASH2);

    expect(await factory.getEscrowCount()).to.equal(2n);
    const clientList = await factory.getClientEscrows(client.address);
    expect(clientList.length).to.equal(2);
  });

  it("injects the factory's arbitration address into each escrow", async function () {
    const tx = await factory
      .connect(client)
      .createEscrow(freelancer.address, TOKEN_ADDR, JOB_HASH);
    const receipt = await tx.wait();
    const event = receipt.logs.find(
      (l) => l.fragment && l.fragment.name === "EscrowCreated"
    );
    const escrowAddr = event.args[0];

    const Escrow = await ethers.getContractFactory("Escrow");
    const escrow = Escrow.attach(escrowAddr);
    expect(await escrow.arbitrationContract()).to.equal(arbitration.address);
  });
});
