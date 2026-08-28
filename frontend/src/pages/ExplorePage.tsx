import { useState } from "react";
import { api } from "../lib/api";

export default function ExplorePage() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<any>(null);

  const search = async () => {
    const isWallet = query.startsWith("0x");
    const res = await api.get(`/blocks/search/query?${isWallet ? `wallet=${query}` : `q=${query}`}`);
    setResult(res);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold font-mono mb-2">EXPLORE</h1>
      <p className="text-muted mb-8">Search by block number, wallet address, or transaction hash.</p>

      <div className="flex gap-2 mb-10">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
          placeholder="SEARCH BLOCK / WALLET / ADDRESS"
          className="flex-1 bg-charcoal border border-border px-4 py-3 font-mono text-sm text-ink outline-none focus:border-signal"
        />
        <button onClick={search} className="bg-ink text-graphite font-mono font-bold px-6">
          SEARCH
        </button>
      </div>

      {result?.type === "wallet" && (
        <div>
          <div className="font-mono text-sm text-muted mb-4">{result.count} block(s) owned by {result.wallet}</div>
          <div className="grid grid-cols-4 gap-2">
            {result.blocks.map((b: any) => (
              <div key={b.blockId} className="aspect-square border border-border bg-charcoal flex items-center justify-center font-mono text-xs text-muted">
                #{b.blockId}
              </div>
            ))}
          </div>
        </div>
      )}

      {result?.type === "block" && (
        <div className="border border-border bg-charcoal p-6 font-mono text-sm">
          <div>BLOCK #{String(result.block.blockId).padStart(6, "0")}</div>
          <div className="text-signal">STATUS {result.block.status}</div>
        </div>
      )}
    </div>
  );
}
