const { createAutoDriveApi, uploadFileFromBuffer, uploadObjectAsJSON } = require("@autonomys/auto-drive");
const { NetworkId } = require("@autonomys/auto-utils");

const api = createAutoDriveApi({
  apiKey: process.env.AUTO_DRIVE_API_KEY,
  network: process.env.AUTO_DRIVE_NETWORK === "taurus" ? NetworkId.TAURUS : NetworkId.MAINNET,
});

/**
 * Uploads a block's artwork image to Autonomys Auto Drive.
 * Returns the CID that gets embedded in the claim voucher and, once
 * claimed, in the on-chain BlockRecord.
 */
async function uploadArtwork(buffer, fileName, mimeType) {
  const cid = await uploadFileFromBuffer(api, buffer, fileName, {
    compression: true,
    onProgress: (pct) => {
      // Wire this into a websocket/SSE channel to drive the
      // "UPLOAD" progress bar in the claim flow UI.
    },
  });
  return cid;
}

/**
 * Uploads the block's metadata JSON (ERC-721 style: name, image CID,
 * attributes for X/Y coordinate, owner, claimedAt) as its own Auto Drive
 * object. This is the CID the contract's tokenURI() resolves to.
 */
async function uploadMetadata({ blockId, x, y, imageCid, owner }) {
  const metadata = {
    name: `Block #${String(blockId).padStart(6, "0")}`,
    description: "A permanently claimed block on The 100,000 Block Wall.",
    image: `https://gateway.auto-drive.autonomys.xyz/${imageCid}`,
    attributes: [
      { trait_type: "Block ID", value: blockId },
      { trait_type: "X", value: x },
      { trait_type: "Y", value: y },
      { trait_type: "Owner", value: owner },
    ],
  };
  const cid = await uploadObjectAsJSON(api, metadata, `block-${blockId}-metadata.json`, {});
  return { cid, metadata };
}

module.exports = { uploadArtwork, uploadMetadata };
