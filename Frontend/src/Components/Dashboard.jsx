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

function Badge({ label, bg, color }) {
  return (
    <span style={{
      background: bg, color, fontSize: "12px", fontWeight: 500,
      padding: "3px 10px", borderRadius: "20px", display: "inline-block",
    }}>
      {label}
    </span>
  );
}

function StatCard({ label, value, bg, color }) {
  return (
    <div style={{
      background: bg, borderRadius: "12px", padding: "20px 24px",
      flex: 1, minWidth: "130px",
    }}>
      <p style={{ margin: 0, fontSize: "13px", color, fontWeight: 500 }}>{label}</p>
      <p style={{ margin: "6px 0 0", fontSize: "32px", fontWeight: 700, color }}>{value}</p>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const token    = localStorage.getItem("token");
  const username = localStorage.getItem("username");

  const [data, setData]           = useState({ totalTasks: 0, completedTasks: 0, pendingTasks: 0, recentTasks: [] });
  const [allTasks, setAllTasks]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  const [filterStatus,   setFilterStatus]   = useState("ALL");
  const [filterPriority, setFilterPriority] = useState("ALL");
  const [search, setSearch]                 = useState("");

  const headers = { Authorization: `Bearer ${token}` };

  const fetchData = async () => {
    if (!token || !username) { navigate("/"); return; }
    try {
      const [dashRes, tasksRes] = await Promise.all([
        axios.get(`${BASE_URL}/api/tasks/dashboard/${username}`, { headers }),
        axios.get(`${BASE_URL}/api/tasks/user/${username}`,      { headers }),
      ]);
      setData(dashRes.data);
      setAllTasks(tasksRes.data);
      setLoading(false);
    } catch {
      setError("Failed to load your dashboard. Please try again.");
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const inProgress = allTasks.filter(t => t.status === "IN_PROGRESS").length;

  const filteredTasks = allTasks.filter(t => {
    const matchStatus   = filterStatus   === "ALL" || t.status   === filterStatus;
    const matchPriority = filterPriority === "ALL" || t.priority === filterPriority;
    const matchSearch   = !search || t.title?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchPriority && matchSearch;
  });

  const completionPercent = data.totalTasks > 0
    ? Math.round((data.completedTasks / data.totalTasks) * 100)
    : 0;

  const handleLogout = () => { localStorage.clear(); navigate("/"); };

  const inputStyle = {
    padding: "9px 12px", borderRadius: "8px", border: "1px solid #ddd",
    fontSize: "14px", fontFamily: "inherit", outline: "none", background: "#fff",
  };

  const tabStyle = (active) => ({
    padding: "8px 22px", borderRadius: "8px", border: "none", cursor: "pointer",
    fontWeight: 600, fontSize: "14px", fontFamily: "inherit",
    background: active ? "linear-gradient(135deg,#667eea,#764ba2)" : "transparent",
    color: active ? "#fff" : "#888",
    transition: "all 0.2s",
  });

  if (loading) return (
    <div style={{ textAlign: "center", padding: "80px", fontFamily: "Segoe UI, sans-serif", color: "#667eea" }}>
      Loading your dashboard...
    </div>
  );

  if (error) return (
    <div style={{ textAlign: "center", padding: "80px", fontFamily: "Segoe UI, sans-serif", color: "#dc3545" }}>
      {error}
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#f5f6fa", fontFamily: "'Segoe UI', sans-serif" }}>

      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #667eea, #764ba2)",
        padding: "14px 32px", display: "flex", justifyContent: "space-between", alignItems: "center"
      }}>
        {/* Logo */}
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <img src="/process.jpg" alt="ProcessWare" style={{ height: "38px", display: "block", borderRadius: "6px" }} />
          <p style={{ margin: 0, color: "rgba(255,255,255,0.8)", fontSize: "12px" }}>
            Welcome back, <strong>{username}</strong> 👋
          </p>
        </div>

        <button onClick={handleLogout} style={{
          background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.4)",
          color: "#fff", padding: "8px 20px", borderRadius: "20px",
          cursor: "pointer", fontSize: "14px", fontWeight: 500,
        }}>Logout</button>
      </div>

      <div style={{ padding: "28px 32px" }}>

        {/* Stat Cards */}
        <div style={{ display: "flex", gap: "16px", marginBottom: "24px", flexWrap: "wrap" }}>
          <StatCard label="Total Tasks"  value={data.totalTasks}     bg="#e6f1fb" color="#185fa5" />
          <StatCard label="Completed"    value={data.completedTasks} bg="#eaf3de" color="#3b6d11" />
          <StatCard label="Pending"      value={data.pendingTasks}   bg="#faeeda" color="#854f0b" />
          <StatCard label="In Progress"  value={inProgress}          bg="#fbeaf0" color="#993556" />
        </div>

        {/* Progress Bar */}
        <div style={{
          background: "#fff", borderRadius: "12px", padding: "20px 24px",
          marginBottom: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.07)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
            <span style={{ fontWeight: 600, fontSize: "15px" }}>Overall Progress</span>
            <span style={{ fontWeight: 700, fontSize: "15px", color: "#667eea" }}>{completionPercent}%</span>
          </div>
          <div style={{ background: "#f0f0f0", borderRadius: "20px", height: "10px", overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: "20px",
              width: `${completionPercent}%`,
              background: "linear-gradient(90deg, #667eea, #764ba2)",
              transition: "width 0.6s ease",
            }} />
          </div>
          <p style={{ margin: "10px 0 0", fontSize: "13px", color: "#888" }}>
            {data.completedTasks} of {data.totalTasks} tasks completed
          </p>
        </div>

        {/* Tabs */}
        <div style={{
          background: "#fff", borderRadius: "12px", padding: "6px",
          display: "inline-flex", gap: "4px", marginBottom: "20px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.07)"
        }}>
          <button style={tabStyle(activeTab === "overview")} onClick={() => setActiveTab("overview")}>Overview</button>
          <button style={tabStyle(activeTab === "tasks")}    onClick={() => setActiveTab("tasks")}>All My Tasks</button>
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div style={{
            background: "#fff", borderRadius: "12px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.07)", overflow: "hidden"
          }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #f0f0f0" }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600 }}>Recent Tasks</h3>
            </div>

            {data.recentTasks.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px", color: "#bbb" }}>
                <p style={{ fontSize: "16px", margin: 0 }}>No tasks assigned yet.</p>
                <p style={{ fontSize: "13px", marginTop: "6px" }}>Your recent tasks will appear here.</p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                  <thead>
                    <tr style={{ background: "#f9f9fb" }}>
                      {["Title", "Status", "Priority", "Due Date"].map(h => (
                        <th key={h} style={{
                          padding: "12px 16px", textAlign: "left",
                          fontWeight: 600, color: "#555", whiteSpace: "nowrap"
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentTasks.map((task, i) => (
                      <tr key={task.id} style={{
                        borderTop: "1px solid #f0f0f0",
                        background: i % 2 === 0 ? "#fff" : "#fdfdfd"
                      }}>
                        <td style={{ padding: "12px 16px", fontWeight: 500 }}>{task.title}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <Badge
                            label={STATUS_COLORS[task.status]?.label || task.status}
                            bg={STATUS_COLORS[task.status]?.bg || "#eee"}
                            color={STATUS_COLORS[task.status]?.color || "#555"}
                          />
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <Badge
                            label={task.priority}
                            bg={PRIORITY_COLORS[task.priority]?.bg || "#eee"}
                            color={PRIORITY_COLORS[task.priority]?.color || "#555"}
                          />
                        </td>
                        <td style={{ padding: "12px 16px", color: "#777" }}>{task.dueDate || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ALL TASKS TAB */}
        {activeTab === "tasks" && (
          <div>
            <div style={{
              background: "#fff", borderRadius: "12px", padding: "14px 18px",
              display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center",
              marginBottom: "16px", boxShadow: "0 1px 4px rgba(0,0,0,0.07)"
            }}>
              <input
                style={{ ...inputStyle, maxWidth: "220px" }}
                placeholder="Search tasks..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <select style={inputStyle} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="ALL">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
              <select style={inputStyle} value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
                <option value="ALL">All Priority</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
              <span style={{ marginLeft: "auto", fontSize: "13px", color: "#888" }}>
                {filteredTasks.length} task{filteredTasks.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div style={{
              background: "#fff", borderRadius: "12px",
              boxShadow: "0 1px 4px rgba(0,0,0,0.07)", overflow: "hidden"
            }}>
              {filteredTasks.length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px", color: "#bbb" }}>
                  No tasks match your filters.
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                    <thead>
                      <tr style={{ background: "#f9f9fb" }}>
                        {["Title", "Description", "Status", "Priority", "Due Date"].map(h => (
                          <th key={h} style={{
                            padding: "12px 16px", textAlign: "left",
                            fontWeight: 600, color: "#555", whiteSpace: "nowrap"
                          }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTasks.map((task, i) => (
                        <tr key={task.id} style={{
                          borderTop: "1px solid #f0f0f0",
                          background: i % 2 === 0 ? "#fff" : "#fdfdfd"
                        }}>
                          <td style={{ padding: "12px 16px", fontWeight: 500, maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {task.title}
                          </td>
                          <td style={{ padding: "12px 16px", color: "#666", maxWidth: "220px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {task.description || "—"}
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <Badge
                              label={STATUS_COLORS[task.status]?.label || task.status}
                              bg={STATUS_COLORS[task.status]?.bg || "#eee"}
                              color={STATUS_COLORS[task.status]?.color || "#555"}
                            />
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <Badge
                              label={task.priority}
                              bg={PRIORITY_COLORS[task.priority]?.bg || "#eee"}
                              color={PRIORITY_COLORS[task.priority]?.color || "#555"}
                            />
                          </td>
                          <td style={{ padding: "12px 16px", color: "#777", whiteSpace: "nowrap" }}>
                            {task.dueDate || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`
        button:hover { opacity: 0.9; }
        input:focus, select:focus { border-color: #667eea !important; }
      `}</style>
    </div>
  );
}