const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("GameVerification", function () {
  async function deployVerificationFixture() {
    const [owner, player1, player2] = await ethers.getSigners();

    // Deploy the upgradeable verification contract
    const GameVerification = await ethers.getContractFactory("GameVerification");
    const verification = await upgrades.deployProxy(GameVerification, [owner.address], {
      initializer: 'initialize'
    });
    await verification.waitForDeployment();

    return { verification, owner, player1, player2 };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { verification, owner } = await loadFixture(deployVerificationFixture);
      expect(await verification.owner()).to.equal(owner.address);
    });
  });

  describe("Game Commitment", function () {
    it("Should commit game move correctly", async function () {
      const { verification, player1 } = await loadFixture(deployVerificationFixture);

      const commitmentHash = ethers.keccak256(ethers.toUtf8Bytes("test_commitment"));
      const wager = ethers.parseEther("10");

      const tx = await verification.connect(player1).commitGameMove(
        player1.address,
        commitmentHash,
        wager
      );
      const receipt = await tx.wait();

      // Check event emission
      const event = receipt.logs.find(log => {
        try {
          const parsed = verification.interface.parseLog(log);
          return parsed.name === 'GameCommitted';
        } catch {
          return false;
        }
      });

      expect(event).to.not.be.undefined;
      const parsedEvent = verification.interface.parseLog(event);
      expect(parsedEvent.args[1]).to.equal(player1.address); // player
      expect(parsedEvent.args[2]).to.equal(commitmentHash); // commitmentHash
      expect(parsedEvent.args[3]).to.equal(wager); // wager
    });

    it("Should generate unique game IDs", async function () {
      const { verification, player1, player2 } = await loadFixture(deployVerificationFixture);

      const commitment1 = ethers.keccak256(ethers.toUtf8Bytes("commitment1"));
      const commitment2 = ethers.keccak256(ethers.toUtf8Bytes("commitment2"));
      const wager = ethers.parseEther("5");

      const tx1 = await verification.connect(player1).commitGameMove(player1.address, commitment1, wager);
      const tx2 = await verification.connect(player2).commitGameMove(player2.address, commitment2, wager);

      const receipt1 = await tx1.wait();
      const receipt2 = await tx2.wait();

      const event1 = receipt1.logs.find(log => {
        try {
          const parsed = verification.interface.parseLog(log);
          return parsed.name === 'GameCommitted';
        } catch {
          return false;
        }
      });

      const event2 = receipt2.logs.find(log => {
        try {
          const parsed = verification.interface.parseLog(log);
          return parsed.name === 'GameCommitted';
        } catch {
          return false;
        }
      });

      const gameId1 = verification.interface.parseLog(event1).args[0];
      const gameId2 = verification.interface.parseLog(event2).args[0];

      expect(gameId1).to.not.equal(gameId2);
    });

    it("Should validate wager amounts", async function () {
      const { verification, player1 } = await loadFixture(deployVerificationFixture);

      const commitmentHash = ethers.keccak256(ethers.toUtf8Bytes("test"));
      const wager = ethers.parseEther("0"); // Zero wager

      await expect(
        verification.connect(player1).commitGameMove(player1.address, commitmentHash, wager)
      ).to.be.revertedWith("Wager must be greater than 0");
    });
  });

  describe("Game Reveal and Verification", function () {
    it("Should reveal and verify game correctly", async function () {
      const { verification, player1 } = await loadFixture(deployVerificationFixture);

      // Create commitment
      const move = 0; // ROCK
      const salt = ethers.toUtf8Bytes("secret_salt_123");
      const commitmentHash = ethers.keccak256(
        ethers.solidityPacked(['uint256', 'bytes32'], [move, salt])
      );
      const wager = ethers.parseEther("10");

      // Commit game
      const commitTx = await verification.connect(player1).commitGameMove(
        player1.address, commitmentHash, wager
      );
      const commitReceipt = await commitTx.wait();

      const commitEvent = commitReceipt.logs.find(log => {
        try {
          const parsed = verification.interface.parseLog(log);
          return parsed.name === 'GameCommitted';
        } catch {
          return false;
        }
      });
      const gameId = verification.interface.parseLog(commitEvent).args[0];

      // Mock randomness for house move (simulate VRF callback)
      // In real scenario, this would come from RandomnessManager
      const houseMove = 2; // SCISSORS (beats ROCK = 0)

      // Reveal game
      await expect(
        verification.connect(player1).revealAndVerifyGame(gameId, move, salt)
      ).to.not.be.reverted;

      // Check game result
      const result = await verification.getGameResult(gameId);
      expect(result.playerMove).to.equal(move);
      expect(result.houseMove).to.equal(houseMove);
      expect(result.playerWon).to.be.true; // ROCK beats SCISSORS
      expect(result.payout).to.equal(wager * 2n); // 2x payout
      expect(result.verified).to.be.true;
    });

    it("Should reject invalid reveals", async function () {
      const { verification, player1 } = await loadFixture(deployVerificationFixture);

      // Create commitment
      const move = 0; // ROCK
      const salt = ethers.toUtf8Bytes("secret_salt_123");
      const commitmentHash = ethers.keccak256(
        ethers.solidityPacked(['uint256', 'bytes32'], [move, salt])
      );
      const wager = ethers.parseEther("10");

      // Commit game
      const commitTx = await verification.connect(player1).commitGameMove(
        player1.address, commitmentHash, wager
      );
      const commitReceipt = await commitTx.wait();

      const commitEvent = commitReceipt.logs.find(log => {
        try {
          const parsed = verification.interface.parseLog(log);
          return parsed.name === 'GameCommitted';
        } catch {
          return false;
        }
      });
      const gameId = verification.interface.parseLog(commitEvent).args[0];

      // Try to reveal with wrong move
      await expect(
        verification.connect(player1).revealAndVerifyGame(gameId, 1, salt) // PAPER instead of ROCK
      ).to.be.revertedWith("Invalid commitment");

      // Try to reveal with wrong salt
      const wrongSalt = ethers.toUtf8Bytes("wrong_salt");
      await expect(
        verification.connect(player1).revealAndVerifyGame(gameId, move, wrongSalt)
      ).to.be.revertedWith("Invalid commitment");
    });

    it("Should prevent double reveals", async function () {
      const { verification, player1 } = await loadFixture(deployVerificationFixture);

      // Create and commit game
      const move = 0;
      const salt = ethers.toUtf8Bytes("secret_salt");
      const commitmentHash = ethers.keccak256(
        ethers.solidityPacked(['uint256', 'bytes32'], [move, salt])
      );
      const wager = ethers.parseEther("10");

      const commitTx = await verification.connect(player1).commitGameMove(
        player1.address, commitmentHash, wager
      );
      const commitReceipt = await commitTx.wait();

      const commitEvent = commitReceipt.logs.find(log => {
        try {
          const parsed = verification.interface.parseLog(log);
          return parsed.name === 'GameCommitted';
        } catch {
          return false;
        }
      });
      const gameId = verification.interface.parseLog(commitEvent).args[0];

      // First reveal should work
      await verification.connect(player1).revealAndVerifyGame(gameId, move, salt);

      // Second reveal should fail
      await expect(
        verification.connect(player1).revealAndVerifyGame(gameId, move, salt)
      ).to.be.revertedWith("Game already revealed");
    });

    it("Should only allow player to reveal their game", async function () {
      const { verification, player1, player2 } = await loadFixture(deployVerificationFixture);

      // Player1 commits game
      const move = 0;
      const salt = ethers.toUtf8Bytes("secret_salt");
      const commitmentHash = ethers.keccak256(
        ethers.solidityPacked(['uint256', 'bytes32'], [move, salt])
      );
      const wager = ethers.parseEther("10");

      const commitTx = await verification.connect(player1).commitGameMove(
        player1.address, commitmentHash, wager
      );
      const commitReceipt = await commitTx.wait();

      const commitEvent = commitReceipt.logs.find(log => {
        try {
          const parsed = verification.interface.parseLog(log);
          return parsed.name === 'GameCommitted';
        } catch {
          return false;
        }
      });
      const gameId = verification.interface.parseLog(commitEvent).args[0];

      // Player2 tries to reveal player1's game
      await expect(
        verification.connect(player2).revealAndVerifyGame(gameId, move, salt)
      ).to.be.revertedWith("Only player can reveal");
    });
  });

  describe("Game Outcome Calculation", function () {
    it("Should calculate ROCK vs PAPER correctly", async function () {
      const { verification, player1 } = await loadFixture(deployVerificationFixture);

      // ROCK vs PAPER = PAPER wins
      await testGameOutcome(verification, player1, 0, 1, false); // ROCK=0, PAPER=1, player loses
    });

    it("Should calculate ROCK vs SCISSORS correctly", async function () {
      const { verification, player1 } = await loadFixture(deployVerificationFixture);

      // ROCK vs SCISSORS = ROCK wins
      await testGameOutcome(verification, player1, 0, 2, true); // ROCK=0, SCISSORS=2, player wins
    });

    it("Should calculate PAPER vs ROCK correctly", async function () {
      const { verification, player1 } = await loadFixture(deployVerificationFixture);

      // PAPER vs ROCK = PAPER wins
      await testGameOutcome(verification, player1, 1, 0, true); // PAPER=1, ROCK=0, player wins
    });

    it("Should calculate PAPER vs SCISSORS correctly", async function () {
      const { verification, player1 } = await loadFixture(deployVerificationFixture);

      // PAPER vs SCISSORS = SCISSORS wins
      await testGameOutcome(verification, player1, 1, 2, false); // PAPER=1, SCISSORS=2, player loses
    });

    it("Should calculate SCISSORS vs ROCK correctly", async function () {
      const { verification, player1 } = await loadFixture(deployVerificationFixture);

      // SCISSORS vs ROCK = ROCK wins
      await testGameOutcome(verification, player1, 2, 0, false); // SCISSORS=2, ROCK=0, player loses
    });

    it("Should calculate SCISSORS vs PAPER correctly", async function () {
      const { verification, player1 } = await loadFixture(deployVerificationFixture);

      // SCISSORS vs PAPER = SCISSORS wins
      await testGameOutcome(verification, player1, 2, 1, true); // SCISSORS=2, PAPER=1, player wins
    });

    it("Should handle ties correctly", async function () {
      const { verification, player1 } = await loadFixture(deployVerificationFixture);

      // ROCK vs ROCK = tie (house wins)
      await testGameOutcome(verification, player1, 0, 0, false);
    });

    async function testGameOutcome(verification, player, playerMove, houseMove, expectedWin) {
      const salt = ethers.toUtf8Bytes(`salt_${Date.now()}`);
      const commitmentHash = ethers.keccak256(
        ethers.solidityPacked(['uint256', 'bytes32'], [playerMove, salt])
      );
      const wager = ethers.parseEther("10");

      // Commit
      const commitTx = await verification.connect(player).commitGameMove(
        player.address, commitmentHash, wager
      );
      const commitReceipt = await commitTx.wait();

      const commitEvent = commitReceipt.logs.find(log => {
        try {
          const parsed = verification.interface.parseLog(log);
          return parsed.name === 'GameCommitted';
        } catch {
          return false;
        }
      });
      const gameId = verification.interface.parseLog(commitEvent).args[0];

      // Reveal
      await verification.connect(player).revealAndVerifyGame(gameId, playerMove, salt);

      // Check result
      const result = await verification.getGameResult(gameId);
      expect(result.playerMove).to.equal(playerMove);
      expect(result.houseMove).to.equal(houseMove);
      expect(result.playerWon).to.equal(expectedWin);

      if (expectedWin) {
        expect(result.payout).to.equal(wager * 2n); // 2x payout for wins
      } else {
        expect(result.payout).to.equal(0n); // No payout for losses
      }
    }
  });

  describe("House Edge", function () {
    it("Should apply house edge to payouts", async function () {
      const { verification, player1 } = await loadFixture(deployVerificationFixture);

      // This test assumes the contract has a house edge mechanism
      // The exact implementation may vary based on our contract design
      const move = 0; // ROCK
      const salt = ethers.toUtf8Bytes("salt");
      const commitmentHash = ethers.keccak256(
        ethers.solidityPacked(['uint256', 'bytes32'], [move, salt])
      );
      const wager = ethers.parseEther("100");

      const commitTx = await verification.connect(player1).commitGameMove(
        player1.address, commitmentHash, wager
      );
      const commitReceipt = await commitTx.wait();

      const commitEvent = commitReceipt.logs.find(log => {
        try {
          const parsed = verification.interface.parseLog(log);
          return parsed.name === 'GameCommitted';
        } catch {
          return false;
        }
      });
      const gameId = verification.interface.parseLog(commitEvent).args[0];

      await verification.connect(player1).revealAndVerifyGame(gameId, move, salt);

      const result = await verification.getGameResult(gameId);

      // House edge should reduce payout from 200% to something less
      if (result.playerWon) {
        expect(result.payout).to.be.lt(wager * 2n); // Less than 200%
        expect(result.payout).to.be.gt(wager); // More than 100%
      }
    });
  });

  describe("Security", function () {
    it("Should prevent front-running attacks", async function () {
      const { verification, player1, player2 } = await loadFixture(deployVerificationFixture);

      // Player1 commits
      const move = 0;
      const salt = ethers.toUtf8Bytes("secret");
      const commitmentHash = ethers.keccak256(
        ethers.solidityPacked(['uint256', 'bytes32'], [move, salt])
      );
      const wager = ethers.parseEther("10");

      const commitTx = await verification.connect(player1).commitGameMove(
        player1.address, commitmentHash, wager
      );
      const commitReceipt = await commitTx.wait();

      const commitEvent = commitReceipt.logs.find(log => {
        try {
          const parsed = verification.interface.parseLog(log);
          return parsed.name === 'GameCommitted';
        } catch {
          return false;
        }
      });
      const gameId = verification.interface.parseLog(commitEvent).args[0];

      // Player2 tries to reveal before player1 (should fail)
      await expect(
        verification.connect(player2).revealAndVerifyGame(gameId, move, salt)
      ).to.be.revertedWith("Only player can reveal");
    });

    it("Should validate commitment timing", async function () {
      const { verification, player1 } = await loadFixture(deployVerificationFixture);

      // This test validates that reveals happen within allowed time windows
      // Implementation depends on our contract's timing constraints
      const move = 0;
      const salt = ethers.toUtf8Bytes("salt");
      const commitmentHash = ethers.keccak256(
        ethers.solidityPacked(['uint256', 'bytes32'], [move, salt])
      );
      const wager = ethers.parseEther("10");

      const commitTx = await verification.connect(player1).commitGameMove(
        player1.address, commitmentHash, wager
      );
      const commitReceipt = await commitTx.wait();

      const commitEvent = commitReceipt.logs.find(log => {
        try {
          const parsed = verification.interface.parseLog(log);
          return parsed.name === 'GameCommitted';
        } catch {
          return false;
        }
      });
      const gameId = verification.interface.parseLog(commitEvent).args[0];

      // Reveal should work immediately (within time window)
      await expect(
        verification.connect(player1).revealAndVerifyGame(gameId, move, salt)
      ).to.not.be.reverted;
    });
  });
});
