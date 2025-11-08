# Quick Start - Deploy Contracts

## 🚀 Fastest Way to Deploy (5 Minutes)

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Ganache
- Open Ganache application
- Click "Quickstart"
- Note Account 1 address and private key

### 3. Create `.env` File
```bash
# Create .env file in blockchain folder
RPC_URL=http://127.0.0.1:7545
PRIVATE_KEY=YOUR_GANACHE_ACCOUNT_1_PRIVATE_KEY
```

### 4. Compile & Deploy
```bash
npm run compile
npm run deploy
```

### 5. Copy Addresses to Frontend
Update `frontend/.env`:
```env
REACT_APP_ASSET_CONTRACT=<Asset address from deployment>
REACT_APP_TOKENIZER_CONTRACT=<Tokenizer address from deployment>
REACT_APP_ADMIN_WALLET=<Ganache Account 1 address>
```

**Done! ✅**

---

## 📋 Full Commands

```bash
# Step 1: Install
npm install

# Step 2: Create .env (edit with your values)
echo "RPC_URL=http://127.0.0.1:7545" > .env
echo "PRIVATE_KEY=0x..." >> .env

# Step 3: Compile
npm run compile

# Step 4: Deploy
npm run deploy

# Step 5: Copy addresses to frontend/.env
```

---

## ⚠️ Common Issues

**"Cannot find module"**
→ Run `npm install`

**"Connection refused"**
→ Make sure Ganache is running

**"PRIVATE_KEY not defined"**
→ Check `.env` file exists and has correct format

**"Insufficient funds"**
→ Restart Ganache to reset account balances

---

For detailed guide, see `DEPLOYMENT_GUIDE.md`

