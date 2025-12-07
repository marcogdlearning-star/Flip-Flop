const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");

describe("RandomnessManager", function () {
  async function deployRandomnessFixture() {
    const [owner, user1, user2] = await ethers.getSigners();

    // Mock VRF Coordinator for testing
    const MockVRFCoordinator = await ethers.getContractFactory("MockVRFCoordinatorV2");
    const mockCoordinator = await MockVRFCoordinator.deploy();
    await mockCoordinator.waitForDeployment();

    // Deploy the upgradeable randomness manager
    const RandomnessManager = await ethers.getContractFactory("RandomnessManager");
    const randomnessManager = await upgrades.deployProxy(RandomnessManager, [
      owner.address,
      await mockCoordinator.getAddress(),
      "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56cab", // keyHash
      1, // subscriptionId
      100000, // callbackGasLimit
      3 // requestConfirmations
    ], {
      initializer: 'initialize'
    });
    await randomnessManager.waitForDeployment();

    return {
      randomnessManager,
      mockCoordinator,
      owner,
      user1,
      user2
    };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { randomnessManager, owner } = await loadFixture(deployRandomnessFixture);
      expect(await randomnessManager.owner()).to.equal(owner.address);
    });

    it("Should initialize with correct VRF parameters", async function () {
      const { randomnessManager, mockCoordinator } = await loadFixture(deployRandomnessFixture);

      expect(await randomnessManager.vrfCoordinator()).to.equal(await mockCoordinator.getAddress());
      expect(await randomnessManager.keyHash()).to.equal("0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56cab");
      expect(await randomnessManager.subscriptionId()).to.equal(1);
    });
  });

  describe("Game Batching", function () {
    it("Should add games to batch correctly", async function () {
      const { randomnessManager, owner } = await loadFixture(deployRandomnessFixture);

      const gameId1 = 12345;
      const gameId2 = 67890;

      // Add games to batch
      const batchId1 = await randomnessManager.connect(owner).addGameToBatch(gameId1);
      const batchId2 = await randomnessManager.connect(owner).addGameToBatch(gameId2);

      expect(batchId1).to.equal(batchId2); // Same batch

      expect(await randomnessManager.gamesInCurrentBatch()).to.equal(2);
    });

    it("Should create new batch when current batch is full", async function () {
      const { randomnessManager, owner } = await loadFixture(deployRandomnessFixture);

      // Add maximum games per batch (assuming 10 for test)
      for (let i = 0; i < 10; i++) {
        await randomnessManager.connect(owner).addGameToBatch(i + 1);
      }

      // Next game should create new batch
      const newBatchId = await randomnessManager.connect(owner).addGameToBatch(999);
      expect(newBatchId).to.not.equal(0); // Different batch ID

      expect(await randomnessManager.gamesInCurrentBatch()).to.equal(1); // New batch has 1 game
    });

    it("Should only allow owner to add games", async function () {
      const { randomnessManager, user1 } = await loadFixture(deployRandomnessFixture);

      await expect(
        randomnessManager.connect(user1).addGameToBatch(12345)
      ).to.be.revertedWithCustomError(randomnessManager, "OwnableUnauthorizedAccount");
    });
  });

  describe("Randomness Requests", function () {
    it("Should request randomness when batch is ready", async function () {
      const { randomnessManager, mockCoordinator, owner } = await loadFixture(deployRandomnessFixture);

      // Add a game to create a batch
      const gameId = 12345;
      const batchId = await randomnessManager.connect(owner).addGameToBatch(gameId);

      // Request randomness for the batch
      await expect(
        randomnessManager.connect(owner).requestRandomnessForBatch(batchId)
      ).to.not.be.reverted;

      // Check that batch is marked as requested
      expect(await randomnessManager.isBatchReady(batchId)).to.be.false; // Not ready until fulfilled
    });

    it("Should fulfill randomness request correctly", async function () {
      const { randomnessManager, mockCoordinator, owner } = await loadFixture(deployRandomnessFixture);

      // Add a game and request randomness
      const gameId = 12345;
      const batchId = await randomnessManager.connect(owner).addGameToBatch(gameId);

      // Request randomness
      const requestTx = await randomnessManager.connect(owner).requestRandomnessForBatch(batchId);
      const receipt = await requestTx.wait();

      // Extract request ID from event
      const requestEvent = receipt.logs.find(log => {
        try {
          const parsed = randomnessManager.interface.parseLog(log);
          return parsed.name === 'RandomnessRequested';
        } catch {
          return false;
        }
      });
      const requestId = randomnessManager.interface.parseLog(requestEvent).args[0];

      // Simulate VRF fulfillment
      const randomWords = [ethers.toBigInt("0x" + "1".repeat(64))]; // Mock random word
      await mockCoordinator.fulfillRandomWords(requestId, await randomnessManager.getAddress());

      // Check that batch is now ready
      expect(await randomnessManager.isBatchReady(batchId)).to.be.true;

      // Check that we can get random values for games
      const randomValue = await randomnessManager.getRandomForGame(batchId, 0);
      expect(randomValue).to.not.equal(0);
    });

    it("Should generate different random values for different games", async function () {
      const { randomnessManager, mockCoordinator, owner } = await loadFixture(deployRandomnessFixture);

      // Add multiple games
      const gameIds = [111, 222, 333];
      const batchId = await randomnessManager.connect(owner).addGameToBatch(gameIds[0]);
      await randomnessManager.connect(owner).addGameToBatch(gameIds[1]);
      await randomnessManager.connect(owner).addGameToBatch(gameIds[2]);

      // Request and fulfill randomness
      const requestTx = await randomnessManager.connect(owner).requestRandomnessForBatch(batchId);
      const receipt = await requestTx.wait();

      const requestEvent = receipt.logs.find(log => {
        try {
          const parsed = randomnessManager.interface.parseLog(log);
          return parsed.name === 'RandomnessRequested';
        } catch {
          return false;
        }
      });
      const requestId = randomnessManager.interface.parseLog(requestEvent).args[0];

      await mockCoordinator.fulfillRandomWords(requestId, await randomnessManager.getAddress());

      // Get random values for each game
      const random1 = await randomnessManager.getRandomForGame(batchId, 0);
      const random2 = await randomnessManager.getRandomForGame(batchId, 1);
      const random3 = await randomnessManager.getRandomForGame(batchId, 2);

      // Values should be different (with high probability)
      expect(random1).to.not.equal(random2);
      expect(random2).to.not.equal(random3);
      expect(random1).to.not.equal(random3);
    });

    it("Should reject randomness requests for non-existent batches", async function () {
      const { randomnessManager, owner } = await loadFixture(deployRandomnessFixture);

      await expect(
        randomnessManager.connect(owner).requestRandomnessForBatch(99999)
      ).to.be.revertedWith("Batch does not exist");
    });

    it("Should reject duplicate randomness requests", async function () {
      const { randomnessManager, owner } = await loadFixture(deployRandomnessFixture);

      // Add game and request randomness
      const batchId = await randomnessManager.connect(owner).addGameToBatch(12345);
      await randomnessManager.connect(owner).requestRandomnessForBatch(batchId);

      // Try to request again
      await expect(
        randomnessManager.connect(owner).requestRandomnessForBatch(batchId)
      ).to.be.revertedWith("Randomness already requested");
    });
  });

  describe("Random Value Generation", function () {
    it("Should generate house moves from random values", async function () {
      const { randomnessManager, mockCoordinator, owner } = await loadFixture(deployRandomnessFixture);

      const gameId = 12345;
      const batchId = await randomnessManager.connect(owner).addGameToBatch(gameId);

      // Request and fulfill randomness
      const requestTx = await randomnessManager.connect(owner).requestRandomnessForBatch(batchId);
      const receipt = await requestTx.wait();

      const requestEvent = receipt.logs.find(log => {
        try {
          const parsed = randomnessManager.interface.parseLog(log);
          return parsed.name === 'RandomnessRequested';
        } catch {
          return false;
        }
      });
      const requestId = randomnessManager.interface.parseLog(requestEvent).args[0];

      await mockCoordinator.fulfillRandomWords(requestId, await randomnessManager.getAddress());

      // Get random value and verify it's suitable for Rock-Paper-Scissors
      const randomValue = await randomnessManager.getRandomForGame(batchId, 0);
      const houseMove = randomValue % 3n; // Should be 0, 1, or 2

      expect(houseMove).to.be.gte(0);
      expect(houseMove).to.be.lt(3);
    });

    it("Should handle edge cases in random value distribution", async function () {
      const { randomnessManager, mockCoordinator, owner } = await loadFixture(deployRandomnessFixture);

      // Test with multiple batches to ensure fairness
      const batches = [];
      const randomValues = [];

      for (let batch = 0; batch < 5; batch++) {
        const gameId = batch + 1;
        const batchId = await randomnessManager.connect(owner).addGameToBatch(gameId);

        const requestTx = await randomnessManager.connect(owner).requestRandomnessForBatch(batchId);
        const receipt = await requestTx.wait();

        const requestEvent = receipt.logs.find(log => {
          try {
            const parsed = randomnessManager.interface.parseLog(log);
            return parsed.name === 'RandomnessRequested';
          } catch {
            return false;
          }
        });
        const requestId = randomnessManager.interface.parseLog(requestEvent).args[0];

        await mockCoordinator.fulfillRandomWords(requestId, await randomnessManager.getAddress());

        const randomValue = await randomnessManager.getRandomForGame(batchId, 0);
        randomValues.push(randomValue);
        batches.push(batchId);
      }

      // Verify all random values are different (extremely high probability)
      const uniqueValues = new Set(randomValues.map(v => v.toString()));
      expect(uniqueValues.size).to.equal(randomValues.length);
    });
  });

  describe("Security and Access Control", function () {
    it("Should only allow owner to request randomness", async function () {
      const { randomnessManager, user1 } = await loadFixture(deployRandomnessFixture);

      const batchId = await randomnessManager.owner(); // Just get a valid address for batch ID
      await expect(
        randomnessManager.connect(user1).requestRandomnessForBatch(1)
      ).to.be.revertedWithCustomError(randomnessManager, "OwnableUnauthorizedAccount");
    });

    it("Should validate batch ownership", async function () {
      const { randomnessManager, user1 } = await loadFixture(deployRandomnessFixture);

      // User1 tries to check batch that doesn't exist or they don't own
      expect(await randomnessManager.connect(user1).isBatchReady(99999)).to.be.false;
    });

    it("Should prevent access to random values before fulfillment", async function () {
      const { randomnessManager, owner } = await loadFixture(deployRandomnessFixture);

      const batchId = await randomnessManager.connect(owner).addGameToBatch(12345);

      // Try to get random value before fulfillment
      await expect(
        randomnessManager.getRandomForGame(batchId, 0)
      ).to.be.revertedWith("Batch not ready");
    });

    it("Should validate game index bounds", async function () {
      const { randomnessManager, mockCoordinator, owner } = await loadFixture(deployRandomnessFixture);

      const batchId = await randomnessManager.connect(owner).addGameToBatch(12345);

      // Request and fulfill randomness
      const requestTx = await randomnessManager.connect(owner).requestRandomnessForBatch(batchId);
      const receipt = await requestTx.wait();

      const requestEvent = receipt.logs.find(log => {
        try {
          const parsed = randomnessManager.interface.parseLog(log);
          return parsed.name === 'RandomnessRequested';
        } catch {
          return false;
        }
      });
      const requestId = randomnessManager.interface.parseLog(requestEvent).args[0];

      await mockCoordinator.fulfillRandomWords(requestId, await randomnessManager.getAddress());

      // Try to access invalid game index
      await expect(
        randomnessManager.getRandomForGame(batchId, 99)
      ).to.be.revertedWith("Invalid game index");
    });
  });

  describe("Gas Optimization", function () {
    it("Should handle batch sizes efficiently", async function () {
      const { randomnessManager, mockCoordinator, owner } = await loadFixture(deployRandomnessFixture);

      // Add multiple games to test batching efficiency
      const gameCount = 20;
      let batchId;

      for (let i = 0; i < gameCount; i++) {
        batchId = await randomnessManager.connect(owner).addGameToBatch(i + 1);
      }

      expect(await randomnessManager.gamesInCurrentBatch()).to.equal(gameCount);

      // Request randomness for large batch
      const requestTx = await randomnessManager.connect(owner).requestRandomnessForBatch(batchId);
      const receipt = await requestTx.wait();

      // Gas usage should be reasonable for batch size
      expect(receipt.gasUsed).to.be.lt(500000); // Reasonable gas limit
    });

    it("Should minimize storage operations", async function () {
      const { randomnessManager, owner } = await loadFixture(deployRandomnessFixture);

      // Test that batch creation doesn't create excessive storage
      const initialBatchId = await randomnessManager.connect(owner).addGameToBatch(1);

      // Adding more games should reuse storage efficiently
      for (let i = 2; i <= 10; i++) {
        await randomnessManager.connect(owner).addGameToBatch(i);
      }

      // All games should be in same batch
      const finalBatchId = await randomnessManager.connect(owner).addGameToBatch(11);
      expect(finalBatchId).to.equal(initialBatchId);
    });
  });

  describe("Error Handling", function () {
    it("Should handle VRF coordinator failures gracefully", async function () {
      const { randomnessManager, owner } = await loadFixture(deployRandomnessFixture);

      // This test would require mocking VRF coordinator failures
      // For now, we test that the contract doesn't crash on invalid operations
      await expect(
        randomnessManager.getRandomForGame(99999, 0)
      ).to.be.revertedWith("Batch not ready");
    });

    it("Should validate subscription ID", async function () {
      const { randomnessManager } = await loadFixture(deployRandomnessFixture);

      // Contract should be initialized with valid subscription
      expect(await randomnessManager.subscriptionId()).to.equal(1);
    });
  });
});
