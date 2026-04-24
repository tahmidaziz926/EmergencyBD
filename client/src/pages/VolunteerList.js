import { useState, useEffect } from "react";
import axios from "axios";
import useAuth from "../hooks/useAuth";
import Navbar from "../components/Navbar";

const VolunteerList = () => {
    const { token } = useAuth();
    const [volunteers, setVolunteers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null);
    const [loadingProfile, setLoadingProfile] = useState(false);
    const [search, setSearch] = useState("");
    const [showHistory, setShowHistory] = useState(false);

    useEffect(() => { fetchVolunteers(); }, []);

    const fetchVolunteers = async () => {
        setLoading(true);
        try {
            const res = await axios.get("http://localhost:3001/api/volunteer/list", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setVolunteers(res.data);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const handleSelectUser = async (user) => {
        setSelectedUser(user);
        setShowHistory(false);
        setLoadingProfile(true);
        try {
            const res = await axios.get(
                `http://localhost:3001/api/volunteer/list/${user._id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setSelectedUser(res.data);
        } catch (err) {
            console.error(err);
        }
        setLoadingProfile(false);
    };

    const getRankStyle = (i) => {
        if (i === 0) return { icon: "🥇", color: "#ffd93d", bg: "rgba(255,217,61,0.12)", border: "rgba(255,217,61,0.3)" };
        if (i === 1) return { icon: "🥈", color: "#c0c0c0", bg: "rgba(192,192,192,0.08)", border: "rgba(192,192,192,0.2)" };
        if (i === 2) return { icon: "🥉", color: "#cd7f32", bg: "rgba(205,127,50,0.08)", border: "rgba(205,127,50,0.2)" };
        return { icon: `#${i + 1}`, color: "#555555", bg: "transparent", border: "transparent" };
    };

    const displayed = volunteers.filter(v =>
        (v.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (v.area || "").toLowerCase().includes(search.toLowerCase())
    );

    const totalPoints = volunteers.reduce((s, v) => s + (v.points || 0), 0);
    const totalActivities = volunteers.reduce((s, v) => s + (v.volunteerHistory?.length || 0), 0);

    if (loading) return (
        <div style={S.loadingScreen}>
            <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
            <div style={S.spinner} />
            <p style={S.loadingText}>{"Loading volunteer list..."}</p>
        </div>
    );

    return (
        <div style={S.page}>
            <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideIn { from { opacity:0; transform:translateX(22px); } to { opacity:1; transform:translateX(0); } }
        @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.03)} }

        .vol-row { transition: all 0.22s ease !important; cursor: pointer; }
        .vol-row:hover { background: rgba(0,255,136,0.035) !important; }
        .vol-row:hover .vol-name { color: #00ff88 !important; }
        .vol-row.active-row { background: rgba(0,255,136,0.06) !important; border-left: 3px solid #00ff88 !important; }

        .pts-chip { transition: all 0.2s ease !important; }
        .pts-chip:hover { transform: scale(1.08) !important; filter: brightness(1.2) !important; }

        .hist-item { transition: background 0.2s ease !important; }
        .hist-item:hover { background: rgba(255,255,255,0.03) !important; }

        input:focus { border-color: #00ff88 !important; outline: none !important; box-shadow: 0 0 0 3px rgba(0,255,136,0.08) !important; }
      `}</style>

            <Navbar />
            <div style={S.layout}>

                {/* ── LEFT SIDEBAR ── */}
                <div style={S.sidebar}>
                    <div style={S.sidebarTop}>
                        <div style={S.sidebarIconWrap}>
                            <span style={{ fontSize: 22 }}>{"🤝"}</span>
                        </div>
                        <div>
                            <p style={S.sidebarTitle}>{"Volunteer"}</p>
                            <p style={S.sidebarSub}>{"Hall of Fame"}</p>
                        </div>
                    </div>

                    <div style={S.searchWrap}>
                        <span style={{ fontSize: 13, color: "#444" }}>{"🔍"}</span>
                        <input
                            type="text"
                            placeholder="Search name or area..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={S.searchInput}
                        />
                        {search && (
                            <button onClick={() => setSearch("")} style={S.clearBtn}>{"✕"}</button>
                        )}
                    </div>

                    {/* Stats */}
                    <div style={S.statsSection}>
                        <p style={S.statsSectionTitle}>{"OVERVIEW"}</p>
                        {[
                            { label: "Active Volunteers", value: volunteers.length, color: "#00ff88" },
                            { label: "Total Points Awarded", value: totalPoints, color: "#ffd93d" },
                            { label: "Total Activities", value: totalActivities, color: "#6bcbff" },
                        ].map((s, i) => (
                            <div key={i} style={S.statRow}>
                                <span style={S.statLabel}>{s.label}</span>
                                <span style={{ ...S.statValue, color: s.color }}>{s.value}</span>
                            </div>
                        ))}
                    </div>

                    {search && (
                        <p style={{ color: "#444", fontSize: 11, textAlign: "center" }}>
                            {displayed.length + " of " + volunteers.length + " shown"}
                        </p>
                    )}
                </div>

                {/* ── MAIN LIST ── */}
                <div style={S.main}>
                    {/* Column headers */}
                    <div style={S.listHeader}>
                        <span style={S.lhRank}>{"Rank"}</span>
                        <span style={S.lhName}>{"Volunteer"}</span>
                        <span style={S.lhActivities}>{"Activities"}</span>
                        <span style={S.lhPoints}>{"Points"}</span>
                    </div>

                    {displayed.length === 0 ? (
                        <div style={S.emptyState}>
                            <div style={{ fontSize: 44, opacity: 0.2 }}>{"🤝"}</div>
                            <p style={{ color: "#555", fontSize: 15, fontWeight: 600 }}>
                                {search ? "No matches found" : "No approved volunteers yet"}
                            </p>
                            <p style={{ color: "#333", fontSize: 12 }}>
                                {search ? "Try a different search" : "Volunteers appear here after admin approval"}
                            </p>
                        </div>
                    ) : (
                        displayed.map((vol, i) => {
                            const rank = getRankStyle(i);
                            const isActive = selectedUser?._id === vol._id;
                            return (
                                <div
                                    key={vol._id}
                                    className={"vol-row" + (isActive ? " active-row" : "")}
                                    style={{
                                        ...S.volRow,
                                        animationDelay: `${i * 0.04}s`,
                                        borderLeft: isActive ? "3px solid #00ff88" : "3px solid transparent",
                                        background: i < 3 ? rank.bg : "transparent",
                                    }}
                                    onClick={() => handleSelectUser(vol)}
                                >
                                    {/* Rank */}
                                    <div style={S.rankCell}>
                                        <span style={{
                                            fontSize: i < 3 ? 20 : 13,
                                            color: rank.color,
                                            fontWeight: 700,
                                        }}>
                                            {rank.icon}
                                        </span>
                                    </div>

                                    {/* Name + Area */}
                                    <div style={S.nameCell}>
                                        <div style={{
                                            ...S.avatar,
                                            background: i === 0
                                                ? "linear-gradient(135deg,#ffd93d,#ff9f43)"
                                                : i === 1
                                                    ? "linear-gradient(135deg,#c0c0c0,#888)"
                                                    : i === 2
                                                        ? "linear-gradient(135deg,#cd7f32,#a0522d)"
                                                        : "rgba(0,255,136,0.1)",
                                            border: i < 3 ? "none" : "1px solid rgba(0,255,136,0.2)",
                                            color: i < 3 ? "#111" : "#00ff88",
                                        }}>
                                            {(vol.name || "?").charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="vol-name" style={{
                                                ...S.volName,
                                                color: i < 3 ? rank.color : "#e0e0e0",
                                            }}>
                                                {vol.name}
                                            </p>
                                            <p style={S.volArea}>{"📍 " + (vol.area || "N/A")}</p>
                                        </div>
                                    </div>

                                    {/* Activities */}
                                    <div style={S.activitiesCell}>
                                        <span style={{
                                            ...S.activitiesBadge,
                                            color: "#6bcbff",
                                            backgroundColor: "rgba(107,203,255,0.1)",
                                            border: "1px solid rgba(107,203,255,0.2)",
                                        }}>
                                            {vol.volunteerHistory?.length || 0}
                                        </span>
                                    </div>

                                    {/* Points */}
                                    <div style={S.pointsCell}>
                                        <button
                                            className="pts-chip"
                                            style={{
                                                ...S.ptsChip,
                                                background: i === 0
                                                    ? "linear-gradient(135deg,rgba(255,217,61,0.2),rgba(255,217,61,0.08))"
                                                    : i === 1
                                                        ? "linear-gradient(135deg,rgba(192,192,192,0.15),rgba(192,192,192,0.05))"
                                                        : i === 2
                                                            ? "linear-gradient(135deg,rgba(205,127,50,0.15),rgba(205,127,50,0.05))"
                                                            : "rgba(255,217,61,0.06)",
                                                border: `1px solid ${rank.color}40`,
                                                color: rank.color,
                                            }}
                                            onClick={e => {
                                                e.stopPropagation();
                                                handleSelectUser(vol);
                                                setShowHistory(true);
                                            }}
                                            title="Click to view history"
                                        >
                                            <span style={{ fontSize: 18, fontWeight: 800 }}>{vol.points || 0}</span>
                                            <span style={{ fontSize: 9, opacity: 0.7, letterSpacing: "0.5px" }}>{"PTS"}</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* ── RIGHT DETAIL PANEL ── */}
                <div style={S.detail}>
                    {selectedUser ? (
                        <div style={{ animation: "slideIn 0.25s ease" }}>
                            <div style={S.detailHead}>
                                <h3 style={S.detailTitle}>{"Profile"}</h3>
                                <button style={S.closeBtn} onClick={() => { setSelectedUser(null); setShowHistory(false); }}>{"✕"}</button>
                            </div>

                            {loadingProfile ? (
                                <div style={{ textAlign: "center", padding: "40px 0" }}>
                                    <div style={{ ...S.spinner, margin: "0 auto 12px" }} />
                                    <p style={{ color: "#444", fontSize: 12 }}>{"Loading..."}</p>
                                </div>
                            ) : (
                                <>
                                    {/* Profile hero */}
                                    <div style={S.profileHero}>
                                        <div style={S.profileAvatarLg}>
                                            {(selectedUser.name || "?").charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p style={S.profileName}>{selectedUser.name}</p>
                                            <p style={S.profileArea}>{"📍 " + (selectedUser.area || "N/A")}</p>
                                        </div>
                                    </div>

                                    {/* Stats row */}
                                    <div style={S.profileStats}>
                                        <div style={S.profileStatItem}>
                                            <span style={{ ...S.profileStatNum, color: "#ffd93d" }}>
                                                {selectedUser.points || 0}
                                            </span>
                                            <span style={S.profileStatLabel}>{"Points"}</span>
                                        </div>
                                        <div style={S.profileStatDivider} />
                                        <div style={S.profileStatItem}>
                                            <span style={{ ...S.profileStatNum, color: "#6bcbff" }}>
                                                {selectedUser.volunteerHistory?.length || 0}
                                            </span>
                                            <span style={S.profileStatLabel}>{"Activities"}</span>
                                        </div>
                                        <div style={S.profileStatDivider} />
                                        <div style={S.profileStatItem}>
                                            <span style={{ ...S.profileStatNum, color: "#00ff88" }}>
                                                {volunteers.findIndex(v => v._id === selectedUser._id) + 1 || "—"}
                                            </span>
                                            <span style={S.profileStatLabel}>{"Rank"}</span>
                                        </div>
                                    </div>

                                    {/* History toggle */}
                                    <button
                                        style={{
                                            ...S.histToggleBtn,
                                            borderColor: showHistory ? "rgba(0,255,136,0.3)" : "#222",
                                            color: showHistory ? "#00ff88" : "#666",
                                            background: showHistory ? "rgba(0,255,136,0.06)" : "#1a1a1a",
                                        }}
                                        onClick={() => setShowHistory(p => !p)}
                                    >
                                        <span>{showHistory ? "▲" : "▼"}</span>
                                        <span>{"Participation History"}</span>
                                        <span style={{
                                            marginLeft: "auto",
                                            background: "#222", color: "#555",
                                            fontSize: 10, padding: "2px 7px", borderRadius: 10, fontWeight: 700,
                                        }}>
                                            {selectedUser.volunteerHistory?.length || 0}
                                        </span>
                                    </button>

                                    {showHistory && (
                                        <div style={S.historyBox}>
                                            {(selectedUser.volunteerHistory || []).length === 0 ? (
                                                <div style={{ textAlign: "center", padding: "24px 16px" }}>
                                                    <p style={{ color: "#444", fontSize: 12 }}>{"No activities yet"}</p>
                                                </div>
                                            ) : (
                                                [...(selectedUser.volunteerHistory || [])].reverse().map((h, i) => (
                                                    <div key={i} className="hist-item" style={S.histItem}>
                                                        <div style={S.histDot} />
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <p style={S.histTitle}>{h.opportunityTitle}</p>
                                                            <p style={S.histOrg}>{h.organization}</p>
                                                            <p style={S.histDate}>
                                                                {new Date(h.date).toLocaleDateString("en-US", {
                                                                    month: "short", day: "numeric", year: "numeric"
                                                                })}
                                                            </p>
                                                        </div>
                                                        <div style={S.histPtsBadge}>
                                                            <span style={{ fontSize: 14, fontWeight: 800, color: "#ffd93d" }}>
                                                                {"+" + h.pointsEarned}
                                                            </span>
                                                            <span style={{ fontSize: 9, color: "#888", letterSpacing: "0.5px" }}>{"PT"}</span>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    ) : (
                        <div style={S.detailEmpty}>
                            <div style={{ fontSize: 40, opacity: 0.15 }}>{"🏅"}</div>
                            <p style={{ color: "#444", fontSize: 14, fontWeight: 600 }}>{"Select a volunteer"}</p>
                            <p style={{ color: "#2a2a2a", fontSize: 11, lineHeight: 1.6, maxWidth: 180, textAlign: "center" }}>
                                {"Click any row to view their profile and history. Click their points to jump straight to history."}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const S = {
    page: { backgroundColor: "#0e0e0e", minHeight: "100vh" },
    loadingScreen: { backgroundColor: "#0e0e0e", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 },
    spinner: { width: 36, height: 36, border: "2px solid rgba(0,255,136,0.1)", borderTop: "2px solid #00ff88", borderRadius: "50%", animation: "spin 0.75s linear infinite" },
    loadingText: { color: "#00ff88", fontSize: 13 },
    layout: { display: "flex", minHeight: "calc(100vh - 68px)" },

    sidebar: { width: 220, minWidth: 220, background: "#0a0a0a", borderRight: "1px solid #181818", padding: "20px 14px", display: "flex", flexDirection: "column", gap: 14, overflowY: "auto" },
    sidebarTop: { display: "flex", alignItems: "center", gap: 12, paddingBottom: 14, borderBottom: "1px solid #181818" },
    sidebarIconWrap: { width: 42, height: 42, background: "rgba(0,255,136,0.1)", border: "1px solid rgba(0,255,136,0.2)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
    sidebarTitle: { color: "#fff", fontSize: 15, fontWeight: 800, margin: 0, lineHeight: 1.2 },
    sidebarSub: { color: "#00ff88", fontSize: 11, fontWeight: 700, margin: 0 },

    searchWrap: { display: "flex", alignItems: "center", gap: 8, background: "#141414", border: "1px solid #1f1f1f", borderRadius: 10, padding: "9px 12px" },
    searchInput: { background: "transparent", border: "none", color: "#e0e0e0", fontSize: 12, width: "100%", outline: "none", fontFamily: "inherit" },
    clearBtn: { background: "none", border: "none", color: "#444", fontSize: 11, cursor: "pointer", padding: 0 },

    statsSection: { display: "flex", flexDirection: "column", gap: 8 },
    statsSectionTitle: { color: "#333", fontSize: 9, fontWeight: 700, letterSpacing: "1px", margin: "0 0 4px" },
    statRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 10px", background: "#141414", borderRadius: 8 },
    statLabel: { color: "#555", fontSize: 11 },
    statValue: { fontSize: 14, fontWeight: 800 },

    main: { flex: 1, overflowY: "auto", borderRight: "1px solid #181818" },
    listHeader: { display: "grid", gridTemplateColumns: "56px 1fr 100px 90px", gap: 8, padding: "10px 20px", background: "#0a0a0a", borderBottom: "1px solid #181818", position: "sticky", top: 0, zIndex: 10 },
    lhRank: { color: "#333", fontSize: 10, fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase" },
    lhName: { color: "#333", fontSize: 10, fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase" },
    lhActivities: { color: "#333", fontSize: 10, fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase", textAlign: "center" },
    lhPoints: { color: "#333", fontSize: 10, fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase", textAlign: "right" },

    emptyState: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 400, gap: 10, padding: 40 },

    volRow: { display: "grid", gridTemplateColumns: "56px 1fr 100px 90px", gap: 8, padding: "12px 20px", borderBottom: "1px solid #141414", animation: "fadeUp 0.35s ease both", alignItems: "center" },
    rankCell: { display: "flex", alignItems: "center", justifyContent: "center" },
    nameCell: { display: "flex", alignItems: "center", gap: 10, minWidth: 0 },
    avatar: { width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, flexShrink: 0 },
    volName: { fontSize: 13, fontWeight: 600, margin: 0, transition: "color 0.2s" },
    volArea: { color: "#444", fontSize: 11, margin: "2px 0 0" },
    activitiesCell: { display: "flex", alignItems: "center", justifyContent: "center" },
    activitiesBadge: { fontSize: 13, fontWeight: 700, padding: "3px 10px", borderRadius: 20 },
    pointsCell: { display: "flex", alignItems: "center", justifyContent: "flex-end" },
    ptsChip: { display: "flex", flexDirection: "column", alignItems: "center", padding: "6px 12px", borderRadius: 10, cursor: "pointer", fontFamily: "inherit", border: "1px solid" },

    detail: { width: 280, minWidth: 280, background: "#0a0a0a", padding: "20px 16px", overflowY: "auto" },
    detailHead: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
    detailTitle: { color: "#fff", fontSize: 14, fontWeight: 700, margin: 0 },
    closeBtn: { background: "#1a1a1a", border: "1px solid #222", color: "#555", width: 26, height: 26, borderRadius: "50%", cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" },

    profileHero: { display: "flex", alignItems: "center", gap: 12, background: "linear-gradient(135deg,rgba(0,255,136,0.07),rgba(0,255,136,0.02))", border: "1px solid rgba(0,255,136,0.12)", borderRadius: 14, padding: "14px", marginBottom: 14 },
    profileAvatarLg: { width: 50, height: 50, background: "linear-gradient(135deg,#00ff88,#00cc6a)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#0a0a0a", fontSize: 22, fontWeight: 800, flexShrink: 0 },
    profileName: { color: "#fff", fontSize: 15, fontWeight: 700, margin: 0 },
    profileArea: { color: "#555", fontSize: 11, margin: "3px 0 0" },

    profileStats: { display: "flex", alignItems: "center", background: "#141414", border: "1px solid #1f1f1f", borderRadius: 12, padding: "14px", marginBottom: 14 },
    profileStatItem: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 },
    profileStatNum: { fontSize: 22, fontWeight: 800 },
    profileStatLabel: { color: "#444", fontSize: 10, fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase" },
    profileStatDivider: { width: 1, height: 36, background: "#222", margin: "0 8px" },

    histToggleBtn: { width: "100%", padding: "10px 14px", border: "1px solid", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", marginBottom: 10, display: "flex", alignItems: "center", gap: 8, transition: "all 0.2s ease" },

    historyBox: { background: "#141414", border: "1px solid #1f1f1f", borderRadius: 12, overflow: "hidden" },
    histItem: { display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 14px", borderBottom: "1px solid #1a1a1a" },
    histDot: { width: 8, height: 8, borderRadius: "50%", background: "#00ff88", marginTop: 5, flexShrink: 0 },
    histTitle: { color: "#e0e0e0", fontSize: 12, fontWeight: 600, margin: 0, lineHeight: 1.4 },
    histOrg: { color: "#555", fontSize: 11, margin: "2px 0 0" },
    histDate: { color: "#333", fontSize: 10, margin: "2px 0 0" },
    histPtsBadge: { display: "flex", flexDirection: "column", alignItems: "center", background: "rgba(255,217,61,0.08)", border: "1px solid rgba(255,217,61,0.2)", borderRadius: 8, padding: "4px 8px", flexShrink: 0 },

    detailEmpty: { height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: 30, minHeight: 300 },
};

export default VolunteerList;