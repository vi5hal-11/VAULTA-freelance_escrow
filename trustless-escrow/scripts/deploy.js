const hre = require("hardhat");
const { parseEther } = require("ethers");

/**
 * Deployment order:
 *   1. Arbitration  (needs factory address → use a placeholder, then set it)
 *   2. EscrowFactory (needs arbitration address)
 *   3. Arbitration.setFactory(factoryAddress)  — NOT needed: factory address is
 *      passed to the Arbitration constructor. Because of the circular dependency
 *      we deploy Arbitration first with a known factory address prediction OR
 *      we deploy both and wire them together via a two-step approach.
 *
 * Simple two-step wiring used here:
 *   a. Deploy Arbitration with a zero factory placeholder.
 *   b. Deploy EscrowFactory(arbitrationAddress).
 *   c. (Arbitration already has factory set in constructor – so we pass factory
 *      address AFTER we know it by using CREATE2 or a setter.)
 *
 * Pragmatic approach for this script: deploy Arbitration with the factory
 * address computed ahead of time using the deployer's nonce.
 */
async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  // ── Step 1: Compute the future EscrowFactory address ──────────────────────
  // Hardhat uses standard CREATE: address = keccak256(rlp([deployer, nonce]))[12:]
  // After Arbitration deploy (nonce N), Factory will be at nonce N+1.
  const currentNonce = await deployer.provider.getTransactionCount(deployer.address);
  const futureFactoryAddress = hre.ethers.getCreateAddress({
    from: deployer.address,
    nonce: currentNonce + 1, // factory deployed one tx after arbitration
  });
  console.log("Predicted EscrowFactory address:", futureFactoryAddress);

  // ── Step 2: Deploy Arbitration ─────────────────────────────────────────────
  const MIN_STAKE = parseEther("0.1"); // 0.1 ETH minimum juror stake
  const Arbitration = await hre.ethers.getContractFactory("Arbitration");
  const arbitration = await Arbitration.deploy(MIN_STAKE, futureFactoryAddress);
  await arbitration.waitForDeployment();
  console.log("Arbitration deployed to:", arbitration.target);

  // ── Step 3: Deploy EscrowFactory ──────────────────────────────────────────
  const EscrowFactory = await hre.ethers.getContractFactory("EscrowFactory");
  const factory = await EscrowFactory.deploy(arbitration.target);
  await factory.waitForDeployment();
  console.log("EscrowFactory deployed to:", factory.target);

  // ── Verify address prediction was correct ─────────────────────────────────
  if (factory.target.toLowerCase() !== futureFactoryAddress.toLowerCase()) {
    console.warn(
      "WARNING: Factory address mismatch! Predicted:",
      futureFactoryAddress,
      "Actual:",
      factory.target
    );
    console.warn(
      "Arbitration contract has the wrong factory address. Re-deploy or update manually."
    );
  } else {
    console.log("Address prediction verified ✓");
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log("\n=== Deployment Summary ===");
  console.log("Arbitration  :", arbitration.target);
  console.log("EscrowFactory:", factory.target);
  console.log("\nUpdate your frontend .env:");
  console.log(`VITE_ARBITRATION_ADDRESS=${arbitration.target}`);
  console.log(`VITE_FACTORY_ADDRESS=${factory.target}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
