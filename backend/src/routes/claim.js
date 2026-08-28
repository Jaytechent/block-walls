const express = require("express");
const multer = require("multer");
const crypto = require("crypto");
const Block = require("../models/Block");
const { uploadArtwork, uploadMetadata } = require("../services/autoDrive");
const { verifyPayment } = require("../services/verifyPayment");
const { getChain, BLOCK_PRICE_USD_6DP } = require("../config/chains");
const { payeeForBlock, payeeIndexForBlock } = require("../config/payees");

const router = express.Router();
const upload = multer({ limits: { fileSize: 8 * 1024 * 1024 } }); // 8MB cap

const RESERVATION_TTL_MS = 5 * 60 * 1000; // 5 minutes, matches the UI countdown

// Native-token chains (e.g. Robinhood Chain) need $1 -> wei conversion via a
// live price feed (Chainlink). Stub until a feed is configured; USDC chains work.
async function nativeWeiForOneUsd() {
  throw new Error("No native price feed configured yet - use a USDC chain");
}

/**
 * POST /api/claim/payinfo  body { blockId, chainId }
 * Returns the deterministic payee address + amount for a block so the UI can
 * show the buyer exactly where to send the fee. No verification here.
 */
router.post("/payinfo", async (req, res) => {
  const blockId = Number(req.body.blockId);
  const chainId = Number(req.body.chainId);
  if (!Number.isInteger(blockId) || blockId < 0 || blockId >= 100000) {
    return res.status(400).json({ error: "invalid block id" });
  }
  let chain;
  try {
    chain = getChain(chainId);
  } catch {
    return res.status(400).json({ error: "unsupported chain" });
  }

  res.json({
    blockId,
    chainId,
    payee: payeeForBlock(blockId),
    payeeIndex: payeeIndexForBlock(blockId),
    paymentToken: chain.paymentToken,
    usesNativePayment: chain.paymentToken === "native",
    priceUnits: BLOCK_PRICE_USD_6DP,
    displayAmount: "$1.00",
  });
});

/**
 * POST /api/claim/reserve  body { blockId, wallet }
 * Atomically reserves a block for the caller before they pay.
 */
router.post("/reserve", async (req, res) => {
  const { blockId, wallet, buyer: bodyBuyer } = req.body;
  const holder = (wallet || bodyBuyer || "").toLowerCase();
  const id = Number(blockId);
  if (!Number.isInteger(id) || id < 0 || id >= 100000) {
    return res.status(400).json({ error: "invalid block id" });
  }
  if (!holder) return res.status(400).json({ error: "a buyer address is required" });

  const now = new Date();
  const reservationId = crypto.randomUUID();
  const expiresAt = new Date(now.getTime() + RESERVATION_TTL_MS);
  const x = id % 500;
  const y = Math.floor(id / 500);

  const result = await Block.findOneAndUpdate(
    {
      blockId: id,
      $or: [
        { status: "AVAILABLE" },
        { status: "EXPIRED" },
        { status: "RESERVED", expiresAt: { $lt: now } },
      ],
    },
    {
      $setOnInsert: { blockId: id, x, y, payee: payeeForBlock(id) },
      $set: { status: "RESERVED", reservedBy: holder, reservationId, reservedAt: now, expiresAt },
    },
    { upsert: true, new: true }
  ).catch(() => null);

  if (!result) {
    const existing = await Block.findOne({ blockId: id }).lean();
    return res.status(409).json({ error: "block is not available", status: existing?.status ?? "RESERVED" });
  }

  res.json({ blockId: id, reservationId, status: "RESERVED", expiresAt, ttlSeconds: RESERVATION_TTL_MS / 1000 });
});

/**
 * POST /api/claim/upload (multipart/form-data: image, blockId, reservationId, buyer)
 * Stores artwork on Auto Drive so the operator can mint it on-chain later.
 * Optional for the claim flow - payment + mint don't require art.
 */
