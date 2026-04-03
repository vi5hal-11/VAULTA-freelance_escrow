const hre = require("hardhat");

async function main() {
  const EscrowFactory = await hre.ethers.getContractFactory("EscrowFactory");

  const factory = await EscrowFactory.deploy();

  await factory.waitForDeployment();

  console.log("Factory deployed to:", factory.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
