/**
 * Single source of truth for "which chains is this wall live on."
 * Adding a new chain to the product is: deploy the contract (see
 * contracts/scripts/deploy.js), then add one entry here, then add the
 * chain to frontend/src/config/wagmi.ts. Nothing else changes.
 */
const CHAINS = {
  4663: {
    key: "robinhoodChain",
    name: "Robinhood Chain",
    contractAddress: process.env.CONTRACT_ROBINHOOD_CHAIN,
    paymentToken: "native", // or an ERC-20 address if USDC is bridged there
    rpcUrl: process.env.ROBINHOOD_CHAIN_RPC_URL,
    explorer: "https://robinhoodchain.blockscout.com",
  },
  8453: {
    key: "base",
    name: "Base",
    contractAddress: process.env.CONTRACT_BASE,
    paymentToken: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC
    rpcUrl: process.env.BASE_RPC_URL,
    explorer: "https://basescan.org",
  },
  42161: {
    key: "arbitrum",
    name: "Arbitrum",
    contractAddress: process.env.CONTRACT_ARBITRUM,
    paymentToken: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    rpcUrl: process.env.ARBITRUM_RPC_URL,
    explorer: "https://arbiscan.io",
  },
  10: {
    key: "optimism",
    name: "Optimism",
    contractAddress: process.env.CONTRACT_OPTIMISM,
    paymentToken: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
    rpcUrl: process.env.OPTIMISM_RPC_URL,
    explorer: "https://optimistic.etherscan.io",
  },
  56: {
    key: "bsc",
    name: "BNB Smart Chain",
    contractAddress: process.env.CONTRACT_BSC,
    paymentToken: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", // USDT
    rpcUrl: process.env.BSC_RPC_URL,
    explorer: "https://bscscan.com",
  },
  137: {
    key: "polygon",
    name: "Polygon",
    contractAddress: process.env.CONTRACT_POLYGON,
    paymentToken: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
    rpcUrl: process.env.POLYGON_RPC_URL,
    explorer: "https://polygonscan.com",
  },
};

const BLOCK_PRICE_USD_6DP = "1000000"; // $1.00 in 6-decimal USDC units

function getChain(chainId) {
  const chain = CHAINS[Number(chainId)];
  if (!chain) throw new Error(`Unsupported chainId ${chainId}`);
  return chain;
}

module.exports = { CHAINS, getChain, BLOCK_PRICE_USD_6DP };
