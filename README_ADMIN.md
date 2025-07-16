# 🚀 Admin Guide - BIP44 Plugin for ShogunCore

## 📋 Overview

The BIP44 plugin is a ShogunCore extension that allows users to:

- **Generate HD wallets** after login
- **Create Smart Accounts** for Account Abstraction
- **Manage gasless transactions** via Paymaster
- **Synchronize data** via GunDB

## 🎯 User Flow

```
1. User logs in → ShogunCore
2. Plugin initializes → Wallet paths loaded
3. User creates wallet → HD Wallet generated
4. User creates Smart Account → Account Abstraction
5. User makes transactions → Gasless or Self-funded
```

## ⚙️ Required Configuration

### **1. Required Dependencies**

```bash
# In the main project's package.json
{
  "dependencies": {
    "shogun-core": "^1.5.1",
    "shogun-BIP44-plugin": "^1.0.0",
    "ethers": "^6.0.0"
  }
}
```

### **2. Environment Variables**

```bash
# .env
ALCHEMY_API_KEY=https://eth-mainnet.alchemyapi.io/v2/YOUR_API_KEY
ALCHEMY_BUNDLER_URL=https://bundler.alchemyapi.io/v2/YOUR_API_KEY
PAYMASTER_ADDRESS=0xYOUR_PAYMASTER_ADDRESS
ACCOUNT_FACTORY_ADDRESS=0xYOUR_ACCOUNT_FACTORY_ADDRESS
```

### **3. ShogunCore Configuration**

```typescript
import ShogunCore from "shogun-core";
import { HDWalletPlugin, AccountAbstractionPlugin } from "shogun-BIP44-plugin";

const shogunCore = new ShogunCore({
  peers: ["https://gun-manhattan.herokuapp.com/gun"],
  scope: "your-app-scope",
  logging: { enabled: true, level: "info" },
  webauthn: { enabled: true, rpName: "Your App" },
});

// Register plugins
const hdWalletPlugin = new HDWalletPlugin({
  rpcUrl: process.env.ALCHEMY_API_KEY,
  balanceCacheTTL: 30000,
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
```

## 🔧 Frontend Implementation

### **1. After Login**

```typescript
// After successful login
shogunCore.on("auth:login", async (data) => {
  const walletPlugin = shogunCore.getPlugin("hdwallet");
  const aaPlugin = shogunCore.getPlugin("account-abstraction");

  // Initialize wallet for user
  await walletPlugin.initializeWalletPathsAndTestEncryption();
});
```

### **2. Wallet Creation**

```typescript
const walletPlugin = shogunCore.getPlugin("hdwallet");

// Create new wallet
const walletInfo = await walletPlugin.createWallet();
console.log("New wallet:", walletInfo.address);

// Load existing wallets
const wallets = await walletPlugin.loadWallets();
```

### **3. Account Abstraction**

```typescript
const aaPlugin = shogunCore.getPlugin("account-abstraction");

// Configure for gasless
aaPlugin.setupGaslessTransactions();

// Create Smart Account
const smartAccount = await aaPlugin.getOrCreateSmartAccount(0);

// Make gasless transaction
const txHash = await aaPlugin.executeTransaction(
  smartAccount,
  "0xTARGET_ADDRESS",
  "0.001",
  "0x"
);
```

## 🏗️ Required Infrastructure

### **1. Alchemy Account**

- [ ] Register on [Alchemy](https://www.alchemy.com/)
- [ ] Create app for Mainnet and Testnet
- [ ] Get API keys for RPC and Bundler

### **2. Paymaster (for Gasless)**

- [ ] Deploy Paymaster contract
- [ ] Fund with ETH for gas fees
- [ ] Configure whitelist if needed

### **3. Account Factory**

- [ ] Deploy Account Factory contract
- [ ] Configure for your Smart Account implementation

### **4. GunDB Peers**

- [ ] Configure reliable GunDB peers
- [ ] Consider self-hosting for production

## 🔒 Security

### **1. Encryption**

- ✅ All sensitive data is encrypted with SEA
- ✅ Mnemonics never saved in plain text
- ✅ Private keys derived deterministically

### **2. Validation**

- ✅ Checks on mnemonics and addresses
- ✅ Configuration validation
- ✅ Robust error handling

### **3. Access**

- ✅ Only authenticated users can use wallets
- ✅ Automatic cleanup on logout
- ✅ Data isolation per user

## 📊 Monitoring

### **1. Logging**

```typescript
// Enable detailed logging
shogunCore.configureLogging({
  enabled: true,
  level: "debug",
});
```

### **2. Events**

```typescript
// Monitor wallet events
shogunCore.on("walletCreated", (data) => {
  console.log("New wallet created:", data);
});

shogunCore.on("transactionConfirmed", (data) => {
  console.log("Transaction confirmed:", data);
});
```

### **3. Errors**

```typescript
// Handle errors
shogunCore.on("error", (error) => {
  console.error("Error:", error);
  // Send to monitoring service
});
```

## 🚀 Deployment Checklist

### **Pre-Production**

- [ ] Test on testnet (Goerli/Sepolia)
- [ ] Verify data encryption
- [ ] Test gasless transactions
- [ ] Verify GunDB synchronization
- [ ] Test error handling

### **Production**

- [ ] Alchemy Mainnet configuration
- [ ] Deploy Paymaster on Mainnet
- [ ] Deploy Account Factory on Mainnet
- [ ] Configure reliable GunDB peers
- [ ] Monitoring and alerting
- [ ] Backup strategies

### **Post-Deployment**

- [ ] Monitor transactions
- [ ] Verify performance
- [ ] Check Paymaster costs
- [ ] Update user documentation

## 🆘 Troubleshooting

### **Common Issues**

1. **"User not authenticated"**
   - Verify user is logged in
   - Check GunDB synchronization

2. **"Bundler error"**
   - Verify Alchemy API key
   - Check Bundler configuration

3. **"Paymaster insufficient funds"**
   - Recharge Paymaster with ETH
   - Verify whitelist if configured

4. **"Wallet paths not found"**
   - Re-initialize wallet paths
   - Verify GunDB synchronization

### **Support**

- 📧 Email: support@shogun.com
- 📖 Documentation: [docs.shogun.com](https://docs.shogun.com)
- 🐛 Issues: [GitHub Issues](https://github.com/shogun/shogun-BIP44-plugin/issues)

---

**💡 Tip**: Always start with testnet to test without real costs!
