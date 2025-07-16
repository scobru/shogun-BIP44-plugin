// Inside a class extended from your HDWalletPlugin, or a new plugin that uses it
import { HDWalletPlugin } from "./hdwalletPlugin";
import { ethers } from "ethers";
import { log, logError, logWarn } from "./utils";
import { WalletConfig } from "./types";
import ShogunCore, { PluginCategory } from "shogun-core";

/**
 * ACCOUNT ABSTRACTION (ERC-4337) - HOW IT WORKS
 *
 * Account Abstraction allows users to use Smart Contract Accounts without
 * having to manage gas fees directly. There are two main modes:
 *
 * 1. GASLESS (with Paymaster):
 *    - User has NO funds in their wallet
 *    - A Paymaster (from dev/project) pays the gas fees
 *    - User only signs the UserOperation
 *    - Bundler sends the UserOperation to EntryPoint
 *
 * 2. SELF-FUNDED:
 *    - User HAS funds in their Smart Account
 *    - User pays gas fees from their Smart Account
 *    - Still needs a Bundler to send the UserOperation
 *
 * CORRECT FLOW:
 * 1. User creates/signs UserOperation
 * 2. UserOperation sent to Bundler (NOT directly to EntryPoint)
 * 3. Bundler validates and sends to EntryPoint
 * 4. EntryPoint executes the transaction
 *
 * IMPORTANT: End users should NEVER send transactions directly
 * to EntryPoint, but always through Bundler.
 */

// Interfaces for Account Abstraction
export interface UserOperation {
  sender: string;
  nonce: string;
  initCode: string;
  callData: string;
  callGasLimit: string;
  verificationGasLimit: string;
  preVerificationGas: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
  paymasterAndData: string;
  signature: string;
}

export interface UserOperationOptions {
  to?: string;
  value?: string;
  data?: string;
  gasLimit?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  paymaster?: string;
}

export interface SmartAccountConfig {
  entryPointAddress: string;
  accountFactoryAddress: string;
  paymasterAddress?: string;
  bundlerUrl?: string;
}

export class AccountAbstractionPlugin extends HDWalletPlugin {
  name = "account-abstraction";
  version = "1.0.0";
  description = "Account Abstraction plugin based on BIP44 and ERC-4337";
  _category = PluginCategory.Wallet;

  private config: SmartAccountConfig;
  private entryPointContract: ethers.Contract | null = null;
  private accountFactoryContract: ethers.Contract | null = null;
  private paymasterData: string = "0x"; // Additional data for paymaster

  constructor(
    aaConfig?: Partial<SmartAccountConfig>,
    walletConfig?: Partial<WalletConfig>
  ) {
    super(walletConfig); // Pass wallet configuration to parent constructor

    this.config = {
      entryPointAddress: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789", // Standard EntryPoint
      accountFactoryAddress: "0x0000000000000000000000000000000000000000", // To be configured
      ...aaConfig,
    };
  }

  /**
   * Initialize the plugin with ERC-4337 configurations
   */
  initialize(core: ShogunCore): void {
    super.initialize(core);

    // Initialize contracts if provider is available
    if (this.getProvider()) {
      this.initializeContracts();
    }

    log("Account Abstraction plugin initialized");
  }

