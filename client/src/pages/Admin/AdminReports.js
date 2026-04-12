import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import useAuth from "../../hooks/useAuth";
import Navbar from "../../components/Navbar";

const statusConfig = {
  Pending: { color: "#ffaa00", bg: "rgba(255,170,0,0.08)", icon: "⏳" },
  Verified: { color: "#00ff88", bg: "rgba(0,255,136,0.08)", icon: "✅" },
  Resolved: { color: "#6bcbff", bg: "rgba(107,203,255,0.08)", icon: "🎯" },
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
  // Cloudinary URLs are already full URLs
  if (imageUrl.startsWith("http")) return imageUrl;
  // Fallback for any old local images
  const cleaned = imageUrl.replace(/\\/g, "/");
  return `http://localhost:3001/${cleaned}`;
};

const reverseGeocode = async (lat, lng) => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
    );
    const data = await res.json();
    if (data && data.address) {
      const a = data.address;
      const parts = [
        a.road || a.pedestrian || a.footway,
        a.suburb || a.neighbourhood || a.quarter,
        a.city || a.town || a.village || a.county,
        a.postcode,
        a.country,
      ].filter(Boolean);
      return parts.join(", ");
    }
    return null;
  } catch {
    return null;
  }
};

const useReverseGeocode = (lat, lng) => {
  const [address, setAddress] = useState(null);
  const [geocoding, setGeocoding] = useState(false);
  useEffect(() => {
    if (!lat || !lng) return;
    setGeocoding(true);
    reverseGeocode(lat, lng).then(addr => {
      setAddress(addr);
      setGeocoding(false);
    });
  }, [lat, lng]);
  return { address, geocoding };
};

const downloadImage = async (imageUrl, filename) => {
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename || "emergency-report.jpg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Download failed:", err);
  }
};

const LocationTag = ({ location }) => {
  const { address, geocoding } = useReverseGeocode(location?.lat, location?.lng);
  if (!location?.area) return null;
  const displayText = location.lat
    ? (geocoding ? "Fetching location..." : address || location.area)
    : location.area;
  return (
    <div style={tagStyles.tag}>
      <span>{"📍"}</span>
      <span style={tagStyles.text}>{displayText}</span>
    </div>
  );
};

const tagStyles = {
  tag: {
    display: "inline-flex", alignItems: "flex-start", gap: "5px",
    marginTop: "8px", backgroundColor: "rgba(0,255,136,0.06)",
    border: "1px solid rgba(0,255,136,0.15)",
    color: "#00ff88", fontSize: "11px",
    padding: "5px 10px", borderRadius: "20px", maxWidth: "100%",
  },
  text: { lineHeight: "1.4", wordBreak: "break-word" },
};

