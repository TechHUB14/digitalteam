import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";
import "../assets/Faculty.css";
import { useNavigate } from "react-router-dom";
import logo from "../assets/image.png";

// 🔹 Common Google Drive Upload Link
const DRIVE_UPLOAD_LINK =
  "https://drive.google.com/drive/folders/1cmZulwAnPy4vHY4fBBzYYJPa-ZqjGvFS?usp=sharing"; // <-- replace with actual folder link

export default function Faculty() {
  const [tasks, setTasks] = useState([]);
  const [usersMap, setUsersMap] = useState({});
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [deadline, setDeadline] = useState("");
  const [requirements, setRequirements] = useState([]);
  const [facultyName, setFacultyName] = useState("");
  const [facultyContact, setFacultyContact] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [editTaskId, setEditTaskId] = useState(null);
  const [showPreview, setShowPreview] = useState(false);


  const navigate = useNavigate();

  const requirementOptions = [
    "Poster Creation / Advertising",
    "Photography / Videography",
    "Others",
  ];

  // Fetch all users
  useEffect(() => {
    const fetchUsers = async () => {
      const snapshot = await getDocs(collection(db, "users"));
      const map = {};
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (doc.id) {
          map[doc.id] = data.name || doc.id;
        }
      });
      setUsersMap(map);
    };
    fetchUsers();
  }, []);

  // Fetch all tasks
  useEffect(() => {
    const tasksQuery = query(collection(db, "tasks"), orderBy("createdAt", "desc"));
    const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
      const taskList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setTasks(taskList);
    });
    return () => unsubscribeTasks();
  }, []);

  // Toggle requirement selection
  const handleRequirementChange = (value) => {
    setRequirements((prev) =>
      prev.includes(value) ? prev.filter((r) => r !== value) : [...prev, value]
    );
  };

  // Create task
  const createTask = async () => {
    if (!title || !eventName || !eventDate || !deadline || !facultyName || !facultyContact) {
      return alert("Please fill all required fields.");
    }

    try {
      await addDoc(collection(db, "tasks"), {
        title,
        description,
        eventName,
        eventDate: new Date(eventDate),
        dueDate: new Date(deadline),
        requirements,
        assignedTo: [],
        status: "todo",
        createdAt: new Date(),
        facultyName,
        facultyContact,
      });
      resetForm();
    } catch (err) {
      console.error("Error creating task:", err);
    }
  };

  // Start editing
  const startEditTask = (task) => {
    setEditMode(true);
    setEditTaskId(task.id);
    setTitle(task.title);
    setDescription(task.description || "");
    setEventName(task.eventName);
    setEventDate(task.eventDate?.toDate().toISOString().substring(0, 10));
    setDeadline(task.dueDate?.toDate().toISOString().substring(0, 10));
    setRequirements(task.requirements || []);
    setFacultyName(task.facultyName || "");
    setFacultyContact(task.facultyContact || "");
  };

  // Update task
  const updateTask = async () => {
    if (!editTaskId) return;
    try {
      const taskRef = doc(db, "tasks", editTaskId);
      await updateDoc(taskRef, {
        title,
        description,
        eventName,
        eventDate: new Date(eventDate),
        dueDate: new Date(deadline),
        requirements,
        facultyName,
        facultyContact,
      });
      alert("Task updated successfully!");
      resetForm();
    } catch (err) {
      console.error("Error updating task:", err);
    }
  };

  // Reset form
  const resetForm = () => {
    setTitle("");
    setDescription("");
    setEventName("");
    setEventDate("");
    setDeadline("");
    setRequirements([]);
    setFacultyName("");
    setFacultyContact("");
    setEditMode(false);
    setEditTaskId(null);
  };

  // Logout
  const handleLogout = async () => {
    await auth.signOut();
    navigate("/");
  };

  return (
    <div className="faculty-container">
      {/* Header */}
      <div className="faculty-header">
        <img src={logo} alt="Institute Logo" className="header-logo" />
        <div>
          <h1>Sri Krishna Institute of Technology</h1>
          <h2>Digital Team Portal</h2>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>



      {/* Task Creation Form */}
      <div className="task-form">
        <h3 className="ups">{editMode ? "Edit Task" : "Create Task"}</h3>
        <input
          placeholder="Faculty Name"
          value={facultyName}
          onChange={(e) => setFacultyName(e.target.value)}
        />
        <input
          type="tel"
          placeholder="Faculty Contact (10 digits)"
          value={facultyContact}
          onChange={(e) => {
            const onlyNumbers = e.target.value.replace(/\D/g, ""); // remove non-digits
            setFacultyContact(onlyNumbers);
          }}
          maxLength={10}
        />

        <input
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <input
          placeholder="Event Name"
          value={eventName}
          onChange={(e) => setEventName(e.target.value)}
        />

        <input
          type={eventDate ? "date" : "text"}
          placeholder="Event Date"
          onFocus={(e) => (e.target.type = "date")}
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
        />

        <input
          type={deadline ? "date" : "text"}
          placeholder="Deadline Date"
          onFocus={(e) => (e.target.type = "date")}
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
        />


        {/* Requirements */}
        <div className="requirements">
          {requirementOptions.map((req) => (
            <div
              key={req}
              className={`req-tile ${requirements.includes(req) ? "selected" : ""}`}
              onClick={() => handleRequirementChange(req)}
            >
              {req}
            </div>
          ))}
        </div>

        <div className="form-buttons">
          <button onClick={() => setShowPreview(true)}>
            Preview Task
          </button>

        </div>
      </div>
      {/* 🔹 Common Upload Section */}
      <div className="upload-section">
        <h3>📸 Upload Required Images</h3>
        <p>Click below to upload photos or videos to the shared Google Drive folder, For Access Contact Maruthish</p>
        <button
          className="upload-btn"
          onClick={() => window.open(DRIVE_UPLOAD_LINK, "_blank")}
        >
          Go to Shared Drive
        </button>
      </div>

      {/* Task List */}
      <div className="task-list1">
        <h3 className="ups">Tasks Uploaded</h3>
        {tasks.map((task) => (
          <div key={task.id} className="task-card1">
            <h4>{task.title}</h4>
            <p>{task.description}</p>
            <p><strong>Event:</strong> {task.eventName}</p>
            <p><strong>Requirements:</strong> {task.requirements?.join(", ")}</p>
            <p>
              <strong>Assigned:</strong>{" "}
              {task.assignedTo?.length
                ? task.assignedTo.map((uid) => usersMap[uid] || uid).join(", ")
                : "Unassigned"}
            </p>
            <p>
              <strong>Faculty:</strong> {task.facultyName} ({task.facultyContact})
            </p>
            <p><strong>Event Date:</strong> {task.eventDate?.toDate().toLocaleDateString()}</p>
            <p><strong>Deadline:</strong> {task.dueDate?.toDate().toLocaleDateString()}</p>

            <button className="edit-btn" onClick={() => startEditTask(task)}>
              Edit
            </button>
          </div>
        ))}
      </div>
      {showPreview && (
        <div className="preview-overlay">
          <div className="preview-box">

            <h2>Task Preview</h2>

            <p><strong>Faculty Name:</strong> {facultyName || "Not Provided"}</p>
            <p><strong>Task Title:</strong> {title || "Not Provided"}</p>
            <p><strong>Event Name:</strong> {eventName || "Not Provided"}</p>
            <p><strong>Event Date:</strong> {eventDate || "Not Selected"}</p>
            <p><strong>Deadline:</strong> {deadline || "Not Selected"}</p>
            <p><strong>Description:</strong> {description || "Not Provided"}</p>
            <p><strong>Requirements:</strong>
              {requirements.length > 0 ? requirements.join(", ") : "None"}
            </p>
            <p><strong>Contact:</strong> {facultyContact || "Not Provided"}</p>


            <div className="preview-actions">
              <button onClick={() => setShowPreview(false)} className="edit-btn">Edit</button>

              <button
                className="confirm-btn"
                onClick={() => {
                  createTask();     // ← your existing function
                  setShowPreview(false);
                }}
              >
                Confirm & Create
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