  /**
   * Initialize ERC-4337 contracts
   */
  private initializeContracts(): void {
    const provider = this.getProvider();
    if (!provider) {
      logError("Provider not available to initialize contracts");
      return;
    }

    try {
      // EntryPoint ABI (simplified)
      const entryPointABI = [
        "function handleOps(tuple(address sender, uint256 nonce, bytes initCode, bytes callData, uint256 callGasLimit, uint256 verificationGasLimit, uint256 preVerificationGas, uint256 maxFeePerGas, uint256 maxPriorityFeePerGas, bytes paymasterAndData, bytes signature)[] calldata ops, address payable beneficiary) external",
        "function getNonce(address sender, uint192 key) external view returns (uint256)",
        "function getUserOpHash(tuple(address sender, uint256 nonce, bytes initCode, bytes callData, uint256 callGasLimit, uint256 verificationGasLimit, uint256 preVerificationGas, uint256 maxFeePerGas, uint256 maxPriorityFeePerGas, bytes paymasterAndData, bytes signature) calldata userOp) external pure returns (bytes32)",
      ];

      // AccountFactory ABI (simplified)
      const accountFactoryABI = [
        "function createAccount(address owner, uint256 salt) external returns (address)",
        "function getAddress(address owner, uint256 salt) external view returns (address)",
      ];

      // Smart Account ABI (simplified)
      const smartAccountABI = [
        "function execute(address target, uint256 value, bytes calldata data) external",
        "function executeBatch(address[] calldata targets, uint256[] calldata values, bytes[] calldata datas) external",
        "function nonce() external view returns (uint256)",
      ];

      this.entryPointContract = new ethers.Contract(
        this.config.entryPointAddress,
        entryPointABI,
        provider
      );

      if (
        this.config.accountFactoryAddress !==
        "0x0000000000000000000000000000000000000000"
      ) {
        this.accountFactoryContract = new ethers.Contract(
          this.config.accountFactoryAddress,
          accountFactoryABI,
          provider
        );
      }

      log("ERC-4337 contracts initialized");
    } catch (error) {
      logError("Error initializing contracts:", error);
    }
  }

  /**
   * Create or retrieve a deterministic Smart Contract Account for the user.
   * Uses a BIP44 derived key as owner/salt.
   * @param index The BIP44 index to derive the control key.
   * @returns The Smart Contract Account address.
   */
  async getOrCreateSmartAccount(index: number = 0): Promise<string> {
    this.assertInitialized();

    const mnemonic = await this.getUserMasterMnemonic();
    if (!mnemonic) {
      throw new Error("Mnemonic not available to derive account.");
    }

    // Derive a deterministic control key using BIP44
    const path = `m/44'/60'/0'/0/${index}`;
    const ownerWallet = ethers.HDNodeWallet.fromMnemonic(
      ethers.Mnemonic.fromPhrase(mnemonic),
      path
    );

    log(`Control key derived for index ${index}: ${ownerWallet.address}`);

    // If we don't have an AccountFactory configured, return a simulated address
    if (!this.accountFactoryContract) {
      log("AccountFactory not configured, returning simulated address");
      return this.generateDeterministicAddress(ownerWallet.address, index);
    }

    try {
      // Use owner address as salt for determinism
      const salt = ethers.keccak256(ethers.toUtf8Bytes(ownerWallet.address));

      // Check if account already exists
      const existingAddress = await (
        this.accountFactoryContract as any
      ).getAddress(ownerWallet.address, salt);

      // Check if account has balance or has been deployed
      const provider = this.getProvider();
      if (provider) {
        const balance = await provider.getBalance(existingAddress);
        if (balance > 0n) {
          log(`Existing Smart Account found: ${existingAddress}`);
          return existingAddress;
        }
      }

      // If it doesn't exist, create it
      log(`Creating new Smart Account for owner: ${ownerWallet.address}`);
      const tx = await this.accountFactoryContract.createAccount(
        ownerWallet.address,
        salt
      );
      const receipt = await tx.wait();

      // Extract address from creation log
      const createdAddress = this.extractCreatedAddress(receipt);
      log(`Smart Account created: ${createdAddress}`);

      return createdAddress;
    } catch (error) {
      logError("Error creating Smart Account:", error);
      // Fallback: generate deterministic address
      return this.generateDeterministicAddress(ownerWallet.address, index);
    }
  }

  /**
   * Generate a deterministic address for simulation
   */
  private generateDeterministicAddress(
    ownerAddress: string,
    index: number
  ): string {
    const seed = ethers.keccak256(
      ethers.toUtf8Bytes(`${ownerAddress}-${index}`)
    );
    const privateKey = ethers.keccak256(seed);
    const wallet = new ethers.Wallet(privateKey);
    return wallet.address;
  }

