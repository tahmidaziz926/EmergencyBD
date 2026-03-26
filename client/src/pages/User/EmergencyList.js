import { useState, useEffect } from "react";
import axios from "axios";
import useAuth from "../../hooks/useAuth";
import Navbar from "../../components/Navbar";
import { useNavigate } from "react-router-dom";

const statusConfig = {
  Pending: { color: "#ffaa00", bg: "rgba(255,170,0,0.08)", icon: "⏳", label: "Pending" },
  Verified: { color: "#00ff88", bg: "rgba(0,255,136,0.08)", icon: "✅", label: "Verified" },
  Resolved: { color: "#6bcbff", bg: "rgba(107,203,255,0.08)", icon: "🎯", label: "Resolved" },
};

const typeConfig = {
  robbery: { icon: "🔫", color: "#ff6b6b", label: "Robbery" },
  fire: { icon: "🔥", color: "#ff9f43", label: "Fire" },
  accident: { icon: "🚗", color: "#ffd93d", label: "Accident" },
  harassment: { icon: "⚠️", color: "#a29bfe", label: "Harassment" },
  medical: { icon: "🏥", color: "#00ff88", label: "Medical" },
};

const getImageUrl = (imageUrl) => {
  if (!imageUrl) return null;
  const cleaned = imageUrl.replace(/\\/g, "/");
  return `http://localhost:3001/${cleaned}`;
};

const useReverseGeocode = (lat, lng) => {
  const [address, setAddress] = useState(null);
  const [geocoding, setGeocoding] = useState(false);

  useEffect(() => {
    if (!lat || !lng) return;
    setGeocoding(true);
    fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
      .then(res => res.json())
      .then(data => {
        if (data && data.address) {
          const a = data.address;
          const parts = [
            a.road || a.pedestrian || a.footway,
            a.suburb || a.neighbourhood || a.quarter,
            a.city || a.town || a.village || a.county,
            a.postcode,
            a.country,
          ].filter(Boolean);
          setAddress(parts.join(", "));
        }
        setGeocoding(false);
      })
      .catch(() => setGeocoding(false));
  }, [lat, lng]);

  return { address, geocoding };
};

