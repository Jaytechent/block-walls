const { ethers } = require("ethers");
const Block = require("../models/Block");
const { CHAINS } = require("../config/chains");

const ABI = [
  "event BlockClaimed(uint256 indexed blockId, address indexed owner, address indexed payee, string imageCid, string metadataCid)",
];

/**
 * This is the actual source-of-truth reconciler: it doesn't trust
 * /api/claim/confirm (that's just for snappy optimistic UI). Every chain
 * the wall is deployed to gets its own listener, and whichever chain's
 * BlockClaimed event lands first for a given blockId is what MongoDB
 * ends up reflecting — matching the contract's own "first valid voucher
 * wins" rule.
 */
function startListener(chainId) {
  const chain = CHAINS[chainId];
  if (!chain?.contractAddress || !chain?.rpcUrl) {
    console.warn(`[listener] skipping chain ${chainId}: not fully configured`);
    return;
  }

  const provider = new ethers.WebSocketProvider(chain.rpcUrl);
  const contract = new ethers.Contract(chain.contractAddress, ABI, provider);

  contract.on("BlockClaimed", async (blockId, owner, payee, imageCid, metadataCid, event) => {
    const id = Number(blockId);
    console.log(`[listener:${chain.name}] BlockClaimed #${id} -> ${owner} (payee ${payee})`);

    await Block.findOneAndUpdate(
      { blockId: id },
      {
        $set: {
          status: "CLAIMED",
          owner: owner.toLowerCase(),
          payee,
          chainId,
          contractAddress: chain.contractAddress,
          mintTx: event.log.transactionHash,
          blockNumber: event.log.blockNumber,
          imageCid,
          metadataCid,
          claimedAt: new Date(),
        },
      },
      { upsert: true }
    );
  });

  provider.on("error", (err) => console.error(`[listener:${chain.name}] provider error`, err));
  console.log(`[listener] watching BlockClaimed on ${chain.name} (${chain.contractAddress})`);
}

function startAllListeners() {
  Object.keys(CHAINS).forEach((chainId) => startListener(Number(chainId)));
}

module.exports = { startAllListeners, startListener };
