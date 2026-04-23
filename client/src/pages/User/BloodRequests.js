import { useState, useEffect } from "react";
import axios from "axios";
import useAuth from "../../hooks/useAuth";
import Navbar from "../../components/Navbar";

const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const bloodTypeColors = {
    "A+": "#ff6b6b", "A-": "#ff9f43", "B+": "#ffd93d", "B-": "#6bcbff",
    "AB+": "#a29bfe", "AB-": "#fd79a8", "O+": "#00ff88", "O-": "#e17055",
};

const statusConfig = {
    open: { color: "#00ff88", bg: "rgba(0,255,136,0.08)", label: "Open" },
    fulfilled: { color: "#6bcbff", bg: "rgba(107,203,255,0.08)", label: "Fulfilled" },
    closed: { color: "#555555", bg: "rgba(85,85,85,0.08)", label: "Closed" },
};

const emptyForm = { bloodType: "A+", liters: "", hospital: "", address: "", reason: "", contact: "" };

const BloodRequests = () => {
    const { token, role } = useAuth();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [formMode, setFormMode] = useState("add");
    const [formData, setFormData] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState("");
    const [search, setSearch] = useState("");
    const [filterBlood, setFilterBlood] = useState("all");
    const [filterStatus, setFilterStatus] = useState("all");
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [myId, setMyId] = useState(null);

    useEffect(() => {
        fetchRequests();
        const stored = localStorage.getItem("user");
        if (stored) setMyId(JSON.parse(stored)._id);
    }, []);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const res = await axios.get("http://localhost:3001/api/blood/requests", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setRequests(res.data);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const handleOpenAdd = () => {
        setFormMode("add");
        setFormData(emptyForm);
        setFormError("");
        setShowForm(true);
        setSelectedRequest(null);
    };

    const handleOpenEdit = (req) => {
        setFormMode("edit");
        setFormData({
            bloodType: req.bloodType,
            liters: req.liters,
            hospital: req.hospital,
            address: req.address,
            reason: req.reason,
            contact: req.contact,
            status: req.status,
        });
        setFormError("");
        setShowForm(true);
    };

    const handleSave = async () => {
        if (!formData.liters || !formData.hospital || !formData.address || !formData.reason || !formData.contact) {
            setFormError("All fields are required.");
            return;
        }
        setSaving(true);
        setFormError("");
        try {
            if (formMode === "add") {
                const res = await axios.post(
                    "http://localhost:3001/api/blood/requests",
                    formData,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setRequests(prev => [res.data.request, ...prev]);
            } else {
                const res = await axios.put(
                    `http://localhost:3001/api/blood/requests/${selectedRequest._id}`,
                    formData,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setRequests(prev => prev.map(r => r._id === selectedRequest._id ? res.data.request : r));
                setSelectedRequest(res.data.request);
            }
            setShowForm(false);
        } catch (err) {
            setFormError(err.response?.data?.message || "Something went wrong.");
        }
        setSaving(false);
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`http://localhost:3001/api/blood/requests/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setRequests(prev => prev.filter(r => r._id !== id));
            if (selectedRequest?._id === id) setSelectedRequest(null);
        } catch (err) {
            console.error(err);
        }
        setConfirmDelete(null);
    };

    const canEdit = (req) => role === "admin" || req.userId?._id === myId || req.userId === myId;

    const displayed = requests.filter(r => {
        const matchBlood = filterBlood === "all" || r.bloodType === filterBlood;
        const matchStatus = filterStatus === "all" || r.status === filterStatus;
        const matchSearch =
            (r.hospital || "").toLowerCase().includes(search.toLowerCase()) ||
            (r.address || "").toLowerCase().includes(search.toLowerCase()) ||
            (r.reason || "").toLowerCase().includes(search.toLowerCase());
        return matchBlood && matchStatus && matchSearch;
    });

    if (loading) return (
        <div style={styles.loadingScreen}>
            <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
            <div style={styles.spinner}></div>
            <p style={styles.loadingText}>{"Loading blood requests..."}</p>
        </div>
    );

    return (
        <div style={styles.page}>
            <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        .req-card{transition:all 0.3s ease !important}
        .req-card:hover{transform:translateY(-2px) !important;border-color:rgba(255,107,107,0.3) !important;box-shadow:0 12px 30px rgba(0,0,0,0.3) !important}
        .req-card.selected{border-color:#ff6b6b !important;background:rgba(255,107,107,0.04) !important}
        .filter-btn{transition:all 0.2s ease !important}
        .filter-btn:hover{color:#ff6b6b !important}
        .add-btn:hover{background:rgba(255,107,107,0.2) !important}
        input:focus,select:focus,textarea:focus{border-color:#ff6b6b !important;outline:none !important}
        .confirm-overlay{animation:fadeIn 0.2s ease !important}
      `}</style>

            {/* Delete Confirm Modal */}
            {confirmDelete && (
                <div className="confirm-overlay" style={styles.overlay}>
                    <div style={styles.modal}>
                        <div style={{ fontSize: "40px" }}>{"🗑️"}</div>
                        <h3 style={styles.modalTitle}>{"Delete Request?"}</h3>
                        <p style={styles.modalDesc}>{"This blood request will be permanently deleted."}</p>
                        <div style={styles.modalBtns}>
                            <button style={styles.modalCancel} onClick={() => setConfirmDelete(null)}>{"Cancel"}</button>
                            <button style={styles.modalDelete} onClick={() => handleDelete(confirmDelete)}>{"Delete"}</button>
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
                        <h2 style={styles.leftTitle}>{"Blood"}</h2>
                        <h2 style={styles.leftTitleRed}>{"Requests"}</h2>
                        <p style={styles.leftSubtitle}>{requests.length}{" total requests"}</p>
                    </div>

                    <button style={styles.addBtn} className="add-btn" onClick={handleOpenAdd}>
                        {"＋ New Blood Request"}
                    </button>

                    <div style={styles.searchBox}>
                        <span>{"🔍"}</span>
                        <input
                            type="text"
                            placeholder="Search hospital, area..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={styles.searchInput}
                        />
                    </div>

                    <div style={styles.filterSection}>
                        <p style={styles.filterTitle}>{"BLOOD TYPE"}</p>
                        <button
                            className="filter-btn"
                            style={{ ...styles.filterBtn, ...(filterBlood === "all" ? styles.filterActive : {}) }}
                            onClick={() => setFilterBlood("all")}
                        >
                            <span>{"🩸 All Types"}</span>
                            <span style={styles.filterCount}>{requests.length}</span>
                        </button>
                        {bloodTypes.map(bt => (
                            <button
                                key={bt}
                                className="filter-btn"
                                style={{ ...styles.filterBtn, ...(filterBlood === bt ? styles.filterActive : {}) }}
                                onClick={() => setFilterBlood(bt)}
                            >
                                <span style={{ color: bloodTypeColors[bt], fontWeight: "700" }}>{bt}</span>
                                <span style={styles.filterCount}>{requests.filter(r => r.bloodType === bt).length}</span>
                            </button>
                        ))}
                    </div>

                    <div style={styles.filterSection}>
                        <p style={styles.filterTitle}>{"STATUS"}</p>
                        {["all", "open", "fulfilled", "closed"].map(s => (
                            <button
                                key={s}
                                className="filter-btn"
                                style={{ ...styles.filterBtn, ...(filterStatus === s ? styles.filterActive : {}) }}
                                onClick={() => setFilterStatus(s)}
                            >
                                <span>{s === "all" ? "🗂 All" : statusConfig[s]?.label}</span>
                                <span style={styles.filterCount}>
                                    {s === "all" ? requests.length : requests.filter(r => r.status === s).length}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* MIDDLE PANEL */}
                <div style={styles.middlePanel}>
                    {displayed.length === 0 ? (
                        <div style={styles.emptyState}>
                            <div style={{ fontSize: "48px", opacity: 0.3 }}>{"🩸"}</div>
                            <p style={{ color: "#555555", fontSize: "15px" }}>{"No blood requests found"}</p>
                            <button style={styles.emptyAddBtn} onClick={handleOpenAdd}>{"＋ Create First Request"}</button>
                        </div>
                    ) : (
                        displayed.map((req, i) => (
                            <div
                                key={req._id}
                                className={"req-card" + (selectedRequest?._id === req._id ? " selected" : "")}
                                style={{ ...styles.reqCard, animationDelay: `${i * 0.04}s` }}
                                onClick={() => { setSelectedRequest(selectedRequest?._id === req._id ? null : req); setShowForm(false); }}
                            >
                                <div style={styles.cardTop}>
                                    <div style={styles.cardLeft}>
                                        <div style={{
                                            ...styles.bloodTypeBadge,
                                            backgroundColor: (bloodTypeColors[req.bloodType] || "#ff6b6b") + "15",
                                            border: "2px solid " + (bloodTypeColors[req.bloodType] || "#ff6b6b"),
                                            color: bloodTypeColors[req.bloodType] || "#ff6b6b",
                                        }}>
                                            {req.bloodType}
                                        </div>
                                        <div>
                                            <p style={styles.cardHospital}>{req.hospital}</p>
                                            <p style={styles.cardArea}>{"📍 " + req.address}</p>
                                        </div>
                                    </div>
                                    <span style={{
                                        ...styles.statusBadge,
                                        color: statusConfig[req.status]?.color,
                                        backgroundColor: statusConfig[req.status]?.bg,
                                    }}>
                                        {statusConfig[req.status]?.label}
                                    </span>
                                </div>
                                <p style={styles.cardReason}>{req.reason.substring(0, 80)}{req.reason.length > 80 ? "..." : ""}</p>
                                <div style={styles.cardMeta}>
                                    <span style={styles.cardMetaItem}>{"🩸 " + req.liters + "L needed"}</span>
                                    <span style={styles.cardMetaItem}>{"👤 " + (req.userId?.name || "Unknown")}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* RIGHT PANEL */}
                <div style={styles.rightPanel}>
                    {showForm ? (
                        <div style={{ animation: "slideIn 0.3s ease" }}>
                            <div style={styles.detailHeader}>
                                <h3 style={styles.detailTitle}>{formMode === "add" ? "➕ New Request" : "✏️ Edit Request"}</h3>
                                <button style={styles.closeBtn} onClick={() => { setShowForm(false); setFormError(""); }}>{"✕"}</button>
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.formLabel}>{"Blood Type *"}</label>
                                <select value={formData.bloodType} onChange={e => setFormData(p => ({ ...p, bloodType: e.target.value }))} style={styles.formSelect}>
                                    {bloodTypes.map(bt => <option key={bt} value={bt}>{bt}</option>)}
                                </select>
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.formLabel}>{"Liters Needed *"}</label>
                                <input type="number" step="0.1" min="0.1" placeholder="e.g. 2" value={formData.liters} onChange={e => setFormData(p => ({ ...p, liters: e.target.value }))} style={styles.formInput} />
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.formLabel}>{"Hospital Name *"}</label>
                                <input type="text" placeholder="e.g. Dhaka Medical College Hospital" value={formData.hospital} onChange={e => setFormData(p => ({ ...p, hospital: e.target.value }))} style={styles.formInput} />
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.formLabel}>{"Address *"}</label>
                                <input type="text" placeholder="Full address" value={formData.address} onChange={e => setFormData(p => ({ ...p, address: e.target.value }))} style={styles.formInput} />
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.formLabel}>{"Reason *"}</label>
                                <textarea rows={3} placeholder="Why is blood needed?" value={formData.reason} onChange={e => setFormData(p => ({ ...p, reason: e.target.value }))} style={styles.formTextarea} />
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.formLabel}>{"Contact Number *"}</label>
                                <input type="text" placeholder="e.g. 01700-000000" value={formData.contact} onChange={e => setFormData(p => ({ ...p, contact: e.target.value }))} style={styles.formInput} />
                            </div>

                            {formMode === "edit" && (
                                <div style={styles.formGroup}>
                                    <label style={styles.formLabel}>{"Status"}</label>
                                    <select value={formData.status} onChange={e => setFormData(p => ({ ...p, status: e.target.value }))} style={styles.formSelect}>
                                        <option value="open">Open</option>
                                        <option value="fulfilled">Fulfilled</option>
                                        <option value="closed">Closed</option>
                                    </select>
                                </div>
                            )}

                            {formError && <p style={styles.formError}>{"⚠️ " + formError}</p>}

                            <button style={styles.saveBtn} onClick={handleSave} disabled={saving}>
                                {saving ? "⏳ Saving..." : formMode === "add" ? "➕ Submit Request" : "💾 Save Changes"}
                            </button>
                        </div>

                    ) : selectedRequest ? (
                        <div style={{ animation: "slideIn 0.3s ease" }}>
                            <div style={styles.detailHeader}>
                                <h3 style={styles.detailTitle}>{"Request Details"}</h3>
                                <button style={styles.closeBtn} onClick={() => setSelectedRequest(null)}>{"✕"}</button>
                            </div>

                            <div style={{
                                ...styles.bloodHero,
                                backgroundColor: (bloodTypeColors[selectedRequest.bloodType] || "#ff6b6b") + "10",
                                border: "1px solid " + (bloodTypeColors[selectedRequest.bloodType] || "#ff6b6b") + "30",
                            }}>
                                <div style={{
                                    ...styles.heroBloodType,
                                    color: bloodTypeColors[selectedRequest.bloodType] || "#ff6b6b",
                                    borderColor: bloodTypeColors[selectedRequest.bloodType] || "#ff6b6b",
                                }}>
                                    {selectedRequest.bloodType}
                                </div>
                                <div>
                                    <p style={styles.heroLiters}>{selectedRequest.liters}{" liters needed"}</p>
                                    <span style={{
                                        ...styles.statusBadge,
                                        color: statusConfig[selectedRequest.status]?.color,
                                        backgroundColor: statusConfig[selectedRequest.status]?.bg,
                                    }}>
                                        {statusConfig[selectedRequest.status]?.label}
                                    </span>
                                </div>
                            </div>

                            <div style={styles.infoBox}>
                                {[
                                    { label: "Hospital", value: selectedRequest.hospital },
                                    { label: "Address", value: selectedRequest.address },
                                    { label: "Contact", value: selectedRequest.contact },
                                    { label: "Requested By", value: selectedRequest.userId?.name || "Unknown" },
                                    {
                                        label: "Posted",
                                        value: new Date(selectedRequest.createdAt).toLocaleDateString("en-US", {
                                            year: "numeric", month: "long", day: "numeric"
                                        })
                                    },
                                ].map((item, i) => (
                                    <div key={i} style={styles.infoRow}>
                                        <span style={styles.infoLabel}>{item.label}</span>
                                        <span style={styles.infoValue}>{item.value}</span>
                                    </div>
                                ))}
                            </div>

                            <div style={styles.reasonBox}>
                                <p style={styles.reasonLabel}>{"📋 Reason"}</p>
                                <p style={styles.reasonText}>{selectedRequest.reason}</p>
                            </div>

                            <button
                                style={styles.callBtn}
                                onClick={() => window.open("tel:" + selectedRequest.contact)}
                            >
                                {"📲 Call to Donate"}
                            </button>

                            {canEdit(selectedRequest) && (
                                <div style={styles.actionBtns}>
                                    <button style={styles.editBtn} onClick={() => handleOpenEdit(selectedRequest)}>{"✏️ Edit"}</button>
                                    <button style={styles.deleteBtn} onClick={() => setConfirmDelete(selectedRequest._id)}>{"🗑️ Delete"}</button>
                                </div>
                            )}
                        </div>

                    ) : (
                        <div style={styles.detailEmpty}>
                            <div style={{ fontSize: "40px", opacity: 0.3 }}>{"🩸"}</div>
                            <p style={styles.detailEmptyText}>{"Click a request to view details"}</p>
                            <button style={styles.emptyAddBtn} onClick={handleOpenAdd}>{"＋ New Request"}</button>
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
    filterSection: { display: "flex", flexDirection: "column", gap: "3px" },
    filterTitle: { color: "#333333", fontSize: "10px", fontWeight: "700", letterSpacing: "1px", marginBottom: "4px" },
    filterBtn: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", borderRadius: "7px", border: "1px solid transparent", backgroundColor: "transparent", color: "#666666", fontSize: "12px", cursor: "pointer", width: "100%", fontFamily: "inherit" },
    filterActive: { backgroundColor: "rgba(255,107,107,0.08)", border: "1px solid rgba(255,107,107,0.2)", color: "#ff6b6b" },
    filterCount: { backgroundColor: "#222222", color: "#555555", fontSize: "10px", padding: "1px 7px", borderRadius: "10px" },
    middlePanel: { flex: 1, overflowY: "auto", borderRight: "1px solid #1e1e1e" },
    emptyState: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "16px", padding: "60px" },
    emptyAddBtn: { padding: "10px 20px", backgroundColor: "rgba(255,107,107,0.1)", border: "1px solid rgba(255,107,107,0.3)", borderRadius: "9px", color: "#ff6b6b", fontSize: "13px", fontWeight: "700", cursor: "pointer", fontFamily: "inherit" },
    reqCard: { padding: "18px 22px", borderBottom: "1px solid #1a1a1a", cursor: "pointer", animation: "fadeUp 0.4s ease both", border: "1px solid transparent", borderBottomColor: "#1a1a1a" },
    cardTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" },
    cardLeft: { display: "flex", alignItems: "center", gap: "12px" },
    bloodTypeBadge: { width: "44px", height: "44px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: "800", flexShrink: 0 },
    cardHospital: { color: "#e0e0e0", fontSize: "13px", fontWeight: "600" },
    cardArea: { color: "#555555", fontSize: "11px", marginTop: "2px" },
    statusBadge: { fontSize: "11px", fontWeight: "600", padding: "4px 10px", borderRadius: "20px" },
    cardReason: { color: "#888888", fontSize: "12px", lineHeight: "1.5", marginBottom: "8px" },
    cardMeta: { display: "flex", gap: "14px" },
    cardMetaItem: { color: "#444444", fontSize: "11px" },
    rightPanel: { width: "300px", minWidth: "300px", backgroundColor: "#0d0d0d", padding: "24px 18px", overflowY: "auto" },
    detailHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" },
    detailTitle: { color: "#ffffff", fontSize: "15px", fontWeight: "700" },
    closeBtn: { backgroundColor: "#1a1a1a", border: "1px solid #222222", color: "#666666", width: "28px", height: "28px", borderRadius: "50%", cursor: "pointer", fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center" },
    bloodHero: { display: "flex", alignItems: "center", gap: "16px", borderRadius: "12px", padding: "16px", marginBottom: "14px" },
    heroBloodType: { width: "56px", height: "56px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", fontWeight: "800", border: "2px solid", flexShrink: 0 },
    heroLiters: { color: "#ffffff", fontSize: "14px", fontWeight: "700", marginBottom: "6px" },
    infoBox: { backgroundColor: "#1a1a1a", border: "1px solid #222222", borderRadius: "12px", padding: "14px", display: "flex", flexDirection: "column", gap: "10px", marginBottom: "14px" },
    infoRow: { display: "flex", justifyContent: "space-between" },
    infoLabel: { color: "#444444", fontSize: "12px" },
    infoValue: { color: "#e0e0e0", fontSize: "12px", fontWeight: "500", textAlign: "right", maxWidth: "160px" },
    reasonBox: { backgroundColor: "#1a1a1a", border: "1px solid #222222", borderRadius: "10px", padding: "12px", marginBottom: "14px" },
    reasonLabel: { color: "#444444", fontSize: "11px", fontWeight: "600", marginBottom: "6px" },
    reasonText: { color: "#cccccc", fontSize: "13px", lineHeight: "1.6" },
    callBtn: { width: "100%", padding: "12px", backgroundColor: "rgba(255,107,107,0.1)", border: "1px solid rgba(255,107,107,0.3)", borderRadius: "9px", color: "#ff6b6b", fontSize: "13px", fontWeight: "700", cursor: "pointer", fontFamily: "inherit", marginBottom: "10px" },
    actionBtns: { display: "flex", gap: "8px" },
    editBtn: { flex: 1, padding: "10px", backgroundColor: "rgba(107,203,255,0.08)", border: "1px solid rgba(107,203,255,0.2)", borderRadius: "8px", color: "#6bcbff", fontSize: "12px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit" },
    deleteBtn: { flex: 1, padding: "10px", backgroundColor: "transparent", border: "1px solid #2a2a2a", borderRadius: "8px", color: "#555555", fontSize: "12px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit" },
    detailEmpty: { height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "14px", textAlign: "center", padding: "40px" },
    detailEmptyText: { color: "#333333", fontSize: "13px" },
    formGroup: { display: "flex", flexDirection: "column", gap: "6px", marginBottom: "12px" },
    formLabel: { color: "#555555", fontSize: "11px", fontWeight: "600", letterSpacing: "0.5px" },
    formInput: { width: "100%", padding: "10px 12px", backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "8px", color: "#e0e0e0", fontSize: "13px", fontFamily: "inherit", boxSizing: "border-box" },
    formSelect: { width: "100%", padding: "10px 12px", backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "8px", color: "#e0e0e0", fontSize: "13px", fontFamily: "inherit", cursor: "pointer" },
    formTextarea: { width: "100%", padding: "10px 12px", backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "8px", color: "#e0e0e0", fontSize: "13px", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box" },
    formError: { color: "#ff6b6b", fontSize: "12px", backgroundColor: "rgba(255,107,107,0.08)", border: "1px solid rgba(255,107,107,0.2)", borderRadius: "8px", padding: "10px 12px", marginBottom: "10px" },
    saveBtn: { width: "100%", padding: "12px", backgroundColor: "rgba(255,107,107,0.12)", border: "1px solid rgba(255,107,107,0.3)", borderRadius: "9px", color: "#ff6b6b", fontSize: "13px", fontWeight: "700", cursor: "pointer", fontFamily: "inherit" },
};

export default BloodRequests;