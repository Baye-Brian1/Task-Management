import { useState, useEffect } from "react";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  CheckSquare,
  LogOut,
  Bell,
  Plus,
  X,
  Clock,
  Calendar,
  AlignLeft,
  Trash2,
  Edit2,
  CheckCircle,
  Circle,
  AlignCenter,
  AlignRight,
  ArrowRight,
} from "lucide-react";
import "./Dashboard.css";

export default function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [tasks, setTasks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [editingTask, setEditingTask] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    deadline: "",
    time: "",
  });
  const [taskFilter, setTaskFilter] = useState("all");
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUser(user);
        loadTasks(user.uid);
        const interval = setInterval(() => checkDeadlines(), 1000);
        return () => clearInterval(interval);
      } else {
        navigate("/");
      }
    });
    return () => unsubscribe();
  }, []);

  const loadTasks = (userId) => {
    const savedTasks = localStorage.getItem(`tasks_${userId}`);
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    }
  };

  const saveTasks = (newTasks) => {
    localStorage.setItem(`tasks_${user?.uid}`, JSON.stringify(newTasks));
    setTasks(newTasks);
  };

  const addNotification = (message, taskId) => {
    const newNotification = {
      id: Date.now(),
      message,
      taskId,
      read: false,
      timestamp: new Date().toISOString(),
    };
    setNotifications((prev) => [newNotification, ...prev]);

    setTimeout(() => {
      setNotifications((prev) =>
        prev.filter((n) => n.id !== newNotification.id),
      );
    }, 5000);
  };

  const checkDeadlines = () => {
    const now = new Date();
    tasks.forEach((task) => {
      if (task.deadline && task.time && !task.completed && !task.notified) {
        const deadlineDateTime = new Date(`${task.deadline}T${task.time}`);
        const diff = deadlineDateTime - now;

        if (diff <= 0 && diff > -60000) {
          addNotification(
            `Task "${task.title}" has reached its deadline!`,
            task.id,
          );

          const updatedTasks = tasks.map((t) =>
            t.id === task.id ? { ...t, notified: true } : t,
          );
          saveTasks(updatedTasks);

          if (Notification.permission === "granted") {
            new Notification("Task Deadline Reached!", {
              body: `Your task "${task.title}" is due now!`,
            });
          }
        } else if (diff > 0 && diff <= 3600000 && !task.reminded) {
          addNotification(`Task "${task.title}" is due in 1 hour!`, task.id);
          const updatedTasks = tasks.map((t) =>
            t.id === task.id ? { ...t, reminded: true } : t,
          );
          saveTasks(updatedTasks);
        }
      }
    });
  };

  useEffect(() => {
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const addTask = () => {
    if (!formData.title.trim()) return;

    const newTask = {
      id: Date.now(),
      ...formData,
      completed: false,
      createdAt: new Date().toISOString(),
      notified: false,
      reminded: false,
    };
    saveTasks([...tasks, newTask]);
    setFormData({ title: "", description: "", deadline: "", time: "" });
    setShowModal(false);
  };

  const updateTask = () => {
    const updatedTasks = tasks.map((task) =>
      task.id === editingTask.id
        ? { ...task, ...formData, notified: false, reminded: false }
        : task,
    );
    saveTasks(updatedTasks);
    setEditingTask(null);
    setFormData({ title: "", description: "", deadline: "", time: "" });
    setShowModal(false);
  };

  const deleteTask = (id) => {
    saveTasks(tasks.filter((task) => task.id !== id));
  };

  const toggleComplete = (id) => {
    const updatedTasks = tasks.map((task) =>
      task.id === id ? { ...task, completed: !task.completed } : task,
    );
    saveTasks(updatedTasks);

    const task = tasks.find((t) => t.id === id);
    if (!task.completed) {
      addNotification(`Task "${task.title}" marked as complete!`, id);
    }
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || "",
      deadline: task.deadline || "",
      time: task.time || "",
    });
    setShowModal(true);
  };

  const calculateTimeLeft = (deadline, time) => {
    if (!deadline || !time) return null;
    const targetDate = new Date(`${deadline}T${time}`);
    const now = new Date();
    const difference = targetDate - now;

    if (difference <= 0) return { expired: true };

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((difference / 1000 / 60) % 60);
    const seconds = Math.floor((difference / 1000) % 60);

    return { days, hours, minutes, seconds, expired: false };
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  const markNotificationRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  };

  const completedTasks = tasks.filter((t) => t.completed);
  const uncompletedTasks = tasks.filter((t) => !t.completed);
  const completionRate =
    tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0;

  const filteredTasks =
    taskFilter === "all"
      ? tasks
      : taskFilter === "completed"
        ? completedTasks
        : uncompletedTasks;

  const unreadNotifications = notifications.filter((n) => !n.read).length;

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-icon">✓</span>
            <span>Taski</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button
            className={activeTab === "dashboard" ? "active" : ""}
            onClick={() => setActiveTab("dashboard")}
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </button>
          <button
            className={activeTab === "tasks" ? "active" : ""}
            onClick={() => setActiveTab("tasks")}
          >
            <CheckSquare size={20} />
            <span>Tasks</span>
          </button>
        </nav>
        {/* User Profile Section */}
        <div className="user-profile">
          <div className="user-avatar-large">
            {user?.photoURL ? (
              <img src={user.photoURL} alt={user.displayName} />
            ) : (
              <span>
                {user?.displayName?.charAt(0)?.toUpperCase() ||
                  user?.email?.charAt(0)?.toUpperCase() ||
                  "U"}
              </span>
            )}
          </div>
          <div className="user-info">
            <h4>{user?.displayName || "User"}</h4>
            <p>{user?.email}</p>
          </div>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
         
          <span>Logout</span>
           <LogOut size={20} />
        </button>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="top-bar">
          <div className="top-bar-left">
            <h2>{activeTab === "dashboard" ? "Dashboard" : "Tasks"}</h2>
          </div>
          <div className="top-bar-right">
            <div className="notification-wrapper">
              <button
                className="icon-btn"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell size={20} />
                {unreadNotifications > 0 && (
                  <span className="notification-badge">
                    {unreadNotifications}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div className="notifications-dropdown">
                  <div className="notifications-header">
                    <h4>Notifications</h4>
                    <button onClick={() => setShowNotifications(false)}>
                      <X size={16} />
                    </button>
                  </div>
                  <div className="notifications-list">
                    {notifications.length === 0 ? (
                      <p className="no-notifications">No notifications</p>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`notification-item ${!notif.read ? "unread" : ""}`}
                          onClick={() => markNotificationRead(notif.id)}
                        >
                          <p>{notif.message}</p>
                          <small>
                            {new Date(notif.timestamp).toLocaleTimeString()}
                          </small>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {activeTab === "dashboard" && (
          <>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="text">
                  <h4>Total Tasks</h4>
                  <p>{tasks.length}</p>
                </div>
                <div>
                  <AlignLeft size={18} />
                </div>
              </div>
              <div className="stat-card">
                <div className="text">
                  <h4>Completed</h4>
                  <p>{completedTasks.length}</p>
                </div>

                <div>
                  <AlignCenter size={18} />
                </div>
              </div>
              <div className="stat-card">
                <div className="text">
                  <h4>Pending</h4>
                  <p>{uncompletedTasks.length}</p>
                </div>

                <div>
                  <AlignRight size={18} />
                </div>
              </div>
            </div>

            <div className="progress-section">
              <div className="progress-header">
                <h3>Task Completion</h3>
                <span>{Math.round(completionRate)}%</span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${completionRate}%` }}
                ></div>
              </div>
            </div>

            <div className="recent-tasks">
                <div className="view">
                    <h3>Recent Tasks</h3>
                    <h3 onClick={() => setActiveTab("tasks")}>View all <ArrowRight size={17}/></h3>

                </div>
              
              <div className="task-list">
                {tasks.slice(0, 5).map((task) => {
                  const timeLeft = calculateTimeLeft(task.deadline, task.time);
                  return (
                    <div key={task.id} className="task-item">
                      <button
                        className="checkbox-btn"
                        onClick={() => toggleComplete(task.id)}
                      >
                        {task.completed ? (
                          <CheckCircle size={20} fill="black" color="white" />
                        ) : (
                          <Circle size={20} />
                        )}
                      </button>
                      <div className="task-info">
                        <span className={task.completed ? "completed" : ""}>
                          {task.title}
                        </span>
                        {task.description && <small>{task.description}</small>}
                      </div>
                      {timeLeft && !timeLeft.expired && !task.completed && (
                        <div className="countdown-timer">
                          <Clock size={14} />
                          <span>
                            {timeLeft.days > 0 && `${timeLeft.days}d `}
                            {timeLeft.hours > 0 && `${timeLeft.hours}h `}
                            {timeLeft.minutes > 0 && `${timeLeft.minutes}m `}
                            {timeLeft.seconds}s
                          </span>
                        </div>
                      )}
                      {timeLeft?.expired && !task.completed && (
                        <div className="countdown-timer expired">Overdue</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {activeTab === "tasks" && (
          <>
            <div className="tasks-header">
              <div className="task-tabs">
                <button
                  className={taskFilter === "all" ? "active" : ""}
                  onClick={() => setTaskFilter("all")}
                >
                  All ({tasks.length})
                </button>
                <button
                  className={taskFilter === "pending" ? "active" : ""}
                  onClick={() => setTaskFilter("pending")}
                >
                  Pending ({uncompletedTasks.length})
                </button>
                <button
                  className={taskFilter === "completed" ? "active" : ""}
                  onClick={() => setTaskFilter("completed")}
                >
                  Completed ({completedTasks.length})
                </button>
              </div>
              <button
                className="add-task-btn"
                onClick={() => {
                  setEditingTask(null);
                  setFormData({
                    title: "",
                    description: "",
                    deadline: "",
                    time: "",
                  });
                  setShowModal(true);
                }}
              >
                <Plus size={18} />
                Add Task
              </button>
            </div>

            <div className="tasks-table-container">
              <table className="tasks-table">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Task</th>
                    <th>Description</th>
                    <th>Deadline</th>
                    <th>Countdown</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map((task) => {
                    const timeLeft = calculateTimeLeft(
                      task.deadline,
                      task.time,
                    );
                    return (
                      <tr
                        key={task.id}
                        className={task.completed ? "completed-row" : ""}
                      >
                        <td>
                          <button
                            className="checkbox-btn"
                            onClick={() => toggleComplete(task.id)}
                          >
                            {task.completed ? (
                              <CheckCircle
                                size={20}
                                fill="black"
                                color="white"
                              />
                            ) : (
                              <Circle size={20} />
                            )}
                          </button>
                        </td>
                        <td className="task-title">{task.title}</td>
                        <td className="task-description">
                          {task.description || "-"}
                        </td>
                        <td>
                          {task.deadline && task.time ? (
                            <div className="deadline-info">
                              <Calendar size={14} />
                              <span>
                                {new Date(task.deadline).toLocaleDateString()}{" "}
                                at {task.time}
                              </span>
                            </div>
                          ) : (
                            "No deadline"
                          )}
                        </td>
                        <td>
                          {timeLeft && !timeLeft.expired && !task.completed ? (
                            <div className="countdown-timer">
                              <Clock size={14} />
                              <span>
                                {timeLeft.days > 0 && `${timeLeft.days}d `}
                                {timeLeft.hours > 0 && `${timeLeft.hours}h `}
                                {timeLeft.minutes > 0 &&
                                  `${timeLeft.minutes}m `}
                                {timeLeft.seconds}s
                              </span>
                            </div>
                          ) : timeLeft?.expired && !task.completed ? (
                            <span className="expired-badge">Expired</span>
                          ) : task.completed ? (
                            <span className="completed-badge">Completed</span>
                          ) : null}
                        </td>
                        <td className="actions-cell">
                          <button
                            className="edit-btn"
                            onClick={() => openEditModal(task)}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            className="delete-btn"
                            onClick={() => deleteTask(task.id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>

      {/* Add/Edit Task Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingTask ? "Edit Task" : "Create New Task"}</h3>
              <button
                className="close-modal"
                onClick={() => setShowModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Task Title *</label>
                <div className="input-with-icon">
                  <AlignLeft size={18} />
                  <input
                    type="text"
                    placeholder="Enter task title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  placeholder="Enter task description (optional)"
                  rows="3"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Date</label>
                  <div className="input-with-icon">
                    <Calendar size={18} />
                    <input
                      type="date"
                      value={formData.deadline}
                      onChange={(e) =>
                        setFormData({ ...formData, deadline: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Time</label>
                  <div className="input-with-icon">
                    <Clock size={18} />
                    <input
                      type="time"
                      value={formData.time}
                      onChange={(e) =>
                        setFormData({ ...formData, time: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="cancel-btn"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                className="submit-btn"
                onClick={editingTask ? updateTask : addTask}
              >
                {editingTask ? "Update Task" : "Create Task"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
