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
  getDoc
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
  completed: "Completed"
};

export default function Member() {
  const [tasks, setTasks] = useState([]);
  const [events, setEvents] = useState([]);
  const [userUid, setUserUid] = useState("");
  const [userName, setUserName] = useState("");
  const [usersMap, setUsersMap] = useState({});
  const [selectedTask, setSelectedTask] = useState(null);
  const [newAssignees, setNewAssignees] = useState([]);
  const navigate = useNavigate();

  // Fetch all users with role "member"
  useEffect(() => {
    const fetchUsers = async () => {
      const usersCollection = collection(db, "users");
      const snapshot = await getDocs(usersCollection);
      const map = {};
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.uid || doc.id) {
          map[doc.id] = { name: data.name || doc.id, role: data.role };
        }
      });
      // Ensure current user is in map
      if (userUid && !map[userUid]) {
        map[userUid] = { name: userName, role: "member" };
      }
      setUsersMap(map);
    };
    fetchUsers();
  }, [userUid, userName]);

  // Fetch tasks, events, and current user info
  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        navigate("/");
        return;
      }
      setUserUid(user.uid);

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      setUserName(userSnap.exists() ? userSnap.data().name || user.uid : user.uid);

      const taskQuery = query(collection(db, "tasks"), orderBy("createdAt", "desc"));
      const unsubscribeTasks = onSnapshot(taskQuery, (snapshot) => {
        const taskList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setTasks(taskList);
      });

      const eventsQuery = query(collection(db, "events"), orderBy("eventDate"));
      const unsubscribeEvents = onSnapshot(eventsQuery, (snapshot) => {
        const eventList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setEvents(eventList);
      });

      return () => {
        unsubscribeTasks();
        unsubscribeEvents();
      };
    });

    return () => unsubscribeAuth();
  }, [navigate]);

  // Initialize newAssignees when selectedTask changes
  useEffect(() => {
    if (selectedTask) {
      setNewAssignees(selectedTask.assignedTo || []);
    }
  }, [selectedTask]);

  // Move task left/right
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

  // Assign task to self using UID
  const assignToSelf = async (task) => {
    if (!userUid) return;
    const taskRef = doc(db, "tasks", task.id);
    try {
      await updateDoc(taskRef, { assignedTo: arrayUnion(userUid) });
    } catch (err) {
      console.error("Failed to take task:", err);
    }
  };

  // Update assignees in modal using UID array
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

  return (
    <div className="member-page">
      {/* Page Header */}
      <div className="page-header">
        <img src={logo} alt="Institute Logo" className="header-logo" />
        <div className="header-text">
          <h1>Sri Krishna Institute of Technology</h1>
          <h2>Digital Team Portal</h2>
        </div>
      </div>

      <div className="member-container">
        {/* Sidebar */}
        <motion.div
          className="sidebar"
          initial={{ x: -200 }}
          animate={{ x: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Profile */}
          <div className="sidebar-section profile">
            <h3>Profile</h3>
            <p>{userName}</p>
            <button>Settings</button>
            <button
              onClick={async () => {
                await auth.signOut();
                navigate("/");
              }}
            >
              Logout
            </button>
          </div>

          {/* Available Tasks */}
          <div className="sidebar-section tasks">
            <h3>Available Tasks</h3>
            <ul>
              {tasks
                .filter((task) => !task.assignedTo?.includes(userUid))
                .map((task) => (
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
              {tasks
                .filter((task) => task.assignedTo?.includes(userUid) && task.dueDate)
                .sort((a, b) => a.dueDate?.toDate() - b.dueDate?.toDate())
                .slice(0, 5)
                .map((task) => (
                  <li key={task.id}>
                    {task.title} - {task.dueDate.toDate().toLocaleDateString()}
                  </li>
                ))}
            </ul>
          </div>

          {/* Upcoming Events */}
          <div className="sidebar-section events">
            <h3>Upcoming Events</h3>
            <ul>
              {events
                .sort((a, b) => a.eventDate?.toDate() - b.eventDate?.toDate())
                .slice(0, 5)
                .map((event) => (
                  <li key={event.id}>
                    {event.title} - {event.eventDate.toDate().toLocaleDateString()}
                  </li>
                ))}
            </ul>
          </div>

          {/* Completed Tasks */}
          <div className="sidebar-section completed-tasks">
            <h3>Completed Tasks</h3>
            <ul>
              {tasks
                .filter((task) => task.status === "completed")
                .map((task) => (
                  <li key={task.id}>
                    {task.title} - Assigned to:{" "}
                    {task.assignedTo
                      ?.map((uid) => usersMap[uid]?.name || "Unknown")
                      .join(", ")}
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
              {tasks
                .filter((task) => task.status === status)
                .map((task) => (
                  <motion.div
                    key={task.id}
                    className={`task-card ${task.assignedTo?.includes(userUid) ? "my-task" : ""}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.03 }}
                    onClick={() => setSelectedTask(task)}
                  >
                    <h5>{task.title}</h5>
                    <p>{task.description}</p>
                    <p>
                      Assigned To:{" "}
                      {task.assignedTo
                        ?.map((uid) => usersMap[uid]?.name || "Unknown")
                        .join(", ")}
                    </p>
                    <div className="task-actions">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          moveTask(task, -1);
                        }}
                      >
                        &larr;
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          moveTask(task, 1);
                        }}
                      >
                        &rarr;
                      </button>
                    </div>
                  </motion.div>
                ))}
            </div>
          ))}
        </div>
      </div>

      {/* Task Detail Modal */}
      <AnimatePresence>
        {selectedTask && (
          <motion.div
            className="modal-backdrop"
            onClick={() => setSelectedTask(null)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="modal-content"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.8, opacity: 0, y: -50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: -50 }}
              transition={{ duration: 0.3 }}
            >
              <h3>{selectedTask.title}</h3>
              <p><strong>Description:</strong> {selectedTask.description}</p>
              <p><strong>Status:</strong> {statusLabels[selectedTask.status]}</p>
              {selectedTask.facultyName && <p><strong>Faculty:</strong> {selectedTask.facultyName}</p>}
              {selectedTask.facultyContact && <p><strong>Contact:</strong> {selectedTask.facultyContact}</p>}
              {selectedTask.eventName && <p><strong>Event Name:</strong> {selectedTask.eventName}</p>}
              {selectedTask.dueDate && <p><strong>Due Date:</strong> {selectedTask.dueDate.toDate().toLocaleDateString()}</p>}

              {/* Change Assignees */}
              <div style={{ marginTop: "10px" }}>
                <strong>Change Assignees:</strong>
                <div style={{ marginTop: "5px", maxHeight: "150px", overflowY: "auto" }}>
                  {Object.entries(usersMap)
                    .filter(([uid, userData]) => userData.role === "member")
                    .map(([uid, userData]) => (
                      <label key={uid} style={{ display: "block", marginBottom: "5px" }}>
                        <input
                          type="checkbox"
                          value={uid}
                          checked={newAssignees.includes(uid)}
                          onChange={(e) => {
                            if (e.target.checked) setNewAssignees([...newAssignees, uid]);
                            else setNewAssignees(newAssignees.filter((a) => a !== uid));
                          }}
                        />
                        {userData.name || uid}
                      </label>
                    ))}
                </div>
                <button style={{ marginTop: "10px" }} onClick={updateAssignee}>Update</button>
              </div>

              <button style={{ marginTop: "10px" }} onClick={() => setSelectedTask(null)}>Close</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
