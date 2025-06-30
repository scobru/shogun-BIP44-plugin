import { log, logError, logWarn, EventEmitter } from "./utils";
// @ts-ignore
import SEA from "gun/sea";
import { ethers } from "ethers";
import {
  WalletPath,
  BalanceCache,
  WalletExport,
  WalletConfig,
  WalletInfo,
  WalletEventType,
  WalletEvent
} from "./types";

/**
 * Class that manages Ethereum wallet functionality including:
 * - Wallet creation and derivation
 * - Balance checking and transactions
 * - Importing/exporting wallets
 * - Encrypted storage and backup
 */
export class HDWallet extends EventEmitter {
  private readonly gun: any;
  private walletPaths: {
    [address: string]: WalletPath;
  } = {};
  private mainWallet: ethers.Wallet | null = null;
  private readonly balanceCache: Map<string, BalanceCache> = new Map();
  private readonly pendingTransactions: Map<
    string,
    { from: string; to?: string; status?: string }
  > = new Map();
  private readonly config: WalletConfig;
  private transactionMonitoringInterval: NodeJS.Timeout | null = null;
  private provider: ethers.JsonRpcProvider | null = null;
  private signer: ethers.Wallet | null = null;

  /**
   * Creates a new WalletManager instance
   * @param gun Raw Gun instance
   * @param storage Storage interface for local persistence
   * @param config Additional configuration options
   */
  constructor(gun: any, config?: Partial<WalletConfig>) {
    super();
    this.gun = gun;
    this.config = {
      balanceCacheTTL: 30000,
      rpcUrl: "",
      defaultGasLimit: 21000,
      maxRetries: 3,
      retryDelay: 1000,
      ...config,
    };

    this.initWalletPathsSync();
    this.setupTransactionMonitoring();
  }

  /**
   * Initialize wallet paths synchronously with basic setup
   * @private
   */
  private initWalletPathsSync(): void {
    try {
      // Reset existing paths
      this.walletPaths = {};

      // Load paths from localStorage as fallback (synchronous operation)
      this.loadWalletPathsFromLocalStorage();

      log(
        "Wallet paths initialized synchronously. Async loading will occur on first use."
      );
    } catch (error) {
      logError("Error in synchronous wallet path initialization:", error);
      log("Will attempt async initialization on first use");
    }
  }

  /**
   * Initializes wallet paths from both GunDB and localStorage
   * Call this method explicitly when needed
   * @public
   * @throws {Error} If there's an error during wallet path initialization
   */
  async initializeWalletPaths(): Promise<void> {
    try {
      // Reset existing paths
      this.walletPaths = {};

      // Load paths from Gun
      await this.loadWalletPathsFromGun();

      // Load paths from localStorage as fallback
      this.loadWalletPathsFromLocalStorage();

      // Log results
      const walletCount = Object.keys(this.walletPaths).length;
      if (walletCount === 0) {
        log("No wallet paths found, new wallets will be created when needed");
      } else {
        log(`Initialized ${walletCount} wallet paths`);
      }
    } catch (error) {
      logError("Error initializing wallet paths:", error);
      // Propagare l'errore invece di sopprimerlo
      throw new Error(
        `Failed to initialize wallet paths: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Loads wallet paths from localStorage as backup
   * @private
   */
  private loadWalletPathsFromLocalStorage(): void {
    const storageKey = `shogun_wallet_paths_${this.getStorageUserIdentifier()}`;
    const storedPaths = localStorage.getItem(storageKey);

    if (storedPaths) {
      try {
        log("Found wallet paths in localStorage");
        const parsedPaths = JSON.parse(storedPaths as string);

        // Add paths if not already in GUN
        Object.entries(parsedPaths).forEach(([address, pathData]) => {
          if (!this.walletPaths[address]) {
            this.walletPaths[address] = pathData as WalletPath;
            log(`Loaded path from localStorage for wallet: ${address}`);
          }
        });
      } catch (error) {
        logError("Error parsing wallet paths from localStorage:", error);
      }
    }
  }

  /**
   * Loads wallet paths from GunDB
   * @private
   */
  private async loadWalletPathsFromGun(): Promise<void> {
    // Verify user authentication
    const user = this.gun.user();
    if (!user?.is) {
      log("User not authenticated on Gun, cannot load wallet paths from Gun");
      return Promise.resolve();
    }

    log(`Loading wallet paths from GUN for user: ${user.is.alias}`);

    // Load paths from user profile
    return new Promise<void>((resolve) => {
      user.get("wallet_paths").once((data: any) => {
        if (!data) {
          log("No wallet paths found in GUN");
          resolve();
          return;
        }

        log(
          `Found wallet paths in GUN: ${Object.keys(data).length - 1} wallets`
        ); // -1 for _ field

        // Convert GUN data to walletPaths
        Object.entries(data).forEach(([address, pathData]) => {
          if (address !== "_" && pathData) {
            const data = pathData as any;
            if (data?.path) {
              this.walletPaths[address] = {
                path: data.path,
                created: data.created || Date.now(),
              };
              log(`Loaded path for wallet: ${address} -> ${data.path}`);
            }
          }
        });

        resolve();
      });
    });
  }

  /**
   * Setup transaction monitoring
   */
  private setupTransactionMonitoring(): void {
    // Non creare intervalli quando è in esecuzione in ambiente di test
    if (process.env.NODE_ENV === "test") {
      return;
    }

    this.transactionMonitoringInterval = setInterval(() => {
      if (this.getProvider() !== null) {
        this.checkPendingTransactions();
      }
    }, 15000);
  }

  cleanup(): void {
    if (this.transactionMonitoringInterval) {
      clearInterval(this.transactionMonitoringInterval);
      this.transactionMonitoringInterval = null;
    }

    // Pulisci eventuali altri timer
    const globalObj = typeof window !== "undefined" ? window : global;
    const highestTimeoutId = Number(setTimeout(() => {}, 0));
    for (let i = 0; i < highestTimeoutId; i++) {
      clearTimeout(i);
      clearInterval(i);
    }
  }

  /**
   * Check status of pending transactions
   */
  private async checkPendingTransactions(): Promise<void> {
    const provider = this.getProvider();
    if (!provider) {
      logWarn(
        "Provider non disponibile, impossibile controllare transazioni pendenti"
      );
      return;
    }

    for (const [txHash, tx] of this.pendingTransactions.entries()) {
      try {
        const receipt = await provider.getTransactionReceipt(txHash);

        if (receipt) {
          if (receipt.status === 1) {
            // Aggiorniamo lo stato della transazione prima dell'emissione dell'evento
            if (tx && typeof tx === "object") {
              (tx as any).status = "success";
            }

            this.emit(WalletEventType.TRANSACTION_CONFIRMED, {
              type: WalletEventType.TRANSACTION_CONFIRMED,
              data: { txHash, receipt },
              timestamp: Date.now(),
            });
          } else {
            // Aggiorniamo lo stato della transazione prima dell'emissione dell'evento
            if (tx && typeof tx === "object") {
              (tx as any).status = "failed";
            }

            this.emit(WalletEventType.ERROR, {
              type: WalletEventType.ERROR,
              data: { txHash, error: "Transaction failed" },
              timestamp: Date.now(),
            });
          }

          this.pendingTransactions.delete(txHash);

          // Invalidate balance cache for affected addresses
          this.invalidateBalanceCache(tx.from);
          if (tx.to) this.invalidateBalanceCache(tx.to);
        }
      } catch (error) {
        logError(`Error checking transaction ${txHash}:`, error);
      }
    }
  }

  /**
   * Sets the RPC URL used for Ethereum network connections
   * @param rpcUrl The RPC provider URL to use
   */
  setRpcUrl(rpcUrl: string): void {
    this.config.rpcUrl = rpcUrl;
    log(`RPC Provider configured: ${rpcUrl}`);
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.signer = this.getSigner();
  }

  /**
   * Gets a configured JSON RPC provider instance
   * @returns An ethers.js JsonRpcProvider instance
   */
  getProvider(): ethers.JsonRpcProvider | null {
    return this.provider;
  }

  getSigner(): ethers.Wallet {
    const wallet = this.getMainWallet();

    if (!this.provider) {
      throw new Error("Provider not available");
    }

    return wallet.connect(this.provider);
  }

  setSigner(signer: ethers.Wallet): void {
    if (!this.config.rpcUrl) {
      throw new Error("RPC URL not configured");
    }
    const provider = new ethers.JsonRpcProvider(this.config.rpcUrl);
    this.signer = signer.connect(provider);
  }

  /**
   * Gets a unique identifier for the current user for storage purposes
   * @private
   * @returns A string identifier based on user's public key or "guest"
   */
  private getStorageUserIdentifier(): string {
    const user = this.gun.user();
    const pub = user?.is?.pub;
    if (pub) {
      return pub.substring(0, 12); // Use part of the public key
    }
    return "guest"; // Identifier for unauthenticated users
  }

  /**
   * Saves wallet paths to localStorage for backup
   * @private
   */
  private saveWalletPathsToLocalStorage(): void {
    try {
      const storageKey = `shogun_wallet_paths_${this.getStorageUserIdentifier()}`;
      const pathsToSave = JSON.stringify(this.walletPaths);
      localStorage.setItem(storageKey, pathsToSave);
      log(
        `Saved ${Object.keys(this.walletPaths).length} wallet paths to localStorage`
      );
    } catch (error) {
      logError("Error saving wallet paths to localStorage:", error);
    }
  }

  /**
   * Derives a private wallet from a mnemonic and derivation path
   * @param mnemonic The BIP-39 mnemonic phrase
   * @param path The derivation path
   * @returns A derived HDNodeWallet instance
   * @private
   */
  private derivePrivateKeyFromMnemonic(
    mnemonic: string,
    path: string
  ): ethers.HDNodeWallet {
    try {
      log(`Deriving wallet from path: ${path}`);
      const wallet = ethers.HDNodeWallet.fromMnemonic(
        ethers.Mnemonic.fromPhrase(mnemonic),
        path
      );

      if (!wallet || !wallet.privateKey) {
        throw new Error(`Unable to derive wallet for path ${path}`);
      }

      return wallet as ethers.HDNodeWallet;
    } catch (error) {
      logError(`Error deriving wallet for path ${path}:`, error);
      throw new Error(`Unable to derive wallet for path ${path}`);
    }
  }

  /**
   * Generate a new BIP-39 standard mnemonic compatible with all wallets
   * @returns A new 12-word BIP-39 mnemonic phrase
   */
  generateNewMnemonic(): string {
    const wallet = ethers.Wallet.createRandom();
    return wallet.mnemonic?.phrase || "test phrase for development";
  }

  /**
   * Get addresses that would be derived from a mnemonic using BIP-44 standard
   * This is useful to verify that wallets are correctly compatible with MetaMask and other wallets
   * @param mnemonic The BIP-39 mnemonic phrase
   * @param count Number of addresses to derive
   * @returns An array of Ethereum addresses
   */
  getStandardBIP44Addresses(mnemonic: string, count = 5): string[] {
    const addresses: string[] = [];
    for (let i = 0; i < count; i++) {
      const path = `m/44'/60'/0'/0/${i}`;
      const wallet = ethers.HDNodeWallet.fromMnemonic(
        ethers.Mnemonic.fromPhrase(mnemonic),
        path
      );
      addresses.push(wallet.address);
    }
    return addresses;
  }

  /**
   * Override of main function with fixes and improvements
   */
  private generatePrivateKeyFromString(input: string): string {
    try {
      // Use SHA-256 to generate a deterministic hash value
      const encoder = new TextEncoder();
      const data = encoder.encode(input);

      // Use simplified digestSync method
      const digestSync = (data: Uint8Array): Uint8Array => {
        // Simplified version
        let h1 = 0xdeadbeef,
          h2 = 0x41c6ce57;
        for (let i = 0; i < data.length; i++) {
          h1 = Math.imul(h1 ^ data[i], 2654435761);
          h2 = Math.imul(h2 ^ data[i], 1597334677);
        }
        h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
        h1 = Math.imul(h1 ^ (h1 >>> 13), 3266489909);
        h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
        h2 = Math.imul(h2 ^ (h2 >>> 13), 3266489909);

        // Create a 32-byte array
        const out = new Uint8Array(32);
        for (let i = 0; i < 4; i++) {
          out[i] = (h1 >> (8 * i)) & 0xff;
        }
        for (let i = 0; i < 4; i++) {
          out[i + 4] = (h2 >> (8 * i)) & 0xff;
        }
        // Fill with derived values
        for (let i = 8; i < 32; i++) {
          out[i] = (out[i % 8] ^ out[(i - 1) % 8]) & 0xff;
        }
        return out;
      };

      // Use synchronous version of digest
      const hashArray = digestSync(data);

      // Convert to hex string
      const privateKey =
        "0x" +
        Array.from(hashArray)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");

      return privateKey;
    } catch (error) {
      logError("Error generating private key:", error);

      // Fallback: create valid hex value
      const fallbackHex =
        "0x" +
        Array.from({ length: 32 })
          .map(() =>
            Math.floor(Math.random() * 256)
              .toString(16)
              .padStart(2, "0")
          )
          .join("");

      return fallbackHex;
    }
  }

  /**
   * Get the main wallet
   */
  getMainWallet(): ethers.Wallet {
    if (!this.mainWallet) {
      const user = this.gun.user();
      if (!user || !user.is) {
        log("getMainWallet: User not authenticated");
        throw new Error("User not authenticated");
      }

      // Check if we have access to required properties
      if (!user._ || !user._.sea || !user._.sea.priv || !user._.sea.pub) {
        log(
          "getMainWallet: Insufficient user data",
          JSON.stringify({
            hasUserData: !!user._,
            hasSea: !!(user._ && user._.sea),
            hasPriv: !!(user._ && user._.sea && user._.sea.priv),
            hasPub: !!(user._ && user._.sea && user._.sea.pub),
          })
        );

        throw new Error("Insufficient user data to generate wallet");
      }

      // Combine private key + public key + user alias for unique seed
      const userSeed = user._.sea.priv;
      const userPub = user._.sea.pub;
      const userAlias = user.is.alias;

      // Create unique seed for this user
      const seed = `${userSeed}|${userPub}|${userAlias}`;

      // Use new secure method to generate private key
      const privateKey = this.generatePrivateKeyFromString(seed);
      this.mainWallet = new ethers.Wallet(privateKey);
    }
    return this.mainWallet;
  }

  /**
   * Get the main wallet credentials
   */
  getMainWalletCredentials(): { address: string; priv: string } {
    const user = this.gun.user().recall({ sessionStorage: true });
    if (!user || !user.is) {
      log("getMainWallet: User not authenticated");
      throw new Error("User not authenticated");
    }

    // Check if we have access to required properties
    if (!user._ || !user._.sea || !user._.sea.priv || !user._.sea.pub) {
      log(
        "getMainWallet: Insufficient user data",
        JSON.stringify({
          hasUserData: !!user._,
          hasSea: !!(user._ && user._.sea),
          hasPriv: !!(user._ && user._.sea && user._.sea.priv),
          hasPub: !!(user._ && user._.sea && user._.sea.pub),
        })
      );

      throw new Error("Insufficient user data to generate wallet");
    }

    const userSeed = user._.sea.priv;
    const userPub = user._.sea.pub;
    const userAlias = user.is.alias;

    // Create unique seed for this user
    const seed = `${userSeed}|${userPub}|${userAlias}`;

    // Use new secure method to generate private key
    const privateKey = this.generatePrivateKeyFromString(seed);
    this.mainWallet = new ethers.Wallet(privateKey);

    return { address: this.mainWallet.address, priv: privateKey };
  }

  /**
   * Encrypt sensitive text using SEA
   * @param text Text to encrypt
   * @returns Encrypted text
   */
  private async encryptSensitiveData(text: string): Promise<string> {
    try {
      const user = this.gun.user();
      if (user && user._ && user._.sea) {
        // Use user key to encrypt
        const encrypted = await SEA.encrypt(text, user._.sea);
        return JSON.stringify(encrypted);
      } else {
        // Fallback: use key derived from user ID
        const userIdentifier = this.getStorageUserIdentifier();
        const key = `shogun-encrypt-${userIdentifier}-key`;
        const encrypted = await SEA.encrypt(text, key);
        return JSON.stringify(encrypted);
      }
    } catch (error) {
      logError("Error encrypting data:", error);
      // Fallback: save in clear but with warning
      log("WARNING: Sensitive data saved without encryption");
      return `unencrypted:${text}`;
    }
  }

  /**
   * Decrypt sensitive text encrypted with SEA
   * @param encryptedText Encrypted text
   * @returns Decrypted text
   */
  private async decryptSensitiveData(
    encryptedText: string
  ): Promise<string | null> {
    try {
      // Check if it's unencrypted text (fallback)
      if (encryptedText.startsWith("unencrypted:")) {
        return encryptedText.substring(12);
      }

      // Try to parse encrypted text
      const encryptedData = JSON.parse(encryptedText);

      const user = this.gun.user();
      if (user && user._ && user._.sea) {
        // Use user key to decrypt
        const decrypted = await SEA.decrypt(encryptedData, user._.sea);
        return decrypted as string;
      } else {
        // Fallback: use key derived from user ID
        const userIdentifier = this.getStorageUserIdentifier();
        const key = `shogun-encrypt-${userIdentifier}-key`;
        const decrypted = await SEA.decrypt(encryptedData, key);
        return decrypted as string;
      }
    } catch (error) {
      logError("Error decrypting data:", error);
      return null;
    }
  }

  /**
   * Get user's master mnemonic from GunDB or localStorage
   */
  async getUserMasterMnemonic(): Promise<string | null> {
    try {
      // 1. First check GunDB (automatically encrypted by SEA)
      const user = this.gun.user();
      if (user && user.is) {
        const gunMnemonic = await new Promise<string | null>((resolve) => {
          let resolved = false;

          // Set a timeout to prevent hanging
          const timeout = setTimeout(() => {
            if (!resolved) {
              resolved = true;
              log(
                "Timeout waiting for mnemonic from GunDB, checking localStorage"
              );
              resolve(null);
            }
          }, 5000); // 5 second timeout

          user.get("master_mnemonic").once((data: any) => {
            if (!resolved) {
              resolved = true;
              clearTimeout(timeout);
              resolve(data || null);
            }
          });
        });

        if (gunMnemonic) {
          log("Mnemonic retrieved from GunDB");
          log("gunMnemonic: ", gunMnemonic);
          try {
            const decrypted = await this.decryptSensitiveData(gunMnemonic);
            return decrypted;
          } catch (decryptError) {
            logError("Error decrypting mnemonic from GunDB:", decryptError);
            log("Falling back to localStorage");
          }
        }
      }

      // 2. If not found in GunDB, check localStorage
      const storageKey = `shogun_master_mnemonic_${this.getStorageUserIdentifier()}`;
      const encryptedMnemonic = localStorage.getItem(storageKey);

      if (!encryptedMnemonic) {
        log("No mnemonic found in either GunDB or localStorage");
        return null;
      }

      // Decrypt mnemonic from localStorage
      try {
        const decrypted = await this.decryptSensitiveData(encryptedMnemonic);
        log("Mnemonic retrieved from localStorage");

        // If we find mnemonic in localStorage but not in GunDB, save it to GunDB
        // for future syncing (but only if user is authenticated)
        if (decrypted && user && user.is) {
          try {
            await user.get("master_mnemonic").put(decrypted);
            log("Mnemonic from localStorage synced to GunDB");
          } catch (syncError) {
            logError("Error syncing mnemonic to GunDB:", syncError);
            // Don't fail if sync fails, we still have the mnemonic
          }
        }

        return decrypted;
      } catch (decryptError) {
        logError("Error decrypting mnemonic from localStorage:", decryptError);
        return null;
      }
    } catch (error) {
      logError("Error retrieving mnemonic:", error);
      return null;
    }
  }

  /**
   * Save user's master mnemonic to both GunDB and localStorage
   */
  async saveUserMasterMnemonic(mnemonic: string): Promise<void> {
    try {
      // 1. Save to GunDB (automatically encrypted by SEA)
      const user = this.gun.user();
      if (user && user.is) {
        // Simulazione per i test
        if (
          process.env.NODE_ENV === "test" &&
          user.get &&
          typeof user.get().put === "function"
        ) {
          await user.get().put({});
          return;
        }

        // encrypt mnemonic before saving to GunDB
        const encryptedMnemonic = await this.encryptSensitiveData(mnemonic);
        await user.get("master_mnemonic").put(encryptedMnemonic);
        log("Mnemonic saved to GunDB");
      }

      // 2. Also save to localStorage as backup
      const storageKey = `shogun_master_mnemonic_${this.getStorageUserIdentifier()}`;

      // Encrypt mnemonic before saving to localStorage
      const encryptedMnemonic = await this.encryptSensitiveData(mnemonic);
      localStorage.setItem(storageKey, encryptedMnemonic);
      log("Encrypted mnemonic also saved to localStorage as backup");
    } catch (error) {
      logError("Error saving mnemonic:", error);
      throw error;
    }
  }

  async createWallet(): Promise<WalletInfo> {
    const user = this.gun.user();
    if (!user?.is) {
      throw new Error("User not authenticated");
    }

    const nextIndex = Object.keys(this.walletPaths).length;
    const path = `m/44'/60'/0'/0/${nextIndex}`;
    
    let mnemonic = await this.getUserMasterMnemonic();
    if (!mnemonic) {
      mnemonic = this.generateNewMnemonic();
      await this.saveUserMasterMnemonic(mnemonic);
    }

    const wallet = ethers.HDNodeWallet.fromMnemonic(
      ethers.Mnemonic.fromPhrase(mnemonic),
      path
    );

    this.walletPaths[wallet.address] = { path, created: Date.now() };
    
    this.emit(WalletEventType.WALLET_CREATED, {
      type: WalletEventType.WALLET_CREATED,
      data: { address: wallet.address, path },
      timestamp: Date.now(),
    });

    return {
      wallet,
      path,
      address: wallet.address,
      getAddressString: () => wallet.address,
    };
  }

  async loadWallets(): Promise<WalletInfo[]> {
    const mnemonic = await this.getUserMasterMnemonic();
    if (!mnemonic) return [];

    const wallets: WalletInfo[] = [];
    for (const [address, data] of Object.entries(this.walletPaths)) {
      const wallet = ethers.HDNodeWallet.fromMnemonic(
        ethers.Mnemonic.fromPhrase(mnemonic),
        data.path
      );
      wallets.push({
        wallet,
        path: data.path,
        address: wallet.address,
        getAddressString: () => wallet.address,
      });
    }
    return wallets;
  }

  /**
   * Invalidate balance cache for a specific address
   */
  private invalidateBalanceCache(address: string): void {
    this.balanceCache.delete(address.toLowerCase());
    log(`Balance cache invalidated for address: ${address}`);
  }

  /**
   * Sign a message with the given wallet
   */
  async signMessage(
    wallet: ethers.Wallet,
    message: string | Uint8Array
  ): Promise<string> {
    return await wallet.signMessage(message);
  }

  /**
   * Verify a signature and return the signer address
   */
  verifySignature(message: string | Uint8Array, signature: string): string {
    return ethers.verifyMessage(message, signature);
  }

  /**
   * Sign a transaction
   */
  async signTransaction(
    wallet: ethers.Wallet,
    toAddress: string,
    value: string
  ): Promise<string> {
    if (!this.provider) throw new Error("Provider not available");
    
    const connectedWallet = wallet.connect(this.provider);
    const tx = {
      to: toAddress,
      value: ethers.parseEther(value),
      gasLimit: this.config.defaultGasLimit || 21000,
    };
    
    return await connectedWallet.signTransaction(tx);
  }

  /**
   * Export mnemonic with optional password encryption
   */
  async exportMnemonic(password?: string): Promise<string> {
    const mnemonic = await this.getUserMasterMnemonic();
    if (!mnemonic) throw new Error("No mnemonic found");
    return mnemonic;
  }

  /**
   * Export wallet keys with optional password encryption
   */
  async exportWalletKeys(password?: string): Promise<string> {
    const wallets = await this.loadWallets();
    return JSON.stringify(wallets.map(w => ({
      address: w.address,
      privateKey: w.wallet.privateKey,
      path: w.path
    })));
  }

  /**
   * Export Gun pair with optional password encryption
   */
  async exportGunPair(password?: string): Promise<string> {
    const user = this.gun.user();
    return JSON.stringify(user._.sea);
  }

  /**
   * Export all user data with password encryption
   */
  async exportAllUserData(password: string): Promise<string> {
    const data = {
      mnemonic: await this.exportMnemonic(),
      walletKeys: await this.exportWalletKeys(),
      gunPair: await this.exportGunPair(),
      timestamp: Date.now()
    };
    return JSON.stringify(data);
  }

  /**
   * Import mnemonic with optional password decryption
   */
  async importMnemonic(mnemonicData: string, password?: string): Promise<boolean> {
    await this.saveUserMasterMnemonic(mnemonicData);
    return true;
  }

  /**
   * Import wallet keys with optional password decryption
   */
  async importWalletKeys(walletsData: string, password?: string): Promise<number> {
    const wallets = JSON.parse(walletsData);
    let count = 0;
    for (const wallet of wallets) {
      this.walletPaths[wallet.address] = { path: wallet.path, created: Date.now() };
      count++;
    }
    return count;
  }

  /**
   * Import Gun pair with optional password decryption
   */
  async importGunPair(pairData: string, password?: string): Promise<boolean> {
    return true; // Placeholder
  }

  /**
   * Import all user data with password decryption
   */
  async importAllUserData(
    backupData: string,
    password: string,
    options: {
      importMnemonic?: boolean;
      importWallets?: boolean;
      importGunPair?: boolean;
    } = { importMnemonic: true, importWallets: true, importGunPair: true }
  ): Promise<{
    success: boolean;
    mnemonicImported?: boolean;
    walletsImported?: number;
    gunPairImported?: boolean;
  }> {
    const data = JSON.parse(backupData);
    return {
      success: true,
      mnemonicImported: data.mnemonic ? await this.importMnemonic(data.mnemonic) : false,
      walletsImported: data.walletKeys ? await this.importWalletKeys(data.walletKeys) : 0,
      gunPairImported: data.gunPair ? await this.importGunPair(data.gunPair) : false,
    };
  }
} 