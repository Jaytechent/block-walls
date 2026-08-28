const express = require("express");
const Block = require("../models/Block");
const router = express.Router();

/**
 * GET /api/blocks
 * Bulk state for rendering the canvas wall. Returns only claimed/reserved
 * blocks (available blocks are the implicit default) so the payload stays
 * small even at 100,000 blocks.
 */
router.get("/", async (req, res) => {
  const blocks = await Block.find(
    { status: { $ne: "AVAILABLE" } },
    "blockId x y status owner imageCid moderationStatus expiresAt"
  ).lean();
  res.json({ total: 100000, blocks });
});

/** GET /api/blocks/:id */
router.get("/:id", async (req, res) => {
  const blockId = Number(req.params.id);
  if (!Number.isInteger(blockId) || blockId < 0 || blockId >= 100000) {
    return res.status(400).json({ error: "invalid block id" });
  }
  const block = await Block.findOne({ blockId }).lean();
  if (!block) {
    return res.json({ blockId, x: blockId % 500, y: Math.floor(blockId / 500), status: "AVAILABLE" });
  }
  res.json(block);
});

/** GET /api/blocks/search?wallet=0x... or ?q=block number */
router.get("/search/query", async (req, res) => {
  const { wallet, q } = req.query;
  if (wallet) {
    const owned = await Block.find({ owner: String(wallet).toLowerCase() }).lean();
    return res.json({ type: "wallet", wallet, count: owned.length, blocks: owned });
  }
  if (q && /^\d+$/.test(q)) {
    const blockId = Number(q);
    const block = await Block.findOne({ blockId }).lean();
    return res.json({ type: "block", block: block || { blockId, status: "AVAILABLE" } });
  }
  res.status(400).json({ error: "provide ?wallet= or a numeric ?q=" });
});

/** GET /api/blocks/stats/summary */
router.get("/stats/summary", async (req, res) => {
  const claimed = await Block.countDocuments({ status: "CLAIMED" });
  res.json({ total: 100000, claimed, remaining: 100000 - claimed, pctClaimed: +((claimed / 100000) * 100).toFixed(2) });
});

module.exports = router;
