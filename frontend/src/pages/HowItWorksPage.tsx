const STEPS = [
  { n: "01", title: "CHOOSE A BLOCK", body: "Find an empty block anywhere on the wall." },
  { n: "02", title: "UPLOAD YOUR MARK", body: "Upload the image you want to place on your block." },
  { n: "03", title: "CLAIM ON ROBINHOOD CHAIN", body: "Connect your wallet and complete the $1 claim plus any applicable gas." },
  { n: "04", title: "LEAVE IT ON THE WALL", body: "Your ownership and artwork references remain verifiable onchain." },
];

export default function HowItWorksPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <h1 className="text-4xl font-bold font-mono mb-12">HOW IT WORKS</h1>
      <div className="grid md:grid-cols-4 gap-6">
        {STEPS.map((s) => (
          <div key={s.n} className="border border-border p-6">
            <div className="font-mono text-signal text-sm mb-4">{s.n}</div>
            <div className="font-mono font-bold text-ink mb-2">{s.title}</div>
            <div className="text-sm text-muted">{s.body}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
