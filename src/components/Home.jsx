import React, { useState } from "react";
import { motion } from "framer-motion";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { FaUserGraduate, FaChalkboardTeacher } from "react-icons/fa";
import "../assets/Home.css";
import img from "../assets/image.png";
export const Home = () => {
  const [isRegister, setIsRegister] = useState(false); // toggle login/register
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("member");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // LOGIN
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const userRole = docSnap.data().role;
        if (userRole === "faculty") navigate("/faculty-dashboard");
        else navigate("/member-dashboard");
      } else {
        setError("No role info found!");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // REGISTER
  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        name: name,
        email: email,
        role: role,
      });

      if (role === "faculty") navigate("/faculty-dashboard");
      else navigate("/member-dashboard");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="home-container">
      <div className="orb2"></div>
      {/* Header */}
      <motion.h1
        className="portal-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <img src={img} alt="" />
        Sri Krishna Institute of Technology
        <br />
        Digital Team Portal
      </motion.h1>

      {/* Login/Register Card */}
      <motion.div
        className="login-card"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Toggle */}
        <div className="toggle-login-register">
          <motion.button
            whileTap={{ scale: 0.95 }}
            className={`toggle-btn ${!isRegister ? "active" : ""}`}
            onClick={() => setIsRegister(false)}
          >
            Login <FaUserGraduate style={{ marginLeft: "5px" }} />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            className={`toggle-btn ${isRegister ? "active" : ""}`}
            onClick={() => setIsRegister(true)}
          >
            Register <FaChalkboardTeacher style={{ marginLeft: "5px" }} />
          </motion.button>
        </div>

        {/* Form */}
        {!isRegister ? (
          <form onSubmit={handleLogin} className="login-form">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && <p className="error-text">{error}</p>}
            <motion.button whileTap={{ scale: 0.95 }} className="login-btn">
              Login
            </motion.button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="login-form">
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <select value={role} onChange={(e) => setRole(e.target.value)} required>
              <option value="member">Member</option>
              <option value="faculty">Faculty</option>
            </select>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && <p className="error-text">{error}</p>}
            <motion.button whileTap={{ scale: 0.95 }} className="login-btn">
              Register
            </motion.button>
          </form>
        )}
      </motion.div>
      <div className="footer">
      <h3>All Rights Reserved by Sri Krishna Institute of technology ©</h3>
      <h3>Designed by Vishnu Yadav M N</h3>
      </div>
    </div>
  );
};
