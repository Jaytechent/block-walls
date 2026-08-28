import { useEffect, useRef, useState, useCallback } from "react";

export const GRID_W = 500;
export const GRID_H = 200;
export const TOTAL_BLOCKS = GRID_W * GRID_H; // 100,000
const BASE_CELL = 10; // px per block at zoom = 1

export type BlockState = {
  blockId: number;
  status: "AVAILABLE" | "RESERVED" | "PAYMENT_PENDING" | "CLAIMED" | "EXPIRED";
  owner?: string;
  imageUrl?: string; // resolved gateway URL for CLAIMED blocks
  previewColor?: string;
  isSample?: boolean;
};

type Props = {
  blocks: Map<number, BlockState>; // sparse: only non-AVAILABLE blocks need entries
  onSelectBlock: (blockId: number, x: number, y: number) => void;
  hoveredBlockId: number | null;
  onHoverBlock: (blockId: number | null) => void;
};

/**
 * Renders the full 100,000-block wall on a single <canvas>. Never creates
 * DOM nodes per block — that's the difference between this staying smooth
 * at 60fps and dying at ~50k elements. Viewport culling means we only ever
 * iterate the handful of blocks actually visible on screen, regardless of
 * total grid size.
 */
export default function WallCanvas({ blocks, onSelectBlock, hoveredBlockId, onHoverBlock }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgCache = useRef(new Map<string, HTMLImageElement>());
  const [view, setView] = useState({ offsetX: -((GRID_W * BASE_CELL) / 2), offsetY: -((GRID_H * BASE_CELL) / 2), zoom: 1 });
  const dragState = useRef<{ dragging: boolean; lastX: number; lastY: number; totalMove: number }>({
    dragging: false,
    lastX: 0,
    lastY: 0,
    totalMove: 0,
  });

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = canvas;
    ctx.fillStyle = "#0A0B0C";
    ctx.fillRect(0, 0, width, height);

    const cell = BASE_CELL * view.zoom;
    const originX = width / 2 - view.offsetX * view.zoom;
    const originY = height / 2 - view.offsetY * view.zoom;

    // Viewport culling: only compute the block-index range actually on screen.
    const minX = Math.max(0, Math.floor((-originX) / cell));
    const maxX = Math.min(GRID_W - 1, Math.ceil((width - originX) / cell));
    const minY = Math.max(0, Math.floor((-originY) / cell));
    const maxY = Math.min(GRID_H - 1, Math.ceil((height - originY) / cell));

    const showGridLines = cell > 3;

    for (let gy = minY; gy <= maxY; gy++) {
      for (let gx = minX; gx <= maxX; gx++) {
        const blockId = gy * GRID_W + gx;
        const px = originX + gx * cell;
        const py = originY + gy * cell;
        const state = blocks.get(blockId);

        if (!state || state.status === "AVAILABLE") {
          ctx.fillStyle = "#141517";
        } else if (state.status === "RESERVED" || state.status === "PAYMENT_PENDING") {
          ctx.fillStyle = "#3A2B0F";
        } else if (state.status === "CLAIMED") {
          ctx.fillStyle = "#1E1F22";
        } else {
          ctx.fillStyle = "#141517";
        }
        ctx.fillRect(px, py, cell, cell);

        if (state?.status === "CLAIMED" && state.imageUrl && cell > 2) {
          let img = imgCache.current.get(state.imageUrl);
          if (!img) {
            img = new Image();
            img.src = state.imageUrl;
            img.onload = () => requestAnimationFrame(draw);
            imgCache.current.set(state.imageUrl, img);
          }
          if (img.complete) ctx.drawImage(img, px, py, cell, cell);
        }

        if (blockId === hoveredBlockId) {
          ctx.strokeStyle = "#00D26A";
          ctx.lineWidth = Math.max(1, cell * 0.08);
          ctx.strokeRect(px + 0.5, py + 0.5, cell - 1, cell - 1);
        }
      }
    }

    if (showGridLines) {
      ctx.strokeStyle = "#1D1F22";
      ctx.lineWidth = 1;
      for (let gx = minX; gx <= maxX + 1; gx++) {
        const px = originX + gx * cell;
        ctx.beginPath();
        ctx.moveTo(px, originY + minY * cell);
        ctx.lineTo(px, originY + (maxY + 1) * cell);
        ctx.stroke();
      }
      for (let gy = minY; gy <= maxY + 1; gy++) {
        const py = originY + gy * cell;
        ctx.beginPath();
        ctx.moveTo(originX + minX * cell, py);
        ctx.lineTo(originX + (maxX + 1) * cell, py);
        ctx.stroke();
      }
    }
  }, [blocks, view, hoveredBlockId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      canvas.getContext("2d")?.scale(dpr, dpr);
      draw();
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [draw]);

  useEffect(() => { draw(); }, [draw]);

  const screenToBlock = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const cell = BASE_CELL * view.zoom;
    const originX = width / 2 - view.offsetX * view.zoom;
    const originY = height / 2 - view.offsetY * view.zoom;
    const gx = Math.floor((clientX - rect.left - originX) / cell);
    const gy = Math.floor((clientY - rect.top - originY) / cell);
    if (gx < 0 || gx >= GRID_W || gy < 0 || gy >= GRID_H) return null;
    return { blockId: gy * GRID_W + gx, x: gx, y: gy };
  };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    setView((v) => ({ ...v, zoom: Math.min(24, Math.max(0.3, v.zoom * factor)) }));
  };

  const onPointerDown = (e: React.PointerEvent) => {
    dragState.current = { dragging: true, lastX: e.clientX, lastY: e.clientY, totalMove: 0 };
    (e.target as Element).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (dragState.current.dragging) {
      const dx = e.clientX - dragState.current.lastX;
      const dy = e.clientY - dragState.current.lastY;
      dragState.current.lastX = e.clientX;
      dragState.current.lastY = e.clientY;
      dragState.current.totalMove += Math.abs(dx) + Math.abs(dy);
      setView((v) => ({ ...v, offsetX: v.offsetX - dx / v.zoom, offsetY: v.offsetY - dy / v.zoom }));
    } else {
      const hit = screenToBlock(e.clientX, e.clientY);
      onHoverBlock(hit?.blockId ?? null);
    }
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const wasClick = dragState.current.dragging && dragState.current.totalMove < 4; // px threshold
    dragState.current.dragging = false;
    if (wasClick) {
      const hit = screenToBlock(e.clientX, e.clientY);
      if (hit) onSelectBlock(hit.blockId, hit.x, hit.y);
    }
  };

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full touch-none cursor-crosshair"
      onWheel={onWheel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={() => onHoverBlock(null)}
    />
  );
}
