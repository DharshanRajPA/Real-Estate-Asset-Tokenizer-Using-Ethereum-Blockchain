# Complete Deployment Guide - From Scratch

This guide will walk you through deploying contracts from scratch in the blockchain folder.

---

## 📋 Prerequisites

Before starting, make sure you have:
- ✅ **Node.js** installed (v16 or higher)
- ✅ **Ganache** installed and running
- ✅ **npm** or **yarn** package manager

---

## 🚀 Step-by-Step Deployment

### Step 1: Navigate to Blockchain Folder

```bash
cd blockchain
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install:
- `hardhat` - Ethereum development environment
- `ethers` - Ethereum library
- `@openzeppelin/contracts` - Smart contract libraries
- `dotenv` - Environment variable management

**Expected output:**
```
added 500+ packages in 30s
```

### Step 3: Start Ganache

1. **Open Ganache application**
2. Click **"Quickstart"** or create a new workspace
3. **Verify settings:**
   - Host: `127.0.0.1`
   - Port: `7545`
   - Network ID: `1337` (or note the actual ID)

4. **Copy Account 1 details:**
   - Click the **key icon** 🔑 next to Account 1
   - **Copy the private key** (you'll need this)
   - **Note the address** (this will be your admin address)

**Example:**
```
Account 1 Address: 0x627306090abaB3A6e1400e9345bC60c78a8BEf57
Private Key: 0xc0fd76e992fff19cb5596781fbecd1cd1bc4b8eecdb03d361ce4cc6fd7fadc0a
```

### Step 4: Create Environment File

1. **Create `.env` file** in the `blockchain` folder:

```bash
# Windows (PowerShell)
New-Item -Path .env -ItemType File

# Windows (CMD)
type nul > .env

# Mac/Linux
touch .env
```

2. **Add the following content** to `.env`:

```env
# Ganache RPC URL
RPC_URL=http://127.0.0.1:7545

# Admin Private Key (from Ganache Account 1)
PRIVATE_KEY=0xc0fd76e992fff19cb5596781fbecd1cd1bc4b8eecdb03d361ce4cc6fd7fadc0a
```

**⚠️ Important:** Replace `PRIVATE_KEY` with the actual private key from Ganache Account 1!

### Step 5: Compile Contracts

```bash
npx hardhat compile
```

**Expected output:**
```
Compiled 2 Solidity files successfully
```

This will:
- Compile `Asset.sol`
- Compile `Tokenizer.sol`
- Generate artifacts in `artifacts/` folder

**If you see errors:**
- Check that Solidity version matches (0.8.20)
- Verify all imports are correct
- Ensure OpenZeppelin contracts are installed

### Step 6: Verify Ganache Connection

Before deploying, verify you can connect to Ganache:

```bash
# Test connection (optional)
node -e "const { ethers } = require('ethers'); const provider = new ethers.JsonRpcProvider('http://127.0.0.1:7545'); provider.getBlockNumber().then(n => console.log('Connected! Block:', n)).catch(e => console.error('Error:', e.message));"
```

**Expected output:**
```
Connected! Block: 0
```

### Step 7: Deploy Contracts

```bash
node scripts/deployContracts.js
```

**Expected output:**
```
PRIVATE KEY:  0xc0fd76e992fff19cb5596781fbecd1cd1bc4b8eecdb03d361ce4cc6fd7fadc0a
Deploying contracts using: 0x627306090abaB3A6e1400e9345bC60c78a8BEf57
✅ Asset deployed to: 0x1234567890abcdef1234567890abcdef12345678
✅ Tokenizer deployed to: 0xabcdef1234567890abcdef1234567890abcdef12
✅ Approval granted to contract to manage admin's tokens

🚀 All contracts deployed and initialized successfully!
```

**📝 Important:** Copy the deployed contract addresses! You'll need them for the frontend.

### Step 8: Save Contract Addresses

1. **Copy the addresses** from the deployment output:
   - Asset Contract Address
   - Tokenizer Contract Address

2. **Update frontend `.env` file** (in `frontend` folder):

```env
REACT_APP_ASSET_CONTRACT=0x1234567890abcdef1234567890abcdef12345678
REACT_APP_TOKENIZER_CONTRACT=0xabcdef1234567890abcdef1234567890abcdef12
REACT_APP_ADMIN_WALLET=0x627306090abaB3A6e1400e9345bC60c78a8BEf57
```

**Replace with your actual addresses!**

---

## 🔍 Verification Steps

### Verify in Ganache

1. **Check Ganache transactions:**
   - You should see 3 transactions:
     - Asset contract deployment
     - Tokenizer contract deployment
     - Approval transaction

2. **Check account balance:**
   - Account 1 should have slightly less than 100 ETH (gas fees deducted)

### Verify Contracts

You can verify contracts are deployed correctly:

```bash
# Test contract interaction (optional)
node -e "
const { ethers } = require('ethers');
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const tokenizerAddress = 'YOUR_TOKENIZER_ADDRESS';
console.log('Tokenizer address:', tokenizerAddress);
console.log('Admin wallet:', wallet.address);
"
```

---

## 🐛 Troubleshooting

### Error: "Cannot find module 'dotenv'"

**Solution:**
```bash
npm install dotenv
```

### Error: "Cannot find module 'ethers'"

**Solution:**
```bash
npm install ethers
```

### Error: "PRIVATE_KEY is not defined"

**Solution:**
1. Check `.env` file exists in `blockchain` folder
2. Verify `.env` contains `PRIVATE_KEY=...`
3. Make sure there are no spaces around `=`
4. Restart terminal after creating `.env`

### Error: "Connection refused" or "Network error"

**Solution:**
1. Verify Ganache is running
2. Check Ganache is on port `7545`
3. Verify RPC URL in `.env`: `http://127.0.0.1:7545`
4. Try restarting Ganache