const LocationDetail = ({ location }) => {
  const { address, geocoding } = useReverseGeocode(location?.lat, location?.lng);
  const [copied, setCopied] = useState(false);
  if (!location?.area) return null;

  const handleCopy = () => {
    const textToCopy = location.lat
      ? `${location.lat}, ${location.lng}`
      : location.area;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (location.lat) {
    return (
      <div style={locStyles.box}>
        <p style={locStyles.title}>{"📍 Location"}</p>
        {geocoding ? (
          <p style={locStyles.geocoding}>{"🔄 Fetching address..."}</p>
        ) : address ? (
          <p style={locStyles.address}>{address}</p>
        ) : null}
        <p style={locStyles.coordsSmall}>
          {location.lat.toFixed(6)}{", "}{location.lng.toFixed(6)}
        </p>
        <button style={locStyles.copyBtn} onClick={handleCopy}>
          {copied ? "✅ Copied!" : "📋 Copy Coordinates"}
        </button>
        <a
          href={"https://www.google.com/maps?q=" + location.lat + "," + location.lng}
          target="_blank"
          rel="noopener noreferrer"
          style={locStyles.link}
        >
          {"🗺️ Open in Google Maps"}
        </a>
      </div>
    );
  }

  return (
    <div style={locStyles.box}>
      <p style={locStyles.title}>{"📍 Location"}</p>
      <p style={locStyles.address}>{location.area}</p>
      <button style={locStyles.copyBtn} onClick={handleCopy}>
        {copied ? "✅ Copied!" : "📋 Copy Location"}
      </button>
      <a
        href={"https://www.google.com/maps/search/" + encodeURIComponent(location.area)}
        target="_blank"
        rel="noopener noreferrer"
        style={locStyles.link}
      >
        {"🗺️ Search on Google Maps"}
      </a>
    </div>
  );
};

const locStyles = {
  box: {
    backgroundColor: "rgba(0,255,136,0.05)",
    border: "1px solid rgba(0,255,136,0.15)",
    borderRadius: "10px", padding: "14px",
    marginBottom: "16px",
    display: "flex", flexDirection: "column", gap: "8px",
  },
  title: {
    color: "#444444", fontSize: "11px", fontWeight: "600",
    textTransform: "uppercase", letterSpacing: "0.5px",
  },
  address: { color: "#e0e0e0", fontSize: "13px", fontWeight: "500", lineHeight: "1.5" },
  geocoding: { color: "#888888", fontSize: "12px" },
  coordsSmall: { color: "#444444", fontSize: "10px", fontFamily: "monospace" },
  copyBtn: {
    backgroundColor: "rgba(255,255,255,0.04)",
    border: "1px solid #2a2a2a",
    color: "#aaaaaa", padding: "6px 12px",
    borderRadius: "7px", fontSize: "11px",
    cursor: "pointer", fontFamily: "inherit",
    textAlign: "left", width: "fit-content",
  },
  link: {
    color: "#00ff88", fontSize: "12px",
    fontWeight: "600", textDecoration: "none",
    display: "inline-block",
  },
};

const ImageLightbox = ({ imageUrl, onClose }) => {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const filename = imageUrl ? imageUrl.split("/").pop() : "emergency-report.jpg";

  return (
    <div style={lbStyles.overlay} onClick={onClose}>
      <div style={lbStyles.container} onClick={e => e.stopPropagation()}>
        <div style={lbStyles.header}>
          <span style={lbStyles.headerTitle}>{"📷 Report Image"}</span>
          <div style={lbStyles.headerActions}>
            <button style={lbStyles.downloadBtn} onClick={() => downloadImage(imageUrl, filename)}>
              {"⬇️ Download"}
            </button>
            <button style={lbStyles.closeBtn} onClick={onClose}>{"✕"}</button>
          </div>
        </div>
        <div style={lbStyles.imageWrap}>
          <img src={imageUrl} alt="report" style={lbStyles.image} />
        </div>
        <div style={lbStyles.footer}>
          <span style={lbStyles.hint}>{"Press ESC or click outside to close"}</span>
        </div>
      </div>
    </div>
  );
};

const lbStyles = {
  overlay: {
    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.92)", zIndex: 9999,
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  container: {
    backgroundColor: "#111111", border: "1px solid #222222",
    borderRadius: "16px", overflow: "hidden",
    maxWidth: "90vw", maxHeight: "90vh",
    display: "flex", flexDirection: "column",
    boxShadow: "0 40px 80px rgba(0,0,0,0.8)",
  },
  header: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "14px 20px", backgroundColor: "#0d0d0d",
    borderBottom: "1px solid #1e1e1e",
  },
  headerTitle: { color: "#e0e0e0", fontSize: "14px", fontWeight: "600" },
  headerActions: { display: "flex", gap: "10px", alignItems: "center" },
  downloadBtn: {
    backgroundColor: "rgba(0,255,136,0.1)",
    border: "1px solid rgba(0,255,136,0.25)",
    color: "#00ff88", padding: "6px 14px",
    borderRadius: "7px", fontSize: "12px",
    fontWeight: "600", cursor: "pointer", fontFamily: "inherit",
  },
  closeBtn: {
    backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a",
    color: "#888888", width: "30px", height: "30px",
    borderRadius: "50%", cursor: "pointer", fontSize: "13px",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "inherit",
  },
  imageWrap: {
    overflow: "auto", display: "flex",
    alignItems: "center", justifyContent: "center",
    padding: "20px", maxHeight: "75vh",
  },
  image: { maxWidth: "100%", maxHeight: "70vh", objectFit: "contain", borderRadius: "8px" },
  footer: {
    padding: "10px 20px", borderTop: "1px solid #1a1a1a",
    backgroundColor: "#0d0d0d", textAlign: "center",
  },
  hint: { color: "#333333", fontSize: "11px" },
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

const AdminReports = () => {
  const { token } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const [activeTab, setActiveTab] = useState("all");
  const [quickFilter, setQuickFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterArea, setFilterArea] = useState("");
  const [filterStart, setFilterStart] = useState("");
  const [filterEnd, setFilterEnd] = useState("");
  const [filtering, setFiltering] = useState(false);
  const [filterApplied, setFilterApplied] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:3001/api/admin/reports", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReports(res.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleApplyFilter = useCallback(async () => {
    setFiltering(true);
    setFilterApplied(false);
    try {
      const params = {};
      if (filterType) params.emergencyType = filterType;
      if (filterArea.trim()) params.area = filterArea.trim();
      if (filterStart) params.startDate = filterStart;
      if (filterEnd) params.endDate = filterEnd;

      const res = await axios.get("http://localhost:3001/api/admin/reports/filter", {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      setReports(res.data);
      setFilterApplied(true);
    } catch (err) {
      console.error("Filter failed:", err);
    }
    setFiltering(false);
  }, [filterType, filterArea, filterStart, filterEnd, token]);

  const handleClearFilter = () => {
    setFilterType("");
    setFilterArea("");
    setFilterStart("");
    setFilterEnd("");
    setFilterApplied(false);
    fetchReports();
  };

  const handleStatusUpdate = async (reportId, newStatus) => {
    setUpdatingStatus(true);
    try {
      await axios.put(
        `http://localhost:3001/api/admin/reports/${reportId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReports(prev =>
        prev.map(r => r._id === reportId ? { ...r, status: newStatus } : r)
      );
      setSelectedReport(prev => ({ ...prev, status: newStatus }));
    } catch (err) {
      console.error("Status update failed:", err);
    }
    setUpdatingStatus(false);
  };

  const displayed = reports.filter(r => {
    const matchQuick = quickFilter === "all" || r.status === quickFilter || r.emergencyType === quickFilter;
    const matchSearch =
      (r.description || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.emergencyType || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.userId?.name || "").toLowerCase().includes(search.toLowerCase());
    return matchQuick && matchSearch;
  });

  if (loading) return (
    <div style={styles.loadingScreen}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={styles.spinner}></div>
      <p style={styles.loadingText}>{"Loading reports..."}</p>
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
        .filter-btn:hover { color: #00ff88 !important; }
        .tab-btn { transition: all 0.2s ease !important; }
        .tab-btn:hover { color: #00ff88 !important; }
        input:focus, select:focus { border-color: #00ff88 !important; outline: none !important; }
        .img-thumb:hover { opacity: 0.85 !important; }
        .action-btn:hover { background: rgba(0,255,136,0.2) !important; }
        .status-btn { transition: all 0.3s ease !important; }
        .status-btn:hover { transform: translateY(-2px) !important; }
        .status-btn:disabled { opacity: 0.5 !important; cursor: not-allowed !important; transform: none !important; }
        .apply-btn:hover { background: rgba(0,255,136,0.25) !important; }
        .clear-btn:hover { border-color: #ff6b6b !important; color: #ff6b6b !important; }
      `}</style>

      {lightboxImage && (
        <ImageLightbox imageUrl={lightboxImage} onClose={() => setLightboxImage(null)} />
      )}

      <Navbar />
      <div style={styles.layout}>

        {/* ── LEFT PANEL ── */}
        <div style={styles.leftPanel}>
          <div style={styles.leftHeader}>
            <h2 style={styles.leftTitle}>{"All Reports"}</h2>
            <p style={styles.leftSubtitle}>
              {reports.length}{filterApplied ? " filtered" : " total"}
            </p>
          </div>

          {/* Tab switcher */}
          <div style={styles.tabRow}>
            <button
              className="tab-btn"
              style={{ ...styles.tabBtn, ...(activeTab === "all" ? styles.tabActive : {}) }}
              onClick={() => setActiveTab("all")}
            >
              {"🗂 Browse"}
            </button>
            <button
              className="tab-btn"
              style={{ ...styles.tabBtn, ...(activeTab === "filter" ? styles.tabActive : {}) }}
              onClick={() => setActiveTab("filter")}
            >
              {"🔎 Filter"}
            </button>
          </div>

          {/* ── BROWSE TAB ── */}
          {activeTab === "all" && (
            <>
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
                {["all", "Pending", "Verified", "Resolved"].map(f => (
                  <button
                    key={f}
                    className="filter-btn"
                    style={{ ...styles.filterBtn, ...(quickFilter === f ? styles.filterActive : {}) }}
                    onClick={() => setQuickFilter(f)}
                  >
                    <span>{f === "all" ? "🗂 All" : statusConfig[f].icon + " " + f}</span>
                    <span style={styles.filterCount}>
                      {f === "all" ? reports.length : reports.filter(r => r.status === f).length}
                    </span>
                  </button>
                ))}
                <p style={{ ...styles.filterTitle, marginTop: "16px" }}>{"FILTER BY TYPE"}</p>
                {Object.entries(typeConfig).map(([key, val]) => (
                  <button
                    key={key}
                    className="filter-btn"
                    style={{ ...styles.filterBtn, ...(quickFilter === key ? styles.filterActive : {}) }}
                    onClick={() => setQuickFilter(key)}
                  >
                    <span>{val.icon + " " + val.label}</span>
                    <span style={styles.filterCount}>
                      {reports.filter(r => r.emergencyType === key).length}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* ── FILTER TAB ── */}
          {activeTab === "filter" && (
            <div style={styles.filterPanel}>
              <p style={styles.filterTitle}>{"EMERGENCY TYPE"}</p>
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                style={styles.select}
              >
                <option value="">All Types</option>
                {Object.entries(typeConfig).map(([key, val]) => (
                  <option key={key} value={key}>{val.icon + " " + val.label}</option>
                ))}
              </select>

              <p style={{ ...styles.filterTitle, marginTop: "14px" }}>{"LOCATION / AREA"}</p>
              <input
                type="text"
                placeholder="e.g. Dhaka, Mirpur..."
                value={filterArea}
                onChange={e => setFilterArea(e.target.value)}
                style={styles.filterInput}
              />

              <p style={{ ...styles.filterTitle, marginTop: "14px" }}>{"DATE RANGE"}</p>
              <div style={styles.dateRow}>
                <div style={styles.dateField}>
                  <label style={styles.dateLabel}>{"From"}</label>
                  <input
                    type="date"
                    value={filterStart}
                    onChange={e => setFilterStart(e.target.value)}
                    style={styles.dateInput}
                  />
                </div>
                <div style={styles.dateField}>
                  <label style={styles.dateLabel}>{"To"}</label>
                  <input
                    type="date"
                    value={filterEnd}
                    onChange={e => setFilterEnd(e.target.value)}
                    style={styles.dateInput}
                  />
                </div>
              </div>

              <button
                className="apply-btn"
                style={styles.applyBtn}
                onClick={handleApplyFilter}
                disabled={filtering}
              >
                {filtering ? "⏳ Filtering..." : "🔎 Apply Filter"}
              </button>

              {filterApplied && (
                <button
                  className="clear-btn"
                  style={styles.clearBtn}
                  onClick={handleClearFilter}
                >
                  {"✕ Clear & Reset"}
                </button>
              )}

              {filterApplied && (
                <div style={styles.filterResultBadge}>
                  <span style={{ color: "#00ff88", fontWeight: "700" }}>{reports.length}</span>
                  <span style={{ color: "#555555", fontSize: "11px" }}>{" results found"}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── MIDDLE PANEL ── */}
        <div style={styles.middlePanel}>
          {displayed.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>{"📋"}</div>
              <p style={styles.emptyTitle}>{"No reports found"}</p>
              {filterApplied && (
                <p style={{ color: "#444444", fontSize: "12px" }}>
                  {"Try adjusting your filters"}
                </p>
              )}
            </div>
          ) : (
            displayed.map((report, i) => {
              const type = typeConfig[report.emergencyType] || {};
              const status = statusConfig[report.status] || {};
              return (
                <div
                  key={report._id}
                  className={"report-card" + (selectedReport?._id === report._id ? " selected" : "")}
                  style={{ ...styles.reportCard, animationDelay: `${i * 0.04}s` }}
                  onClick={() => setSelectedReport(selectedReport?._id === report._id ? null : report)}
                >
                  <div style={styles.cardTop}>
                    <div style={styles.cardLeft}>
                      <div style={{ ...styles.typeIconBox, backgroundColor: type.color + "15" }}>
                        {type.icon}
                      </div>
                      <div>
                        <p style={{ ...styles.cardType, color: type.color }}>{type.label}</p>
                        <p style={styles.cardUser}>{"👤 " + (report.userId?.name || "Unknown")}</p>
                      </div>
                    </div>
                    <span style={{ ...styles.statusBadge, color: status.color, backgroundColor: status.bg }}>
                      {status.icon + " " + report.status}
                    </span>
                  </div>
                  <p style={styles.cardDesc}>
                    {(report.description || "").substring(0, 90) + "..."}
                  </p>
                  {report.location?.area && (
                    <LocationTag location={report.location} />
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* ── RIGHT PANEL ── */}
        <div style={styles.rightPanel}>
          {selectedReport ? (
            <div style={{ animation: "slideIn 0.3s ease" }}>
              <div style={styles.detailHeader}>
                <h3 style={styles.detailTitle}>{"Report Details"}</h3>
                <button style={styles.closeBtn} onClick={() => setSelectedReport(null)}>{"✕"}</button>
              </div>

              <div style={{
                ...styles.typeBadge,
                backgroundColor: (typeConfig[selectedReport.emergencyType]?.color || "#888") + "10",
                border: "1px solid " + (typeConfig[selectedReport.emergencyType]?.color || "#888") + "25",
              }}>
                <span style={{ fontSize: "26px" }}>
                  {typeConfig[selectedReport.emergencyType]?.icon}
                </span>
                <div>
                  <p style={{ color: typeConfig[selectedReport.emergencyType]?.color, fontWeight: "700", fontSize: "14px" }}>
                    {typeConfig[selectedReport.emergencyType]?.label}
                  </p>
                  <p style={styles.badgeSub}>{"Emergency Type"}</p>
                </div>
              </div>

              <div style={styles.statusUpdateBox}>
                <p style={styles.statusUpdateTitle}>{"🔄 Update Status"}</p>
                <p style={styles.statusCurrentText}>
                  {"Current: "}
                  <span style={{ color: statusConfig[selectedReport.status]?.color, fontWeight: "700" }}>
                    {statusConfig[selectedReport.status]?.icon + " " + selectedReport.status}
                  </span>
                </p>
                <div style={styles.statusBtns}>
                  {["Pending", "Verified", "Resolved"].map((status) => (
                    <button
                      key={status}
                      className="status-btn"
                      disabled={selectedReport.status === status || updatingStatus}
                      style={{
                        ...styles.statusBtn,
                        borderColor: statusConfig[status]?.color,
                        color: selectedReport.status === status ? "#0a0a0a" : statusConfig[status]?.color,
                        backgroundColor: selectedReport.status === status
                          ? statusConfig[status]?.color
                          : statusConfig[status]?.color + "12",
                      }}
                      onClick={() => handleStatusUpdate(selectedReport._id, status)}
                    >
                      {updatingStatus ? "..." : statusConfig[status]?.icon + " " + status + (selectedReport.status === status ? " ✓" : "")}
                    </button>
                  ))}
                </div>
              </div>

              <LocationDetail location={selectedReport.location} />

              <div style={styles.detailSection}>
                <p style={styles.detailSectionTitle}>{"📝 Description"}</p>
                <p style={styles.detailDesc}>{selectedReport.description}</p>
              </div>

              {selectedReport.imageUrl && (
                <div style={styles.detailSection}>
                  <p style={styles.detailSectionTitle}>{"📷 Attached Image"}</p>
                  <div style={styles.imageThumbWrap}>
                    <img
                      className="img-thumb"
                      src={getImageUrl(selectedReport.imageUrl)}
                      alt="report"
                      style={styles.detailImage}
                      onClick={() => setLightboxImage(getImageUrl(selectedReport.imageUrl))}
                      onError={e => {
                        e.target.style.display = "none";
                        e.target.nextSibling.style.display = "flex";
                      }}
                    />
                    <div style={styles.imageFallback}>
                      <span style={{ fontSize: "24px" }}>{"🖼️"}</span>
                      <span style={{ fontSize: "12px", color: "#555" }}>{"Image unavailable"}</span>
                    </div>
                  </div>
                  <div style={styles.imageActions}>
                    <button
                      className="action-btn"
                      style={styles.imageActionBtn}
                      onClick={() => setLightboxImage(getImageUrl(selectedReport.imageUrl))}
                    >
                      {"🔍 View Full"}
                    </button>
                    <button
                      className="action-btn"
                      style={styles.imageActionBtn}
                      onClick={() => downloadImage(
                        getImageUrl(selectedReport.imageUrl),
                        selectedReport.imageUrl.split("/").pop()
                      )}
                    >
                      {"⬇️ Download"}
                    </button>
                  </div>
                </div>
              )}

              <div style={styles.detailMeta}>
                {[
                  { label: "Reported By", value: selectedReport.userId?.name || "Unknown" },
                  { label: "Contact", value: selectedReport.userId?.contactInfo || "N/A" },
                  { label: "User Area", value: selectedReport.userId?.area || "N/A" },
                  {
                    label: "Submitted",
                    value: new Date(selectedReport.createdAt).toLocaleDateString("en-US", {
                      year: "numeric", month: "long", day: "numeric"
                    })
                  },
                  {
                    label: "Time",
                    value: new Date(selectedReport.createdAt).toLocaleTimeString("en-US", {
                      hour: "2-digit", minute: "2-digit"
                    })
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
              <p style={styles.detailEmptyText}>{"Click a report to view details"}</p>
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
    width: "240px", minWidth: "240px",
    backgroundColor: "#0d0d0d", borderRight: "1px solid #1e1e1e",
    padding: "28px 20px", display: "flex",
    flexDirection: "column", gap: "16px", overflowY: "auto",
  },
  leftHeader: { paddingBottom: "16px", borderBottom: "1px solid #1e1e1e" },
  leftTitle: { color: "#ffffff", fontSize: "18px", fontWeight: "700" },
  leftSubtitle: { color: "#555555", fontSize: "12px", marginTop: "4px" },
  tabRow: {
    display: "flex", gap: "6px",
    backgroundColor: "#1a1a1a", borderRadius: "10px", padding: "4px",
  },
  tabBtn: {
    flex: 1, padding: "8px", borderRadius: "7px",
    border: "none", backgroundColor: "transparent",
    color: "#555555", fontSize: "12px", fontWeight: "600",
    cursor: "pointer", fontFamily: "inherit",
  },
  tabActive: { backgroundColor: "#222222", color: "#00ff88" },
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
  filterPanel: { display: "flex", flexDirection: "column", gap: "6px" },
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
  select: {
    width: "100%", padding: "9px 12px",
    backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a",
    borderRadius: "8px", color: "#e0e0e0",
    fontSize: "13px", fontFamily: "inherit", cursor: "pointer",
  },
  filterInput: {
    width: "100%", padding: "9px 12px",
    backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a",
    borderRadius: "8px", color: "#e0e0e0",
    fontSize: "13px", fontFamily: "inherit",
    boxSizing: "border-box",
  },
  dateRow: { display: "flex", gap: "8px" },
  dateField: { flex: 1, display: "flex", flexDirection: "column", gap: "4px" },
  dateLabel: { color: "#444444", fontSize: "10px", fontWeight: "600" },
  dateInput: {
    width: "100%", padding: "8px 10px",
    backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a",
    borderRadius: "8px", color: "#e0e0e0",
    fontSize: "11px", fontFamily: "inherit",
    boxSizing: "border-box",
  },
  applyBtn: {
    width: "100%", padding: "11px",
    backgroundColor: "rgba(0,255,136,0.12)",
    border: "1px solid rgba(0,255,136,0.3)",
    borderRadius: "9px", color: "#00ff88",
    fontSize: "13px", fontWeight: "700",
    cursor: "pointer", fontFamily: "inherit",
    marginTop: "6px",
  },
  clearBtn: {
    width: "100%", padding: "9px",
    backgroundColor: "transparent",
    border: "1px solid #2a2a2a",
    borderRadius: "9px", color: "#555555",
    fontSize: "12px", cursor: "pointer",
    fontFamily: "inherit",
  },
  filterResultBadge: {
    textAlign: "center", padding: "10px",
    backgroundColor: "rgba(0,255,136,0.05)",
    border: "1px solid rgba(0,255,136,0.1)",
    borderRadius: "8px", display: "flex",
    alignItems: "center", justifyContent: "center", gap: "4px",
  },
  middlePanel: { flex: 1, overflowY: "auto", borderRight: "1px solid #1e1e1e" },
  emptyState: {
    display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    height: "100%", gap: "12px", padding: "60px",
  },
  emptyIcon: { fontSize: "48px", opacity: 0.3 },
  emptyTitle: { color: "#555555", fontSize: "15px" },
  reportCard: {
    padding: "20px 24px", borderBottom: "1px solid #1a1a1a",
    cursor: "pointer", animation: "fadeUp 0.4s ease both",
    border: "1px solid transparent", borderBottomColor: "#1a1a1a",
  },
  cardTop: {
    display: "flex", justifyContent: "space-between",
    alignItems: "center", marginBottom: "10px",
  },
  cardLeft: { display: "flex", alignItems: "center", gap: "12px" },
  typeIconBox: {
    width: "38px", height: "38px", borderRadius: "10px",
    display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px",
  },
  cardType: { fontSize: "13px", fontWeight: "700" },
  cardUser: { color: "#555555", fontSize: "11px", marginTop: "2px" },
  statusBadge: { fontSize: "11px", fontWeight: "600", padding: "4px 10px", borderRadius: "20px" },
  cardDesc: { color: "#888888", fontSize: "13px", lineHeight: "1.6" },
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
  typeBadge: {
    display: "flex", alignItems: "center", gap: "14px",
    borderRadius: "12px", padding: "16px", marginBottom: "16px",
  },
  badgeSub: { color: "#444444", fontSize: "11px", marginTop: "2px" },
  statusUpdateBox: {
    backgroundColor: "#1a1a1a", border: "1px solid #222222",
    borderRadius: "14px", padding: "18px",
    marginBottom: "16px",
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
  imageThumbWrap: {
    position: "relative", cursor: "pointer",
    borderRadius: "10px", overflow: "hidden", marginBottom: "8px",
  },
  detailImage: {
    width: "100%", borderRadius: "10px",
    objectFit: "cover", maxHeight: "180px",
    display: "block", transition: "opacity 0.3s ease",
  },
  imageFallback: {
    display: "none",
    backgroundColor: "#1a1a1a", border: "1px solid #222222",
    borderRadius: "10px", padding: "20px",
    alignItems: "center", justifyContent: "center",
    flexDirection: "column", gap: "8px",
  },
  imageActions: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" },
  imageActionBtn: {
    backgroundColor: "rgba(0,255,136,0.08)",
    border: "1px solid rgba(0,255,136,0.2)",
    color: "#00ff88", padding: "8px",
    borderRadius: "8px", fontSize: "12px",
    fontWeight: "600", cursor: "pointer",
    fontFamily: "inherit", textAlign: "center",
    transition: "all 0.3s ease",
  },
  detailMeta: {
    backgroundColor: "#1a1a1a", border: "1px solid #222222",
    borderRadius: "12px", padding: "16px",
    display: "flex", flexDirection: "column", gap: "10px",
  },
  metaRow: { display: "flex", justifyContent: "space-between" },
  metaLabel: { color: "#444444", fontSize: "12px" },
  metaValue: { color: "#e0e0e0", fontSize: "12px", fontWeight: "500" },
  detailEmpty: {
    height: "100%", display: "flex",
    flexDirection: "column", alignItems: "center",
    justifyContent: "center", gap: "12px", textAlign: "center", padding: "40px",
  },
  detailEmptyText: { color: "#333333", fontSize: "13px" },
};

export default AdminReports;