  /**
   * Extract created address from transaction receipt
   */
  private extractCreatedAddress(receipt: ethers.TransactionReceipt): string {
    // Look for account creation log
    for (const log of receipt.logs) {
      if (
        log.topics[0] ===
        ethers.keccak256(
          ethers.toUtf8Bytes("AccountCreated(address,address,uint256)")
        )
      ) {
        // Decode the created account address
        const accountAddress = ethers.getAddress(log.topics[1].slice(26)); // Remove 0x prefix and first 12 bytes
        return accountAddress;
      }
    }
    throw new Error("Created address not found in receipt");
  }

  /**
   * Build and send a UserOperation via Bundler.
   * @param sender The Smart Contract Account address.
   * @param callData The call data for the transaction.
   * @param options Additional options for the UserOperation.
   * @returns The UserOperation hash.
   */
  async sendUserOperation(
    sender: string,
    callData: string,
    options: UserOperationOptions = {}
  ): Promise<string> {
    this.assertInitialized();

    if (!this.entryPointContract) {
      throw new Error("EntryPoint not configured");
    }

    try {
      // Get current nonce
      const nonce = await this.getNonce(sender);

      // Build the UserOperation
      const userOp: UserOperation = {
        sender: sender,
        nonce: nonce.toString(),
        initCode: "0x", // Empty for existing accounts
        callData: callData,
        callGasLimit: options.gasLimit || "100000",
        verificationGasLimit: "100000",
        preVerificationGas: "21000",
        maxFeePerGas: options.maxFeePerGas || "2000000000", // 2 gwei
        maxPriorityFeePerGas: options.maxPriorityFeePerGas || "1000000000", // 1 gwei
        paymasterAndData: this.getPaymasterAndData(options),
        signature: "0x", // Will be signed after
      };

      // Calculate UserOperation hash
      const userOpHash = await this.entryPointContract.getUserOpHash(userOp);

      // Sign the UserOperation
      const signature = await this.signUserOperation(userOpHash);
      userOp.signature = signature;

      // Send UserOperation via Bundler (not directly!)
      if (this.config.bundlerUrl) {
        return await this.sendUserOperationViaBundler(userOp);
      } else {
        // Fallback: send directly (only for test/development)
        logWarn("No Bundler configured, direct sending (test only)");
        return await this.sendUserOperationDirect(userOp);
      }
    } catch (error) {
      logError("Error sending UserOperation:", error);
      throw error;
    }
  }

