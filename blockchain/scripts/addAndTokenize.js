import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Fix for __dirname in ES module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Utility to dynamically load ABI from artifacts
const loadContractABI = (contractName) => {
  const artifactPath = path.resolve(
    __dirname,
    `../artifacts/contracts/${contractName}.sol/${contractName}.json`
  );
  const { abi } = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));
  return abi;
};

export async function addAndTokenizeAsset({
  provider,
  assetID,
  assetHash,
  tokenAmount,
  assetContractAddress,
  tokenizerContractAddress,
}) {
  try {
    const signer = await provider.getSigner();

    const assetABI = loadContractABI("Asset");
    const tokenizerABI = loadContractABI("Tokenizer");

    const assetContract = new ethers.Contract(
      assetContractAddress,
      assetABI,
      signer
    );

    const tokenizerContract = new ethers.Contract(
      tokenizerContractAddress,
      tokenizerABI,
      signer
    );

    console.log("📥 Adding asset...");
    const tx1 = await assetContract.addAsset(assetID, assetHash);
    await tx1.wait();
    console.log("✅ Asset added to blockchain!");

    console.log("🔄 Tokenizing asset...");
    const tx2 = await tokenizerContract.mintAssetTokens(assetID, tokenAmount);
    await tx2.wait();
    console.log("✅ Asset tokenized with", tokenAmount, "tokens!");
  } catch (error) {
    console.error("❌ Error during asset add/tokenize:", error);
  }
}
