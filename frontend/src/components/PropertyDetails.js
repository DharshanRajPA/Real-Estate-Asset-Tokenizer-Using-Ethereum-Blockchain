import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ethers } from "ethers";
import TokenizerArtifact from "../abis/Tokenizer.json";
import "./PropertyDetails.css";

const TokenizerABI = TokenizerArtifact.abi;

// ⚠️ Replace with actual admin wallet address
const ADMIN_WALLET_ADDRESS = process.env.REACT_APP_ADMIN_WALLET;
console.log("🧾 ADMIN WALLET FROM ENV:", ADMIN_WALLET_ADDRESS);

function PropertyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tokensToBuy, setTokensToBuy] = useState(0);
  const [ethRate, setEthRate] = useState(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [walletBalance, setWalletBalance] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/signin");

    const fetchProperty = async () => {
      try {
        const res = await fetch(
          `http://localhost:3001/api/properties/property/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (res.status === 401) {
          logout();
          navigate("/signin");
        }
        const data = await res.json();
        setProperty(data);
      } catch (err) {
        console.error("Failed to fetch property:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [id, navigate, logout]);

  useEffect(() => {
    const fetchRate = async () => {
      try {
        const res = await fetch("http://localhost:3001/api/ethrate/eth-inr");
        const data = await res.json();
        setEthRate(data.ethInrRate);
      } catch (error) {
        console.error("Error fetching ETH to INR rate:", error);
      }
    };

    fetchRate();
  }, []);

  useEffect(() => {
    const fetchWalletBalance = async () => {
      if (typeof window.ethereum !== "undefined") {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const accounts = await provider.send("eth_accounts", []);
          if (accounts.length > 0) {
            const balance = await provider.getBalance(accounts[0]);
            setWalletBalance(ethers.formatEther(balance));
          }
        } catch (error) {
          console.error("Error fetching wallet balance:", error);
        }
      }
    };

    fetchWalletBalance();
    // Refresh balance every 10 seconds
    const interval = setInterval(fetchWalletBalance, 10000);
    return () => clearInterval(interval);
  }, []);

  const availableTokens =
    property && property.tokenHolders.length > 0
      ? property.tokenHolders[0].tokensHeld
      : 0;

  const handleTokenInputChange = (e) => {
    const value = Math.max(
      0,
      Math.min(availableTokens, Number(e.target.value))
    );
    setTokensToBuy(value);
  };

  const handleSliderChange = (e) => {
    setTokensToBuy(Number(e.target.value));
  };

  const formatETH = (inr) => {
    if (!ethRate) return "";
    const ethValue = inr / ethRate;
    return ` (~${ethValue.toFixed(5)} ETH)`;
  };

  const handleConfirmBuy = async () => {
    if (tokensToBuy === 0 || !property) return;
    setIsPurchasing(true);

    try {
      const [buyerAddress] = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Calculate ETH to send
      const totalInr = property.pricePerToken * tokensToBuy;
      const totalEth = totalInr / ethRate;
      const ethValue = ethers.parseEther(totalEth.toFixed(18));

      // Check wallet balance FIRST before attempting any gas estimation
      // DEBUG: This prevents "insufficient funds" errors by checking first
      const balance = await provider.getBalance(buyerAddress);
      console.log("💰 Current balance:", ethers.formatEther(balance), "ETH");
      console.log("🔗 Wallet address:", buyerAddress);
      
      // DEBUG: Check network to help identify if on wrong network
      const network = await provider.getNetwork();
      console.log("🌐 Network:", network.name, "Chain ID:", network.chainId.toString());

      // If balance is 0, don't even try to estimate gas - show error immediately
      if (balance === 0n) {
        const networkName = network.name || `Chain ${network.chainId}`;
        let errorMsg = 
          `❌ Insufficient funds!\n\n` +
          `Your wallet balance is 0 ETH.\n\n` +
          `Network: ${networkName} (Chain ID: ${network.chainId})\n\n`;
        
        // Add network-specific help
        if (network.chainId === 11155111n) { // Sepolia
          errorMsg += `Get test ETH from: https://sepoliafaucet.com/`;
        } else if (network.chainId === 5n) { // Goerli
          errorMsg += `Get test ETH from: https://goerlifaucet.com/`;
        } else if (network.chainId === 1337n || network.chainId === 5777n) { // Local/Ganache
          errorMsg += `This is a local network. Add ETH from Ganache or your local node.`;
        } else {
          errorMsg += `Please add ETH to your wallet and try again.`;
        }
        
        console.error("❌ Transaction blocked - wallet has 0 ETH");
        alert(errorMsg);
        setIsPurchasing(false);
        return;
      }

      // Get current gas price (handle networks that don't support EIP-1559)
      let gasPrice = 0n;
      try {
        const feeData = await provider.getFeeData();
        // Prefer gasPrice (legacy) or maxFeePerGas (EIP-1559)
        gasPrice = feeData.gasPrice || feeData.maxFeePerGas || 0n;
        if (gasPrice === 0n) {
          // Fallback: try to get gas price directly
          const block = await provider.getBlock("latest");
          if (block && block.gasPrice) {
            gasPrice = block.gasPrice;
          }
        }
      } catch (feeError) {
        // Some networks (like Ganache) don't support eth_maxPriorityFeePerGas
        console.warn("⚠️ Fee data retrieval failed, using fallback:", feeError);
        try {
          // Fallback: get gas price from latest block
          const block = await provider.getBlock("latest");
          if (block && block.gasPrice) {
            gasPrice = block.gasPrice;
          } else {
            // Last resort: use a default gas price (20 gwei)
            gasPrice = ethers.parseUnits("20", "gwei");
          }
        } catch (blockError) {
          // Last resort: use a default gas price (20 gwei)
          gasPrice = ethers.parseUnits("20", "gwei");
          console.warn("⚠️ Using default gas price:", ethers.formatUnits(gasPrice, "gwei"), "Gwei");
        }
      }

      // Estimate gas costs (only if balance > 0)
      let estimatedGas;
      try {
        estimatedGas = await provider.estimateGas({
          from: buyerAddress,
          to: ADMIN_WALLET_ADDRESS,
          value: ethValue,
        });
      } catch (gasError) {
        // If gas estimation fails (e.g., insufficient funds), use a default safe estimate
        estimatedGas = 21000n; // Standard ETH transfer gas
        console.warn("⚠️ Gas estimation failed, using default:", gasError);
      }
      
      // Calculate total required (value + gas costs)
      const gasCost = estimatedGas * gasPrice;
      const totalRequired = ethValue + gasCost;

      console.log("📊 Transaction details:");
      console.log("   ETH to send:", ethers.formatEther(ethValue), "ETH");
      console.log("   Estimated gas:", estimatedGas.toString());
      console.log("   Gas price:", ethers.formatEther(gasPrice), "ETH");
      console.log("   Gas cost:", ethers.formatEther(gasCost), "ETH");
      console.log("   Total required:", ethers.formatEther(totalRequired), "ETH");

      // Check if balance is sufficient
      // DEBUG: This is the critical check that prevents the error you encountered
      if (balance < totalRequired) {
        const shortfall = totalRequired - balance;
        const networkName = network.name || `Chain ${network.chainId}`;
        
        // Build helpful error message with network-specific guidance
        let errorMsg = 
          `❌ Insufficient funds!\n\n` +
          `Your balance: ${ethers.formatEther(balance)} ETH\n` +
          `Required: ${ethers.formatEther(totalRequired)} ETH\n` +
          `Shortfall: ${ethers.formatEther(shortfall)} ETH\n\n` +
          `Network: ${networkName} (Chain ID: ${network.chainId})\n\n`;
        
        // Add network-specific help
        if (network.chainId === 11155111n) { // Sepolia
          errorMsg += `Get test ETH from: https://sepoliafaucet.com/`;
        } else if (network.chainId === 5n) { // Goerli
          errorMsg += `Get test ETH from: https://goerlifaucet.com/`;
        } else if (network.chainId === 1337n || network.chainId === 5777n) { // Local/Ganache
          errorMsg += `This is a local network. Add ETH from Ganache or your local node.`;
        } else {
          errorMsg += `Please add ETH to your wallet and try again.`;
        }
        
        console.error("❌ Transaction blocked - insufficient funds");
        console.error("   Balance:", ethers.formatEther(balance), "ETH");
        console.error("   Required:", ethers.formatEther(totalRequired), "ETH");
        console.error("   Shortfall:", ethers.formatEther(shortfall), "ETH");
        
        alert(errorMsg);
        setIsPurchasing(false);
        return;
      }

      const txPayment = await signer.sendTransaction({
        to: ADMIN_WALLET_ADDRESS,
        value: ethValue,
        gasLimit: estimatedGas,
      });

      await txPayment.wait();
      console.log("💸 ETH sent to admin:", txPayment.hash);

      const tokenizer = new ethers.Contract(
        process.env.REACT_APP_TOKENIZER_CONTRACT,
        TokenizerABI,
        signer
      );

      const rawId = property._id.toLowerCase();
      const assetID = ethers.zeroPadValue("0x" + rawId, 12);
      console.log("🔍 Checking asset tokenization for assetID:", assetID);

      // Check if asset has been tokenized
      // First check totalAssetTokenSupplyMap (more reliable for checking existence)
      let tokenID;
      let isTokenized = false;
      
      try {
        // Check total supply first - if it's > 0, asset is tokenized
        const totalSupply = await tokenizer.totalAssetTokenSupplyMap(assetID);
        console.log("📊 Total Supply:", totalSupply.toString());
        
        if (totalSupply > 0n) {
          // Asset is tokenized, now get tokenID
          try {
            tokenID = await tokenizer.assetTokenMap(assetID);
            console.log("🆔 Token ID:", tokenID.toString());
            
            if (tokenID === 0n || tokenID.toString() === "0") {
              // This shouldn't happen if totalSupply > 0, but handle it
              console.warn("⚠️ Total supply exists but tokenID is 0 - contract state issue");
              throw new Error("TokenID is 0 but supply exists");
            }
            isTokenized = true;
          } catch (tokenError) {
            // If assetTokenMap fails but totalSupply exists, there's a contract issue
            console.error("❌ Error getting tokenID:", tokenError);
            const errorMsg = 
              "❌ Contract State Error!\n\n" +
              "Asset appears to be tokenized (supply > 0) but tokenID mapping failed.\n\n" +
              "This might indicate a contract state issue.\n\n" +
              "Error: " + (tokenError.message || "Unknown");
            alert(errorMsg);
            setIsPurchasing(false);
            return;
          }
        } else {
          // Total supply is 0, asset not tokenized
          throw new Error("Asset not tokenized - total supply is 0");
        }
      } catch (error) {
        // Check if this is a "not tokenized" error or a decode error
        const isNotTokenizedError = 
          error.message?.includes("not tokenized") ||
          error.message?.includes("total supply is 0") ||
          error.code === "BAD_DATA" ||
          error.message?.includes("BAD_DATA") ||
          error.message?.includes("could not decode") ||
          error.message?.includes("value=\"0x\"");
        
        if (isNotTokenizedError) {
          // Asset is definitely not tokenized
          const errorMsg = 
            "❌ Asset Not Tokenized!\n\n" +
            "This property hasn't been tokenized on the blockchain yet.\n\n" +
            "The property must be tokenized by the admin before tokens can be purchased.\n\n" +
            "Steps to fix:\n" +
            "1. Admin should go to 'Create Property' page\n" +
            "2. Re-create the property (this will tokenize it)\n" +
            "3. Or manually call:\n" +
            "   - assetContract.addAsset(assetID, assetHash)\n" +
            "   - tokenizerContract.mintAssetTokens(assetID, tokens)\n\n" +
            "Asset ID: " + assetID;
          
          console.error("❌ Asset not tokenized:", {
            assetID,
            error: error.message,
            code: error.code,
            info: error.info
          });
          alert(errorMsg);
          setIsPurchasing(false);
          return;
        } else {
          // Different error - could be network, contract, etc.
          console.error("❌ Error checking asset tokenization:", error);
          const errorMsg = 
            "❌ Error checking asset tokenization!\n\n" +
            "Could not verify if this property is tokenized.\n\n" +
            "Possible issues:\n" +
            "- Contract address might be incorrect\n" +
            "- Network connection issue\n" +
            "- Asset not tokenized yet\n\n" +
            "Error: " + (error.message || "Unknown error") + "\n" +
            "Code: " + (error.code || "N/A");
          alert(errorMsg);
          setIsPurchasing(false);
          return;
        }
      }
      
      // Verify we have a valid tokenID before proceeding
      if (!isTokenized || !tokenID || tokenID === 0n) {
        const errorMsg = 
          "❌ Invalid Token State!\n\n" +
          "Could not determine valid token ID for this asset.\n\n" +
          "Please contact the admin to verify the property is properly tokenized.\n\n" +
          "Asset ID: " + assetID;
        alert(errorMsg);
        setIsPurchasing(false);
        return;
      }

      // Check balance again before second transaction (gas may have changed)
      const balanceAfterFirstTx = await provider.getBalance(buyerAddress);
      
      // Get gas price for second transaction (handle networks that don't support EIP-1559)
      let gasPrice2 = 0n;
      try {
        const feeData2 = await provider.getFeeData();
        gasPrice2 = feeData2.gasPrice || feeData2.maxFeePerGas || 0n;
        if (gasPrice2 === 0n) {
          // Fallback: try to get gas price directly from block
          const block = await provider.getBlock("latest");
          if (block && block.gasPrice) {
            gasPrice2 = block.gasPrice;
          }
        }
      } catch (feeError2) {
        // Some networks (like Ganache) don't support eth_maxPriorityFeePerGas
        console.warn("⚠️ Fee data retrieval failed for second tx, using fallback:", feeError2);
        try {
          const block = await provider.getBlock("latest");
          if (block && block.gasPrice) {
            gasPrice2 = block.gasPrice;
          } else {
            // Use the gas price from first transaction as fallback
            gasPrice2 = gasPrice;
          }
        } catch (blockError2) {
          // Use the gas price from first transaction as fallback
          gasPrice2 = gasPrice;
        }
      }
      
      // Estimate gas for claimAssetToken
      let estimatedGas2;
      try {
        estimatedGas2 = await tokenizer.claimAssetToken.estimateGas(assetID, tokensToBuy);
      } catch (gasError2) {
        estimatedGas2 = 100000n; // Default estimate for contract call
        console.warn("⚠️ Gas estimation for claimAssetToken failed, using default:", gasError2);
      }

      const gasCost2 = estimatedGas2 * gasPrice2;
      
      if (balanceAfterFirstTx < gasCost2) {
        const errorMsg = 
          `❌ Insufficient funds for token claim!\n\n` +
          `Remaining balance: ${ethers.formatEther(balanceAfterFirstTx)} ETH\n` +
          `Required for gas: ${ethers.formatEther(gasCost2)} ETH\n\n` +
          `Please add more ETH to your wallet and try again.`;
        
        alert(errorMsg);
        setIsPurchasing(false);
        return;
      }

      const tx = await tokenizer.claimAssetToken(assetID, tokensToBuy, {
        gasLimit: estimatedGas2,
      });
      await tx.wait();
      console.log("✅ Token claimed on-chain");
      
      // Update wallet balance after successful transaction
      const updatedBalance = await provider.getBalance(buyerAddress);
      setWalletBalance(ethers.formatEther(updatedBalance));

      const res = await fetch(
        `http://localhost:3001/api/properties/update-holders/${property._id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            buyerAddress,
            tokensBought: tokensToBuy,
          }),
        }
      );

      const result = await res.json();

      const userUpdateRes = await fetch(
        "http://localhost:3001/api/user/update-tokens-held",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            propertyId: property._id,
            tokensBought: tokensToBuy,
          }),
        }
      );

      if (res.ok && userUpdateRes.ok) {
        alert("✅ Purchase successful and recorded!");
        setTokensToBuy(0);
        setProperty(result.updatedProperty);
      } else {
        console.error("Database update failed");
        alert("⚠️ Token purchased but database update failed.");
      }
    } catch (err) {
      console.error("❌ Transaction failed:", err);
      
      // Provide user-friendly error messages
      let errorMessage = "Transaction failed. Please try again.";
      
      if (err.code === "INSUFFICIENT_FUNDS" || err.message?.includes("insufficient funds")) {
        // DEBUG: This catches the error even if pre-check failed somehow
        // The error message from the error object contains detailed info:
        // - "have X want Y" shows balance vs required
        // - Gas estimation failure means the node couldn't estimate due to insufficient funds
        
        let errorDetails = "Your wallet doesn't have enough ETH to cover the transaction value and gas fees.";
        
        // Try to extract error details from the error message
        if (err.info?.error?.message) {
          const match = err.info.error.message.match(/have (\d+) want (\d+)/);
          if (match) {
            // Use ethers.getBigInt() to convert string to BigInt (ESLint-safe)
            const have = ethers.getBigInt(match[1]);
            const want = ethers.getBigInt(match[2]);
            const shortfall = want - have;
            errorDetails = 
              `Your balance: ${ethers.formatEther(have)} ETH\n` +
              `Required: ${ethers.formatEther(want)} ETH\n` +
              `Shortfall: ${ethers.formatEther(shortfall)} ETH`;
          }
        }
        
        errorMessage = 
          "❌ Insufficient funds!\n\n" +
          errorDetails + "\n\n" +
          "Please add ETH to your wallet and try again.";
      } else if (err.code === "ACTION_REJECTED" || err.message?.includes("User rejected")) {
        errorMessage = "Transaction was cancelled by user.";
      } else if (err.code === "NETWORK_ERROR" || err.message?.includes("network")) {
        errorMessage = "Network error. Please check your connection and try again.";
      } else if (err.message) {
        errorMessage = `Transaction failed: ${err.message}`;
      }
      
      alert(errorMessage);
    } finally {
      setIsPurchasing(false);
    }
  };

  if (loading) return <div className="spinner"></div>;
  if (!property) return <div>Property not found.</div>;

  return (
    <div className="property-details">
      <img
        loading="lazy"
        src={`data:image/jpeg;base64,${property.propertyImage}`}
        alt={property.propertyName}
        className="property-image"
      />
      <div className="property-info">
        <h2>{property.propertyName}</h2>
        <p>
          <strong>Location:</strong> {property.propertyLocation}
        </p>
        <p>
          <strong>Total Price:</strong> ₹ {property.propertyPrice}
          <span className="eth-equivalent">
            {formatETH(property.propertyPrice)}
          </span>
        </p>
        <p>
          <strong>Total Tokens:</strong> {property.propertyTokens}
        </p>
        <p>
          <strong>Price per Token:</strong> ₹ {property.pricePerToken}
          <span className="eth-equivalent">
            {formatETH(property.pricePerToken)}
          </span>
        </p>
        <p>
          <strong>Tokens Available for Sale:</strong> {availableTokens}
        </p>
        {walletBalance !== null && (
          <p>
            <strong>Your Wallet Balance:</strong> {parseFloat(walletBalance).toFixed(6)} ETH
          </p>
        )}

        <div className="buy-section">
          <label htmlFor="tokenInput">
            <strong>Select tokens to buy:</strong>
          </label>
          <input
            id="tokenInput"
            type="number"
            min="0"
            max={availableTokens}
            value={tokensToBuy}
            onChange={handleTokenInputChange}
            className="token-input"
          />
          <input
            type="range"
            min="0"
            max={availableTokens}
            value={tokensToBuy}
            onChange={handleSliderChange}
            className="token-slider"
          />
          <button
            className="buy-button"
            onClick={handleConfirmBuy}
            disabled={tokensToBuy === 0 || isPurchasing}
          >
            {isPurchasing ? "Processing..." : "Confirm Buy"}
          </button>
          {isPurchasing && <div className="spinner purchase-spinner"></div>}
        </div>
      </div>
    </div>
  );
}

export default PropertyDetails;
