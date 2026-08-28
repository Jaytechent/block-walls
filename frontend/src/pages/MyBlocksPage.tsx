import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { api } from "../lib/api";

export default function MyBlocksPage() {
  const { address } = useAccount();
  const [blocks, setBlocks] = useState<any[]>([]);

  useEffect(() => {
    if (!address) return;
    api.get(`/blocks/search/query?wallet=${address}`).then((r) => setBlocks(r.blocks));
  }, [address]);

  if (!address) {
    return <div className="max-w-4xl mx-auto px-6 py-16 font-mono text-muted">Connect your wallet to see your blocks.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold font-mono mb-2">MY BLOCKS</h1>
      <div className="font-mono text-sm text-muted mb-8">BLOCKS OWNED: {blocks.length}</div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {blocks.map((b) => (
          <div key={b.blockId} className="border border-border bg-charcoal aspect-square">
            {b.imageCid ? (
              <img src={`https://gateway.auto-drive.autonomys.xyz/${b.imageCid}`} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-mono text-xs text-muted">
                #{b.blockId}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
