const hre = require("hardhat");

/**
 * Deploys the Block Wall contract. The owner/operator keeps the only key that can
 * mint (`finalizeBlock`). There is no voucher-signer secret and no treasury
 * address in this contract - funds flow straight to per-block disbursement
 * addresses (configured off-chain in the backend), so no secret is baked here.
 */
async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const network = hre.network.name;
  const chainId = hre.network.config.chainId;

  const BlockWall = await hre.ethers.getContractFactory("BlockWall");
  const wall = await BlockWall.deploy();
  await wall.waitForDeployment();

  const address = await wall.getAddress();
  console.log(`BlockWall deployed to ${network} (chainId ${chainId}): ${address}`);
  console.log(`Owner (operator / minter): ${deployer.address}`);
  console.log(`Verify: npx hardhat verify --network ${network} ${address}`);

  return { address, chainId, network };
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});