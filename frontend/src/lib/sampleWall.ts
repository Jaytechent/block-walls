import { GRID_W, type BlockState } from "../components/WallCanvas";

type Artwork = {
  x: number;
  y: number;
  width: number;
  height: number;
  palette: readonly string[];
  pattern: "CHECKER" | "DIAGONAL" | "FRAME" | "RADIAL";
};

const SIGNAL = ["#00D26A", "#00A955", "#087A43", "#9AF7C8", "#E7FFF2"] as const;
const AMBER = ["#F5A623", "#C86B22", "#6D3B18", "#FFD68A", "#F5F5F3"] as const;
const ICE = ["#F5F5F3", "#A7B0B5", "#435058", "#171A1D", "#00D26A"] as const;
const ELECTRIC = ["#5CE1E6", "#277DA1", "#223A5E", "#F5F5F3", "#00D26A"] as const;

const ARTWORKS: Artwork[] = [
  { x: 30, y: 25, width: 42, height: 30, palette: SIGNAL, pattern: "FRAME" },
  { x: 96, y: 75, width: 54, height: 38, palette: ICE, pattern: "DIAGONAL" },
  { x: 175, y: 28, width: 66, height: 42, palette: ELECTRIC, pattern: "RADIAL" },
  { x: 267, y: 88, width: 48, height: 50, palette: AMBER, pattern: "CHECKER" },
  { x: 337, y: 32, width: 72, height: 36, palette: SIGNAL, pattern: "DIAGONAL" },
  { x: 430, y: 103, width: 42, height: 48, palette: ICE, pattern: "FRAME" },
  { x: 55, y: 143, width: 32, height: 24, palette: AMBER, pattern: "RADIAL" },
  { x: 358, y: 145, width: 54, height: 25, palette: ELECTRIC, pattern: "CHECKER" },
];

function colorFor(artwork: Artwork, x: number, y: number) {
  const localX = x - artwork.x;
  const localY = y - artwork.y;
  const { width, height, palette, pattern } = artwork;

  if (pattern === "CHECKER") {
    return palette[(Math.floor(localX / 4) + Math.floor(localY / 4)) % palette.length];
  }

  if (pattern === "DIAGONAL") {
    return palette[Math.floor((localX + localY) / 5) % palette.length];
  }

  if (pattern === "RADIAL") {
    const dx = localX - width / 2;
    const dy = localY - height / 2;
    return palette[Math.floor(Math.sqrt(dx * dx + dy * dy) / 4) % palette.length];
  }

  const edge = Math.min(localX, localY, width - localX - 1, height - localY - 1);
  return palette[Math.min(palette.length - 1, Math.floor(edge / 3))];
}

function createSampleWall() {
  const blocks = new Map<number, BlockState>();

  for (const artwork of ARTWORKS) {
    for (let y = artwork.y; y < artwork.y + artwork.height; y++) {
      for (let x = artwork.x; x < artwork.x + artwork.width; x++) {
        const blockId = y * GRID_W + x;
        blocks.set(blockId, {
          blockId,
          status: "CLAIMED",
          owner: "0x1000000000000000000000000000000000000001",
          previewColor: colorFor(artwork, x, y),
          isSample: true,
        });
      }
    }
  }

  // A deterministic scatter shows that each artwork is still composed of
  // independently addressable blocks, rather than being one large image.
  let seed = 100_000;
  for (let i = 0; i < 220; i++) {
    seed = (seed * 1_664_525 + 1_013_904_223) >>> 0;
    const x = seed % GRID_W;
    seed = (seed * 1_664_525 + 1_013_904_223) >>> 0;
    const y = seed % 200;
    const blockId = y * GRID_W + x;
    blocks.set(blockId, {
      blockId,
      status: i % 7 === 0 ? "RESERVED" : "CLAIMED",
      previewColor: i % 7 === 0 ? "#F5A623" : SIGNAL[i % SIGNAL.length],
      isSample: true,
    });
  }

  return blocks;
}

export const SAMPLE_WALL_BLOCKS = createSampleWall();

export const SAMPLE_WALL_STATS = {
  claimed: [...SAMPLE_WALL_BLOCKS.values()].filter((block) => block.status === "CLAIMED").length,
  total: 100_000,
  pctClaimed: Number(
    (
      ([...SAMPLE_WALL_BLOCKS.values()].filter((block) => block.status === "CLAIMED").length / 100_000) *
      100
    ).toFixed(2),
  ),
};