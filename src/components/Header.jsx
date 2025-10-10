import React from "react";
import { Link } from "react-router-dom";
import logo from "../assets/logo.png"; // replace with your logo path
import "../styles/Header.css";

const Header = () => {
  return (
    <header>
      <div className="logo-title">
        <img src={logo} alt="LUCT Logo" />
        <h3>Limkokwing University of Creative Technology</h3>
      </div>
      <div className="header-buttons">
        <Link to="/login" className="btn btn-light">Login</Link>
        <Link to="/register" className="btn btn-light">Register</Link>
      </div>
    </header>
  );
};

export default Header;
