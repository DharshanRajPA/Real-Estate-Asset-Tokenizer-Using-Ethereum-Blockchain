import { ethers } from "ethers";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

// Load ABI and bytecode
const loadContractArtifact = (name) => {
  // Try relative path from scripts folder first, then root folder
  let path = `artifacts/contracts/${name}.sol/${name}.json`;
  if (!fs.existsSync(path)) {
    path = `../artifacts/contracts/${name}.sol/${name}.json`;
  }
  const { abi, bytecode } = JSON.parse(fs.readFileSync(path, "utf8"));
  return { abi, bytecode };
};

const main = async () => {
  // Validate environment variables
  if (!process.env.RPC_URL) {
    console.error("❌ Error: RPC_URL not found in .env file");
    console.error("   Please create .env file with: RPC_URL=http://127.0.0.1:7545");
    process.exit(1);
  }

  if (!process.env.PRIVATE_KEY) {
    console.error("❌ Error: PRIVATE_KEY not found in .env file");
    console.error("   Please add PRIVATE_KEY to .env file (from Ganache Account 1)");
    process.exit(1);
  }

  console.log("🔗 Connecting to:", process.env.RPC_URL);
  
  // Connect to provider
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  
  // Verify connection
  try {
    const blockNumber = await provider.getBlockNumber();
    console.log("✅ Connected to network (Block:", blockNumber, ")");
  } catch (error) {
    console.error("❌ Error: Cannot connect to", process.env.RPC_URL);
    console.error("   Make sure Ganache is running on port 7545");
    console.error("   Error:", error.message);
    process.exit(1);
  }

  // Create signer (admin)
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  console.log("👤 Deploying contracts using wallet:", wallet.address);
  
  // Check balance
  const balance = await provider.getBalance(wallet.address);
  console.log("💰 Wallet balance:", ethers.formatEther(balance), "ETH");
  
  if (balance === 0n) {
    console.error("❌ Error: Wallet has 0 ETH");
    console.error("   Please ensure Ganache Account 1 has ETH");
    process.exit(1);
  }
  
  console.log("\n📦 Starting deployment...\n");

  // 1. Deploy Asset contract
  const { abi: assetAbi, bytecode: assetBytecode } =
    loadContractArtifact("Asset");
  const AssetFactory = new ethers.ContractFactory(
    assetAbi,
    assetBytecode,
    wallet
  );
  const assetContract = await AssetFactory.deploy();
  await assetContract.waitForDeployment();
  console.log("✅ Asset deployed to:", assetContract.target);

  // 2. Deploy Tokenizer contract with BASE_URL and admin address
  const BASE_URL = "https://example.com/assets/";
  const { abi: tokenizerAbi, bytecode: tokenizerBytecode } =
    loadContractArtifact("Tokenizer");
  const TokenizerFactory = new ethers.ContractFactory(
    tokenizerAbi,
    tokenizerBytecode,
    wallet
  );
  const tokenizerContract = await TokenizerFactory.deploy(
    BASE_URL,
    wallet.address
  );
  await tokenizerContract.waitForDeployment();
  console.log("✅ Tokenizer deployed to:", tokenizerContract.target);

  // 3. Set approval so contract can transfer tokens on behalf of admin
  const tokenizer = new ethers.Contract(
    tokenizerContract.target,
    tokenizerAbi,
    wallet
  );
  const tx = await tokenizer.setApprovalForAll(tokenizerContract.target, true);
  await tx.wait();
  console.log(`✅ Approval granted to contract to manage admin's tokens`);

  console.log("\n" + "=".repeat(60));
  console.log("🚀 All contracts deployed and initialized successfully!");
  console.log("=".repeat(60));
  console.log("\n📋 Contract Addresses:");
  console.log("   Asset Contract:    ", assetContract.target);
  console.log("   Tokenizer Contract:", tokenizerContract.target);
  console.log("   Admin Wallet:     ", wallet.address);
  console.log("\n⚠️  IMPORTANT: Copy these addresses to frontend/.env:");
  console.log("   REACT_APP_ASSET_CONTRACT=" + assetContract.target);
  console.log("   REACT_APP_TOKENIZER_CONTRACT=" + tokenizerContract.target);
  console.log("   REACT_APP_ADMIN_WALLET=" + wallet.address);
  console.log("\n");
};

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exit(1);
});
