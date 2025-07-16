import { AccountAbstractionPlugin } from "../src/accountAbstraction";

/**
 * ESEMPIO DI UTILIZZO ACCOUNT ABSTRACTION CON ALCHEMY
 *
 * Questo esempio mostra come configurare e usare l'Account Abstraction
 * con Alchemy Bundler per permettere agli utenti di fare transazioni senza fondi.
 */

async function esempioAccountAbstraction() {
  console.log("=== ESEMPIO ACCOUNT ABSTRACTION CON ALCHEMY ===");

  // 1. Inizializza il plugin con configurazione completa
  const aaPlugin = new AccountAbstractionPlugin(
    {
      // Configurazione Account Abstraction
      entryPointAddress: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789", // EntryPoint standard
      accountFactoryAddress: "0x0000000000000000000000000000000000000000", // Da configurare
    },
    {
      // Configurazione Wallet
      rpcUrl: "https://eth-mainnet.alchemyapi.io/v2/YOUR_API_KEY",
      balanceCacheTTL: 30000,
      defaultGasLimit: 21000,
      maxRetries: 3,
      retryDelay: 1000,
    }
  );

  // 2. Configura Alchemy Bundler (sostituisci con la tua API key)
  console.log("\n--- Configurazione Alchemy Bundler ---");

  // Opzione 1: Configurazione completa con API key
  try {
    const alchemyApiKey = process.env.ALCHEMY_API_KEY || "YOUR_API_KEY_HERE";
    aaPlugin.setupAlchemyBundler(alchemyApiKey, "mainnet");
    console.log("✅ Alchemy Bundler configurato");
  } catch (error) {
    console.log("⚠️  Configurazione Alchemy fallita:", error.message);
    console.log("💡 Ottieni una API key gratuita da: https://www.alchemy.com/");
  }

  // 3. Mostra la configurazione corrente
  console.log("\n--- Configurazione Corrente ---");
  const walletConfig = aaPlugin.getWalletConfig();
  const aaConfig = aaPlugin.getConfig();
  console.log("Wallet Config:", walletConfig);
  console.log("Account Abstraction Config:", aaConfig);

  // 4. Esempio di aggiornamento dinamico della configurazione
  console.log("\n--- Aggiornamento Configurazione ---");
  aaPlugin.updateWalletConfig({
    rpcUrl: "https://eth-goerli.alchemyapi.io/v2/YOUR_TESTNET_API_KEY",
    balanceCacheTTL: 60000, // Aumenta il TTL della cache
  });

  console.log("✅ Configurazione aggiornata per testnet");
  console.log("Nuova Wallet Config:", aaPlugin.getWalletConfig());

  // 5. Configura per gasless transactions
  console.log("\n--- Configurazione Gasless ---");
  aaPlugin.setupGaslessTransactions();

  // Verifica la configurazione
  const config = aaPlugin.validateConfiguration();
  console.log("Configurazione valida:", config.isValid);
  if (config.errors.length > 0) {
    console.log("❌ Errori:", config.errors);
  }
  if (config.warnings.length > 0) {
    console.log("⚠️  Avvisi:", config.warnings);
  }

  // 6. Mostra URL dei bundler pubblici disponibili
  console.log("\n--- Bundler Pubblici Disponibili ---");
  const bundlerUrls = aaPlugin.getPublicBundlerUrls();
  Object.entries(bundlerUrls).forEach(([name, url]) => {
    console.log(`${name}: ${url}`);
  });

  // 7. Esempio di transazione gasless
  console.log("\n--- Esempio Transazione Gasless ---");

  try {
    // Ottieni o crea uno Smart Account per l'utente
    const smartAccountAddress = await aaPlugin.getOrCreateSmartAccount(0);
    console.log("Smart Account:", smartAccountAddress);

    // Stima i costi della transazione
    const gasEstimate = await aaPlugin.estimateUserOperationGas(
      smartAccountAddress,
      "0x", // callData vuoto per esempio
      { gasLimit: "100000" }
    );
    console.log("Stima gas:", gasEstimate);

    // Esegui una transazione (l'utente non paga gas fees)
    const userOpHash = await aaPlugin.executeTransaction(
      smartAccountAddress,
      "0x1234567890123456789012345678901234567890", // indirizzo destinazione
      "0.001", // valore in ETH
      "0x" // dati
    );
    console.log("✅ UserOperation inviata:", userOpHash);

    // Esempio di interazione con Smart Account
    console.log("\n--- Interazione con Smart Account ---");

    // Ottieni il contratto Smart Account
    const smartAccountContract =
      await aaPlugin.getSmartAccountContract(smartAccountAddress);
    if (smartAccountContract) {
      console.log("✅ Contratto Smart Account ottenuto");

      // Ottieni il nonce
      const nonce = await aaPlugin.getSmartAccountNonce(smartAccountAddress);
      console.log("Nonce Smart Account:", nonce.toString());

      // Ottieni l'owner
      const owner = await aaPlugin.getSmartAccountOwner(smartAccountAddress);
      console.log("Owner Smart Account:", owner);
    }

    // Esempio di configurazione Paymaster con dati
    console.log("\n--- Configurazione Paymaster con Dati ---");
    aaPlugin.setPaymasterWithData(
      "0x1234567890123456789012345678901234567890",
      "0x12345678" // Dati aggiuntivi per il paymaster
    );

    const paymasterData = aaPlugin.getPaymasterData();
    console.log("Dati Paymaster configurati:", paymasterData);
  } catch (error) {
    console.error("❌ Errore nella transazione gasless:", error);
  }

  // 8. Esempio di configurazione self-funded
  console.log("\n--- Configurazione Self-Funded ---");
  aaPlugin.setupSelfFundedTransactions();

  // In questo caso l'utente deve avere fondi nel suo Smart Account
  console.log(
    "Per transazioni self-funded, l'utente deve avere fondi nel suo Smart Account"
  );
}

