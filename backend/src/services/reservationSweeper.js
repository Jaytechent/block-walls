const Block = require("../models/Block");

/** Flips RESERVED/PAYMENT_PENDING blocks whose 5-minute window lapsed back to EXPIRED->AVAILABLE. */
async function sweepExpiredReservations() {
  const now = new Date();
  const result = await Block.updateMany(
    { status: { $in: ["RESERVED", "PAYMENT_PENDING"] }, expiresAt: { $lt: now } },
    { $set: { status: "AVAILABLE" }, $unset: { reservedBy: "", reservationId: "", expiresAt: "" } }
  );
  if (result.modifiedCount) {
    console.log(`[sweeper] released ${result.modifiedCount} expired reservation(s)`);
  }
}

function startSweeper(intervalMs = 30_000) {
  setInterval(() => sweepExpiredReservations().catch((e) => console.error("[sweeper] error", e)), intervalMs);
}

module.exports = { startSweeper, sweepExpiredReservations };
