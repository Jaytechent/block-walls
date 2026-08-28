const mongoose = require("mongoose");

/**
 * MongoDB is the fast-read index/cache for the wall UI. The blockchain
 * (per-chain BlockWall contract) is the final source of truth for
 * ownership. A block only becomes CLAIMED here after the chain event
 * listener confirms the mint on-chain.
 */
const BlockSchema = new mongoose.Schema(
  {
    blockId: { type: Number, required: true, unique: true, index: true, min: 0, max: 99999 },
    x: { type: Number, required: true },
    y: { type: Number, required: true },

    status: {
      type: String,
      enum: ["AVAILABLE", "RESERVED", "PAYMENT_PENDING", "CLAIMED", "EXPIRED"],
      default: "AVAILABLE",
      index: true,
    },

    owner: { type: String, lowercase: true, index: true },
    tokenId: { type: Number },
    chainId: { type: Number },
    contractAddress: { type: String },
    mintTx: { type: String },
    blockNumber: { type: Number },

    // New payment model: which disbursement address this block was paid to,
    // and the on-chain payment tx the buyer submitted.
    payee: { type: String, lowercase: true },
    paymentTxHash: { type: String },
    paidAmount: { type: String },

    imageCid: { type: String },
    metadataCid: { type: String },
    storageTx: { type: String },

    reservedBy: { type: String, lowercase: true },
    reservationId: { type: String },
    reservedAt: { type: Date },
    expiresAt: { type: Date },

    moderationStatus: {
      type: String,
      enum: ["PENDING_REVIEW", "APPROVED", "REJECTED"],
      default: "PENDING_REVIEW",
    },

    claimedAt: { type: Date },
  },
  { timestamps: true }
);

BlockSchema.index({ status: 1, expiresAt: 1 });

module.exports = mongoose.model("Block", BlockSchema);
