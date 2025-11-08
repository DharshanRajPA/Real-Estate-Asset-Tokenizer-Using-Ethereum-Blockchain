# Asset Tokenization Error - Fix Guide

## 🚨 Error Message

```
Transaction failed: could not decode result data (value="0x", 
info={ "method": "assetTokenMap", "signature": "assetTokenMap(bytes12)" }, 
code=BAD_DATA, version=6.13.5)
```

## 🔍 What This Error Means

This error occurs when trying to purchase tokens for a property that **hasn't been tokenized on the blockchain yet**.

**What happened:**
- The property exists in your database
- But it hasn't been added to the blockchain contracts
- The `assetTokenMap` function returns empty data because the assetID doesn't exist in the mapping

## ✅ Solution: Tokenize the Property

The property needs to be tokenized by the **admin** before clients can purchase tokens.

### Step-by-Step Fix:

#### Step 1: Verify Property Creation

1. **Check if property exists in database:**
   - Property should be created via "Create Property" page
   - Property should have an ID (MongoDB ObjectId)

#### Step 2: Tokenize Property (Admin Only)

The admin needs to tokenize the property. This happens automatically when creating a property, but if it failed, you need to do it manually:

**Option A: Re-create the Property (Easiest)**

1. **Go to Create Property page** (as admin)
2. **Fill in property details**
3. **Submit the form**
4. The system should automatically:
   - Add asset to Asset contract
   - Mint tokens using Tokenizer contract

**Option B: Manual Tokenization (If Option A Failed)**

If the automatic tokenization failed, you need to manually call the contracts:

1. **Get the property ID** from the database
2. **Convert to assetID:**
   ```javascript
   const rawId = propertyId.toLowerCase();
   const assetID = ethers.zeroPadValue("0x" + rawId, 12);
   ```

3. **Call Asset contract:**
   ```javascript
   await assetContract.addAsset(assetID, assetHash);
   ```

4. **Call Tokenizer contract:**
   ```javascript
   await tokenizerContract.mintAssetTokens(assetID, propertyTokens);
   ```

### Step 3: Verify Tokenization

After tokenization, verify it worked:

```javascript
// Check if asset exists
const assetHash = await assetContract.getAssetHash(assetID);

// Check if tokens were minted
const tokenID = await tokenizer.assetTokenMap(assetID);
const totalSupply = await tokenizer.totalAssetTokenSupplyMap(assetID);

console.log("Token ID:", tokenID.toString());
console.log("Total Supply:", totalSupply.toString());
```

Both should be non-zero if tokenization was successful.

## 🔧 What Was Fixed in the Code

The code now:
1. ✅ **Checks if asset is tokenized** before attempting purchase
2. ✅ **Shows clear error message** if asset not tokenized
3. ✅ **Provides instructions** on what to do
4. ✅ **Handles the BAD_DATA error** gracefully

## 📋 Common Scenarios

### Scenario 1: Property Created But Not Tokenized

**Symptom:** Property shows in list but purchase fails with BAD_DATA error

**Solution:**
- Admin needs to tokenize the property
- Either re-create property or manually tokenize

### Scenario 2: Tokenization Failed During Creation

**Symptom:** Property created but blockchain transaction failed

**Solution:**
- Check Ganache for failed transactions
- Verify admin wallet has ETH
- Retry tokenization

### Scenario 3: Wrong Contract Address

**Symptom:** Error persists even after tokenization

**Solution:**
- Verify `REACT_APP_TOKENIZER_CONTRACT` in `.env`
- Check contract address matches deployed contract
- Verify you're on correct network

## 🎯 Prevention

To prevent this error:

1. **Always verify tokenization succeeded** when creating properties
2. **Check console logs** for tokenization confirmation
3. **Verify in Ganache** that transactions completed
4. **Test purchase** after creating a property

## 🔍 Debugging Steps

### Step 1: Check Property ID

```javascript
// In browser console
console.log("Property ID:", property._id);
```

### Step 2: Check Asset ID Format

```javascript
const rawId = property._id.toLowerCase();
const assetID = ethers.zeroPadValue("0x" + rawId, 12);
console.log("Asset ID:", assetID);
```

### Step 3: Check Contract Connection

```javascript
const tokenizer = new ethers.Contract(
  process.env.REACT_APP_TOKENIZER_CONTRACT,
  TokenizerABI,
  signer
);

// Try to read a mapping
const tokenID = await tokenizer.assetTokenMap(assetID);
console.log("Token ID:", tokenID.toString());
```

### Step 4: Check Network

```javascript
const network = await provider.getNetwork();
console.log("Network:", network.name, "Chain ID:", network.chainId);
// Should be: Ganache Local, Chain ID: 1337
```

## ✅ Verification Checklist

After tokenization, verify:

- [ ] Asset added to Asset contract (`addAsset` transaction in Ganache)
- [ ] Tokens minted (`mintAssetTokens` transaction in Ganache)
- [ ] `assetTokenMap(assetID)` returns non-zero tokenID
- [ ] `totalAssetTokenSupplyMap(assetID)` returns correct token amount
- [ ] Purchase works without errors

## 🆘 Still Having Issues?

If the error persists:

1. **Check Ganache is running**
2. **Verify contract addresses** in `.env`
3. **Check network** is "Ganache Local"
4. **Verify admin wallet** has ETH
5. **Check console** for detailed error messages
6. **Try re-deploying contracts** if needed

---

**The code now handles this error gracefully and provides clear instructions!** ✅

