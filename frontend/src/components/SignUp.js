import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import "./SignIn.css";

function SignUp() {
  const navigate = useNavigate();

  const [fullName, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [role, setRole] = useState("CLIENT"); // 👈 Default role is CLIENT

  const fetchWalletAddress = async () => {
    if (typeof window.ethereum === "undefined") {
      alert("🦊 Please install MetaMask to proceed.");
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);

      await provider.send("wallet_requestPermissions", [
        {
          eth_accounts: {},
        },
      ]);

      const accounts = await provider.send("eth_requestAccounts", []);
      setWalletAddress(accounts[0]);
    } catch (err) {
      console.error("Wallet error:", err);
      alert("Could not fetch wallet address.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!walletAddress) {
      alert("⚠️ Please fetch your wallet address before signing up.");
      return;
    }

    try {
      const res = await fetch("http://localhost:3001/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName,
          email,
          password,
          walletAddress,
          role, // 👈 include role in request
        }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.token);
        alert("🎉 Account created!");
        navigate("/signin");
      } else {
        alert(data.message || "❌ Sign up failed.");
      }
    } catch (err) {
      console.error("Signup error:", err);
      alert("Something went wrong. Try again.");
    }
  };

  return (
    <div className="signin-container">
      <form className="signin-form" onSubmit={handleSubmit}>
        <h2>Sign Up</h2>

        <input
          type="text"
          placeholder="Full Name"
          required
          value={fullName}
          onChange={(e) => setName(e.target.value)}
        />
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

        <select required value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="CLIENT">Client</option>
          <option value="ADMIN">Admin</option>
        </select>

        <button type="button" onClick={fetchWalletAddress}>
          {walletAddress
            ? `✅ Wallet: ${walletAddress.slice(0, 6)}...${walletAddress.slice(
                -4
              )}`
            : "🔗 Get Wallet Address"}
        </button>

        <button type="submit">Create Account</button>

        <p>
          Already have an account?{" "}
          <span className="signup-link" onClick={() => navigate("/signin")}>
            Sign In
          </span>
        </p>
      </form>
    </div>
  );
}

export default SignUp;
