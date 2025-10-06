import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import {
  collection,
  onSnapshot,
  updateDoc,
  doc,
  query,
  orderBy,
  arrayUnion,
  getDocs,
  getDoc,
  deleteDoc,
} from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import logo from "../assets/image.png";
import "../assets/Member.css";

const statuses = ["todo", "in-dev", "in-test", "completed"];
const statusLabels = {
  todo: "To Do",
  "in-dev": "In Development",
  "in-test": "In Test",
  completed: "Completed",
};

export default function Member() {
  const [tasks, setTasks] = useState([]);
  const [events, setEvents] = useState([]);
  const [userUid, setUserUid] = useState("");
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState(""); 
  const [usersMap, setUsersMap] = useState({});
  const [selectedTask, setSelectedTask] = useState(null);
  const [newAssignees, setNewAssignees] = useState([]);
  
  const [showSettings, setShowSettings] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const navigate = useNavigate();

  // Fetch all users
  useEffect(() => {
    const fetchUsers = async () => {
      const usersCollection = collection(db, "users");
      const snapshot = await getDocs(usersCollection);
      const map = {};
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.uid || doc.id) {
          map[doc.id] = { name: data.name || doc.id, role: data.role, admin: data.admin };
        }
      });
      if (userUid && !map[userUid]) {
        map[userUid] = { name: userName, role: "member", admin: userRole };
      }
      setUsersMap(map);
    };
    fetchUsers();
  }, [userUid, userName, userRole]);

  // Fetch tasks and user info
  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        navigate("/");
        return;
      }
      setUserUid(user.uid);

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        setUserName(data.name || user.uid);
        setUserRole(data.admin || "member"); 
      } else {
        setUserName(user.uid);
      }

      const taskQuery = query(collection(db, "tasks"), orderBy("createdAt", "desc"));
      const unsubscribeTasks = onSnapshot(taskQuery, (snapshot) => {
        const taskList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setTasks(taskList);
      });

      return () => unsubscribeTasks();
    });

    return () => unsubscribeAuth();
  }, [navigate]);

  // Initialize newAssignees when selectedTask changes
  useEffect(() => {
    if (selectedTask) {
      setNewAssignees(selectedTask.assignedTo || []);
    }
  }, [selectedTask]);

  // Move task to next/prev status
  const moveTask = async (task, direction) => {
    const currentIndex = statuses.indexOf(task.status);
    const newIndex = currentIndex + direction;
    if (newIndex < 0 || newIndex >= statuses.length) return;
    const taskRef = doc(db, "tasks", task.id);
    try {
      await updateDoc(taskRef, { status: statuses[newIndex] });
    } catch (err) {
      console.error("Failed to move task:", err);
    }
  };

  // Assign task to self
  const assignToSelf = async (task) => {
    if (!userUid) return;
    const taskRef = doc(db, "tasks", task.id);
    try {
      await updateDoc(taskRef, { assignedTo: arrayUnion(userUid) });
    } catch (err) {
      console.error("Failed to take task:", err);
    }
  };

  // Update task assignees
  const updateAssignee = async () => {
    if (!selectedTask) return;
    const taskRef = doc(db, "tasks", selectedTask.id);
    try {
      await updateDoc(taskRef, { assignedTo: newAssignees });
      setSelectedTask({ ...selectedTask, assignedTo: newAssignees });
    } catch (err) {
      console.error("Failed to update assignees:", err);
    }
  };

  // Delete task (admin only)
  const deleteTask = async () => {
    if (userRole !== "admin") {
      alert("Only admin users can delete tasks.");
      return;
    }
    if (!selectedTask) return;
    const confirmDelete = window.confirm(
      `Are you sure you want to permanently delete "${selectedTask.title}"?`
    );
    if (!confirmDelete) return;
    try {
      await deleteDoc(doc(db, "tasks", selectedTask.id));
      alert(`Task "${selectedTask.title}" deleted successfully.`);
      setSelectedTask(null);
    } catch (err) {
      console.error("Failed to delete task:", err);
      alert("Error deleting task. Please try again.");
    }
  };

  return (
    <div className="member-page">
      {/* Header */}
      <div className="page-header">
        <img src={logo} alt="Institute Logo" className="header-logo" />
        <div className="header-text">
          <h1>Sri Krishna Institute of Technology</h1>
          <h2>Digital Team Portal</h2>
        </div>
      </div>

      <div className="member-container">
        {/* Sidebar */}
        <motion.div className="sidebar" initial={{ x: -200 }} animate={{ x: 0 }} transition={{ duration: 0.5 }}>
          {/* Profile Section */}
          <motion.div className="sidebar-section profile" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="profile-header">
              <div>
                <h3 className="profile-name">{userName || "Member"}</h3>
                <p className="profile-role">{usersMap[userUid]?.role?.toUpperCase() || "MEMBER"}</p>
              </div>
            </div>

            <div className="profile-actions">
              <motion.button className="profile-btn settings" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowSettings(true)}>
                ⚙️ Settings
              </motion.button>

              <motion.button className="profile-btn logout" whileHover={{ scale: 1.05, backgroundColor: "#ff4d4d" }} whileTap={{ scale: 0.95 }} onClick={async () => {
                const confirmLogout = window.confirm("Are you sure you want to logout?");
                if (confirmLogout) {
                  await auth.signOut();
                  navigate("/");
                }
              }}>
                🚪 Logout
              </motion.button>
            </div>
          </motion.div>

          {/* Available Tasks */}
          <div className="sidebar-section tasks">
            <h3>Available Tasks</h3>
            <ul>
              {tasks.filter((task) => !task.assignedTo?.includes(userUid)).map((task) => (
                <li key={task.id}>
                  {task.title}
                  <button onClick={() => assignToSelf(task)}>Take Task</button>
                </li>
              ))}
            </ul>
          </div>

          {/* Upcoming Due Dates */}
          <div className="sidebar-section due-dates">
            <h3>Upcoming Due Dates</h3>
            <ul>
              {tasks.filter((task) => task.dueDate).sort((a, b) => a.dueDate?.toDate() - b.dueDate?.toDate()).slice(0, 5).map((task) => (
                <li key={task.id}>
                  {task.title} - {task.dueDate.toDate().toLocaleDateString()}
                  {task.assignedTo?.includes(userUid) && <span style={{ color: "#4caf50", marginLeft: "5px" }}>(Taken)</span>}
                </li>
              ))}
            </ul>
          </div>

          {/* Upcoming Events */}
          <div className="sidebar-section events">
            <h3>Upcoming Events</h3>
            {tasks.some((task) => task.eventDate) ? (
              <ul>
                {tasks.filter((task) => task.eventDate).sort((a, b) => a.eventDate?.toDate() - b.eventDate?.toDate()).map((task) => (
                  <li key={task.id}>
                    {task.title || task.eventName || "Untitled"} – {task.eventDate.toDate().toLocaleDateString()}
                  </li>
                ))}
              </ul>
            ) : (<p>No events found.</p>)}
          </div>

          {/* Completed Tasks */}
          <div className="sidebar-section completed-tasks">
            <h3>Completed Tasks</h3>
            <ul>
              {tasks.filter((task) => task.status === "completed").map((task) => (
                <li key={task.id}>
                  {task.title} - Assigned to: {task.assignedTo?.map((uid) => usersMap[uid]?.name || "Unknown").join(", ")}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>

        {/* Scrum Board */}
        <div className="board">
          {statuses.map((status) => (
            <div key={status} className="column">
              <h4>{statusLabels[status]}</h4>
              {tasks.filter((task) => task.status === status).map((task) => (
                <motion.div key={task.id} className={`task-card ${task.assignedTo?.includes(userUid) ? "my-task" : ""}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} whileHover={{ scale: 1.03 }} onClick={() => setSelectedTask(task)}>
                  <h5>{task.title}</h5>
                  <p>{task.description}</p>
                  <p>Assigned To: {task.assignedTo?.map((uid) => usersMap[uid]?.name || "Unknown").join(", ")}</p>

                  {/* Move buttons */}
                  <div className="task-actions">
                    <button disabled={task.status === "todo"} onClick={(e) => { e.stopPropagation(); moveTask(task, -1); }}>←</button>
                    <button disabled={task.status === "completed"} onClick={(e) => { e.stopPropagation(); moveTask(task, 1); }}>→</button>
                  </div>
                </motion.div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div className="modal-backdrop" onClick={() => setShowSettings(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="modal-content" onClick={(e) => e.stopPropagation()} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}>
              <h3>Settings</h3>

              <div style={{ marginBottom: "10px" }}>
                <label>
                  Name:
                  <input type="text" placeholder={userName} value={newName} onChange={(e) => setNewName(e.target.value)} style={{ width: "100%", padding: "6px", marginTop: "4px" }} />
                </label>
              </div>

              <div style={{ marginBottom: "10px" }}>
                <label>
                  New Password:
                  <input type="password" placeholder="Enter new password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={{ width: "100%", padding: "6px", marginTop: "4px" }} />
                </label>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <button style={{ padding: "8px 12px" }} onClick={async () => {
                  if (newName) {
                    const userRef = doc(db, "users", userUid);
                    await updateDoc(userRef, { name: newName });
                    setUserName(newName);
                  }
                  if (newPassword) {
                    try {
                      await auth.currentUser.updatePassword(newPassword);
                      alert("Password updated successfully.");
                    } catch (err) {
                      console.error(err);
                      alert("Error updating password: " + err.message);
                    }
                  }
                  setShowSettings(false);
                  setNewName("");
                  setNewPassword("");
                }}>Save</button>

                <button style={{ padding: "8px 12px" }} onClick={() => setShowSettings(false)}>Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Task Detail Modal */}
      <AnimatePresence>
        {selectedTask && (
          <motion.div className="modal-backdrop" onClick={() => setSelectedTask(null)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="modal-content" onClick={(e) => e.stopPropagation()} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}>
              <h3>{selectedTask.title}</h3>
              <p><strong>Description:</strong> {selectedTask.description}</p>
              {selectedTask.dueDate && <p><strong>Due Date:</strong> {selectedTask.dueDate.toDate().toLocaleDateString()}</p>}
              {selectedTask.eventName && <p><strong>Event Name:</strong> {selectedTask.eventName}</p>}
              {selectedTask.facultyName && <p><strong>Faculty:</strong> {selectedTask.facultyName}</p>}
              {selectedTask.facultyContact && <p><strong>Contact:</strong> {selectedTask.facultyContact}</p>}

              <div style={{ marginTop: "10px" }}>
                <strong>Change Assignees:</strong>
                <div style={{ marginTop: "5px", maxHeight: "150px", overflowY: "auto" }}>
                  {Object.entries(usersMap).filter(([uid, userData]) => userData.role === "member").map(([uid, userData]) => (
                    <label key={uid} style={{ display: "block", marginBottom: "5px" }}>
                      <input type="checkbox" value={uid} checked={newAssignees.includes(uid)} onChange={(e) => {
                        if (e.target.checked) setNewAssignees([...newAssignees, uid]);
                        else setNewAssignees(newAssignees.filter((a) => a !== uid));
                      }} />
                      {userData.name || uid}
                    </label>
                  ))}
                </div>
                <button style={{ marginTop: "10px" }} onClick={updateAssignee}>Update</button>
              </div>

              {userRole === "admin" && (
                <button style={{ marginTop: "10px", backgroundColor: "red", color: "white", border: "none", padding: "8px 12px", borderRadius: "6px", cursor: "pointer" }} onClick={deleteTask}>
                  Remove Task
                </button>
              )}

              <button style={{ marginTop: "10px" }} onClick={() => setSelectedTask(null)}>Close</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
