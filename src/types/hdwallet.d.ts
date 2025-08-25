import { EventEmitter } from "./utils";
import { ethers } from "ethers";
import { WalletPath as IWalletPath, BalanceCache as IBalanceCache, WalletExport as IWalletExport, WalletConfig, WalletInfo } from "./types";
export type WalletPath = IWalletPath;
export type BalanceCache = IBalanceCache;
export type WalletExport = IWalletExport;
/**
 * Class that manages Ethereum wallet functionality including:
 * - Wallet creation and derivation
 * - Balance checking and transactions
 * - Importing/exporting wallets
 * - Encrypted storage and backup
 */
export declare class HDWallet extends EventEmitter {
    private readonly gun;
    private walletPaths;
    private mainWallet;
    private readonly balanceCache;
    private readonly pendingTransactions;
    private readonly config;
    private transactionMonitoringInterval;
    private provider;
    private signer;
    /**
     * Creates a new WalletManager instance
     * @param gun Raw Gun instance
     * @param storage Storage interface for local persistence
     * @param config Additional configuration options
     */
    constructor(gun: any, config?: Partial<WalletConfig>);
    /**
     * Initialize wallet paths synchronously with basic setup
     * @private
     */
    private initWalletPathsSync;
    /**
     * Initializes wallet paths from both GunDB and localStorage
     * Call this method explicitly when needed
     * @public
     * @throws {Error} If there's an error during wallet path initialization
     */
    initializeWalletPaths(): Promise<void>;
    /**
     * Loads wallet paths from localStorage as backup
     * @private
     */
    private loadWalletPathsFromLocalStorage;
    /**
     * Loads wallet paths from GunDB
     * @private
     */
    private loadWalletPathsFromGun;
    /**
     * Setup transaction monitoring
     */
    private setupTransactionMonitoring;
    cleanup(): void;
    /**
     * Check status of pending transactions
     */
    private checkPendingTransactions;
    /**
     * Sets the RPC URL used for Ethereum network connections
     * @param rpcUrl The RPC provider URL to use
     */
    setRpcUrl(rpcUrl: string): void;
    /**
     * Gets a configured JSON RPC provider instance
     * @returns An ethers.js JsonRpcProvider instance
     */
    getProvider(): ethers.JsonRpcProvider | null;
    getSigner(): ethers.Wallet;
    setSigner(signer: ethers.Wallet): void;
    /**
     * Gets a unique identifier for the current user for storage purposes
     * @private
     * @returns A string identifier based on user's public key or "guest"
     */
    private getStorageUserIdentifier;
    /**
     * Saves wallet paths to localStorage for backup
     * @private
     */
    private saveWalletPathsToLocalStorage;
    /**
     * Derives a private wallet from a mnemonic and derivation path
     * @param mnemonic The BIP-39 mnemonic phrase
     * @param path The derivation path
     * @returns A derived HDNodeWallet instance
     * @private
     */
    private derivePrivateKeyFromMnemonic;
    /**
     * Generate a new BIP-39 standard mnemonic compatible with all wallets
     * @returns A new 12-word BIP-39 mnemonic phrase
     */
    generateNewMnemonic(): string;
    /**
     * Get addresses that would be derived from a mnemonic using BIP-44 standard
     * This is useful to verify that wallets are correctly compatible with MetaMask and other wallets
     * @param mnemonic The BIP-39 mnemonic phrase
     * @param count Number of addresses to derive
     * @returns An array of Ethereum addresses
     */
    getStandardBIP44Addresses(mnemonic: string, count?: number): string[];
    /**
     * Override of main function with fixes and improvements
     */
    private generatePrivateKeyFromString;
    /**
     * Get the main wallet
     */
    getMainWallet(): ethers.Wallet;
    /**
     * Get the main wallet credentials
     */
    getMainWalletCredentials(): {
        address: string;
        priv: string;
    };
    /**
     * Encrypt sensitive text using SEA
     * @param text Text to encrypt
     * @returns Encrypted text
     */
    private encryptSensitiveData;
    /**
     * Decrypt sensitive text encrypted with SEA
     * @param encryptedText Encrypted text
     * @returns Decrypted text
     */
    private decryptSensitiveData;
    /**
     * Get user's master mnemonic from GunDB or localStorage
     */
    getUserMasterMnemonic(): Promise<string | null>;
    /**
     * Save user's master mnemonic to both GunDB and localStorage
     */
    saveUserMasterMnemonic(mnemonic: string): Promise<void>;
    createWallet(): Promise<WalletInfo>;
    loadWallets(): Promise<WalletInfo[]>;
    /**
     * Invalidate balance cache for a specific address
     */
    private invalidateBalanceCache;
    /**
     * Sign a message with the given wallet
     */
    signMessage(wallet: ethers.Wallet, message: string | Uint8Array): Promise<string>;
    /**
     * Verify a signature and return the signer address
     */
    verifySignature(message: string | Uint8Array, signature: string): string;
    /**
     * Sign a transaction
     */
    signTransaction(wallet: ethers.Wallet, toAddress: string, value: string): Promise<string>;
    /**
     * Export mnemonic with optional password encryption
     */
    exportMnemonic(password?: string): Promise<string>;
    /**
     * Export wallet keys with optional password encryption
     */
    exportWalletKeys(password?: string): Promise<string>;
    /**
     * Export Gun pair with optional password encryption
     */
    exportGunPair(password?: string): Promise<string>;
    /**
     * Export all user data with password encryption
     */
    exportAllUserData(password: string): Promise<string>;
    /**
     * Import mnemonic with optional password decryption
     */
    importMnemonic(mnemonicData: string, password?: string): Promise<boolean>;
    /**
     * Import wallet keys with optional password decryption
     */
    importWalletKeys(walletsData: string, password?: string): Promise<number>;
    /**
     * Import Gun pair with optional password decryption
     */
    importGunPair(pairData: string, password?: string): Promise<boolean>;
    /**
     * Import all user data with password decryption
     */
    importAllUserData(backupData: string, password: string, options?: {
        importMnemonic?: boolean;
        importWallets?: boolean;
        importGunPair?: boolean;
    }): Promise<{
        success: boolean;
        mnemonicImported?: boolean;
        walletsImported?: number;
        gunPairImported?: boolean;
    }>;
}
