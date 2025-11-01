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

      const txPayment = await signer.sendTransaction({
        to: ADMIN_WALLET_ADDRESS,
        value: ethers.parseEther(totalEth.toFixed(18)),
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

      const tokenID = await tokenizer.assetTokenMap(assetID);
      console.log("🆔 Token ID:", tokenID.toString());

      const tx = await tokenizer.claimAssetToken(assetID, tokensToBuy);
      await tx.wait();
      console.log("✅ Token claimed on-chain");

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
      alert("Transaction failed. Please try again.");
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
