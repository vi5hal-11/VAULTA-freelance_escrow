const { expect } = require("chai");
const { ethers } = require("hardhat");

/**
 * Arbitration contract tests.
 *
 * Because createDispute() requires msg.sender to pass isValidEscrow(), we use
 * a MockEscrowFactory and MockEscrow to simulate the full interaction without
 * needing Arbitration to be wired to a real EscrowFactory.
 */
describe("Arbitration", function () {
  let arbitration;
  let mockFactory;
  let mockEscrow;
  let owner, juror1, juror2, juror3, juror4, other;

  const MIN_STAKE = ethers.parseEther("0.1");

  beforeEach(async function () {
    [owner, juror1, juror2, juror3, juror4, other] = await ethers.getSigners();

    // Deploy a mock factory that reports all addresses as valid escrows
    const MockEscrowFactory = await ethers.getContractFactory("MockEscrowFactory");
    mockFactory = await MockEscrowFactory.deploy();
    await mockFactory.waitForDeployment();

    const Arbitration = await ethers.getContractFactory("Arbitration");
    arbitration = await Arbitration.deploy(MIN_STAKE, mockFactory.target);
    await arbitration.waitForDeployment();

    // Deploy a mock escrow that accepts resolveDispute calls
    const MockEscrowForArbitration = await ethers.getContractFactory(
      "MockEscrowForArbitration"
    );
    mockEscrow = await MockEscrowForArbitration.deploy(
      owner.address,   // client
      juror4.address,  // freelancer (re-used as freelancer for simplicity)
      arbitration.target
    );
    await mockEscrow.waitForDeployment();

    // Register the mock escrow in the mock factory
    await mockFactory.register(mockEscrow.target);
  });

  // ── stake ─────────────────────────────────────────────────────────────────

  it("allows a juror to stake", async function () {
    await arbitration.connect(juror1).stake({ value: MIN_STAKE });
    const info = await arbitration.getJurorInfo(juror1.address);
    expect(info.stakedAmount).to.equal(MIN_STAKE);
    expect(info.active).to.equal(true);
  });

  it("reverts stake below minimum", async function () {
    await expect(
      arbitration.connect(juror1).stake({ value: ethers.parseEther("0.01") })
    ).to.be.revertedWithCustomError(arbitration, "InsufficientStake");
  });

  it("accumulates stake on top-up", async function () {
    await arbitration.connect(juror1).stake({ value: MIN_STAKE });
    await arbitration.connect(juror1).stake({ value: MIN_STAKE });
    const info = await arbitration.getJurorInfo(juror1.address);
    expect(info.stakedAmount).to.equal(MIN_STAKE * 2n);
  });

  // ── withdrawStake ─────────────────────────────────────────────────────────

  it("allows inactive juror to withdraw stake", async function () {
    await arbitration.connect(juror1).stake({ value: MIN_STAKE });
    const before = await ethers.provider.getBalance(juror1.address);
    const tx = await arbitration.connect(juror1).withdrawStake();
    const receipt = await tx.wait();
    const gasUsed = receipt.gasUsed * tx.gasPrice;
    const after = await ethers.provider.getBalance(juror1.address);
    expect(after - before + gasUsed).to.equal(MIN_STAKE);
  });

  it("reverts withdrawStake when not staked", async function () {
    await expect(
      arbitration.connect(other).withdrawStake()
    ).to.be.revertedWithCustomError(arbitration, "InsufficientStake");
  });

  // ── createDispute ─────────────────────────────────────────────────────────

  async function stakeThreeJurors() {
    await arbitration.connect(juror1).stake({ value: MIN_STAKE });
    await arbitration.connect(juror2).stake({ value: MIN_STAKE });
    await arbitration.connect(juror3).stake({ value: MIN_STAKE });
  }

  it("creates a dispute and returns a disputeId", async function () {
    await stakeThreeJurors();
    // Call createDispute via mock escrow (which is whitelisted in mockFactory)
    await mockEscrow.triggerCreateDispute(arbitration.target);
    expect(await arbitration.disputeCount()).to.equal(1n);
  });

  it("reverts createDispute from a non-registered address", async function () {
    await stakeThreeJurors();
    await expect(
      arbitration.connect(other).createDispute(other.address)
    ).to.be.revertedWithCustomError(arbitration, "NotValidEscrow");
  });

  it("reverts createDispute when juror pool is too small", async function () {
    await arbitration.connect(juror1).stake({ value: MIN_STAKE });
    await arbitration.connect(juror2).stake({ value: MIN_STAKE });
    // Only 2 jurors — needs 3
    await expect(
      mockEscrow.triggerCreateDispute(arbitration.target)
    ).to.be.revertedWithCustomError(arbitration, "JurorPoolTooSmall");
  });

  it("selects 3 jurors for a dispute", async function () {
    await stakeThreeJurors();
    await mockEscrow.triggerCreateDispute(arbitration.target);
    const jurors = await arbitration.getJurors(1);
    expect(jurors.length).to.equal(3);
    // All should be non-zero addresses
    for (const j of jurors) {
      expect(j).to.not.equal(ethers.ZeroAddress);
    }
  });

  // ── vote ──────────────────────────────────────────────────────────────────

  it("allows selected jurors to vote and auto-resolves on majority", async function () {
    await stakeThreeJurors();
    await mockEscrow.triggerCreateDispute(arbitration.target);

    const selectedJurors = await arbitration.getJurors(1);
    const signers = { [juror1.address]: juror1, [juror2.address]: juror2, [juror3.address]: juror3 };

    // Vote 0 (client) with first 2 selected jurors to trigger majority
    let votes = 0;
    for (const addr of selectedJurors) {
      if (votes >= 2) break;
      await arbitration.connect(signers[addr]).vote(1, 0);
      votes++;
    }

    const status = await arbitration.getVotingStatus(1);
    expect(status.resolved).to.equal(true);
  });

  it("reverts vote from non-selected juror", async function () {
    await stakeThreeJurors();
    await mockEscrow.triggerCreateDispute(arbitration.target);
    await expect(
      arbitration.connect(other).vote(1, 0)
    ).to.be.revertedWithCustomError(arbitration, "NotSelectedJuror");
  });

  it("reverts double vote", async function () {
    await stakeThreeJurors();
    await mockEscrow.triggerCreateDispute(arbitration.target);
    const selectedJurors = await arbitration.getJurors(1);
    const signers = { [juror1.address]: juror1, [juror2.address]: juror2, [juror3.address]: juror3 };
    const firstJuror = signers[selectedJurors[0]];
    await arbitration.connect(firstJuror).vote(1, 1);
    await expect(
      arbitration.connect(firstJuror).vote(1, 1)
    ).to.be.revertedWithCustomError(arbitration, "AlreadyVoted");
  });

  it("reverts vote with invalid decision value", async function () {
    await stakeThreeJurors();
    await mockEscrow.triggerCreateDispute(arbitration.target);
    const selectedJurors = await arbitration.getJurors(1);
    const signers = { [juror1.address]: juror1, [juror2.address]: juror2, [juror3.address]: juror3 };
    const firstJuror = signers[selectedJurors[0]];
    await expect(
      arbitration.connect(firstJuror).vote(1, 2)
    ).to.be.revertedWithCustomError(arbitration, "InvalidDecision");
  });

  // ── getVotingStatus ───────────────────────────────────────────────────────

  it("returns correct vote tallies", async function () {
    await stakeThreeJurors();
    await mockEscrow.triggerCreateDispute(arbitration.target);
    const selectedJurors = await arbitration.getJurors(1);
    const signers = { [juror1.address]: juror1, [juror2.address]: juror2, [juror3.address]: juror3 };

    // First juror votes for freelancer (decision=1)
    await arbitration.connect(signers[selectedJurors[0]]).vote(1, 1);

    const status = await arbitration.getVotingStatus(1);
    expect(status.clientVotes).to.equal(0n);
    expect(status.freelancerVotes).to.equal(1n);
    expect(status.resolved).to.equal(false);
  });
});
