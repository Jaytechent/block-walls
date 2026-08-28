const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BlockWall", function () {
  async function deployFixture() {
    const [owner, buyer, payee1, payee2, other] = await ethers.getSigners();
    const BlockWall = await ethers.getContractFactory("BlockWall");
    const wall = await BlockWall.deploy();
    return { wall, owner, buyer, payee1, payee2, other };
  }

  it("mints a block to the buyer and records the payee", async function () {
    const { wall, owner, buyer, payee1 } = await deployFixture();
    await expect(
      wall.connect(owner).finalizeBlock(42, buyer.address, payee1.address, "cid-i", "cid-m")
    )
      .to.emit(wall, "BlockClaimed")
      .withArgs(42, buyer.address, payee1.address, "cid-i", "cid-m");

    expect(await wall.ownerOf(42)).to.equal(buyer.address);
    expect(await wall.isClaimed(42)).to.equal(true);
    expect(await wall.payeeOf(42)).to.equal(payee1.address);
  });

  it("only the owner (operator) can finalize a mint", async function () {
    const { wall, buyer, payee1, other } = await deployFixture();
    await expect(
      wall.connect(other).finalizeBlock(5, buyer.address, payee1.address, "a", "b")
    )
      .to.be.revertedWithCustomError(wall, "OwnableUnauthorizedAccount")
      .withArgs(other.address);
  });

  it("cannot claim the same block twice", async function () {
    const { wall, owner, buyer, payee1 } = await deployFixture();
    await wall.connect(owner).finalizeBlock(7, buyer.address, payee1.address, "a", "b");
    await expect(
      wall.connect(owner).finalizeBlock(7, buyer.address, payee1.address, "a", "b")
    ).to.be.revertedWith("block already claimed");
  });

  it("rejects invalid block ids and zero addresses", async function () {
    const { wall, owner, buyer, payee1 } = await deployFixture();
    await expect(
      wall.connect(owner).finalizeBlock(100001, buyer.address, payee1.address, "a", "b")
    ).to.be.revertedWith("block id out of range");

    await expect(
      wall.connect(owner).finalizeBlock(1, ethers.ZeroAddress, payee1.address, "a", "b")
    ).to.be.revertedWith("invalid buyer");

    await expect(
      wall.connect(owner).finalizeBlock(1, buyer.address, ethers.ZeroAddress, "a", "b")
    ).to.be.revertedWith("invalid payee");
  });
});
