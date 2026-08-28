const FAQS = [
  { q: "What happens if my reservation expires?", a: "The block goes back to AVAILABLE. Nothing is charged unless a transaction confirms on-chain." },
  { q: "Which chains can I claim on?", a: "Robinhood Chain, Base, Arbitrum, Optimism, BNB Smart Chain, and Polygon at launch." },
  { q: "Is my artwork stored on the blockchain itself?", a: "Artwork and metadata are stored via Autonomys Auto Drive; the NFT ownership record lives on your chosen chain." },
  { q: "Can artwork be removed?", a: "Artwork is reviewed before publication and can be reported after the fact; ownership itself is permanent onchain." },
];
export default function FaqPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold font-mono mb-10">FAQ</h1>
      <div className="space-y-6">
        {FAQS.map((f) => (
          <div key={f.q} className="border-b border-border pb-6">
            <div className="font-mono font-bold text-ink mb-2">{f.q}</div>
            <div className="text-sm text-muted">{f.a}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