### Error: "Insufficient funds"

**Solution:**
1. Check Account 1 in Ganache has ETH (should be 100 ETH by default)
2. If balance is low, restart Ganache to reset accounts

### Error: "Contract compilation failed"

**Solution:**
1. Check Solidity version matches (0.8.20)
2. Verify OpenZeppelin contracts are installed:
   ```bash
   npm install @openzeppelin/contracts
   ```
3. Try cleaning and recompiling:
   ```bash
   npx hardhat clean
   npx hardhat compile
   ```

### Error: "Artifact not found"

**Solution:**
1. Make sure contracts are compiled first:
   ```bash
   npx hardhat compile
   ```
2. Check `artifacts/contracts/` folder exists
3. Verify contract names match (Asset.sol, Tokenizer.sol)

---

## 📝 Complete Deployment Script

Here's a complete script you can run:

```bash
# Navigate to blockchain folder
cd blockchain

# Install dependencies
npm install

# Create .env file (edit with your values)
echo "RPC_URL=http://127.0.0.1:7545" > .env
echo "PRIVATE_KEY=YOUR_PRIVATE_KEY_HERE" >> .env

# Compile contracts
npx hardhat compile

# Deploy contracts
node scripts/deployContracts.js

# Copy contract addresses to frontend/.env
# (Do this manually after deployment)
```

---

## 🔄 Re-deploying Contracts

If you need to redeploy:

1. **Clean previous artifacts (optional):**
   ```bash
   npx hardhat clean
   ```

2. **Recompile:**
   ```bash
   npx hardhat compile
   ```

3. **Redeploy:**
   ```bash
   node scripts/deployContracts.js
   ```

4. **Update frontend `.env`** with new addresses

---

## 📊 Deployment Checklist

Use this checklist to ensure everything is set up correctly:

- [ ] Node.js installed
- [ ] Dependencies installed (`npm install`)
- [ ] Ganache running on port 7545
- [ ] `.env` file created in `blockchain` folder
- [ ] `RPC_URL` set in `.env`
- [ ] `PRIVATE_KEY` set in `.env` (Account 1 from Ganache)
- [ ] Contracts compiled successfully
- [ ] Contracts deployed successfully
- [ ] Contract addresses copied to frontend `.env`
- [ ] Frontend `.env` updated with:
  - [ ] `REACT_APP_ASSET_CONTRACT`
  - [ ] `REACT_APP_TOKENIZER_CONTRACT`
  - [ ] `REACT_APP_ADMIN_WALLET`

---

## 🎯 Quick Reference

### Important Files:

```
blockchain/
├── .env                    # Environment variables (create this)
├── contracts/
│   ├── Asset.sol           # Asset contract
│   └── Tokenizer.sol       # Tokenizer contract
├── scripts/
│   └── deployContracts.js  # Deployment script
├── artifacts/              # Compiled contracts (generated)
└── hardhat.config.cjs      # Hardhat configuration
```

### Important Commands:

```bash
# Install dependencies
npm install

# Compile contracts
npx hardhat compile

# Deploy contracts
node scripts/deployContracts.js

# Clean artifacts
npx hardhat clean

# Verify Hardhat version
npx hardhat --version
```

### Environment Variables:

**blockchain/.env:**
```env
RPC_URL=http://127.0.0.1:7545
PRIVATE_KEY=0x... (from Ganache Account 1)
```

**frontend/.env:**
```env
REACT_APP_ASSET_CONTRACT=0x... (after deployment)
REACT_APP_TOKENIZER_CONTRACT=0x... (after deployment)
REACT_APP_ADMIN_WALLET=0x... (Ganache Account 1 address)
```

---

## ✅ Success Indicators

You'll know deployment was successful when you see:

1. ✅ **Deployment output shows:**
   - Asset contract address
   - Tokenizer contract address
   - Approval granted message

2. ✅ **Ganache shows:**
   - 3 transactions in transaction list
   - Account 1 balance slightly reduced (gas fees)

3. ✅ **Frontend can connect:**
   - Contracts accessible from frontend
   - Transactions work correctly

---

## 🆘 Need Help?

If you encounter issues not covered here:

1. Check Ganache is running
2. Verify `.env` file is correct
3. Ensure all dependencies are installed
4. Check contract compilation errors
5. Verify network connection to Ganache

---

**Happy Deploying! 🚀**

