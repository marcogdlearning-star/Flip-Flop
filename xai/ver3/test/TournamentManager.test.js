const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");

describe("TournamentManager", function () {
  async function deployTournamentFixture() {
    const [owner, player1, player2, player3] = await ethers.getSigners();

    // Deploy mock token for entry fees
    const MockToken = await ethers.getContractFactory("FlipFlopToken");
    const mockToken = await upgrades.deployProxy(MockToken, [owner.address], {
      initializer: 'initialize'
    });
    await mockToken.waitForDeployment();

    // Deploy the upgradeable tournament manager
    const TournamentManager = await ethers.getContractFactory("TournamentManager");
    const tournamentManager = await upgrades.deployProxy(TournamentManager, [
      owner.address,
      await mockToken.getAddress()
    ], {
      initializer: 'initialize'
    });
    await tournamentManager.waitForDeployment();

    // Mint tokens to players for testing
    await mockToken.connect(owner).mint(player1.address, ethers.parseEther("1000"));
    await mockToken.connect(owner).mint(player2.address, ethers.parseEther("1000"));
    await mockToken.connect(owner).mint(player3.address, ethers.parseEther("1000"));

    return {
      tournamentManager,
      mockToken,
      owner,
      player1,
      player2,
      player3
    };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { tournamentManager, owner } = await loadFixture(deployTournamentFixture);
      expect(await tournamentManager.owner()).to.equal(owner.address);
    });

    it("Should initialize with correct token address", async function () {
      const { tournamentManager, mockToken } = await loadFixture(deployTournamentFixture);
      expect(await tournamentManager.token()).to.equal(await mockToken.getAddress());
    });
  });

  describe("Tournament Creation", function () {
    it("Should create tournament correctly", async function () {
      const { tournamentManager, owner } = await loadFixture(deployTournamentFixture);

      const name = "Weekly Championship";
      const entryFee = ethers.parseEther("50");
      const maxParticipants = 32;
      const registrationPeriod = 7 * 24 * 60 * 60; // 7 days
      const houseContribution = ethers.parseEther("500");

      const tx = await tournamentManager.connect(owner).createTournament(
        name,
        entryFee,
        maxParticipants,
        registrationPeriod,
        houseContribution
      );
      const receipt = await tx.wait();

      // Check event emission
      const event = receipt.logs.find(log => {
        try {
          const parsed = tournamentManager.interface.parseLog(log);
          return parsed.name === 'TournamentCreated';
        } catch {
          return false;
        }
      });

      expect(event).to.not.be.undefined;
      const parsedEvent = tournamentManager.interface.parseLog(event);
      const tournamentId = parsedEvent.args[0];

      // Verify tournament data
      const tournament = await tournamentManager.tournaments(tournamentId);
      expect(tournament.name).to.equal(name);
      expect(tournament.entryFee).to.equal(entryFee);
      expect(tournament.maxParticipants).to.equal(maxParticipants);
      expect(tournament.status).to.equal(0); // Registration status
    });

    it("Should only allow owner to create tournaments", async function () {
      const { tournamentManager, player1 } = await loadFixture(deployTournamentFixture);

      await expect(
        tournamentManager.connect(player1).createTournament(
          "Test Tournament",
          ethers.parseEther("10"),
          16,
          24 * 60 * 60,
          ethers.parseEther("100")
        )
      ).to.be.revertedWithCustomError(tournamentManager, "OwnableUnauthorizedAccount");
    });

    it("Should validate tournament parameters", async function () {
      const { tournamentManager, owner } = await loadFixture(deployTournamentFixture);

      // Invalid entry fee
      await expect(
        tournamentManager.connect(owner).createTournament(
          "Test",
          0, // Zero entry fee
          16,
          24 * 60 * 60,
          ethers.parseEther("100")
        )
      ).to.be.revertedWith("Invalid entry fee");

      // Invalid max participants
      await expect(
        tournamentManager.connect(owner).createTournament(
          "Test",
          ethers.parseEther("10"),
          0, // Zero participants
          24 * 60 * 60,
          ethers.parseEther("100")
        )
      ).to.be.revertedWith("Invalid max participants");
    });
  });

  describe("Tournament Registration", function () {
    it("Should allow players to register for tournaments", async function () {
      const { tournamentManager, mockToken, owner, player1 } = await loadFixture(deployTournamentFixture);

      // Create tournament
      const entryFee = ethers.parseEther("50");
      const createTx = await tournamentManager.connect(owner).createTournament(
        "Test Tournament",
        entryFee,
        32,
        7 * 24 * 60 * 60,
        ethers.parseEther("500")
      );
      const createReceipt = await createTx.wait();

      const createEvent = createReceipt.logs.find(log => {
        try {
          const parsed = tournamentManager.interface.parseLog(log);
          return parsed.name === 'TournamentCreated';
        } catch {
          return false;
        }
      });
      const tournamentId = tournamentManager.interface.parseLog(createEvent).args[0];

      // Approve token spending
      await mockToken.connect(player1).approve(await tournamentManager.getAddress(), entryFee);

      // Register for tournament
      await expect(
        tournamentManager.connect(player1).registerForTournament(tournamentId)
      ).to.not.be.reverted;

      // Check registration
      expect(await tournamentManager.isPlayerRegistered(tournamentId, player1.address)).to.be.true;
      expect(await tournamentManager.getParticipantCount(tournamentId)).to.equal(1);
    });

    it("Should transfer entry fee correctly", async function () {
      const { tournamentManager, mockToken, owner, player1 } = await loadFixture(deployTournamentFixture);

      const entryFee = ethers.parseEther("50");
      const initialBalance = await mockToken.balanceOf(player1.address);

      // Create tournament
      const createTx = await tournamentManager.connect(owner).createTournament(
        "Test Tournament",
        entryFee,
        32,
        7 * 24 * 60 * 60,
        ethers.parseEther("500")
      );
      const createReceipt = await createTx.wait();

      const createEvent = createReceipt.logs.find(log => {
        try {
          const parsed = tournamentManager.interface.parseLog(log);
          return parsed.name === 'TournamentCreated';
        } catch {
          return false;
        }
      });
      const tournamentId = tournamentManager.interface.parseLog(createEvent).args[0];

      // Approve and register
      await mockToken.connect(player1).approve(await tournamentManager.getAddress(), entryFee);
      await tournamentManager.connect(player1).registerForTournament(tournamentId);

      // Check balances
      expect(await mockToken.balanceOf(player1.address)).to.equal(initialBalance - entryFee);
      expect(await mockToken.balanceOf(await tournamentManager.getAddress())).to.equal(entryFee);
    });

    it("Should prevent double registration", async function () {
      const { tournamentManager, mockToken, owner, player1 } = await loadFixture(deployTournamentFixture);

      // Create tournament
      const entryFee = ethers.parseEther("50");
      const createTx = await tournamentManager.connect(owner).createTournament(
        "Test Tournament",
        entryFee,
        32,
        7 * 24 * 60 * 60,
        ethers.parseEther("500")
      );
      const createReceipt = await createTx.wait();

      const createEvent = createReceipt.logs.find(log => {
        try {
          const parsed = tournamentManager.interface.parseLog(log);
          return parsed.name === 'TournamentCreated';
        } catch {
          return false;
        }
      });
      const tournamentId = tournamentManager.interface.parseLog(createEvent).args[0];

      // Register once
      await mockToken.connect(player1).approve(await tournamentManager.getAddress(), entryFee);
      await tournamentManager.connect(player1).registerForTournament(tournamentId);

      // Try to register again
      await mockToken.connect(player1).approve(await tournamentManager.getAddress(), entryFee);
      await expect(
        tournamentManager.connect(player1).registerForTournament(tournamentId)
      ).to.be.revertedWith("Already registered");
    });

    it("Should enforce participant limits", async function () {
      const { tournamentManager, mockToken, owner, player1, player2 } = await loadFixture(deployTournamentFixture);

      // Create tournament with only 1 spot
      const entryFee = ethers.parseEther("50");
      const createTx = await tournamentManager.connect(owner).createTournament(
        "Small Tournament",
        entryFee,
        1, // Only 1 participant allowed
        7 * 24 * 60 * 60,
        ethers.parseEther("100")
      );
      const createReceipt = await createTx.wait();

      const createEvent = createReceipt.logs.find(log => {
        try {
          const parsed = tournamentManager.interface.parseLog(log);
          return parsed.name === 'TournamentCreated';
        } catch {
          return false;
        }
      });
      const tournamentId = tournamentManager.interface.parseLog(createEvent).args[0];

      // Register first player
      await mockToken.connect(player1).approve(await tournamentManager.getAddress(), entryFee);
      await tournamentManager.connect(player1).registerForTournament(tournamentId);

      // Try to register second player
      await mockToken.connect(player2).approve(await tournamentManager.getAddress(), entryFee);
      await expect(
        tournamentManager.connect(player2).registerForTournament(tournamentId)
      ).to.be.revertedWith("Tournament full");
    });

    it("Should enforce registration deadlines", async function () {
      const { tournamentManager, mockToken, owner, player1 } = await loadFixture(deployTournamentFixture);

      // Create tournament with very short registration period
      const entryFee = ethers.parseEther("50");
      const createTx = await tournamentManager.connect(owner).createTournament(
        "Quick Tournament",
        entryFee,
        32,
        1, // 1 second registration period
        ethers.parseEther("100")
      );
      const createReceipt = await createTx.wait();

      const createEvent = createReceipt.logs.find(log => {
        try {
          const parsed = tournamentManager.interface.parseLog(log);
          return parsed.name === 'TournamentCreated';
        } catch {
          return false;
        }
      });
      const tournamentId = tournamentManager.interface.parseLog(createEvent).args[0];

      // Wait for registration to close
      await time.increase(2); // 2 seconds

      // Try to register after deadline
      await mockToken.connect(player1).approve(await tournamentManager.getAddress(), entryFee);
      await expect(
        tournamentManager.connect(player1).registerForTournament(tournamentId)
      ).to.be.revertedWith("Registration closed");
    });
  });

  describe("Tournament Lifecycle", function () {
    it("Should start tournament correctly", async function () {
      const { tournamentManager, mockToken, owner, player1, player2 } = await loadFixture(deployTournamentFixture);

      // Create tournament
      const entryFee = ethers.parseEther("50");
      const createTx = await tournamentManager.connect(owner).createTournament(
        "Test Tournament",
        entryFee,
        32,
        7 * 24 * 60 * 60,
        ethers.parseEther("500")
      );
      const createReceipt = await createTx.wait();

      const createEvent = createReceipt.logs.find(log => {
        try {
          const parsed = tournamentManager.interface.parseLog(log);
          return parsed.name === 'TournamentCreated';
        } catch {
          return false;
        }
      });
      const tournamentId = tournamentManager.interface.parseLog(createEvent).args[0];

      // Register players
      await mockToken.connect(player1).approve(await tournamentManager.getAddress(), entryFee);
      await mockToken.connect(player2).approve(await tournamentManager.getAddress(), entryFee);
      await tournamentManager.connect(player1).registerForTournament(tournamentId);
      await tournamentManager.connect(player2).registerForTournament(tournamentId);

      // Start tournament
      await expect(
        tournamentManager.connect(owner).startTournament(tournamentId)
      ).to.not.be.reverted;

      // Check tournament status
      const tournament = await tournamentManager.tournaments(tournamentId);
      expect(tournament.status).to.equal(1); // Active status
    });

    it("Should only allow owner to start tournaments", async function () {
      const { tournamentManager, owner, player1 } = await loadFixture(deployTournamentFixture);

      // Create tournament
      const createTx = await tournamentManager.connect(owner).createTournament(
        "Test Tournament",
        ethers.parseEther("50"),
        32,
        7 * 24 * 60 * 60,
        ethers.parseEther("500")
      );
      const createReceipt = await createTx.wait();

      const createEvent = createReceipt.logs.find(log => {
        try {
          const parsed = tournamentManager.interface.parseLog(log);
          return parsed.name === 'TournamentCreated';
        } catch {
          return false;
        }
      });
      const tournamentId = tournamentManager.interface.parseLog(createEvent).args[0];

      // Try to start tournament as player
      await expect(
        tournamentManager.connect(player1).startTournament(tournamentId)
      ).to.be.revertedWithCustomError(tournamentManager, "OwnableUnauthorizedAccount");
    });

    it("Should require minimum participants to start", async function () {
      const { tournamentManager, owner } = await loadFixture(deployTournamentFixture);

      // Create tournament
      const createTx = await tournamentManager.connect(owner).createTournament(
        "Test Tournament",
        ethers.parseEther("50"),
        32,
        7 * 24 * 60 * 60,
        ethers.parseEther("500")
      );
      const createReceipt = await createTx.wait();

      const createEvent = createReceipt.logs.find(log => {
        try {
          const parsed = tournamentManager.interface.parseLog(log);
          return parsed.name === 'TournamentCreated';
        } catch {
          return false;
        }
      });
      const tournamentId = tournamentManager.interface.parseLog(createEvent).args[0];

      // Try to start tournament with no participants
      await expect(
        tournamentManager.connect(owner).startTournament(tournamentId)
      ).to.be.revertedWith("Not enough participants");
    });
  });

  describe("Prize Distribution", function () {
    it("Should distribute prizes correctly", async function () {
      const { tournamentManager, mockToken, owner, player1, player2, player3 } = await loadFixture(deployTournamentFixture);

      // Create tournament
      const entryFee = ethers.parseEther("50");
      const houseContribution = ethers.parseEther("150"); // Total prize pool: 150 + 100 = 250
      const createTx = await tournamentManager.connect(owner).createTournament(
        "Prize Tournament",
        entryFee,
        32,
        7 * 24 * 60 * 60,
        houseContribution
      );
      const createReceipt = await createTx.wait();

      const createEvent = createReceipt.logs.find(log => {
        try {
          const parsed = tournamentManager.interface.parseLog(log);
          return parsed.name === 'TournamentCreated';
        } catch {
          return false;
        }
      });
      const tournamentId = tournamentManager.interface.parseLog(createEvent).args[0];

      // Register 2 players (3 total entry fees = 150)
      await mockToken.connect(player1).approve(await tournamentManager.getAddress(), entryFee);
      await mockToken.connect(player2).approve(await tournamentManager.getAddress(), entryFee);
      await tournamentManager.connect(player1).registerForTournament(tournamentId);
      await tournamentManager.connect(player2).registerForTournament(tournamentId);

      // Start tournament
      await tournamentManager.connect(owner).startTournament(tournamentId);

      // Record results (player1 = 1st, player2 = 2nd)
      const finalists = [player1.address, player2.address];
      const rankings = [1, 2]; // 1st and 2nd place

      await expect(
        tournamentManager.connect(owner).submitTournamentResults(tournamentId, finalists, rankings)
      ).to.not.be.reverted;

      // Distribute prizes
      await expect(
        tournamentManager.connect(owner).distributePrizes(tournamentId)
      ).to.not.be.reverted;

      // Check final balances (this depends on prize distribution logic)
      // The contract should have distributed the prize pool according to rankings
      const contractBalance = await mockToken.balanceOf(await tournamentManager.getAddress());
      expect(contractBalance).to.equal(0); // All prizes distributed
    });

    it("Should only allow owner to distribute prizes", async function () {
      const { tournamentManager, owner, player1 } = await loadFixture(deployTournamentFixture);

      // Create and complete tournament (simplified)
      const createTx = await tournamentManager.connect(owner).createTournament(
        "Test Tournament",
        ethers.parseEther("50"),
        32,
        7 * 24 * 60 * 60,
        ethers.parseEther("100")
      );
      const createReceipt = await createTx.wait();

      const createEvent = createReceipt.logs.find(log => {
        try {
          const parsed = tournamentManager.interface.parseLog(log);
          return parsed.name === 'TournamentCreated';
        } catch {
          return false;
        }
      });
      const tournamentId = tournamentManager.interface.parseLog(createEvent).args[0];

      // Try to distribute prizes as player
      await expect(
        tournamentManager.connect(player1).distributePrizes(tournamentId)
      ).to.be.revertedWithCustomError(tournamentManager, "OwnableUnauthorizedAccount");
    });
  });

  describe("Tournament Queries", function () {
    it("Should provide accurate tournament information", async function () {
      const { tournamentManager, mockToken, owner, player1 } = await loadFixture(deployTournamentFixture);

      // Create tournament
      const entryFee = ethers.parseEther("50");
      const createTx = await tournamentManager.connect(owner).createTournament(
        "Info Tournament",
        entryFee,
        16,
        5 * 24 * 60 * 60, // 5 days
        ethers.parseEther("200")
      );
      const createReceipt = await createTx.wait();

      const createEvent = createReceipt.logs.find(log => {
        try {
          const parsed = tournamentManager.interface.parseLog(log);
          return parsed.name === 'TournamentCreated';
        } catch {
          return false;
        }
      });
      const tournamentId = tournamentManager.interface.parseLog(createEvent).args[0];

      // Register player
      await mockToken.connect(player1).approve(await tournamentManager.getAddress(), entryFee);
      await tournamentManager.connect(player1).registerForTournament(tournamentId);

      // Check queries
      expect(await tournamentManager.getParticipantCount(tournamentId)).to.equal(1);
      expect(await tournamentManager.isPlayerRegistered(tournamentId, player1.address)).to.be.true;
      expect(await tournamentManager.isPlayerRegistered(tournamentId, owner.address)).to.be.false;
    });
  });

  describe("Security", function () {
    it("Should prevent unauthorized prize distribution", async function () {
      const { tournamentManager, owner, player1 } = await loadFixture(deployTournamentFixture);

      // Create tournament
      const createTx = await tournamentManager.connect(owner).createTournament(
        "Security Test",
        ethers.parseEther("50"),
        32,
        7 * 24 * 60 * 60,
        ethers.parseEther("100")
      );
      const createReceipt = await createTx.wait();

      const createEvent = createReceipt.logs.find(log => {
        try {
          const parsed = tournamentManager.interface.parseLog(log);
          return parsed.name === 'TournamentCreated';
        } catch {
          return false;
        }
      });
      const tournamentId = tournamentManager.interface.parseLog(createEvent).args[0];

      // Try various unauthorized operations
      await expect(
        tournamentManager.connect(player1).submitTournamentResults(tournamentId, [], [])
      ).to.be.revertedWithCustomError(tournamentManager, "OwnableUnauthorizedAccount");
    });

    it("Should validate tournament state transitions", async function () {
      const { tournamentManager, owner } = await loadFixture(deployTournamentFixture);

      // Create tournament
      const createTx = await tournamentManager.connect(owner).createTournament(
        "State Test",
        ethers.parseEther("50"),
        32,
        7 * 24 * 60 * 60,
        ethers.parseEther("100")
      );
      const createReceipt = await createTx.wait();

      const createEvent = createReceipt.logs.find(log => {
        try {
          const parsed = tournamentManager.interface.parseLog(log);
          return parsed.name === 'TournamentCreated';
        } catch {
          return false;
        }
      });
      const tournamentId = tournamentManager.interface.parseLog(createEvent).args[0];

      // Try to distribute prizes before tournament starts
      await expect(
        tournamentManager.connect(owner).distributePrizes(tournamentId)
      ).to.be.revertedWith("Tournament not completed");
    });
  });
});
