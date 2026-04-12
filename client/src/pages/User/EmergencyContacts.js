import { useState, useEffect } from "react";
import axios from "axios";
import useAuth from "../../hooks/useAuth";
import Navbar from "../../components/Navbar";

const typeConfig = {
    police: { icon: "🚔", color: "#6bcbff", label: "Police" },
    fire: { icon: "🔥", color: "#ff9f43", label: "Fire" },
    ambulance: { icon: "🚑", color: "#ff6b6b", label: "Ambulance" },
    hospital: { icon: "🏥", color: "#00ff88", label: "Hospital" },
    other: { icon: "📞", color: "#a29bfe", label: "Other" },
};

const EmergencyContacts = () => {
    const { token } = useAuth();
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterType, setFilterType] = useState("all");
    const [selectedContact, setSelectedContact] = useState(null);

    useEffect(() => {
        fetchContacts();
    }, []);

    const fetchContacts = async () => {
        setLoading(true);
        try {
            const res = await axios.get("http://localhost:3001/api/admin/contacts", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setContacts(res.data);
        } catch (err) {
            console.error("Failed to fetch contacts:", err);
        }
        setLoading(false);
    };

    const displayed = contacts.filter(c => {
        const matchType = filterType === "all" || c.type === filterType;
        const matchSearch =
            (c.name || "").toLowerCase().includes(search.toLowerCase()) ||
            (c.area || "").toLowerCase().includes(search.toLowerCase()) ||
            (c.number || "").toLowerCase().includes(search.toLowerCase());
        return matchType && matchSearch;
    });

    if (loading) {
        return (
            <div style={styles.loadingScreen}>
                <style>{"@keyframes spin { to { transform: rotate(360deg); } }"}</style>
                <div style={styles.spinner}></div>
                <p style={styles.loadingText}>{"Loading emergency contacts..."}</p>
            </div>
        );
    }

    return (
        <div style={styles.page}>
            <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.6; } }
        .contact-card { transition: all 0.3s ease !important; }
        .contact-card:hover { transform: translateY(-3px) !important; border-color: rgba(0,255,136,0.25) !important; box-shadow: 0 16px 40px rgba(0,0,0,0.4) !important; }
        .contact-card.selected { border-color: #00ff88 !important; background: rgba(0,255,136,0.04) !important; }
        .filter-btn { transition: all 0.2s ease !important; }
        .filter-btn:hover { color: #00ff88 !important; }
        .call-btn:hover { background: rgba(0,255,136,0.25) !important; transform: translateY(-2px) !important; }
        input:focus { border-color: #00ff88 !important; outline: none !important; }
      `}</style>

            <Navbar />

            <div style={styles.layout}>

                {/* ── LEFT PANEL ── */}
                <div style={styles.leftPanel}>
                    <div style={styles.leftHeader}>
                        <div style={styles.headerIconBox}>{"🆘"}</div>
                        <h2 style={styles.leftTitle}>{"Emergency"}</h2>
                        <h2 style={styles.leftTitleGreen}>{"Contacts"}</h2>
                        <p style={styles.leftSubtitle}>{contacts.length}{" contacts available"}</p>
                    </div>

                    <div style={styles.searchBox}>
                        <span>{"🔍"}</span>
                        <input
                            type="text"
                            placeholder="Search name, area, number..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={styles.searchInput}
                        />
                    </div>

                    <div style={styles.filterSection}>
                        <p style={styles.filterTitle}>{"FILTER BY TYPE"}</p>
                        <button
                            className="filter-btn"
                            style={{ ...styles.filterBtn, ...(filterType === "all" ? styles.filterActive : {}) }}
                            onClick={() => setFilterType("all")}
                        >
                            <span>{"🗂 All"}</span>
                            <span style={styles.filterCount}>{contacts.length}</span>
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
                                    {contacts.filter(c => c.type === key).length}
                                </span>
                            </button>
                        ))}
                    </div>

                    <div style={styles.tipBox}>
                        <p style={styles.tipTitle}>{"⚡ Quick Tip"}</p>
                        <p style={styles.tipText}>
                            {"In life-threatening emergencies, call "}
                            <span style={{ color: "#ff6b6b", fontWeight: "700" }}>{"999"}</span>
                            {" immediately."}
                        </p>
                    </div>
                </div>

                {/* ── MIDDLE PANEL ── */}
                <div style={styles.middlePanel}>
                    {displayed.length === 0 ? (
                        <div style={styles.emptyState}>
                            <div style={{ fontSize: "48px", opacity: 0.3 }}>{"📞"}</div>
                            <p style={{ color: "#555555", fontSize: "15px" }}>
                                {contacts.length === 0
                                    ? "No emergency contacts added yet."
                                    : "No contacts match your search."}
                            </p>
                        </div>
                    ) : (
                        displayed.map((contact, i) => {
                            const tc = typeConfig[contact.type] || typeConfig.other;
                            return (
                                <div
                                    key={contact._id}
                                    className={"contact-card" + (selectedContact?._id === contact._id ? " selected" : "")}
                                    style={{ ...styles.contactCard, animationDelay: `${i * 0.04}s` }}
                                    onClick={() => setSelectedContact(
                                        selectedContact?._id === contact._id ? null : contact
                                    )}
                                >
                                    <div style={styles.cardTop}>
                                        <div style={styles.cardLeft}>
                                            <div style={{
                                                ...styles.cardIconBox,
                                                backgroundColor: tc.color + "15",
                                                border: "1px solid " + tc.color + "30",
                                            }}>
                                                {tc.icon}
                                            </div>
                                            <div>
                                                <p style={styles.cardName}>{contact.name}</p>
                                                <p style={{ ...styles.cardType, color: tc.color }}>
                                                    {tc.icon + " " + tc.label}
                                                </p>
                                            </div>
                                        </div>
                                        <div style={styles.cardRight}>
                                            <p style={styles.cardNumber}>{contact.number}</p>
                                            <p style={styles.cardArea}>{"📍 " + contact.area}</p>
                                        </div>
                                    </div>
                                    {contact.notes && (
                                        <p style={styles.cardNotes}>
                                            {"📝 " + contact.notes.substring(0, 80) +
                                                (contact.notes.length > 80 ? "..." : "")}
                                        </p>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                {/* ── RIGHT PANEL ── */}
                <div style={styles.rightPanel}>
                    {selectedContact ? (
                        <div style={{ animation: "slideIn 0.3s ease" }}>
                            <div style={styles.detailHeader}>
                                <h3 style={styles.detailTitle}>{"Contact Info"}</h3>
                                <button
                                    style={styles.closeBtn}
                                    onClick={() => setSelectedContact(null)}
                                >
                                    {"✕"}
                                </button>
                            </div>

                            <div style={{
                                ...styles.contactHero,
                                backgroundColor: (typeConfig[selectedContact.type]?.color || "#888") + "10",
                                border: "1px solid " + (typeConfig[selectedContact.type]?.color || "#888") + "25",
                            }}>
                                <div style={{ fontSize: "40px" }}>
                                    {typeConfig[selectedContact.type]?.icon}
                                </div>
                                <div>
                                    <p style={styles.heroName}>{selectedContact.name}</p>
                                    <p style={{
                                        color: typeConfig[selectedContact.type]?.color,
                                        fontSize: "12px",
                                        fontWeight: "600",
                                    }}>
                                        {typeConfig[selectedContact.type]?.label}
                                    </p>
                                </div>
                            </div>

                            <div style={styles.numberCard}>
                                <p style={styles.numberLabel}>{"📞 Phone Number"}</p>
                                <p style={styles.numberValue}>{selectedContact.number}</p>
                                <button
                                    className="call-btn"
                                    style={styles.callBtn}
                                    onClick={() => window.open("tel:" + selectedContact.number)}
                                >
                                    {"📲 Tap to Call"}
                                </button>
                            </div>

                            <div style={styles.infoBox}>
                                {[
                                    { label: "Area", value: selectedContact.area },
                                    { label: "Type", value: typeConfig[selectedContact.type]?.label },
                                ].map((item, i) => (
                                    <div key={i} style={styles.infoRow}>
                                        <span style={styles.infoLabel}>{item.label}</span>
                                        <span style={styles.infoValue}>{item.value}</span>
                                    </div>
                                ))}
                                {selectedContact.notes && (
                                    <div style={styles.notesBox}>
                                        <p style={styles.infoLabel}>{"Notes"}</p>
                                        <p style={styles.notesText}>{selectedContact.notes}</p>
                                    </div>
                                )}
                            </div>

                            <div style={styles.warningBox}>
                                <p style={styles.warningText}>
                                    {"🚨 If this is a life-threatening emergency, call "}
                                    <span style={{ color: "#ff6b6b", fontWeight: "800" }}>{"999"}</span>
                                    {" immediately."}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div style={styles.detailEmpty}>
                            <div style={{ fontSize: "40px", opacity: 0.3, animation: "pulse 2s infinite" }}>
                                {"📞"}
                            </div>
                            <p style={styles.detailEmptyTitle}>{"Select a contact"}</p>
                            <p style={styles.detailEmptyText}>
                                {"Click any contact to view their details and call number."}
                            </p>
                            <div style={styles.emergencyBox}>
                                <p style={styles.emergencyLabel}>{"🚨 National Emergency"}</p>
                                <p style={styles.emergencyNumber}>{"999"}</p>
                                <button
                                    className="call-btn"
                                    style={styles.callBtn}
                                    onClick={() => window.open("tel:999")}
                                >
                                    {"📲 Call 999"}
                                </button>
                            </div>
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
    leftHeader: {
        paddingBottom: "16px", borderBottom: "1px solid #1e1e1e",
        display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "4px",
    },
    headerIconBox: { fontSize: "28px", marginBottom: "4px" },
    leftTitle: { color: "#ffffff", fontSize: "20px", fontWeight: "800", lineHeight: "1.1" },
    leftTitleGreen: { color: "#00ff88", fontSize: "20px", fontWeight: "800", lineHeight: "1.1" },
    leftSubtitle: { color: "#555555", fontSize: "12px", marginTop: "6px" },
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
    tipBox: {
        marginTop: "auto",
        backgroundColor: "rgba(255,107,107,0.06)",
        border: "1px solid rgba(255,107,107,0.15)",
        borderRadius: "10px", padding: "14px",
    },
    tipTitle: { color: "#ff6b6b", fontSize: "11px", fontWeight: "700", marginBottom: "6px" },
    tipText: { color: "#555555", fontSize: "11px", lineHeight: "1.6" },
    middlePanel: { flex: 1, overflowY: "auto", borderRight: "1px solid #1e1e1e" },
    emptyState: {
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        height: "100%", gap: "12px", padding: "60px",
    },
    contactCard: {
        padding: "20px 24px", borderBottom: "1px solid #1a1a1a",
        cursor: "pointer", animation: "fadeUp 0.4s ease both",
        border: "1px solid transparent", borderBottomColor: "#1a1a1a",
    },
    cardTop: {
        display: "flex", justifyContent: "space-between",
        alignItems: "center", marginBottom: "8px",
    },
    cardLeft: { display: "flex", alignItems: "center", gap: "12px" },
    cardIconBox: {
        width: "42px", height: "42px", borderRadius: "12px",
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px",
    },
    cardName: { color: "#e0e0e0", fontSize: "14px", fontWeight: "600" },
    cardType: { fontSize: "11px", fontWeight: "600", marginTop: "3px" },
    cardRight: { textAlign: "right" },
    cardNumber: { color: "#00ff88", fontSize: "14px", fontWeight: "800", fontFamily: "monospace" },
    cardArea: { color: "#444444", fontSize: "11px", marginTop: "3px" },
    cardNotes: { color: "#444444", fontSize: "12px", lineHeight: "1.5", marginTop: "4px" },
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
    contactHero: {
        display: "flex", alignItems: "center", gap: "14px",
        borderRadius: "12px", padding: "16px", marginBottom: "16px",
    },
    heroName: { color: "#ffffff", fontSize: "15px", fontWeight: "700" },
    numberCard: {
        backgroundColor: "rgba(0,255,136,0.05)",
        border: "1px solid rgba(0,255,136,0.15)",
        borderRadius: "12px", padding: "18px",
        marginBottom: "16px", textAlign: "center",
        display: "flex", flexDirection: "column", gap: "10px",
    },
    numberLabel: { color: "#444444", fontSize: "11px" },
    numberValue: { color: "#00ff88", fontSize: "26px", fontWeight: "800", fontFamily: "monospace" },
    callBtn: {
        padding: "10px",
        backgroundColor: "rgba(0,255,136,0.12)",
        border: "1px solid rgba(0,255,136,0.3)",
        borderRadius: "8px", color: "#00ff88",
        fontSize: "13px", fontWeight: "700",
        cursor: "pointer", fontFamily: "inherit",
        transition: "all 0.3s ease", width: "100%",
    },
    infoBox: {
        backgroundColor: "#1a1a1a", border: "1px solid #222222",
        borderRadius: "12px", padding: "16px",
        display: "flex", flexDirection: "column",
        gap: "10px", marginBottom: "16px",
    },
    infoRow: { display: "flex", justifyContent: "space-between" },
    infoLabel: { color: "#444444", fontSize: "12px" },
    infoValue: { color: "#e0e0e0", fontSize: "12px", fontWeight: "500" },
    notesBox: { borderTop: "1px solid #222222", paddingTop: "10px" },
    notesText: { color: "#aaaaaa", fontSize: "12px", lineHeight: "1.6", marginTop: "6px" },
    warningBox: {
        backgroundColor: "rgba(255,107,107,0.06)",
        border: "1px solid rgba(255,107,107,0.15)",
        borderRadius: "10px", padding: "14px",
    },
    warningText: { color: "#666666", fontSize: "12px", lineHeight: "1.6" },
    detailEmpty: {
        height: "100%", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        gap: "14px", textAlign: "center", padding: "30px",
    },
    detailEmptyTitle: { color: "#555555", fontSize: "15px", fontWeight: "600" },
    detailEmptyText: { color: "#333333", fontSize: "12px", lineHeight: "1.6" },
    emergencyBox: {
        width: "100%", marginTop: "8px",
        backgroundColor: "rgba(255,107,107,0.06)",
        border: "1px solid rgba(255,107,107,0.2)",
        borderRadius: "12px", padding: "16px",
        textAlign: "center", display: "flex",
        flexDirection: "column", gap: "10px",
    },
    emergencyLabel: { color: "#ff6b6b", fontSize: "12px", fontWeight: "700" },
    emergencyNumber: { color: "#ff6b6b", fontSize: "32px", fontWeight: "800", fontFamily: "monospace" },
};

export default EmergencyContacts;