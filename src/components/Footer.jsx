import React from "react";
import { FaPhoneAlt, FaEnvelope, FaFacebookF, FaTwitter, FaYoutube, FaInstagram, FaLinkedin } from "react-icons/fa";
import "../styles/Footer.css";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        
        {/* University Info + Mission */}
        <div className="footer-section">
          <h3>Limkokwing University of Creative Technology - Lesotho</h3>
          <h4 className="footer-subheading">Mission Statement</h4>
          <p>
            To promote inclusive participation, innovation and lifelong learning
            through quality assurance in higher education, and global recognition 
            of Lesotho qualifications.
          </p>
        </div>

        {/* Contact Info */}
        <div className="footer-section">
          <h4 className="footer-subheading">Physical Address</h4>
          <p>P.O. Box 14046, Maseru 100, Lesotho</p>
          <p>Corner Lerotholi Road & Constitutional Road, Maseru, Lesotho, Southern Africa</p>
          <p><FaPhoneAlt /> +266 2224 7500 / 6231 3521</p>
          <p><FaEnvelope /> lesotho@limkokwing.edu.ls</p>
        </div>

        {/* Social Media (Follow Us) */}
        <div className="footer-section">
          <h4>Follow Us</h4>
          <div className="social-icons">
            <a href="#" target="_blank" rel="noreferrer"><FaFacebookF /></a>
            <a href="#" target="_blank" rel="noreferrer"><FaTwitter /></a>
            <a href="#" target="_blank" rel="noreferrer"><FaYoutube /></a>
            <a href="#" target="_blank" rel="noreferrer"><FaInstagram /></a>
            <a href="#" target="_blank" rel="noreferrer"><FaLinkedin /></a>
          </div>
        </div>
      </div>

      {/* Bottom Strip */}
      <div className="footer-bottom">
        <p>BOS ISO 9001:2015 CERTIFIED ORGANISATION</p>
        <p>&copy; {new Date().getFullYear()} Limkokwing University of Creative Technology Lesotho. All Rights Reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;
