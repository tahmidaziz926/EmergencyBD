import { useState, useEffect, useRef } from "react";
import axios from "axios";
import useAuth from "../hooks/useAuth";
import Navbar from "../components/Navbar";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default marker icon broken in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const typeConfig = {
    robbery: { icon: "🔫", color: "#ff6b6b", label: "Robbery" },
    fire: { icon: "🔥", color: "#ff9f43", label: "Fire" },
    accident: { icon: "🚗", color: "#ffd93d", label: "Accident" },
    harassment: { icon: "⚠️", color: "#a29bfe", label: "Harassment" },
    medical: { icon: "🏥", color: "#00ff88", label: "Medical" },
};

const statusConfig = {
    Pending: { color: "#ffaa00", icon: "⏳" },
    Verified: { color: "#00ff88", icon: "✅" },
    Resolved: { color: "#6bcbff", icon: "🎯" },
};

// Create colored custom marker icon for each emergency type
const createMarkerIcon = (type) => {
    const color = typeConfig[type]?.color || "#00ff88";
    const emoji = typeConfig[type]?.icon || "📍";
    return L.divIcon({
        className: "",
        html: `
      <div style="
        background: #111111;
        border: 2.5px solid ${color};
        border-radius: 50% 50% 50% 0;
        width: 36px;
        height: 36px;
        transform: rotate(-45deg);
        box-shadow: 0 4px 12px rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <span style="
          transform: rotate(45deg);
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
        ">${emoji}</span>
      </div>
    `,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36],
    });
};

// Fly to selected report on map
const MapFlyTo = ({ position }) => {
    const map = useMap();
    useEffect(() => {
        if (position) {
            map.flyTo(position, 15, { duration: 1.2 });
        }
    }, [position, map]);
    return null;
};

