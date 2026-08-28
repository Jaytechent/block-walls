import { createConfig, http, injected } from "wagmi";
import { base, arbitrum, optimism, bsc, polygon } from "wagmi/chains";
import { defineChain } from "viem";

export const robinhoodChain = defineChain({
  id: 4663,
  name: "Robinhood Chain",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.robinhoodchain.blockscout.com"] },
  },
  blockExplorers: {
    default: { name: "Robinhood Chain Explorer", url: "https://robinhoodchain.blockscout.com" },
  },
  testnet: false,
});

export const wagmiConfig = createConfig({
  chains: [robinhoodChain, base, arbitrum, optimism, bsc, polygon],
  connectors: [injected()],
  transports: {
    [robinhoodChain.id]: http(robinhoodChain.rpcUrls.default.http[0]),
    [base.id]: http(),
    [arbitrum.id]: http(),
    [optimism.id]: http(),
    [bsc.id]: http(),
    [polygon.id]: http(),
  },
});

/** Contract addresses, filled in per deployment. Keep in sync with backend/src/config/chains.js */
export const CONTRACT_ADDRESSES: Record<number, `0x${string}` | undefined> = {
  [robinhoodChain.id]: import.meta.env.VITE_CONTRACT_ROBINHOOD_CHAIN,
  [base.id]: import.meta.env.VITE_CONTRACT_BASE,
  [arbitrum.id]: import.meta.env.VITE_CONTRACT_ARBITRUM,
  [optimism.id]: import.meta.env.VITE_CONTRACT_OPTIMISM,
  [bsc.id]: import.meta.env.VITE_CONTRACT_BSC,
  [polygon.id]: import.meta.env.VITE_CONTRACT_POLYGON,
};

export const NATIVE_PAYMENT_CHAINS = new Set<number>([robinhoodChain.id]);
