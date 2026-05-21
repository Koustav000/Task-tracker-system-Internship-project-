import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const BASE_URL = "http://localhost:8080";

const STATUS_COLORS = {
  COMPLETED:   { bg: "#eaf3de", color: "#3b6d11", label: "Completed" },
  PENDING:     { bg: "#faeeda", color: "#854f0b", label: "Pending" },
  IN_PROGRESS: { bg: "#e6f1fb", color: "#185fa5", label: "In Progress" },
};

const PRIORITY_COLORS = {
  HIGH:   { bg: "#fcebeb", color: "#a32d2d" },
  MEDIUM: { bg: "#faeeda", color: "#854f0b" },
  LOW:    { bg: "#eaf3de", color: "#3b6d11" },
};

const NAV_ITEMS = [
  { key: "dashboard",       label: "Dashboard",       icon: "🏠" },
  { key: "project-tracker", label: "Project Tracker", icon: "📋" },
  { key: "reports",         label: "Reports",         icon: "📊" },
  { key: "users",           label: "Users",           icon: "👥" },
];

function Badge({ label, bg, color }) {
  return (
    <span style={{
      background: bg, color, fontSize: "12px", fontWeight: 500,
      padding: "3px 10px", borderRadius: "20px", display: "inline-block",
    }}>{label}</span>
  );
}

