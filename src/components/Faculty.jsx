import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { collection, addDoc, onSnapshot, query, orderBy, getDocs } from "firebase/firestore";
import "../assets/Faculty.css";
import { useNavigate } from "react-router-dom";
import logo from "../assets/image.png";

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

  const navigate = useNavigate();

  const requirementOptions = [
    "Poster Creation / Advertising",
    "Photography / Videography",
    "Others"
  ];

  // Fetch all users to map emails -> names
  useEffect(() => {
    const fetchUsers = async () => {
      const snapshot = await getDocs(collection(db, "users"));
      const map = {};
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.email) {
          map[data.email] = data.name || data.email;
        }
      });
      setUsersMap(map);
    };
    fetchUsers();
  }, []);

  // Fetch all tasks
  useEffect(() => {
    const tasksQuery = query(collection(db, "tasks"), orderBy("createdAt", "desc"));
    const unsubscribeTasks = onSnapshot(tasksQuery, snapshot => {
      const taskList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTasks(taskList);
    });

    return () => unsubscribeTasks();
  }, []);

  // Toggle requirement selection
  const handleRequirementChange = (value) => {
    setRequirements(prev =>
      prev.includes(value) ? prev.filter(r => r !== value) : [...prev, value]
    );
  };

  // Create a new task
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
        assignedTo: [], // initially unassigned
        status: "todo",
        createdAt: new Date(),
        facultyName,
        facultyContact
      });

      // Reset form
      setTitle("");
      setDescription("");
      setEventName("");
      setEventDate("");
      setDeadline("");
      setRequirements([]);
      setFacultyName("");
      setFacultyContact("");
    } catch (err) {
      console.error("Error creating task:", err);
    }
  };

  // Logout function
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
        <h3>Create Task</h3>
        <input
          placeholder="Faculty Name"
          value={facultyName}
          onChange={e => setFacultyName(e.target.value)}
        />
        <input
          type="number"
          placeholder="Faculty Contact"
          value={facultyContact}
          onChange={e => setFacultyContact(e.target.value)}
        />
        <input
          placeholder="Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />
        <input
          placeholder="Event Name"
          value={eventName}
          onChange={e => setEventName(e.target.value)}
        />
        <input
          type="date"
          placeholder="Event Date"
          value={eventDate}
          onChange={e => setEventDate(e.target.value)}
        />
        <input
          type="date"
          placeholder="Deadline"
          value={deadline}
          onChange={e => setDeadline(e.target.value)}
        />

        {/* Requirements as Tiles */}
        <div className="requirements">
          {requirementOptions.map(req => (
            <div
              key={req}
              className={`req-tile ${requirements.includes(req) ? "selected" : ""}`}
              onClick={() => handleRequirementChange(req)}
            >
              {req}
            </div>
          ))}
        </div>

        <button onClick={createTask}>Create Task</button>
      </div>

      {/* Task List */}
      <div className="task-list">
        <h3>Tasks Uploaded</h3>
        {tasks.map(task => (
          <div key={task.id} className="task-card">
            <h4>{task.title}</h4>
            <p>{task.description}</p>
            <p><strong>Event:</strong> {task.eventName}</p>
            <p><strong>Requirements:</strong> {task.requirements?.join(", ")}</p>
            <p>
              <strong>Assigned:</strong>{" "}
              {task.assignedTo?.length
                ? task.assignedTo.map(email => usersMap[email] || email).join(", ")
                : "Unassigned"}
            </p>
            <p><strong>Faculty:</strong> {task.facultyName} ({task.facultyContact})</p>
            <p><strong>Event Date:</strong> {task.eventDate?.toDate().toLocaleDateString()}</p>
            <p><strong>Deadline:</strong> {task.dueDate?.toDate().toLocaleDateString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
