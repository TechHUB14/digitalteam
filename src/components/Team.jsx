import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import "../assets/Team.css";

export const Team = () => {
  const [members, setMembers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const snapshot = await getDocs(collection(db, "users"));
        const list = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          // ✅ Filter out faculty and teacher
          .filter((user) => {
            const role = (user.role || "").toLowerCase();
            return role !== "faculty" && role !== "teacher";
          });
        setMembers(list);
      } catch (err) {
        console.error("Error fetching members:", err);
      }
    };

    fetchMembers();
  }, []);

  return (
    <div className="team-page">
      {/* Cyber-style overlay */}
      <div className="cyber-grid"></div>
      <div className="cyber-overlay"></div>

      <div className="team-header">
        <h1>⚡ Digital Team Members ⚡</h1>
        <p>Meet the innovators powering our tech world</p>
        <motion.button
          className="back-btn"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate("/member-dashboard")}
        >
          ⬅ Back to Dashboard
        </motion.button>
      </div>


      <motion.div
        className="team-grid"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        {members.length > 0 ? (
          members.map((member, index) => (
            <motion.div
              key={member.id}
              className="team-card"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
            >
              <div className="avatar">
                <span>{member.name?.charAt(0)?.toUpperCase() || "?"}</span>
              </div>
              <h3>{member.name || "Unnamed Member"}</h3>
              <p className="role">
                {member.admin === "admin" ? "ADMIN" : "MEMBER"}
              </p>
            </motion.div>
          ))
        ) : (
          <p style={{ textAlign: "center", color: "#00ffff", fontSize: "1.1rem" }}>
            No members found.
          </p>
        )}

      </motion.div>


    </div>
  );
};