function StatCard({ label, value, bg, color }) {
  return (
    <div style={{ background: bg, borderRadius: "12px", padding: "20px 24px", flex: 1, minWidth: "130px" }}>
      <p style={{ margin: 0, fontSize: "13px", color, fontWeight: 500 }}>{label}</p>
      <p style={{ margin: "6px 0 0", fontSize: "32px", fontWeight: 700, color }}>{value}</p>
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
      zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center"
    }}>
      <div style={{
        background: "#fff", borderRadius: "16px", padding: "32px",
        width: "420px", maxWidth: "95vw", boxShadow: "0 8px 32px rgba(0,0,0,0.18)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 600 }}>{title}</h3>
          <button onClick={onClose} style={{
            background: "none", border: "none", fontSize: "22px",
            cursor: "pointer", color: "#888", lineHeight: 1
          }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const token    = localStorage.getItem("token");
  const username = localStorage.getItem("username");

  const [activeNav, setActiveNav]   = useState("dashboard");
  const [stats, setStats]           = useState({ total: 0, completed: 0, pending: 0, inProgress: 0 });
  const [tasks, setTasks]           = useState([]);
  const [users, setUsers]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");

  const [filterStatus,   setFilterStatus]   = useState("ALL");
  const [filterPriority, setFilterPriority] = useState("ALL");
  const [search, setSearch]                 = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal,   setShowEditModal]   = useState(false);
  const [selectedTask,    setSelectedTask]    = useState(null);
  const [deleteConfirm,   setDeleteConfirm]   = useState(null);
  const [toast, setToast]                     = useState(null);

  const emptyForm = { title: "", description: "", status: "PENDING", priority: "MEDIUM", dueDate: "", assignedTo: "" };
  const [form, setForm] = useState(emptyForm);

  const headers = { Authorization: `Bearer ${token}` };

  const showToast = (msg, isError = false) => {
    setToast({ msg, isError });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = async () => {
    try {
      const [tasksRes, totalRes, completedRes, pendingRes] = await Promise.all([
        axios.get(`${BASE_URL}/api/tasks`,           { headers }),
        axios.get(`${BASE_URL}/api/tasks/count`,     { headers }),
        axios.get(`${BASE_URL}/api/tasks/completed`, { headers }),
        axios.get(`${BASE_URL}/api/tasks/pending`,   { headers }),
      ]);
      setTasks(tasksRes.data);
      const total     = totalRes.data;
      const completed = completedRes.data;
      const pending   = pendingRes.data;
      setStats({ total, completed, pending, inProgress: total - completed - pending });
      setLoading(false);
    } catch {
      setError("Failed to load data.");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) { navigate("/"); return; }
    fetchData();
  }, []);

  // Derive unique users from tasks
  useEffect(() => {
    const uniqueUsers = [...new Set(tasks.map(t => t.assignedTo).filter(Boolean))];
    setUsers(uniqueUsers);
  }, [tasks]);

  const handleCreateTask = async () => {
    if (!form.title.trim()) return showToast("Title is required", true);
    try {
      await axios.post(`${BASE_URL}/api/tasks`, form, { headers });
      setShowCreateModal(false); setForm(emptyForm);
      showToast("Task created successfully ✅"); fetchData();
    } catch { showToast("Failed to create task", true); }
  };

  const handleEditTask = async () => {
    if (!form.title.trim()) return showToast("Title is required", true);
    try {
      await axios.put(`${BASE_URL}/api/tasks/${selectedTask.id}`, form, { headers });
      setShowEditModal(false); setSelectedTask(null);
      showToast("Task updated successfully ✅"); fetchData();
    } catch { showToast("Failed to update task", true); }
  };

  const handleDeleteTask = async (id) => {
    try {
      await axios.delete(`${BASE_URL}/api/tasks/${id}`, { headers });
      setDeleteConfirm(null); showToast("Task deleted"); fetchData();
    } catch { showToast("Failed to delete task", true); }
  };

  const openEdit = (task) => {
    setSelectedTask(task);
    setForm({
      title: task.title || "", description: task.description || "",
      status: task.status || "PENDING", priority: task.priority || "MEDIUM",
      dueDate: task.dueDate || "", assignedTo: task.assignedTo || "",
    });
    setShowEditModal(true);
  };

  const handleLogout = () => { localStorage.clear(); navigate("/"); };

  const filteredTasks = tasks.filter(t => {
    const matchStatus   = filterStatus   === "ALL" || t.status   === filterStatus;
    const matchPriority = filterPriority === "ALL" || t.priority === filterPriority;
    const matchSearch   = !search || t.title?.toLowerCase().includes(search.toLowerCase())
                                  || t.assignedTo?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchPriority && matchSearch;
  });

  const completionPercent = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  // ─── PAGE CONTENT ────────────────────────────────────────────────
  const renderContent = () => {
    switch (activeNav) {

      // ── DASHBOARD ──
      case "dashboard":
        return (
          <div>
            <h2 style={pageTitle}>Dashboard</h2>

            {/* Stats */}
            <div style={{ display: "flex", gap: "16px", marginBottom: "24px", flexWrap: "wrap" }}>
              <StatCard label="Total Tasks"  value={stats.total}      bg="#e6f1fb" color="#185fa5" />
              <StatCard label="Completed"    value={stats.completed}  bg="#eaf3de" color="#3b6d11" />
              <StatCard label="Pending"      value={stats.pending}    bg="#faeeda" color="#854f0b" />
              <StatCard label="In Progress"  value={stats.inProgress} bg="#fbeaf0" color="#993556" />
            </div>

            {/* Progress */}
            <div style={card}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                <span style={{ fontWeight: 600 }}>Overall Completion</span>
                <span style={{ fontWeight: 700, color: "#667eea" }}>{completionPercent}%</span>
              </div>
              <div style={{ background: "#f0f0f0", borderRadius: "20px", height: "10px", overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: "20px", width: `${completionPercent}%`,
                  background: "linear-gradient(90deg,#667eea,#764ba2)", transition: "width 0.6s ease"
                }} />
              </div>
              <p style={{ margin: "10px 0 0", fontSize: "13px", color: "#888" }}>
                {stats.completed} of {stats.total} tasks completed
              </p>
            </div>

            {/* Recent Tasks */}
            <div style={{ ...card, padding: 0, overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between" }}>
                <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 600 }}>Recent Tasks</h3>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={tableStyle}>
                  <thead>
                    <tr style={{ background: "#f9f9fb" }}>
                      {["Title", "Assigned To", "Status", "Priority"].map(h => (
                        <th key={h} style={th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.slice(0, 5).map((task, i) => (
                      <tr key={task.id} style={{ borderTop: "1px solid #f0f0f0", background: i % 2 === 0 ? "#fff" : "#fdfdfd" }}>
                        <td style={td}>{task.title}</td>
                        <td style={{ ...td, color: "#666" }}>{task.assignedTo || "—"}</td>
                        <td style={td}><Badge label={STATUS_COLORS[task.status]?.label || task.status} bg={STATUS_COLORS[task.status]?.bg || "#eee"} color={STATUS_COLORS[task.status]?.color || "#555"} /></td>
                        <td style={td}><Badge label={task.priority} bg={PRIORITY_COLORS[task.priority]?.bg || "#eee"} color={PRIORITY_COLORS[task.priority]?.color || "#555"} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      // ── PROJECT TRACKER ──
      case "project-tracker":
        return (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ ...pageTitle, marginBottom: 0 }}>Project Tracker</h2>
              <button onClick={() => { setForm(emptyForm); setShowCreateModal(true); }} style={primaryBtn}>
                + New Task
              </button>
            </div>

            {/* Filters */}
            <div style={{ ...card, display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
              <input style={{ padding: "9px 12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "14px", outline: "none", maxWidth: "220px", fontFamily: "inherit" }}
                placeholder="Search by title or user..." value={search} onChange={e => setSearch(e.target.value)} />
              <select style={{ padding: "9px 12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "14px", outline: "none", fontFamily: "inherit" }}
                value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="ALL">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
              <select style={{ padding: "9px 12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "14px", outline: "none", fontFamily: "inherit" }}
                value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
                <option value="ALL">All Priority</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
              <span style={{ marginLeft: "auto", fontSize: "13px", color: "#888" }}>{filteredTasks.length} tasks</span>
            </div>

            {/* Table */}
            <div style={{ ...card, padding: 0, overflow: "hidden" }}>
              {filteredTasks.length === 0 ? (
                <p style={{ textAlign: "center", padding: "40px", color: "#aaa" }}>No tasks found</p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={tableStyle}>
                    <thead>
                      <tr style={{ background: "#f9f9fb" }}>
                        {["Title", "Assigned To", "Status", "Priority", "Due Date", "Actions"].map(h => (
                          <th key={h} style={th}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTasks.map((task, i) => (
                        <tr key={task.id} style={{ borderTop: "1px solid #f0f0f0", background: i % 2 === 0 ? "#fff" : "#fdfdfd" }}>
                          <td style={{ ...td, fontWeight: 500, maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{task.title}</td>
                          <td style={{ ...td, color: "#555" }}>{task.assignedTo || "—"}</td>
                          <td style={td}><Badge label={STATUS_COLORS[task.status]?.label || task.status} bg={STATUS_COLORS[task.status]?.bg || "#eee"} color={STATUS_COLORS[task.status]?.color || "#555"} /></td>
                          <td style={td}><Badge label={task.priority} bg={PRIORITY_COLORS[task.priority]?.bg || "#eee"} color={PRIORITY_COLORS[task.priority]?.color || "#555"} /></td>
                          <td style={{ ...td, color: "#777", whiteSpace: "nowrap" }}>{task.dueDate || "—"}</td>
                          <td style={{ ...td, whiteSpace: "nowrap" }}>
                            <button onClick={() => openEdit(task)} style={editBtn}>Edit</button>
                            <button onClick={() => setDeleteConfirm(task)} style={deleteBtn}>Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        );


      // ── REPORTS ──
      case "reports":
        return (
          <div>
            <h2 style={pageTitle}>Reports</h2>
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "24px" }}>
              <StatCard label="Total Tasks"  value={stats.total}      bg="#e6f1fb" color="#185fa5" />
              <StatCard label="Completed"    value={stats.completed}  bg="#eaf3de" color="#3b6d11" />
              <StatCard label="Pending"      value={stats.pending}    bg="#faeeda" color="#854f0b" />
              <StatCard label="In Progress"  value={stats.inProgress} bg="#fbeaf0" color="#993556" />
            </div>

            {/* Status breakdown */}
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginBottom: "24px" }}>
              <div style={{ ...card, flex: 2, minWidth: "260px" }}>
                <h3 style={{ margin: "0 0 16px", fontSize: "15px", fontWeight: 600 }}>Status Breakdown</h3>
                {["COMPLETED", "PENDING", "IN_PROGRESS"].map(s => {
                  const count = tasks.filter(t => t.status === s).length;
                  const pct   = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                  return (
                    <div key={s} style={{ marginBottom: "14px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                        <Badge label={STATUS_COLORS[s]?.label || s} bg={STATUS_COLORS[s]?.bg} color={STATUS_COLORS[s]?.color} />
                        <span style={{ fontSize: "13px", color: "#888" }}>{count} ({pct}%)</span>
                      </div>
                      <div style={{ background: "#f0f0f0", borderRadius: "10px", height: "8px", overflow: "hidden" }}>
                        <div style={{ height: "100%", borderRadius: "10px", width: `${pct}%`, background: STATUS_COLORS[s]?.color, transition: "width 0.5s" }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ ...card, flex: 1, minWidth: "200px" }}>
                <h3 style={{ margin: "0 0 16px", fontSize: "15px", fontWeight: 600 }}>Priority Breakdown</h3>
                {["HIGH", "MEDIUM", "LOW"].map(p => {
                  const count = tasks.filter(t => t.priority === p).length;
                  return (
                    <div key={p} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                      <Badge label={p} bg={PRIORITY_COLORS[p].bg} color={PRIORITY_COLORS[p].color} />
                      <span style={{ fontWeight: 700, fontSize: "18px", color: PRIORITY_COLORS[p].color }}>{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );

      // ── USERS ──
      case "users":
        return (
          <div>
            <h2 style={pageTitle}>Users</h2>
            {users.length === 0 ? (
              <div style={{ ...card, textAlign: "center", color: "#aaa", padding: "48px" }}>
                No users found. Assign tasks to users to see them here.
              </div>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
                {users.map(user => {
                  const userTasks     = tasks.filter(t => t.assignedTo === user);
                  const completed     = userTasks.filter(t => t.status === "COMPLETED").length;
                  const pending       = userTasks.filter(t => t.status === "PENDING").length;
                  const pct           = userTasks.length > 0 ? Math.round((completed / userTasks.length) * 100) : 0;
                  return (
                    <div key={user} style={{ ...card, minWidth: "240px", flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
                        <div style={{
                          width: "40px", height: "40px", borderRadius: "50%",
                          background: "linear-gradient(135deg,#667eea,#764ba2)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: "#fff", fontWeight: 700, fontSize: "16px", flexShrink: 0
                        }}>
                          {user.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p style={{ margin: 0, fontWeight: 600, fontSize: "15px" }}>{user}</p>
                          <p style={{ margin: 0, fontSize: "12px", color: "#888" }}>{userTasks.length} tasks assigned</p>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                        <span style={{ ...pill, background: "#eaf3de", color: "#3b6d11" }}>✓ {completed} done</span>
                        <span style={{ ...pill, background: "#faeeda", color: "#854f0b" }}>⏳ {pending} pending</span>
                      </div>
                      <div style={{ background: "#f0f0f0", borderRadius: "10px", height: "6px", overflow: "hidden" }}>
                        <div style={{ height: "100%", borderRadius: "10px", width: `${pct}%`, background: "linear-gradient(90deg,#667eea,#764ba2)", transition: "width 0.5s" }} />
                      </div>
                      <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#888" }}>{pct}% completion</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  // ─── STYLES ──────────────────────────────────────────────────────
  const pageTitle = { margin: "0 0 20px", fontSize: "22px", fontWeight: 700, color: "#2d2d2d" };
  const card      = { background: "#fff", borderRadius: "12px", padding: "20px 24px", boxShadow: "0 1px 4px rgba(0,0,0,0.07)", marginBottom: "20px" };
  const tableStyle= { width: "100%", borderCollapse: "collapse", fontSize: "14px" };
  const th        = { padding: "12px 16px", textAlign: "left", fontWeight: 600, color: "#555", whiteSpace: "nowrap" };
  const td        = { padding: "12px 16px" };
  const editBtn   = { background: "#e6f1fb", color: "#185fa5", border: "none", padding: "5px 14px", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: 500, marginRight: "8px" };
  const deleteBtn = { background: "#fcebeb", color: "#a32d2d", border: "none", padding: "5px 14px", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: 500 };
  const primaryBtn= { background: "linear-gradient(135deg,#667eea,#764ba2)", color: "#fff", border: "none", padding: "10px 22px", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: 600, fontFamily: "inherit" };
  const pill      = { fontSize: "12px", padding: "3px 10px", borderRadius: "20px", fontWeight: 500 };

  const inputStyle = {
    width: "100%", padding: "9px 12px", borderRadius: "8px",
    border: "1px solid #ddd", fontSize: "14px", boxSizing: "border-box",
    marginBottom: "12px", fontFamily: "inherit", outline: "none",
  };

  const FormFields = () => (
    <>
      <input style={inputStyle} placeholder="Task title *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
      <textarea style={{ ...inputStyle, minHeight: "72px", resize: "vertical" }} placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
      <input style={inputStyle} placeholder="Assign to (username)" value={form.assignedTo} onChange={e => setForm({ ...form, assignedTo: e.target.value })} />
      <input style={inputStyle} type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
      <div style={{ display: "flex", gap: "10px" }}>
        <select style={{ ...inputStyle, flex: 1 }} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
          <option value="PENDING">Pending</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
        </select>
        <select style={{ ...inputStyle, flex: 1 }} value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
      </div>
    </>
  );

  if (loading) return <div style={{ textAlign: "center", padding: "80px", fontFamily: "Segoe UI, sans-serif", color: "#667eea" }}>Loading...</div>;
  if (error)   return <div style={{ textAlign: "center", padding: "80px", fontFamily: "Segoe UI, sans-serif", color: "#dc3545" }}>{error}</div>;

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "'Segoe UI', sans-serif", overflow: "hidden" }}>

      {/* ── SIDEBAR ── */}
      <div style={{
        width: "220px", flexShrink: 0,
        background: "#fff",
        borderRight: "1px solid #ebebeb",
        display: "flex", flexDirection: "column",
        boxShadow: "2px 0 8px rgba(0,0,0,0.05)"
      }}>
        {/* Logo */}
        <div style={{ padding: "16px 16px 14px", borderBottom: "1px solid #f0f0f0" }}>
          <img src="/process.jpg" alt="ProcessWare" style={{ width: "100%", maxWidth: "170px", display: "block" }} />
          <p style={{ margin: "6px 0 0", fontSize: "13px", color: "#999", textAlign: "center" }}>Task Tracker</p>
        </div>

        {/* Nav Items */}
        <nav style={{ flex: 1, padding: "12px 10px" }}>
          {NAV_ITEMS.map(item => (
            <button
              key={item.key}
              onClick={() => setActiveNav(item.key)}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: "10px",
                padding: "10px 14px", borderRadius: "8px", border: "none",
                cursor: "pointer", fontFamily: "inherit", fontSize: "15px",
                fontWeight: activeNav === item.key ? 600 : 400,
                background: activeNav === item.key ? "linear-gradient(135deg,#667eea,#764ba2)" : "transparent",
                color: activeNav === item.key ? "#fff" : "#555",
                marginBottom: "4px", textAlign: "left", transition: "all 0.2s",
              }}
            >
              <span style={{ fontSize: "16px" }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* User info + Logout at bottom */}
        <div style={{ padding: "14px 10px", borderTop: "1px solid #f0f0f0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 14px", marginBottom: "6px" }}>
            <div style={{
              width: "30px", height: "30px", borderRadius: "50%", flexShrink: 0,
              background: "linear-gradient(135deg,#667eea,#764ba2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontWeight: 700, fontSize: "15px"
            }}>
              {username?.charAt(0).toUpperCase()}
            </div>
            <div style={{ overflow: "hidden" }}>
              <p style={{ margin: 0, fontWeight: 600, fontSize: "15px", color: "#2d2d2d", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{username}</p>
              <p style={{ margin: 0, fontSize: "13px", color: "#999" }}>Admin</p>
            </div>
          </div>
          <button onClick={handleLogout} style={{
            width: "100%", padding: "9px 14px", borderRadius: "20px", border: "none",
            background: "#d0becb", color: "#a32d2d", cursor: "pointer",
            fontSize: "14px", fontWeight: 600, fontFamily: "inherit",
            display: "flex", alignItems: "center", gap: "8px",
          }}>
            🚪 Logout
          </button>
        </div>
      </div>

      {/* ── MAIN AREA ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Top Bar */}
        <div style={{
          background: "#fff", borderBottom: "1px solid #ebebeb",
          padding: "14px 28px", display: "flex", justifyContent: "space-between", alignItems: "center",
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        }}>
          <img src="/process.jpg" alt="ProcessWare" style={{ height: "36px", display: "block" }} />
          <span style={{ fontSize: "14px", color: "#888" }}>
            Logged in as : <strong style={{ color: "#667eea" }}>{username}</strong>
          </span>
        </div>

        {/* Page Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px", background: "#f5f6fa" }}>
          {renderContent()}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: "20px", right: "20px", zIndex: 9999,
          background: toast.isError ? "linear-gradient(135deg,#dc3545,#c82333)" : "linear-gradient(135deg,#28a745,#218838)",
          color: "#fff", padding: "14px 20px", borderRadius: "10px",
          fontSize: "14px", fontWeight: 500, boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
        }}>
          {toast.msg}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <Modal title="Create New Task" onClose={() => setShowCreateModal(false)}>
          <FormFields />
          <button onClick={handleCreateTask} style={{ ...primaryBtn, width: "100%", padding: "11px", fontSize: "15px" }}>
            Create Task
          </button>
        </Modal>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <Modal title="Edit Task" onClose={() => { setShowEditModal(false); setSelectedTask(null); }}>
          <FormFields />
          <button onClick={handleEditTask} style={{ ...primaryBtn, width: "100%", padding: "11px", fontSize: "15px" }}>
            Save Changes
          </button>
        </Modal>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <Modal title="Delete Task" onClose={() => setDeleteConfirm(null)}>
          <p style={{ color: "#555", marginTop: 0 }}>
            Are you sure you want to delete <strong>"{deleteConfirm.title}"</strong>? This cannot be undone.
          </p>
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={() => setDeleteConfirm(null)} style={{ flex: 1, padding: "10px", background: "#f5f6fa", border: "1px solid #ddd", borderRadius: "8px", cursor: "pointer", fontWeight: 500, fontFamily: "inherit" }}>
              Cancel
            </button>
            <button onClick={() => handleDeleteTask(deleteConfirm.id)} style={{ flex: 1, padding: "10px", background: "#dc3545", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontFamily: "inherit" }}>
              Delete
            </button>
          </div>
        </Modal>
      )}

      <style>{`
        button:hover { opacity: 0.88; }
        input:focus, select:focus, textarea:focus { border-color: #667eea !important; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #f1f1f1; }
        ::-webkit-scrollbar-thumb { background: #ccc; border-radius: 3px; }
      `}</style>
    </div>
  );
}