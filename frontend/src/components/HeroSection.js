import React from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

function HeroSection() {
  const navigate = useNavigate();

  return (
    <section id="hero" className="hero">
      <div className="hero-overlay" />
      <div className="hero-content">
        <h2>Own Real Estate. Fractionally.</h2>
        <p>
          Empowering global real estate investment through blockchain
          technology.
        </p>
        <button onClick={() => navigate("/signup")}>Get Started</button>
      </div>
    </section>
  );
}

export default HeroSection;
