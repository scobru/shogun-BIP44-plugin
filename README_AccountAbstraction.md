# Account Abstraction Plugin for Shogun BIP44

This plugin extends the HDWallet plugin functionality to support **Account Abstraction (ERC-4337)**, allowing the creation and management of deterministic Smart Contract Accounts based on BIP44.

## Features

- ✅ **Deterministic Smart Contract Accounts** based on BIP44
- ✅ **Complete UserOperations** for ERC-4337
- ✅ **Batch transactions** for multiple operations
- ✅ **Paymaster integration** for gasless transactions
- ✅ **Standard EntryPoint** compatibility
- ✅ **Customizable AccountFactory**
- ✅ **Configurable Bundler**

## Installation

The plugin is included in the `shogun-bip44` package. Make sure you have the necessary dependencies:

```bash
npm install shogun-bip44 ethers
```

## Basic Usage

### Initialization

```typescript
import { AccountAbstractionPlugin } from "shogun-bip44";

// Basic configuration
const aaPlugin = new AccountAbstractionPlugin({
  entryPointAddress: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
  accountFactoryAddress: "0x0000000000000000000000000000000000000000", // To be configured
});

// Initialize with core
aaPlugin.initialize(core);
```

### Creating Smart Account

```typescript
// Create or retrieve a Smart Account for index 0
const smartAccountAddress = await aaPlugin.getOrCreateSmartAccount(0);
console.log(`Smart Account: ${smartAccountAddress}`);

// Check if it's a Smart Account
const isSmartAccount = await aaPlugin.isSmartAccount(smartAccountAddress);
console.log(`Is Smart Account: ${isSmartAccount}`);

// Get balance
const balance = await aaPlugin.getSmartAccountBalance(smartAccountAddress);
console.log(`Balance: ${balance} ETH`);
```

### Simple Transactions

```typescript
// Send a transaction via Smart Account
const userOpHash = await aaPlugin.executeTransaction(
  smartAccountAddress,
  "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6", // recipient
  "0.001", // value in ETH
  "0x" // additional data
);

console.log(`Transaction sent: ${userOpHash}`);
```

### Batch Transactions

```typescript
// Execute multiple transactions in a batch
const targets = [
  "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
  "0x1234567890123456789012345678901234567890",
];

const values = ["0.001", "0.002"];
const datas = ["0x", "0x"];

const batchHash = await aaPlugin.executeBatch(
  smartAccountAddress,
  targets,
  values,
  datas
);

console.log(`Batch executed: ${batchHash}`);
```

## Advanced Configuration

### Custom AccountFactory

```typescript
// Configure a specific AccountFactory
aaPlugin.setAccountFactory("0x1234567890123456789012345678901234567890");
```

### Paymaster Integration

```typescript
// Configure a Paymaster for gasless transactions
aaPlugin.setPaymaster("0xabcdefabcdefabcdefabcdefabcdefabcdefabcd");
```

### Custom Bundler

```typescript
// Configure a specific Bundler
aaPlugin.setBundler("https://my-bundler.example.com");
```

### Custom UserOperations

```typescript
// Create a custom UserOperation
const callData = "0x..."; // Call data
const options = {
  gasLimit: "150000",
  maxFeePerGas: "3000000000", // 3 gwei
  maxPriorityFeePerGas: "1500000000", // 1.5 gwei
  paymaster: "0x...", // Paymaster data
};

const userOpHash = await aaPlugin.sendUserOperation(
  smartAccountAddress,
  callData,
  options
);
```

## Interfaces

### UserOperation

```typescript
interface UserOperation {
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
```

### SmartAccountConfig

```typescript
interface SmartAccountConfig {
  entryPointAddress: string;
  accountFactoryAddress: string;
  paymasterAddress?: string;
  bundlerUrl?: string;
}
```

## Main Methods

### Smart Account Management

- `getOrCreateSmartAccount(index: number): Promise<string>` - Create or retrieve a Smart Account
- `isSmartAccount(address: string): Promise<boolean>` - Check if an address is a Smart Account
- `getSmartAccountBalance(address: string): Promise<string>` - Get Smart Account balance

### Transactions

- `executeTransaction(smartAccount, target, value, data): Promise<string>` - Execute a transaction
- `executeBatch(smartAccount, targets, values, datas): Promise<string>` - Execute a batch of transactions
- `sendUserOperation(sender, callData, options): Promise<string>` - Send a custom UserOperation

### Configuration

- `setAccountFactory(address: string): void` - Configure AccountFactory
- `setPaymaster(address: string): void` - Configure Paymaster
- `setBundler(url: string): void` - Configure Bundler
- `getConfig(): SmartAccountConfig` - Get current configuration

## Complete Example

```typescript
import { AccountAbstractionPlugin } from "shogun-bip44";

async function completeExample() {
  // Initialize plugin
  const aaPlugin = new AccountAbstractionPlugin({
    entryPointAddress: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789",
    accountFactoryAddress: "0x0000000000000000000000000000000000000000",
  });

  // Initialize with core
  aaPlugin.initialize(core);

  // Create a Smart Account
  const smartAccount = await aaPlugin.getOrCreateSmartAccount(0);
  console.log(`Smart Account created: ${smartAccount}`);

  // Configure a Paymaster
  aaPlugin.setPaymaster("0xabcdefabcdefabcdefabcdefabcdefabcdefabcd");

  // Send a transaction
  const txHash = await aaPlugin.executeTransaction(
    smartAccount,
    "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
    "0.001",
    "0x"
  );

  console.log(`Transaction completed: ${txHash}`);
}

completeExample().catch(console.error);
```

## Security

- ✅ All Smart Accounts are **deterministic** based on BIP44
- ✅ Private keys are **never exposed** by the plugin
- ✅ Support for **secure signing** via main wallet
- ✅ **Validation** of all inputs
- ✅ **Robust error handling**

## Compatibility

- ✅ **ERC-4337** complete standard
- ✅ **BIP44** for deterministic derivation
- ✅ **Ethers.js v6** for blockchain interactions
- ✅ **Shogun Core** for framework integration

## Important Notes

1. **AccountFactory**: Must be configured with a valid address for Smart Account creation
2. **EntryPoint**: Use the standard ERC-4337 address for compatibility
3. **Gas**: UserOperations require gas for verification and execution
4. **Paymaster**: Optional but recommended for gasless transactions
5. **Bundler**: Required for sending UserOperations to the network

## Support

For issues or questions, consult the Shogun Core documentation or open an issue in the repository.
