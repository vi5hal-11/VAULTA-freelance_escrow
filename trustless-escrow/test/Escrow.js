const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Escrow Contract", function () {
  let escrow;
  let client;
  let freelancer;
  let arbitration;

  const REVIEW_PERIOD = 3 * 24 * 60 * 60;

  beforeEach(async function () {
    [client, freelancer, arbitration] = await ethers.getSigners();

    const Escrow = await ethers.getContractFactory("Escrow");

    escrow = await Escrow.deploy(
      freelancer.address,
      arbitration.address,
      REVIEW_PERIOD,
    );

    await escrow.waitForDeployment();
  });

  it("should set roles correctly", async function () {
    expect(await escrow.client()).to.equal(client.address);
    expect(await escrow.freelancer()).to.equal(freelancer.address);
  });

  it("should add milestones", async function () {
    await escrow
      .connect(client)
      .addMilestones([ethers.parseEther("1")], ["Initial Work"]);

    const milestone = await escrow.milestones(0);

    expect(milestone.amount).to.equal(ethers.parseEther("1"));
  });

  it("should allow client to fund escrow", async function () {
    await escrow
      .connect(client)
      .addMilestones([ethers.parseEther("1")], ["Work"]);

    await escrow.connect(client).fundEscrow({
      value: ethers.parseEther("1"),
    });

    expect(await escrow.state()).to.equal(1n);
  });

  it("should complete milestone workflow", async function () {
    await escrow
      .connect(client)
      .addMilestones([ethers.parseEther("1")], ["Work"]);

    await escrow.connect(client).fundEscrow({
      value: ethers.parseEther("1"),
    });

    await escrow.connect(freelancer).acceptJob();

    await escrow.connect(freelancer).submitMilestone(0);

    await escrow.connect(client).approveMilestone(0);

    await escrow.connect(client).releaseMilestonePayment(0);

    expect(await escrow.currentMilestone()).to.equal(1n);
  });

  it("should prevent attacker approval", async function () {
    const [_, __, attacker] = await ethers.getSigners();

    await escrow
      .connect(client)
      .addMilestones([ethers.parseEther("1")], ["Work"]);

    await escrow.connect(client).fundEscrow({
      value: ethers.parseEther("1"),
    });

    await escrow.connect(freelancer).acceptJob();

    await escrow.connect(freelancer).submitMilestone(0);

    await expect(escrow.connect(attacker).approveMilestone(0)).to.be.reverted;
  });

  it("should raise dispute", async function () {
    await escrow
      .connect(client)
      .addMilestones([ethers.parseEther("1")], ["Work"]);

    await escrow.connect(client).fundEscrow({
      value: ethers.parseEther("1"),
    });

    await escrow.connect(freelancer).acceptJob();

    await escrow.connect(freelancer).submitMilestone(0);

    await escrow.connect(client).raiseDispute(1);

    expect(await escrow.state()).to.equal(3n);
  });
});
