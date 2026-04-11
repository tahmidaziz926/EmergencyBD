import { useState, useEffect } from "react";
import axios from "axios";
import useAuth from "../../hooks/useAuth";
import Navbar from "../../components/Navbar";

const statusConfig = {
    active: { color: "#00ff88", bg: "rgba(0,255,136,0.08)", icon: "✅", label: "Active" },
    suspended: { color: "#ffaa00", bg: "rgba(255,170,0,0.08)", icon: "⏸️", label: "Suspended" },
    blocked: { color: "#ff6b6b", bg: "rgba(255,107,107,0.08)", icon: "🚫", label: "Blocked" },
};

const AdminUsers = () => {
    const { token } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null);
    const [updating, setUpdating] = useState(false);
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [confirmAction, setConfirmAction] = useState(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await axios.get("http://localhost:3001/api/admin/users", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setUsers(res.data);
        } catch (err) {
            console.error("Failed to fetch users:", err);
        }
        setLoading(false);
    };

    const handleStatusUpdate = async (userId, newStatus) => {
        setUpdating(true);
        try {
            await axios.put(
                `http://localhost:3001/api/admin/users/${userId}/status`,
                { status: newStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setUsers(prev =>
                prev.map(u => u._id === userId ? { ...u, status: newStatus } : u)
            );
            if (selectedUser?._id === userId) {
                setSelectedUser(prev => ({ ...prev, status: newStatus }));
            }
        } catch (err) {
            console.error("Status update failed:", err);
        }
        setUpdating(false);
        setConfirmAction(null);
    };

    const displayed = users.filter(u => {
        const matchStatus = filterStatus === "all" || u.status === filterStatus;
        const matchSearch =
            (u.name || "").toLowerCase().includes(search.toLowerCase()) ||
            (u.email || "").toLowerCase().includes(search.toLowerCase()) ||
            (u.area || "").toLowerCase().includes(search.toLowerCase());
        return matchStatus && matchSearch;
    });

    if (loading) return (
        <div style={styles.loadingScreen}>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <div style={styles.spinner}></div>
            <p style={styles.loadingText}>{"Loading users..."}</p>
        </div>
    );

    return (
        <div style={styles.page}>
            <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .user-card { transition: all 0.3s ease !important; }
        .user-card:hover { transform: translateY(-2px) !important; border-color: rgba(0,255,136,0.2) !important; box-shadow: 0 12px 30px rgba(0,0,0,0.3) !important; }
        .user-card.selected { border-color: #00ff88 !important; background: rgba(0,255,136,0.04) !important; }
        .filter-btn { transition: all 0.2s ease !important; }
        .filter-btn:hover { color: #00ff88 !important; }
        .action-btn { transition: all 0.3s ease !important; }
        .action-btn:hover { transform: translateY(-2px) !important; }
        .action-btn:disabled { opacity: 0.4 !important; cursor: not-allowed !important; transform: none !important; }
        input:focus { border-color: #00ff88 !important; outline: none !important; }
        .confirm-overlay { animation: fadeIn 0.2s ease !important; }
      `}</style>

            {/* ── Confirm Modal ── */}
            {confirmAction && (
                <div className="confirm-overlay" style={styles.overlay}>
                    <div style={styles.modal}>
                        <div style={styles.modalIcon}>
                            {statusConfig[confirmAction.status]?.icon}
                        </div>
                        <h3 style={styles.modalTitle}>
                            {confirmAction.status === "active"
                                ? "Reactivate User?"
                                : confirmAction.status === "suspended"
                                    ? "Suspend User?"
                                    : "Block User?"}
                        </h3>
                        <p style={styles.modalDesc}>
                            {confirmAction.status === "active"
                                ? "This will restore full access for "
                                : confirmAction.status === "suspended"
                                    ? "This will temporarily restrict access for "
                                    : "This will permanently block "}
                            <span style={{ color: "#e0e0e0", fontWeight: "700" }}>
                                {confirmAction.userName}
                            </span>
                            {"."}
                        </p>
                        <div style={styles.modalBtns}>
                            <button
                                style={styles.modalCancel}
                                onClick={() => setConfirmAction(null)}
                            >
                                {"Cancel"}
                            </button>
                            <button
                                style={{
                                    ...styles.modalConfirm,
                                    backgroundColor: statusConfig[confirmAction.status]?.color + "18",
                                    borderColor: statusConfig[confirmAction.status]?.color,
                                    color: statusConfig[confirmAction.status]?.color,
                                }}
                                onClick={() => handleStatusUpdate(confirmAction.userId, confirmAction.status)}
                                disabled={updating}
                            >
                                {updating ? "⏳ Updating..." : "Confirm"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Navbar />
            <div style={styles.layout}>

                {/* ── LEFT PANEL ── */}
                <div style={styles.leftPanel}>
                    <div style={styles.leftHeader}>
                        <h2 style={styles.leftTitle}>{"Users"}</h2>
                        <p style={styles.leftSubtitle}>{users.length}{" total"}</p>
                    </div>

                    <div style={styles.searchBox}>
                        <span>{"🔍"}</span>
                        <input
                            type="text"
                            placeholder="Search name, email, area..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={styles.searchInput}
                        />
                    </div>

                    <div style={styles.filterSection}>
                        <p style={styles.filterTitle}>{"FILTER BY STATUS"}</p>
                        {["all", "active", "suspended", "blocked"].map(f => (
                            <button
                                key={f}
                                className="filter-btn"
                                style={{
                                    ...styles.filterBtn,
                                    ...(filterStatus === f ? styles.filterActive : {}),
                                }}
                                onClick={() => setFilterStatus(f)}
                            >
                                <span>
                                    {f === "all"
                                        ? "🗂 All"
                                        : statusConfig[f].icon + " " + statusConfig[f].label}
                                </span>
                                <span style={styles.filterCount}>
                                    {f === "all"
                                        ? users.length
                                        : users.filter(u => u.status === f).length}
                                </span>
                            </button>
                        ))}
                    </div>

                    <div style={styles.summarySection}>
                        <p style={styles.filterTitle}>{"SUMMARY"}</p>
                        {[
                            { key: "active", label: "Active", color: "#00ff88" },
                            { key: "suspended", label: "Suspended", color: "#ffaa00" },
                            { key: "blocked", label: "Blocked", color: "#ff6b6b" },
                        ].map(s => (
                            <div key={s.key} style={styles.summaryRow}>
                                <span style={{ color: "#555555", fontSize: "12px" }}>{s.label}</span>
                                <span style={{
                                    color: s.color, fontSize: "13px", fontWeight: "700",
                                    backgroundColor: s.color + "12",
                                    padding: "2px 10px", borderRadius: "10px",
                                }}>
                                    {users.filter(u => u.status === s.key).length}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── MIDDLE PANEL ── */}
                <div style={styles.middlePanel}>
                    {displayed.length === 0 ? (
                        <div style={styles.emptyState}>
                            <div style={{ fontSize: "48px", opacity: 0.3 }}>{"👥"}</div>
                            <p style={{ color: "#555555", fontSize: "15px" }}>{"No users found"}</p>
                        </div>
                    ) : (
                        displayed.map((user, i) => {
                            const sc = statusConfig[user.status] || statusConfig.active;
                            return (
                                <div
                                    key={user._id}
                                    className={"user-card" + (selectedUser?._id === user._id ? " selected" : "")}
                                    style={{ ...styles.userCard, animationDelay: `${i * 0.04}s` }}
                                    onClick={() => setSelectedUser(selectedUser?._id === user._id ? null : user)}
                                >
                                    <div style={styles.cardTop}>
                                        <div style={styles.cardLeft}>
                                            <div style={styles.avatar}>
                                                {(user.name || "?").charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p style={styles.cardName}>{user.name}</p>
                                                <p style={styles.cardEmail}>{user.email}</p>
                                            </div>
                                        </div>
                                        <span style={{
                                            ...styles.statusBadge,
                                            color: sc.color,
                                            backgroundColor: sc.bg,
                                        }}>
                                            {sc.icon + " " + sc.label}
                                        </span>
                                    </div>
                                    <div style={styles.cardMeta}>
                                        <span style={styles.cardMetaItem}>{"📍 " + (user.area || "N/A")}</span>
                                        <span style={styles.cardMetaItem}>{"📞 " + (user.contactInfo || "N/A")}</span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* ── RIGHT PANEL ── */}
                <div style={styles.rightPanel}>
                    {selectedUser ? (
                        <div style={{ animation: "slideIn 0.3s ease" }}>
                            <div style={styles.detailHeader}>
                                <h3 style={styles.detailTitle}>{"User Details"}</h3>
                                <button style={styles.closeBtn} onClick={() => setSelectedUser(null)}>{"✕"}</button>
                            </div>

                            <div style={styles.profileCard}>
                                <div style={styles.profileAvatar}>
                                    {(selectedUser.name || "?").charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p style={styles.profileName}>{selectedUser.name}</p>
                                    <p style={styles.profileEmail}>{selectedUser.email}</p>
                                    <span style={{
                                        ...styles.statusBadge,
                                        color: statusConfig[selectedUser.status]?.color,
                                        backgroundColor: statusConfig[selectedUser.status]?.bg,
                                        fontSize: "11px", marginTop: "6px", display: "inline-block",
                                    }}>
                                        {statusConfig[selectedUser.status]?.icon + " " + statusConfig[selectedUser.status]?.label}
                                    </span>
                                </div>
                            </div>

                            <div style={styles.infoBox}>
                                {[
                                    { label: "Area", value: selectedUser.area || "N/A" },
                                    { label: "Contact", value: selectedUser.contactInfo || "N/A" },
                                    {
                                        label: "Joined",
                                        value: new Date(selectedUser.createdAt).toLocaleDateString("en-US", {
                                            year: "numeric", month: "long", day: "numeric",
                                        }),
                                    },
                                ].map((item, i) => (
                                    <div key={i} style={styles.infoRow}>
                                        <span style={styles.infoLabel}>{item.label}</span>
                                        <span style={styles.infoValue}>{item.value}</span>
                                    </div>
                                ))}
                            </div>

                            <div style={styles.actionBox}>
                                <p style={styles.actionTitle}>{"⚙️ Manage User"}</p>
                                <p style={styles.actionSubtitle}>
                                    {"Current status: "}
                                    <span style={{ color: statusConfig[selectedUser.status]?.color, fontWeight: "700" }}>
                                        {statusConfig[selectedUser.status]?.label}
                                    </span>
                                </p>
                                <div style={styles.actionBtns}>
                                    {[
                                        { status: "active", icon: "✅", label: "Reactivate", activeLabel: "Active ✓", color: "#00ff88" },
                                        { status: "suspended", icon: "⏸️", label: "Suspend", activeLabel: "Suspended ✓", color: "#ffaa00" },
                                        { status: "blocked", icon: "🚫", label: "Block", activeLabel: "Blocked ✓", color: "#ff6b6b" },
                                    ].map(btn => (
                                        <button
                                            key={btn.status}
                                            className="action-btn"
                                            disabled={selectedUser.status === btn.status || updating}
                                            style={{
                                                ...styles.actionBtn,
                                                borderColor: btn.color,
                                                color: selectedUser.status === btn.status ? "#0a0a0a" : btn.color,
                                                backgroundColor: selectedUser.status === btn.status
                                                    ? btn.color
                                                    : btn.color + "12",
                                            }}
                                            onClick={() => setConfirmAction({
                                                userId: selectedUser._id,
                                                status: btn.status,
                                                userName: selectedUser.name,
                                            })}
                                        >
                                            {btn.icon + " " + (selectedUser.status === btn.status ? btn.activeLabel : btn.label)}
                                        </button>
                                    ))}
                                </div>
                                <div style={styles.actionHint}>
                                    <p style={styles.hintRow}>{"✅ Active — full access"}</p>
                                    <p style={styles.hintRow}>{"⏸️ Suspended — temporary restriction"}</p>
                                    <p style={styles.hintRow}>{"🚫 Blocked — permanent ban"}</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={styles.detailEmpty}>
                            <div style={{ fontSize: "36px", opacity: 0.3 }}>{"👆"}</div>
                            <p style={styles.detailEmptyText}>{"Click a user to manage them"}</p>
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
    overlay: {
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: "rgba(0,0,0,0.85)", zIndex: 9999,
        display: "flex", alignItems: "center", justifyContent: "center",
    },
    modal: {
        backgroundColor: "#161616", border: "1px solid #2a2a2a",
        borderRadius: "18px", padding: "32px", maxWidth: "380px", width: "90%",
        display: "flex", flexDirection: "column", alignItems: "center", gap: "16px",
        boxShadow: "0 40px 80px rgba(0,0,0,0.8)",
    },
    modalIcon: { fontSize: "40px" },
    modalTitle: { color: "#ffffff", fontSize: "18px", fontWeight: "700", textAlign: "center" },
    modalDesc: { color: "#666666", fontSize: "13px", textAlign: "center", lineHeight: "1.6" },
    modalBtns: { display: "flex", gap: "12px", width: "100%", marginTop: "8px" },
    modalCancel: {
        flex: 1, padding: "12px",
        backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a",
        borderRadius: "10px", color: "#666666",
        fontSize: "14px", cursor: "pointer", fontFamily: "inherit",
    },
    modalConfirm: {
        flex: 1, padding: "12px", border: "1px solid",
        borderRadius: "10px", fontSize: "14px",
        fontWeight: "700", cursor: "pointer", fontFamily: "inherit",
    },
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
    summaryRow: {
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "6px 0",
    },
    middlePanel: { flex: 1, overflowY: "auto", borderRight: "1px solid #1e1e1e" },
    emptyState: {
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        height: "100%", gap: "12px", padding: "60px",
    },
    userCard: {
        padding: "18px 24px", borderBottom: "1px solid #1a1a1a",
        cursor: "pointer", animation: "fadeUp 0.4s ease both",
        border: "1px solid transparent", borderBottomColor: "#1a1a1a",
    },
    cardTop: {
        display: "flex", justifyContent: "space-between",
        alignItems: "center", marginBottom: "10px",
    },
    cardLeft: { display: "flex", alignItems: "center", gap: "12px" },
    avatar: {
        width: "40px", height: "40px",
        backgroundColor: "rgba(0,255,136,0.1)",
        border: "1px solid rgba(0,255,136,0.2)",
        borderRadius: "50%", display: "flex",
        alignItems: "center", justifyContent: "center",
        color: "#00ff88", fontSize: "16px", fontWeight: "700",
    },
    cardName: { color: "#e0e0e0", fontSize: "14px", fontWeight: "600" },
    cardEmail: { color: "#555555", fontSize: "12px", marginTop: "2px" },
    statusBadge: { fontSize: "11px", fontWeight: "600", padding: "4px 10px", borderRadius: "20px" },
    cardMeta: { display: "flex", gap: "16px", flexWrap: "wrap" },
    cardMetaItem: { color: "#444444", fontSize: "12px" },
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
    profileCard: {
        display: "flex", alignItems: "center", gap: "14px",
        backgroundColor: "#1a1a1a", border: "1px solid #222222",
        borderRadius: "14px", padding: "16px", marginBottom: "16px",
    },
    profileAvatar: {
        width: "52px", height: "52px", minWidth: "52px",
        backgroundColor: "rgba(0,255,136,0.1)",
        border: "2px solid rgba(0,255,136,0.25)",
        borderRadius: "50%", display: "flex",
        alignItems: "center", justifyContent: "center",
        color: "#00ff88", fontSize: "22px", fontWeight: "700",
    },
    profileName: { color: "#ffffff", fontSize: "15px", fontWeight: "700" },
    profileEmail: { color: "#555555", fontSize: "12px", marginTop: "2px" },
    infoBox: {
        backgroundColor: "#1a1a1a", border: "1px solid #222222",
        borderRadius: "12px", padding: "16px",
        display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px",
    },
    infoRow: { display: "flex", justifyContent: "space-between" },
    infoLabel: { color: "#444444", fontSize: "12px" },
    infoValue: { color: "#e0e0e0", fontSize: "12px", fontWeight: "500" },
    actionBox: {
        backgroundColor: "#1a1a1a", border: "1px solid #222222",
        borderRadius: "14px", padding: "18px",
        display: "flex", flexDirection: "column", gap: "12px",
    },
    actionTitle: { color: "#ffffff", fontSize: "13px", fontWeight: "700" },
    actionSubtitle: { color: "#666666", fontSize: "12px" },
    actionBtns: { display: "flex", flexDirection: "column", gap: "8px" },
    actionBtn: {
        width: "100%", padding: "11px 16px",
        border: "1px solid", borderRadius: "9px",
        fontSize: "13px", fontWeight: "600",
        cursor: "pointer", fontFamily: "inherit", textAlign: "left",
    },
    actionHint: {
        borderTop: "1px solid #222222", paddingTop: "12px",
        display: "flex", flexDirection: "column", gap: "4px",
    },
    hintRow: { color: "#333333", fontSize: "11px" },
    detailEmpty: {
        height: "100%", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        gap: "12px", textAlign: "center", padding: "40px",
    },
    detailEmptyText: { color: "#333333", fontSize: "13px" },
};

export default AdminUsers;