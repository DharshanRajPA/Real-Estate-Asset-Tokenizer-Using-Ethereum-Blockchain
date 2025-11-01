// src/pages/Home.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { useAuth } from "../context/AuthContext";
import "./Home.css";

function Home() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [userData, setUserData] = useState(null);
  const [properties, setProperties] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");

    const initialize = async () => {
      if (!token) {
        navigate("/signin");
        return;
      }

      try {
        const decoded = jwtDecode(token);
        const now = Date.now() / 1000;

        if (decoded.exp < now) {
          logout();
          navigate("/signin");
        } else {
          const res = await fetch(
            `http://localhost:3001/api/user/${decoded.id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          const data = await res.json();
          if (res.ok) {
            setUserData(data);

            if (data.role === "CLIENT") {
              fetchAllProperties(token);
            }
          } else {
            console.error(data.message);
          }
        }
      } catch (err) {
        console.error("Invalid token:", err);
        logout();
        navigate("/signin");
      }
    };

    initialize();
  }, [navigate, logout]);

  const fetchAllProperties = async (token) => {
    try {
      const res = await fetch(
        "http://localhost:3001/api/properties/allproperties",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();
      if (res.ok) {
        setProperties(data);
      } else {
        console.error(data.message);
      }
    } catch (err) {
      console.error("Failed to fetch properties:", err);
    }
  };

  if (!userData) {
    return <div className="home-container">Loading...</div>;
  }

  const { role, fullName, email, walletAddress } = userData;

  return (
    <div className="home-container">
      {role === "ADMIN" ? (
        <>
          <h2>Welcome, {fullName}</h2>
          <div className="user-info">
            <p>
              <strong>Email:</strong> {email}
            </p>
            <p>
              <strong>Wallet Address:</strong> {walletAddress}
            </p>
            <p>
              <strong>Role:</strong> {role}
            </p>
          </div>
          <button
            className="create-property-button"
            onClick={() => navigate("/create-property")}
          >
            Add Property
          </button>
        </>
      ) : (
        <div className="client-view">
          <h2 className="section-title">Available Properties</h2>
          <div className="property-grid">
            {properties.length === 0 ? (
              <p>No properties available at the moment.</p>
            ) : (
              properties.map((property) => {
                const availableTokens =
                  property.tokenHolders.length > 0
                    ? property.tokenHolders[0].tokensHeld
                    : 0;

                return (
                  <div key={property._id} className="property-card">
                    <img
                      src={`data:image/jpeg;base64,${property.propertyImage}`}
                      alt={property.propertyName}
                    />
                    <h3>{property.propertyName}</h3>
                    <p>Total Tokens: {property.propertyTokens}</p>
                    <p>Tokens Available: {availableTokens}</p>
                    <button
                      onClick={() => navigate(`/property/${property._id}`)}
                    >
                      View
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
