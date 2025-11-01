import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import "./Home.css";
import "./Portfolio.css";

function Portfolio() {
  const [userData, setUserData] = useState(null);
  const [propertyCards, setPropertyCards] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserPortfolio = async () => {
      const token = localStorage.getItem("token");
      if (!token) return navigate("/signin");

      try {
        const decoded = jwtDecode(token);
        const userId = decoded.id;

        const res = await fetch(`http://localhost:3001/api/user/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        setUserData(data);

        const tokensHeld = data.tokensHeld || {};
        const entries = Object.entries(tokensHeld);
        const cardPromises = entries.map(async ([propertyId, amount]) => {
          try {
            const propRes = await fetch(
              `http://localhost:3001/api/properties/property/${propertyId}`,
              {
                headers: { Authorization: `Bearer ${token}` }, // ✅ include token
              }
            );
            const propData = await propRes.json();
            return {
              _id: propertyId,
              propertyName: propData.propertyName,
              propertyImage: propData.propertyImage,
              amount,
            };
          } catch (err) {
            console.error(`Error fetching property ${propertyId}:`, err);
            return null;
          }
        });

        const resolvedCards = (await Promise.all(cardPromises)).filter(Boolean);
        setPropertyCards(resolvedCards);
      } catch (err) {
        console.error("Auth error:", err);
        navigate("/signin");
      }
    };

    fetchUserPortfolio();
  }, [navigate]);

  if (!userData) {
    return <div className="home-container">Loading portfolio...</div>;
  }

  return (
    <div className="home-container">
      <h2 className="section-title">Your Portfolio</h2>

      <div className="client-view">
        <div className="user-info">
          <p>
            <strong>Full Name:</strong> {userData.fullName}
          </p>
          <p>
            <strong>Email:</strong> {userData.email}
          </p>
          <p>
            <strong>Wallet Address:</strong> {userData.walletAddress}
          </p>
        </div>

        <div className="property-grid">
          {propertyCards.length > 0 ? (
            propertyCards.map((card) => (
              <div key={card._id} className="property-card">
                {card.propertyImage ? (
                  <img
                    src={`data:image/jpeg;base64,${card.propertyImage}`}
                    alt={card.propertyName}
                    className="property-image"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/fallback-image.png"; // Optional fallback image
                    }}
                  />
                ) : (
                  <div className="no-image">No Image</div>
                )}
                <h3 className="property-title">{card.propertyName}</h3>
                <p>
                  <strong>Tokens Held:</strong> {card.amount}
                </p>
                <button onClick={() => navigate(`/property/${card._id}`)}>
                  View
                </button>
              </div>
            ))
          ) : (
            <p>No Properties To Display</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Portfolio;
