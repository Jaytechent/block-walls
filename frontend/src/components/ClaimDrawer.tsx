import { useEffect, useState } from "react";
import { api } from "../lib/api";

/**
 * Claim flow WITHOUT wallet connect and WITHOUT any backend secret key:
 *   1. We show the deterministic payee address + price for this block.
 *   2. The buyer sends the fee directly to that address (plain on-chain tx).
 *   3. The buyer pastes the payment tx hash + the wallet that should own it.
 *   4. We verify the payment on-chain; the operator then mints the NFT.
 */
type Stage =
  | "IDLE"
  | "PAYING"
  | "SUBMITTING"
  | "VERIFIED"
  | "CONFIRMED"
  | "ERROR";

const CHAINS: { id: number; name: string }[] = [
  { id: 4663, name: "Robinhood Chain (native)" },
  { id: 8453, name: "Base (USDC)" },
  { id: 42161, name: "Arbitrum (USDC)" },
  { id: 10, name: "Optimism (USDC)" },
  { id: 56, name: "BNB Smart Chain (USDT)" },
  { id: 137, name: "Polygon (USDC)" },
];

function shortAddr(a?: string) {
  if (!a) return "";
  return `${a.slice(0, 6)}...${a.slice(-4)}`;
}

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    /* clipboard may be unavailable; user can select manually */
  }
}

export default function ClaimDrawer({
  blockId,
  x,
  y,
  onClose,
  onClaimed,
}: {
  blockId: number;
  x: number;
  y: number;
  onClose: () => void;
  onClaimed: () => void;
}) {
  const [chainId, setChainId] = useState<number>(8453);
  const [payInfo, setPayInfo] = useState<any>(null);
  const [owner, setOwner] = useState("");
  const [txHash, setTxHash] = useState("");
  const [stage, setStage] = useState<Stage>("IDLE");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api
      .post("/claim/payinfo", { blockId, chainId })
      .then(setPayInfo)
      .catch((e) => setError(e?.error ?? "could not load payment info"));
  }, [blockId, chainId]);

  const submit = async () => {
    setError(null);
    setStage("SUBMITTING");
    try {
      await api.post("/claim/submit", { blockId, buyer: owner, txHash, chainId });
      setStage("VERIFIED");
      onClaimed();
    } catch (err: any) {
      setError(err?.error ?? "Could not verify payment.");
      setStage("ERROR");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60" onClick={onClose}>
      <div
        className="h-full w-full max-w-md bg-charcoal border-l border-border p-6 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="text-xs font-mono text-muted">X {x} / Y {y}</div>
            <h2 className="text-2xl font-bold text-ink font-mono">BLOCK #{String(blockId).padStart(6, "0")}</h2>
          </div>
          <button onClick={onClose} className="text-muted hover:text-ink text-sm font-mono">CLOSE</button>
        </div>

        {error && <div className="border border-amber text-amber text-sm p-3 mb-4 font-mono">{error}</div>}

        {stage === "IDLE" || stage === "SUBMITTING" ? (
          <div className="space-y-4">
            <p className="text-sm text-muted font-mono">
              Pay <span className="text-signal">$1.00</span> to this block&apos;s assigned address. No wallet
              connection or signature needed - then confirm your payment below.
            </p>

            <div>
              <div className="text-xs uppercase text-muted mb-2 font-mono">Network</div>
              <select
                value={chainId}
                onChange={(e) => setChainId(Number(e.target.value))}
                className="w-full bg-graphite border border-border text-ink font-mono text-sm p-3"
              >
                {CHAINS.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <div className="text-xs uppercase text-muted mb-2 font-mono">Send payment to</div>
              <div className="border border-signal/40 bg-graphite p-3 font-mono text-sm text-ink break-all">
                {payInfo?.payee ?? "loading..."}
              </div>
              <button
                className="mt-2 text-xs font-mono text-signal hover:underline"
                onClick={() => { copy(payInfo?.payee); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
              >
                {copied ? "COPIED" : "COPY ADDRESS"}
              </button>
            </div>

            <div>
              <div className="text-xs uppercase text-muted mb-2 font-mono">Wallet that will own this block</div>
              <input
                value={owner}
                onChange={(e) => setOwner(e.target.value.trim())}
                placeholder="0x..."
                className="w-full bg-graphite border border-border text-ink font-mono text-sm p-3"
              />
            </div>

            <div>
              <div className="text-xs uppercase text-muted mb-2 font-mono">Payment transaction hash</div>
              <input
                value={txHash}
                onChange={(e) => setTxHash(e.target.value.trim())}
                placeholder="0x..."
                className="w-full bg-graphite border border-border text-ink font-mono text-sm p-3"
              />
            </div>

            <button
              disabled={!owner || !txHash || !payInfo || stage === "SUBMITTING"}
              onClick={submit}
              className="w-full bg-signal text-graphite font-mono font-bold py-3 disabled:opacity-30"
            >
              {stage === "SUBMITTING" ? "VERIFYING PAYMENT ON-CHAIN..." : "VERIFY PAYMENT & LOCK BLOCK"}
            </button>
          </div>
        ) : stage === "VERIFIED" ? (
          <div className="text-center space-y-4 pt-8">
            <div className="text-signal font-mono text-sm">PAYMENT VERIFIED</div>
            <p className="text-muted text-sm font-mono">
              Block #{String(blockId).padStart(6, "0")} is locked to <span className="text-ink">{shortAddr(owner)}</span>.
              The NFT is minted on-chain shortly after final verification.
            </p>
            <button
              onClick={() => { onClaimed(); onClose(); }}
              className="w-full bg-signal text-graphite font-mono py-3"
            >
              DONE
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}