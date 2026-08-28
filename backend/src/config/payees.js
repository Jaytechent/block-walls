/**
 * Disbursement addresses buyers pay to.
 *
 * Populate EITHER:
 *   - .env   ->  PAYEES="0xAAAA...,0xBBBB...,..." (comma-separated), or
 *   - a JSON  ->  ./payees.json  => ["0xAAAA...","0xBBBB...", ...]
 *
 * Each block maps deterministically to one payee via `payeeForBlock(blockId)`,
 * so the address a buyer must pay is stable and auditable (matches how the
 * contract mints: the operator verifies payment to this exact address, then
 * calls finalizeBlock with it).
 */
const fs = require("fs");
const path = require("path");

function normalize(rawList) {
  const out = [];
  for (const raw of rawList) {
    const a = String(raw).trim().toLowerCase();
    if (!/^0x[0-9a-f]{40}$/.test(a)) {
      throw new Error(`Invalid payee address: ${raw}`);
    }
    if (!out.includes(a)) out.push(a);
  }
  if (out.length === 0) {
    throw new Error("Configure at least one payee via PAYEES env or backend/payees.json");
  }
  return out;
}

let payees;
if (process.env.PAYEES) {
  payees = normalize(process.env.PAYEES.split(","));
} else {
  const jsonPath = path.join(__dirname, "..", "..", "payees.json");
  if (fs.existsSync(jsonPath)) {
    payees = normalize(JSON.parse(fs.readFileSync(jsonPath, "utf8")));
  } else {
    // Dev placeholder so the server boots; REPLACE before real money moves.
    payees = normalize(["0x000000000000000000000000000000000000dEaD"]);
  }
}

/** Deterministic payee for a block (server-side mirror of the off-chain map). */
function payeeForBlock(blockId) {
  return payees[blockId % payees.length];
}

function payeeIndexForBlock(blockId) {
  return blockId % payees.length;
}

function payeeCount() {
  return payees.length;
}

function allPayees() {
  return payees.slice();
}

module.exports = { payees, payeeForBlock, payeeIndexForBlock, payeeCount, allPayees };