/**
 * ESEMPIO DI CONFIGURAZIONE PER SVILUPPATORI CON ALCHEMY
 *
 * Come configurare Alchemy Bundler e Paymaster per pagare le gas fees degli utenti
 */
async function esempioConfigurazioneDev() {
  console.log("\n=== CONFIGURAZIONE PER SVILUPPATORI CON ALCHEMY ===");

  const aaPlugin = new AccountAbstractionPlugin();

  // 1. Configura Alchemy Bundler (sostituisci con la tua API key)
  const alchemyApiKey = process.env.ALCHEMY_API_KEY || "YOUR_API_KEY_HERE";

  try {
    aaPlugin.setupAlchemyBundler(alchemyApiKey, "mainnet");
    console.log("✅ Alchemy Bundler configurato");
  } catch (error) {
    console.log("❌ Errore configurazione Alchemy:", error.message);
    return;
  }

  // 2. Configura il tuo Paymaster (deve avere fondi per pagare le gas fees)
  const paymasterAddress = "0xYOUR_PAYMASTER_ADDRESS";
  aaPlugin.setupAlchemyWithPaymaster(alchemyApiKey, paymasterAddress);

  // 3. Configura l'AccountFactory per creare Smart Accounts
  aaPlugin.setAccountFactory("0xYOUR_ACCOUNT_FACTORY_ADDRESS");

  console.log("✅ Configurazione completata!");
  console.log("💡 Il tuo Paymaster pagherà le gas fees degli utenti");
  console.log(
    "⚠️  IMPORTANTE: Assicurati che il Paymaster abbia fondi sufficienti!"
  );

  // Verifica configurazione
  const validation = aaPlugin.validateConfiguration();
  console.log("Configurazione valida:", validation.isValid);
  console.log("Gasless abilitato:", aaPlugin.isGaslessEnabled());
}

/**
 * ESEMPIO DI CONFIGURAZIONE PER TESTNET
 */
async function esempioConfigurazioneTestnet() {
  console.log("\n=== CONFIGURAZIONE PER TESTNET ===");

  const aaPlugin = new AccountAbstractionPlugin();

  // Configura per testnet (Goerli o Sepolia)
  const testnetApiKey =
    process.env.ALCHEMY_TESTNET_API_KEY || "YOUR_TESTNET_API_KEY";

  try {
    // Per Goerli
    aaPlugin.setupAlchemyBundler(testnetApiKey, "goerli");
    console.log("✅ Alchemy Bundler configurato per Goerli");

    // Per Sepolia
    // aaPlugin.setupAlchemyBundler(testnetApiKey, "sepolia");
    // console.log("✅ Alchemy Bundler configurato per Sepolia");
  } catch (error) {
    console.log("❌ Errore configurazione testnet:", error.message);
  }

  // Configura Paymaster per testnet
  aaPlugin.setPaymaster("0xTESTNET_PAYMASTER_ADDRESS");

  console.log("💡 Perfetto per testare Account Abstraction senza costi reali!");
}

/**
 * ESEMPIO DI VERIFICA CONFIGURAZIONE
 */
function esempioVerificaConfigurazione() {
  console.log("\n=== VERIFICA CONFIGURAZIONE ===");

  const aaPlugin = new AccountAbstractionPlugin();

  // Configura alcune opzioni
  aaPlugin.setBundler("https://bundler.alchemyapi.io/v2/YOUR_API_KEY");
  aaPlugin.setPaymaster("0x1234567890123456789012345678901234567890");

  // Verifica la configurazione
  const validation = aaPlugin.validateConfiguration();

  console.log("Configurazione valida:", validation.isValid);
  console.log("Errori:", validation.errors);
  console.log("Avvisi:", validation.warnings);

  // Verifica se è abilitato il gasless
  console.log("Gasless abilitato:", aaPlugin.isGaslessEnabled());
}

// Esegui gli esempi
if (require.main === module) {
  esempioAccountAbstraction()
    .then(() => esempioConfigurazioneDev())
    .then(() => esempioConfigurazioneTestnet())
    .then(() => esempioVerificaConfigurazione())
    .catch(console.error);
}

export {
  esempioAccountAbstraction,
  esempioConfigurazioneDev,
  esempioConfigurazioneTestnet,
  esempioVerificaConfigurazione,
};