const LocationDetail = ({ location }) => {
  const { address, geocoding } = useReverseGeocode(
    location?.lat,
    location?.lng
  );

  if (!location?.area) return null;

  return (
    <div style={detailStyles.locationBox}>
      <p style={detailStyles.sectionTitle}>📍 Location</p>

      {location.lat ? (
        <>
          {geocoding ? (
            <p style={detailStyles.geocodingText}>🔄 Fetching address...</p>
          ) : address ? (
            <p style={detailStyles.addressText}>{address}</p>
          ) : (
            <p style={detailStyles.coordsText}>
              {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
            </p>
          )}
          <p style={detailStyles.coordsSmall}>
            {location.lat?.toFixed(6)}, {location.lng?.toFixed(6)}
          </p>
          <a
            href={`https://www.google.com/maps?q=${location.lat},${location.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            style={detailStyles.mapsLink}
          >
            🗺️ Open in Google Maps →
          </a>
        </>
      ) : (
        <>
          <p style={detailStyles.addressText}>{location.area}</p>
          <a
            href={`https://www.google.com/maps/search/${encodeURIComponent(location.area)}`}
            target="_blank"
            rel="noopener noreferrer"
            style={detailStyles.mapsLink}
          >
            🗺️ Search on Google Maps →
          </a>
        </>
      )}
    </div>
  );
};

const detailStyles = {
  locationBox: {
    backgroundColor: "rgba(0,255,136,0.05)",
    border: "1px solid rgba(0,255,136,0.15)",
    borderRadius: "10px", padding: "14px",
    marginBottom: "16px",
    display: "flex", flexDirection: "column", gap: "6px",
  },
  sectionTitle: {
    color: "#555555", fontSize: "11px", fontWeight: "600",
    textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px",
  },
  addressText: {
    color: "#e0e0e0", fontSize: "13px",
    fontWeight: "500", lineHeight: "1.5",
  },
  geocodingText: { color: "#888888", fontSize: "12px" },
  coordsText: { color: "#aaaaaa", fontSize: "12px" },
  coordsSmall: { color: "#444444", fontSize: "10px", fontFamily: "monospace" },
  mapsLink: {
    color: "#00ff88", fontSize: "12px",
    fontWeight: "600", textDecoration: "none",
    display: "inline-block", marginTop: "2px",
  },
};

const EmergencyList = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await axios.get("http://localhost:3001/api/emergency/my-reports", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setReports(res.data);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    fetchReports();
  }, [token]);

  const filtered = reports.filter(r => {
    const matchFilter = filter === "all" || r.status === filter || r.emergencyType === filter;
    const matchSearch =
      r.description.toLowerCase().includes(search.toLowerCase()) ||
      r.emergencyType.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const stats = {
    total: reports.length,
    pending: reports.filter(r => r.status === "Pending").length,
    verified: reports.filter(r => r.status === "Verified").length,
    resolved: reports.filter(r => r.status === "Resolved").length,
  };

  if (loading) return (
    <div style={styles.loadingScreen}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={styles.spinner}></div>
      <p style={styles.loadingText}>Loading your reports...</p>
    </div>
  );

  return (
    <div style={styles.page}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } }
        .report-card { transition: all 0.3s ease !important; }
        .report-card:hover { transform: translateY(-2px) !important; border-color: rgba(0,255,136,0.2) !important; box-shadow: 0 12px 30px rgba(0,0,0,0.3) !important; }
        .report-card.selected { border-color: #00ff88 !important; background: rgba(0,255,136,0.04) !important; }
        .filter-btn { transition: all 0.3s ease !important; }
        .filter-btn:hover { color: #00ff88 !important; border-color: rgba(0,255,136,0.3) !important; }
        .new-btn { transition: all 0.3s ease !important; }
        .new-btn:hover { transform: translateY(-2px) !important; box-shadow: 0 8px 20px rgba(0,255,136,0.3) !important; }
        input:focus { border-color: #00ff88 !important; box-shadow: 0 0 0 3px rgba(0,255,136,0.1) !important; outline: none !important; }
        .maps-link:hover { opacity: 0.75 !important; }
      `}</style>

      <Navbar />
      <div style={styles.layout}>

        {/* LEFT PANEL */}
        <div style={styles.leftPanel}>
          <div style={styles.leftHeader}>
            <div>
              <h2 style={styles.leftTitle}>My Reports</h2>
              <p style={styles.leftSubtitle}>{reports.length} total reports</p>
            </div>
            <button className="new-btn" style={styles.newBtn} onClick={() => navigate("/user/emergency")}>
              + New
            </button>
          </div>

          <div style={styles.searchBox}>
            <span style={styles.searchIcon}>🔍</span>
            <input
              type="text"
              placeholder="Search reports..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={styles.searchInput}
            />
          </div>

          <div style={styles.filterSection}>
            <p style={styles.filterTitle}>FILTER BY STATUS</p>
            <div style={styles.filterBtns}>
              {["all", "Pending", "Verified", "Resolved"].map(f => (
                <button
                  key={f}
                  className="filter-btn"
                  style={{ ...styles.filterBtn, ...(filter === f ? styles.filterActive : {}) }}
                  onClick={() => setFilter(f)}
                >
                  {f === "all" ? "🗂 All" : `${statusConfig[f]?.icon} ${f}`}
                  <span style={styles.filterCount}>
                    {f === "all" ? reports.length : reports.filter(r => r.status === f).length}
                  </span>
                </button>
              ))}
            </div>

            <p style={{ ...styles.filterTitle, marginTop: "20px" }}>FILTER BY TYPE</p>
            <div style={styles.filterBtns}>
              {Object.entries(typeConfig).map(([key, val]) => (
                <button
                  key={key}
                  className="filter-btn"
                  style={{ ...styles.filterBtn, ...(filter === key ? styles.filterActive : {}) }}
                  onClick={() => setFilter(key)}
                >
                  {val.icon} {val.label}
                  <span style={styles.filterCount}>
                    {reports.filter(r => r.emergencyType === key).length}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div style={styles.statsBox}>
            {[
              { label: "Total", value: stats.total, color: "#e0e0e0" },
              { label: "Pending", value: stats.pending, color: "#ffaa00" },
              { label: "Verified", value: stats.verified, color: "#00ff88" },
              { label: "Resolved", value: stats.resolved, color: "#6bcbff" },
            ].map((s, i) => (
              <div key={i} style={styles.statItem}>
                <span style={{ ...styles.statValue, color: s.color }}>{s.value}</span>
                <span style={styles.statLabel}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* MIDDLE PANEL */}
        <div style={styles.middlePanel}>
          {filtered.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>📋</div>
              <h3 style={styles.emptyTitle}>No Reports Found</h3>
              <p style={styles.emptyText}>
                {search ? "Try a different search term" : "No emergency reports submitted yet"}
              </p>
              <button className="new-btn" style={styles.emptyBtn} onClick={() => navigate("/user/emergency")}>
                🚨 Submit First Report
              </button>
            </div>
          ) : (
            <div style={styles.reportList}>
              {filtered.map((report, index) => {
                const type = typeConfig[report.emergencyType] || {};
                const status = statusConfig[report.status] || {};
                return (
                  <div
                    key={report._id}
                    className={`report-card ${selectedReport?._id === report._id ? "selected" : ""}`}
                    style={{ ...styles.reportCard, animationDelay: `${index * 0.05}s` }}
                    onClick={() => setSelectedReport(selectedReport?._id === report._id ? null : report)}
                  >
                    <div style={styles.cardTop}>
                      <div style={styles.cardLeft}>
                        <div style={{ ...styles.typeIconBox, backgroundColor: `${type.color}15`, border: `1px solid ${type.color}25` }}>
                          <span style={styles.typeIcon}>{type.icon}</span>
                        </div>
                        <div>
                          <p style={{ ...styles.cardType, color: type.color }}>{type.label}</p>
                          <p style={styles.cardDate}>
                            {new Date(report.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </p>
                        </div>
                      </div>
                      <div style={{
                        ...styles.statusBadge,
                        color: status.color,
                        backgroundColor: status.bg,
                        border: `1px solid ${status.color}30`,
                      }}>
                        {status.icon} {status.label}
                      </div>
                    </div>
                    <p style={styles.cardDescription}>
                      {report.description.substring(0, 100)}{report.description.length > 100 ? "..." : ""}
                    </p>
                    {report.location?.area && (
                      <div style={styles.locationTag}>
                        <span>📍</span>
                        <span>{report.location.area}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT PANEL */}
        <div style={styles.rightPanel}>
          {selectedReport ? (
            <div style={{ animation: "slideIn 0.3s ease" }}>
              <div style={styles.detailHeader}>
                <h3 style={styles.detailTitle}>Report Details</h3>
                <button style={styles.closeBtn} onClick={() => setSelectedReport(null)}>✕</button>
              </div>

              <div style={{
                ...styles.detailTypeBadge,
                backgroundColor: `${typeConfig[selectedReport.emergencyType]?.color}10`,
                border: `1px solid ${typeConfig[selectedReport.emergencyType]?.color}30`,
              }}>
                <span style={styles.detailTypeIcon}>
                  {typeConfig[selectedReport.emergencyType]?.icon}
                </span>
                <div>
                  <p style={{ ...styles.detailTypeLabel, color: typeConfig[selectedReport.emergencyType]?.color }}>
                    {typeConfig[selectedReport.emergencyType]?.label}
                  </p>
                  <p style={styles.detailTypeDesc}>Emergency Type</p>
                </div>
              </div>

              <div style={{
                ...styles.detailStatusBox,
                backgroundColor: statusConfig[selectedReport.status]?.bg,
                border: `1px solid ${statusConfig[selectedReport.status]?.color}30`,
              }}>
                <span style={{ fontSize: "20px" }}>{statusConfig[selectedReport.status]?.icon}</span>
                <div>
                  <p style={{ color: statusConfig[selectedReport.status]?.color, fontWeight: "700", fontSize: "14px" }}>
                    {selectedReport.status}
                  </p>
                  <p style={styles.detailStatusDesc}>Current Status</p>
                </div>
              </div>

              {/* Location with reverse geocoding */}
              <LocationDetail location={selectedReport.location} />

              <div style={styles.detailSection}>
                <p style={styles.detailSectionTitle}>📝 Description</p>
                <p style={styles.detailDescription}>{selectedReport.description}</p>
              </div>

              {selectedReport.imageUrl && (
                <div style={styles.detailSection}>
                  <p style={styles.detailSectionTitle}>📷 Attached Image</p>
                  <img
                    src={getImageUrl(selectedReport.imageUrl)}
                    alt="report"
                    style={styles.detailImage}
                    onError={e => {
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "flex";
                    }}
                  />
                  <div style={styles.imageFallback}>
                    <span style={{ fontSize: "24px" }}>🖼️</span>
                    <span style={{ fontSize: "12px", color: "#555" }}>Image unavailable</span>
                  </div>
                </div>
              )}

              <div style={styles.detailMeta}>
                <div style={styles.metaRow}>
                  <span style={styles.metaLabel}>Submitted</span>
                  <span style={styles.metaValue}>
                    {new Date(selectedReport.createdAt).toLocaleDateString("en-US", {
                      year: "numeric", month: "long", day: "numeric"
                    })}
                  </span>
                </div>
                <div style={styles.metaRow}>
                  <span style={styles.metaLabel}>Time</span>
                  <span style={styles.metaValue}>
                    {new Date(selectedReport.createdAt).toLocaleTimeString("en-US", {
                      hour: "2-digit", minute: "2-digit"
                    })}
                  </span>
                </div>
                <div style={styles.metaRow}>
                  <span style={styles.metaLabel}>Report ID</span>
                  <span style={{ ...styles.metaValue, fontSize: "10px", color: "#444444" }}>
                    {selectedReport._id}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div style={styles.detailEmpty}>
              <div style={styles.detailEmptyIcon}>👆</div>
              <p style={styles.detailEmptyText}>Click on a report to view its details</p>
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
  leftPanel: {
    width: "260px", minWidth: "260px",
    backgroundColor: "#0d0d0d", borderRight: "1px solid #1e1e1e",
    padding: "28px 20px", display: "flex",
    flexDirection: "column", gap: "20px", overflowY: "auto",
  },
  leftHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  leftTitle: { color: "#ffffff", fontSize: "18px", fontWeight: "700" },
  leftSubtitle: { color: "#555555", fontSize: "12px", marginTop: "4px" },
  newBtn: {
    backgroundColor: "#00ff88", color: "#0a0a0a",
    border: "none", padding: "8px 14px", borderRadius: "8px",
    fontSize: "13px", fontWeight: "700", cursor: "pointer", flexShrink: 0,
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
  filterSection: { display: "flex", flexDirection: "column", gap: "8px" },
  filterTitle: { color: "#333333", fontSize: "10px", fontWeight: "700", letterSpacing: "1px" },
  filterBtns: { display: "flex", flexDirection: "column", gap: "4px" },
  filterBtn: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "9px 12px", borderRadius: "8px",
    border: "1px solid transparent",
    backgroundColor: "transparent", color: "#666666",
    fontSize: "13px", cursor: "pointer", textAlign: "left", width: "100%",
  },
  filterActive: {
    backgroundColor: "rgba(0,255,136,0.08)",
    border: "1px solid rgba(0,255,136,0.2)", color: "#00ff88",
  },
  filterCount: {
    backgroundColor: "#222222", color: "#555555",
    fontSize: "11px", fontWeight: "600",
    padding: "2px 8px", borderRadius: "10px",
  },
  statsBox: {
    display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px",
    backgroundColor: "#1a1a1a", border: "1px solid #222222",
    borderRadius: "12px", padding: "16px", marginTop: "auto",
  },
  statItem: { display: "flex", flexDirection: "column", gap: "2px", alignItems: "center" },
  statValue: { fontSize: "20px", fontWeight: "700" },
  statLabel: { color: "#444444", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.5px" },
  middlePanel: { flex: 1, overflowY: "auto", borderRight: "1px solid #1e1e1e" },
  emptyState: {
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    height: "100%", gap: "16px", padding: "60px 20px", textAlign: "center",
  },
  emptyIcon: { fontSize: "56px" },
  emptyTitle: { color: "#ffffff", fontSize: "18px", fontWeight: "600" },
  emptyText: { color: "#555555", fontSize: "14px", lineHeight: "1.6" },
  emptyBtn: {
    backgroundColor: "#00ff88", color: "#0a0a0a",
    border: "none", padding: "12px 24px", borderRadius: "10px",
    fontSize: "14px", fontWeight: "700", cursor: "pointer", marginTop: "8px",
  },
  reportList: { display: "flex", flexDirection: "column" },
  reportCard: {
    padding: "20px 24px", borderBottom: "1px solid #1a1a1a",
    cursor: "pointer", animation: "fadeUp 0.4s ease both",
    border: "1px solid transparent", borderBottomColor: "#1a1a1a",
  },
  cardTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" },
  cardLeft: { display: "flex", alignItems: "center", gap: "12px" },
  typeIconBox: {
    width: "40px", height: "40px", borderRadius: "10px",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  typeIcon: { fontSize: "18px" },
  cardType: { fontSize: "13px", fontWeight: "700" },
  cardDate: { color: "#444444", fontSize: "11px", marginTop: "2px" },
  statusBadge: {
    fontSize: "11px", fontWeight: "600",
    padding: "4px 10px", borderRadius: "20px", letterSpacing: "0.3px",
  },
  cardDescription: { color: "#888888", fontSize: "13px", lineHeight: "1.6" },
  locationTag: {
    display: "inline-flex", alignItems: "center", gap: "5px",
    marginTop: "8px",
    backgroundColor: "rgba(0,255,136,0.06)",
    border: "1px solid rgba(0,255,136,0.15)",
    color: "#00ff88", fontSize: "11px",
    padding: "3px 10px", borderRadius: "20px",
  },
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
  detailTypeBadge: {
    display: "flex", alignItems: "center", gap: "14px",
    borderRadius: "12px", padding: "16px", marginBottom: "14px",
  },
  detailTypeIcon: { fontSize: "28px" },
  detailTypeLabel: { fontSize: "15px", fontWeight: "700" },
  detailTypeDesc: { color: "#444444", fontSize: "11px", marginTop: "2px" },
  detailStatusBox: {
    display: "flex", alignItems: "center", gap: "14px",
    borderRadius: "12px", padding: "14px", marginBottom: "16px",
  },
  detailStatusDesc: { color: "#444444", fontSize: "11px", marginTop: "2px" },
  detailSection: { marginBottom: "20px" },
  detailSectionTitle: {
    color: "#555555", fontSize: "11px", fontWeight: "600",
    marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px",
  },
  detailDescription: {
    color: "#cccccc", fontSize: "13px", lineHeight: "1.7",
    backgroundColor: "#1a1a1a", border: "1px solid #222222",
    borderRadius: "10px", padding: "14px",
  },
  detailImage: {
    width: "100%", borderRadius: "10px",
    objectFit: "cover", maxHeight: "180px", display: "block",
  },
  imageFallback: {
    display: "none",
    backgroundColor: "#1a1a1a", border: "1px solid #222222",
    borderRadius: "10px", padding: "20px",
    alignItems: "center", justifyContent: "center",
    flexDirection: "column", gap: "8px",
  },
  detailMeta: {
    backgroundColor: "#1a1a1a", border: "1px solid #222222",
    borderRadius: "12px", padding: "16px",
    display: "flex", flexDirection: "column", gap: "12px",
  },
  metaRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  metaLabel: { color: "#444444", fontSize: "12px" },
  metaValue: { color: "#e0e0e0", fontSize: "12px", fontWeight: "500", textAlign: "right" },
  detailEmpty: {
    height: "100%", display: "flex",
    flexDirection: "column", alignItems: "center",
    justifyContent: "center", gap: "12px", textAlign: "center", padding: "40px",
  },
  detailEmptyIcon: { fontSize: "40px", opacity: 0.3 },
  detailEmptyText: { color: "#333333", fontSize: "13px", lineHeight: "1.6" },
};

export default EmergencyList;