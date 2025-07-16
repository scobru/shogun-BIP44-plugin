# 🚀 Alchemy Bundler Configuration for Account Abstraction

This document explains how to configure Alchemy Bundler for Account Abstraction in the Shogun BIP44 plugin.

## 📋 Prerequisites

1. **Alchemy Account**: Register on [Alchemy](https://www.alchemy.com/)
2. **API Key**: Get a free API key
3. **Paymaster**: Configure a Paymaster for gasless transactions (optional)

## 🔑 Getting Alchemy API Key

### 1. Registration

1. Go to [Alchemy Dashboard](https://dashboard.alchemy.com/)
2. Click "Get Started" and create an account
3. Verify your email

### 2. Create App

1. In the dashboard, click "Create App"
2. Choose:
   - **Name**: `Shogun Account Abstraction`
   - **Chain**: `Ethereum` (or testnet for development)
   - **Network**: `Mainnet` (or `Goerli`/`Sepolia` for testing)

### 3. Get API Key

1. After creating the app, go to "View Key"
2. Copy the **API Key** (starts with `https://eth-mainnet.alchemyapi.io/v2/...`)

## ⚙️ Configuration in Code

### Basic Configuration

```typescript
import { AccountAbstractionPlugin } from "./src/accountAbstraction";

const aaPlugin = new AccountAbstractionPlugin();

// Configure Alchemy Bundler
aaPlugin.setupAlchemyBundler("YOUR_API_KEY", "mainnet");
```

### Configuration with Paymaster (Gasless)

```typescript
// Configure Alchemy + Paymaster for gasless transactions
aaPlugin.setupAlchemyWithPaymaster("YOUR_API_KEY", "PAYMASTER_ADDRESS");
```

### Configuration for Testnet

```typescript
// For Goerli
aaPlugin.setupAlchemyBundler("YOUR_API_KEY", "goerli");

// For Sepolia
aaPlugin.setupAlchemyBundler("YOUR_API_KEY", "sepolia");
```

## 🔧 Environment Variables

Create a `.env` file:

```bash
# Alchemy API Keys
ALCHEMY_API_KEY=https://eth-mainnet.alchemyapi.io/v2/YOUR_API_KEY
ALCHEMY_TESTNET_API_KEY=https://eth-goerli.alchemyapi.io/v2/YOUR_API_KEY

# Paymaster (optional)
PAYMASTER_ADDRESS=0xYOUR_PAYMASTER_ADDRESS
```

## 📊 Limits and Costs

### Alchemy Free Plan

- **300M compute units/month**
- **330M storage units/month**
- **5GB data transfer/month**
- **Sufficient for development and testing**

### Paid Plan

- **Pricing**: $0.0001 per 1M compute units
- **Support**: Enterprise support
- **Limits**: Much higher

## 🧪 Testing with Testnet

### 1. Configure Testnet

```typescript
// Use Goerli for free testing
aaPlugin.setupAlchemyBundler("YOUR_API_KEY", "goerli");
```

### 2. Get Test ETH

- **Goerli Faucet**: [Chainlink Faucet](https://faucets.chain.link/)
- **Sepolia Faucet**: [Alchemy Faucet](https://sepoliafaucet.com/)

### 3. Test Transactions

```typescript
// Test gasless transaction
const userOpHash = await aaPlugin.executeTransaction(
  smartAccountAddress,
  targetAddress,
  "0.001",
  "0x"
);
```

## 🚨 Troubleshooting

### Error: "Alchemy API key required"

**Solution**: Make sure you've replaced `YOUR_API_KEY` with your real API key.

### Error: "Bundler error: 401"

**Solution**: Verify that the API key is correct and has bundler permissions.

### Error: "UserOperation failed"

**Solution**:

1. Verify Paymaster has funds
2. Check that EntryPoint is correct
3. Verify AccountFactory is configured

## 📚 Useful Resources

- [Alchemy Documentation](https://docs.alchemy.com/)
- [Account Abstraction Guide](https://docs.alchemy.com/docs/account-abstraction)
- [Bundler API Reference](https://docs.alchemy.com/reference/bundler-api)
- [Paymaster Guide](https://docs.alchemy.com/docs/paymaster)

## 🔗 Other Bundlers

If Alchemy doesn't work for you, you can use:

```typescript
// Stackup
aaPlugin.setBundler("https://api.stackup.sh/v1/node/YOUR_API_KEY");

// Biconomy
aaPlugin.setBundler("https://bundler.biconomy.io/api/v2/YOUR_API_KEY");

// Pimlico
aaPlugin.setBundler("https://api.pimlico.io/v2/YOUR_API_KEY/bundler");
```

## ✅ Configuration Checklist

- [ ] Alchemy account created
- [ ] API key obtained
- [ ] App configured for correct network
- [ ] Paymaster configured (for gasless)
- [ ] AccountFactory configured
- [ ] Testnet testing completed
- [ ] Environment variables configured

---

**💡 Tip**: Always start with testnet to test without real costs!