router.post("/upload", upload.single("image"), async (req, res) => {
  const blockId = Number(req.body.blockId);
  const { reservationId, buyer: bodyBuyer, wallet } = req.body;
  const holder = (wallet || bodyBuyer || "").toLowerCase();
  if (!req.file) return res.status(400).json({ error: "image file is required" });
  if (!["image/png", "image/jpeg", "image/webp"].includes(req.file.mimetype)) {
    return res.status(400).json({ error: "unsupported image type" });
  }
  const block = await Block.findOne({ blockId, reservationId, reservedBy: holder });
  if (!block || block.status !== "RESERVED" || block.expiresAt < new Date()) {
    return res.status(409).json({ error: "reservation not found or expired" });
  }
  try {
    const imageCid = await uploadArtwork(req.file.buffer, `block-${blockId}.${req.file.mimetype.split("/")[1]}`, req.file.mimetype);
    const { cid: metadataCid } = await uploadMetadata({ blockId, x: block.x, y: block.y, imageCid, owner: holder });
    block.imageCid = imageCid;
    block.metadataCid = metadataCid;
    block.moderationStatus = "PENDING_REVIEW";
    await block.save();
    res.json({ blockId, imageCid, metadataCid, status: block.status });
  } catch (err) {
    console.error("Auto Drive upload failed", err);
    res.status(502).json({ error: "artwork storage failed, please retry" });
  }
});

/**
 * POST /api/claim/submit  body { blockId, buyer, txHash, chainId }
 * Verifies on-chain that `txHash` sent the required fee to the block's payee.
 * If valid, marks the block PAYMENT_PENDING so the operator can mint it.
 */
router.post("/submit", async (req, res) => {
  const { buyer, txHash } = req.body;
  const blockId = Number(req.body.blockId);
  const chainId = Number(req.body.chainId);
  if (!Number.isInteger(blockId) || blockId < 0 || blockId >= 100000) {
    return res.status(400).json({ error: "invalid block id" });
  }
  if (!buyer || !/^0x[0-9a-fA-F]{40}$/.test(buyer)) {
    return res.status(400).json({ error: "valid buyer address required" });
  }
  if (!/^0x[0-9a-fA-F]{64}$/.test(txHash || "")) {
    return res.status(400).json({ error: "valid payment tx hash required" });
  }

  const block = await Block.findOne({ blockId }).lean();
  if (block && block.status === "CLAIMED") return res.status(409).json({ error: "block already claimed" });

  let chain;
  try {
    chain = getChain(chainId);
  } catch {
    return res.status(400).json({ error: "unsupported chain" });
  }

  // require the shorter reservations: buyer must have reserved -> we allow a
  // direct never-reserved claim as long as no one has already claimed it.
  const payee = payeeForBlock(blockId);
  const priceUnits = chain.paymentToken === "native"
    ? await nativeWeiForOneUsd()
    : BigInt(BLOCK_PRICE_USD_6DP);

  let verified;
  try {
    verified = await verifyPayment({
      chainId,
      txHash,
      payee,
      requiredAmount: priceUnits,
      paymentToken: chain.paymentToken,
    });
  } catch (err) {
    console.error("payment verification error", err);
    return res.status(502).json({ error: "could not verify payment on-chain, retry shortly" });
  }
  if (!verified.ok) {
    return res.status(402).json({ error: `payment not verified: ${verified.reason}` });
  }

  await Block.findOneAndUpdate(
    { blockId },
    {
      $set: {
        blockId,
        x: blockId % 500,
        y: Math.floor(blockId / 500),
        status: "PAYMENT_PENDING",
        owner: buyer.toLowerCase(),
        reservedBy: buyer.toLowerCase(),
        payee,
        paymentTxHash: txHash,
        chainId,
        paidAmount: verified.amount ? String(verified.amount) : undefined,
      },
      $setOnInsert: { expiresAt: new Date(Date.now() + RESERVATION_TTL_MS) },
    },
    { upsert: true }
  );

  res.json({ ok: true, blockId, status: "PAYMENT_PENDING", payee, txHash });
});

/**
 * POST /api/claim/confirm  body { blockId, txHash, chainId }
 * Optimistic / manual mark. The on-chain event listener is the real source of
 * truth and will overwrite this after the operator mints.
 */
router.post("/confirm", async (req, res) => {
  const blockId = Number(req.body.blockId);
  const { mintTx, chainId, owner } = req.body;
  const block = await Block.findOne({ blockId });
  if (!block) return res.status(404).json({ error: "block not found" });
  block.status = "CLAIMED";
  block.owner = (owner || block.owner || "").toLowerCase();
  if (mintTx) block.mintTx = mintTx;
  if (chainId) block.chainId = Number(chainId);
  block.claimedAt = new Date();
  await block.save();
  res.json({ ok: true });
});

module.exports = router;