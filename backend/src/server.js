require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const rateLimit = require("express-rate-limit");

const blocksRouter = require("./routes/blocks");
const claimRouter = require("./routes/claim");
const { startAllListeners } = require("./services/chainListener");
const { startSweeper } = require("./services/reservationSweeper");

const app = express();
app.use(cors());
app.use(express.json());

// Reservations and voucher issuance are the sensitive, abuse-prone
// endpoints — rate limit them harder than plain reads.
const claimLimiter = rateLimit({ windowMs: 60_000, max: 30 });
app.use("/api/claim", claimLimiter, claimRouter);
app.use("/api/blocks", blocksRouter);

app.get("/health", (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Mongo connected");

  startAllListeners();
  startSweeper();

  app.listen(PORT, () => console.log(`Block Wall API listening on :${PORT}`));
}

main().catch((err) => {
  console.error("Fatal startup error", err);
  process.exit(1);
});
