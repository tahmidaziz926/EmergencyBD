import { useState, useEffect } from "react";
import axios from "axios";
import useAuth from "../../hooks/useAuth";
import Navbar from "../../components/Navbar";

const emptyForm = { title: "", description: "", location: "", date: "", organizer: "", contact: "" };

const BloodCampaigns = () => {
    const { token, role } = useAuth();
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCampaign, setSelectedCampaign] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [formMode, setFormMode] = useState("add");
    const [formData, setFormData] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState("");
    const [search, setSearch] = useState("");
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => { fetchCampaigns(); }, []);

    const fetchCampaigns = async () => {
        setLoading(true);
        try {
            const res = await axios.get("http://localhost:3001/api/blood/campaigns", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setCampaigns(res.data);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const isUpcoming = (date) => new Date(date) >= new Date();

    const handleSave = async () => {
        if (!formData.title || !formData.description || !formData.location || !formData.date || !formData.organizer || !formData.contact) {
            setFormError("All fields are required.");
            return;
        }
        setSaving(true);
        setFormError("");
        try {
            if (formMode === "add") {
                const res = await axios.post(
                    "http://localhost:3001/api/blood/campaigns",
                    formData,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setCampaigns(prev => [res.data.campaign, ...prev]);
            } else {
                const res = await axios.put(
                    `http://localhost:3001/api/blood/campaigns/${selectedCampaign._id}`,
                    formData,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setCampaigns(prev => prev.map(c => c._id === selectedCampaign._id ? res.data.campaign : c));
                setSelectedCampaign(res.data.campaign);
            }
            setShowForm(false);
        } catch (err) {
            setFormError(err.response?.data?.message || "Something went wrong.");
        }
        setSaving(false);
    };

    const handleDelete = async (id) => {
        setDeleting(true);
        try {
            await axios.delete(`http://localhost:3001/api/blood/campaigns/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setCampaigns(prev => prev.filter(c => c._id !== id));
            if (selectedCampaign?._id === id) setSelectedCampaign(null);
        } catch (err) {
            console.error(err);
        }
        setDeleting(false);
        setConfirmDelete(null);
    };

    const displayed = campaigns.filter(c =>
        (c.title || "").toLowerCase().includes(search.toLowerCase()) ||
        (c.location || "").toLowerCase().includes(search.toLowerCase()) ||
        (c.organizer || "").toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return (
        <div style={styles.loadingScreen}>
            <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
            <div style={styles.spinner}></div>
            <p style={styles.loadingText}>{"Loading campaigns..."}</p>
        </div>
    );

    return (
        <div style={styles.page}>
            <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        .camp-card{transition:all 0.3s ease !important}
        .camp-card:hover{transform:translateY(-2px) !important;border-color:rgba(255,107,107,0.3) !important;box-shadow:0 12px 30px rgba(0,0,0,0.3) !important}
        .camp-card.selected{border-color:#ff6b6b !important;background:rgba(255,107,107,0.04) !important}
        input:focus,select:focus,textarea:focus{border-color:#ff6b6b !important;outline:none !important}
        .confirm-overlay{animation:fadeIn 0.2s ease !important}
      `}</style>

            {confirmDelete && (
                <div className="confirm-overlay" style={styles.overlay}>
                    <div style={styles.modal}>
                        <div style={{ fontSize: "40px" }}>{"🗑️"}</div>
                        <h3 style={styles.modalTitle}>{"Delete Campaign?"}</h3>
                        <p style={styles.modalDesc}>{"This campaign will be permanently deleted."}</p>
                        <div style={styles.modalBtns}>
                            <button style={styles.modalCancel} onClick={() => setConfirmDelete(null)}>{"Cancel"}</button>
                            <button style={styles.modalDelete} onClick={() => handleDelete(confirmDelete)} disabled={deleting}>
                                {deleting ? "⏳..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Navbar />
            <div style={styles.layout}>

                {/* LEFT PANEL */}
                <div style={styles.leftPanel}>
                    <div style={styles.leftHeader}>
                        <div style={{ fontSize: "28px" }}>{"🩸"}</div>
                        <h2 style={styles.leftTitle}>{"Blood Donation"}</h2>
                        <h2 style={styles.leftTitleRed}>{"Campaigns"}</h2>
                        <p style={styles.leftSubtitle}>{campaigns.length}{" campaigns"}</p>
                    </div>

                    {role === "admin" && (
                        <button
                            style={styles.addBtn}
                            onClick={() => { setFormMode("add"); setFormData(emptyForm); setFormError(""); setShowForm(true); setSelectedCampaign(null); }}
                        >
                            {"＋ New Campaign"}
                        </button>
                    )}

                    <div style={styles.searchBox}>
                        <span>{"🔍"}</span>
                        <input
                            type="text"
                            placeholder="Search campaigns..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={styles.searchInput}
                        />
                    </div>

                    <div style={styles.statsBox}>
                        <div style={styles.statItem}>
                            <span style={{ color: "#00ff88", fontSize: "18px", fontWeight: "700" }}>
                                {campaigns.filter(c => isUpcoming(c.date)).length}
                            </span>
                            <span style={{ color: "#444444", fontSize: "10px" }}>{"Upcoming"}</span>
                        </div>
                        <div style={styles.statItem}>
                            <span style={{ color: "#555555", fontSize: "18px", fontWeight: "700" }}>
                                {campaigns.filter(c => !isUpcoming(c.date)).length}
                            </span>
                            <span style={{ color: "#444444", fontSize: "10px" }}>{"Past"}</span>
                        </div>
                    </div>
                </div>

                {/* MIDDLE PANEL */}
                <div style={styles.middlePanel}>
                    {displayed.length === 0 ? (
                        <div style={styles.emptyState}>
                            <div style={{ fontSize: "48px", opacity: 0.3 }}>{"🩸"}</div>
                            <p style={{ color: "#555555", fontSize: "15px" }}>{"No campaigns yet"}</p>
                            {role === "admin" && (
                                <button style={styles.emptyAddBtn} onClick={() => { setFormMode("add"); setFormData(emptyForm); setFormError(""); setShowForm(true); }}>
                                    {"＋ Create First Campaign"}
                                </button>
                            )}
                        </div>
                    ) : (
                        displayed.map((camp, i) => {
                            const upcoming = isUpcoming(camp.date);
                            return (
                                <div
                                    key={camp._id}
                                    className={"camp-card" + (selectedCampaign?._id === camp._id ? " selected" : "")}
                                    style={{ ...styles.campCard, animationDelay: `${i * 0.04}s` }}
                                    onClick={() => { setSelectedCampaign(selectedCampaign?._id === camp._id ? null : camp); setShowForm(false); }}
                                >
                                    <div style={styles.cardTop}>
                                        <div style={styles.campIcon}>{"🩸"}</div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={styles.cardTitle}>{camp.title}</p>
                                            <p style={styles.cardOrg}>{"🏢 " + camp.organizer}</p>
                                        </div>
                                        <span style={{
                                            ...styles.upcomingBadge,
                                            color: upcoming ? "#00ff88" : "#555555",
                                            backgroundColor: upcoming ? "rgba(0,255,136,0.08)" : "rgba(85,85,85,0.08)",
                                        }}>
                                            {upcoming ? "📅 Upcoming" : "✓ Past"}
                                        </span>
                                    </div>
                                    <p style={styles.cardDesc}>{camp.description.substring(0, 80)}{camp.description.length > 80 ? "..." : ""}</p>
                                    <div style={styles.cardMeta}>
                                        <span style={styles.cardMetaItem}>
                                            {"📅 " + new Date(camp.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                        </span>
                                        <span style={styles.cardMetaItem}>{"📍 " + camp.location}</span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* RIGHT PANEL */}
                <div style={styles.rightPanel}>
                    {showForm && role === "admin" ? (
                        <div style={{ animation: "slideIn 0.3s ease" }}>
                            <div style={styles.detailHeader}>
                                <h3 style={styles.detailTitle}>{formMode === "add" ? "➕ New Campaign" : "✏️ Edit Campaign"}</h3>
                                <button style={styles.closeBtn} onClick={() => { setShowForm(false); setFormError(""); }}>{"✕"}</button>
                            </div>

                            {[
                                { key: "title", label: "Campaign Title *", placeholder: "e.g. National Blood Donation Drive" },
                                { key: "organizer", label: "Organizer *", placeholder: "e.g. Red Crescent Society" },
                                { key: "location", label: "Location *", placeholder: "e.g. Dhaka Medical College" },
                                { key: "contact", label: "Contact *", placeholder: "Phone or email" },
                            ].map(f => (
                                <div key={f.key} style={styles.formGroup}>
                                    <label style={styles.formLabel}>{f.label}</label>
                                    <input
                                        type="text"
                                        placeholder={f.placeholder}
                                        value={formData[f.key]}
                                        onChange={e => setFormData(p => ({ ...p, [f.key]: e.target.value }))}
                                        style={styles.formInput}
                                    />
                                </div>
                            ))}

                            <div style={styles.formGroup}>
                                <label style={styles.formLabel}>{"Date *"}</label>
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={e => setFormData(p => ({ ...p, date: e.target.value }))}
                                    style={styles.formInput}
                                />
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.formLabel}>{"Description *"}</label>
                                <textarea
                                    rows={3}
                                    placeholder="Describe the campaign..."
                                    value={formData.description}
                                    onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                                    style={styles.formTextarea}
                                />
                            </div>

                            {formError && <p style={styles.formError}>{"⚠️ " + formError}</p>}

                            <button style={styles.saveBtn} onClick={handleSave} disabled={saving}>
                                {saving ? "⏳ Saving..." : formMode === "add" ? "➕ Create Campaign" : "💾 Save Changes"}
                            </button>
                        </div>

                    ) : selectedCampaign ? (
                        <div style={{ animation: "slideIn 0.3s ease" }}>
                            <div style={styles.detailHeader}>
                                <h3 style={styles.detailTitle}>{"Campaign Details"}</h3>
                                <button style={styles.closeBtn} onClick={() => setSelectedCampaign(null)}>{"✕"}</button>
                            </div>

                            <div style={styles.campHero}>
                                <div style={{ fontSize: "36px" }}>{"🩸"}</div>
                                <div>
                                    <p style={styles.heroTitle}>{selectedCampaign.title}</p>
                                    <span style={{
                                        ...styles.upcomingBadge,
                                        color: isUpcoming(selectedCampaign.date) ? "#00ff88" : "#555555",
                                        backgroundColor: isUpcoming(selectedCampaign.date) ? "rgba(0,255,136,0.08)" : "rgba(85,85,85,0.08)",
                                        display: "inline-block", marginTop: "6px",
                                    }}>
                                        {isUpcoming(selectedCampaign.date) ? "📅 Upcoming" : "✓ Past Event"}
                                    </span>
                                </div>
                            </div>

                            <div style={styles.infoBox}>
                                {[
                                    { label: "Date", value: new Date(selectedCampaign.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) },
                                    { label: "Location", value: selectedCampaign.location },
                                    { label: "Organizer", value: selectedCampaign.organizer },
                                    { label: "Contact", value: selectedCampaign.contact },
                                ].map((item, i) => (
                                    <div key={i} style={styles.infoRow}>
                                        <span style={styles.infoLabel}>{item.label}</span>
                                        <span style={styles.infoValue}>{item.value}</span>
                                    </div>
                                ))}
                            </div>

                            <div style={styles.descBox}>
                                <p style={styles.descLabel}>{"📋 About this Campaign"}</p>
                                <p style={styles.descText}>{selectedCampaign.description}</p>
                            </div>

                            <button style={styles.callBtn} onClick={() => window.open("tel:" + selectedCampaign.contact)}>
                                {"📲 Contact Organizer"}
                            </button>

                            {role === "admin" && (
                                <div style={styles.actionBtns}>
                                    <button
                                        style={styles.editBtn}
                                        onClick={() => {
                                            setFormMode("edit");
                                            setFormData({
                                                title: selectedCampaign.title,
                                                description: selectedCampaign.description,
                                                location: selectedCampaign.location,
                                                date: selectedCampaign.date?.split("T")[0] || "",
                                                organizer: selectedCampaign.organizer,
                                                contact: selectedCampaign.contact,
                                            });
                                            setFormError("");
                                            setShowForm(true);
                                        }}
                                    >
                                        {"✏️ Edit"}
                                    </button>
                                    <button style={styles.deleteBtn} onClick={() => setConfirmDelete(selectedCampaign._id)}>
                                        {"🗑️ Delete"}
                                    </button>
                                </div>
                            )}
                        </div>

                    ) : (
                        <div style={styles.detailEmpty}>
                            <div style={{ fontSize: "40px", opacity: 0.3 }}>{"🩸"}</div>
                            <p style={styles.detailEmptyText}>{"Click a campaign to view details"}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const styles = {
    page: { backgroundColor: "#111111", minHeight: "100vh" },
    loadingScreen: { backgroundColor: "#111111", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px" },
    spinner: { width: "40px", height: "40px", border: "3px solid rgba(255,107,107,0.1)", borderTop: "3px solid #ff6b6b", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
    loadingText: { color: "#ff6b6b", fontSize: "14px" },
    overlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.85)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" },
    modal: { backgroundColor: "#161616", border: "1px solid #2a2a2a", borderRadius: "18px", padding: "32px", maxWidth: "360px", width: "90%", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", boxShadow: "0 40px 80px rgba(0,0,0,0.8)" },
    modalTitle: { color: "#ffffff", fontSize: "18px", fontWeight: "700" },
    modalDesc: { color: "#666666", fontSize: "13px", textAlign: "center" },
    modalBtns: { display: "flex", gap: "12px", width: "100%" },
    modalCancel: { flex: 1, padding: "12px", backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "10px", color: "#666666", fontSize: "14px", cursor: "pointer", fontFamily: "inherit" },
    modalDelete: { flex: 1, padding: "12px", backgroundColor: "rgba(255,107,107,0.12)", border: "1px solid #ff6b6b", borderRadius: "10px", color: "#ff6b6b", fontSize: "14px", fontWeight: "700", cursor: "pointer", fontFamily: "inherit" },
    layout: { display: "flex", minHeight: "calc(100vh - 68px)" },
    leftPanel: { width: "240px", minWidth: "240px", backgroundColor: "#0d0d0d", borderRight: "1px solid #1e1e1e", padding: "24px 16px", display: "flex", flexDirection: "column", gap: "14px", overflowY: "auto" },
    leftHeader: { paddingBottom: "14px", borderBottom: "1px solid #1e1e1e", display: "flex", flexDirection: "column", gap: "4px" },
    leftTitle: { color: "#ffffff", fontSize: "20px", fontWeight: "800", lineHeight: "1.1" },
    leftTitleRed: { color: "#ff6b6b", fontSize: "20px", fontWeight: "800", lineHeight: "1.1" },
    leftSubtitle: { color: "#555555", fontSize: "12px", marginTop: "4px" },
    addBtn: { width: "100%", padding: "11px", backgroundColor: "rgba(255,107,107,0.1)", border: "1px solid rgba(255,107,107,0.3)", borderRadius: "9px", color: "#ff6b6b", fontSize: "13px", fontWeight: "700", cursor: "pointer", fontFamily: "inherit" },
    searchBox: { display: "flex", alignItems: "center", gap: "10px", backgroundColor: "#1a1a1a", border: "1px solid #222222", borderRadius: "10px", padding: "10px 14px" },
    searchInput: { backgroundColor: "transparent", border: "none", color: "#e0e0e0", fontSize: "13px", width: "100%", outline: "none", fontFamily: "inherit" },
    statsBox: { display: "flex", gap: "12px", backgroundColor: "#1a1a1a", border: "1px solid #222222", borderRadius: "10px", padding: "14px" },
    statItem: { flex: 1, display: "flex", flexDirection: "column", gap: "2px", alignItems: "center" },
    middlePanel: { flex: 1, overflowY: "auto", borderRight: "1px solid #1e1e1e" },
    emptyState: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "16px", padding: "60px" },
    emptyAddBtn: { padding: "10px 20px", backgroundColor: "rgba(255,107,107,0.1)", border: "1px solid rgba(255,107,107,0.3)", borderRadius: "9px", color: "#ff6b6b", fontSize: "13px", fontWeight: "700", cursor: "pointer", fontFamily: "inherit" },
    campCard: { padding: "18px 22px", borderBottom: "1px solid #1a1a1a", cursor: "pointer", animation: "fadeUp 0.4s ease both", border: "1px solid transparent", borderBottomColor: "#1a1a1a" },
    cardTop: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" },
    campIcon: { fontSize: "24px", flexShrink: 0 },
    cardTitle: { color: "#e0e0e0", fontSize: "14px", fontWeight: "700" },
    cardOrg: { color: "#555555", fontSize: "11px", marginTop: "2px" },
    upcomingBadge: { fontSize: "11px", fontWeight: "600", padding: "4px 10px", borderRadius: "20px", flexShrink: 0 },
    cardDesc: { color: "#888888", fontSize: "12px", lineHeight: "1.5", marginBottom: "8px" },
    cardMeta: { display: "flex", gap: "14px", flexWrap: "wrap" },
    cardMetaItem: { color: "#444444", fontSize: "11px" },
    rightPanel: { width: "300px", minWidth: "300px", backgroundColor: "#0d0d0d", padding: "24px 18px", overflowY: "auto" },
    detailHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" },
    detailTitle: { color: "#ffffff", fontSize: "15px", fontWeight: "700" },
    closeBtn: { backgroundColor: "#1a1a1a", border: "1px solid #222222", color: "#666666", width: "28px", height: "28px", borderRadius: "50%", cursor: "pointer", fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center" },
    campHero: { display: "flex", alignItems: "center", gap: "14px", backgroundColor: "rgba(255,107,107,0.06)", border: "1px solid rgba(255,107,107,0.15)", borderRadius: "12px", padding: "16px", marginBottom: "14px" },
    heroTitle: { color: "#ffffff", fontSize: "15px", fontWeight: "700" },
    infoBox: { backgroundColor: "#1a1a1a", border: "1px solid #222222", borderRadius: "12px", padding: "14px", display: "flex", flexDirection: "column", gap: "10px", marginBottom: "14px" },
    infoRow: { display: "flex", justifyContent: "space-between" },
    infoLabel: { color: "#444444", fontSize: "12px" },
    infoValue: { color: "#e0e0e0", fontSize: "12px", fontWeight: "500", textAlign: "right", maxWidth: "160px" },
    descBox: { backgroundColor: "#1a1a1a", border: "1px solid #222222", borderRadius: "10px", padding: "12px", marginBottom: "14px" },
    descLabel: { color: "#444444", fontSize: "11px", fontWeight: "600", marginBottom: "6px" },
    descText: { color: "#cccccc", fontSize: "13px", lineHeight: "1.6" },
    callBtn: { width: "100%", padding: "12px", backgroundColor: "rgba(255,107,107,0.1)", border: "1px solid rgba(255,107,107,0.3)", borderRadius: "9px", color: "#ff6b6b", fontSize: "13px", fontWeight: "700", cursor: "pointer", fontFamily: "inherit", marginBottom: "10px" },
    actionBtns: { display: "flex", gap: "8px" },
    editBtn: { flex: 1, padding: "10px", backgroundColor: "rgba(107,203,255,0.08)", border: "1px solid rgba(107,203,255,0.2)", borderRadius: "8px", color: "#6bcbff", fontSize: "12px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit" },
    deleteBtn: { flex: 1, padding: "10px", backgroundColor: "transparent", border: "1px solid #2a2a2a", borderRadius: "8px", color: "#555555", fontSize: "12px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit" },
    detailEmpty: { height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "14px", textAlign: "center", padding: "40px" },
    detailEmptyText: { color: "#333333", fontSize: "13px" },
    formGroup: { display: "flex", flexDirection: "column", gap: "6px", marginBottom: "12px" },
    formLabel: { color: "#555555", fontSize: "11px", fontWeight: "600", letterSpacing: "0.5px" },
    formInput: { width: "100%", padding: "10px 12px", backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "8px", color: "#e0e0e0", fontSize: "13px", fontFamily: "inherit", boxSizing: "border-box" },
    formTextarea: { width: "100%", padding: "10px 12px", backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "8px", color: "#e0e0e0", fontSize: "13px", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" },
    formError: { color: "#ff6b6b", fontSize: "12px", backgroundColor: "rgba(255,107,107,0.08)", border: "1px solid rgba(255,107,107,0.2)", borderRadius: "8px", padding: "10px 12px", marginBottom: "10px" },
    saveBtn: { width: "100%", padding: "12px", backgroundColor: "rgba(255,107,107,0.12)", border: "1px solid rgba(255,107,107,0.3)", borderRadius: "9px", color: "#ff6b6b", fontSize: "13px", fontWeight: "700", cursor: "pointer", fontFamily: "inherit" },
};

export default BloodCampaigns;