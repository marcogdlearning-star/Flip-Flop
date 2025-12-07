const { ethers, upgrades } = require("hardhat");
const fs = require("fs");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("🚀 Deploying FlipFlop contracts to", network.name);
  console.log("📋 Deployer address:", deployer.address);
  console.log("💰 Deployer balance:", ethers.utils.formatEther(await deployer.provider.getBalance(deployer.address)), "ETH");

  // Check if we're on Base Sepolia
  if (network.name !== "baseTestnet") {
    console.warn("⚠️  Warning: Not deploying to Base Sepolia testnet");
    console.warn("   Current network:", network.name);
    console.warn("   Use: npx hardhat run scripts/deploy.js --network baseTestnet");
  }

  // Deploy FlipFlopToken
  console.log("\n--- 🪙 Deploying FlipFlopToken ---");
  const FlipFlopToken = await ethers.getContractFactory("FlipFlopToken");
  console.log("   Deploying proxy contract...");
  const token = await upgrades.deployProxy(FlipFlopToken, [deployer.address], {
    initializer: 'initialize',
    kind: 'uups'
  });
  await token.deployed();
  const tokenAddress = token.address;
  console.log("   ✅ FlipFlopToken deployed to:", tokenAddress);

  // Deploy UserRegistry
  console.log("\n--- 👥 Deploying UserRegistry ---");
  const UserRegistry = await ethers.getContractFactory("UserRegistry");
  console.log("   Deploying proxy contract...");
  const userRegistry = await upgrades.deployProxy(UserRegistry, [deployer.address], {
    initializer: 'initialize',
    kind: 'uups'
  });
  await userRegistry.deployed();
  const userRegistryAddress = userRegistry.address;
  console.log("   ✅ UserRegistry deployed to:", userRegistryAddress);

  // Deploy RandomnessManager
  console.log("\n--- 🎲 Deploying RandomnessManager ---");
  const RandomnessManager = await ethers.getContractFactory("RandomnessManager");

  // Base Sepolia VRF Configuration
  const vrfCoordinator = "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625"; // Base Sepolia
  const subscriptionId = process.env.VRF_SUBSCRIPTION_ID ? parseInt(process.env.VRF_SUBSCRIPTION_ID) : 0;
  const keyHash = "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56cab";
  const callbackGasLimit = 100000;
  const requestConfirmations = 3;
  const batchSize = 50; // Process 50 games per batch

  if (subscriptionId === 0) {
    console.warn("⚠️  VRF_SUBSCRIPTION_ID not set. Using default value 0.");
    console.warn("   You need to create a VRF subscription on Base Sepolia and set VRF_SUBSCRIPTION_ID");
  }

  console.log("   Deploying proxy contract...");
  const randomnessManager = await upgrades.deployProxy(
    RandomnessManager,
    [
      deployer.address,
      vrfCoordinator,
      subscriptionId,
      keyHash,
      callbackGasLimit,
      requestConfirmations,
      batchSize
    ],
    {
      initializer: 'initialize',
      kind: 'uups'
    }
  );
  await randomnessManager.deployed();
  const randomnessManagerAddress = randomnessManager.address;
  console.log("   ✅ RandomnessManager deployed to:", randomnessManagerAddress);

  // Deploy GameVerification
  console.log("\n--- 🎮 Deploying GameVerification ---");
  const GameVerification = await ethers.getContractFactory("GameVerification");
  console.log("   Deploying proxy contract...");
  const gameVerification = await upgrades.deployProxy(
    GameVerification,
    [deployer.address, userRegistryAddress, randomnessManagerAddress],
    {
      initializer: 'initialize',
      kind: 'uups'
    }
  );
  await gameVerification.deployed();
  const gameVerificationAddress = gameVerification.address;
  console.log("   ✅ GameVerification deployed to:", gameVerificationAddress);

  // Deploy TournamentManager
  console.log("\n--- 🏆 Deploying TournamentManager ---");
  const TournamentManager = await ethers.getContractFactory("TournamentManager");
  console.log("   Deploying proxy contract...");
  const tournamentManager = await upgrades.deployProxy(
    TournamentManager,
    [deployer.address, tokenAddress, userRegistryAddress],
    {
      initializer: 'initialize',
      kind: 'uups'
    }
  );
  await tournamentManager.deployed();
  const tournamentManagerAddress = tournamentManager.address;
  console.log("   ✅ TournamentManager deployed to:", tournamentManagerAddress);

  // Mint initial tokens to deployer for testing
  console.log("\n--- 💰 Minting initial tokens ---");
  const initialMintAmount = ethers.utils.parseEther("1000000"); // 1M tokens
  await token.mint(deployer.address, initialMintAmount);
  console.log("   ✅ Minted", ethers.utils.formatEther(initialMintAmount), "FLIP tokens to deployer");

  console.log("\n--- 📋 Deployment Summary ---");
  console.log("🌐 Network:", network.name);
  console.log("👤 Deployer:", deployer.address);
  console.log("🪙 FlipFlopToken:", tokenAddress);
  console.log("👥 UserRegistry:", userRegistryAddress);
  console.log("🎲 RandomnessManager:", randomnessManagerAddress);
  console.log("🎮 GameVerification:", gameVerificationAddress);
  console.log("🏆 TournamentManager:", tournamentManagerAddress);

  // Save deployment addresses to a file
  const deploymentInfo = {
    network: network.name,
    deployer: deployer.address,
    vrfSubscriptionId: subscriptionId,
    contracts: {
      FlipFlopToken: {
        address: tokenAddress,
        proxy: tokenAddress,
        implementation: await upgrades.erc1967.getImplementationAddress(tokenAddress)
      },
      UserRegistry: {
        address: userRegistryAddress,
        proxy: userRegistryAddress,
        implementation: await upgrades.erc1967.getImplementationAddress(userRegistryAddress)
      },
      RandomnessManager: {
        address: randomnessManagerAddress,
        proxy: randomnessManagerAddress,
        implementation: await upgrades.erc1967.getImplementationAddress(randomnessManagerAddress)
      },
      GameVerification: {
        address: gameVerificationAddress,
        proxy: gameVerificationAddress,
        implementation: await upgrades.erc1967.getImplementationAddress(gameVerificationAddress)
      },
      TournamentManager: {
        address: tournamentManagerAddress,
        proxy: tournamentManagerAddress,
        implementation: await upgrades.erc1967.getImplementationAddress(tournamentManagerAddress)
      }
    },
    timestamp: new Date().toISOString(),
    explorer: "https://sepolia.basescan.org/"
  };

  fs.writeFileSync("deployment.json", JSON.stringify(deploymentInfo, null, 2));
  console.log("💾 Deployment info saved to deployment.json");

  console.log("\n--- 🔗 Next Steps ---");
  console.log("1. Create VRF subscription on Base Sepolia if not done:");
  console.log("   https://vrf.chain.link/base-sepolia");
  console.log("2. Fund the subscription with LINK tokens");
  console.log("3. Update VRF_SUBSCRIPTION_ID in .env file");
  console.log("4. Verify contracts on Base Sepolia explorer");
  console.log("5. Update frontend with contract addresses");
}

main()
  .then(() => {
    console.log("\n🎉 Deployment completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });
