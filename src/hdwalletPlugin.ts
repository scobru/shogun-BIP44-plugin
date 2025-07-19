import { BasePlugin } from "./base";
import { HDWallet } from "./hdwallet";
import { HDWalletPluginInterface, WalletInfo, WalletConfig } from "./types";
import { ethers } from "ethers";
import { log } from "./utils";
import { ShogunCore, ShogunSDKConfig, PluginCategory } from "shogun-core";

/**
 * Plugin for HD wallet functionality management in ShogunCore
 */
export class HDWalletPlugin
  extends BasePlugin
  implements HDWalletPluginInterface
{
  name = "hdwallet";
  version = "1.0.0";
  description = "Provides HD wallet functionality for ShogunCore";
  _category = PluginCategory.Wallet;

  private hdWallet: HDWallet | null = null;
  private walletConfig: WalletConfig = {};

  /**
   * HD Wallet plugin constructor
   * @param config Optional wallet configuration
   */
  constructor(config?: Partial<WalletConfig>) {
    super();
    this.walletConfig = {
      balanceCacheTTL: 30000,
      defaultGasLimit: 21000,
      maxRetries: 3,
      retryDelay: 1000,
      ...config,
    };
  }

  /**
   * @inheritdoc
   */
  initialize(core: ShogunCore): void {
    super.initialize(core);

    if (!core.gun) {
      throw new Error("Gun dependency not available in core");
    }

    this.hdWallet = new HDWallet(core.gun, this.walletConfig);

    // Setup RPC URL if provided
    if (this.walletConfig.rpcUrl) {
      this.hdWallet.setRpcUrl(this.walletConfig.rpcUrl);
    }

    // Listen to core authentication events
    this.setupCoreEventListeners();

    log(`HDWallet plugin initialized with Gun`);
  }

  /**
   * Setup event listeners for core authentication events
   */
  private setupCoreEventListeners(): void {
    if (!this.core) return;

    // Listen to login events
    this.core.on("auth:login", (data: any) => {
      log("User logged in, initializing wallet paths");
      this.hdWallet?.initializeWalletPathsAndTestEncryption().catch((error) => {
        log(`Error initializing wallet paths: ${error}`);
      });
    });

    // Listen to logout events
    this.core.on("auth:logout", () => {
      log("User logged out, cleaning up wallet data");
      this.hdWallet?.cleanup();
    });
  }

  /**
   * @inheritdoc
   */
  destroy(): void {
    if (this.hdWallet) {
      // Clean up any resources
      this.hdWallet = null;
    }
    super.destroy();
  }

  /**
   * @inheritdoc
   */
  getMainWallet(): ethers.Wallet | null {
    this.assertInitialized();
    if (!this.hdWallet) {
      return null;
    }

    try {
      return this.hdWallet.getMainWallet();
    } catch (error) {
      log(`Error getting main wallet: ${error}`);
      return null;
    }
  }

  /**
   * @inheritdoc
   */
  getMainWalletCredentials(): { address: string; priv: string } {
    this.assertInitialized();
    if (!this.hdWallet) {
      throw new Error("HDWallet not available");
    }

    return this.hdWallet.getMainWalletCredentials();
  }

  /**
   * @inheritdoc
   */
  async createWallet(): Promise<WalletInfo> {
    this.assertInitialized();
    if (!this.hdWallet) {
      throw new Error("HDWallet not available");
    }

    return await this.hdWallet.createWallet();
  }

  /**
   * @inheritdoc
   */
  async loadWallets(): Promise<WalletInfo[]> {
    this.assertInitialized();
    if (!this.hdWallet) {
      throw new Error("HDWallet not available");
    }

    return await this.hdWallet.loadWallets();
  }

  /**
   * @inheritdoc
   */
  async signMessage(
    wallet: ethers.Wallet,
    message: string | Uint8Array
  ): Promise<string> {
    this.assertInitialized();
    if (!this.hdWallet) {
      throw new Error("HDWallet not available");
    }

    return await this.hdWallet.signMessage(wallet, message);
  }

  /**
   * @inheritdoc
   */
  verifySignature(message: string | Uint8Array, signature: string): string {
    this.assertInitialized();
    if (!this.hdWallet) {
      throw new Error("HDWallet not available");
    }

    return this.hdWallet.verifySignature(message, signature);
  }

  /**
   * @inheritdoc
   */
  async signTransaction(
    wallet: ethers.Wallet,
    toAddress: string,
    value: string
  ): Promise<string> {
    this.assertInitialized();
    if (!this.hdWallet) {
      throw new Error("HDWallet not available");
    }

    return await this.hdWallet.signTransaction(wallet, toAddress, value);
  }

  /**
   * @inheritdoc
   */
  getStandardBIP44Addresses(mnemonic: string, count?: number): string[] {
    this.assertInitialized();
    if (!this.hdWallet) {
      throw new Error("HDWallet not available");
    }

    return this.hdWallet.getStandardBIP44Addresses(mnemonic, count);
  }

  /**
   * @inheritdoc
   */
  generateNewMnemonic(): string {
    this.assertInitialized();
    if (!this.hdWallet) {
      throw new Error("HDWallet not available");
    }

    return this.hdWallet.generateNewMnemonic();
  }

  /**
   * Save user's master mnemonic securely (encrypted)
   */
  async saveUserMasterMnemonic(mnemonic: string): Promise<void> {
    this.assertInitialized();
    if (!this.hdWallet) {
      throw new Error("HDWallet not available");
    }

    return await this.hdWallet.saveUserMasterMnemonic(mnemonic);
  }

  /**
   * @inheritdoc
   */
  async exportMnemonic(password?: string): Promise<string> {
    this.assertInitialized();
    if (!this.hdWallet) {
      throw new Error("HDWallet not available");
    }

    return await this.hdWallet.exportMnemonic(password);
  }

  /**
   * @inheritdoc
   */
  async exportWalletKeys(password?: string): Promise<string> {
    this.assertInitialized();
    if (!this.hdWallet) {
      throw new Error("HDWallet not available");
    }

    return await this.hdWallet.exportWalletKeys(password);
  }

  /**
   * @inheritdoc
   */
  async exportGunPair(password?: string): Promise<string> {
    this.assertInitialized();
    if (!this.hdWallet) {
      throw new Error("HDWallet not available");
    }

    return await this.hdWallet.exportGunPair(password);
  }

  /**
   * @inheritdoc
   */
  async exportAllUserData(password: string): Promise<string> {
    this.assertInitialized();
    if (!this.hdWallet) {
      throw new Error("HDWallet not available");
    }

    return await this.hdWallet.exportAllUserData(password);
  }

  /**
   * @inheritdoc
   */
  async importMnemonic(
    mnemonicData: string,
    password?: string
  ): Promise<boolean> {
    this.assertInitialized();
    if (!this.hdWallet) {
      throw new Error("HDWallet not available");
    }

    return await this.hdWallet.importMnemonic(mnemonicData, password);
  }

  /**
   * @inheritdoc
   */
  async importWalletKeys(
    walletsData: string,
    password?: string
  ): Promise<number> {
    this.assertInitialized();
    if (!this.hdWallet) {
      throw new Error("HDWallet not available");
    }

    return await this.hdWallet.importWalletKeys(walletsData, password);
  }

  /**
   * @inheritdoc
   */
  async importGunPair(pairData: string, password?: string): Promise<boolean> {
    this.assertInitialized();
    if (!this.hdWallet) {
      throw new Error("HDWallet not available");
    }

    return await this.hdWallet.importGunPair(pairData, password);
  }

  /**
   * @inheritdoc
   */
  async importAllUserData(
    backupData: string,
    password: string,
    options?: {
      importMnemonic?: boolean;
      importWallets?: boolean;
      importGunPair?: boolean;
    }
  ): Promise<{
    success: boolean;
    mnemonicImported?: boolean;
    walletsImported?: number;
    gunPairImported?: boolean;
  }> {
    this.assertInitialized();
    if (!this.hdWallet) {
      throw new Error("HDWallet not available");
    }

    return await this.hdWallet.importAllUserData(backupData, password, options);
  }

  /**
   * @inheritdoc
   */
  setRpcUrl(rpcUrl: string): boolean {
    this.assertInitialized();
    if (!this.hdWallet) {
      return false;
    }

    try {
      this.hdWallet.setRpcUrl(rpcUrl);
      return true;
    } catch (error) {
      log(`Error setting RPC URL: ${error}`);
      return false;
    }
  }

  /**
   * @inheritdoc
   */
  getRpcUrl(): string | null {
    this.assertInitialized();
    if (!this.hdWallet) {
      return null;
    }

    // Simplified to avoid TypeScript errors
    return this.hdWallet.getProvider() ? "configured" : null;
  }

  /**
   * Get JSON RPC provider
   * @returns The ethers.js provider or null if not available
   */
  getProvider(): ethers.JsonRpcProvider | null {
    this.assertInitialized();
    if (!this.hdWallet) {
      return null;
    }

    return this.hdWallet.getProvider();
  }

  /**
   * Get user's master mnemonic
   * @returns Promise with mnemonic or null if not available
   */
  async getUserMasterMnemonic(): Promise<string | null> {
    this.assertInitialized();
    if (!this.hdWallet) {
      return null;
    }

    return await this.hdWallet.getUserMasterMnemonic();
  }

  /**
   * Force synchronization of mnemonic between GunDB and localStorage
   * @returns Promise resolving to sync success status
   */
  async forceMnemonicSync(): Promise<boolean> {
    this.assertInitialized();
    if (!this.hdWallet) {
      return false;
    }

    return await this.hdWallet.forceMnemonicSync();
  }

  /**
   * Get current mnemonic status (where it's stored)
   * @returns Promise with mnemonic status information
   */
  async getMnemonicStatus(): Promise<{
    hasGunDB: boolean;
    hasLocalStorage: boolean;
    isSynced: boolean;
  }> {
    this.assertInitialized();
    if (!this.hdWallet) {
      return { hasGunDB: false, hasLocalStorage: false, isSynced: false };
    }

    return await this.hdWallet.getMnemonicStatus();
  }

  /**
   * Get current wallet configuration
   * @returns Wallet configuration
   */
  getWalletConfig(): WalletConfig {
    return { ...this.walletConfig };
  }

  /**
   * Update wallet configuration
   * @param config Partial new configuration
   */
  updateWalletConfig(config: Partial<WalletConfig>): void {
    this.assertInitialized();
    if (!this.hdWallet) {
      throw new Error("HDWallet not available");
    }

    this.walletConfig = { ...this.walletConfig, ...config };
  }

  /**
   * Reset wallet paths initialization state
   * Call this when user logs out or when you need to force re-initialization
   */
  resetWalletPathsInitialization(): void {
    this.assertInitialized();
    if (!this.hdWallet) {
      throw new Error("HDWallet not available");
    }

    this.hdWallet.resetWalletPathsInitialization();
  }

  /**
   * Set RPC URL and update config
   */
  setRpcUrlAndUpdateConfig(rpcUrl: string): boolean {
    this.assertInitialized();
    if (!this.hdWallet) {
      return false;
    }

    this.hdWallet.setRpcUrl(rpcUrl);
    this.walletConfig.rpcUrl = rpcUrl;
    return true;
  }
}
