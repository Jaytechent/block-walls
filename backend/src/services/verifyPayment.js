/**
 * Verifies on-chain that a buyer's transaction really sent the required amount
 * to the block's payee. This is the honesty layer behind the owner-only mint:
 * the operator only calls `finalizeBlock` after this returns ok.
 *
 * - Native-payment chains (paymentToken === "native"): the tx must be a direct
 *   native transfer TO the payee with msg.value >= requiredAmount.
 * - ERC-20 chains (USDC etc.): the tx must include a Transfer to the payee of
 *   >= requiredAmount of the configured token.
 */
const { ethers } = require("ethers");
const { getChain } = require("../config/chains");

const ERC20_TRANSFER_ABI = [
  "event Transfer(address indexed from, address indexed to, uint256 value)",
];

function toHttp(url) {
  return String(url).replace(/^wss:\/\//, "https://").replace(/^ws:\/\//, "http://");
}

/**
 * @param {object} p
 * @param {number} p.chainId
 * @param {string} p.txHash
 * @param {string} p.payee  - expected recipient (lowercased internally)
 * @param {bigint} p.requiredAmount - min accepted units (wei or token decimal units)
 * @param {string|null} p.paymentToken - token address, or "native"/null for native
 * @returns {Promise<{ok:boolean, amount?:bigint, reason?:string}>}
 */
async function verifyPayment({ chainId, txHash, payee, requiredAmount, paymentToken }) {
  const chain = getChain(chainId);
  if (!chain.rpcUrl) throw new Error(`No RPC configured for chain ${chainId}`);

  const provider = new ethers.JsonRpcProvider(toHttp(chain.rpcUrl));

  const tx = await provider.getTransaction(txHash);
  if (!tx) return { ok: false, reason: "transaction not found" };

  const receipt = await provider.getTransactionReceipt(txHash);
  if (!receipt || receipt.status !== 1) {
    return { ok: false, reason: "transaction failed or not yet mined" };
  }

  const payeeLower = String(payee).toLowerCase();

  if (!paymentToken || paymentToken === "native") {
    if ((tx.to || "").toLowerCase() !== payeeLower) {
      return { ok: false, reason: "transaction recipient is not the block's payee" };
    }
    if (tx.value < requiredAmount) {
      return { ok: false, reason: "native amount is below the required price" };
    }
    return { ok: true, amount: tx.value };
  }

  // ERC-20 payment: sum Transfer events to the payee in this tx.
  const iface = new ethers.Interface(ERC20_TRANSFER_ABI);
  let total = 0n;
  for (const log of receipt.logs) {
    try {
      const parsed = iface.parseLog(log);
      if (parsed && parsed.args.to.toLowerCase() === payeeLower) {
        total += parsed.args.value;
      }
    } catch {
      /* not the token we care about */
    }
  }
  if (total < requiredAmount) {
    return { ok: false, reason: "insufficient token amount transferred to payee" };
  }
  return { ok: true, amount: total };
}

module.exports = { verifyPayment };