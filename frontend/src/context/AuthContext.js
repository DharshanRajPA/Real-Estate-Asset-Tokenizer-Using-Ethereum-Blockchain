// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from "react";
import { ethers } from "ethers";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [walletAddress, setWalletAddress] = useState(null);
  const [user, setUser] = useState(null); // ✅ store decoded user info incl. role

  const checkToken = () => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));

        const isExpired = payload.exp < Date.now() / 1000;
        if (isExpired) {
          localStorage.removeItem("token");
          setIsLoggedIn(false);
          setUser(null);
        } else {
          setIsLoggedIn(true);
          setUser(payload); // ✅ Save full payload (id, role, etc.)
        }
      } catch {
        setIsLoggedIn(false);
        setUser(null);
      }
    } else {
      setIsLoggedIn(false);
      setUser(null);
    }
  };

  const checkWallet = async () => {
    if (typeof window.ethereum !== "undefined") {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_accounts", []);
      if (accounts.length > 0) {
        setWalletAddress(accounts[0]);
      }
    }
  };

  useEffect(() => {
    checkToken();
    checkWallet();
  }, []);

  const login = async () => {
    checkToken();
    await checkWallet(); // Automatically set wallet address on login
  };

  const logout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    setUser(null);
    setWalletAddress(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        login,
        logout,
        walletAddress,
        setWalletAddress,
        user, // ✅ provide user info
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
