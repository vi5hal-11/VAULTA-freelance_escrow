const { expect } = require("chai");
const { ethers } = require("hardhat");

/**
 * Escrow contract tests.
 *
 * Setup: we deploy a mock Arbitration stub so Escrow.raiseDispute() can call
 * createDispute() without needing the full Arbitration + Factory stack.
 */
describe("Escrow", function () {
  let escrow;
  let client, freelancer, juror1, other;
  let mockArbitration;

  const ONE_ETH = ethers.parseEther("1");
  const HALF_ETH = ethers.parseEther("0.5");
  const JOB_HASH = ethers.encodeBytes32String("ipfs://job-spec");
  const M0_HASH = ethers.encodeBytes32String("milestone-0");
  const M1_HASH = ethers.encodeBytes32String("milestone-1");

  beforeEach(async function () {
    [client, freelancer, juror1, other] = await ethers.getSigners();

    // Deploy a minimal Arbitration stub that just returns disputeId=1
    const MockArbitration = await ethers.getContractFactory("MockArbitration");
    mockArbitration = await MockArbitration.deploy();
    await mockArbitration.waitForDeployment();

    const Escrow = await ethers.getContractFactory("Escrow");
    escrow = await Escrow.deploy(
      client.address,
      freelancer.address,
      mockArbitration.target,
      ethers.ZeroAddress, // native ETH
      JOB_HASH
    );
    await escrow.waitForDeployment();
  });

  // ── Initial state ─────────────────────────────────────────────────────────

  it("stores parties and initial state correctly", async function () {
    expect(await escrow.client()).to.equal(client.address);
    expect(await escrow.freelancer()).to.equal(freelancer.address);
    expect(await escrow.arbitrationContract()).to.equal(mockArbitration.target);
    expect(await escrow.status()).to.equal(0n); // Created
  });

  // ── addMilestones ─────────────────────────────────────────────────────────

  it("allows client to add milestones", async function () {
    await escrow.connect(client).addMilestones([ONE_ETH], [M0_HASH]);
    expect(await escrow.getMilestoneCount()).to.equal(1n);
    expect(await escrow.totalAmount()).to.equal(ONE_ETH);
  });

  it("replaces milestones on repeated addMilestones calls", async function () {
    await escrow.connect(client).addMilestones([ONE_ETH], [M0_HASH]);
    await escrow.connect(client).addMilestones([HALF_ETH, HALF_ETH], [M0_HASH, M1_HASH]);
    expect(await escrow.getMilestoneCount()).to.equal(2n);
    expect(await escrow.totalAmount()).to.equal(ONE_ETH);
  });

  it("reverts addMilestones from non-client", async function () {
    await expect(
      escrow.connect(freelancer).addMilestones([ONE_ETH], [M0_HASH])
    ).to.be.revertedWithCustomError(escrow, "NotClient");
  });

  it("reverts addMilestones with mismatched arrays", async function () {
    await expect(
      escrow.connect(client).addMilestones([ONE_ETH], [M0_HASH, M1_HASH])
    ).to.be.revertedWithCustomError(escrow, "MismatchedArrays");
  });

  it("reverts addMilestones with zero-amount milestone", async function () {
    await expect(
      escrow.connect(client).addMilestones([0n], [M0_HASH])
    ).to.be.revertedWithCustomError(escrow, "InvalidAmount");
  });

  // ── fundEscrow ────────────────────────────────────────────────────────────

  it("allows client to fund escrow", async function () {
    await escrow.connect(client).addMilestones([ONE_ETH], [M0_HASH]);
    await escrow.connect(client).fundEscrow({ value: ONE_ETH });
    expect(await escrow.status()).to.equal(1n); // Funded
  });

  it("reverts fundEscrow with wrong ETH amount", async function () {
    await escrow.connect(client).addMilestones([ONE_ETH], [M0_HASH]);
    await expect(
      escrow.connect(client).fundEscrow({ value: HALF_ETH })
    ).to.be.revertedWithCustomError(escrow, "InsufficientFunds");
  });

  it("reverts fundEscrow with no milestones set", async function () {
    await expect(
      escrow.connect(client).fundEscrow({ value: ONE_ETH })
    ).to.be.revertedWithCustomError(escrow, "NoMilestones");
  });

  it("reverts fundEscrow from non-client", async function () {
    await escrow.connect(client).addMilestones([ONE_ETH], [M0_HASH]);
    await expect(
      escrow.connect(freelancer).fundEscrow({ value: ONE_ETH })
    ).to.be.revertedWithCustomError(escrow, "NotClient");
  });

  // ── acceptJob ─────────────────────────────────────────────────────────────

  it("allows freelancer to accept job", async function () {
    await escrow.connect(client).addMilestones([ONE_ETH], [M0_HASH]);
    await escrow.connect(client).fundEscrow({ value: ONE_ETH });
    await escrow.connect(freelancer).acceptJob();
    expect(await escrow.status()).to.equal(2n); // Accepted
  });

  it("reverts acceptJob from non-freelancer", async function () {
    await escrow.connect(client).addMilestones([ONE_ETH], [M0_HASH]);
    await escrow.connect(client).fundEscrow({ value: ONE_ETH });
    await expect(escrow.connect(client).acceptJob()).to.be.revertedWithCustomError(
      escrow,
      "NotFreelancer"
    );
  });

  it("reverts acceptJob when not in Funded state", async function () {
    await expect(escrow.connect(freelancer).acceptJob()).to.be.revertedWithCustomError(
      escrow,
      "InvalidState"
    );
  });

  // ── submitMilestone ───────────────────────────────────────────────────────

  async function reachAccepted(amount = ONE_ETH) {
    await escrow.connect(client).addMilestones([amount], [M0_HASH]);
    await escrow.connect(client).fundEscrow({ value: amount });
    await escrow.connect(freelancer).acceptJob();
  }

  it("allows freelancer to submit milestone", async function () {
    await reachAccepted();
    await escrow.connect(freelancer).submitMilestone(0);
    const m = await escrow.getMilestone(0);
    expect(m.submitted).to.equal(true);
  });

  it("reverts double-submit", async function () {
    await reachAccepted();
    await escrow.connect(freelancer).submitMilestone(0);
    await expect(
      escrow.connect(freelancer).submitMilestone(0)
    ).to.be.revertedWithCustomError(escrow, "InvalidState");
  });

  it("reverts submitMilestone from non-freelancer", async function () {
    await reachAccepted();
    await expect(
      escrow.connect(client).submitMilestone(0)
    ).to.be.revertedWithCustomError(escrow, "NotFreelancer");
  });

  // ── approveMilestone ──────────────────────────────────────────────────────

  it("allows client to approve submitted milestone", async function () {
    await reachAccepted();
    await escrow.connect(freelancer).submitMilestone(0);
    await escrow.connect(client).approveMilestone(0);
    const m = await escrow.getMilestone(0);
    expect(m.approved).to.equal(true);
  });

  it("reverts approve on unsubmitted milestone", async function () {
    await reachAccepted();
    await expect(
      escrow.connect(client).approveMilestone(0)
    ).to.be.revertedWithCustomError(escrow, "MilestoneNotSubmitted");
  });

  it("reverts approve from non-client", async function () {
    await reachAccepted();
    await escrow.connect(freelancer).submitMilestone(0);
    await expect(
      escrow.connect(other).approveMilestone(0)
    ).to.be.revertedWithCustomError(escrow, "NotClient");
  });

  // ── releaseMilestonePayment ───────────────────────────────────────────────

  it("releases payment and transitions to Completed on last milestone", async function () {
    await reachAccepted();
    await escrow.connect(freelancer).submitMilestone(0);
    await escrow.connect(client).approveMilestone(0);

    const before = await ethers.provider.getBalance(freelancer.address);
    await escrow.connect(client).releaseMilestonePayment(0);
    const after = await ethers.provider.getBalance(freelancer.address);

    expect(after - before).to.equal(ONE_ETH);
    expect(await escrow.status()).to.equal(5n); // Completed
  });

  it("reverts release on unapproved milestone", async function () {
    await reachAccepted();
    await escrow.connect(freelancer).submitMilestone(0);
    await expect(
      escrow.connect(client).releaseMilestonePayment(0)
    ).to.be.revertedWithCustomError(escrow, "MilestoneNotApproved");
  });

  it("reverts double release", async function () {
    await reachAccepted();
    await escrow.connect(freelancer).submitMilestone(0);
    await escrow.connect(client).approveMilestone(0);
    await escrow.connect(client).releaseMilestonePayment(0);
    // After all milestones are paid the status becomes Completed (5).
    // The status guard fires before the paid guard, so we get InvalidState.
    await expect(
      escrow.connect(client).releaseMilestonePayment(0)
    ).to.be.revertedWithCustomError(escrow, "InvalidState");
  });

  // ── raiseDispute ──────────────────────────────────────────────────────────

  it("raises dispute and transitions to Disputed state", async function () {
    await reachAccepted();
    await escrow.connect(client).raiseDispute();
    expect(await escrow.status()).to.equal(3n); // Disputed
    expect(await escrow.disputeId()).to.equal(1n); // MockArbitration returns 1
  });

  it("allows freelancer to raise dispute", async function () {
    await reachAccepted();
    await escrow.connect(freelancer).raiseDispute();
    expect(await escrow.status()).to.equal(3n);
  });

  it("reverts raiseDispute from third party", async function () {
    await reachAccepted();
    await expect(
      escrow.connect(other).raiseDispute()
    ).to.be.revertedWithCustomError(escrow, "NotClientOrFreelancer");
  });

  it("reverts raiseDispute when not Accepted", async function () {
    await escrow.connect(client).addMilestones([ONE_ETH], [M0_HASH]);
    await escrow.connect(client).fundEscrow({ value: ONE_ETH });
    // Still Funded, not Accepted
    await expect(
      escrow.connect(client).raiseDispute()
    ).to.be.revertedWithCustomError(escrow, "InvalidState");
  });

  // ── resolveDispute ────────────────────────────────────────────────────────

  it("reverts resolveDispute from non-arbitration caller", async function () {
    await reachAccepted();
    await escrow.connect(client).raiseDispute();
    await expect(
      escrow.connect(client).resolveDispute(client.address, 0n)
    ).to.be.revertedWithCustomError(escrow, "NotArbitration");
  });

  it("resolves dispute in favour of client (refund)", async function () {
    await reachAccepted();
    await escrow.connect(client).raiseDispute();

    const before = await ethers.provider.getBalance(client.address);
    const tx = await mockArbitration.callResolve(escrow.target, client.address, 0n);
    const receipt = await tx.wait();
    const after = await ethers.provider.getBalance(client.address);

    // client receives the refunded ETH but pays gas for callResolve tx
    const gasSpent = receipt.gasUsed * tx.gasPrice;
    expect(after - before + gasSpent).to.equal(ONE_ETH);
    expect(await escrow.status()).to.equal(4n); // Resolved
  });

  it("resolves dispute in favour of freelancer", async function () {
    await reachAccepted();
    await escrow.connect(client).raiseDispute();

    const before = await ethers.provider.getBalance(freelancer.address);
    await mockArbitration.callResolve(escrow.target, freelancer.address, ONE_ETH);
    const after = await ethers.provider.getBalance(freelancer.address);

    expect(after - before).to.equal(ONE_ETH);
    expect(await escrow.status()).to.equal(4n); // Resolved
  });

  // ── multi-milestone happy path ────────────────────────────────────────────

  it("completes a 2-milestone job end-to-end", async function () {
    await escrow
      .connect(client)
      .addMilestones([HALF_ETH, HALF_ETH], [M0_HASH, M1_HASH]);
    await escrow.connect(client).fundEscrow({ value: ONE_ETH });
    await escrow.connect(freelancer).acceptJob();

    // Milestone 0
    await escrow.connect(freelancer).submitMilestone(0);
    await escrow.connect(client).approveMilestone(0);
    await escrow.connect(client).releaseMilestonePayment(0);
    expect(await escrow.status()).to.equal(2n); // still Accepted

    // Milestone 1
    await escrow.connect(freelancer).submitMilestone(1);
    await escrow.connect(client).approveMilestone(1);
    await escrow.connect(client).releaseMilestonePayment(1);
    expect(await escrow.status()).to.equal(5n); // Completed
  });
});
