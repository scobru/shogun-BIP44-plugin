import { BasePlugin } from "./base";
import { HDWallet } from "./hdwallet";
import { 
  HDWalletPluginInterface,
  WalletInfo,
  WalletConfig
} from "./types";
import { ethers } from "ethers";
import { log } from "./utils";

/**
 * Plugin per la gestione delle funzionalità HD Wallet in ShogunCore
 */
export class HDWalletPlugin 
  extends BasePlugin 
  implements HDWalletPluginInterface 
{
  name = "hdwallet";
  version = "1.0.0";
  description = "Provides HD wallet functionality for ShogunCore";

  private hdWallet: HDWallet | null = null;

  /**
   * @inheritdoc
   */
  initialize(core: any): void {
    super.initialize(core);

    if (!core.gun) {
      throw new Error("Gun dependency not available in core");
    }

    const config: WalletConfig = core.config?.wallet || {};
    this.hdWallet = new HDWallet(core.gun, config);

    // Setup RPC URL if provided
    if (config.rpcUrl) {
      this.hdWallet.setRpcUrl(config.rpcUrl);
    }

    log(`HDWallet plugin initialized with Gun`);
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
  async importMnemonic(mnemonicData: string, password?: string): Promise<boolean> {
    this.assertInitialized();
    if (!this.hdWallet) {
      throw new Error("HDWallet not available");
    }

    return await this.hdWallet.importMnemonic(mnemonicData, password);
  }

  /**
   * @inheritdoc
   */
  async importWalletKeys(walletsData: string, password?: string): Promise<number> {
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

    // Semplificata per evitare errori TypeScript
    return this.hdWallet.getProvider() ? "configured" : null;
  }
} 