  /**
   * Send UserOperation via Bundler (correct method)
   */
  private async sendUserOperationViaBundler(
    userOp: UserOperation
  ): Promise<string> {
    if (!this.config.bundlerUrl) {
      throw new Error("Bundler URL not configured");
    }

    try {
      const response = await fetch(
        `${this.config.bundlerUrl}/eth_sendUserOperation`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "eth_sendUserOperation",
            params: [userOp, this.config.entryPointAddress],
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Bundler error: ${response.status} ${response.statusText}`
        );
      }

      const result = await response.json();

      if (result.error) {
        throw new Error(`Bundler error: ${result.error.message}`);
      }

      log(`UserOperation sent via Bundler, hash: ${result.result}`);
      return result.result;
    } catch (error) {
      logError("Error sending via Bundler:", error);
      throw error;
    }
  }

  /**
   * Send UserOperation directly (only for test/development)
   * WARNING: Requires signer to have funds to pay gas fees
   */
  private async sendUserOperationDirect(
    userOp: UserOperation
  ): Promise<string> {
    // This method requires the signer to have funds to pay gas fees
    // Useful only for testing or when dev pays the fees
    const mainWallet = this.getMainWallet();
    if (!mainWallet) {
      throw new Error("Main wallet not available for direct sending");
    }

    const provider = this.getProvider();
    if (!provider) {
      throw new Error("Provider not available for direct sending");
    }

    const signer = mainWallet.connect(provider);

    // Verify signer has funds
    const balance = await provider.getBalance(signer.address);
    if (!balance || balance === 0n) {
      throw new Error(
        "Signer has no funds to pay gas fees. Use a Bundler or Paymaster."
      );
    }

    const connectedEntryPoint = this.entryPointContract!.connect(signer);
    const tx = await (connectedEntryPoint as any).handleOps(
      [userOp],
      ethers.ZeroAddress
    );
    const receipt = await tx.wait();

    log(`UserOperation sent directly, hash: ${receipt.hash}`);
    return receipt.hash;
  }

  /**
   * Get current nonce for a Smart Account
   */
  private async getNonce(sender: string): Promise<bigint> {
    if (!this.entryPointContract) {
      throw new Error("EntryPoint not configured");
    }

    try {
      return await this.entryPointContract.getNonce(sender, 0);
    } catch (error) {
      logError("Error retrieving nonce:", error);
      return 0n;
    }
  }

  /**
   * Sign a UserOperation
   */
  private async signUserOperation(userOpHash: string): Promise<string> {
    const mainWallet = this.getMainWallet();
    if (!mainWallet) {
      throw new Error("Main wallet not available");
    }

    return await mainWallet.signMessage(ethers.getBytes(userOpHash));
  }

  /**
   * Execute a simple transaction via Smart Account
   */
  async executeTransaction(
    smartAccountAddress: string,
    target: string,
    value: string = "0",
    data: string = "0x"
  ): Promise<string> {
    const callData = this.encodeExecuteCall(target, value, data);
    return await this.sendUserOperation(smartAccountAddress, callData, {
      to: target,
      value: value,
    });
  }

  /**
   * Execute a batch of transactions via Smart Account
   */
  async executeBatch(
    smartAccountAddress: string,
    targets: string[],
    values: string[],
    datas: string[]
  ): Promise<string> {
    const callData = this.encodeExecuteBatchCall(targets, values, datas);
    return await this.sendUserOperation(smartAccountAddress, callData);
  }

  /**
   * Encode execute call for Smart Account
   */
  private encodeExecuteCall(
    target: string,
    value: string,
    data: string
  ): string {
    const iface = new ethers.Interface([
      "function execute(address target, uint256 value, bytes calldata data)",
    ]);
    return iface.encodeFunctionData("execute", [target, value, data]);
  }

  /**
   * Encode executeBatch call for Smart Account
   */
  private encodeExecuteBatchCall(
    targets: string[],
    values: string[],
    datas: string[]
  ): string {
    const iface = new ethers.Interface([
      "function executeBatch(address[] calldata targets, uint256[] calldata values, bytes[] calldata datas)",
    ]);
    return iface.encodeFunctionData("executeBatch", [targets, values, datas]);
  }

  /**
   * Configure AccountFactory
   */
  setAccountFactory(address: string): void {
    this.config.accountFactoryAddress = address;
    this.initializeContracts();
    log(`AccountFactory configured: ${address}`);
  }

  /**
   * Configure Paymaster
   */
  setPaymaster(address: string): void {
    this.config.paymasterAddress = address;
    log(`Paymaster configured: ${address}`);
  }

  /**
   * Configure Paymaster with additional data
   */
  setPaymasterWithData(address: string, paymasterData: string = "0x"): void {
    this.config.paymasterAddress = address;
    this.paymasterData = paymasterData; // Save paymaster data
    log(`Paymaster configured: ${address} with data: ${paymasterData}`);
  }

  /**
   * Get Paymaster data for a UserOperation
   */
  private getPaymasterAndData(options: UserOperationOptions): string {
    if (options.paymaster) {
      return options.paymaster;
    }

    if (this.config.paymasterAddress) {
      // Combine paymaster address + additional data
      const paymasterAddress = this.config.paymasterAddress;
      const additionalData = this.paymasterData.startsWith("0x")
        ? this.paymasterData.slice(2)
        : this.paymasterData;

      return paymasterAddress + additionalData;
    }

    return "0x"; // No paymaster
  }

  /**
   * Get configured paymaster data
   */
  getPaymasterData(): string {
    return this.paymasterData;
  }

  /**
   * Set paymaster data
   */
  setPaymasterData(data: string): void {
    this.paymasterData = data.startsWith("0x") ? data : "0x" + data;
    log(`Paymaster data updated: ${this.paymasterData}`);
  }

  /**
   * Check if Paymaster is configured for gasless transactions
   */
  isGaslessEnabled(): boolean {
    return !!(this.config.paymasterAddress || this.config.bundlerUrl);
  }

  /**
   * Get estimated cost information for a UserOperation
   */
  async estimateUserOperationGas(
    sender: string,
    callData: string,
    options: UserOperationOptions = {}
  ): Promise<{
    callGasLimit: string;
    verificationGasLimit: string;
    preVerificationGas: string;
    totalGas: string;
  }> {
    // Simplified estimation - in production you should use Bundler for accurate estimates
    const baseCallGas = 100000n;
    const baseVerificationGas = 100000n;
    const basePreVerificationGas = 21000n;

    // Add extra gas if there's a paymaster
    const paymasterExtra =
      this.getPaymasterAndData(options) !== "0x" ? 50000n : 0n;

    const callGasLimit = (baseCallGas + paymasterExtra).toString();
    const verificationGasLimit = baseVerificationGas.toString();
    const preVerificationGas = basePreVerificationGas.toString();

    const totalGas = (
      baseCallGas +
      baseVerificationGas +
      basePreVerificationGas +
      paymasterExtra
    ).toString();

    return {
      callGasLimit,
      verificationGasLimit,
      preVerificationGas,
      totalGas,
    };
  }

  /**
   * Configure Bundler
   */
  setBundler(url: string): void {
    this.config.bundlerUrl = url;
    log(`Bundler configured: ${url}`);
  }

  /**
   * Get current configuration
   */
  getConfig(): SmartAccountConfig {
    return { ...this.config };
  }

  /**
   * Check if an address is a Smart Account
   */
  async isSmartAccount(address: string): Promise<boolean> {
    try {
      const provider = this.getProvider();
      if (!provider) return false;

      const code = await provider.getCode(address);
      return code !== "0x";
    } catch (error) {
      logError("Error checking Smart Account:", error);
      return false;
    }
  }

  /**
   * Get Smart Account balance
   */
  async getSmartAccountBalance(address: string): Promise<string> {
    try {
      const provider = this.getProvider();
      if (!provider) throw new Error("Provider not available");

      const balance = await provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      logError("Error retrieving balance:", error);
      throw error;
    }
  }

  /**
   * Get Smart Account contract instance
   * Useful for direct interaction with Smart Account
   */
  async getSmartAccountContract(
    address: string
  ): Promise<ethers.Contract | null> {
    try {
      const provider = this.getProvider();
      if (!provider) return null;

      // Check if it's a Smart Account
      const isSmartAccount = await this.isSmartAccount(address);
      if (!isSmartAccount) {
        logWarn(`Address ${address} doesn't seem to be a Smart Account`);
        return null;
      }

      // Smart Account ABI (simplified)
      const smartAccountABI = [
        "function execute(address target, uint256 value, bytes calldata data) external",
        "function executeBatch(address[] calldata targets, uint256[] calldata values, bytes[] calldata datas) external",
        "function nonce() external view returns (uint256)",
        "function owner() external view returns (address)",
      ];

      return new ethers.Contract(address, smartAccountABI, provider);
    } catch (error) {
      logError("Error retrieving Smart Account contract:", error);
      return null;
    }
  }

