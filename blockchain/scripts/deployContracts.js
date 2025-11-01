import { ethers } from "ethers";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

// Load ABI and bytecode
const loadContractArtifact = (name) => {
  const path = `../artifacts/contracts/${name}.sol/${name}.json`;
  const { abi, bytecode } = JSON.parse(fs.readFileSync(path));
  return { abi, bytecode };
};

const main = async () => {
  // Connect to provider
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  console.log("PRIVATE KEY: ", process.env.PRIVATE_KEY);
  // Create signer (admin)
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  console.log("Deploying contracts using:", wallet.address);

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

  console.log("\n🚀 All contracts deployed and initialized successfully!");
};

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exit(1);
});