const EmergencyMap = () => {
    const { token, role } = useAuth();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState(null);
    const [filterType, setFilterType] = useState("all");
    const [filterStatus, setFilterStatus] = useState("all");
    const [flyTo, setFlyTo] = useState(null);
    const markerRefs = useRef({});

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        setLoading(true);
        try {
            // Admin sees all reports, user sees only their own
            const url = role === "admin"
                ? "http://localhost:3001/api/admin/reports"
                : "http://localhost:3001/api/emergency/my-reports";

            const res = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setReports(res.data);
        } catch (err) {
            console.error("Failed to fetch reports:", err);
        }
        setLoading(false);
    };

    // Only show reports that have GPS coordinates
    const mappableReports = reports.filter(
        r => r.location?.lat && r.location?.lng
    );

    const displayed = mappableReports.filter(r => {
        const matchType = filterType === "all" || r.emergencyType === filterType;
        const matchStatus = filterStatus === "all" || r.status === filterStatus;
        return matchType && matchStatus;
    });

    const handleSelectReport = (report) => {
        setSelectedReport(report);
        if (report.location?.lat && report.location?.lng) {
            setFlyTo([report.location.lat, report.location.lng]);
        }
        // Open the marker popup
        const marker = markerRefs.current[report._id];
        if (marker) marker.openPopup();
    };

    // Default center — Dhaka, Bangladesh
    const defaultCenter = [23.8103, 90.4125];

    if (loading) return (
        <div style={styles.loadingScreen}>
            <style>{"@keyframes spin { to { transform: rotate(360deg); } }"}</style>
            <div style={styles.spinner}></div>
            <p style={styles.loadingText}>{"Loading emergency map..."}</p>
        </div>
    );

    return (
        <div style={styles.page}>
            <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        .leaflet-container { background: #1a1a1a !important; }
        .leaflet-popup-content-wrapper {
          background: #161616 !important;
          border: 1px solid #2a2a2a !important;
          border-radius: 12px !important;
          box-shadow: 0 20px 40px rgba(0,0,0,0.8) !important;
          color: #e0e0e0 !important;
        }
        .leaflet-popup-tip { background: #161616 !important; }
        .leaflet-popup-close-button { color: #555555 !important; font-size: 18px !important; top: 10px !important; right: 12px !important; }
        .leaflet-popup-close-button:hover { color: #ffffff !important; }
        .leaflet-control-zoom a {
          background: #1a1a1a !important;
          color: #e0e0e0 !important;
          border-color: #2a2a2a !important;
        }
        .leaflet-control-zoom a:hover { background: #222222 !important; color: #00ff88 !important; }
        .leaflet-control-attribution { background: rgba(17,17,17,0.8) !important; color: #333333 !important; }
        .leaflet-control-attribution a { color: #555555 !important; }
        .report-list-item { transition: all 0.2s ease !important; }
        .report-list-item:hover { background: rgba(0,255,136,0.06) !important; border-color: rgba(0,255,136,0.2) !important; }
        .report-list-item.active { background: rgba(0,255,136,0.08) !important; border-color: #00ff88 !important; }
        .filter-btn { transition: all 0.2s ease !important; }
        .filter-btn:hover { color: #00ff88 !important; }
      `}</style>

            <Navbar />

            <div style={styles.layout}>

                {/* ── LEFT PANEL ── */}
                <div style={styles.leftPanel}>
                    <div style={styles.leftHeader}>
                        <h2 style={styles.leftTitle}>{"Emergency Map"}</h2>
                        <p style={styles.leftSubtitle}>
                            {displayed.length}{" of "}{mappableReports.length}{" reports on map"}
                        </p>
                        {reports.length - mappableReports.length > 0 && (
                            <p style={styles.noGpsNote}>
                                {"⚠️ " + (reports.length - mappableReports.length) + " report(s) have no GPS — not shown"}
                            </p>
                        )}
                    </div>

                    {/* Filter by type */}
                    <div style={styles.filterSection}>
                        <p style={styles.filterTitle}>{"TYPE"}</p>
                        <button
                            className="filter-btn"
                            style={{ ...styles.filterBtn, ...(filterType === "all" ? styles.filterActive : {}) }}
                            onClick={() => setFilterType("all")}
                        >
                            <span>{"🗂 All"}</span>
                            <span style={styles.filterCount}>{mappableReports.length}</span>
                        </button>
                        {Object.entries(typeConfig).map(([key, val]) => (
                            <button
                                key={key}
                                className="filter-btn"
                                style={{ ...styles.filterBtn, ...(filterType === key ? styles.filterActive : {}) }}
                                onClick={() => setFilterType(key)}
                            >
                                <span>{val.icon + " " + val.label}</span>
                                <span style={styles.filterCount}>
                                    {mappableReports.filter(r => r.emergencyType === key).length}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Filter by status */}
                    <div style={styles.filterSection}>
                        <p style={styles.filterTitle}>{"STATUS"}</p>
                        <button
                            className="filter-btn"
                            style={{ ...styles.filterBtn, ...(filterStatus === "all" ? styles.filterActive : {}) }}
                            onClick={() => setFilterStatus("all")}
                        >
                            <span>{"🗂 All"}</span>
                            <span style={styles.filterCount}>{mappableReports.length}</span>
                        </button>
                        {Object.entries(statusConfig).map(([key, val]) => (
                            <button
                                key={key}
                                className="filter-btn"
                                style={{ ...styles.filterBtn, ...(filterStatus === key ? styles.filterActive : {}) }}
                                onClick={() => setFilterStatus(key)}
                            >
                                <span>{val.icon + " " + key}</span>
                                <span style={styles.filterCount}>
                                    {mappableReports.filter(r => r.status === key).length}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Report list */}
                    <div style={styles.reportListSection}>
                        <p style={styles.filterTitle}>{"REPORTS"}</p>
                        {displayed.length === 0 ? (
                            <p style={styles.noReports}>{"No reports with GPS found."}</p>
                        ) : (
                            <div style={styles.reportList}>
                                {displayed.map(report => {
                                    const tc = typeConfig[report.emergencyType] || {};
                                    const sc = statusConfig[report.status] || {};
                                    const isActive = selectedReport?._id === report._id;
                                    return (
                                        <div
                                            key={report._id}
                                            className={"report-list-item" + (isActive ? " active" : "")}
                                            style={{
                                                ...styles.reportListItem,
                                                borderColor: isActive ? "#00ff88" : "#1e1e1e",
                                            }}
                                            onClick={() => handleSelectReport(report)}
                                        >
                                            <span style={{ fontSize: "16px" }}>{tc.icon}</span>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <p style={{ ...styles.listItemType, color: tc.color }}>
                                                    {tc.label}
                                                </p>
                                                <p style={styles.listItemArea}>
                                                    {"📍 " + (report.location?.area || "GPS location")}
                                                </p>
                                            </div>
                                            <span style={{
                                                fontSize: "10px", color: sc.color,
                                                backgroundColor: sc.color + "15",
                                                padding: "2px 6px", borderRadius: "10px",
                                                whiteSpace: "nowrap",
                                            }}>
                                                {sc.icon}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── MAP ── */}
                <div style={styles.mapContainer}>
                    <MapContainer
                        center={defaultCenter}
                        zoom={12}
                        style={{ width: "100%", height: "100%" }}
                        zoomControl={true}
                    >
                        <TileLayer
                            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
                        />

                        {flyTo && <MapFlyTo position={flyTo} />}

                        {displayed.map(report => (
                            <Marker
                                key={report._id}
                                position={[report.location.lat, report.location.lng]}
                                icon={createMarkerIcon(report.emergencyType)}
                                ref={el => { markerRefs.current[report._id] = el; }}
                                eventHandlers={{
                                    click: () => setSelectedReport(report),
                                }}
                            >
                                <Popup minWidth={220} maxWidth={280}>
                                    <div style={popupStyles.container}>
                                        <div style={popupStyles.header}>
                                            <span style={{ fontSize: "20px" }}>
                                                {typeConfig[report.emergencyType]?.icon}
                                            </span>
                                            <div>
                                                <p style={{
                                                    ...popupStyles.type,
                                                    color: typeConfig[report.emergencyType]?.color,
                                                }}>
                                                    {typeConfig[report.emergencyType]?.label}
                                                </p>
                                                <p style={{
                                                    ...popupStyles.status,
                                                    color: statusConfig[report.status]?.color,
                                                }}>
                                                    {statusConfig[report.status]?.icon + " " + report.status}
                                                </p>
                                            </div>
                                        </div>
                                        <p style={popupStyles.desc}>
                                            {(report.description || "").substring(0, 100)}
                                            {(report.description || "").length > 100 ? "..." : ""}
                                        </p>
                                        {report.location?.area && (
                                            <p style={popupStyles.area}>{"📍 " + report.location.area}</p>
                                        )}
                                        {role === "admin" && report.userId?.name && (
                                            <p style={popupStyles.user}>{"👤 " + report.userId.name}</p>
                                        )}
                                        <p style={popupStyles.date}>
                                            {new Date(report.createdAt).toLocaleDateString("en-US", {
                                                year: "numeric", month: "short", day: "numeric",
                                            })}
                                        </p>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>

                    {/* Map legend */}
                    <div style={styles.legend}>
                        <p style={styles.legendTitle}>{"LEGEND"}</p>
                        {Object.entries(typeConfig).map(([key, val]) => (
                            <div key={key} style={styles.legendItem}>
                                <div style={{
                                    ...styles.legendDot,
                                    backgroundColor: val.color,
                                }}></div>
                                <span style={styles.legendLabel}>{val.icon + " " + val.label}</span>
                            </div>
                        ))}
                    </div>

                    {/* Stats overlay */}
                    <div style={styles.statsOverlay}>
                        <div style={styles.statChip}>
                            <span style={styles.statNum}>{displayed.length}</span>
                            <span style={styles.statLabel}>{"shown"}</span>
                        </div>
                        <div style={styles.statChip}>
                            <span style={{ ...styles.statNum, color: "#ffaa00" }}>
                                {displayed.filter(r => r.status === "Pending").length}
                            </span>
                            <span style={styles.statLabel}>{"pending"}</span>
                        </div>
                        <div style={styles.statChip}>
                            <span style={{ ...styles.statNum, color: "#00ff88" }}>
                                {displayed.filter(r => r.status === "Verified").length}
                            </span>
                            <span style={styles.statLabel}>{"verified"}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const popupStyles = {
    container: { padding: "4px 2px", minWidth: "200px" },
    header: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" },
    type: { fontSize: "14px", fontWeight: "700", margin: 0 },
    status: { fontSize: "11px", fontWeight: "600", margin: "2px 0 0 0" },
    desc: { color: "#aaaaaa", fontSize: "12px", lineHeight: "1.5", margin: "0 0 8px 0" },
    area: { color: "#00ff88", fontSize: "11px", margin: "0 0 4px 0" },
    user: { color: "#666666", fontSize: "11px", margin: "0 0 4px 0" },
    date: { color: "#444444", fontSize: "10px", margin: "6px 0 0 0" },
};

const styles = {
    page: { backgroundColor: "#111111", minHeight: "100vh", display: "flex", flexDirection: "column" },
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
    layout: { display: "flex", flex: 1, minHeight: "calc(100vh - 80px)" },
    leftPanel: {
        width: "240px", minWidth: "240px",
        backgroundColor: "#0d0d0d", borderRight: "1px solid #1e1e1e",
        padding: "24px 16px", display: "flex",
        flexDirection: "column", gap: "16px", overflowY: "auto",
    },
    leftHeader: { paddingBottom: "14px", borderBottom: "1px solid #1e1e1e" },
    leftTitle: { color: "#ffffff", fontSize: "16px", fontWeight: "700" },
    leftSubtitle: { color: "#555555", fontSize: "12px", marginTop: "4px" },
    noGpsNote: {
        color: "#444444", fontSize: "10px",
        lineHeight: "1.5", marginTop: "6px",
    },
    filterSection: { display: "flex", flexDirection: "column", gap: "3px" },
    filterTitle: {
        color: "#333333", fontSize: "10px",
        fontWeight: "700", letterSpacing: "1px", marginBottom: "4px",
    },
    filterBtn: {
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "8px 10px", borderRadius: "7px", border: "1px solid transparent",
        backgroundColor: "transparent", color: "#666666",
        fontSize: "12px", cursor: "pointer", width: "100%", fontFamily: "inherit",
    },
    filterActive: {
        backgroundColor: "rgba(0,255,136,0.08)",
        border: "1px solid rgba(0,255,136,0.2)", color: "#00ff88",
    },
    filterCount: {
        backgroundColor: "#222222", color: "#555555",
        fontSize: "10px", padding: "1px 7px", borderRadius: "10px",
    },
    reportListSection: { display: "flex", flexDirection: "column", gap: "6px", flex: 1 },
    noReports: { color: "#444444", fontSize: "12px", textAlign: "center", padding: "20px 0" },
    reportList: { display: "flex", flexDirection: "column", gap: "4px", overflowY: "auto" },
    reportListItem: {
        display: "flex", alignItems: "center", gap: "8px",
        padding: "8px 10px", borderRadius: "8px",
        border: "1px solid #1e1e1e", cursor: "pointer",
        backgroundColor: "#111111",
    },
    listItemType: { fontSize: "12px", fontWeight: "600" },
    listItemArea: { color: "#444444", fontSize: "10px", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
    mapContainer: {
        flex: 1, position: "relative",
        minHeight: "calc(100vh - 80px)",
    },
    legend: {
        position: "absolute", bottom: "24px", left: "16px",
        backgroundColor: "rgba(13,13,13,0.92)",
        border: "1px solid #222222", borderRadius: "10px",
        padding: "12px 14px", zIndex: 1000,
        display: "flex", flexDirection: "column", gap: "6px",
        backdropFilter: "blur(8px)",
    },
    legendTitle: {
        color: "#333333", fontSize: "9px",
        fontWeight: "700", letterSpacing: "1px", marginBottom: "4px",
    },
    legendItem: { display: "flex", alignItems: "center", gap: "8px" },
    legendDot: { width: "8px", height: "8px", borderRadius: "50%" },
    legendLabel: { color: "#888888", fontSize: "11px" },
    statsOverlay: {
        position: "absolute", top: "16px", right: "16px",
        display: "flex", gap: "8px", zIndex: 1000,
    },
    statChip: {
        backgroundColor: "rgba(13,13,13,0.92)",
        border: "1px solid #222222", borderRadius: "8px",
        padding: "8px 12px", display: "flex",
        flexDirection: "column", alignItems: "center",
        backdropFilter: "blur(8px)",
    },
    statNum: { color: "#ffffff", fontSize: "16px", fontWeight: "700" },
    statLabel: { color: "#444444", fontSize: "10px", marginTop: "2px" },
};

export default EmergencyMap;