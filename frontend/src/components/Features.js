import React from "react";
import "../App.css";

function Features() {
  return (
    <section id="features" className="features">
      <h3>Key Features</h3>
      <div className="features-grid">
        <div className="feature">
          <i>🔐</i>
          <h4>Secure Contracts</h4>
          <p>Audited Solidity smart contracts keep your investment safe.</p>
        </div>
        <div className="feature">
          <i>🌍</i>
          <h4>Global Access</h4>
          <p>Invest in properties around the world with ease.</p>
        </div>
        <div className="feature">
          <i>🧩</i>
          <h4>Fractional Ownership</h4>
          <p>Own a share of properties, starting with as little as $100.</p>
        </div>
        <div className="feature">
          <i>📈</i>
          <h4>Passive Income</h4>
          <p>Earn rental yield and benefit from property appreciation.</p>
        </div>
      </div>
    </section>
  );
}

export default Features;
