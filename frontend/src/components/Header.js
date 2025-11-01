// src/components/Header.js
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { jwtDecode } from "jwt-decode";
import "../App.css";
import "./Header.css";

function Header() {
  const { isLoggedIn, logout, walletAddress, connectWallet } = useAuth();
  const navigate = useNavigate();
  const [ethRate, setEthRate] = useState(null);
  const [role, setRole] = useState(null);

  useEffect(() => {
    const fetchRate = async () => {
      try {
        const res = await fetch("http://localhost:3001/api/ethrate/eth-inr");
        const data = await res.json();
        setEthRate(data.ethInrRate);
      } catch (err) {
        console.error("Failed to fetch ETH rate:", err);
      }
    };

    fetchRate();
    const interval = setInterval(fetchRate, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setRole(decoded.role);
      } catch {
        setRole(null);
      }
    }
  }, [isLoggedIn]);

  const handleLogout = () => {
    logout();
    navigate("/signin");
  };

  return (
    <header>
      <h1>RealEstate Tokenizer</h1>
      <nav>
        {isLoggedIn ? (
          <>
            <Link to="/home">Home</Link>

            {role === "ADMIN" && (
              <>
                <Link to="/create-property">Create Property</Link>
                <Link to="/modify-property">Modify Property</Link>
              </>
            )}

            {role === "CLIENT" && <Link to="/portfolio">Portfolio</Link>}

            {walletAddress ? (
              <span className="wallet-display">
                Wallet: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </span>
            ) : (
              <button onClick={connectWallet} className="wallet-connect">
                Connect Wallet
              </button>
            )}

            {ethRate && (
              <span className="eth-rate-display">
                1 ETH ≈ ₹{Math.round(ethRate).toLocaleString()}
              </span>
            )}

            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/">Welcome</Link>
            <Link to="/signin">Sign In</Link>
          </>
        )}
      </nav>
    </header>
  );
}

export default Header;
