const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("FlipFlopToken", function () {
  async function deployTokenFixture() {
    const [owner, user1, user2, minter, burner] = await ethers.getSigners();

    // Deploy the upgradeable token contract
    const FlipFlopToken = await ethers.getContractFactory("FlipFlopToken");
    const token = await upgrades.deployProxy(FlipFlopToken, [owner.address], {
      initializer: 'initialize'
    });
    await token.waitForDeployment();

    return { token, owner, user1, user2, minter, burner };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { token, owner } = await loadFixture(deployTokenFixture);
      expect(await token.owner()).to.equal(owner.address);
    });

    it("Should have correct name and symbol", async function () {
      const { token } = await loadFixture(deployTokenFixture);
      expect(await token.name()).to.equal("FlipFlop Token");
      expect(await token.symbol()).to.equal("FLIP");
    });

    it("Should have 18 decimals", async function () {
      const { token } = await loadFixture(deployTokenFixture);
      expect(await token.decimals()).to.equal(18);
    });

    it("Should start with zero total supply", async function () {
      const { token } = await loadFixture(deployTokenFixture);
      expect(await token.totalSupply()).to.equal(0);
    });
  });

  describe("Minting", function () {
    it("Should allow owner to mint tokens", async function () {
      const { token, owner, user1 } = await loadFixture(deployTokenFixture);
      const mintAmount = ethers.parseEther("1000");

      await token.connect(owner).mint(user1.address, mintAmount);

      expect(await token.balanceOf(user1.address)).to.equal(mintAmount);
      expect(await token.totalSupply()).to.equal(mintAmount);
    });

    it("Should emit Transfer event on mint", async function () {
      const { token, owner, user1 } = await loadFixture(deployTokenFixture);
      const mintAmount = ethers.parseEther("500");

      await expect(token.connect(owner).mint(user1.address, mintAmount))
        .to.emit(token, "Transfer")
        .withArgs(ethers.ZeroAddress, user1.address, mintAmount);
    });

    it("Should not allow non-owner to mint tokens", async function () {
      const { token, user1, user2 } = await loadFixture(deployTokenFixture);
      const mintAmount = ethers.parseEther("100");

      await expect(
        token.connect(user1).mint(user2.address, mintAmount)
      ).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");
    });
  });

  describe("Burning", function () {
    it("Should allow owner to burn tokens", async function () {
      const { token, owner, user1 } = await loadFixture(deployTokenFixture);
      const mintAmount = ethers.parseEther("1000");
      const burnAmount = ethers.parseEther("300");

      // First mint some tokens
      await token.connect(owner).mint(user1.address, mintAmount);
      expect(await token.balanceOf(user1.address)).to.equal(mintAmount);

      // Then burn them
      await token.connect(owner).burn(user1.address, burnAmount);

      expect(await token.balanceOf(user1.address)).to.equal(mintAmount - burnAmount);
      expect(await token.totalSupply()).to.equal(mintAmount - burnAmount);
    });

    it("Should emit Transfer event on burn", async function () {
      const { token, owner, user1 } = await loadFixture(deployTokenFixture);
      const mintAmount = ethers.parseEther("500");
      const burnAmount = ethers.parseEther("200");

      await token.connect(owner).mint(user1.address, mintAmount);

      await expect(token.connect(owner).burn(user1.address, burnAmount))
        .to.emit(token, "Transfer")
        .withArgs(user1.address, ethers.ZeroAddress, burnAmount);
    });

    it("Should not allow burning more than balance", async function () {
      const { token, owner, user1 } = await loadFixture(deployTokenFixture);
      const mintAmount = ethers.parseEther("100");
      const burnAmount = ethers.parseEther("200");

      await token.connect(owner).mint(user1.address, mintAmount);

      await expect(
        token.connect(owner).burn(user1.address, burnAmount)
      ).to.be.revertedWith("ERC20: burn amount exceeds balance");
    });

    it("Should not allow non-owner to burn tokens", async function () {
      const { token, user1, user2 } = await loadFixture(deployTokenFixture);
      const mintAmount = ethers.parseEther("100");

      await token.connect(await ethers.getSigners()[0]).mint(user1.address, mintAmount);

      await expect(
        token.connect(user2).burn(user1.address, mintAmount)
      ).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");
    });
  });

  describe("Transfers", function () {
    it("Should allow token transfers between users", async function () {
      const { token, owner, user1, user2 } = await loadFixture(deployTokenFixture);
      const mintAmount = ethers.parseEther("1000");
      const transferAmount = ethers.parseEther("300");

      // Mint tokens to user1
      await token.connect(owner).mint(user1.address, mintAmount);

      // Transfer from user1 to user2
      await token.connect(user1).transfer(user2.address, transferAmount);

      expect(await token.balanceOf(user1.address)).to.equal(mintAmount - transferAmount);
      expect(await token.balanceOf(user2.address)).to.equal(transferAmount);
    });

    it("Should emit Transfer event on transfer", async function () {
      const { token, owner, user1, user2 } = await loadFixture(deployTokenFixture);
      const mintAmount = ethers.parseEther("500");
      const transferAmount = ethers.parseEther("200");

      await token.connect(owner).mint(user1.address, mintAmount);

      await expect(token.connect(user1).transfer(user2.address, transferAmount))
        .to.emit(token, "Transfer")
        .withArgs(user1.address, user2.address, transferAmount);
    });

    it("Should not allow transfer exceeding balance", async function () {
      const { token, owner, user1, user2 } = await loadFixture(deployTokenFixture);
      const mintAmount = ethers.parseEther("100");
      const transferAmount = ethers.parseEther("200");

      await token.connect(owner).mint(user1.address, mintAmount);

      await expect(
        token.connect(user1).transfer(user2.address, transferAmount)
      ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
    });
  });

  describe("Approvals", function () {
    it("Should allow approval and transferFrom", async function () {
      const { token, owner, user1, user2, user3 } = await loadFixture(deployTokenFixture);
      const mintAmount = ethers.parseEther("1000");
      const approveAmount = ethers.parseEther("500");
      const transferAmount = ethers.parseEther("300");

      // Mint tokens to user1
      await token.connect(owner).mint(user1.address, mintAmount);

      // User1 approves user2 to spend tokens
      await token.connect(user1).approve(user2.address, approveAmount);

      expect(await token.allowance(user1.address, user2.address)).to.equal(approveAmount);

      // User2 transfers from user1 to user3
      await token.connect(user2).transferFrom(user1.address, user3.address, transferAmount);

      expect(await token.balanceOf(user1.address)).to.equal(mintAmount - transferAmount);
      expect(await token.balanceOf(user3.address)).to.equal(transferAmount);
      expect(await token.allowance(user1.address, user2.address)).to.equal(approveAmount - transferAmount);
    });

    it("Should emit Approval event", async function () {
      const { token, user1, user2 } = await loadFixture(deployTokenFixture);
      const approveAmount = ethers.parseEther("500");

      await expect(token.connect(user1).approve(user2.address, approveAmount))
        .to.emit(token, "Approval")
        .withArgs(user1.address, user2.address, approveAmount);
    });
  });

  describe("Upgradeability", function () {
    it("Should be upgradeable by owner", async function () {
      const { token, owner } = await loadFixture(deployTokenFixture);

      // Deploy new implementation
      const FlipFlopTokenV2 = await ethers.getContractFactory("FlipFlopToken");
      const upgradedToken = await upgrades.upgradeProxy(token.target, FlipFlopTokenV2);

      // Should maintain state
      expect(await upgradedToken.owner()).to.equal(owner.address);
      expect(await upgradedToken.name()).to.equal("FlipFlop Token");
    });

    it("Should not allow non-owner to upgrade", async function () {
      const { token, user1 } = await loadFixture(deployTokenFixture);

      const FlipFlopTokenV2 = await ethers.getContractFactory("FlipFlopToken");

      await expect(
        upgrades.upgradeProxy(token.target, FlipFlopTokenV2.connect(user1))
      ).to.be.reverted;
    });
  });
});
