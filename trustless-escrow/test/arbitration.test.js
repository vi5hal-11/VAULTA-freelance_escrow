const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Arbitration Contract", function () {
  let arbitration;
  let owner;
  let juror1;
  let juror2;
  let juror3;

  beforeEach(async function () {
    [owner, juror1, juror2, juror3] = await ethers.getSigners();

    const Arbitration = await ethers.getContractFactory("Arbitration");

    arbitration = await Arbitration.deploy();

    await arbitration.waitForDeployment();
  });

  it("should allow jurors to stake", async function () {
    await arbitration.connect(juror1).stake({
      value: ethers.parseEther("1"),
    });

    const juror = await arbitration.jurors(juror1.address);

    expect(juror.stake).to.equal(ethers.parseEther("1"));
  });

  it("should create dispute", async function () {
    await arbitration.connect(juror1).stake({
      value: ethers.parseEther("1"),
    });

    await arbitration.connect(juror2).stake({
      value: ethers.parseEther("1"),
    });

    await arbitration.connect(juror3).stake({
      value: ethers.parseEther("1"),
    });

    await arbitration.createDispute(1, { gasLimit: 3000000 });

    expect(await arbitration.disputeCount()).to.equal(1n);
  });

  it("should allow jurors to vote", async function () {
    await arbitration.connect(juror1).stake({
      value: ethers.parseEther("1"),
    });

    await arbitration.connect(juror2).stake({
      value: ethers.parseEther("1"),
    });

    await arbitration.connect(juror3).stake({
      value: ethers.parseEther("1"),
    });

    await arbitration.createDispute(1, { gasLimit: 3000000 });

    await arbitration.connect(juror1).vote(1, 1, { gasLimit: 3000000 });

    const voted = await arbitration.hasVoted(1, juror1.address);

    expect(voted).to.equal(true);
  });
});
