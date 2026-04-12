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

const emptyForm = { name: "", number: "", type: "police", area: "", notes: "" };

const AdminContacts = () => {
    const { token } = useAuth();
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedContact, setSelectedContact] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [formMode, setFormMode] = useState("add"); // "add" | "edit"
    const [formData, setFormData] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [search, setSearch] = useState("");
    const [filterType, setFilterType] = useState("all");
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [formError, setFormError] = useState("");

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

    const handleOpenAdd = () => {
        setFormMode("add");
        setFormData(emptyForm);
        setFormError("");
        setShowForm(true);
        setSelectedContact(null);
    };

    const handleOpenEdit = (contact) => {
        setFormMode("edit");
        setFormData({
            name: contact.name,
            number: contact.number,
            type: contact.type,
            area: contact.area,
            notes: contact.notes || "",
        });
        setFormError("");
        setShowForm(true);
    };

    const handleSave = async () => {
        if (!formData.name.trim() || !formData.number.trim() || !formData.area.trim()) {
            setFormError("Name, number and area are required.");
            return;
        }
        setSaving(true);
        setFormError("");
        try {
            if (formMode === "add") {
                const res = await axios.post(
                    "http://localhost:3001/api/admin/contacts",
                    formData,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setContacts(prev => [res.data.contact, ...prev]);
            } else {
                const res = await axios.put(
                    `http://localhost:3001/api/admin/contacts/${selectedContact._id}`,
                    formData,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setContacts(prev =>
                    prev.map(c => c._id === selectedContact._id ? res.data.contact : c)
                );
                setSelectedContact(res.data.contact);
            }
            setShowForm(false);
            setFormData(emptyForm);
        } catch (err) {
            setFormError("Something went wrong. Please try again.");
            console.error("Save failed:", err);
        }
        setSaving(false);
    };

    const handleDelete = async (contactId) => {
        setDeleting(true);
        try {
            await axios.delete(
                `http://localhost:3001/api/admin/contacts/${contactId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setContacts(prev => prev.filter(c => c._id !== contactId));
            if (selectedContact?._id === contactId) setSelectedContact(null);
        } catch (err) {
            console.error("Delete failed:", err);
        }
        setDeleting(false);
        setConfirmDelete(null);
    };

    const displayed = contacts.filter(c => {
        const matchType = filterType === "all" || c.type === filterType;
        const matchSearch =
            (c.name || "").toLowerCase().includes(search.toLowerCase()) ||
            (c.area || "").toLowerCase().includes(search.toLowerCase()) ||
            (c.number || "").toLowerCase().includes(search.toLowerCase());
        return matchType && matchSearch;
    });

    if (loading) return (
        <div style={styles.loadingScreen}>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <div style={styles.spinner}></div>
            <p style={styles.loadingText}>{"Loading contacts..."}</p>
        </div>
    );

    return (
        <div style={styles.page}>
            <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .contact-card { transition: all 0.3s ease !important; }
        .contact-card:hover { transform: translateY(-2px) !important; border-color: rgba(0,255,136,0.2) !important; box-shadow: 0 12px 30px rgba(0,0,0,0.3) !important; }
        .contact-card.selected { border-color: #00ff88 !important; background: rgba(0,255,136,0.04) !important; }
        .filter-btn { transition: all 0.2s ease !important; }
        .filter-btn:hover { color: #00ff88 !important; }
        .add-btn:hover { background: rgba(0,255,136,0.2) !important; }
        .edit-btn:hover { background: rgba(107,203,255,0.15) !important; }
        .delete-btn:hover { background: rgba(255,107,107,0.15) !important; border-color: #ff6b6b !important; color: #ff6b6b !important; }
        .save-btn:hover { background: rgba(0,255,136,0.25) !important; }
        input:focus, select:focus, textarea:focus { border-color: #00ff88 !important; outline: none !important; }
        .confirm-overlay { animation: fadeIn 0.2s ease !important; }
      `}</style>

            {/* ── Delete Confirm Modal ── */}
            {confirmDelete && (
                <div className="confirm-overlay" style={styles.overlay}>
                    <div style={styles.modal}>
                        <div style={{ fontSize: "40px" }}>{"🗑️"}</div>
                        <h3 style={styles.modalTitle}>{"Delete Contact?"}</h3>
                        <p style={styles.modalDesc}>
                            {"This will permanently delete "}
                            <span style={{ color: "#e0e0e0", fontWeight: "700" }}>
                                {confirmDelete.name}
                            </span>
                            {". This cannot be undone."}
                        </p>
                        <div style={styles.modalBtns}>
                            <button
                                style={styles.modalCancel}
                                onClick={() => setConfirmDelete(null)}
                            >{"Cancel"}</button>
                            <button
                                style={styles.modalDelete}
                                onClick={() => handleDelete(confirmDelete._id)}
                                disabled={deleting}
                            >
                                {deleting ? "⏳ Deleting..." : "🗑️ Delete"}
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
                        <h2 style={styles.leftTitle}>{"Contacts"}</h2>
                        <p style={styles.leftSubtitle}>{contacts.length}{" total"}</p>
                    </div>

                    <button
                        className="add-btn"
                        style={styles.addBtn}
                        onClick={handleOpenAdd}
                    >
                        {"＋ Add New Contact"}
                    </button>

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
                            style={{
                                ...styles.filterBtn,
                                ...(filterType === "all" ? styles.filterActive : {}),
                            }}
                            onClick={() => setFilterType("all")}
                        >
                            <span>{"🗂 All"}</span>
                            <span style={styles.filterCount}>{contacts.length}</span>
                        </button>
                        {Object.entries(typeConfig).map(([key, val]) => (
                            <button
                                key={key}
                                className="filter-btn"
                                style={{
                                    ...styles.filterBtn,
                                    ...(filterType === key ? styles.filterActive : {}),
                                }}
                                onClick={() => setFilterType(key)}
                            >
                                <span>{val.icon + " " + val.label}</span>
                                <span style={styles.filterCount}>
                                    {contacts.filter(c => c.type === key).length}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── MIDDLE PANEL ── */}
                <div style={styles.middlePanel}>
                    {displayed.length === 0 ? (
                        <div style={styles.emptyState}>
                            <div style={{ fontSize: "48px", opacity: 0.3 }}>{"📞"}</div>
                            <p style={{ color: "#555555", fontSize: "15px" }}>{"No contacts found"}</p>
                            <button style={styles.emptyAddBtn} onClick={handleOpenAdd}>
                                {"＋ Add First Contact"}
                            </button>
                        </div>
                    ) : (
                        displayed.map((contact, i) => {
                            const tc = typeConfig[contact.type] || typeConfig.other;
                            return (
                                <div
                                    key={contact._id}
                                    className={"contact-card" + (selectedContact?._id === contact._id ? " selected" : "")}
                                    style={{ ...styles.contactCard, animationDelay: `${i * 0.04}s` }}
                                    onClick={() => {
                                        setSelectedContact(selectedContact?._id === contact._id ? null : contact);
                                        setShowForm(false);
                                    }}
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
                                                <p style={{ ...styles.cardType, color: tc.color }}>{tc.label}</p>
                                            </div>
                                        </div>
                                        <div style={styles.cardRight}>
                                            <p style={styles.cardNumber}>{contact.number}</p>
                                        </div>
                                    </div>
                                    <div style={styles.cardMeta}>
                                        <span style={styles.cardMetaItem}>{"📍 " + contact.area}</span>
                                        {contact.notes && (
                                            <span style={styles.cardMetaItem}>{"📝 " + contact.notes.substring(0, 40) + (contact.notes.length > 40 ? "..." : "")}</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* ── RIGHT PANEL ── */}
                <div style={styles.rightPanel}>

                    {/* ── ADD / EDIT FORM ── */}
                    {showForm ? (
                        <div style={{ animation: "slideIn 0.3s ease" }}>
                            <div style={styles.detailHeader}>
                                <h3 style={styles.detailTitle}>
                                    {formMode === "add" ? "➕ Add Contact" : "✏️ Edit Contact"}
                                </h3>
                                <button
                                    style={styles.closeBtn}
                                    onClick={() => { setShowForm(false); setFormError(""); }}
                                >{"✕"}</button>
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.formLabel}>{"Name *"}</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Dhaka Metropolitan Police"
                                    value={formData.name}
                                    onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                                    style={styles.formInput}
                                />
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.formLabel}>{"Phone Number *"}</label>
                                <input
                                    type="text"
                                    placeholder="e.g. 999 or 01700-000000"
                                    value={formData.number}
                                    onChange={e => setFormData(p => ({ ...p, number: e.target.value }))}
                                    style={styles.formInput}
                                />
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.formLabel}>{"Type *"}</label>
                                <select
                                    value={formData.type}
                                    onChange={e => setFormData(p => ({ ...p, type: e.target.value }))}
                                    style={styles.formSelect}
                                >
                                    {Object.entries(typeConfig).map(([key, val]) => (
                                        <option key={key} value={key}>{val.icon + " " + val.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.formLabel}>{"Area *"}</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Dhaka, Mirpur, Chittagong..."
                                    value={formData.area}
                                    onChange={e => setFormData(p => ({ ...p, area: e.target.value }))}
                                    style={styles.formInput}
                                />
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.formLabel}>{"Notes (optional)"}</label>
                                <textarea
                                    placeholder="Any additional info..."
                                    value={formData.notes}
                                    onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
                                    style={styles.formTextarea}
                                    rows={3}
                                />
                            </div>

                            {formError && (
                                <p style={styles.formError}>{"⚠️ " + formError}</p>
                            )}

                            <button
                                className="save-btn"
                                style={styles.saveBtn}
                                onClick={handleSave}
                                disabled={saving}
                            >
                                {saving
                                    ? "⏳ Saving..."
                                    : formMode === "add" ? "➕ Add Contact" : "💾 Save Changes"}
                            </button>
                        </div>

                    ) : selectedContact ? (
                        /* ── CONTACT DETAIL ── */
                        <div style={{ animation: "slideIn 0.3s ease" }}>
                            <div style={styles.detailHeader}>
                                <h3 style={styles.detailTitle}>{"Contact Details"}</h3>
                                <button style={styles.closeBtn} onClick={() => setSelectedContact(null)}>{"✕"}</button>
                            </div>

                            <div style={{
                                ...styles.contactHero,
                                backgroundColor: (typeConfig[selectedContact.type]?.color || "#888") + "10",
                                border: "1px solid " + (typeConfig[selectedContact.type]?.color || "#888") + "25",
                            }}>
                                <div style={{ fontSize: "36px" }}>
                                    {typeConfig[selectedContact.type]?.icon}
                                </div>
                                <div>
                                    <p style={styles.heroName}>{selectedContact.name}</p>
                                    <p style={{
                                        color: typeConfig[selectedContact.type]?.color,
                                        fontSize: "12px", fontWeight: "600",
                                    }}>
                                        {typeConfig[selectedContact.type]?.label}
                                    </p>
                                </div>
                            </div>

                            <div style={styles.numberCard}>
                                <p style={styles.numberLabel}>{"📞 Phone Number"}</p>
                                <p style={styles.numberValue}>{selectedContact.number}</p>
                            </div>

                            <div style={styles.infoBox}>
                                {[
                                    { label: "Area", value: selectedContact.area },
                                    { label: "Type", value: typeConfig[selectedContact.type]?.label },
                                    {
                                        label: "Added",
                                        value: new Date(selectedContact.createdAt).toLocaleDateString("en-US", {
                                            year: "numeric", month: "long", day: "numeric",
                                        }),
                                    },
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

                            <div style={styles.actionBtns}>
                                <button
                                    className="edit-btn"
                                    style={styles.editBtn}
                                    onClick={() => handleOpenEdit(selectedContact)}
                                >
                                    {"✏️ Edit Contact"}
                                </button>
                                <button
                                    className="delete-btn"
                                    style={styles.deleteBtn}
                                    onClick={() => setConfirmDelete(selectedContact)}
                                >
                                    {"🗑️ Delete"}
                                </button>
                            </div>
                        </div>

                    ) : (
                        <div style={styles.detailEmpty}>
                            <div style={{ fontSize: "36px", opacity: 0.3 }}>{"👆"}</div>
                            <p style={styles.detailEmptyText}>{"Click a contact to view details"}</p>
                            <button style={styles.emptyAddBtn} onClick={handleOpenAdd}>
                                {"＋ Add New Contact"}
                            </button>
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
    modalTitle: { color: "#ffffff", fontSize: "18px", fontWeight: "700", textAlign: "center" },
    modalDesc: { color: "#666666", fontSize: "13px", textAlign: "center", lineHeight: "1.6" },
    modalBtns: { display: "flex", gap: "12px", width: "100%", marginTop: "8px" },
    modalCancel: {
        flex: 1, padding: "12px",
        backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a",
        borderRadius: "10px", color: "#666666",
        fontSize: "14px", cursor: "pointer", fontFamily: "inherit",
    },
    modalDelete: {
        flex: 1, padding: "12px",
        backgroundColor: "rgba(255,107,107,0.12)",
        border: "1px solid #ff6b6b",
        borderRadius: "10px", color: "#ff6b6b",
        fontSize: "14px", fontWeight: "700",
        cursor: "pointer", fontFamily: "inherit",
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
    addBtn: {
        width: "100%", padding: "11px",
        backgroundColor: "rgba(0,255,136,0.1)",
        border: "1px solid rgba(0,255,136,0.3)",
        borderRadius: "9px", color: "#00ff88",
        fontSize: "13px", fontWeight: "700",
        cursor: "pointer", fontFamily: "inherit",
    },
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
    middlePanel: { flex: 1, overflowY: "auto", borderRight: "1px solid #1e1e1e" },
    emptyState: {
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        height: "100%", gap: "16px", padding: "60px",
    },
    emptyAddBtn: {
        padding: "10px 20px",
        backgroundColor: "rgba(0,255,136,0.1)",
        border: "1px solid rgba(0,255,136,0.3)",
        borderRadius: "9px", color: "#00ff88",
        fontSize: "13px", fontWeight: "700",
        cursor: "pointer", fontFamily: "inherit",
    },
    contactCard: {
        padding: "18px 24px", borderBottom: "1px solid #1a1a1a",
        cursor: "pointer", animation: "fadeUp 0.4s ease both",
        border: "1px solid transparent", borderBottomColor: "#1a1a1a",
    },
    cardTop: {
        display: "flex", justifyContent: "space-between",
        alignItems: "center", marginBottom: "10px",
    },
    cardLeft: { display: "flex", alignItems: "center", gap: "12px" },
    cardIconBox: {
        width: "40px", height: "40px", borderRadius: "10px",
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px",
    },
    cardName: { color: "#e0e0e0", fontSize: "14px", fontWeight: "600" },
    cardType: { fontSize: "11px", fontWeight: "600", marginTop: "2px" },
    cardRight: { textAlign: "right" },
    cardNumber: { color: "#00ff88", fontSize: "13px", fontWeight: "700", fontFamily: "monospace" },
    cardMeta: { display: "flex", flexDirection: "column", gap: "4px" },
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
    formGroup: { display: "flex", flexDirection: "column", gap: "6px", marginBottom: "14px" },
    formLabel: { color: "#555555", fontSize: "11px", fontWeight: "600", letterSpacing: "0.5px" },
    formInput: {
        width: "100%", padding: "10px 12px",
        backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a",
        borderRadius: "8px", color: "#e0e0e0",
        fontSize: "13px", fontFamily: "inherit", boxSizing: "border-box",
    },
    formSelect: {
        width: "100%", padding: "10px 12px",
        backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a",
        borderRadius: "8px", color: "#e0e0e0",
        fontSize: "13px", fontFamily: "inherit", cursor: "pointer",
    },
    formTextarea: {
        width: "100%", padding: "10px 12px",
        backgroundColor: "#1a1a1a", border: "1px solid #2a2a2a",
        borderRadius: "8px", color: "#e0e0e0",
        fontSize: "13px", fontFamily: "inherit",
        resize: "vertical", boxSizing: "border-box",
    },
    formError: {
        color: "#ff6b6b", fontSize: "12px",
        backgroundColor: "rgba(255,107,107,0.08)",
        border: "1px solid rgba(255,107,107,0.2)",
        borderRadius: "8px", padding: "10px 12px", marginBottom: "12px",
    },
    saveBtn: {
        width: "100%", padding: "12px",
        backgroundColor: "rgba(0,255,136,0.12)",
        border: "1px solid rgba(0,255,136,0.3)",
        borderRadius: "9px", color: "#00ff88",
        fontSize: "13px", fontWeight: "700",
        cursor: "pointer", fontFamily: "inherit",
    },
    contactHero: {
        display: "flex", alignItems: "center", gap: "14px",
        borderRadius: "12px", padding: "16px", marginBottom: "16px",
    },
    heroName: { color: "#ffffff", fontSize: "15px", fontWeight: "700" },
    numberCard: {
        backgroundColor: "rgba(0,255,136,0.05)",
        border: "1px solid rgba(0,255,136,0.15)",
        borderRadius: "12px", padding: "16px",
        marginBottom: "16px", textAlign: "center",
    },
    numberLabel: { color: "#444444", fontSize: "11px", marginBottom: "8px" },
    numberValue: { color: "#00ff88", fontSize: "22px", fontWeight: "800", fontFamily: "monospace" },
    infoBox: {
        backgroundColor: "#1a1a1a", border: "1px solid #222222",
        borderRadius: "12px", padding: "16px",
        display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px",
    },
    infoRow: { display: "flex", justifyContent: "space-between" },
    infoLabel: { color: "#444444", fontSize: "12px" },
    infoValue: { color: "#e0e0e0", fontSize: "12px", fontWeight: "500" },
    notesBox: { borderTop: "1px solid #222222", paddingTop: "10px" },
    notesText: { color: "#aaaaaa", fontSize: "12px", lineHeight: "1.6", marginTop: "6px" },
    actionBtns: { display: "flex", flexDirection: "column", gap: "8px" },
    editBtn: {
        width: "100%", padding: "11px",
        backgroundColor: "rgba(107,203,255,0.08)",
        border: "1px solid rgba(107,203,255,0.2)",
        borderRadius: "9px", color: "#6bcbff",
        fontSize: "13px", fontWeight: "600",
        cursor: "pointer", fontFamily: "inherit",
    },
    deleteBtn: {
        width: "100%", padding: "11px",
        backgroundColor: "transparent",
        border: "1px solid #2a2a2a",
        borderRadius: "9px", color: "#555555",
        fontSize: "13px", fontWeight: "600",
        cursor: "pointer", fontFamily: "inherit",
    },
    detailEmpty: {
        height: "100%", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        gap: "16px", textAlign: "center", padding: "40px",
    },
    detailEmptyText: { color: "#333333", fontSize: "13px" },
};

export default AdminContacts;
