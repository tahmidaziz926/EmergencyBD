import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import useAuth from "../../hooks/useAuth";
import Navbar from "../../components/Navbar";
import { useNavigate } from "react-router-dom";

const EMERGENCY_TYPE_CONFIG = {
  robbery:    { icon: "🔫", color: "#ff6b6b", label: "Robbery" },
  fire:       { icon: "🔥", color: "#ff9f43", label: "Fire" },
  accident:   { icon: "💥", color: "#ffd93d", label: "Accident" },
  harassment: { icon: "⚠️", color: "#a29bfe", label: "Harassment" },
  medical:    { icon: "🏥", color: "#00bfff", label: "Medical" },
  flood:      { icon: "🌊", color: "#1e90ff", label: "Flood" },
  other:      { icon: "🚨", color: "#ff0066", label: "Other" },
};

const timeAgo = (date) => {
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
};

const AdminDashboard = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [funds, setFunds] = useState([]);
  const [loading, setLoading] = useState(true);

  // SOS state
  const [sosEvents, setSosEvents] = useState([]);
  const [sosLoading, setSosLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState(null);
  const [resolveSuccess, setResolveSuccess] = useState(null);

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

  // Fetch active SOS events
  const fetchSOS = useCallback(async () => {
    try {
      const res = await axios.get("http://localhost:3001/api/sos/active", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSosEvents(res.data);
    } catch (err) {
      console.error("SOS fetch error:", err);
    } finally {
      setSosLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchSOS();
    const interval = setInterval(fetchSOS, 15000);
    return () => clearInterval(interval);
  }, [fetchSOS]);

  // Resolve an SOS event
  const handleResolve = async (eventId, title) => {
    setResolvingId(eventId);
    try {
      await axios.patch(
        `http://localhost:3001/api/sos/${eventId}/resolve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSosEvents((prev) => prev.filter((e) => e._id !== eventId));
      setResolveSuccess(`"${title}" has been marked as resolved.`);
      setTimeout(() => setResolveSuccess(null), 4000);
    } catch (err) {
      console.error("Resolve error:", err);
    } finally {
      setResolvingId(null);
    }
  };

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
        @keyframes sosPulseRing {
          0%   { transform: scale(1);   opacity: 0.8; }
          100% { transform: scale(2.4); opacity: 0; }
        }
        @keyframes sosBlink {
          0%,100% { opacity: 1; }
          50%      { opacity: 0.3; }
        }
        @keyframes resolveSlideOut {
          from { opacity: 1; transform: translateX(0); max-height: 120px; }
          to   { opacity: 0; transform: translateX(40px); max-height: 0; padding: 0; margin: 0; }
        }
        @keyframes successPop {
          0%   { opacity: 0; transform: translateY(10px) scale(0.95); }
          60%  { transform: translateY(-2px) scale(1.02); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }

        .stat-card { transition: all 0.3s ease !important; }
        .stat-card:hover { transform: translateY(-4px) !important; box-shadow: 0 16px 40px rgba(0,0,0,0.3) !important; }

        .action-btn { transition: all 0.3s ease !important; }
        .action-btn:hover { transform: translateY(-2px) !important; box-shadow: 0 8px 20px rgba(0,255,136,0.3) !important; }

        .recent-row { transition: all 0.3s ease !important; }
        .recent-row:hover { background: rgba(0,255,136,0.04) !important; transform: translateX(4px) !important; }

        .type-bar-item { transition: all 0.3s ease !important; }
        .type-bar-item:hover { transform: translateX(4px) !important; }

        .sos-event-card {
          transition: all 0.3s ease;
          animation: fadeUp 0.4s ease both;
        }
        .sos-event-card:hover {
          border-color: rgba(255,51,51,0.4) !important;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(255,0,0,0.15) !important;
        }

        .resolve-btn {
          transition: all 0.25s ease;
          cursor: pointer;
          font-family: inherit;
        }
        .resolve-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(0,255,136,0.35) !important;
          background: #00ff88 !important;
          color: #0a0a0a !important;
        }
        .resolve-btn:active:not(:disabled) {
          transform: scale(0.97);
        }
        .resolve-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
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
                { icon: "📡", label: "Live SOS Map", path: "/sos-map" },
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

            {/* SOS quick count in sidebar */}
            {sosEvents.length > 0 && (
              <div style={{
                background: "rgba(255,0,0,0.08)",
                border: "1px solid rgba(255,0,0,0.25)",
                borderRadius: "12px", padding: "14px",
              }}>
                <p style={{ ...styles.navLabel, color: "#ff4444", marginBottom: 8 }}>🆘 ACTIVE SOS</p>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ position: "relative", width: 14, height: 14 }}>
                    <div style={{
                      position: "absolute", inset: 0, borderRadius: "50%",
                      background: "#ff3333",
                      animation: "sosBlink 1s ease-in-out infinite",
                    }} />
                  </div>
                  <span style={{ color: "#ff6666", fontWeight: 700, fontSize: 22 }}>{sosEvents.length}</span>
                  <span style={{ color: "#666", fontSize: 12 }}>event{sosEvents.length !== 1 ? "s" : ""} active</span>
                </div>
              </div>
            )}

            {/* System Status */}
            <div style={styles.systemStatus}>
              <p style={styles.navLabel}>SYSTEM STATUS</p>
              {[
                { label: "Server", status: "Online", color: "#00ff88" },
                { label: "Database", status: "Connected", color: "#00ff88" },
                { label: "SOS Events", status: sosLoading ? "Loading..." : `${sosEvents.length} Active`, color: sosEvents.length > 0 ? "#ff4444" : "#00ff88" },
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
                {sosEvents.length > 0 && (
                  <>
                    <div style={styles.bannerStatDivider}></div>
                    <div style={styles.bannerStat}>
                      <span style={{ ...styles.bannerStatValue, color: "#ff4444", animation: "sosBlink 1.5s ease-in-out infinite" }}>
                        {sosEvents.length}
                      </span>
                      <span style={styles.bannerStatLabel}>Active SOS</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* SOS MANAGEMENT PANEL */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <div style={{
            background: "linear-gradient(135deg, #1a0a0a 0%, #1e1010 100%)",
            border: "1px solid rgba(255,51,51,0.25)",
            borderRadius: "16px", padding: "24px",
            boxShadow: sosEvents.length > 0 ? "0 0 40px rgba(255,0,0,0.08)" : "none",
          }}>
            {/* Panel Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ position: "relative", width: 36, height: 36 }}>
                  <div style={{
                    position: "absolute", inset: 0, borderRadius: "50%",
                    border: "2px solid #ff3333",
                    animation: sosEvents.length > 0 ? "sosPulseRing 2s ease-out infinite" : "none",
                  }} />
                  <div style={{
                    position: "absolute", inset: 4, borderRadius: "50%",
                    background: "rgba(255,51,51,0.15)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 16,
                  }}>🆘</div>
                </div>
                <div>
                  <h3 style={{ color: "#ffffff", fontSize: 16, fontWeight: 700, margin: 0 }}>
                    SOS Event Management
                  </h3>
                  <p style={{ color: "#555", fontSize: 11, margin: "3px 0 0", letterSpacing: 0.5 }}>
                    LIVE · AUTO-REFRESHES EVERY 15s
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {sosEvents.length > 0 && (
                  <div style={{
                    display: "flex", alignItems: "center", gap: 6,
                    background: "rgba(255,51,51,0.1)", border: "1px solid rgba(255,51,51,0.3)",
                    borderRadius: 20, padding: "5px 14px",
                  }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#ff3333", animation: "sosBlink 1s ease-in-out infinite" }} />
                    <span style={{ color: "#ff6666", fontSize: 12, fontWeight: 700 }}>
                      {sosEvents.length} ACTIVE
                    </span>
                  </div>
                )}
                <button
                  onClick={() => navigate("/sos-map")}
                  style={{
                    background: "transparent", border: "1px solid #333",
                    color: "#888", padding: "7px 16px", borderRadius: 20,
                    fontSize: 12, cursor: "pointer", fontFamily: "inherit",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={e => { e.target.style.borderColor = "#00ff88"; e.target.style.color = "#00ff88"; }}
                  onMouseLeave={e => { e.target.style.borderColor = "#333"; e.target.style.color = "#888"; }}
                >
                  📡 View Live Map
                </button>
              </div>
            </div>

            {/* Resolve success toast */}
            {resolveSuccess && (
              <div style={{
                background: "rgba(0,255,136,0.08)",
                border: "1px solid rgba(0,255,136,0.3)",
                borderRadius: 10, padding: "12px 16px",
                marginBottom: 16, display: "flex", alignItems: "center", gap: 10,
                animation: "successPop 0.4s ease",
              }}>
                <span style={{ fontSize: 18 }}>✅</span>
                <span style={{ color: "#00ff88", fontSize: 13, fontWeight: 600 }}>{resolveSuccess}</span>
              </div>
            )}

            {/* SOS Events List */}
            {sosLoading ? (
              <div style={{ textAlign: "center", padding: "32px", color: "#555" }}>
                <div style={{ ...styles.spinner, margin: "0 auto 12px", borderTopColor: "#ff3333" }} />
                <p style={{ fontSize: 13 }}>Loading SOS events...</p>
              </div>
            ) : sosEvents.length === 0 ? (
              <div style={{
                textAlign: "center", padding: "40px 20px",
                border: "1px dashed #1e1e1e", borderRadius: 12,
              }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
                <p style={{ color: "#00ff88", fontWeight: 700, fontSize: 15, marginBottom: 4 }}>All Clear</p>
                <p style={{ color: "#444", fontSize: 13 }}>No active SOS events at this time.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {sosEvents.map((event, idx) => {
                  const et = EMERGENCY_TYPE_CONFIG[event.emergencyType] || EMERGENCY_TYPE_CONFIG.other;
                  const isResolving = resolvingId === event._id;
                  return (
                    <div
                      key={event._id}
                      className="sos-event-card"
                      style={{
                        background: "#111",
                        border: `1px solid ${et.color}22`,
                        borderLeft: `4px solid ${et.color}`,
                        borderRadius: 12, padding: "16px 20px",
                        display: "flex", alignItems: "center", gap: 16,
                        animationDelay: `${idx * 0.08}s`,
                        boxShadow: `0 4px 20px rgba(0,0,0,0.3)`,
                      }}
                    >
                      {/* Icon with pulse */}
                      <div style={{ position: "relative", flexShrink: 0 }}>
                        <div style={{
                          width: 48, height: 48, borderRadius: "50%",
                          background: `${et.color}18`,
                          border: `2px solid ${et.color}44`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 22,
                        }}>
                          {et.icon}
                        </div>
                        {/* live pulse ring */}
                        <div style={{
                          position: "absolute", inset: -4, borderRadius: "50%",
                          border: `1.5px solid ${et.color}`,
                          animation: "sosPulseRing 2s ease-out infinite",
                          animationDelay: `${idx * 0.3}s`,
                        }} />
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <span style={{
                            fontSize: 10, fontWeight: 700, letterSpacing: 1.5,
                            color: et.color, background: `${et.color}15`,
                            padding: "2px 8px", borderRadius: 10,
                          }}>
                            {et.label.toUpperCase()}
                          </span>
                          <span style={{
                            fontSize: 10, color: "#444",
                            fontFamily: "monospace", letterSpacing: 0.5,
                          }}>
                            {timeAgo(event.createdAt)}
                          </span>
                          <span style={{ fontSize: 10, color: "#333" }}>·</span>
                          <span style={{ fontSize: 10, color: "#444", fontFamily: "monospace" }}>
                            {event.radius}km radius
                          </span>
                          <span style={{ fontSize: 10, color: "#333" }}>·</span>
                          <span style={{ fontSize: 10, color: "#444" }}>
                            {event.notifiedUsers?.length || 0} notified
                          </span>
                        </div>
                        <p style={{
                          color: "#e0e0e0", fontWeight: 700, fontSize: 14,
                          margin: "0 0 4px",
                          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                        }}>
                          {event.title}
                        </p>
                        <p style={{
                          color: "#666", fontSize: 12, margin: "0 0 6px",
                          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                        }}>
                          {event.description}
                        </p>
                        {event.location?.address && (
                          <p style={{
                            color: "#444", fontSize: 11,
                            fontFamily: "monospace", margin: 0,
                            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                          }}>
                            📍 {event.location.address}
                          </p>
                        )}
                        {event.sender?.name && (
                          <p style={{ color: "#444", fontSize: 11, margin: "4px 0 0" }}>
                            Reported by: <span style={{ color: "#666" }}>{event.sender.name}</span>
                          </p>
                        )}
                      </div>

                      {/* Resolve button */}
                      <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                        <button
                          className="resolve-btn"
                          disabled={isResolving}
                          onClick={() => handleResolve(event._id, event.title)}
                          style={{
                            padding: "10px 22px",
                            background: "transparent",
                            border: "1.5px solid #00ff88",
                            borderRadius: 8,
                            color: "#00ff88",
                            fontSize: 13, fontWeight: 700,
                            letterSpacing: 0.5,
                            display: "flex", alignItems: "center", gap: 7,
                          }}
                        >
                          {isResolving ? (
                            <>
                              <div style={{
                                width: 13, height: 13,
                                border: "2px solid #00ff8833",
                                borderTop: "2px solid #00ff88",
                                borderRadius: "50%",
                                animation: "spin 0.7s linear infinite",
                              }} />
                              Resolving...
                            </>
                          ) : (
                            <>✓ Mark Resolved</>
                          )}
                        </button>
                        <button
                          onClick={() => navigate(`/sos-map?id=${event._id}`)}
                          style={{
                            padding: "7px 16px",
                            background: "transparent",
                            border: `1px solid ${et.color}44`,
                            borderRadius: 8,
                            color: et.color,
                            fontSize: 11, cursor: "pointer",
                            fontFamily: "inherit",
                            transition: "all 0.2s",
                          }}
                          onMouseEnter={e => e.currentTarget.style.borderColor = et.color}
                          onMouseLeave={e => e.currentTarget.style.borderColor = `${et.color}44`}
                        >
                          🗺️ View on Map
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          {/* ═══════════════════════════════════════════════════════════════ */}

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
                <button className="action-btn" style={styles.actionBtn} onClick={() => navigate("/admin/reports")}>
                  🚨 Manage Reports
                </button>
                <button className="action-btn" style={{ ...styles.actionBtn, ...styles.actionBtnSecondary }} onClick={() => navigate("/admin/fund-requests")}>
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
                <button style={styles.viewAllBtn} onClick={() => navigate("/admin/reports")}>View All →</button>
              </div>
              {recentReports.length === 0 ? (
                <div style={styles.emptySmall}>No reports yet</div>
              ) : (
                recentReports.map((report) => {
                  const type = typeConfig[report.emergencyType] || {};
                  const statusColors = { Pending: "#ffaa00", Verified: "#00ff88", Resolved: "#6bcbff" };
                  return (
                    <div key={report._id} className="recent-row" style={styles.recentRow}>
                      <div style={{ ...styles.recentIcon, backgroundColor: `${type.color}12` }}>{type.icon}</div>
                      <div style={styles.recentInfo}>
                        <p style={styles.recentTitle}>{type.label} — {report.userId?.name || "Unknown"}</p>
                        <p style={styles.recentDesc}>{report.description?.substring(0, 50)}...</p>
                      </div>
                      <div style={styles.recentRight}>
                        <span style={{ ...styles.recentStatus, color: statusColors[report.status] }}>● {report.status}</span>
                        <span style={styles.recentDate}>{new Date(report.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
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
                <button style={styles.viewAllBtn} onClick={() => navigate("/admin/fund-requests")}>View All →</button>
              </div>
              {recentFunds.length === 0 ? (
                <div style={styles.emptySmall}>No fund requests yet</div>
              ) : (
                recentFunds.map((fund) => {
                  const statusColors = { Pending: "#ffaa00", Approved: "#00ff88", Rejected: "#ff4444" };
                  return (
                    <div key={fund._id} className="recent-row" style={styles.recentRow}>
                      <div style={styles.recentIcon}>💰</div>
                      <div style={styles.recentInfo}>
                        <p style={styles.recentTitle}>{fund.title}</p>
                        <p style={styles.recentDesc}>{fund.userId?.name || "Unknown"}</p>
                      </div>
                      <div style={styles.recentRight}>
                        <span style={{ color: "#00ff88", fontSize: "13px", fontWeight: "700" }}>৳{fund.amountNeeded.toLocaleString()}</span>
                        <span style={{ ...styles.recentStatus, color: statusColors[fund.status] }}>● {fund.status}</span>
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
  sidebar: { width: "240px", minWidth: "240px", backgroundColor: "#0d0d0d", borderRight: "1px solid #1e1e1e", overflowY: "auto" },
  sidebarContent: { padding: "28px 20px", display: "flex", flexDirection: "column", gap: "24px" },
  adminInfo: { display: "flex", alignItems: "center", gap: "12px", paddingBottom: "20px", borderBottom: "1px solid #1e1e1e" },
  adminAvatar: {
    width: "44px", height: "44px", background: "linear-gradient(135deg, #00ff88, #00cc6a)",
    borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "20px", fontWeight: "700", color: "#0a0a0a", animation: "glow 3s ease-in-out infinite",
  },
  adminName: { color: "#ffffff", fontSize: "14px", fontWeight: "700" },
  adminRole: { color: "#00ff88", fontSize: "10px", fontWeight: "700", letterSpacing: "1px", marginTop: "2px" },
  quickNav: { display: "flex", flexDirection: "column", gap: "8px" },
  navLabel: { color: "#333333", fontSize: "10px", fontWeight: "700", letterSpacing: "1px", marginBottom: "4px" },
  navBtn: {
    display: "flex", alignItems: "center", gap: "10px",
    padding: "10px 12px", borderRadius: "10px",
    border: "none", backgroundColor: "transparent",
    color: "#666666", fontSize: "13px", fontWeight: "500",
    cursor: "pointer", width: "100%", textAlign: "left",
    transition: "all 0.3s ease", fontFamily: "inherit",
  },
  navBtnActive: { backgroundColor: "rgba(0,255,136,0.1)", color: "#00ff88", borderLeft: "3px solid #00ff88" },
  systemStatus: { display: "flex", flexDirection: "column", gap: "8px" },
  statusRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #1a1a1a" },
  statusLabel: { color: "#555555", fontSize: "12px" },
  statusValue: { fontSize: "11px", fontWeight: "600" },
  summaryBox: { backgroundColor: "#1a1a1a", border: "1px solid #222222", borderRadius: "12px", padding: "16px", display: "flex", flexDirection: "column", gap: "10px" },
  summaryItem: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  summaryLabel: { color: "#555555", fontSize: "12px" },
  summaryValue: { color: "#e0e0e0", fontSize: "13px", fontWeight: "700" },
  main: { flex: 1, padding: "28px", display: "flex", flexDirection: "column", gap: "24px", overflowY: "auto" },
  welcomeBanner: {
    background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
    borderRadius: "16px", padding: "32px", border: "1px solid rgba(0,255,136,0.15)",
    position: "relative", overflow: "hidden", boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
  },
  bannerOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "radial-gradient(circle at top right, rgba(0,255,136,0.08) 0%, transparent 60%)", pointerEvents: "none" },
  bannerContent: { display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", zIndex: 1 },
  welcomeTitle: { color: "#ffffff", fontSize: "26px", fontWeight: "700", marginBottom: "8px" },
  welcomeSubtitle: { color: "rgba(255,255,255,0.4)", fontSize: "13px" },
  bannerStats: { display: "flex", alignItems: "center", gap: "24px", backgroundColor: "rgba(0,0,0,0.2)", borderRadius: "12px", padding: "16px 24px", border: "1px solid rgba(255,255,255,0.05)" },
  bannerStat: { display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" },
  bannerStatValue: { color: "#00ff88", fontSize: "28px", fontWeight: "700" },
  bannerStatLabel: { color: "rgba(255,255,255,0.4)", fontSize: "12px" },
  bannerStatDivider: { width: "1px", height: "40px", backgroundColor: "rgba(255,255,255,0.1)" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" },
  statCard: { backgroundColor: "#1a1a1a", border: "1px solid #222222", borderRadius: "14px", padding: "20px", display: "flex", alignItems: "center", gap: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.2)" },
  statIconCircle: { width: "48px", height: "48px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  statIcon: { fontSize: "22px" },
  statInfo: { display: "flex", flexDirection: "column", gap: "2px" },
  statValue: { fontSize: "24px", fontWeight: "700" },
  statLabel: { color: "#888888", fontSize: "12px", fontWeight: "500" },
  statSub: { color: "#444444", fontSize: "11px" },
  middleRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" },
  breakdownCard: { backgroundColor: "#1a1a1a", border: "1px solid #222222", borderRadius: "16px", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" },
  cardTitle: { color: "#ffffff", fontSize: "15px", fontWeight: "700" },
  cardSubtitle: { color: "#444444", fontSize: "12px" },
  typeBarItem: { display: "flex", flexDirection: "column", gap: "6px", padding: "6px 0", borderRadius: "8px" },
  typeBarTop: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  typeBarLabel: { color: "#aaaaaa", fontSize: "13px" },
  typeBarCount: { fontSize: "13px", fontWeight: "700" },
  typeBarBg: { height: "6px", backgroundColor: "#222222", borderRadius: "3px", overflow: "hidden" },
  typeBarFill: { height: "100%", borderRadius: "3px", transition: "width 0.8s ease" },
  fundOverviewCard: { backgroundColor: "#1a1a1a", border: "1px solid #222222", borderRadius: "16px", padding: "24px", display: "flex", flexDirection: "column", gap: "20px" },
  amountHighlight: { backgroundColor: "rgba(0,255,136,0.06)", border: "1px solid rgba(0,255,136,0.15)", borderRadius: "12px", padding: "16px" },
  amountLabel: { color: "#555555", fontSize: "12px", marginBottom: "6px" },
  amountValue: { color: "#00ff88", fontSize: "26px", fontWeight: "700" },
  fundStats: { display: "flex", flexDirection: "column", gap: "10px" },
  fundStatItem: { display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px", backgroundColor: "#222222", borderRadius: "10px" },
  fundStatIcon: { width: "32px", height: "32px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" },
  fundStatInfo: { display: "flex", flexDirection: "column", gap: "2px" },
  fundStatValue: { fontSize: "16px", fontWeight: "700" },
  fundStatLabel: { color: "#555555", fontSize: "11px" },
  quickActions: { display: "flex", flexDirection: "column", gap: "10px" },
  actionBtn: { backgroundColor: "#00ff88", color: "#0a0a0a", border: "none", padding: "12px", borderRadius: "10px", fontSize: "13px", fontWeight: "700", cursor: "pointer", width: "100%", fontFamily: "inherit" },
  actionBtnSecondary: { backgroundColor: "transparent", border: "1px solid #00ff88", color: "#00ff88" },
  bottomRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" },
  recentCard: { backgroundColor: "#1a1a1a", border: "1px solid #222222", borderRadius: "16px", padding: "24px", display: "flex", flexDirection: "column", gap: "4px" },
  viewAllBtn: { backgroundColor: "transparent", border: "none", color: "#00ff88", fontSize: "12px", cursor: "pointer", fontFamily: "inherit", transition: "opacity 0.3s ease" },
  recentRow: { display: "flex", alignItems: "center", gap: "12px", padding: "12px 8px", borderRadius: "10px", borderBottom: "1px solid #1e1e1e", cursor: "default" },
  recentIcon: { width: "36px", height: "36px", backgroundColor: "rgba(0,255,136,0.08)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", flexShrink: 0 },
  recentInfo: { flex: 1, minWidth: 0 },
  recentTitle: { color: "#e0e0e0", fontSize: "13px", fontWeight: "600", marginBottom: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  recentDesc: { color: "#555555", fontSize: "11px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  recentRight: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px", flexShrink: 0 },
  recentStatus: { fontSize: "11px", fontWeight: "600" },
  recentDate: { color: "#444444", fontSize: "11px" },
  emptySmall: { color: "#444444", fontSize: "13px", textAlign: "center", padding: "24px" },
};

export default AdminDashboard;