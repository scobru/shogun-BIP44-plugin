# Shogun BIP44 HD Wallet Plugin

A TypeScript plugin for ShogunCore that provides HD (Hierarchical Deterministic) wallet functionality using BIP44 standard.

## Features

- 🔑 BIP44 compliant HD wallet generation and management
- 🔐 Secure mnemonic phrase generation and storage
- 💼 Multiple wallet creation and management
- 🔒 Message and transaction signing
- 📤 Import/export functionality with encryption
- 🌐 Ethereum network support via ethers.js
- 🔄 Integration with Gun database for decentralized storage

## Installation

```bash
npm install shogun-bip44
```

## Usage

### Basic Setup

```typescript
import { HDWalletPlugin } from 'shogun-bip44';
import Gun from 'gun';

// Initialize Gun
const gun = Gun();

// Initialize the plugin
const walletPlugin = new HDWalletPlugin();

// Setup core with Gun instance
const core = { gun };
walletPlugin.initialize(core);
```

### Creating Wallets

```typescript
// Generate a new mnemonic
const mnemonic = walletPlugin.generateNewMnemonic();
console.log('New mnemonic:', mnemonic);

// Create a new wallet
const walletInfo = await walletPlugin.createWallet();
console.log('New wallet address:', walletInfo.address);

// Load all user wallets
const wallets = await walletPlugin.loadWallets();
console.log('Total wallets:', wallets.length);
```

### Signing Operations

```typescript
// Get main wallet
const mainWallet = walletPlugin.getMainWallet();

// Sign a message
const message = "Hello, Shogun!";
const signature = await walletPlugin.signMessage(mainWallet, message);

// Verify signature
const signer = walletPlugin.verifySignature(message, signature);
console.log('Signer address:', signer);
```

### BIP44 Address Generation

```typescript
// Get standard BIP44 addresses
const mnemonic = walletPlugin.generateNewMnemonic();
const addresses = walletPlugin.getStandardBIP44Addresses(mnemonic, 5);
console.log('First 5 BIP44 addresses:', addresses);
```

### Export/Import Operations

```typescript
// Export mnemonic
const exportedMnemonic = await walletPlugin.exportMnemonic();

// Export all user data with password
const backupData = await walletPlugin.exportAllUserData('your-password');

// Import mnemonic
const success = await walletPlugin.importMnemonic(exportedMnemonic);

// Import all user data
const importResult = await walletPlugin.importAllUserData(
  backupData, 
  'your-password'
);
```

### Network Configuration

```typescript
// Set RPC URL for Ethereum network
walletPlugin.setRpcUrl('https://mainnet.infura.io/v3/YOUR-PROJECT-ID');

// Get current RPC URL
const rpcUrl = walletPlugin.getRpcUrl();
console.log('Current RPC URL:', rpcUrl);
```

## API Reference

### HDWalletPlugin

The main plugin class that implements `HDWalletPluginInterface`.

#### Methods

- `initialize(core: any): void` - Initialize the plugin
- `getMainWallet(): ethers.Wallet | null` - Get the main wallet
- `createWallet(): Promise<WalletInfo>` - Create a new wallet
- `loadWallets(): Promise<WalletInfo[]>` - Load all wallets
- `signMessage(wallet, message): Promise<string>` - Sign a message
- `verifySignature(message, signature): string` - Verify a signature
- `generateNewMnemonic(): string` - Generate new mnemonic phrase
- `getStandardBIP44Addresses(mnemonic, count?): string[]` - Get BIP44 addresses
- `exportMnemonic(password?): Promise<string>` - Export mnemonic
- `importMnemonic(data, password?): Promise<boolean>` - Import mnemonic
- `setRpcUrl(url): boolean` - Set RPC provider URL
- `getRpcUrl(): string | null` - Get current RPC URL

### Types

```typescript
interface WalletInfo {
  wallet: ethers.Wallet;
  path: string;
  address: string;
  getAddressString(): string;
}

interface WalletConfig {
  rpcUrl?: string;
  defaultGasLimit?: number;
  balanceCacheTTL?: number;
  maxRetries?: number;
  retryDelay?: number;
}
```

## Development

### Building

```bash
# Install dependencies
npm install

# Build all formats
npm run build

# Build specific format
npm run build:cjs    # CommonJS
npm run build:esm    # ES Modules
npm run build:types  # TypeScript declarations
npm run build:browser # Browser bundle
```

### Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

### Linting and Formatting

```bash
# Check formatting
npm run lint

# Format code
npm run format
```

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Security

This plugin handles sensitive cryptographic operations. Always:

- Use secure RPC endpoints
- Keep mnemonic phrases secure
- Use strong passwords for exports
- Validate all inputs
- Keep dependencies updated

## Support

For questions, issues, or contributions, please visit the [GitHub repository](https://github.com/shogun-org/shogun-bip44). 