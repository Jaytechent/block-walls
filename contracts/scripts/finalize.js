// Operator / owner mint tool.
//
// After you verify (on the payee's chain) that a buyer transferred the agreed
// fee to the block's disbursement address, run this to mint the NFT to the
// buyer. The private key is provided at the command line via a properly-scoped
// env var (or a KMS-secured path) — it is intentionally NOT read from a .env
// file, so no passphrase ever sits on disk.
//
//   $env:CONTRACT_ADDRESS=0x... ; $env:BLOCK_ID=42 ; $env:BUYER=0x...
//   $env:PAYEE=0x... ; $env:IMAGE_CID=... ; $env:METADATA_CID=...
//   $env:OPERATOR_PRIVATE_KEY=0xsecret  npx hardhat run scripts/finalize.js --network base
const hre = require("hardhat");

async function main() {
  const blockId = Number(process.env.BLOCK_ID);
  const buyer = process.env.BUYER;
  const payee = process.env.PAYEE;
  const imageCid = process.env.IMAGE_CID || "";
  const metadataCid = process.env.METADATA_CID || "";
  const contractAddress = process.env.CONTRACT_ADDRESS;
  const key = process.env.OPERATOR_PRIVATE_KEY;

  if (!key || !contractAddress || !Number.isInteger(blockId) || !buyer || !payee) {
    throw new Error(
      "Set OPERATOR_PRIVATE_KEY, CONTRACT_ADDRESS, BLOCK_ID, BUYER, PAYEE (all runtime, never in .env)"
    );
  }

  const signer = new hre.ethers.Wallet(key, hre.ethers.provider);
  const wall = await hre.ethers.getContractAt("BlockWall", contractAddress, signer);

  const tx = await wall.finalizeBlock(blockId, buyer, payee, imageCid, metadataCid);
  const rc = await tx.wait();
  console.log(
    `finalized block ${blockId} -> buyer ${buyer} (payee ${payee}) tx ${rc.hash}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});