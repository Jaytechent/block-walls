import { useEffect, useState, useCallback } from "react";
import WallCanvas, { BlockState, TOTAL_BLOCKS } from "../components/WallCanvas";
import ClaimDrawer from "../components/ClaimDrawer";
import { api } from "../lib/api";
import { SAMPLE_WALL_BLOCKS, SAMPLE_WALL_STATS } from "../lib/sampleWall";

export default function WallPage() {
  // Seed the landing wall with an art-directed, deterministic mock-up. Live
  // API records replace these blocks as soon as they are available.
  const [blocks, setBlocks] = useState<Map<number, BlockState>>(() => new Map(SAMPLE_WALL_BLOCKS));
  const [stats, setStats] = useState(SAMPLE_WALL_STATS);
  const [hovered, setHovered] = useState<number | null>(null);
  const [selected, setSelected] = useState<{ blockId: number; x: number; y: number } | null>(null);
  const [showHero, setShowHero] = useState(true);

  const refresh = useCallback(async () => {
    const [blocksResult, statsResult] = await Promise.allSettled([
      api.get("/blocks"),
      api.get("/blocks/stats/summary"),
    ]);

    if (blocksResult.status === "fulfilled") {
      const m = new Map<number, BlockState>(SAMPLE_WALL_BLOCKS);
      for (const b of blocksResult.value.blocks) {
        m.set(b.blockId, {
          blockId: b.blockId,
          status: b.status,
          owner: b.owner,
          imageUrl: b.imageCid ? `https://gateway.auto-drive.autonomys.xyz/${b.imageCid}` : undefined,
        });
      }
      setBlocks(m);
    }

    if (statsResult.status === "fulfilled") {
      setStats(statsResult.value.claimed ? statsResult.value : SAMPLE_WALL_STATS);
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 15000); // poll; swap for a websocket feed at scale
    return () => clearInterval(id);
  }, [refresh]);

  const hoveredState = hovered !== null ? blocks.get(hovered) : undefined;

  return (
    <div className="relative h-[calc(100vh-64px)] w-full overflow-hidden">
      <WallCanvas
        blocks={blocks}
        hoveredBlockId={hovered}
        onHoverBlock={setHovered}
        onSelectBlock={(blockId, x, y) => {
          setShowHero(false);
          setSelected({ blockId, x, y });
        }}
      />

      {showHero && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <h1 className="text-6xl md:text-8xl font-bold text-ink font-sans tracking-tight leading-none">
            100,000
            <br />
            BLOCKS
          </h1>
          <p className="mt-4 text-lg text-ink font-mono">$1. ONE BLOCK. YOUR MARK. FOREVER.</p>
          <p className="mt-2 max-w-md text-sm text-muted">
            Claim one of 100,000 blocks on a permanent collaborative wall. Upload your image, mint your
            block, and leave a verifiable mark onchain.
          </p>
          <div className="mt-6 flex gap-3 pointer-events-auto">
            <button
              onClick={() => setShowHero(false)}
              className="bg-signal text-graphite font-mono font-bold px-6 py-3"
            >
              CLAIM A BLOCK
            </button>
            <button
              onClick={() => setShowHero(false)}
              className="border border-border text-ink font-mono px-6 py-3"
            >
              EXPLORE THE WALL
            </button>
          </div>
        </div>
      )}

      {/* Hover tooltip */}
      {hoveredState && !selected && (
        <div className="absolute top-4 left-4 border border-border bg-charcoal px-3 py-2 font-mono text-xs text-ink pointer-events-none">
          <div>BLOCK #{String(hoveredState.blockId).padStart(6, "0")}</div>
          {hoveredState.owner && <div className="text-muted">OWNER {hoveredState.owner.slice(0, 6)}...{hoveredState.owner.slice(-4)}</div>}
          <div className="text-signal">STATUS {hoveredState.status}</div>
        </div>
      )}

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-border bg-graphite/95 backdrop-blur px-6 py-3 flex items-center gap-4">
        <div className="font-mono text-xs text-ink whitespace-nowrap">
          {stats.claimed.toLocaleString()} / {stats.total.toLocaleString()} BLOCKS CLAIMED
        </div>
        <div className="flex-1 h-1 bg-border">
          <div className="h-full bg-signal" style={{ width: `${stats.pctClaimed}%` }} />
        </div>
        <div className="font-mono text-xs text-signal">{stats.pctClaimed}%</div>
      </div>

      {selected && (
        <ClaimDrawer
          blockId={selected.blockId}
          x={selected.x}
          y={selected.y}
          onClose={() => setSelected(null)}
          onClaimed={refresh}
        />
      )}
    </div>
  );
}
