import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import "./App.css";
import LandingPage from "./components/LandingPage";
import Header from "./components/Header";
import SignIn from "./components/SignIn";
import SignUp from "./components/SignUp";
import NotFound from "./components/NotFound";
import Home from "./components/Home";
import CreateProperty from "./components/createProperty";
import { AuthProvider } from "./context/AuthContext";
import PropertyDetails from "./components/PropertyDetails";
import ModifyProperty from "./components/modifyProperty"; // ✅ fixed this line
import Portfolio from "./components/Portfolio";

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Header />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/home" element={<Home />} />
            <Route path="*" element={<NotFound />} />
            <Route path="/create-property" element={<CreateProperty />} />
            <Route path="/property/:id" element={<PropertyDetails />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/modify-property" element={<ModifyProperty />} />{" "}
            {/* ✅ now it works */}
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
