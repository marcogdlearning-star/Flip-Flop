const { run } = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("🔍 Verifying contracts on Base Sepolia...");

  // Load deployment info
  if (!fs.existsSync("deployment.json")) {
    console.error("❌ deployment.json not found. Please run deployment first.");
    process.exit(1);
  }

  const deployment = JSON.parse(fs.readFileSync("deployment.json", "utf8"));

  if (deployment.network !== "baseTestnet") {
    console.error("❌ Deployment info is not for Base Sepolia testnet");
    process.exit(1);
  }

  console.log("📋 Verifying contracts for deployment:", deployment.timestamp);

  try {
    // Verify FlipFlopToken
    console.log("\n--- 🪙 Verifying FlipFlopToken ---");
    await run("verify", {
      address: deployment.contracts.FlipFlopToken.address,
      constructorArguments: [],
    });
    console.log("✅ FlipFlopToken verified");

    // Verify UserRegistry
    console.log("\n--- 👥 Verifying UserRegistry ---");
    await run("verify", {
      address: deployment.contracts.UserRegistry.address,
      constructorArguments: [],
    });
    console.log("✅ UserRegistry verified");

    // Verify RandomnessManager
    console.log("\n--- 🎲 Verifying RandomnessManager ---");
    const vrfCoordinator = "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625";
    const subscriptionId = deployment.vrfSubscriptionId || 0;
    const keyHash = "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56cab";
    const callbackGasLimit = 100000;
    const requestConfirmations = 3;
    const batchSize = 50;

    await run("verify", {
      address: deployment.contracts.RandomnessManager.address,
      constructorArguments: [
        vrfCoordinator,
        subscriptionId,
        keyHash,
        callbackGasLimit,
        requestConfirmations,
        batchSize
      ],
    });
    console.log("✅ RandomnessManager verified");

    // Verify GameVerification
    console.log("\n--- 🎮 Verifying GameVerification ---");
    await run("verify", {
      address: deployment.contracts.GameVerification.address,
      constructorArguments: [
        deployment.contracts.UserRegistry.address,
        deployment.contracts.RandomnessManager.address
      ],
    });
    console.log("✅ GameVerification verified");

    // Verify TournamentManager
    console.log("\n--- 🏆 Verifying TournamentManager ---");
    await run("verify", {
      address: deployment.contracts.TournamentManager.address,
      constructorArguments: [
        deployment.contracts.FlipFlopToken.address,
        deployment.contracts.UserRegistry.address
      ],
    });
    console.log("✅ TournamentManager verified");

    console.log("\n🎉 All contracts verified successfully!");
    console.log("🔗 View contracts on Base Sepolia explorer:");
    console.log(`   ${deployment.explorer}address/${deployment.contracts.FlipFlopToken.address}`);
    console.log(`   ${deployment.explorer}address/${deployment.contracts.UserRegistry.address}`);
    console.log(`   ${deployment.explorer}address/${deployment.contracts.RandomnessManager.address}`);
    console.log(`   ${deployment.explorer}address/${deployment.contracts.GameVerification.address}`);
    console.log(`   ${deployment.explorer}address/${deployment.contracts.TournamentManager.address}`);

  } catch (error) {
    console.error("\n❌ Verification failed:");
    console.error(error);
    process.exit(1);
  }
}

main();
