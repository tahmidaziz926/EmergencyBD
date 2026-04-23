import { useState, useEffect } from "react";
import axios from "axios";
import useAuth from "../../hooks/useAuth";
import Navbar from "../../components/Navbar";

const bloodTypes = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const bloodTypeColors = {
    "A+": "#ff6b6b", "A-": "#ff9f43", "B+": "#ffd93d", "B-": "#6bcbff",
    "AB+": "#a29bfe", "AB-": "#fd79a8", "O+": "#00ff88", "O-": "#e17055",
};

const emptyForm = { bloodType: "A+", area: "", contact: "", lastDonated: "" };

const BloodDonors = () => {
    const { token, role } = useAuth();
    const [donors, setDonors] = useState([]);
    const [myProfile, setMyProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedDonor, setSelectedDonor] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState("");
    const [search, setSearch] = useState("");
    const [filterBlood, setFilterBlood] = useState("all");
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        fetchDonors();
        fetchMyProfile();
    }, []);

    const fetchDonors = async () => {
        setLoading(true);
        try {
            const res = await axios.get("http://localhost:3001/api/blood/donors", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setDonors(res.data);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    const fetchMyProfile = async () => {
        try {
            const res = await axios.get("http://localhost:3001/api/blood/donors/me", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setMyProfile(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleRegister = async () => {
        if (!formData.area || !formData.contact) {
            setFormError("Area and contact are required.");
            return;
        }
        setSaving(true);
        setFormError("");
        try {
            const res = await axios.post(
                "http://localhost:3001/api/blood/donors",
                formData,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setMyProfile(res.data.donor);
            setDonors(prev => [res.data.donor, ...prev]);
            setShowForm(false);
        } catch (err) {
            setFormError(err.response?.data?.message || "Something went wrong.");
        }
        setSaving(false);
    };

    const handleUpdate = async () => {
        setSaving(true);
        setFormError("");
        try {
            const res = await axios.put(
                "http://localhost:3001/api/blood/donors/me",
                formData,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setMyProfile(res.data.donor);
            setDonors(prev => prev.map(d => d._id === res.data.donor._id ? res.data.donor : d));
            setShowForm(false);
        } catch (err) {
            setFormError(err.response?.data?.message || "Something went wrong.");
        }
        setSaving(false);
    };

    const handleDeleteProfile = async () => {
        setDeleting(true);
        try {
            if (role === "admin" && confirmDelete?.isAdmin) {
                await axios.delete(`http://localhost:3001/api/blood/donors/${confirmDelete.id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setDonors(prev => prev.filter(d => d._id !== confirmDelete.id));
                if (selectedDonor?._id === confirmDelete.id) setSelectedDonor(null);
            } else {
                await axios.delete("http://localhost:3001/api/blood/donors/me/profile", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setMyProfile(null);
                setDonors(prev => prev.filter(d => d.userId?._id !== confirmDelete.id));
            }
        } catch (err) {
            console.error(err);
        }
        setDeleting(false);
        setConfirmDelete(null);
    };

    const displayed = donors.filter(d => {
        const matchBlood = filterBlood === "all" || d.bloodType === filterBlood;
        const matchSearch =
            (d.userId?.name || "").toLowerCase().includes(search.toLowerCase()) ||
            (d.area || "").toLowerCase().includes(search.toLowerCase());
        return matchBlood && matchSearch;
    });

    if (loading) return (
        <div style={styles.loadingScreen}>
            <style>{"@keyframes spin{to{transform:rotate(360deg)}}"}</style>
            <div style={styles.spinner}></div>
            <p style={styles.loadingText}>{"Loading donors..."}</p>
        </div>
    );

    return (
        <div style={styles.page}>
            <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        .donor-card{transition:all 0.3s ease !important}
        .donor-card:hover{transform:translateY(-2px) !important;border-color:rgba(255,107,107,0.3) !important;box-shadow:0 12px 30px rgba(0,0,0,0.3) !important}
        .donor-card.selected{border-color:#ff6b6b !important;background:rgba(255,107,107,0.04) !important}
        .filter-btn{transition:all 0.2s ease !important}
        .filter-btn:hover{color:#ff6b6b !important}
        input:focus,select:focus{border-color:#ff6b6b !important;outline:none !important}
        .confirm-overlay{animation:fadeIn 0.2s ease !important}
      `}</style>

            {confirmDelete && (
                <div className="confirm-overlay" style={styles.overlay}>
                    <div style={styles.modal}>
                        <div style={{ fontSize: "40px" }}>{"🗑️"}</div>
                        <h3 style={styles.modalTitle}>{"Delete Donor Profile?"}</h3>
                        <p style={styles.modalDesc}>{"This donor profile will be permanently removed."}</p>
                        <div style={styles.modalBtns}>
                            <button style={styles.modalCancel} onClick={() => setConfirmDelete(null)}>{"Cancel"}</button>
                            <button style={styles.modalDelete} onClick={handleDeleteProfile} disabled={deleting}>
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
                        <div style={{ fontSize: "28px" }}>{"🫀"}</div>
                        <h2 style={styles.leftTitle}>{"Blood"}</h2>
                        <h2 style={styles.leftTitleRed}>{"Donors"}</h2>
                        <p style={styles.leftSubtitle}>{donors.length}{" registered donors"}</p>
                    </div>

                    {/* My donor status */}
                    {role !== "admin" && (
                        <div style={styles.myStatusBox}>
                            <p style={styles.myStatusTitle}>{"My Donor Status"}</p>
                            {myProfile ? (
                                <>
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                        <div style={{
                                            ...styles.smallBloodBadge,
                                            color: bloodTypeColors[myProfile.bloodType],
                                            borderColor: bloodTypeColors[myProfile.bloodType],
                                        }}>
                                            {myProfile.bloodType}
                                        </div>
                                        <div>
                                            <p style={{ color: "#00ff88", fontSize: "12px", fontWeight: "700" }}>{"✅ Registered"}</p>
                                            <p style={{ color: "#444444", fontSize: "10px" }}>
                                                {myProfile.isAvailable ? "Available to donate" : "Currently unavailable"}
                                            </p>
                                        </div>
                                    </div>
                                    <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
                                        <button
                                            style={styles.myEditBtn}
                                            onClick={() => {
                                                setFormData({
                                                    bloodType: myProfile.bloodType,
                                                    area: myProfile.area,
                                                    contact: myProfile.contact,
                                                    lastDonated: myProfile.lastDonated ? myProfile.lastDonated.split("T")[0] : "",
                                                    isAvailable: myProfile.isAvailable,
                                                });
                                                setFormError("");
                                                setShowForm("edit");
                                            }}
                                        >
                                            {"✏️ Edit"}
                                        </button>
                                        <button
                                            style={styles.myDeleteBtn}
                                            onClick={() => setConfirmDelete({ id: myProfile.userId?._id || myProfile.userId, isAdmin: false })}
                                        >
                                            {"🗑️ Remove"}
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <button
                                    style={styles.registerBtn}
                                    onClick={() => { setFormData(emptyForm); setFormError(""); setShowForm("register"); }}
                                >
                                    {"🩸 Register as Donor"}
                                </button>
                            )}
                        </div>
                    )}

                    <div style={styles.searchBox}>
                        <span>{"🔍"}</span>
                        <input
                            type="text"
                            placeholder="Search name, area..."
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
                            <span>{"🩸 All"}</span>
                            <span style={styles.filterCount}>{donors.length}</span>
                        </button>
                        {bloodTypes.map(bt => (
                            <button
                                key={bt}
                                className="filter-btn"
                                style={{ ...styles.filterBtn, ...(filterBlood === bt ? styles.filterActive : {}) }}
                                onClick={() => setFilterBlood(bt)}
                            >
                                <span style={{ color: bloodTypeColors[bt], fontWeight: "700" }}>{bt}</span>
                                <span style={styles.filterCount}>{donors.filter(d => d.bloodType === bt).length}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* MIDDLE PANEL */}
                <div style={styles.middlePanel}>
                    {displayed.length === 0 ? (
                        <div style={styles.emptyState}>
                            <div style={{ fontSize: "48px", opacity: 0.3 }}>{"🫀"}</div>
                            <p style={{ color: "#555555", fontSize: "15px" }}>{"No donors found"}</p>
                        </div>
                    ) : (
                        displayed.map((donor, i) => (
                            <div
                                key={donor._id}
                                className={"donor-card" + (selectedDonor?._id === donor._id ? " selected" : "")}
                                style={{ ...styles.donorCard, animationDelay: `${i * 0.04}s` }}
                                onClick={() => { setSelectedDonor(selectedDonor?._id === donor._id ? null : donor); setShowForm(false); }}
                            >
                                <div style={styles.cardTop}>
                                    <div style={styles.cardLeft}>
                                        <div style={{
                                            ...styles.bloodTypeBadge,
                                            backgroundColor: (bloodTypeColors[donor.bloodType] || "#ff6b6b") + "15",
                                            border: "2px solid " + (bloodTypeColors[donor.bloodType] || "#ff6b6b"),
                                            color: bloodTypeColors[donor.bloodType] || "#ff6b6b",
                                        }}>
                                            {donor.bloodType}
                                        </div>
                                        <div>
                                            <p style={styles.cardName}>{donor.userId?.name || "Unknown"}</p>
                                            <p style={styles.cardArea}>{"📍 " + donor.area}</p>
                                        </div>
                                    </div>
                                    <span style={{
                                        ...styles.availBadge,
                                        color: donor.isAvailable ? "#00ff88" : "#555555",
                                        backgroundColor: donor.isAvailable ? "rgba(0,255,136,0.08)" : "rgba(85,85,85,0.08)",
                                    }}>
                                        {donor.isAvailable ? "✅ Available" : "⏸️ Unavailable"}
                                    </span>
                                </div>
                                <p style={styles.cardContact}>{"📞 " + donor.contact}</p>
                            </div>
                        ))
                    )}
                </div>

                {/* RIGHT PANEL */}
                <div style={styles.rightPanel}>
                    {showForm === "register" || showForm === "edit" ? (
                        <div style={{ animation: "slideIn 0.3s ease" }}>
                            <div style={styles.detailHeader}>
                                <h3 style={styles.detailTitle}>{showForm === "register" ? "🩸 Register as Donor" : "✏️ Update Profile"}</h3>
                                <button style={styles.closeBtn} onClick={() => { setShowForm(false); setFormError(""); }}>{"✕"}</button>
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.formLabel}>
                                    {"Blood Type *"}
                                    {showForm === "edit" && role !== "admin" && (
                                        <span style={{ color: "#ff6b6b", fontSize: "10px", marginLeft: "6px" }}>
                                            {"(cannot be changed)"}
                                        </span>
                                    )}
                                </label>
                                <select
                                    value={formData.bloodType}
                                    onChange={e => setFormData(p => ({ ...p, bloodType: e.target.value }))}
                                    style={styles.formSelect}
                                    disabled={showForm === "edit" && role !== "admin"}
                                >
                                    {bloodTypes.map(bt => <option key={bt} value={bt}>{bt}</option>)}
                                </select>
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.formLabel}>{"Area *"}</label>
                                <input type="text" placeholder="Your area/district" value={formData.area} onChange={e => setFormData(p => ({ ...p, area: e.target.value }))} style={styles.formInput} />
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.formLabel}>{"Contact Number *"}</label>
                                <input type="text" placeholder="e.g. 01700-000000" value={formData.contact} onChange={e => setFormData(p => ({ ...p, contact: e.target.value }))} style={styles.formInput} />
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.formLabel}>{"Last Donated (optional)"}</label>
                                <input type="date" value={formData.lastDonated} onChange={e => setFormData(p => ({ ...p, lastDonated: e.target.value }))} style={styles.formInput} />
                            </div>

                            {showForm === "edit" && (
                                <div style={styles.formGroup}>
                                    <label style={styles.formLabel}>{"Availability"}</label>
                                    <select
                                        value={formData.isAvailable ? "true" : "false"}
                                        onChange={e => setFormData(p => ({ ...p, isAvailable: e.target.value === "true" }))}
                                        style={styles.formSelect}
                                    >
                                        <option value="true">✅ Available to donate</option>
                                        <option value="false">⏸️ Not available</option>
                                    </select>
                                </div>
                            )}

                            {formError && <p style={styles.formError}>{"⚠️ " + formError}</p>}

                            <button
                                style={styles.saveBtn}
                                onClick={showForm === "register" ? handleRegister : handleUpdate}
                                disabled={saving}
                            >
                                {saving ? "⏳ Saving..." : showForm === "register" ? "🩸 Register" : "💾 Save Changes"}
                            </button>
                        </div>

                    ) : selectedDonor ? (
                        <div style={{ animation: "slideIn 0.3s ease" }}>
                            <div style={styles.detailHeader}>
                                <h3 style={styles.detailTitle}>{"Donor Details"}</h3>
                                <button style={styles.closeBtn} onClick={() => setSelectedDonor(null)}>{"✕"}</button>
                            </div>

                            <div style={{
                                ...styles.bloodHero,
                                backgroundColor: (bloodTypeColors[selectedDonor.bloodType] || "#ff6b6b") + "10",
                                border: "1px solid " + (bloodTypeColors[selectedDonor.bloodType] || "#ff6b6b") + "30",
                            }}>
                                <div style={{
                                    ...styles.heroBloodType,
                                    color: bloodTypeColors[selectedDonor.bloodType] || "#ff6b6b",
                                    borderColor: bloodTypeColors[selectedDonor.bloodType] || "#ff6b6b",
                                }}>
                                    {selectedDonor.bloodType}
                                </div>
                                <div>
                                    <p style={styles.heroName}>{selectedDonor.userId?.name || "Unknown"}</p>
                                    <span style={{
                                        ...styles.availBadge,
                                        color: selectedDonor.isAvailable ? "#00ff88" : "#555555",
                                        backgroundColor: selectedDonor.isAvailable ? "rgba(0,255,136,0.08)" : "rgba(85,85,85,0.08)",
                                    }}>
                                        {selectedDonor.isAvailable ? "✅ Available" : "⏸️ Unavailable"}
                                    </span>
                                </div>
                            </div>

                            <div style={styles.infoBox}>
                                {[
                                    { label: "Area", value: selectedDonor.area },
                                    { label: "Contact", value: selectedDonor.contact },
                                    { label: "Last Donated", value: selectedDonor.lastDonated ? new Date(selectedDonor.lastDonated).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "Not specified" },
                                    { label: "Registered", value: new Date(selectedDonor.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) },
                                ].map((item, i) => (
                                    <div key={i} style={styles.infoRow}>
                                        <span style={styles.infoLabel}>{item.label}</span>
                                        <span style={styles.infoValue}>{item.value}</span>
                                    </div>
                                ))}
                            </div>

                            <button style={styles.callBtn} onClick={() => window.open("tel:" + selectedDonor.contact)}>
                                {"📲 Contact Donor"}
                            </button>

                            {role === "admin" && (
                                <button
                                    style={styles.adminDeleteBtn}
                                    onClick={() => setConfirmDelete({ id: selectedDonor._id, isAdmin: true })}
                                >
                                    {"🗑️ Remove Donor (Admin)"}
                                </button>
                            )}
                        </div>

                    ) : (
                        <div style={styles.detailEmpty}>
                            <div style={{ fontSize: "40px", opacity: 0.3 }}>{"🫀"}</div>
                            <p style={styles.detailEmptyText}>{"Click a donor to view details"}</p>
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
    myStatusBox: { backgroundColor: "#1a1a1a", border: "1px solid #222222", borderRadius: "10px", padding: "12px", display: "flex", flexDirection: "column", gap: "8px" },
    myStatusTitle: { color: "#333333", fontSize: "10px", fontWeight: "700", letterSpacing: "1px" },
    smallBloodBadge: { width: "36px", height: "36px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "800", border: "2px solid", flexShrink: 0 },
    registerBtn: { width: "100%", padding: "10px", backgroundColor: "rgba(255,107,107,0.1)", border: "1px solid rgba(255,107,107,0.3)", borderRadius: "8px", color: "#ff6b6b", fontSize: "12px", fontWeight: "700", cursor: "pointer", fontFamily: "inherit" },
    myEditBtn: { flex: 1, padding: "8px", backgroundColor: "rgba(107,203,255,0.08)", border: "1px solid rgba(107,203,255,0.2)", borderRadius: "7px", color: "#6bcbff", fontSize: "11px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit" },
    myDeleteBtn: { flex: 1, padding: "8px", backgroundColor: "transparent", border: "1px solid #2a2a2a", borderRadius: "7px", color: "#555555", fontSize: "11px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit" },
    searchBox: { display: "flex", alignItems: "center", gap: "10px", backgroundColor: "#1a1a1a", border: "1px solid #222222", borderRadius: "10px", padding: "10px 14px" },
    searchInput: { backgroundColor: "transparent", border: "none", color: "#e0e0e0", fontSize: "13px", width: "100%", outline: "none", fontFamily: "inherit" },
    filterSection: { display: "flex", flexDirection: "column", gap: "3px" },
    filterTitle: { color: "#333333", fontSize: "10px", fontWeight: "700", letterSpacing: "1px", marginBottom: "4px" },
    filterBtn: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", borderRadius: "7px", border: "1px solid transparent", backgroundColor: "transparent", color: "#666666", fontSize: "12px", cursor: "pointer", width: "100%", fontFamily: "inherit" },
    filterActive: { backgroundColor: "rgba(255,107,107,0.08)", border: "1px solid rgba(255,107,107,0.2)", color: "#ff6b6b" },
    filterCount: { backgroundColor: "#222222", color: "#555555", fontSize: "10px", padding: "1px 7px", borderRadius: "10px" },
    middlePanel: { flex: 1, overflowY: "auto", borderRight: "1px solid #1e1e1e" },
    emptyState: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "16px", padding: "60px" },
    donorCard: { padding: "16px 22px", borderBottom: "1px solid #1a1a1a", cursor: "pointer", animation: "fadeUp 0.4s ease both", border: "1px solid transparent", borderBottomColor: "#1a1a1a" },
    cardTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" },
    cardLeft: { display: "flex", alignItems: "center", gap: "12px" },
    bloodTypeBadge: { width: "44px", height: "44px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: "800", flexShrink: 0 },
    cardName: { color: "#e0e0e0", fontSize: "13px", fontWeight: "600" },
    cardArea: { color: "#555555", fontSize: "11px", marginTop: "2px" },
    availBadge: { fontSize: "11px", fontWeight: "600", padding: "4px 10px", borderRadius: "20px" },
    cardContact: { color: "#444444", fontSize: "11px" },
    rightPanel: { width: "300px", minWidth: "300px", backgroundColor: "#0d0d0d", padding: "24px 18px", overflowY: "auto" },
    detailHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" },
    detailTitle: { color: "#ffffff", fontSize: "15px", fontWeight: "700" },
    closeBtn: { backgroundColor: "#1a1a1a", border: "1px solid #222222", color: "#666666", width: "28px", height: "28px", borderRadius: "50%", cursor: "pointer", fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center" },
    bloodHero: { display: "flex", alignItems: "center", gap: "16px", borderRadius: "12px", padding: "16px", marginBottom: "14px" },
    heroBloodType: { width: "56px", height: "56px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", fontWeight: "800", border: "2px solid", flexShrink: 0 },
    heroName: { color: "#ffffff", fontSize: "14px", fontWeight: "700", marginBottom: "6px" },
    infoBox: { backgroundColor: "#1a1a1a", border: "1px solid #222222", borderRadius: "12px", padding: "14px", display: "flex", flexDirection: "column", gap: "10px", marginBottom: "14px" },
    infoRow: { display: "flex", justifyContent: "space-between" },
    infoLabel: { color: "#444444", fontSize: "12px" },
    infoValue: { color: "#e0e0e0", fontSize: "12px", fontWeight: "500", textAlign: "right", maxWidth: "160px" },
    callBtn: { width: "100%", padding: "12px", backgroundColor: "rgba(255,107,107,0.1)", border: "1px solid rgba(255,107,107,0.3)", borderRadius: "9px", color: "#ff6b6b", fontSize: "13px", fontWeight: "700", cursor: "pointer", fontFamily: "inherit", marginBottom: "10px" },
    adminDeleteBtn: { width: "100%", padding: "10px", backgroundColor: "transparent", border: "1px solid #2a2a2a", borderRadius: "8px", color: "#555555", fontSize: "12px", cursor: "pointer", fontFamily: "inherit" },
    detailEmpty: { height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "14px", textAlign: "center", padding: "40px" },
    detailEmptyText: { color: "#333333", fontSize: "13px" },
    formGroup: { display: "flex", flexDirection: "column", gap: "6px", marginBottom: "12px" },
    formLabel: { color: "#555555", fontSize: "11px", fontWeight: "600", letterSpacing: "0.5px" },
    formInput: { width: "100%", padding: "10px 12px", backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "8px", color: "#e0e0e0", fontSize: "13px", fontFamily: "inherit", boxSizing: "border-box" },
    formSelect: { width: "100%", padding: "10px 12px", backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "8px", color: "#e0e0e0", fontSize: "13px", fontFamily: "inherit", cursor: "pointer" },
    formError: { color: "#ff6b6b", fontSize: "12px", backgroundColor: "rgba(255,107,107,0.08)", border: "1px solid rgba(255,107,107,0.2)", borderRadius: "8px", padding: "10px 12px", marginBottom: "10px" },
    saveBtn: { width: "100%", padding: "12px", backgroundColor: "rgba(255,107,107,0.12)", border: "1px solid rgba(255,107,107,0.3)", borderRadius: "9px", color: "#ff6b6b", fontSize: "13px", fontWeight: "700", cursor: "pointer", fontFamily: "inherit" },
};

export default BloodDonors;