  /**
   * Get Smart Account nonce
   */
  async getSmartAccountNonce(address: string): Promise<bigint> {
    try {
      const contract = await this.getSmartAccountContract(address);
      if (!contract) {
        throw new Error("Unable to get Smart Account contract");
      }

      return await contract.nonce();
    } catch (error) {
      logError("Error retrieving Smart Account nonce:", error);
      throw error;
    }
  }

  /**
   * Get Smart Account owner
   */
  async getSmartAccountOwner(address: string): Promise<string> {
    try {
      const contract = await this.getSmartAccountContract(address);
      if (!contract) {
        throw new Error("Unable to get Smart Account contract");
      }

      return await contract.owner();
    } catch (error) {
      logError("Error retrieving Smart Account owner:", error);
      throw error;
    }
  }

  /**
   * Example configuration for gasless transactions
   * This method shows how to configure Account Abstraction for users without funds
   */
  setupGaslessTransactions(): void {
    // Configure Alchemy Bundler (requires API key)
    this.setBundler("https://bundler.alchemyapi.io/v2/YOUR_API_KEY");

    // Configure a Paymaster to pay gas fees
    this.setPaymaster("0x1234567890123456789012345678901234567890");

    log(
      "Gasless configuration completed. Users won't need funds for transactions."
    );
    log("IMPORTANT: Replace YOUR_API_KEY with your Alchemy API key!");
  }

