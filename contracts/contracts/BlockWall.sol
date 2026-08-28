// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title The 100,000 Block Wall
/// @notice One block = one ERC-721 minted to whoever pays the block's assigned
///         disbursement address.
///
/// @dev Payment model (no secret voucher key, no treasury, no user wallet sig):
///      - The payee list lives in the backend config so the operator can rotate
///        it without a redeploy. Each block maps to ONE payee at claim time.
///      - A buyer transfers the fee directly to that payee (a plain on-chain
///        transfer). That transfer is the on-chain proof-of-payment for the block.
///      - The operator verifies payment on-chain, then calls owner-only
///        finalizeBlock to mint the NFT to the buyer. Only the owner can mint,
///        so a block can never be minted twice: no front-running / double-claim
///        race, and no payment-binder signature is needed.
contract BlockWall is ERC721, Ownable, ReentrancyGuard {
    uint256 public constant TOTAL_BLOCKS = 100_000;

    mapping(uint256 => bool) public claimed;

    struct BlockRecord {
        address payee;
        string imageCid;
        string metadataCid;
        uint64 claimedAt;
    }
    mapping(uint256 => BlockRecord) public blockRecords;

    event BlockClaimed(
        uint256 indexed blockId,
        address indexed owner,
        address indexed payee,
        string imageCid,
        string metadataCid
    );

    constructor() ERC721("The 100,000 Block Wall", "BLOCK") Ownable(msg.sender) {}

    /// @notice Mint `blockId` to `buyer`. Owner-only (the operator).
    /// @param payee Disbursement address the buyer paid for this block; stored
    ///        and emitted so the intended destination is on-chain auditable.
    function finalizeBlock(
        uint256 blockId,
        address buyer,
        address payee,
        string calldata imageCid,
        string calldata metadataCid
    ) external onlyOwner nonReentrant {
        require(blockId < TOTAL_BLOCKS, "block id out of range");
        require(!claimed[blockId], "block already claimed");
        require(buyer != address(0), "invalid buyer");
        require(payee != address(0), "invalid payee");

        claimed[blockId] = true;
        blockRecords[blockId] = BlockRecord({
            payee: payee,
            imageCid: imageCid,
            metadataCid: metadataCid,
            claimedAt: uint64(block.timestamp)
        });

        _mint(buyer, blockId);
        emit BlockClaimed(blockId, buyer, payee, imageCid, metadataCid);
    }

    function payeeOf(uint256 blockId) public view returns (address) {
        return blockRecords[blockId].payee;
    }

    function isClaimed(uint256 blockId) external view returns (bool) {
        return claimed[blockId];
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        BlockRecord memory rec = blockRecords[tokenId];
        return string(abi.encodePacked("https://gateway.auto-drive.autonomys.xyz/", rec.metadataCid));
    }
}