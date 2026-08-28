// DEPRECATED — the voucher-signing system was removed.
//
// The new model has NO secret signer key: buyers pay a per-block disbursement
// address directly, the backend verifies the payment on-chain, and the operator
// mints via contracts/scripts/finalize.js using a key supplied only at mint time.
// This file is intentionally inert (never imported) so it cannot accidentally
// load a private key from env.
module.exports = {};
