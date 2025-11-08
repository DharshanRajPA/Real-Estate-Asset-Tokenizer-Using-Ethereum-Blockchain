import "./createProperty.css";
import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { jwtDecode } from "jwt-decode";
import assetArtifact from "../abis/Asset.json";
import tokenizerArtifact from "../abis/Tokenizer.json";

const assetABI = assetArtifact.abi;
const tokenizerABI = tokenizerArtifact.abi;

function CreateProperty() {
  const [formData, setFormData] = useState({
    propertyName: "",
    propertyLocation: "",
    propertyPrice: "",
    propertyTokens: "",
    propertyImage: null,
  });

  const [pricePerToken, setPricePerToken] = useState("");

  useEffect(() => {
    const price = parseFloat(formData.propertyPrice);
    const tokens = parseInt(formData.propertyTokens);

    if (
      !isNaN(price) &&
      Number.isInteger(price) &&
      !isNaN(tokens) &&
      tokens > 0 &&
      price % tokens === 0
    ) {
      setPricePerToken(price / tokens);
    } else {
      setPricePerToken("");
    }
  }, [formData.propertyPrice, formData.propertyTokens]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setFormData((prev) => ({ ...prev, propertyImage: file }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) {
      alert("⚠️ Please log in first.");
      return;
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const walletAddress = await signer.getAddress();

    const price = parseFloat(formData.propertyPrice);
    const tokens = parseInt(formData.propertyTokens);

    if (!Number.isInteger(price)) {
      alert("❌ Property price must be a whole number (no decimals).");
      return;
    }

    if (price % tokens !== 0) {
      alert("❌ Price must be divisible exactly by the number of tokens.");
      return;
    }

    let userId;
    try {
      const decoded = jwtDecode(token);
      userId = decoded.id;
    } catch (err) {
      console.error("JWT decode error:", err);
      alert("Invalid token. Please login again.");
      return;
    }

    const data = new FormData();
    data.append("propertyName", formData.propertyName);
    data.append("propertyLocation", formData.propertyLocation);
    data.append("propertyPrice", formData.propertyPrice);
    data.append("propertyTokens", formData.propertyTokens);
    data.append("pricePerToken", pricePerToken);
    data.append("image", formData.propertyImage);
    data.append("holderId", userId);
    data.append("walletAddress", walletAddress);

    try {
      const res = await fetch(
        "http://localhost:3001/api/properties/addProperty",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: data,
        }
      );

      const result = await res.json();

      if (res.ok) {
        const createdProperty = result.property;

        try {
          const tokenized = await tokenizePropertyOnChain({
            propertyId: createdProperty._id,
            propertyName: createdProperty.propertyName,
            propertyLocation: createdProperty.propertyLocation,
            propertyPrice: createdProperty.propertyPrice,
            propertyTokens: createdProperty.propertyTokens,
          });

          if (tokenized) {
            alert("✅ Property created and tokenized successfully!");
            setFormData({
              propertyName: "",
              propertyLocation: "",
              propertyPrice: "",
              propertyTokens: "",
              propertyImage: null,
            });
            setPricePerToken("");
          }
        } catch (tokenizeError) {
          // Error already shown in tokenizePropertyOnChain
          console.error("Tokenization failed:", tokenizeError);
          // Don't clear form so user can retry
        }
      } else {
        alert(result.message || "❌ Failed to create property");
      }
    } catch (err) {
      console.error("Error submitting form:", err);
      alert("Something went wrong");
    }
  };

  const tokenizePropertyOnChain = async ({
    propertyId,
    propertyName,
    propertyLocation,
    propertyPrice,
    propertyTokens,
  }) => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // ✅ Correctly convert Mongo ObjectId (24 hex chars) to bytes12
      const rawId = propertyId.toLowerCase();
      const assetID = ethers.zeroPadValue("0x" + rawId, 12);

      console.log("AssetID (bytes12):", assetID);

      const hashInput = `${propertyName}:${propertyLocation}:${propertyPrice}`;
      const assetHash = ethers.keccak256(ethers.toUtf8Bytes(hashInput));

      const assetContractAddress = process.env.REACT_APP_ASSET_CONTRACT;
      const tokenizerContractAddress = process.env.REACT_APP_TOKENIZER_CONTRACT;

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

      console.log("📦 Adding asset to blockchain...");
      const tx1 = await assetContract.addAsset(assetID, assetHash);
      await tx1.wait();
      console.log("✅ Asset added!");
      console.log({ assetID, propertyTokens });
      console.log("🪙 Minting tokens...");
      const tx2 = await tokenizerContract.mintAssetTokens(
        assetID,
        propertyTokens
      );
      const receipt2 = await tx2.wait();
      console.log("✅ Tokens minted! Transaction hash:", receipt2.hash);
      
      // Verify transaction succeeded
      if (receipt2.status !== 1) {
        throw new Error("Minting transaction failed - transaction was reverted");
      }
      console.log("✅ Minting transaction confirmed (status: success)");
      
      // Try to verify tokenization (optional - transaction success is the main indicator)
      // If verification fails, we'll still consider it successful since the transaction succeeded
      console.log("🔍 Attempting to verify tokenization...");
      let verificationSucceeded = false;
      
      try {
        // Wait a bit for state to update
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Try to verify (with retry)
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            const totalSupply = await tokenizerContract.totalAssetTokenSupplyMap(assetID);
            const tokenID = await tokenizerContract.assetTokenMap(assetID);
            
            if (totalSupply > 0n && tokenID > 0n) {
              console.log(`✅ Verification successful (attempt ${attempt})!`);
              console.log("   Total Supply:", totalSupply.toString());
              console.log("   Token ID:", tokenID.toString());
              verificationSucceeded = true;
              break;
            } else {
              console.log(`⚠️ Verification attempt ${attempt} - values are 0, retrying...`);
              if (attempt < 3) await new Promise(resolve => setTimeout(resolve, 2000));
            }
          } catch (verifyError) {
            // Handle BAD_DATA or other errors
            if (verifyError.code === "BAD_DATA" || verifyError.message?.includes("could not decode")) {
              console.log(`⚠️ Verification attempt ${attempt} - BAD_DATA error (state may not be updated yet)`);
              if (attempt < 3) {
                await new Promise(resolve => setTimeout(resolve, 2000));
                continue;
              }
            } else {
              console.warn(`⚠️ Verification attempt ${attempt} failed:`, verifyError.message);
              if (attempt < 3) {
                await new Promise(resolve => setTimeout(resolve, 2000));
                continue;
              }
            }
          }
        }
        
        if (!verificationSucceeded) {
          console.warn("⚠️ Verification could not confirm tokenization, but transaction succeeded.");
          console.warn("   The property should still be tokenized. You can verify by trying to purchase tokens.");
        }
      } catch (verifyErr) {
        // Verification is optional - don't fail the whole process if it fails
        console.warn("⚠️ Verification step failed, but transaction succeeded:", verifyErr.message);
        console.warn("   The minting transaction completed successfully, so tokenization should be complete.");
      }
      
      // Transaction succeeded, so tokenization is complete
      // Even if verification failed, we trust the transaction receipt
      console.log("✅ Tokenization complete! Transaction hash:", receipt2.hash);
      return true; // Success
    } catch (err) {
      console.error("❌ Error in on-chain operation:", err);
      const errorMsg = 
        "❌ Blockchain Tokenization Failed!\n\n" +
        "The property was created in the database, but tokenization on the blockchain failed.\n\n" +
        "Error: " + (err.message || "Unknown error") + "\n\n" +
        "The property cannot be purchased until it's tokenized.\n\n" +
        "Please try creating the property again, or contact support.";
      alert(errorMsg);
      throw err; // Re-throw to prevent showing success message
    }
  };

  return (
    <div className="create-property-container">
      <h2>Create New Property</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="propertyName"
          placeholder="Property Name"
          value={formData.propertyName}
          onChange={handleChange}
          required
        />
        <textarea
          name="propertyLocation"
          placeholder="Location"
          value={formData.propertyLocation}
          onChange={handleChange}
          required
        />
        <input
          type="number"
          name="propertyPrice"
          placeholder="Property Price (Whole Number)"
          value={formData.propertyPrice}
          onChange={handleChange}
          required
        />
        <input
          type="number"
          name="propertyTokens"
          placeholder="Number of Tokens"
          value={formData.propertyTokens}
          onChange={handleChange}
          required
        />
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          required
        />

        {pricePerToken !== "" && (
          <p className="token-price-display">
            💰 Price per token: <strong>{pricePerToken}</strong>
          </p>
        )}

        <button type="submit">Submit Property</button>
      </form>
    </div>
  );
}

export default CreateProperty;
