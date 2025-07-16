import ShogunCore from "shogun-core";
import { HDWalletPlugin, AccountAbstractionPlugin } from "../src";

/**
 * COMPLETE INTEGRATION EXAMPLE WITH SHOGUNCORE
 *
 * This example shows how to integrate the BIP44 plugin with ShogunCore
 * to allow users to generate wallets and smart accounts after login.
 */

async function completeIntegrationExample() {
  console.log("=== COMPLETE SHOGUNCORE + BIP44 PLUGIN INTEGRATION ===");

  // 1. Initialize ShogunCore
  const shogunCore = new ShogunCore({
    peers: ["https://gun-manhattan.herokuapp.com/gun"],
    scope: "shogun-app",
    logging: {
      enabled: true,
      level: "info",
    },
    webauthn: {
      enabled: true,
      rpName: "Shogun Wallet",
    },
  });

  // 2. Register BIP44 plugins
  console.log("\n--- Plugin Registration ---");

  // Base HD Wallet plugin
  const hdWalletPlugin = new HDWalletPlugin({
    rpcUrl: "https://eth-mainnet.alchemyapi.io/v2/YOUR_API_KEY",
    balanceCacheTTL: 30000,
    defaultGasLimit: 21000,
  });

  // Account Abstraction plugin
  const aaPlugin = new AccountAbstractionPlugin(
    {
      entryPointAddress: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
      bundlerUrl: "https://bundler.alchemyapi.io/v2/YOUR_API_KEY",
    },
    {
      rpcUrl: "https://eth-mainnet.alchemyapi.io/v2/YOUR_API_KEY",
    }
  );

  // Register plugins
  shogunCore.register(hdWalletPlugin);
  shogunCore.register(aaPlugin);

  console.log(
    "✅ Plugins registered:",
    shogunCore.hasPlugin("hdwallet"),
    shogunCore.hasPlugin("account-abstraction")
  );

  // 3. Simulate user login
  console.log("\n--- Login Simulation ---");

  try {
    // Login with username/password
    const loginResult = await shogunCore.login("testuser", "password123");

    if (loginResult.success) {
      console.log("✅ Login successful:", loginResult.username);
      console.log("User Pub:", loginResult.userPub);

      // 4. After login, user can use wallets
      console.log("\n--- Wallet Usage After Login ---");

      // Get HD Wallet plugin
      const walletPlugin = shogunCore.getPlugin<HDWalletPlugin>("hdwallet");
      if (walletPlugin) {
        // Create a new wallet
        const walletInfo = await walletPlugin.createWallet();
        console.log("✅ New wallet created:", walletInfo.address);

        // Load all user wallets
        const wallets = await walletPlugin.loadWallets();
        console.log("📋 User wallets:", wallets.length);

        // Get main wallet
        const mainWallet = walletPlugin.getMainWallet();
        if (mainWallet) {
          console.log("🏠 Main wallet:", mainWallet.address);
        }
      }

      // 5. Account Abstraction usage
      console.log("\n--- Account Abstraction Usage ---");

      const aaPluginInstance = shogunCore.getPlugin<AccountAbstractionPlugin>(
        "account-abstraction"
      );
      if (aaPluginInstance) {
        // Configure for gasless transactions
        aaPluginInstance.setupGaslessTransactions();

        // Create Smart Account
        const smartAccountAddress =
          await aaPluginInstance.getOrCreateSmartAccount(0);
        console.log("🤖 Smart Account created:", smartAccountAddress);

        // Verify configuration
        const config = aaPluginInstance.validateConfiguration();
        console.log("⚙️ Configuration valid:", config.isValid);
      }
    } else {
      console.log("❌ Login failed:", loginResult.error);
    }
  } catch (error) {
    console.error("❌ Error during login:", error);
  }

  // 6. Event handling
  console.log("\n--- Event Handling ---");

  shogunCore.on("auth:login", (data) => {
    console.log("🎉 Login event received:", data);
  });

  shogunCore.on("auth:logout", () => {
    console.log("👋 Logout event received");
  });

  // 7. Logout and cleanup
  console.log("\n--- Logout and Cleanup ---");
  shogunCore.logout();
  console.log("✅ Logout completed");
}

/**
 * PRODUCTION CONFIGURATION EXAMPLE
 */
function productionConfigurationExample() {
  console.log("\n=== PRODUCTION CONFIGURATION ===");

  const shogunCore = new ShogunCore({
    peers: [
      "https://gun-manhattan.herokuapp.com/gun",
      "https://gun-us.herokuapp.com/gun",
    ],
    scope: "shogun-wallet-prod",
    logging: {
      enabled: false, // Disable logging in production
      level: "error",
    },
    webauthn: {
      enabled: true,
      rpName: "Shogun Wallet",
      rpId: "wallet.shogun.com",
    },
    timeouts: {
      login: 30000,
      signup: 30000,
      operation: 60000,
    },
  });

  // Plugins with production configuration
  const hdWalletPlugin = new HDWalletPlugin({
    rpcUrl: process.env.ALCHEMY_API_KEY,
    balanceCacheTTL: 60000,
    defaultGasLimit: 21000,
    maxRetries: 5,
    retryDelay: 2000,
  });

  const aaPlugin = new AccountAbstractionPlugin(
    {
      entryPointAddress: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
      bundlerUrl: process.env.ALCHEMY_BUNDLER_URL,
      paymasterAddress: process.env.PAYMASTER_ADDRESS,
    },
    {
      rpcUrl: process.env.ALCHEMY_API_KEY,
    }
  );

  shogunCore.register(hdWalletPlugin);
  shogunCore.register(aaPlugin);

  console.log("✅ Production configuration completed");
}

/**
 * ERROR HANDLING EXAMPLE
 */
function errorHandlingExample() {
  console.log("\n=== ERROR HANDLING ===");

  const shogunCore = new ShogunCore({
    peers: ["https://gun-manhattan.herokuapp.com/gun"],
    scope: "shogun-error-test",
  });

  // Error listener
  shogunCore.on("error", (error) => {
    console.error("🚨 ShogunCore error:", error);
  });

  // Get recent errors
  const recentErrors = shogunCore.getRecentErrors(5);
  console.log("📋 Recent errors:", recentErrors.length);
}

// Run examples
if (require.main === module) {
  completeIntegrationExample()
    .then(() => productionConfigurationExample())
    .then(() => errorHandlingExample())
    .catch(console.error);
}

export {
  completeIntegrationExample,
  productionConfigurationExample,
  errorHandlingExample,
};
