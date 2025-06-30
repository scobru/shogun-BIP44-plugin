import { ethers } from "ethers";
import { BasePlugin } from "./base";
import { HDWallet } from "./hdwallet";
import { log, logError, ErrorHandler, ErrorType } from "./utils";
/**
 * Plugin per la gestione dei wallet in ShogunCore
 */
export class HDWalletPlugin extends BasePlugin {
    constructor() {
        super(...arguments);
        this.name = "bip44";
        this.version = "1.0.0";
        this.description = "Provides wallet management functionality for Shogun Core";
        this.hdwallet = null;
    }
    /**
     * @inheritdoc
     */
    initialize(core) {
        super.initialize(core);
        if (!core.gundb || !core.gun) {
            throw new Error("Core dependencies not available");
        }
        // Creiamo un nuovo WalletManager
        this.hdwallet = new HDWallet(core.gun, {
            // Recuperiamo configurazione dal core se disponibile
            balanceCacheTTL: core.config?.bip44?.balanceCacheTTL,
            rpcUrl: core.provider instanceof ethers.JsonRpcProvider
                ? core.provider.connection?.url
                : undefined,
        });
        log("Wallet plugin initialized");
    }
    /**
     * @inheritdoc
     */
    destroy() {
        this.hdwallet = null;
        super.destroy();
        log("Wallet plugin destroyed");
    }
    /**
     * Assicura che il wallet manager sia inizializzato
     * @private
     */
    assertHDWallet() {
        this.assertInitialized();
        if (!this.hdwallet) {
            throw new Error("Wallet manager not initialized");
        }
        return this.hdwallet;
    }
    // --- IMPLEMENTAZIONE METODI WALLET ---
    /**
     * @inheritdoc
     */
    getMainWallet() {
        return this.assertHDWallet().getMainWallet();
    }
    /**
     * @inheritdoc
     */
    getMainWalletCredentials() {
        return this.assertHDWallet().getMainWalletCredentials();
    }
    /**
     * @inheritdoc
     */
    async createWallet() {
        return this.assertHDWallet().createWallet();
    }
    /**
     * @inheritdoc
     */
    async loadWallets() {
        try {
            const manager = this.assertHDWallet();
            if (!this.core?.isLoggedIn()) {
                log("Cannot load wallets: user not authenticated");
                // Segnaliamo l'errore con il gestore centralizzato
                ErrorHandler.handle(ErrorType.AUTHENTICATION, "AUTH_REQUIRED", "User authentication required to load wallets", null);
                return [];
            }
            return await manager.loadWallets();
        }
        catch (error) {
            // Gestiamo l'errore in modo dettagliato
            ErrorHandler.handle(ErrorType.WALLET, "LOAD_WALLETS_ERROR", `Error loading wallets: ${error instanceof Error ? error.message : String(error)}`, error);
            // Ritorniamo un array vuoto
            return [];
        }
    }
    /**
     * @inheritdoc
     */
    getStandardBIP44Addresses(mnemonic, count = 5) {
        return this.assertHDWallet().getStandardBIP44Addresses(mnemonic, count);
    }
    /**
     * @inheritdoc
     */
    generateNewMnemonic() {
        try {
            // Generate a new mnemonic phrase using ethers.js
            const mnemonic = ethers.Wallet.createRandom().mnemonic;
            if (!mnemonic || !mnemonic.phrase) {
                throw new Error("Failed to generate mnemonic phrase");
            }
            return mnemonic.phrase;
        }
        catch (error) {
            logError("Error generating mnemonic:", error);
            throw new Error("Failed to generate mnemonic phrase");
        }
    }
    /**
     * @inheritdoc
     */
    async signMessage(wallet, message) {
        return this.assertHDWallet().signMessage(wallet, message);
    }
    /**
     * @inheritdoc
     */
    verifySignature(message, signature) {
        return this.assertHDWallet().verifySignature(message, signature);
    }
    /**
     * @inheritdoc
     */
    async signTransaction(wallet, toAddress, value) {
        return this.assertHDWallet().signTransaction(wallet, toAddress, value);
    }
    /**
     * @inheritdoc
     */
    async exportMnemonic(password) {
        return this.assertHDWallet().exportMnemonic(password);
    }
    /**
     * @inheritdoc
     */
    async exportWalletKeys(password) {
        return this.assertHDWallet().exportWalletKeys(password);
    }
    /**
     * @inheritdoc
     */
    async exportGunPair(password) {
        return this.assertHDWallet().exportGunPair(password);
    }
    /**
     * @inheritdoc
     */
    async exportAllUserData(password) {
        return this.assertHDWallet().exportAllUserData(password);
    }
    /**
     * @inheritdoc
     */
    async importMnemonic(mnemonicData, password) {
        return this.assertHDWallet().importMnemonic(mnemonicData, password);
    }
    /**
     * @inheritdoc
     */
    async importWalletKeys(walletsData, password) {
        return this.assertHDWallet().importWalletKeys(walletsData, password);
    }
    /**
     * @inheritdoc
     */
    async importGunPair(pairData, password) {
        return this.assertHDWallet().importGunPair(pairData, password);
    }
    /**
     * @inheritdoc
     */
    async importAllUserData(backupData, password, options = { importMnemonic: true, importWallets: true, importGunPair: true }) {
        return this.assertHDWallet().importAllUserData(backupData, password, options);
    }
    /**
     * @inheritdoc
     */
    setRpcUrl(rpcUrl) {
        try {
            if (!rpcUrl) {
                log("Invalid RPC URL provided");
                return false;
            }
            this.assertHDWallet().setRpcUrl(rpcUrl);
            // Aggiorniamo anche il provider nel core se accessibile
            if (this.core) {
                this.core.provider = new ethers.JsonRpcProvider(rpcUrl);
            }
            log(`RPC URL updated to: ${rpcUrl}`);
            return true;
        }
        catch (error) {
            logError("Failed to set RPC URL", error);
            return false;
        }
    }
    /**
     * @inheritdoc
     */
    getRpcUrl() {
        if (!this.core) {
            return null;
        }
        // Accediamo all'URL del provider se disponibile
        return this.core.provider instanceof ethers.JsonRpcProvider
            ? this.core.provider.connection?.url || null
            : null;
    }
    /**
     * @inheritdoc
     */
    setSigner(signer) {
        this.assertHDWallet().setSigner(signer);
    }
    /**
     * @inheritdoc
     */
    getSigner() {
        return this.assertHDWallet().getSigner();
    }
    /**
     * @inheritdoc
     */
    getProvider() {
        return this.assertHDWallet().getProvider();
    }
}
//# sourceMappingURL=hdwalletPlugin.js.map