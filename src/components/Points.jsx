import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  doc,
  updateDoc,
} from "firebase/firestore";

import logo from "../assets/image.png"; // Your institute logo
import "../assets/Points.css";

export default function Points() {
  const [reels, setReels] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [newReel, setNewReel] = useState({ title: "", link: "" });

  // Emoji thumbnail list (or placeholders)
  const thumbnails = ["🎬", "🔥", "⭐", "🎵", "🎥", "🚀", "💎", "🎶", "❤️", "📽️"];
  const randomThumb = () => thumbnails[Math.floor(Math.random() * thumbnails.length)];

  // Listen to realtime reels
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "reels"), (snap) => {
      setReels(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  // Badge logic
  const getBadge = (views) => {
    if (views >= 50000) return "diamond";
    if (views >= 10000) return "gold";
    if (views >= 5000) return "silver";
    return "bronze";
  };

  // Points logic
  const getPoints = (views, likes) =>
    Math.floor(views / 100) + Math.floor(likes / 10);

  // Add new reel
  const addNewReel = async () => {
    if (!newReel.title || !newReel.link) return;
    await addDoc(collection(db, "reels"), {
      title: newReel.title,
      link: newReel.link,
      views: 0,
      likes: 0,
      thumbnail: randomThumb(),
    });
    setModalOpen(false);
    setNewReel({ title: "", link: "" });
  };

  // Update reel analytics
  const updateReel = async () => {
    await updateDoc(doc(db, "reels", editModal.id), {
      views: Number(editModal.views),
      likes: Number(editModal.likes),
    });
    setEditModal(null);
  };

  return (
    <div className="points-container">
      {/* Header */}
      <div className="page-header">
      
        <div className="header-text">
          <h1>Sri Krishna Institute of Technology</h1>
          <h2>Digital Team Portal</h2>
        </div>
      </div>

      <h1
        style={{
          color: "#00eaff",
          fontSize: "1.8rem",
          fontWeight: "800",
          marginBottom: 20,
        }}
      >
        Build for Bengaluru — Reels Performance Hub
      </h1>

      {/* Reels Grid */}
      <div className="reels-grid">
        {reels.map((r) => {
          const badge = getBadge(r.views);
          const points = getPoints(r.views, r.likes);

          return (
            <div
              key={r.id}
              className="reel-card"
              onClick={() => setEditModal(r)}
            >
              <div className="reel-thumb">{r.thumbnail}</div>
              <div className="reel-title">{r.title}</div>
              <div className={`badge badge-${badge}`}>{badge.toUpperCase()}</div>
              <div className="points">{points} pts</div>
              <a href={r.link} target="_blank" rel="noreferrer">
                <button className="neon-btn">Open Reel</button>
              </a>
            </div>
          );
        })}
      </div>

      {/* Buttons */}
      <button className="add-reel-btn" onClick={() => setModalOpen(true)}>
        + Add Reel
      </button>

      <button
        className="add-reel-btn"
        style={{ right: "120px", background: "#ff4444" }}
        onClick={() => window.history.back()}
      >
        ← Back
      </button>

      {/* Add Reel Modal */}
      {modalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h2>Add New Reel</h2>
            <input
              placeholder="Reel Title"
              value={newReel.title}
              onChange={(e) =>
                setNewReel({ ...newReel, title: e.target.value })
              }
            />
            <input
              placeholder="Instagram Reel Link"
              value={newReel.link}
              onChange={(e) =>
                setNewReel({ ...newReel, link: e.target.value })
              }
            />
            <button className="neon-btn" onClick={addNewReel}>
              Submit
            </button>
            <button className="modal-close" onClick={() => setModalOpen(false)}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* Edit Modal (Admin Only Logic can be added) */}
      {editModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h2>Edit Reel Analytics</h2>
            <label>Views</label>
            <input
              type="number"
              value={editModal.views}
              placeholder="Views"
              onChange={(e) =>
                setEditModal({ ...editModal, views: e.target.value })
              }
            />
            <label>Likes</label>
            <input
              type="number"
              value={editModal.likes}
              placeholder="Likes"
              onChange={(e) =>
                setEditModal({ ...editModal, likes: e.target.value })
              }
            />
            <button className="neon-btn" onClick={updateReel}>
              Update
            </button>
            <button className="modal-close" onClick={() => setEditModal(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
