import { useState, useEffect } from "react";
import axios from "axios";
import useAuth from "../../hooks/useAuth";
import Navbar from "../../components/Navbar";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [funds, setFunds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [reportsRes, fundsRes] = await Promise.all([
          axios.get("http://localhost:3001/api/admin/reports", { headers: { Authorization: `Bearer ${token}` } }),
          axios.get("http://localhost:3001/api/admin/fund-requests", { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        setReports(reportsRes.data);
        setFunds(fundsRes.data);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    fetchData();
  }, [token]);

  const stats = {
    totalReports: reports.length,
    pendingReports: reports.filter(r => r.status === "Pending").length,
    verifiedReports: reports.filter(r => r.status === "Verified").length,
    resolvedReports: reports.filter(r => r.status === "Resolved").length,
    totalFunds: funds.length,
    pendingFunds: funds.filter(f => f.status === "Pending").length,
    approvedFunds: funds.filter(f => f.status === "Approved").length,
    rejectedFunds: funds.filter(f => f.status === "Rejected").length,
    totalAmountRequested: funds.reduce((sum, f) => sum + f.amountNeeded, 0),
  };

  const emergencyTypeCounts = reports.reduce((acc, r) => {
    acc[r.emergencyType] = (acc[r.emergencyType] || 0) + 1;
    return acc;
  }, {});

  const typeConfig = {
    robbery: { icon: "🔫", color: "#ff6b6b", label: "Robbery" },
    fire: { icon: "🔥", color: "#ff9f43", label: "Fire" },
    accident: { icon: "🚗", color: "#ffd93d", label: "Accident" },
    harassment: { icon: "⚠️", color: "#a29bfe", label: "Harassment" },
    medical: { icon: "🏥", color: "#00ff88", label: "Medical" },
  };

  const recentReports = [...reports].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
  const recentFunds = [...funds].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

  if (loading) return (
    <div style={styles.loadingScreen}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={styles.spinner}></div>
      <p style={styles.loadingText}>Loading dashboard...</p>
    </div>
  );

  return (
    <div style={styles.page}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes glow { 0%,100% { box-shadow: 0 0 20px rgba(0,255,136,0.2); } 50% { box-shadow: 0 0 40px rgba(0,255,136,0.5); } }
        @keyframes fillBar { from { width: 0%; } to { width: var(--w); } }
        @keyframes countUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

        .stat-card { transition: all 0.3s ease !important; }
        .stat-card:hover { transform: translateY(-4px) !important; box-shadow: 0 16px 40px rgba(0,0,0,0.3) !important; }

        .action-btn { transition: all 0.3s ease !important; }
        .action-btn:hover { transform: translateY(-2px) !important; box-shadow: 0 8px 20px rgba(0,255,136,0.3) !important; }

        .recent-row { transition: all 0.3s ease !important; }
        .recent-row:hover { background: rgba(0,255,136,0.04) !important; transform: translateX(4px) !important; }

        .type-bar-item { transition: all 0.3s ease !important; }
        .type-bar-item:hover { transform: translateX(4px) !important; }
      `}</style>

      <Navbar />

      <div style={styles.layout}>

        {/* LEFT SIDEBAR */}
        <div style={styles.sidebar}>
          <div style={styles.sidebarContent}>

            {/* Admin Info */}
            <div style={styles.adminInfo}>
              <div style={styles.adminAvatar}>A</div>
              <div>
                <p style={styles.adminName}>Admin Panel</p>
                <p style={styles.adminRole}>⚡ ADMINISTRATOR</p>
              </div>
            </div>

            {/* Quick Nav */}
            <div style={styles.quickNav}>
              <p style={styles.navLabel}>QUICK ACCESS</p>
              {[
                { icon: "📊", label: "Dashboard", path: "/admin/dashboard", active: true },
                { icon: "🚨", label: "All Reports", path: "/admin/reports" },
                { icon: "💰", label: "Fund Requests", path: "/admin/fund-requests" },
              ].map((item, i) => (
                <button
                  key={i}
                  style={{ ...styles.navBtn, ...(item.active ? styles.navBtnActive : {}) }}
                  onClick={() => navigate(item.path)}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>

            {/* System Status */}
            <div style={styles.systemStatus}>
              <p style={styles.navLabel}>SYSTEM STATUS</p>
              {[
                { label: "Server", status: "Online", color: "#00ff88" },
                { label: "Database", status: "Connected", color: "#00ff88" },
                { label: "Notifications", status: "Phase 3", color: "#ffaa00" },
              ].map((item, i) => (
                <div key={i} style={styles.statusRow}>
                  <span style={styles.statusLabel}>{item.label}</span>
                  <span style={{ ...styles.statusValue, color: item.color }}>● {item.status}</span>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div style={styles.summaryBox}>
              <p style={styles.navLabel}>SUMMARY</p>
              <div style={styles.summaryItem}>
                <span style={styles.summaryLabel}>Total Reports</span>
                <span style={styles.summaryValue}>{stats.totalReports}</span>
              </div>
              <div style={styles.summaryItem}>
                <span style={styles.summaryLabel}>Total Fund Requests</span>
                <span style={styles.summaryValue}>{stats.totalFunds}</span>
              </div>
              <div style={styles.summaryItem}>
                <span style={styles.summaryLabel}>Total Requested</span>
                <span style={{ ...styles.summaryValue, color: "#00ff88" }}>৳{stats.totalAmountRequested.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div style={styles.main}>

          {/* Welcome Banner */}
          <div style={styles.welcomeBanner}>
            <div style={styles.bannerOverlay}></div>
            <div style={styles.bannerContent}>
              <div>
                <h1 style={styles.welcomeTitle}>Admin Dashboard 📊</h1>
                <p style={styles.welcomeSubtitle}>
                  {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                </p>
              </div>
              <div style={styles.bannerStats}>
                <div style={styles.bannerStat}>
                  <span style={styles.bannerStatValue}>{stats.pendingReports}</span>
                  <span style={styles.bannerStatLabel}>Pending Reports</span>
                </div>
                <div style={styles.bannerStatDivider}></div>
                <div style={styles.bannerStat}>
                  <span style={styles.bannerStatValue}>{stats.pendingFunds}</span>
                  <span style={styles.bannerStatLabel}>Pending Funds</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div style={styles.statsGrid}>
            {[
              { icon: "🚨", label: "Total Reports", value: stats.totalReports, color: "#ff6b6b", sub: `${stats.pendingReports} pending` },
              { icon: "✅", label: "Verified Reports", value: stats.verifiedReports, color: "#00ff88", sub: `${stats.resolvedReports} resolved` },
              { icon: "💰", label: "Fund Requests", value: stats.totalFunds, color: "#ffd93d", sub: `${stats.pendingFunds} pending` },
              { icon: "✔️", label: "Approved Funds", value: stats.approvedFunds, color: "#6bcbff", sub: `${stats.rejectedFunds} rejected` },
            ].map((stat, i) => (
              <div key={i} className="stat-card" style={styles.statCard}>
                <div style={{ ...styles.statIconCircle, backgroundColor: `${stat.color}12`, border: `1px solid ${stat.color}25` }}>
                  <span style={styles.statIcon}>{stat.icon}</span>
                </div>
                <div style={styles.statInfo}>
                  <p style={{ ...styles.statValue, color: stat.color }}>{stat.value}</p>
                  <p style={styles.statLabel}>{stat.label}</p>
                  <p style={styles.statSub}>{stat.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Middle Row */}
          <div style={styles.middleRow}>

            {/* Emergency Type Breakdown */}
            <div style={styles.breakdownCard}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>📊 Emergency Breakdown</h3>
                <span style={styles.cardSubtitle}>{stats.totalReports} total</span>
              </div>
              {Object.entries(typeConfig).map(([key, val]) => {
                const count = emergencyTypeCounts[key] || 0;
                const percent = stats.totalReports ? Math.round((count / stats.totalReports) * 100) : 0;
                return (
                  <div key={key} className="type-bar-item" style={styles.typeBarItem}>
                    <div style={styles.typeBarTop}>
                      <span style={styles.typeBarLabel}>{val.icon} {val.label}</span>
                      <span style={{ ...styles.typeBarCount, color: val.color }}>{count}</span>
                    </div>
                    <div style={styles.typeBarBg}>
                      <div style={{
                        ...styles.typeBarFill,
                        width: `${percent}%`,
                        backgroundColor: val.color,
                      }}></div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Fund Overview */}
            <div style={styles.fundOverviewCard}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>💰 Fund Overview</h3>
              </div>
              <div style={styles.amountHighlight}>
                <p style={styles.amountLabel}>Total Amount Requested</p>
                <p style={styles.amountValue}>৳ {stats.totalAmountRequested.toLocaleString()}</p>
              </div>
              <div style={styles.fundStats}>
                {[
                  { label: "Pending Review", value: stats.pendingFunds, color: "#ffaa00", icon: "⏳" },
                  { label: "Approved", value: stats.approvedFunds, color: "#00ff88", icon: "✅" },
                  { label: "Rejected", value: stats.rejectedFunds, color: "#ff4444", icon: "❌" },
                ].map((item, i) => (
                  <div key={i} style={styles.fundStatItem}>
                    <div style={{ ...styles.fundStatIcon, backgroundColor: `${item.color}10` }}>
                      {item.icon}
                    </div>
                    <div style={styles.fundStatInfo}>
                      <span style={{ ...styles.fundStatValue, color: item.color }}>{item.value}</span>
                      <span style={styles.fundStatLabel}>{item.label}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Actions */}
              <div style={styles.quickActions}>
                <p style={styles.navLabel}>QUICK ACTIONS</p>
                <button
                  className="action-btn"
                  style={styles.actionBtn}
                  onClick={() => navigate("/admin/reports")}
                >
                  🚨 Manage Reports
                </button>
                <button
                  className="action-btn"
                  style={{ ...styles.actionBtn, ...styles.actionBtnSecondary }}
                  onClick={() => navigate("/admin/fund-requests")}
                >
                  💰 Manage Fund Requests
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Row */}
          <div style={styles.bottomRow}>

            {/* Recent Reports */}
            <div style={styles.recentCard}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>🚨 Recent Reports</h3>
                <button
                  style={styles.viewAllBtn}
                  onClick={() => navigate("/admin/reports")}
                >
                  View All →
                </button>
              </div>
              {recentReports.length === 0 ? (
                <div style={styles.emptySmall}>No reports yet</div>
              ) : (
                recentReports.map((report, i) => {
                  const type = typeConfig[report.emergencyType] || {};
                  const statusColors = { Pending: "#ffaa00", Verified: "#00ff88", Resolved: "#6bcbff" };
                  return (
                    <div key={report._id} className="recent-row" style={styles.recentRow}>
                      <div style={{ ...styles.recentIcon, backgroundColor: `${type.color}12` }}>
                        {type.icon}
                      </div>
                      <div style={styles.recentInfo}>
                        <p style={styles.recentTitle}>{type.label} — {report.userId?.name || "Unknown"}</p>
                        <p style={styles.recentDesc}>{report.description?.substring(0, 50)}...</p>
                      </div>
                      <div style={styles.recentRight}>
                        <span style={{ ...styles.recentStatus, color: statusColors[report.status] }}>
                          ● {report.status}
                        </span>
                        <span style={styles.recentDate}>
                          {new Date(report.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Recent Fund Requests */}
            <div style={styles.recentCard}>
              <div style={styles.cardHeader}>
                <h3 style={styles.cardTitle}>💰 Recent Fund Requests</h3>
                <button
                  style={styles.viewAllBtn}
                  onClick={() => navigate("/admin/fund-requests")}
                >
                  View All →
                </button>
              </div>
              {recentFunds.length === 0 ? (
                <div style={styles.emptySmall}>No fund requests yet</div>
              ) : (
                recentFunds.map((fund, i) => {
                  const statusColors = { Pending: "#ffaa00", Approved: "#00ff88", Rejected: "#ff4444" };
                  return (
                    <div key={fund._id} className="recent-row" style={styles.recentRow}>
                      <div style={styles.recentIcon}>💰</div>
                      <div style={styles.recentInfo}>
                        <p style={styles.recentTitle}>{fund.title}</p>
                        <p style={styles.recentDesc}>{fund.userId?.name || "Unknown"}</p>
                      </div>
                      <div style={styles.recentRight}>
                        <span style={{ color: "#00ff88", fontSize: "13px", fontWeight: "700" }}>
                          ৳{fund.amountNeeded.toLocaleString()}
                        </span>
                        <span style={{ ...styles.recentStatus, color: statusColors[fund.status] }}>
                          ● {fund.status}
                        </span>
                      </div>
                    </div>
                  );
                })
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

  // SIDEBAR
  sidebar: {
    width: "240px", minWidth: "240px",
    backgroundColor: "#0d0d0d",
    borderRight: "1px solid #1e1e1e",
    overflowY: "auto",
  },
  sidebarContent: {
    padding: "28px 20px",
    display: "flex", flexDirection: "column", gap: "24px",
  },
  adminInfo: {
    display: "flex", alignItems: "center", gap: "12px",
    paddingBottom: "20px", borderBottom: "1px solid #1e1e1e",
  },
  adminAvatar: {
    width: "44px", height: "44px",
    background: "linear-gradient(135deg, #00ff88, #00cc6a)",
    borderRadius: "12px",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "20px", fontWeight: "700", color: "#0a0a0a",
    animation: "glow 3s ease-in-out infinite",
  },
  adminName: { color: "#ffffff", fontSize: "14px", fontWeight: "700" },
  adminRole: { color: "#00ff88", fontSize: "10px", fontWeight: "700", letterSpacing: "1px", marginTop: "2px" },
  quickNav: { display: "flex", flexDirection: "column", gap: "8px" },
  navLabel: {
    color: "#333333", fontSize: "10px",
    fontWeight: "700", letterSpacing: "1px", marginBottom: "4px",
  },
  navBtn: {
    display: "flex", alignItems: "center", gap: "10px",
    padding: "10px 12px", borderRadius: "10px",
    border: "none", backgroundColor: "transparent",
    color: "#666666", fontSize: "13px", fontWeight: "500",
    cursor: "pointer", width: "100%", textAlign: "left",
    transition: "all 0.3s ease", fontFamily: "inherit",
  },
  navBtnActive: {
    backgroundColor: "rgba(0,255,136,0.1)",
    color: "#00ff88", borderLeft: "3px solid #00ff88",
  },
  systemStatus: { display: "flex", flexDirection: "column", gap: "8px" },
  statusRow: {
    display: "flex", justifyContent: "space-between",
    alignItems: "center", padding: "6px 0",
    borderBottom: "1px solid #1a1a1a",
  },
  statusLabel: { color: "#555555", fontSize: "12px" },
  statusValue: { fontSize: "11px", fontWeight: "600" },
  summaryBox: {
    backgroundColor: "#1a1a1a", border: "1px solid #222222",
    borderRadius: "12px", padding: "16px",
    display: "flex", flexDirection: "column", gap: "10px",
  },
  summaryItem: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  summaryLabel: { color: "#555555", fontSize: "12px" },
  summaryValue: { color: "#e0e0e0", fontSize: "13px", fontWeight: "700" },

  // MAIN
  main: {
    flex: 1, padding: "28px",
    display: "flex", flexDirection: "column", gap: "24px",
    overflowY: "auto",
  },

  // WELCOME BANNER
  welcomeBanner: {
    background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
    borderRadius: "16px", padding: "32px",
    border: "1px solid rgba(0,255,136,0.15)",
    position: "relative", overflow: "hidden",
    boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
  },
  bannerOverlay: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    background: "radial-gradient(circle at top right, rgba(0,255,136,0.08) 0%, transparent 60%)",
    pointerEvents: "none",
  },
  bannerContent: {
    display: "flex", justifyContent: "space-between",
    alignItems: "center", position: "relative", zIndex: 1,
  },
  welcomeTitle: { color: "#ffffff", fontSize: "26px", fontWeight: "700", marginBottom: "8px" },
  welcomeSubtitle: { color: "rgba(255,255,255,0.4)", fontSize: "13px" },
  bannerStats: {
    display: "flex", alignItems: "center", gap: "24px",
    backgroundColor: "rgba(0,0,0,0.2)", borderRadius: "12px", padding: "16px 24px",
    border: "1px solid rgba(255,255,255,0.05)",
  },
  bannerStat: { display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" },
  bannerStatValue: { color: "#00ff88", fontSize: "28px", fontWeight: "700" },
  bannerStatLabel: { color: "rgba(255,255,255,0.4)", fontSize: "12px" },
  bannerStatDivider: { width: "1px", height: "40px", backgroundColor: "rgba(255,255,255,0.1)" },

  // STATS GRID
  statsGrid: {
    display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px",
  },
  statCard: {
    backgroundColor: "#1a1a1a", border: "1px solid #222222",
    borderRadius: "14px", padding: "20px",
    display: "flex", alignItems: "center", gap: "16px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
  },
  statIconCircle: {
    width: "48px", height: "48px", borderRadius: "12px",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  statIcon: { fontSize: "22px" },
  statInfo: { display: "flex", flexDirection: "column", gap: "2px" },
  statValue: { fontSize: "24px", fontWeight: "700" },
  statLabel: { color: "#888888", fontSize: "12px", fontWeight: "500" },
  statSub: { color: "#444444", fontSize: "11px" },

  // MIDDLE ROW
  middleRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" },

  // BREAKDOWN CARD
  breakdownCard: {
    backgroundColor: "#1a1a1a", border: "1px solid #222222",
    borderRadius: "16px", padding: "24px",
    display: "flex", flexDirection: "column", gap: "16px",
  },
  cardHeader: {
    display: "flex", justifyContent: "space-between",
    alignItems: "center", marginBottom: "4px",
  },
  cardTitle: { color: "#ffffff", fontSize: "15px", fontWeight: "700" },
  cardSubtitle: { color: "#444444", fontSize: "12px" },
  typeBarItem: {
    display: "flex", flexDirection: "column", gap: "6px",
    padding: "6px 0", borderRadius: "8px",
  },
  typeBarTop: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  typeBarLabel: { color: "#aaaaaa", fontSize: "13px" },
  typeBarCount: { fontSize: "13px", fontWeight: "700" },
  typeBarBg: {
    height: "6px", backgroundColor: "#222222",
    borderRadius: "3px", overflow: "hidden",
  },
  typeBarFill: {
    height: "100%", borderRadius: "3px",
    transition: "width 0.8s ease",
  },

  // FUND OVERVIEW CARD
  fundOverviewCard: {
    backgroundColor: "#1a1a1a", border: "1px solid #222222",
    borderRadius: "16px", padding: "24px",
    display: "flex", flexDirection: "column", gap: "20px",
  },
  amountHighlight: {
    backgroundColor: "rgba(0,255,136,0.06)",
    border: "1px solid rgba(0,255,136,0.15)",
    borderRadius: "12px", padding: "16px",
  },
  amountLabel: { color: "#555555", fontSize: "12px", marginBottom: "6px" },
  amountValue: { color: "#00ff88", fontSize: "26px", fontWeight: "700" },
  fundStats: { display: "flex", flexDirection: "column", gap: "10px" },
  fundStatItem: {
    display: "flex", alignItems: "center", gap: "12px",
    padding: "10px 12px",
    backgroundColor: "#222222", borderRadius: "10px",
  },
  fundStatIcon: {
    width: "32px", height: "32px", borderRadius: "8px",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "14px",
  },
  fundStatInfo: { display: "flex", flexDirection: "column", gap: "2px" },
  fundStatValue: { fontSize: "16px", fontWeight: "700" },
  fundStatLabel: { color: "#555555", fontSize: "11px" },
  quickActions: { display: "flex", flexDirection: "column", gap: "10px" },
  actionBtn: {
    backgroundColor: "#00ff88", color: "#0a0a0a",
    border: "none", padding: "12px",
    borderRadius: "10px", fontSize: "13px",
    fontWeight: "700", cursor: "pointer",
    width: "100%", fontFamily: "inherit",
  },
  actionBtnSecondary: {
    backgroundColor: "transparent",
    border: "1px solid #00ff88", color: "#00ff88",
  },

  // BOTTOM ROW
  bottomRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" },
  recentCard: {
    backgroundColor: "#1a1a1a", border: "1px solid #222222",
    borderRadius: "16px", padding: "24px",
    display: "flex", flexDirection: "column", gap: "4px",
  },
  viewAllBtn: {
    backgroundColor: "transparent", border: "none",
    color: "#00ff88", fontSize: "12px",
    cursor: "pointer", fontFamily: "inherit",
    transition: "opacity 0.3s ease",
  },
  recentRow: {
    display: "flex", alignItems: "center", gap: "12px",
    padding: "12px 8px", borderRadius: "10px",
    borderBottom: "1px solid #1e1e1e", cursor: "default",
  },
  recentIcon: {
    width: "36px", height: "36px",
    backgroundColor: "rgba(0,255,136,0.08)",
    borderRadius: "10px",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "16px", flexShrink: 0,
  },
  recentInfo: { flex: 1, minWidth: 0 },
  recentTitle: {
    color: "#e0e0e0", fontSize: "13px",
    fontWeight: "600", marginBottom: "2px",
    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
  },
  recentDesc: {
    color: "#555555", fontSize: "11px",
    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
  },
  recentRight: {
    display: "flex", flexDirection: "column",
    alignItems: "flex-end", gap: "4px", flexShrink: 0,
  },
  recentStatus: { fontSize: "11px", fontWeight: "600" },
  recentDate: { color: "#444444", fontSize: "11px" },
  emptySmall: {
    color: "#444444", fontSize: "13px",
    textAlign: "center", padding: "24px",
  },
};

export default AdminDashboard;