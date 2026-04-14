import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import useAuth from "../hooks/useAuth";
import Navbar from "../components/Navbar";

const typeConfig = {
  emergency_alert: { icon: "🚨", label: "Emergency Alert", color: "#ff6b6b" },
  fund_update: { icon: "💰", label: "Fund Update", color: "#00ff88" },
  status_change: { icon: "🔄", label: "Status Change", color: "#6bcbff" },
  system: { icon: "⚙️", label: "System", color: "#a29bfe" },
};

const priorityConfig = {
  high: { color: "#ff6b6b", label: "High" },
  medium: { color: "#ffaa00", label: "Medium" },
  low: { color: "#555555", label: "Low" },
};

const categories = [
  { key: "all", icon: "📬", label: "All" },
  { key: "unread", icon: "🔵", label: "Unread" },
  { key: "emergency_alert", icon: "🚨", label: "Emergency Alerts" },
  { key: "fund_update", icon: "💰", label: "Fund Updates" },
  { key: "status_change", icon: "🔄", label: "Status Changes" },
  { key: "system", icon: "⚙️", label: "System" },
  { key: "archived", icon: "🗄️", label: "Archived" },
];

const Notifications = () => {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedNotif, setSelectedNotif] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [counts, setCounts] = useState({});
  const [bulkLoading, setBulkLoading] = useState(false);

  const fetchCounts = useCallback(async () => {
    try {
      const res = await axios.get(
        "http://localhost:3001/api/notifications/counts",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCounts(res.data);
    } catch (err) {
      console.error(err);
    }
  }, [token]);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setSelectedIds([]);
    setSelectedNotif(null);
    try {
      const params = {};
      if (selectedCategory === "unread") params.isRead = false;
      else if (selectedCategory === "archived") params.isArchived = true;
      else if (selectedCategory !== "all") params.type = selectedCategory;
      if (search.trim()) params.search = search.trim();
      if (sort === "oldest") params.sort = "oldest";
      else if (sort === "priority") params.sort = "priority";
      else if (sort === "type") params.sort = "type";

      const res = await axios.get("http://localhost:3001/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      setNotifications(res.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, [token, selectedCategory, search, sort]);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleSelectNotif = async (notif) => {
    setSelectedNotif(notif);
    if (!notif.isRead) {
      try {
        await axios.put(
          `http://localhost:3001/api/notifications/${notif._id}/read`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setNotifications(prev =>
          prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n)
        );
        setCounts(prev => ({ ...prev, all: Math.max(0, (prev.all || 0) - 1) }));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const toggleSelect = (id, e) => {
    e.stopPropagation();
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === notifications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(notifications.map(n => n._id));
    }
  };

  const handleBulkRead = async () => {
    if (selectedIds.length === 0) return;
    setBulkLoading(true);
    try {
      await axios.put(
        "http://localhost:3001/api/notifications/bulk-read",
        { ids: selectedIds },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications(prev =>
        prev.map(n => selectedIds.includes(n._id) ? { ...n, isRead: true } : n)
      );
      setSelectedIds([]);
      fetchCounts();
    } catch (err) {
      console.error(err);
    }
    setBulkLoading(false);
  };

  const handleBulkArchive = async () => {
    if (selectedIds.length === 0) return;
    setBulkLoading(true);
    try {
      await axios.put(
        "http://localhost:3001/api/notifications/bulk-archive",
        { ids: selectedIds },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications(prev => prev.filter(n => !selectedIds.includes(n._id)));
      setSelectedIds([]);
      fetchCounts();
    } catch (err) {
      console.error(err);
    }
    setBulkLoading(false);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setBulkLoading(true);
    try {
      await axios.delete(
        "http://localhost:3001/api/notifications/bulk-delete",
        {
          headers: { Authorization: `Bearer ${token}` },
          data: { ids: selectedIds },
        }
      );
      setNotifications(prev => prev.filter(n => !selectedIds.includes(n._id)));
      if (selectedNotif && selectedIds.includes(selectedNotif._id)) {
        setSelectedNotif(null);
      }
      setSelectedIds([]);
      fetchCounts();
    } catch (err) {
      console.error(err);
    }
    setBulkLoading(false);
  };

  const handleMarkAllRead = async () => {
    setBulkLoading(true);
    try {
      const type = selectedCategory !== "all" && selectedCategory !== "unread" && selectedCategory !== "archived"
        ? selectedCategory : "all";
      await axios.put(
        "http://localhost:3001/api/notifications/mark-all-read",
        { type },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      fetchCounts();
    } catch (err) {
      console.error(err);
    }
    setBulkLoading(false);
  };

  const handleDeleteSingle = async (id) => {
    try {
      await axios.delete(
        `http://localhost:3001/api/notifications/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications(prev => prev.filter(n => n._id !== id));
      if (selectedNotif?._id === id) setSelectedNotif(null);
      fetchCounts();
    } catch (err) {
      console.error(err);
    }
  };

  const formatTime = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getCategoryCount = (key) => {
    if (key === "all") return counts.all || 0;
    if (key === "unread") return counts.all || 0;
    if (key === "archived") return counts.archived || 0;
    return counts[key] || 0;
  };

  return (
    <div style={styles.page}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        .cat-btn { transition: all 0.2s ease !important; }
        .cat-btn:hover { background: rgba(0,255,136,0.06) !important; color: #00ff88 !important; }
        .notif-row { transition: all 0.2s ease !important; }
        .notif-row:hover { background: rgba(255,255,255,0.03) !important; }
        .notif-row.selected-row { background: rgba(0,255,136,0.04) !important; border-left-color: #00ff88 !important; }
        .action-btn { transition: all 0.2s ease !important; }
        .action-btn:hover { opacity: 0.8 !important; transform: translateY(-1px) !important; }
        .action-btn:disabled { opacity: 0.4 !important; cursor: not-allowed !important; transform: none !important; }
        input:focus, select:focus { border-color: #00ff88 !important; outline: none !important; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #222222; border-radius: 4px; }
      `}</style>

      <Navbar />

      <div style={styles.layout}>

        {/* ── LEFT SIDEBAR ── */}
        <div style={styles.sidebar}>
          <div style={styles.sidebarHeader}>
            <h2 style={styles.sidebarTitle}>{"📬 Inbox"}</h2>
            {(counts.all || 0) > 0 && (
              <span style={styles.totalBadge}>{counts.all}</span>
            )}
          </div>

          <div style={styles.categoryList}>
            {categories.map(cat => {
              const count = getCategoryCount(cat.key);
              const isActive = selectedCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  className="cat-btn"
                  style={{
                    ...styles.catBtn,
                    ...(isActive ? styles.catBtnActive : {}),
                  }}
                  onClick={() => setSelectedCategory(cat.key)}
                >
                  <span style={styles.catIcon}>{cat.icon}</span>
                  <span style={styles.catLabel}>{cat.label}</span>
                  {count > 0 && (
                    <span style={{
                      ...styles.catCount,
                      backgroundColor: isActive ? "#00ff88" : "#222222",
                      color: isActive ? "#0a0a0a" : "#555555",
                    }}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── MAIN CONTENT ── */}
        <div style={styles.main}>

          {/* Toolbar */}
          <div style={styles.toolbar}>
            <div style={styles.toolbarLeft}>
              <input
                type="checkbox"
                style={styles.masterCheckbox}
                checked={selectedIds.length === notifications.length && notifications.length > 0}
                onChange={toggleSelectAll}
              />
              {selectedIds.length > 0 ? (
                <div style={styles.bulkActions}>
                  <span style={styles.selectedCount}>
                    {selectedIds.length}{" selected"}
                  </span>
                  <button
                    className="action-btn"
                    style={styles.bulkBtn}
                    onClick={handleBulkRead}
                    disabled={bulkLoading}
                  >
                    {"✓ Mark Read"}
                  </button>
                  <button
                    className="action-btn"
                    style={styles.bulkBtn}
                    onClick={handleBulkArchive}
                    disabled={bulkLoading}
                  >
                    {"🗄️ Archive"}
                  </button>
                  <button
                    className="action-btn"
                    style={{ ...styles.bulkBtn, color: "#ff6b6b", borderColor: "rgba(255,107,107,0.3)" }}
                    onClick={handleBulkDelete}
                    disabled={bulkLoading}
                  >
                    {"🗑️ Delete"}
                  </button>
                </div>
              ) : (
                <button
                  className="action-btn"
                  style={styles.markAllBtn}
                  onClick={handleMarkAllRead}
                  disabled={bulkLoading}
                >
                  {"✓ Mark all read"}
                </button>
              )}
            </div>

            <div style={styles.toolbarRight}>
              <div style={styles.searchBox}>
                <span style={{ fontSize: "13px" }}>{"🔍"}</span>
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={styles.searchInput}
                />
              </div>
              <select
                value={sort}
                onChange={e => setSort(e.target.value)}
                style={styles.sortSelect}
              >
                <option value="newest">{"Newest first"}</option>
                <option value="oldest">{"Oldest first"}</option>
                <option value="priority">{"By priority"}</option>
                <option value="type">{"By type"}</option>
              </select>
            </div>
          </div>

          <div style={styles.contentArea}>

            {/* Notification list */}
            <div style={styles.listPanel}>
              {loading ? (
                <div style={styles.centerState}>
                  <div style={styles.spinner}></div>
                  <p style={styles.centerText}>{"Loading..."}</p>
                </div>
              ) : notifications.length === 0 ? (
                <div style={styles.centerState}>
                  <p style={{ fontSize: "40px", opacity: 0.3 }}>{"📭"}</p>
                  <p style={styles.centerText}>{"No notifications here"}</p>
                </div>
              ) : (
                notifications.map((notif, i) => {
                  const tc = typeConfig[notif.type] || typeConfig.system;
                  const pc = priorityConfig[notif.priority] || priorityConfig.medium;
                  const isSelected = selectedIds.includes(notif._id);
                  const isActive = selectedNotif?._id === notif._id;
                  return (
                    <div
                      key={notif._id}
                      className={"notif-row" + (isActive ? " selected-row" : "")}
                      style={{
                        ...styles.notifRow,
                        borderLeftColor: isActive ? "#00ff88" : notif.isRead ? "transparent" : tc.color,
                        backgroundColor: isActive
                          ? "rgba(0,255,136,0.04)"
                          : isSelected
                          ? "rgba(0,255,136,0.03)"
                          : "transparent",
                        animationDelay: `${i * 0.03}s`,
                      }}
                      onClick={() => handleSelectNotif(notif)}
                    >
                      <input
                        type="checkbox"
                        style={styles.rowCheckbox}
                        checked={isSelected}
                        onChange={e => toggleSelect(notif._id, e)}
                        onClick={e => e.stopPropagation()}
                      />
                      <div style={styles.notifIcon}>
                        <span style={{ fontSize: "18px" }}>{tc.icon}</span>
                      </div>
                      <div style={styles.notifContent}>
                        <div style={styles.notifTopRow}>
                          <p style={{
                            ...styles.notifTitle,
                            fontWeight: notif.isRead ? "500" : "700",
                            color: notif.isRead ? "#888888" : "#ffffff",
                          }}>
                            {notif.title}
                          </p>
                          <div style={styles.notifMeta}>
                            <span style={{
                              ...styles.priorityDot,
                              backgroundColor: pc.color,
                            }}></span>
                            <span style={styles.notifTime}>{formatTime(notif.createdAt)}</span>
                          </div>
                        </div>
                        <p style={{
                          ...styles.notifPreview,
                          color: notif.isRead ? "#444444" : "#888888",
                        }}>
                          {notif.message.substring(0, 80)}
                          {notif.message.length > 80 ? "..." : ""}
                        </p>
                        <span style={{
                          ...styles.typePill,
                          color: tc.color,
                          backgroundColor: tc.color + "12",
                          border: "1px solid " + tc.color + "25",
                        }}>
                          {tc.label}
                        </span>
                      </div>
                      {!notif.isRead && (
                        <div style={styles.unreadDot}></div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Detail panel */}
            <div style={styles.detailPanel}>
              {selectedNotif ? (
                <div style={{ animation: "slideIn 0.25s ease" }}>
                  <div style={styles.detailHeader}>
                    <div style={{
                      ...styles.detailTypeTag,
                      color: typeConfig[selectedNotif.type]?.color,
                      backgroundColor: (typeConfig[selectedNotif.type]?.color || "#888") + "12",
                      border: "1px solid " + (typeConfig[selectedNotif.type]?.color || "#888") + "25",
                    }}>
                      {typeConfig[selectedNotif.type]?.icon + " " + typeConfig[selectedNotif.type]?.label}
                    </div>
                    <button
                      style={styles.deleteBtn}
                      onClick={() => handleDeleteSingle(selectedNotif._id)}
                      title="Delete notification"
                    >
                      {"🗑️"}
                    </button>
                  </div>

                  <h3 style={styles.detailTitle}>{selectedNotif.title}</h3>

                  <div style={styles.detailMetaRow}>
                    <span style={styles.detailMetaItem}>
                      {"🕐 " + new Date(selectedNotif.createdAt).toLocaleString("en-US", {
                        year: "numeric", month: "long", day: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </span>
                    <span style={{
                      ...styles.detailPriority,
                      color: priorityConfig[selectedNotif.priority]?.color,
                    }}>
                      {"● " + priorityConfig[selectedNotif.priority]?.label + " Priority"}
                    </span>
                  </div>

                  <div style={styles.detailDivider}></div>

                  <p style={styles.detailMessage}>{selectedNotif.message}</p>

                  <div style={styles.detailStatus}>
                    <span style={{
                      color: selectedNotif.isRead ? "#555555" : "#00ff88",
                      fontSize: "12px",
                    }}>
                      {selectedNotif.isRead ? "✓ Read" : "● Unread"}
                    </span>
                    {selectedNotif.isArchived && (
                      <span style={{ color: "#555555", fontSize: "12px" }}>
                        {"🗄️ Archived"}
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <div style={styles.detailEmpty}>
                  <p style={{ fontSize: "40px", opacity: 0.2 }}>{"📩"}</p>
                  <p style={styles.detailEmptyText}>
                    {"Select a notification to read it"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  page: { backgroundColor: "#111111", minHeight: "100vh" },
  layout: { display: "flex", minHeight: "calc(100vh - 80px)" },
  sidebar: {
    width: "220px", minWidth: "220px",
    backgroundColor: "#0d0d0d", borderRight: "1px solid #1e1e1e",
    padding: "24px 12px", display: "flex",
    flexDirection: "column", gap: "8px",
  },
  sidebarHeader: {
    display: "flex", alignItems: "center", gap: "8px",
    padding: "0 8px 16px 8px", borderBottom: "1px solid #1e1e1e",
  },
  sidebarTitle: { color: "#ffffff", fontSize: "16px", fontWeight: "700" },
  totalBadge: {
    backgroundColor: "#ff6b6b", color: "#ffffff",
    borderRadius: "10px", padding: "2px 8px",
    fontSize: "11px", fontWeight: "700",
  },
  categoryList: { display: "flex", flexDirection: "column", gap: "2px" },
  catBtn: {
    display: "flex", alignItems: "center", gap: "10px",
    padding: "10px 12px", borderRadius: "8px",
    border: "none", backgroundColor: "transparent",
    color: "#666666", fontSize: "13px",
    cursor: "pointer", width: "100%",
    textAlign: "left", fontFamily: "inherit",
  },
  catBtnActive: {
    backgroundColor: "rgba(0,255,136,0.08)",
    color: "#00ff88",
  },
  catIcon: { fontSize: "14px", minWidth: "18px" },
  catLabel: { flex: 1 },
  catCount: {
    borderRadius: "10px", padding: "1px 7px",
    fontSize: "10px", fontWeight: "700",
  },
  main: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
  toolbar: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "12px 20px", borderBottom: "1px solid #1e1e1e",
    backgroundColor: "#0d0d0d", gap: "12px", flexWrap: "wrap",
  },
  toolbarLeft: { display: "flex", alignItems: "center", gap: "10px" },
  masterCheckbox: { width: "15px", height: "15px", cursor: "pointer", accentColor: "#00ff88" },
  bulkActions: { display: "flex", alignItems: "center", gap: "8px" },
  selectedCount: { color: "#00ff88", fontSize: "12px", fontWeight: "600" },
  bulkBtn: {
    padding: "5px 12px",
    backgroundColor: "transparent",
    border: "1px solid #2a2a2a",
    borderRadius: "6px", color: "#aaaaaa",
    fontSize: "11px", fontWeight: "600",
    cursor: "pointer", fontFamily: "inherit",
  },
  markAllBtn: {
    padding: "5px 12px",
    backgroundColor: "transparent",
    border: "1px solid #2a2a2a",
    borderRadius: "6px", color: "#555555",
    fontSize: "11px", cursor: "pointer",
    fontFamily: "inherit",
  },
  toolbarRight: { display: "flex", alignItems: "center", gap: "10px" },
  searchBox: {
    display: "flex", alignItems: "center", gap: "8px",
    backgroundColor: "#1a1a1a", border: "1px solid #222222",
    borderRadius: "8px", padding: "7px 12px",
  },
  searchInput: {
    backgroundColor: "transparent", border: "none",
    color: "#e0e0e0", fontSize: "12px", width: "180px",
    outline: "none", fontFamily: "inherit",
  },
  sortSelect: {
    backgroundColor: "#1a1a1a", border: "1px solid #222222",
    borderRadius: "8px", color: "#888888",
    fontSize: "12px", padding: "7px 10px",
    cursor: "pointer", fontFamily: "inherit",
  },
  contentArea: { display: "flex", flex: 1, overflow: "hidden" },
  listPanel: { flex: 1, overflowY: "auto", borderRight: "1px solid #1e1e1e" },
  centerState: {
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    height: "300px", gap: "12px",
  },
  spinner: {
    width: "32px", height: "32px",
    border: "2px solid rgba(0,255,136,0.1)",
    borderTop: "2px solid #00ff88",
    borderRadius: "50%", animation: "spin 0.8s linear infinite",
  },
  centerText: { color: "#444444", fontSize: "13px" },
  notifRow: {
    display: "flex", alignItems: "flex-start", gap: "12px",
    padding: "14px 16px", borderBottom: "1px solid #1a1a1a",
    cursor: "pointer", borderLeft: "3px solid transparent",
    animation: "fadeUp 0.3s ease both", position: "relative",
  },
  rowCheckbox: { marginTop: "3px", width: "14px", height: "14px", cursor: "pointer", accentColor: "#00ff88", flexShrink: 0 },
  notifIcon: { marginTop: "2px", flexShrink: 0 },
  notifContent: { flex: 1, minWidth: 0 },
  notifTopRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px", marginBottom: "4px" },
  notifTitle: { fontSize: "13px", flex: 1 },
  notifMeta: { display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 },
  priorityDot: { width: "6px", height: "6px", borderRadius: "50%" },
  notifTime: { color: "#444444", fontSize: "10px", whiteSpace: "nowrap" },
  notifPreview: { fontSize: "12px", lineHeight: "1.5", marginBottom: "6px" },
  typePill: { fontSize: "10px", fontWeight: "600", padding: "2px 8px", borderRadius: "10px" },
  unreadDot: {
    width: "8px", height: "8px", borderRadius: "50%",
    backgroundColor: "#00ff88", flexShrink: 0, marginTop: "6px",
  },
  detailPanel: {
    width: "320px", minWidth: "320px",
    padding: "24px 20px", overflowY: "auto",
    backgroundColor: "#0d0d0d",
  },
  detailHeader: {
    display: "flex", justifyContent: "space-between",
    alignItems: "center", marginBottom: "16px",
  },
  detailTypeTag: {
    fontSize: "11px", fontWeight: "700",
    padding: "4px 12px", borderRadius: "20px",
  },
  deleteBtn: {
    backgroundColor: "transparent", border: "none",
    cursor: "pointer", fontSize: "16px", opacity: 0.5,
    transition: "opacity 0.2s",
  },
  detailTitle: { color: "#ffffff", fontSize: "16px", fontWeight: "700", lineHeight: "1.4", marginBottom: "12px" },
  detailMetaRow: { display: "flex", flexDirection: "column", gap: "6px", marginBottom: "16px" },
  detailMetaItem: { color: "#444444", fontSize: "11px" },
  detailPriority: { fontSize: "11px", fontWeight: "600" },
  detailDivider: { height: "1px", backgroundColor: "#1e1e1e", marginBottom: "16px" },
  detailMessage: {
    color: "#cccccc", fontSize: "14px", lineHeight: "1.8",
    backgroundColor: "#1a1a1a", border: "1px solid #222222",
    borderRadius: "10px", padding: "16px", marginBottom: "16px",
  },
  detailStatus: { display: "flex", gap: "12px" },
  detailEmpty: {
    height: "100%", display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    gap: "12px", textAlign: "center", padding: "40px",
  },
  detailEmptyText: { color: "#333333", fontSize: "13px" },
};

export default Notifications;