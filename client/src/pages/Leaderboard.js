import { useState, useEffect } from "react";
import axios from "axios";
import useAuth from "../hooks/useAuth";
import Navbar from "../components/Navbar";

const MEDALS = [
    { color: "#ffd93d", glow: "rgba(255,217,61,0.3)", bg: "rgba(255,217,61,0.06)", border: "rgba(255,217,61,0.2)", icon: "🥇", label: "Champion" },
    { color: "#c0c0c0", glow: "rgba(192,192,192,0.2)", bg: "rgba(192,192,192,0.04)", border: "rgba(192,192,192,0.15)", icon: "🥈", label: "Runner-up" },
    { color: "#cd7f32", glow: "rgba(205,127,50,0.2)", bg: "rgba(205,127,50,0.04)", border: "rgba(205,127,50,0.15)", icon: "🥉", label: "3rd Place" },
];

const Leaderboard = () => {
    const { token } = useAuth();
    const [volunteers, setVolunteers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchData(); }, []);

    // FIX: Single source of truth — one endpoint, no double fetch mismatch
    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await axios.get("http://localhost:3001/api/volunteer/list", {
                headers: { Authorization: `Bearer ${token}` },
            });
            // Already sorted by points desc from backend
            setVolunteers(res.data);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const top3 = volunteers.slice(0, 3);
    const rest = volunteers.slice(3);
    const totalPoints = volunteers.reduce((s, v) => s + (v.points || 0), 0);
    const totalActivities = volunteers.reduce((s, v) => s + (v.volunteerHistory?.length || 0), 0);

    if (loading) return (
        <div style={S.loadingScreen}>
            <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
            <div style={S.spinner} />
            <p style={S.loadingText}>{"Loading leaderboard..."}</p>
        </div>
    );

    return (
        <div style={S.page}>
            <style>{`
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
        @keyframes floatUp { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes pulse { 0%,100%{box-shadow:0 0 0 0 rgba(255,217,61,0.3)} 50%{box-shadow:0 0 0 12px rgba(255,217,61,0)} }

        .medal-card { transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1) !important; }
        .medal-card:hover { transform: translateY(-8px) scale(1.02) !important; }
        .rank-row { transition: all 0.2s ease !important; }
        .rank-row:hover { background: rgba(255,255,255,0.03) !important; transform: translateX(4px) !important; }
      `}</style>

            <Navbar />

            {/* Hero banner */}
            <div style={S.heroBanner}>
                <div style={S.heroGlow} />
                <div style={S.heroContent}>
                    <p style={S.heroEmojiRow}>{"🏆"}</p>
                    <h1 style={S.heroTitle}>{"Volunteer Leaderboard"}</h1>
                    <p style={S.heroSub}>{"Recognizing those who make a difference"}</p>

                    {/* Global stats */}
                    <div style={S.heroStats}>
                        {[
                            { label: "Total Volunteers", value: volunteers.length, color: "#00ff88" },
                            { label: "Points Awarded", value: totalPoints, color: "#ffd93d" },
                            { label: "Activities Done", value: totalActivities, color: "#6bcbff" },
                        ].map((s, i) => (
                            <div key={i} style={S.heroStatItem}>
                                <span style={{ ...S.heroStatNum, color: s.color }}>{s.value}</span>
                                <span style={S.heroStatLabel}>{s.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div style={S.container}>
                {volunteers.length === 0 ? (
                    <div style={S.emptyState}>
                        <div style={{ fontSize: 64, opacity: 0.15 }}>{"🏆"}</div>
                        <h2 style={{ color: "#444", fontSize: 20, fontWeight: 700 }}>{"No Champions Yet"}</h2>
                        <p style={{ color: "#333", fontSize: 13, lineHeight: 1.7, maxWidth: 320, textAlign: "center" }}>
                            {"Volunteer opportunities need to be completed and approved before anyone appears here."}
                        </p>
                    </div>
                ) : (
                    <>
                        {/* ── TOP 3 PODIUM ── */}
                        {top3.length > 0 && (
                            <div style={S.podiumSection}>
                                <h2 style={S.sectionTitle}>{"🎖️ Top Contributors"}</h2>
                                <div style={S.podium}>
                                    {/* Visual order: 2nd, 1st, 3rd */}
                                    {[1, 0, 2].map(idx => {
                                        const vol = top3[idx];
                                        if (!vol) return <div key={idx} style={{ width: 200 }} />;
                                        const m = MEDALS[idx];
                                        const isPodium1 = idx === 0;
                                        return (
                                            <div
                                                key={vol._id}
                                                className="medal-card"
                                                style={{
                                                    ...S.medalCard,
                                                    background: m.bg,
                                                    border: `1px solid ${m.border}`,
                                                    boxShadow: `0 0 40px ${m.glow}, 0 20px 60px rgba(0,0,0,0.5)`,
                                                    marginTop: isPodium1 ? 0 : idx === 1 ? 48 : 24,
                                                    zIndex: isPodium1 ? 2 : 1,
                                                    animationDelay: `${idx * 0.12}s`,
                                                }}
                                            >
                                                {/* Medal icon */}
                                                <div style={{
                                                    fontSize: isPodium1 ? 52 : 40,
                                                    animation: isPodium1 ? "floatUp 3s ease-in-out infinite" : "none",
                                                    lineHeight: 1, marginBottom: 12,
                                                }}>
                                                    {m.icon}
                                                </div>

                                                {/* Avatar */}
                                                <div style={{
                                                    width: isPodium1 ? 72 : 58,
                                                    height: isPodium1 ? 72 : 58,
                                                    borderRadius: "50%",
                                                    background: `linear-gradient(135deg,${m.color},${m.color}88)`,
                                                    border: `3px solid ${m.color}`,
                                                    boxShadow: isPodium1 ? `0 0 0 0 ${m.color}44, 0 8px 24px ${m.glow}` : "none",
                                                    animation: isPodium1 ? "pulse 2.5s ease infinite" : "none",
                                                    display: "flex", alignItems: "center", justifyContent: "center",
                                                    fontSize: isPodium1 ? 28 : 22, fontWeight: 800,
                                                    color: "#111", marginBottom: 12,
                                                }}>
                                                    {(vol.name || "?").charAt(0).toUpperCase()}
                                                </div>

                                                {/* Name */}
                                                <p style={{ color: "#fff", fontSize: isPodium1 ? 16 : 14, fontWeight: 700, textAlign: "center", margin: "0 0 3px" }}>
                                                    {vol.name}
                                                </p>
                                                <p style={{ color: "#444", fontSize: 11, margin: "0 0 14px" }}>
                                                    {"📍 " + (vol.area || "N/A")}
                                                </p>

                                                {/* Points */}
                                                <div style={{
                                                    background: `${m.color}18`,
                                                    border: `1px solid ${m.color}40`,
                                                    borderRadius: 12, padding: isPodium1 ? "14px 24px" : "10px 18px",
                                                    textAlign: "center", marginBottom: 10,
                                                }}>
                                                    <p style={{ color: m.color, fontSize: isPodium1 ? 32 : 24, fontWeight: 800, margin: 0, lineHeight: 1 }}>
                                                        {vol.points}
                                                    </p>
                                                    <p style={{ color: m.color + "88", fontSize: 10, margin: "3px 0 0", letterSpacing: "1px" }}>{"POINTS"}</p>
                                                </div>

                                                {/* Activities */}
                                                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                                    <span style={{ color: "#6bcbff", fontSize: 13, fontWeight: 700 }}>
                                                        {vol.volunteerHistory?.length || 0}
                                                    </span>
                                                    <span style={{ color: "#333", fontSize: 11 }}>{"activities"}</span>
                                                </div>

                                                {/* Label */}
                                                <p style={{ color: m.color, fontSize: 11, fontWeight: 700, marginTop: 8, letterSpacing: "0.5px" }}>
                                                    {m.label}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* ── FULL RANKINGS ── */}
                        {volunteers.length > 0 && (
                            <div style={S.rankingsSection}>
                                <h2 style={S.sectionTitle}>{"📊 Full Rankings"}</h2>
                                <div style={S.rankTable}>
                                    {/* Table header */}
                                    <div style={S.rankHeader}>
                                        <span style={S.rhCell}>{"Rank"}</span>
                                        <span style={{ ...S.rhCell, flex: 1 }}>{"Volunteer"}</span>
                                        <span style={{ ...S.rhCell, textAlign: "center" }}>{"Activities"}</span>
                                        <span style={{ ...S.rhCell, textAlign: "center" }}>{"Points"}</span>
                                    </div>

                                    {volunteers.map((vol, i) => {
                                        const m = i < 3 ? MEDALS[i] : null;
                                        return (
                                            <div
                                                key={vol._id}
                                                className="rank-row"
                                                style={{
                                                    ...S.rankRow,
                                                    background: m ? m.bg : "transparent",
                                                    borderLeft: m ? `3px solid ${m.color}` : "3px solid transparent",
                                                    animationDelay: `${i * 0.04}s`,
                                                }}
                                            >
                                                {/* Rank */}
                                                <div style={S.rankCell}>
                                                    <span style={{
                                                        fontSize: i < 3 ? 20 : 13,
                                                        color: m ? m.color : "#444",
                                                        fontWeight: 700,
                                                    }}>
                                                        {i < 3 ? m.icon : `#${i + 1}`}
                                                    </span>
                                                </div>

                                                {/* Name */}
                                                <div style={S.nameCell}>
                                                    <div style={{
                                                        width: 34, height: 34,
                                                        borderRadius: "50%",
                                                        background: m
                                                            ? `linear-gradient(135deg,${m.color},${m.color}66)`
                                                            : "rgba(0,255,136,0.08)",
                                                        border: m ? "none" : "1px solid rgba(0,255,136,0.15)",
                                                        display: "flex", alignItems: "center", justifyContent: "center",
                                                        fontSize: 13, fontWeight: 800,
                                                        color: m ? "#111" : "#00ff88",
                                                        flexShrink: 0,
                                                    }}>
                                                        {(vol.name || "?").charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p style={{ color: m ? m.color : "#e0e0e0", fontSize: 13, fontWeight: 600, margin: 0 }}>
                                                            {vol.name}
                                                        </p>
                                                        <p style={{ color: "#444", fontSize: 11, margin: "1px 0 0" }}>
                                                            {"📍 " + (vol.area || "N/A")}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Activities */}
                                                <div style={{ textAlign: "center" }}>
                                                    <span style={{
                                                        color: "#6bcbff", fontSize: 14, fontWeight: 700,
                                                        background: "rgba(107,203,255,0.08)",
                                                        border: "1px solid rgba(107,203,255,0.15)",
                                                        padding: "3px 12px", borderRadius: 20,
                                                    }}>
                                                        {vol.volunteerHistory?.length || 0}
                                                    </span>
                                                </div>

                                                {/* Points */}
                                                <div style={{ textAlign: "center" }}>
                                                    <span style={{
                                                        color: m ? m.color : "#e0e0e0",
                                                        fontSize: 16, fontWeight: 800,
                                                        background: m ? m.bg : "transparent",
                                                        padding: "3px 12px", borderRadius: 20,
                                                    }}>
                                                        {vol.points}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

const S = {
    page: { backgroundColor: "#0e0e0e", minHeight: "100vh" },
    loadingScreen: { backgroundColor: "#0e0e0e", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 },
    spinner: { width: 36, height: 36, border: "2px solid rgba(0,255,136,0.1)", borderTop: "2px solid #00ff88", borderRadius: "50%", animation: "spin 0.75s linear infinite" },
    loadingText: { color: "#00ff88", fontSize: 13 },

    heroBanner: { position: "relative", overflow: "hidden", background: "linear-gradient(180deg,#111 0%,#0e0e0e 100%)", borderBottom: "1px solid #181818", padding: "48px 24px 40px", textAlign: "center" },
    heroGlow: { position: "absolute", top: -80, left: "50%", transform: "translateX(-50%)", width: 400, height: 200, background: "radial-gradient(ellipse,rgba(255,217,61,0.12) 0%,transparent 70%)", pointerEvents: "none" },
    heroContent: { position: "relative", zIndex: 1, maxWidth: 720, margin: "0 auto" },
    heroEmojiRow: { fontSize: 48, margin: "0 0 12px", lineHeight: 1 },
    heroTitle: { color: "#fff", fontSize: 28, fontWeight: 800, margin: "0 0 6px", letterSpacing: "-0.5px" },
    heroSub: { color: "#555", fontSize: 14, margin: "0 0 32px" },
    heroStats: { display: "flex", justifyContent: "center", gap: 0, background: "#141414", border: "1px solid #1f1f1f", borderRadius: 16, overflow: "hidden", maxWidth: 480, margin: "0 auto" },
    heroStatItem: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "16px 8px", borderRight: "1px solid #1a1a1a" },
    heroStatNum: { fontSize: 24, fontWeight: 800, lineHeight: 1 },
    heroStatLabel: { color: "#444", fontSize: 10, fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase", marginTop: 4 },

    container: { maxWidth: 900, margin: "0 auto", padding: "40px 24px" },
    emptyState: { display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "80px 40px" },
    sectionTitle: { color: "#fff", fontSize: 16, fontWeight: 700, margin: "0 0 24px", display: "flex", alignItems: "center", gap: 8 },

    podiumSection: { marginBottom: 56 },
    podium: { display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 16 },
    medalCard: { width: 200, borderRadius: 20, padding: "24px 16px", display: "flex", flexDirection: "column", alignItems: "center", animation: "fadeUp 0.5s ease both" },

    rankingsSection: { marginTop: 8 },
    rankTable: { background: "#0a0a0a", border: "1px solid #181818", borderRadius: 16, overflow: "hidden" },
    rankHeader: { display: "grid", gridTemplateColumns: "60px 1fr 120px 100px", gap: 8, padding: "10px 20px", background: "#111", borderBottom: "1px solid #181818" },
    rhCell: { color: "#333", fontSize: 10, fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase" },
    rankRow: { display: "grid", gridTemplateColumns: "60px 1fr 120px 100px", gap: 8, padding: "14px 20px", borderBottom: "1px solid #141414", animation: "fadeUp 0.3s ease both", alignItems: "center" },
    rankCell: { display: "flex", alignItems: "center", justifyContent: "center" },
    nameCell: { display: "flex", alignItems: "center", gap: 10, minWidth: 0 },
};

export default Leaderboard;