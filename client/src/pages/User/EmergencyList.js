import { useState, useEffect } from "react";
import axios from "axios";
import useAuth from "../../hooks/useAuth";
import Navbar from "../../components/Navbar";
import { useNavigate } from "react-router-dom";

const statusConfig = {
  Pending: { color: "#ffaa00", bg: "rgba(255,170,0,0.08)", icon: "⏳", label: "Pending Review" },
  Approved: { color: "#00ff88", bg: "rgba(0,255,136,0.08)", icon: "✅", label: "Approved" },
  Rejected: { color: "#ff4444", bg: "rgba(255,68,68,0.08)", icon: "❌", label: "Rejected" },
};

const categoryConfig = {
  medical: { icon: "🏥", color: "#00ff88", label: "Medical" },
  disaster: { icon: "🌊", color: "#6bcbff", label: "Disaster Relief" },
  education: { icon: "📚", color: "#ffd93d", label: "Education" },
  food: { icon: "🏠", color: "#ff9f43", label: "Food & Shelter" },
  other: { icon: "💡", color: "#a29bfe", label: "Other" },
};

const FundRequestList = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await axios.get("http://localhost:3001/api/fund/my-requests", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRequests(res.data);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    fetchRequests();
  }, [token]);

  const filtered = requests
    .filter(r => {
      const matchFilter = filter === "all" || r.status === filter;
      const matchSearch =
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        r.description.toLowerCase().includes(search.toLowerCase());
      return matchFilter && matchSearch;
    })
    .sort((a, b) => {
      if (sortBy === "newest") return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === "oldest") return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === "highest") return b.amountNeeded - a.amountNeeded;
      if (sortBy === "lowest") return a.amountNeeded - b.amountNeeded;
      return 0;
    });

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === "Pending").length,
    approved: requests.filter(r => r.status === "Approved").length,
    rejected: requests.filter(r => r.status === "Rejected").length,
    totalAmount: requests.reduce((sum, r) => sum + r.amountNeeded, 0),
  };

  if (loading) return (
    <div style={styles.loadingScreen}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={styles.spinner}></div>
      <p style={styles.loadingText}>Loading your fund requests...</p>
    </div>
  );

  return (
    <div style={styles.page}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes slideLeft { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes fillBar { from { width: 0%; } to { width: 100%; } }

        .request-card { transition: all 0.3s ease !important; }
        .request-card:hover { transform: translateY(-2px) !important; border-color: rgba(0,255,136,0.2) !important; box-shadow: 0 12px 30px rgba(0,0,0,0.3) !important; }
        .request-card.selected { border-color: #00ff88 !important; background: rgba(0,255,136,0.04) !important; }

        .filter-btn { transition: all 0.3s ease !important; }
        .filter-btn:hover { color: #00ff88 !important; border-color: rgba(0,255,136,0.3) !important; }

        .new-btn { transition: all 0.3s ease !important; }
        .new-btn:hover { transform: translateY(-2px) !important; box-shadow: 0 8px 20px rgba(0,255,136,0.3) !important; }

        input:focus { border-color: #00ff88 !important; box-shadow: 0 0 0 3px rgba(0,255,136,0.1) !important; outline: none !important; }
        select:focus { border-color: #00ff88 !important; outline: none !important; }
      `}</style>

      <Navbar />

      <div style={styles.layout}>

        {/* LEFT PANEL */}
        <div style={styles.leftPanel}>

          {/* Header */}
          <div style={styles.leftHeader}>
            <div>
              <h2 style={styles.leftTitle}>Fund Requests</h2>
              <p style={styles.leftSubtitle}>{requests.length} total requests</p>
            </div>
            <button
              className="new-btn"
              style={styles.newBtn}
              onClick={() => navigate("/user/fund")}
            >
              + New
            </button>
          </div>

          {/* Search */}
          <div style={styles.searchBox}>
            <span style={styles.searchIcon}>🔍</span>
            <input
              type="text"
              placeholder="Search requests..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={styles.searchInput}
            />
          </div>

          {/* Sort */}
          <div style={styles.sortBox}>
            <p style={styles.sectionLabel}>SORT BY</p>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              style={styles.select}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest">Highest Amount</option>
              <option value="lowest">Lowest Amount</option>
            </select>
          </div>

          {/* Filters */}
          <div style={styles.filterSection}>
            <p style={styles.sectionLabel}>FILTER BY STATUS</p>
            <div style={styles.filterBtns}>
              {["all", "Pending", "Approved", "Rejected"].map(f => (
                <button
                  key={f}
                  className="filter-btn"
                  style={{ ...styles.filterBtn, ...(filter === f ? styles.filterActive : {}) }}
                  onClick={() => setFilter(f)}
                >
                  <span>
                    {f === "all" ? "🗂 All Requests" : `${statusConfig[f]?.icon} ${f}`}
                  </span>
                  <span style={styles.filterCount}>
                    {f === "all" ? requests.length : requests.filter(r => r.status === f).length}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div style={styles.statsBox}>
            <p style={styles.sectionLabel}>OVERVIEW</p>
            <div style={styles.statsGrid}>
              {[
                { label: "Total", value: stats.total, color: "#e0e0e0" },
                { label: "Pending", value: stats.pending, color: "#ffaa00" },
                { label: "Approved", value: stats.approved, color: "#00ff88" },
                { label: "Rejected", value: stats.rejected, color: "#ff4444" },
              ].map((s, i) => (
                <div key={i} style={styles.statItem}>
                  <span style={{ ...styles.statValue, color: s.color }}>{s.value}</span>
                  <span style={styles.statLabel}>{s.label}</span>
                </div>
              ))}
            </div>
            <div style={styles.totalAmountBox}>
              <span style={styles.totalAmountLabel}>Total Requested</span>
              <span style={styles.totalAmountValue}>৳ {stats.totalAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* MIDDLE PANEL */}
        <div style={styles.middlePanel}>
          {filtered.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>💰</div>
              <h3 style={styles.emptyTitle}>No Requests Found</h3>
              <p style={styles.emptyText}>
                {search ? "Try a different search term" : "You haven't submitted any fund requests yet"}
              </p>
              <button
                className="new-btn"
                style={styles.emptyBtn}
                onClick={() => navigate("/user/fund")}
              >
                💰 Submit First Request
              </button>
            </div>
          ) : (
            <div style={styles.requestList}>
              {filtered.map((req, index) => {
                const status = statusConfig[req.status] || {};
                return (
                  <div
                    key={req._id}
                    className={`request-card ${selectedRequest?._id === req._id ? "selected" : ""}`}
                    style={{ ...styles.requestCard, animationDelay: `${index * 0.05}s` }}
                    onClick={() => setSelectedRequest(selectedRequest?._id === req._id ? null : req)}
                  >
                    <div style={styles.cardTop}>
                      <div style={styles.cardLeft}>
                        <div style={styles.cardIconBox}>
                          <span style={styles.cardIcon}>💰</span>
                        </div>
                        <div>
                          <p style={styles.cardTitle}>{req.title}</p>
                          <p style={styles.cardDate}>
                            {new Date(req.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </p>
                        </div>
                      </div>
                      <div style={{
                        ...styles.statusBadge,
                        color: status.color,
                        backgroundColor: status.bg,
                        border: `1px solid ${status.color}30`,
                      }}>
                        {status.icon} {req.status}
                      </div>
                    </div>

                    <p style={styles.cardDesc}>
                      {req.description.substring(0, 90)}{req.description.length > 90 ? "..." : ""}
                    </p>

                    <div style={styles.cardBottom}>
                      <span style={styles.cardAmount}>৳ {req.amountNeeded.toLocaleString()}</span>
                      <span style={styles.cardArrow}>→</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT PANEL - Detail */}
        <div style={styles.rightPanel}>
          {selectedRequest ? (
            <div style={{ animation: "slideIn 0.3s ease" }}>

              <div style={styles.detailHeader}>
                <h3 style={styles.detailTitle}>Request Details</h3>
                <button style={styles.closeBtn} onClick={() => setSelectedRequest(null)}>✕</button>
              </div>

              {/* Status Banner */}
              <div style={{
                ...styles.statusBanner,
                backgroundColor: statusConfig[selectedRequest.status]?.bg,
                border: `1px solid ${statusConfig[selectedRequest.status]?.color}30`,
              }}>
                <span style={styles.statusBannerIcon}>{statusConfig[selectedRequest.status]?.icon}</span>
                <div>
                  <p style={{ color: statusConfig[selectedRequest.status]?.color, fontWeight: "700", fontSize: "15px" }}>
                    {statusConfig[selectedRequest.status]?.label}
                  </p>
                  <p style={styles.statusBannerDesc}>Current Status</p>
                </div>
              </div>

              {/* Amount Highlight */}
              <div style={styles.amountHighlight}>
                <p style={styles.amountHighlightLabel}>Amount Requested</p>
                <p style={styles.amountHighlightValue}>৳ {selectedRequest.amountNeeded.toLocaleString()}</p>
                <div style={styles.progressBg}>
                  <div style={{
                    ...styles.progressFill,
                    width: `${Math.min((selectedRequest.amountNeeded / 100000) * 100, 100)}%`,
                  }}></div>
                </div>
              </div>

              {/* Title */}
              <div style={styles.detailSection}>
                <p style={styles.detailSectionTitle}>📌 Title</p>
                <p style={styles.detailTitleText}>{selectedRequest.title}</p>
              </div>

              {/* Description */}
              <div style={styles.detailSection}>
                <p style={styles.detailSectionTitle}>📝 Description</p>
                <p style={styles.detailDescText}>{selectedRequest.description}</p>
              </div>

              {/* Meta Info */}
              <div style={styles.metaCard}>
                {[
                  { label: "Submitted", value: new Date(selectedRequest.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) },
                  { label: "Time", value: new Date(selectedRequest.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) },
                  { label: "Last Updated", value: new Date(selectedRequest.updatedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) },
                ].map((item, i) => (
                  <div key={i} style={styles.metaRow}>
                    <span style={styles.metaLabel}>{item.label}</span>
                    <span style={styles.metaValue}>{item.value}</span>
                  </div>
                ))}
              </div>

              {/* ID */}
              <div style={styles.idBox}>
                <span style={styles.idLabel}>Request ID</span>
                <span style={styles.idValue}>{selectedRequest._id}</span>
              </div>

              {/* Status Message */}
              {selectedRequest.status === "Pending" && (
                <div style={styles.pendingNote}>
                  ⏳ Your request is awaiting admin review. You'll be notified once it's processed.
                </div>
              )}
              {selectedRequest.status === "Approved" && (
                <div style={styles.approvedNote}>
                  ✅ Your request has been approved and is now visible to donors.
                </div>
              )}
              {selectedRequest.status === "Rejected" && (
                <div style={styles.rejectedNote}>
                  ❌ Your request was not approved. Consider resubmitting with more details.
                </div>
              )}
            </div>
          ) : (
            <div style={styles.detailEmpty}>
              <div style={styles.detailEmptyIcon}>👆</div>
              <p style={styles.detailEmptyText}>Click on a request to view its details</p>
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
  layout: { display: "flex", minHeight: "calc(100vh - 70px)" },

  // LEFT PANEL
  leftPanel: {
    width: "260px", minWidth: "260px",
    backgroundColor: "#0d0d0d",
    borderRight: "1px solid #1e1e1e",
    padding: "28px 20px",
    display: "flex", flexDirection: "column", gap: "20px",
    overflowY: "auto",
  },
  leftHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
  },
  leftTitle: { color: "#ffffff", fontSize: "18px", fontWeight: "700" },
  leftSubtitle: { color: "#555555", fontSize: "12px", marginTop: "4px" },
  newBtn: {
    backgroundColor: "#00ff88", color: "#0a0a0a",
    border: "none", padding: "8px 14px",
    borderRadius: "8px", fontSize: "13px",
    fontWeight: "700", cursor: "pointer", flexShrink: 0,
  },
  searchBox: {
    display: "flex", alignItems: "center", gap: "10px",
    backgroundColor: "#1a1a1a", border: "1px solid #222222",
    borderRadius: "10px", padding: "10px 14px",
  },
  searchIcon: { fontSize: "14px", flexShrink: 0 },
  searchInput: {
    backgroundColor: "transparent", border: "none",
    color: "#e0e0e0", fontSize: "13px", width: "100%",
    outline: "none", fontFamily: "inherit",
  },
  sortBox: { display: "flex", flexDirection: "column", gap: "8px" },
  sectionLabel: {
    color: "#333333", fontSize: "10px",
    fontWeight: "700", letterSpacing: "1px",
  },
  select: {
    backgroundColor: "#1a1a1a", border: "1px solid #222222",
    color: "#e0e0e0", padding: "10px 12px",
    borderRadius: "8px", fontSize: "13px",
    cursor: "pointer", width: "100%", fontFamily: "inherit",
    transition: "all 0.3s ease",
  },
  filterSection: { display: "flex", flexDirection: "column", gap: "8px" },
  filterBtns: { display: "flex", flexDirection: "column", gap: "4px" },
  filterBtn: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "9px 12px", borderRadius: "8px",
    border: "1px solid transparent",
    backgroundColor: "transparent", color: "#666666",
    fontSize: "13px", cursor: "pointer", width: "100%",
    fontFamily: "inherit",
  },
  filterActive: {
    backgroundColor: "rgba(0,255,136,0.08)",
    border: "1px solid rgba(0,255,136,0.2)",
    color: "#00ff88",
  },
  filterCount: {
    backgroundColor: "#222222", color: "#555555",
    fontSize: "11px", fontWeight: "600",
    padding: "2px 8px", borderRadius: "10px",
  },
  statsBox: {
    display: "flex", flexDirection: "column", gap: "12px",
    backgroundColor: "#1a1a1a", border: "1px solid #222222",
    borderRadius: "12px", padding: "16px", marginTop: "auto",
  },
  statsGrid: {
    display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px",
  },
  statItem: { display: "flex", flexDirection: "column", gap: "2px", alignItems: "center" },
  statValue: { fontSize: "20px", fontWeight: "700" },
  statLabel: { color: "#444444", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.5px" },
  totalAmountBox: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    borderTop: "1px solid #222222", paddingTop: "12px",
  },
  totalAmountLabel: { color: "#555555", fontSize: "12px" },
  totalAmountValue: { color: "#00ff88", fontSize: "15px", fontWeight: "700" },

  // MIDDLE PANEL
  middlePanel: {
    flex: 1, overflowY: "auto",
    borderRight: "1px solid #1e1e1e",
  },
  emptyState: {
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    height: "100%", gap: "16px", padding: "60px 20px", textAlign: "center",
  },
  emptyIcon: { fontSize: "56px", marginBottom: "8px" },
  emptyTitle: { color: "#ffffff", fontSize: "18px", fontWeight: "600" },
  emptyText: { color: "#555555", fontSize: "14px", lineHeight: "1.6" },
  emptyBtn: {
    backgroundColor: "#00ff88", color: "#0a0a0a",
    border: "none", padding: "12px 24px",
    borderRadius: "10px", fontSize: "14px",
    fontWeight: "700", cursor: "pointer", marginTop: "8px",
  },
  requestList: { display: "flex", flexDirection: "column" },
  requestCard: {
    padding: "20px 24px",
    borderBottom: "1px solid #1a1a1a",
    cursor: "pointer",
    animation: "fadeUp 0.4s ease both",
    border: "1px solid transparent",
    borderBottomColor: "#1a1a1a",
  },
  cardTop: {
    display: "flex", justifyContent: "space-between",
    alignItems: "flex-start", marginBottom: "10px", gap: "12px",
  },
  cardLeft: { display: "flex", alignItems: "center", gap: "12px" },
  cardIconBox: {
    width: "40px", height: "40px",
    backgroundColor: "rgba(0,255,136,0.1)",
    border: "1px solid rgba(0,255,136,0.2)",
    borderRadius: "10px",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  cardIcon: { fontSize: "18px" },
  cardTitle: { color: "#ffffff", fontSize: "14px", fontWeight: "600", lineHeight: "1.3" },
  cardDate: { color: "#444444", fontSize: "11px", marginTop: "3px" },
  statusBadge: {
    fontSize: "11px", fontWeight: "600",
    padding: "4px 10px", borderRadius: "20px",
    letterSpacing: "0.3px", flexShrink: 0,
  },
  cardDesc: { color: "#888888", fontSize: "13px", lineHeight: "1.6", marginBottom: "12px" },
  cardBottom: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
  },
  cardAmount: { color: "#00ff88", fontSize: "15px", fontWeight: "700" },
  cardArrow: { color: "#333333", fontSize: "14px" },

  // RIGHT PANEL
  rightPanel: {
    width: "300px", minWidth: "300px",
    backgroundColor: "#0d0d0d",
    padding: "28px 20px",
    overflowY: "auto",
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
  statusBanner: {
    display: "flex", alignItems: "center", gap: "14px",
    borderRadius: "12px", padding: "16px", marginBottom: "16px",
  },
  statusBannerIcon: { fontSize: "24px" },
  statusBannerDesc: { color: "#444444", fontSize: "11px", marginTop: "2px" },
  amountHighlight: {
    backgroundColor: "rgba(0,255,136,0.06)",
    border: "1px solid rgba(0,255,136,0.15)",
    borderRadius: "12px", padding: "16px",
    marginBottom: "20px",
    display: "flex", flexDirection: "column", gap: "10px",
  },
  amountHighlightLabel: { color: "#555555", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px" },
  amountHighlightValue: { color: "#00ff88", fontSize: "26px", fontWeight: "700" },
  progressBg: {
    height: "5px", backgroundColor: "#222222",
    borderRadius: "3px", overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    background: "linear-gradient(90deg, #00ff88, #00cc6a)",
    borderRadius: "3px",
  },
  detailSection: { marginBottom: "18px" },
  detailSectionTitle: {
    color: "#444444", fontSize: "11px",
    fontWeight: "600", marginBottom: "8px",
    textTransform: "uppercase", letterSpacing: "0.5px",
  },
  detailTitleText: {
    color: "#ffffff", fontSize: "15px",
    fontWeight: "600", lineHeight: "1.4",
  },
  detailDescText: {
    color: "#cccccc", fontSize: "13px", lineHeight: "1.7",
    backgroundColor: "#1a1a1a", border: "1px solid #222222",
    borderRadius: "10px", padding: "14px",
  },
  metaCard: {
    backgroundColor: "#1a1a1a", border: "1px solid #222222",
    borderRadius: "12px", padding: "16px",
    display: "flex", flexDirection: "column", gap: "12px",
    marginBottom: "14px",
  },
  metaRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  metaLabel: { color: "#444444", fontSize: "12px" },
  metaValue: { color: "#e0e0e0", fontSize: "12px", fontWeight: "500" },
  idBox: {
    backgroundColor: "#1a1a1a", border: "1px solid #222222",
    borderRadius: "10px", padding: "12px 14px",
    display: "flex", flexDirection: "column", gap: "4px",
    marginBottom: "16px",
  },
  idLabel: { color: "#444444", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.5px" },
  idValue: { color: "#333333", fontSize: "10px", wordBreak: "break-all" },
  pendingNote: {
    backgroundColor: "rgba(255,170,0,0.06)",
    border: "1px solid rgba(255,170,0,0.2)",
    color: "#ffaa00", padding: "12px 14px",
    borderRadius: "10px", fontSize: "12px", lineHeight: "1.6",
  },
  approvedNote: {
    backgroundColor: "rgba(0,255,136,0.06)",
    border: "1px solid rgba(0,255,136,0.2)",
    color: "#00ff88", padding: "12px 14px",
    borderRadius: "10px", fontSize: "12px", lineHeight: "1.6",
  },
  rejectedNote: {
    backgroundColor: "rgba(255,68,68,0.06)",
    border: "1px solid rgba(255,68,68,0.2)",
    color: "#ff4444", padding: "12px 14px",
    borderRadius: "10px", fontSize: "12px", lineHeight: "1.6",
  },
  detailEmpty: {
    height: "100%", display: "flex",
    flexDirection: "column", alignItems: "center",
    justifyContent: "center", gap: "12px",
    textAlign: "center", padding: "40px",
  },
  detailEmptyIcon: { fontSize: "40px", opacity: 0.3 },
  detailEmptyText: { color: "#333333", fontSize: "13px", lineHeight: "1.6" },
};

export default FundRequestList;