  /**
   * Example configuration for self-funded transactions
   * This method shows how to configure Account Abstraction for users with funds
   */
  setupSelfFundedTransactions(): void {
    // Configure Alchemy Bundler
    this.setBundler("https://bundler.alchemyapi.io/v2/YOUR_API_KEY");

    // Don't configure a Paymaster - user will pay fees
    this.config.paymasterAddress = undefined;

    log(
      "Self-funded configuration completed. Users will pay gas fees from their Smart Account."
    );
    log("IMPORTANT: Replace YOUR_API_KEY with your Alchemy API key!");
  }

  /**
   * Configure Alchemy Bundler with API key
   */
  setupAlchemyBundler(
    apiKey: string,
    network: "mainnet" | "goerli" | "sepolia" = "mainnet"
  ): void {
    if (!apiKey || apiKey === "YOUR_API_KEY") {
      throw new Error(
        "Alchemy API key required. Get it from https://www.alchemy.com/"
      );
    }

    const bundlerUrl = `https://bundler.alchemyapi.io/v2/${apiKey}`;
    this.setBundler(bundlerUrl);

    log(`Alchemy Bundler configured for ${network}: ${bundlerUrl}`);
  }

  /**
   * Configure Alchemy with integrated Paymaster
   */
  setupAlchemyWithPaymaster(apiKey: string, paymasterAddress: string): void {
    this.setupAlchemyBundler(apiKey);
    this.setPaymaster(paymasterAddress);

    log("Alchemy Bundler + Paymaster configured for gasless transactions");
  }

  /**
   * Get test URLs for various public bundlers
   */
  getPublicBundlerUrls(): {
    alchemy: string;
    stackup: string;
    biconomy: string;
    pimlico: string;
  } {
    return {
      alchemy: "https://bundler.alchemyapi.io/v2/YOUR_API_KEY",
      stackup: "https://api.stackup.sh/v1/node/YOUR_API_KEY",
      biconomy: "https://bundler.biconomy.io/api/v2/YOUR_API_KEY",
      pimlico: "https://api.pimlico.io/v2/YOUR_API_KEY/bundler",
    };
  }

  /**
   * Validate if configuration is correct for use
   */
  validateConfiguration(): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check essential configurations
    if (
      !this.config.entryPointAddress ||
      this.config.entryPointAddress ===
        "0x0000000000000000000000000000000000000000"
    ) {
      errors.push("EntryPoint not configured");
    }

    if (!this.config.bundlerUrl) {
      warnings.push("No Bundler configured - transactions might fail");
    }

    if (!this.config.paymasterAddress) {
      warnings.push(
        "No Paymaster configured - users will need funds for gas fees"
      );
    }

    if (
      !this.config.accountFactoryAddress ||
      this.config.accountFactoryAddress ===
        "0x0000000000000000000000000000000000000000"
    ) {
      warnings.push(
        "AccountFactory not configured - Smart Accounts cannot be created"
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}
