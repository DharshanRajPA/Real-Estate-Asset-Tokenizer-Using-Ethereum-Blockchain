import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ethers } from "ethers";
import "./SignIn.css";

function SignIn() {
  const navigate = useNavigate();
  const { login, setWalletAddress } = useAuth(); // add setWalletAddress from context
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localWallet, setLocalWallet] = useState(""); // to show connected address

  const connectWallet = async () => {
    if (typeof window.ethereum === "undefined") {
      alert("🦊 MetaMask not detected. Please install it first.");
      return;
    }

    try {
      // Always prompt wallet selection
      await window.ethereum.request({
        method: "wallet_requestPermissions",
        params: [{ eth_accounts: {} }],
      });

      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);

      if (accounts.length > 0) {
        setLocalWallet(accounts[0]); // Local display
        setWalletAddress(accounts[0]); // Global context update
      }
    } catch (err) {
      console.error("Wallet connection error:", err);
      alert("❌ Failed to connect wallet.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!localWallet) {
      alert("⚠️ Please connect your wallet before signing in.");
      return;
    }

    try {
      const res = await fetch("http://localhost:3001/api/auth/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.token);
        login(); // sets isLoggedIn and checks token
        alert("✅ Signed in!");
        navigate("/home");
      } else {
        alert(data.message || "❌ Sign in failed.");
      }
    } catch (err) {
      console.error("Sign-in error:", err);
      alert("Something went wrong. Try again.");
    }
  };

  return (
    <div className="signin-container">
      <form className="signin-form" onSubmit={handleSubmit}>
        <h2>Sign In</h2>

        <input
          type="email"
          placeholder="Email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button type="button" onClick={connectWallet}>
          {localWallet
            ? `✅ Wallet: ${localWallet.slice(0, 6)}...`
            : "🔗 Connect Wallet"}
        </button>

        <button type="submit">Sign In</button>

        <p>
          Don't have an account?{" "}
          <span className="signup-link" onClick={() => navigate("/signup")}>
            Sign Up
          </span>
        </p>
      </form>
    </div>
  );
}

export default SignIn;
