const FLOW = ["USER", "WALLET", "SMART CONTRACT", "ROBINHOOD CHAIN", "NFT OWNERSHIP", "AUTONOMYS AUTO DRIVE", "PERMANENT ARTWORK"];

export default function OnchainPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-4xl font-bold font-mono mb-2">PROOF, NOT PROMISES.</h1>
      <p className="text-muted mb-12">The wall uses blockchain ownership as its source of truth.</p>

      <div className="flex flex-col gap-2 mb-12 font-mono text-sm">
        {FLOW.map((step, i) => (
          <div key={step}>
            <div className="border border-border px-4 py-3 text-ink">{step}</div>
            {i < FLOW.length - 1 && <div className="text-signal text-center py-1">↓</div>}
          </div>
        ))}
      </div>

      <div className="border border-border p-6 font-mono text-sm space-y-2">
        <Row k="NETWORK" v="Robinhood Chain" />
        <Row k="CHAIN ID" v="4663" />
        <Row k="CURRENCY" v="ETH" />
        <Row k="EXPLORER" v="robinhoodchain.blockscout.com" />
        <Row k="STORAGE" v="Autonomys Auto Drive" />
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between border-b border-border pb-2">
      <span className="text-muted">{k}</span>
      <span className="text-ink">{v}</span>
    </div>
  );
}
