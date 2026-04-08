import { useState, useEffect } from "react";
import axios from "axios";
import useAuth from "../../hooks/useAuth";
import Navbar from "../../components/Navbar";

const statusConfig = {
  Pending: { color: "#ffaa00", bg: "rgba(255,170,0,0.08)", icon: "⏳" },
  Approved: { color: "#00ff88", bg: "rgba(0,255,136,0.08)", icon: "✅" },
  Rejected: { color: "#ff6b6b", bg: "rgba(255,107,107,0.08)", icon: "❌" },
};

const AdminFundRequests = () => {
  const { token } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:3001/api/admin/fund-requests", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests(res.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleStatusUpdate = async (requestId, newStatus) => {
    setUpdatingStatus(true);
    try {
      await axios.put(
        `http://localhost:3001/api/admin/fund-requests/${requestId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRequests(prev =>
        prev.map(r => r._id === requestId ? { ...r, status: newStatus } : r)
      );
      setSelectedRequest(prev => ({ ...prev, status: newStatus }));
    } catch (err) {
      console.error("Status update failed:", err);
    }
    setUpdatingStatus(false);
  };

  const displayed = requests.filter(r => {
    const matchFilter = filter === "all" || r.status === filter;
    const matchSearch =
      (r.title || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.description || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.userId?.name || "").toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  if (loading) return (
    <div style={styles.loadingScreen}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={styles.spinner}></div>
      <p style={styles.loadingText}>{"Loading fund requests..."}</p>
    </div>
  );

  return (
    <div style={styles.page}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } }
        .fund-card { transition: all 0.3s ease !important; }
        .fund-card:hover { transform: translateY(-2px) !important; border-color: rgba(0,255,136,0.2) !important; box-shadow: 0 12px 30px rgba(0,0,0,0.3) !important; }
        .fund-card.selected { border-color: #00ff88 !important; background: rgba(0,255,136,0.04) !important; }
        .filter-btn { transition: all 0.2s ease !important; }
        .filter-btn:hover { color: #00ff88 !important; }
        .status-btn { transition: all 0.3s ease !important; }
        .status-btn:hover { transform: translateY(-2px) !important; }
        .status-btn:disabled { opacity: 0.5 !important; cursor: not-allowed !important; transform: none !important; }
        input:focus { border-color: #00ff88 !important; outline: none !important; }
      `}</style>

      <Navbar />
      <div style={styles.layout}>

        {/* ── LEFT PANEL ── */}
        <div style={styles.leftPanel}>
          <div style={styles.leftHeader}>
            <h2 style={styles.leftTitle}>{"Fund Requests"}</h2>
            <p style={styles.leftSubtitle}>{requests.length}{" total"}</p>
          </div>

          <div style={styles.searchBox}>
            <span>{"🔍"}</span>
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={styles.searchInput}
            />
          </div>

          <div style={styles.filterSection}>
            <p style={styles.filterTitle}>{"FILTER BY STATUS"}</p>
            {["all", "Pending", "Approved", "Rejected"].map(f => (
              <button
                key={f}
                className="filter-btn"
                style={{
                  ...styles.filterBtn,
                  ...(filter === f ? styles.filterActive : {}),
                }}
                onClick={() => setFilter(f)}
              >
                <span>
                  {f === "all"
                    ? "🗂 All"
                    : statusConfig[f].icon + " " + f}
                </span>
                <span style={styles.filterCount}>
                  {f === "all"
                    ? requests.length
                    : requests.filter(r => r.status === f).length}
                </span>
              </button>
            ))}
          </div>

          {/* Amount Summary */}
          <div style={styles.summarySection}>
            <p style={styles.filterTitle}>{"TOTAL AMOUNT"}</p>
            <div style={styles.summaryAmountBox}>
              <p style={styles.summaryAmountLabel}>{"Pending"}</p>
              <p style={{ ...styles.summaryAmount, color: "#ffaa00" }}>
                {"BDT " + requests
                  .filter(r => r.status === "Pending")
                  .reduce((sum, r) => sum + (r.amountNeeded || 0), 0)
                  .toLocaleString()}
              </p>
            </div>
            <div style={styles.summaryAmountBox}>
              <p style={styles.summaryAmountLabel}>{"Approved"}</p>
              <p style={{ ...styles.summaryAmount, color: "#00ff88" }}>
                {"BDT " + requests
                  .filter(r => r.status === "Approved")
                  .reduce((sum, r) => sum + (r.amountNeeded || 0), 0)
                  .toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* ── MIDDLE PANEL ── */}
        <div style={styles.middlePanel}>
          {displayed.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={{ fontSize: "48px", opacity: 0.3 }}>{"💰"}</div>
              <p style={{ color: "#555555", fontSize: "15px" }}>{"No fund requests found"}</p>
            </div>
          ) : (
            displayed.map((req, i) => {
              const sc = statusConfig[req.status] || {};
              return (
                <div
                  key={req._id}
                  className={"fund-card" + (selectedRequest?._id === req._id ? " selected" : "")}
                  style={{ ...styles.fundCard, animationDelay: `${i * 0.04}s` }}
                  onClick={() => setSelectedRequest(selectedRequest?._id === req._id ? null : req)}
                >
                  <div style={styles.cardTop}>
                    <div style={styles.cardLeft}>
                      <div style={styles.cardIconBox}>{"💰"}</div>
                      <div>
                        <p style={styles.cardTitle}>{req.title}</p>
                        <p style={styles.cardUser}>{"👤 " + (req.userId?.name || "Unknown")}</p>
                      </div>
                    </div>
                    <span style={{
                      ...styles.statusBadge,
                      color: sc.color,
                      backgroundColor: sc.bg,
                    }}>
                      {sc.icon + " " + req.status}
                    </span>
                  </div>
                  <p style={styles.cardDesc}>
                    {(req.description || "").substring(0, 90)}
                    {(req.description || "").length > 90 ? "..." : ""}
                  </p>
                  <div style={styles.cardAmount}>
                    <span style={styles.amountLabel}>{"Amount: "}</span>
                    <span style={styles.amountValue}>
                      {"BDT " + (req.amountNeeded || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── RIGHT PANEL ── */}
        <div style={styles.rightPanel}>
          {selectedRequest ? (
            <div style={{ animation: "slideIn 0.3s ease" }}>
              <div style={styles.detailHeader}>
                <h3 style={styles.detailTitle}>{"Request Details"}</h3>
                <button
                  style={styles.closeBtn}
                  onClick={() => setSelectedRequest(null)}
                >{"✕"}</button>
              </div>

              {/* Amount highlight */}
              <div style={styles.amountCard}>
                <p style={styles.amountCardLabel}>{"💰 Amount Requested"}</p>
                <p style={styles.amountCardValue}>
                  {"BDT " + (selectedRequest.amountNeeded || 0).toLocaleString()}
                </p>
              </div>

              {/* Status update box */}
              <div style={styles.statusUpdateBox}>
                <p style={styles.statusUpdateTitle}>{"🔄 Update Status"}</p>
                <p style={styles.statusCurrentText}>
                  {"Current: "}
                  <span style={{
                    color: statusConfig[selectedRequest.status]?.color,
                    fontWeight: "700",
                  }}>
                    {statusConfig[selectedRequest.status]?.icon + " " + selectedRequest.status}
                  </span>
                </p>
                <div style={styles.statusBtns}>
                  {["Pending", "Approved", "Rejected"].map(status => (
                    <button
                      key={status}
                      className="status-btn"
                      disabled={selectedRequest.status === status || updatingStatus}
                      style={{
                        ...styles.statusBtn,
                        borderColor: statusConfig[status]?.color,
                        color: selectedRequest.status === status
                          ? "#0a0a0a"
                          : statusConfig[status]?.color,
                        backgroundColor: selectedRequest.status === status
                          ? statusConfig[status]?.color
                          : statusConfig[status]?.color + "12",
                      }}
                      onClick={() => handleStatusUpdate(selectedRequest._id, status)}
                    >
                      {updatingStatus
                        ? "..."
                        : statusConfig[status]?.icon + " " + status +
                          (selectedRequest.status === status ? " ✓" : "")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div style={styles.detailSection}>
                <p style={styles.detailSectionTitle}>{"📝 Description"}</p>
                <p style={styles.detailDesc}>{selectedRequest.description}</p>
              </div>

              {/* Meta info */}
              <div style={styles.detailMeta}>
                {[
                  { label: "Title", value: selectedRequest.title },
                  { label: "Requested By", value: selectedRequest.userId?.name || "Unknown" },
                  { label: "Email", value: selectedRequest.userId?.email || "N/A" },
                  { label: "Contact", value: selectedRequest.userId?.contactInfo || "N/A" },
                  { label: "User Area", value: selectedRequest.userId?.area || "N/A" },
                  {
                    label: "Submitted",
                    value: new Date(selectedRequest.createdAt).toLocaleDateString("en-US", {
                      year: "numeric", month: "long", day: "numeric",
                    }),
                  },
                  {
                    label: "Time",
                    value: new Date(selectedRequest.createdAt).toLocaleTimeString("en-US", {
                      hour: "2-digit", minute: "2-digit",
                    }),
                  },
                ].map((item, i) => (
                  <div key={i} style={styles.metaRow}>
                    <span style={styles.metaLabel}>{item.label}</span>
                    <span style={styles.metaValue}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={styles.detailEmpty}>
              <div style={{ fontSize: "36px", opacity: 0.3 }}>{"👆"}</div>
              <p style={styles.detailEmptyText}>{"Click a request to review it"}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  page: { backgroundColor: "#111111", minHeight: "100vh" },
  loadingScreen: {
    backgroundColor: "#111111", minHeight: "100vh",
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center", gap: "16px",
  },
  spinner: {
    width: "40px", height: "40px",
    border: "3px solid rgba(0,255,136,0.1)",
    borderTop: "3px solid #00ff88",
    borderRadius: "50%", animation: "spin 0.8s linear infinite",
  },
  loadingText: { color: "#00ff88", fontSize: "14px" },
  layout: { display: "flex", minHeight: "calc(100vh - 80px)" },
  leftPanel: {
    width: "240px", minWidth: "240px",
    backgroundColor: "#0d0d0d", borderRight: "1px solid #1e1e1e",
    padding: "28px 20px", display: "flex",
    flexDirection: "column", gap: "16px", overflowY: "auto",
  },
  leftHeader: { paddingBottom: "16px", borderBottom: "1px solid #1e1e1e" },
  leftTitle: { color: "#ffffff", fontSize: "18px", fontWeight: "700" },
  leftSubtitle: { color: "#555555", fontSize: "12px", marginTop: "4px" },
  searchBox: {
    display: "flex", alignItems: "center", gap: "10px",
    backgroundColor: "#1a1a1a", border: "1px solid #222222",
    borderRadius: "10px", padding: "10px 14px",
  },
  searchInput: {
    backgroundColor: "transparent", border: "none",
    color: "#e0e0e0", fontSize: "13px", width: "100%",
    outline: "none", fontFamily: "inherit",
  },
  filterSection: { display: "flex", flexDirection: "column", gap: "4px" },
  filterTitle: {
    color: "#333333", fontSize: "10px",
    fontWeight: "700", letterSpacing: "1px", marginBottom: "4px",
  },
  filterBtn: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "9px 12px", borderRadius: "8px", border: "1px solid transparent",
    backgroundColor: "transparent", color: "#666666",
    fontSize: "13px", cursor: "pointer", width: "100%", fontFamily: "inherit",
  },
  filterActive: {
    backgroundColor: "rgba(0,255,136,0.08)",
    border: "1px solid rgba(0,255,136,0.2)", color: "#00ff88",
  },
  filterCount: {
    backgroundColor: "#222222", color: "#555555",
    fontSize: "11px", padding: "2px 8px", borderRadius: "10px",
  },
  summarySection: { display: "flex", flexDirection: "column", gap: "8px" },
  summaryAmountBox: {
    backgroundColor: "#1a1a1a", border: "1px solid #222222",
    borderRadius: "8px", padding: "10px 12px",
  },
  summaryAmountLabel: { color: "#444444", fontSize: "11px", marginBottom: "4px" },
  summaryAmount: { fontSize: "14px", fontWeight: "700" },
  middlePanel: { flex: 1, overflowY: "auto", borderRight: "1px solid #1e1e1e" },
  emptyState: {
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    height: "100%", gap: "12px", padding: "60px",
  },
  fundCard: {
    padding: "20px 24px", borderBottom: "1px solid #1a1a1a",
    cursor: "pointer", animation: "fadeUp 0.4s ease both",
    border: "1px solid transparent", borderBottomColor: "#1a1a1a",
  },
  cardTop: {
    display: "flex", justifyContent: "space-between",
    alignItems: "center", marginBottom: "10px",
  },
  cardLeft: { display: "flex", alignItems: "center", gap: "12px" },
  cardIconBox: {
    width: "38px", height: "38px", borderRadius: "10px",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "18px", backgroundColor: "rgba(0,255,136,0.08)",
    border: "1px solid rgba(0,255,136,0.15)",
  },
  cardTitle: { color: "#e0e0e0", fontSize: "13px", fontWeight: "700" },
  cardUser: { color: "#555555", fontSize: "11px", marginTop: "2px" },
  statusBadge: { fontSize: "11px", fontWeight: "600", padding: "4px 10px", borderRadius: "20px" },
  cardDesc: { color: "#888888", fontSize: "13px", lineHeight: "1.6", marginBottom: "10px" },
  cardAmount: { display: "flex", alignItems: "center", gap: "6px" },
  amountLabel: { color: "#444444", fontSize: "12px" },
  amountValue: { color: "#00ff88", fontSize: "13px", fontWeight: "700" },
  rightPanel: {
    width: "300px", minWidth: "300px",
    backgroundColor: "#0d0d0d", padding: "28px 20px", overflowY: "auto",
  },
  detailHeader: {
    display: "flex", justifyContent: "space-between",
    alignItems: "center", marginBottom: "20px",
  },
  detailTitle: { color: "#ffffff", fontSize: "16px", fontWeight: "700" },
  closeBtn: {
    backgroundColor: "#1a1a1a", border: "1px solid #222222",
    color: "#666666", width: "28px", height: "28px",
    borderRadius: "50%", cursor: "pointer", fontSize: "12px",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  amountCard: {
    backgroundColor: "rgba(0,255,136,0.05)",
    border: "1px solid rgba(0,255,136,0.15)",
    borderRadius: "12px", padding: "16px", marginBottom: "16px",
    textAlign: "center",
  },
  amountCardLabel: { color: "#444444", fontSize: "11px", marginBottom: "8px" },
  amountCardValue: { color: "#00ff88", fontSize: "24px", fontWeight: "800" },
  statusUpdateBox: {
    backgroundColor: "#1a1a1a", border: "1px solid #222222",
    borderRadius: "14px", padding: "18px", marginBottom: "16px",
    display: "flex", flexDirection: "column", gap: "12px",
  },
  statusUpdateTitle: { color: "#ffffff", fontSize: "13px", fontWeight: "700" },
  statusCurrentText: { color: "#666666", fontSize: "12px" },
  statusBtns: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" },
  statusBtn: {
    padding: "9px 6px", borderRadius: "8px",
    border: "1px solid", fontSize: "11px",
    fontWeight: "600", cursor: "pointer",
    fontFamily: "inherit", textAlign: "center",
  },
  detailSection: { marginBottom: "16px" },
  detailSectionTitle: {
    color: "#444444", fontSize: "11px", fontWeight: "600",
    marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px",
  },
  detailDesc: {
    color: "#cccccc", fontSize: "13px", lineHeight: "1.7",
    backgroundColor: "#1a1a1a", border: "1px solid #222222",
    borderRadius: "10px", padding: "12px",
  },
  detailMeta: {
    backgroundColor: "#1a1a1a", border: "1px solid #222222",
    borderRadius: "12px", padding: "16px",
    display: "flex", flexDirection: "column", gap: "10px",
  },
  metaRow: { display: "flex", justifyContent: "space-between" },
  metaLabel: { color: "#444444", fontSize: "12px" },
  metaValue: {
    color: "#e0e0e0", fontSize: "12px", fontWeight: "500",
    textAlign: "right", maxWidth: "160px",
  },
  detailEmpty: {
    height: "100%", display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    gap: "12px", textAlign: "center", padding: "40px",
  },
  detailEmptyText: { color: "#333333", fontSize: "13px" },
};

export default AdminFundRequests;