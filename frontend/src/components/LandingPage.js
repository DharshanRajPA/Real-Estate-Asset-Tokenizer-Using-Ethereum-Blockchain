// src/components/LandingPage.js
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import HeroSection from "./HeroSection";
import Features from "./Features";
import Footer from "./Footer";

function LandingPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/home");
    }
  }, [navigate]);

  return (
    <>
      <HeroSection />
      <Features />
      <Footer />
    </>
  );
}

export default LandingPage;
