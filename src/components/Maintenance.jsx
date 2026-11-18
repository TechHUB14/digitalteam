import React from "react";
import "../assets/Home.css";
import img from "../assets/image.png";

export const Maintenance = () => {
  return (
    <div className="home-container">
      <div className="orb2"></div>
      <div className="portal-header">
        <img src={img} alt="SKIT Logo" />
        Sri Krishna Institute of Technology
        <br />
        Digital Team Portal
      </div>

      <div className="login-card" style={{ textAlign: "center", padding: "2.5rem 2rem" }}>
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔧</div>
        <h2 style={{ color: "#fff", marginBottom: "0.5rem" }}>Under Maintenance</h2>
        <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.95rem", lineHeight: "1.6" }}>
          We're currently performing scheduled maintenance.
          <br />
          Please check back soon.
        </p>
      </div>

      <div className="footer">
        <h3>All Rights Reserved by Sri Krishna Institute of Technology ©</h3>
        <h3>Designed by Vishnu Yadav M N</h3>
      </div>
    </div>
  );
};
