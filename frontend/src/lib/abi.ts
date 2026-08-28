/**
 * ABI for the current BlockWall contract (owner-only `finalizeBlock`, no
 * voucher signing, no treasury). Kept here for reference / any admin tooling;
 * the user-facing ClaimDrawer does NOT call the contract directly — it records
 * the buyer's payment and the operator mints.
 */
export const BLOCK_WALL_ABI = [
  {
    type: "function",
    name: "finalizeBlock",
    stateMutability: "nonpayable",
    inputs: [
      { name: "blockId", type: "uint256" },
      { name: "buyer", type: "address" },
      { name: "payee", type: "address" },
      { name: "imageCid", type: "string" },
      { name: "metadataCid", type: "string" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "payeeOf",
    stateMutability: "view",
    inputs: [{ name: "blockId", type: "uint256" }],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "isClaimed",
    stateMutability: "view",
    inputs: [{ name: "blockId", type: "uint256" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "event",
    name: "BlockClaimed",
    inputs: [
      { name: "blockId", type: "uint256", indexed: true },
      { name: "owner", type: "address", indexed: true },
      { name: "payee", type: "address", indexed: true },
      { name: "imageCid", type: "string", indexed: false },
      { name: "metadataCid", type: "string", indexed: false },
    ],
  },
] as const;
