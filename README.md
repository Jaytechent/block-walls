# The 100,000 Block Wall

$1. One block. Your mark. Forever. A collaborative 500×200 (100,000 block) wall,
claimable on Robinhood Chain, Base, Arbitrum, Optimism, BNB Smart Chain, and
Polygon, with artwork stored on Autonomys Auto Drive.

## What's fully implemented

- **Smart contract** (`contracts/contracts/BlockWall.sol`): ERC-721, one token per
  block, **owner-only `finalizeBlock(blockId, buyer, payee, ...)`**. No voucher
  signer, no treasury, no user wallet signature. A block can only ever be
  minted once, by the operator, so front-running / double-claim races (across all
  chains) are structurally impossible.
- **Payment model**: buyers pay **directly to a per-block disbursement address**
  (list loaded off-chain via `PAYEES` env or `backend/payees.json`; each block
  maps deterministically to one address via `payeeForBlock`). The backend
  verifies the buyer's payment tx **on-chain** (`services/verifyPayment.js`)
  before the operator mints. The payee is stored on-chain per mint for an audit
  trail. No private key is baked into the contract; the operator's minting key is
  supplied only at mint time (`contracts/scripts/finalize.js`), never in `.env`.
- **Backend** (`backend/`): reservation system, Autonomys Auto Drive artwork
  upload, an `/api/claim/payinfo` endpoint (returns the payee + price for a
  block), an `/api/claim/submit` endpoint that verifies payment on-chain, and a
  per-chain `BlockClaimed` listener that reconciles MongoDB against the chain
  that actually mints — this is what keeps "one wall, six chains" safe.

## What's stubbed / needs your input before production

- **Native-token pricing** (`backend/src/routes/claim.js`,
  `getNativeWeiForOneUsd`): $1 in ETH/BNB terms needs a live price feed
  (Chainlink where available) — left as a stub since Robinhood Chain's
  feed availability wasn't something I could verify.
- **Robinhood Chain RPC/explorer URLs**: placeholders in
  `hardhat.config.js` / `config/chains.js` — swap in the real endpoints.
- **CREATE2 deterministic deployment**: `scripts/deploy.js` deploys
  directly; wire in a deterministic-deployment-proxy call if you want the
  identical contract address across all six chains.
- **Moderation queue**: `moderationStatus` field exists on the Block model
  and artwork is marked `PENDING_REVIEW` on upload, but there's no
  admin review UI yet (spec's screen #16).
- **Secondary pages** (Block Detail, Checkout, Success, Search, Partners,
  Admin/Moderation UI, Leaderboard/Activity feed): Explore/FAQ/About/My
  Blocks/How It Works/Onchain are built; the rest are straightforward
  extensions of the same patterns (Block Detail ≈ ClaimDrawer's CONFIRMED
  state as a standalone route, Activity feed ≈ subscribing to
  `BlockClaimed` over a websocket instead of polling).

## Setup

```bash
# 1. Contracts
cd contracts && npm install
cp .env.example .env   # fill in DEPLOYER_PRIVATE_KEY, VOUCHER_SIGNER_ADDRESS, TREASURY_ADDRESS
npx hardhat test
npx hardhat run scripts/deploy.js --network base   # repeat per chain

# 2. Backend
cd ../backend && npm install
cp .env.example .env   # fill in MONGODB_URI, PAYEES (your disbursement addresses), AUTO_DRIVE_API_KEY, CONTRACT_* addresses
npm run dev

# 3. Operator mints (run only after verifying a buyer's payment on-chain)
$env:BLOCK_ID=42; $env:BUYER=0x...; $env:PAYEE=0x...; $env:CONTRACT_ADDRESS=0x...
$env:OPERATOR_PRIVATE_KEY=<your key, at runtime, NOT in .env>
npx hardhat run scripts/finalize.js --network base

# 4. Frontend
cd ../frontend && npm install
cp .env.example .env   # VITE_API_URL (no wallet-connect / secret needed)
npm run dev
```

There is **no `VOUCHER_SIGNER_PRIVATE_KEY` and no `TREASURY_ADDRESS`** anymore.
Buyers pay a per-block disbursement address (from `PAYEES` / `backend/payees.json`);
the backend verifies the payment on-chain; the operator mints with a key supplied
only at mint time. The only secret in the whole system is the operator's own
wallet key, which should live in a KMS/HSM (AWS KMS, Turnkey) — not in `.env`.

## Security notes before mainnet

- Get the contract audited — it drives real payments across six chains.
- Keep the operator's minting key in a KMS/HSM (AWS KMS, Turnkey), never in `.env`
  and never on the API server. The server itself holds NO private key.
- The server's `/api/claim/submit` verifies payment on the same chain the buyer
  paid on, so a fake/off-chain tx hash is rejected.
- Rate limiting is in place on `/api/claim/*` (30 req/min) but tune it
  under real traffic, and add CAPTCHA/PoW on `/reserve` if bot-claiming
  becomes an issue given $1 is cheap to grief with.
