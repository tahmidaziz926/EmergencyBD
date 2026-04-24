import { useState, useEffect } from "react";
import axios from "axios";
import useAuth from "../hooks/useAuth";
import Navbar from "../components/Navbar";

const emptyForm = { title: "", organization: "", place: "", date: "", time: "", reason: "" };

const Opportunities = () => {
    const { token, role } = useAuth();
    const [opportunities, setOpportunities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [formMode, setFormMode] = useState("add");
    const [formData, setFormData] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState("");
    const [search, setSearch] = useState("");
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [myId, setMyId] = useState(null);
    const [interestLoading, setInterestLoading] = useState(false);
    const [showParticipants, setShowParticipants] = useState(false);

    useEffect(() => {
        fetchOpportunities();
        const stored = localStorage.getItem("user");
        if (stored) setMyId(JSON.parse(stored)._id);
    }, []);

    const fetchOpportunities = async () => {
        setLoading(true);
        try {
            const res = await axios.get("http://localhost:3001/api/volunteer/opportunities", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setOpportunities(res.data);
        } catch (err) {
            console.error(err);
        }
        setLoading(false);
    };

    // ── FIX 1: Normalize IDs to strings before comparing so object vs string never mismatches ──
    const normalizeId = (u) => String(u?._id || u);

    const isInterested = (opp) =>
        opp.interestedUsers?.some(u => normalizeId(u) === String(myId));

    const isApproved = (opp) =>
        opp.approvedUsers?.some(u => normalizeId(u) === String(myId));

    const isUpcoming = (date) => new Date(date) >= new Date();

    const handleInterest = async (oppId) => {
        if (interestLoading) return;
        setInterestLoading(oppId);

        const opp = opportunities.find(o => o._id === oppId);
        const wasInterested = isInterested(opp);

        // ── FIX 2: When removing interest, also strip the user from approvedUsers
        //    so the approved count updates immediately (optimistic update)
        const updateOpp = (o) => {
            if (o._id !== oppId) return o;
            if (wasInterested) {
                // Removing interest → remove from both interestedUsers AND approvedUsers
                return {
                    ...o,
                    interestedUsers: (o.interestedUsers || []).filter(u => normalizeId(u) !== String(myId)),
                    approvedUsers: (o.approvedUsers || []).filter(u => normalizeId(u) !== String(myId)),
                };
            } else {
                // Adding interest → only add to interestedUsers
                return {
                    ...o,
                    interestedUsers: [...(o.interestedUsers || []), { _id: myId }],
                };
            }
        };

        // Snapshot before update so we can revert on error
        const prevOpportunities = opportunities;
        const prevSelected = selected;

        setOpportunities(prev => prev.map(updateOpp));
        if (selected?._id === oppId) setSelected(prev => updateOpp(prev));

        try {
            await axios.put(
                `http://localhost:3001/api/volunteer/opportunities/${oppId}/interest`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
        } catch (err) {
            console.error(err);
            // ── FIX 3: Revert both lists correctly on failure ──
            setOpportunities(prevOpportunities);
            if (prevSelected?._id === oppId) setSelected(prevSelected);
        }
        setInterestLoading(null);
    };

    const handleApprove = async (oppId, userId) => {
        try {
            await axios.put(
                `http://localhost:3001/api/volunteer/opportunities/${oppId}/approve/${userId}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            await fetchOpportunities();
            if (selected?._id === oppId) {
                const res = await axios.get("http://localhost:3001/api/volunteer/opportunities", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setSelected(res.data.find(o => o._id === oppId));
            }
        } catch (err) { console.error(err); }
    };

    const handleRevoke = async (oppId, userId) => {
        try {
            await axios.put(
                `http://localhost:3001/api/volunteer/opportunities/${oppId}/revoke/${userId}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            await fetchOpportunities();
            if (selected?._id === oppId) {
                const res = await axios.get("http://localhost:3001/api/volunteer/opportunities", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setSelected(res.data.find(o => o._id === oppId));
            }
        } catch (err) { console.error(err); }
    };

    const handleSave = async () => {
        if (!formData.title || !formData.organization || !formData.place || !formData.date || !formData.time || !formData.reason) {
            setFormError("All fields are required.");
            return;
        }
        setSaving(true);
        setFormError("");
        try {
            if (formMode === "add") {
                const res = await axios.post(
                    "http://localhost:3001/api/volunteer/opportunities",
                    formData,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setOpportunities(prev => [res.data.opportunity, ...prev]);
            } else {
                const res = await axios.put(
                    `http://localhost:3001/api/volunteer/opportunities/${selected._id}`,
                    formData,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setOpportunities(prev => prev.map(o => o._id === selected._id ? res.data.opportunity : o));
                setSelected(res.data.opportunity);
            }
            setShowForm(false);
        } catch (err) {
            setFormError(err.response?.data?.message || "Something went wrong.");
        }
        setSaving(false);
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`http://localhost:3001/api/volunteer/opportunities/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setOpportunities(prev => prev.filter(o => o._id !== id));
            if (selected?._id === id) setSelected(null);
        } catch (err) { console.error(err); }
        setConfirmDelete(null);
    };

    const displayed = opportunities.filter(o =>
        (o.title || "").toLowerCase().includes(search.toLowerCase()) ||
        (o.organization || "").toLowerCase().includes(search.toLowerCase()) ||
        (o.place || "").toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return (
        <div style={s.loadingScreen}>
            <style>{"@keyframes spin{to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}"}</style>
            <div style={s.spinner}></div>
            <p style={s.loadingText}>{"Loading opportunities..."}</p>
        </div>
    );

    return (
        <div style={s.page}>
            <style>{`
                @keyframes spin { to { transform: rotate(360deg) } }
                @keyframes fadeUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:translateY(0) } }
                @keyframes slideIn { from { opacity:0; transform:translateX(24px) } to { opacity:1; transform:translateX(0) } }
                @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
                @keyframes shimmer { 0% { background-position: -200% 0 } 100% { background-position: 200% 0 } }
                @keyframes pop { 0% { transform:scale(1) } 50% { transform:scale(1.04) } 100% { transform:scale(1) } }

                .opp-card { transition: all 0.25s cubic-bezier(0.34,1.56,0.64,1) !important; position: relative; overflow: hidden; }
                .opp-card::before { content:''; position:absolute; left:0; top:0; bottom:0; width:3px; background:transparent; transition:background 0.25s ease; border-radius:0 2px 2px 0; }
                .opp-card:hover { transform:translateY(-3px) !important; box-shadow:0 16px 40px rgba(0,0,0,0.35) !important; }
                .opp-card:hover::before { background:#00ff88; }
                .opp-card.selected { border-color:rgba(0,255,136,0.4) !important; background:rgba(0,255,136,0.03) !important; box-shadow:0 8px 32px rgba(0,255,136,0.08) !important; }
                .opp-card.selected::before { background:#00ff88; }
                .opp-card.past { opacity:0.65; }
                .opp-card.past:hover { transform:none !important; box-shadow:none !important; }
                .opp-card.past::before { background:#333 !important; }

                input:focus, select:focus, textarea:focus { border-color:#00ff88 !important; outline:none !important; box-shadow:0 0 0 3px rgba(0,255,136,0.08) !important; }

                .int-btn { transition: all 0.2s cubic-bezier(0.34,1.56,0.64,1) !important; position:relative; overflow:hidden; }
                .int-btn::after { content:''; position:absolute; inset:0; background:rgba(255,255,255,0.04); opacity:0; transition:opacity 0.2s; }
                .int-btn:hover::after { opacity:1; }
                .int-btn:not(:disabled):hover { transform:translateY(-2px) scale(1.02) !important; }
                .int-btn:not(:disabled):active { transform:scale(0.97) !important; }
                .int-btn.active-interest { animation: pop 0.3s ease; }

                .form-input:focus { border-color:#00ff88 !important; outline:none !important; }
                .add-btn:hover { background:rgba(0,255,136,0.18) !important; transform:translateY(-1px); box-shadow:0 6px 20px rgba(0,255,136,0.15) !important; }
                .del-confirm-btn:hover { background:rgba(255,107,107,0.2) !important; }
                .tag-pill { display:inline-flex; align-items:center; gap:4px; padding:3px 10px; border-radius:20px; font-size:11px; font-weight:600; }
            `}</style>

            {/* Delete Confirm Modal */}
            {confirmDelete && (
                <div className="fadeIn" style={s.overlay}>
                    <div style={s.modal}>
                        <div style={s.modalIcon}>{"🗑️"}</div>
                        <h3 style={s.modalTitle}>{"Delete Opportunity?"}</h3>
                        <p style={s.modalDesc}>{"This volunteer opportunity will be permanently removed."}</p>
                        <div style={s.modalBtns}>
                            <button style={s.modalCancel} onClick={() => setConfirmDelete(null)}>{"Cancel"}</button>
                            <button className="del-confirm-btn" style={s.modalDelete} onClick={() => handleDelete(confirmDelete)}>{"Yes, Delete"}</button>
                        </div>
                    </div>
                </div>
            )}

            <Navbar />

            <div style={s.layout}>
                {/* ── LEFT PANEL ── */}
                <div style={s.leftPanel}>
                    {/* Brand header */}
                    <div style={s.brandHeader}>
                        <div style={s.brandIconWrap}>
                            <span style={{ fontSize: 22 }}>{"🤝"}</span>
                        </div>
                        <div>
                            <p style={s.brandTitle}>{"Volunteer"}</p>
                            <p style={s.brandSub}>{"Opportunities"}</p>
                        </div>
                    </div>

                    {role === "admin" && (
                        <button className="add-btn" style={s.addBtn} onClick={() => {
                            setFormMode("add"); setFormData(emptyForm); setFormError(""); setShowForm(true); setSelected(null);
                        }}>
                            <span>{"＋"}</span>
                            <span>{"Post Opportunity"}</span>
                        </button>
                    )}

                    {/* Search */}
                    <div style={s.searchWrap}>
                        <span style={s.searchIcon}>{"🔍"}</span>
                        <input
                            type="text"
                            placeholder="Search title, org, place..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={s.searchInput}
                        />
                        {search && (
                            <button onClick={() => setSearch("")} style={s.clearSearch}>{"✕"}</button>
                        )}
                    </div>

                    {/* Stats */}
                    <div style={s.statsGrid}>
                        <div style={{ ...s.statCard, borderColor: "rgba(0,255,136,0.2)" }}>
                            <span style={{ ...s.statNum, color: "#00ff88" }}>
                                {opportunities.filter(o => isUpcoming(o.date)).length}
                            </span>
                            <span style={s.statLabel}>{"Upcoming"}</span>
                        </div>
                        <div style={s.statCard}>
                            <span style={{ ...s.statNum, color: "#555" }}>
                                {opportunities.filter(o => !isUpcoming(o.date)).length}
                            </span>
                            <span style={s.statLabel}>{"Past"}</span>
                        </div>
                        <div style={{ ...s.statCard, borderColor: "rgba(107,203,255,0.2)" }}>
                            <span style={{ ...s.statNum, color: "#6bcbff" }}>
                                {opportunities.reduce((sum, o) => sum + (o.interestedUsers?.length || 0), 0)}
                            </span>
                            <span style={s.statLabel}>{"Interested"}</span>
                        </div>
                    </div>

                    {/* Filter hint */}
                    {search && (
                        <p style={s.filterHint}>
                            {displayed.length}{" of "}{opportunities.length}{" shown"}
                        </p>
                    )}
                </div>

                {/* ── MIDDLE PANEL ── */}
                <div style={s.middlePanel}>
                    {displayed.length === 0 ? (
                        <div style={s.emptyState}>
                            <div style={s.emptyIcon}>{"🤝"}</div>
                            <p style={s.emptyTitle}>{search ? "No matches found" : "No opportunities yet"}</p>
                            <p style={s.emptySubtitle}>{search ? "Try a different search term" : "Check back soon"}</p>
                        </div>
                    ) : (
                        displayed.map((opp, i) => {
                            const upcoming = isUpcoming(opp.date);
                            const myInterest = isInterested(opp);
                            const myApproval = isApproved(opp);
                            const isSelected = selected?._id === opp._id;
                            return (
                                <div
                                    key={opp._id}
                                    className={`opp-card${isSelected ? " selected" : ""}${!upcoming ? " past" : ""}`}
                                    style={{ ...s.oppCard, animationDelay: `${i * 0.05}s` }}
                                    onClick={() => { setSelected(isSelected ? null : opp); setShowForm(false); setShowParticipants(false); }}
                                >
                                    {/* Card Header Row */}
                                    <div style={s.cardHead}>
                                        <div style={s.cardHeadLeft}>
                                            <div style={{ ...s.cardAvatar, background: upcoming ? "rgba(0,255,136,0.12)" : "rgba(255,255,255,0.04)" }}>
                                                <span style={{ fontSize: 18 }}>{"🤝"}</span>
                                            </div>
                                            <div>
                                                <p style={s.cardTitle}>{opp.title}</p>
                                                <p style={s.cardOrg}>{"🏢 " + opp.organization}</p>
                                            </div>
                                        </div>
                                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                                            <span className="tag-pill" style={upcoming
                                                ? { color: "#00ff88", background: "rgba(0,255,136,0.1)", border: "1px solid rgba(0,255,136,0.2)" }
                                                : { color: "#555", background: "rgba(255,255,255,0.04)", border: "1px solid #222" }
                                            }>
                                                {upcoming ? "📅 Upcoming" : "✓ Past"}
                                            </span>
                                            {myApproval && (
                                                <span className="tag-pill" style={{ color: "#ffd93d", background: "rgba(255,217,61,0.1)", border: "1px solid rgba(255,217,61,0.2)" }}>
                                                    {"⭐ +1 pt"}
                                                </span>
                                            )}
                                            {myInterest && !myApproval && (
                                                <span className="tag-pill" style={{ color: "#00ff88", background: "rgba(0,255,136,0.08)", border: "1px solid rgba(0,255,136,0.2)" }}>
                                                    {"✋ Interested"}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Reason snippet */}
                                    <p style={s.cardReason}>
                                        {opp.reason.substring(0, 90)}{opp.reason.length > 90 ? "..." : ""}
                                    </p>

                                    {/* Meta row */}
                                    <div style={s.cardMeta}>
                                        <span style={s.metaChip}>{"📍 " + opp.place}</span>
                                        <span style={s.metaChip}>
                                            {"📅 " + new Date(opp.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                        </span>
                                        <span style={s.metaChip}>{"⏰ " + opp.time}</span>
                                        <span style={s.metaChip}>{"👥 " + (opp.interestedUsers?.length || 0)}</span>
                                    </div>

                                    {/* Past frozen banner */}
                                    {!upcoming && (
                                        <div style={s.frozenBanner}>
                                            <span style={{ fontSize: 12 }}>{"🔒"}</span>
                                            <span>{"This event has ended — no further signups"}</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                {/* ── RIGHT PANEL ── */}
                <div style={s.rightPanel}>
                    {showForm && role === "admin" ? (
                        <div style={{ animation: "slideIn 0.3s ease" }}>
                            <div style={s.detailHead}>
                                <h3 style={s.detailTitle}>{formMode === "add" ? "➕ Post Opportunity" : "✏️ Edit"}</h3>
                                <button style={s.closeBtn} onClick={() => { setShowForm(false); setFormError(""); }}>{"✕"}</button>
                            </div>

                            {[
                                { key: "title", label: "Title *", placeholder: "e.g. Flood Relief Volunteer Drive" },
                                { key: "organization", label: "Organization *", placeholder: "e.g. Red Crescent Bangladesh" },
                                { key: "place", label: "Place *", placeholder: "e.g. Sylhet District" },
                                { key: "time", label: "Time *", placeholder: "e.g. 9:00 AM – 5:00 PM" },
                            ].map(f => (
                                <div key={f.key} style={s.formGroup}>
                                    <label style={s.formLabel}>{f.label}</label>
                                    <input
                                        className="form-input"
                                        type="text"
                                        placeholder={f.placeholder}
                                        value={formData[f.key]}
                                        onChange={e => setFormData(p => ({ ...p, [f.key]: e.target.value }))}
                                        style={s.formInput}
                                    />
                                </div>
                            ))}

                            <div style={s.formGroup}>
                                <label style={s.formLabel}>{"Date *"}</label>
                                <input
                                    className="form-input"
                                    type="date"
                                    value={formData.date}
                                    onChange={e => setFormData(p => ({ ...p, date: e.target.value }))}
                                    style={{ ...s.formInput, colorScheme: "dark" }}
                                />
                            </div>

                            <div style={s.formGroup}>
                                <label style={s.formLabel}>{"Crisis / Reason *"}</label>
                                <textarea
                                    className="form-input"
                                    rows={3}
                                    placeholder="Describe the crisis or reason for volunteering..."
                                    value={formData.reason}
                                    onChange={e => setFormData(p => ({ ...p, reason: e.target.value }))}
                                    style={s.formTextarea}
                                />
                            </div>

                            {formError && <p style={s.formError}>{"⚠️ " + formError}</p>}
                            <button style={s.saveBtn} onClick={handleSave} disabled={saving}>
                                {saving ? "⏳ Saving..." : formMode === "add" ? "➕ Post Opportunity" : "💾 Save Changes"}
                            </button>
                        </div>

                    ) : selected ? (
                        <div style={{ animation: "slideIn 0.3s ease" }}>
                            {/* Detail Header */}
                            <div style={s.detailHead}>
                                <h3 style={s.detailTitle}>{"Details"}</h3>
                                <button style={s.closeBtn} onClick={() => setSelected(null)}>{"✕"}</button>
                            </div>

                            {/* Hero */}
                            <div style={s.hero}>
                                <div style={s.heroIconWrap}>
                                    <span style={{ fontSize: 26 }}>{"🤝"}</span>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={s.heroTitle}>{selected.title}</p>
                                    <p style={s.heroOrg}>{selected.organization}</p>
                                </div>
                                <span className="tag-pill" style={isUpcoming(selected.date)
                                    ? { color: "#00ff88", background: "rgba(0,255,136,0.1)", border: "1px solid rgba(0,255,136,0.25)", alignSelf: "flex-start" }
                                    : { color: "#555", background: "rgba(255,255,255,0.04)", border: "1px solid #222", alignSelf: "flex-start" }
                                }>
                                    {isUpcoming(selected.date) ? "Upcoming" : "Past"}
                                </span>
                            </div>

                            {/* Info grid */}
                            <div style={s.infoGrid}>
                                {[
                                    { icon: "📍", label: "Place", value: selected.place },
                                    { icon: "📅", label: "Date", value: new Date(selected.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) },
                                    { icon: "⏰", label: "Time", value: selected.time },
                                    { icon: "👥", label: "Interested", value: (selected.interestedUsers?.length || 0) + " people" },
                                    { icon: "⭐", label: "Approved", value: (selected.approvedUsers?.length || 0) + " people" },
                                ].map((item, i) => (
                                    <div key={i} style={s.infoRow}>
                                        <span style={s.infoRowIcon}>{item.icon}</span>
                                        <span style={s.infoLabel}>{item.label}</span>
                                        <span style={s.infoValue}>{item.value}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Reason box */}
                            <div style={s.reasonBox}>
                                <p style={s.reasonLabel}>{"📋 Crisis / Reason"}</p>
                                <p style={s.reasonText}>{selected.reason}</p>
                            </div>

                            {/* ── User: Interest Button ── */}
                            {role !== "admin" && (
                                isUpcoming(selected.date) ? (
                                    <button
                                        className={`int-btn${isInterested(selected) ? " active-interest" : ""}`}
                                        style={{
                                            ...s.intBtn,
                                            ...(isInterested(selected)
                                                ? {
                                                    background: "rgba(0,255,136,0.15)",
                                                    borderColor: "#00ff88",
                                                    color: "#00ff88",
                                                    boxShadow: "0 0 20px rgba(0,255,136,0.1)",
                                                }
                                                : {
                                                    background: "rgba(255,255,255,0.04)",
                                                    borderColor: "#333",
                                                    color: "#888",
                                                })
                                        }}
                                        onClick={() => handleInterest(selected._id)}
                                        disabled={interestLoading === selected._id}
                                    >
                                        <span style={{ fontSize: 16 }}>{isInterested(selected) ? "✋" : "🤚"}</span>
                                        <span>
                                            {interestLoading === selected._id
                                                ? "Updating..."
                                                : isInterested(selected)
                                                    ? "Interested — click to undo"
                                                    : "Mark as Interested"}
                                        </span>
                                        {isInterested(selected) && <span style={s.checkmark}>{"✓"}</span>}
                                    </button>
                                ) : (
                                    <div style={s.frozenDetail}>
                                        <span>{"🔒"}</span>
                                        <span>{"This event has ended — signups are closed"}</span>
                                    </div>
                                )
                            )}

                            {/* ── Admin: Participants ── */}
                            {role === "admin" && (
                                <>
                                    <button
                                        style={s.participantsBtn}
                                        onClick={() => setShowParticipants(prev => !prev)}
                                    >
                                        <span>{showParticipants ? "▲" : "▼"}</span>
                                        <span>{"Participants (" + (selected.interestedUsers?.length || 0) + ")"}</span>
                                    </button>

                                    {showParticipants && (
                                        <div style={s.participantsList}>
                                            {(selected.interestedUsers || []).length === 0 ? (
                                                <p style={s.noParticipants}>{"No interested users yet"}</p>
                                            ) : (
                                                (selected.interestedUsers || []).map(u => {
                                                    const uid = normalizeId(u);
                                                    const name = u.name || "User";
                                                    const approved = (selected.approvedUsers || []).some(a => normalizeId(a) === uid);
                                                    return (
                                                        <div key={uid} style={s.participantRow}>
                                                            <div style={s.participantAvatar}>
                                                                {name.charAt(0).toUpperCase()}
                                                            </div>
                                                            <span style={s.participantName}>{name}</span>
                                                            {approved ? (
                                                                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                                                    <span className="tag-pill" style={{ color: "#ffd93d", background: "rgba(255,217,61,0.1)", border: "1px solid rgba(255,217,61,0.2)", fontSize: 10 }}>{"⭐ Approved"}</span>
                                                                    <button style={s.revokeBtn} onClick={() => handleRevoke(selected._id, uid)}>{"Revoke"}</button>
                                                                </div>
                                                            ) : (
                                                                <button style={s.approveBtn} onClick={() => handleApprove(selected._id, uid)}>{"✓ Approve"}</button>
                                                            )}
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    )}

                                    <div style={s.adminBtns}>
                                        <button style={s.editBtn} onClick={() => {
                                            setFormMode("edit");
                                            setFormData({
                                                title: selected.title,
                                                organization: selected.organization,
                                                place: selected.place,
                                                date: selected.date?.split("T")[0] || "",
                                                time: selected.time,
                                                reason: selected.reason,
                                            });
                                            setFormError(""); setShowForm(true);
                                        }}>{"✏️ Edit"}</button>
                                        <button style={s.deleteBtn} onClick={() => setConfirmDelete(selected._id)}>{"🗑️ Delete"}</button>
                                    </div>
                                </>
                            )}
                        </div>

                    ) : (
                        <div style={s.detailEmpty}>
                            <div style={s.emptyDetailIcon}>{"🤝"}</div>
                            <p style={s.detailEmptyTitle}>{"Select an opportunity"}</p>
                            <p style={s.detailEmptyText}>{"Click any card to view details and sign up"}</p>
                            {role === "admin" && (
                                <button className="add-btn" style={{ ...s.addBtn, marginTop: 16 }} onClick={() => {
                                    setFormMode("add"); setFormData(emptyForm); setFormError(""); setShowForm(true);
                                }}>
                                    {"＋ Post First Opportunity"}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const s = {
    page: { backgroundColor: "#0e0e0e", minHeight: "100vh", fontFamily: "inherit" },

    loadingScreen: { backgroundColor: "#0e0e0e", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 },
    spinner: { width: 38, height: 38, border: "2px solid rgba(0,255,136,0.1)", borderTop: "2px solid #00ff88", borderRadius: "50%", animation: "spin 0.75s linear infinite" },
    loadingText: { color: "#00ff88", fontSize: 13, letterSpacing: "0.5px" },

    overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", animation: "fadeIn 0.2s ease" },
    modal: { background: "#161616", border: "1px solid #252525", borderRadius: 20, padding: "32px 28px", maxWidth: 360, width: "90%", display: "flex", flexDirection: "column", alignItems: "center", gap: 14, boxShadow: "0 40px 80px rgba(0,0,0,0.8)" },
    modalIcon: { fontSize: 36, lineHeight: 1 },
    modalTitle: { color: "#fff", fontSize: 17, fontWeight: 700, margin: 0 },
    modalDesc: { color: "#666", fontSize: 13, textAlign: "center", margin: 0, lineHeight: 1.6 },
    modalBtns: { display: "flex", gap: 10, width: "100%", marginTop: 4 },
    modalCancel: { flex: 1, padding: "11px", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 10, color: "#666", fontSize: 13, cursor: "pointer", fontFamily: "inherit" },
    modalDelete: { flex: 1, padding: "11px", background: "rgba(255,107,107,0.1)", border: "1px solid rgba(255,107,107,0.4)", borderRadius: 10, color: "#ff6b6b", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" },

    layout: { display: "flex", minHeight: "calc(100vh - 68px)" },

    leftPanel: { width: 230, minWidth: 230, background: "#0a0a0a", borderRight: "1px solid #1a1a1a", padding: "20px 14px", display: "flex", flexDirection: "column", gap: 12, overflowY: "auto" },
    brandHeader: { display: "flex", alignItems: "center", gap: 12, paddingBottom: 14, borderBottom: "1px solid #1a1a1a" },
    brandIconWrap: { width: 42, height: 42, background: "rgba(0,255,136,0.1)", border: "1px solid rgba(0,255,136,0.2)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
    brandTitle: { color: "#fff", fontSize: 16, fontWeight: 800, margin: 0, lineHeight: 1.2 },
    brandSub: { color: "#00ff88", fontSize: 12, fontWeight: 700, margin: 0, letterSpacing: "0.3px" },

    addBtn: { width: "100%", padding: "11px 14px", background: "rgba(0,255,136,0.1)", border: "1px solid rgba(0,255,136,0.25)", borderRadius: 10, color: "#00ff88", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "all 0.2s ease" },

    searchWrap: { display: "flex", alignItems: "center", gap: 8, background: "#141414", border: "1px solid #1f1f1f", borderRadius: 10, padding: "9px 12px" },
    searchIcon: { fontSize: 14, flexShrink: 0 },
    searchInput: { background: "transparent", border: "none", color: "#e0e0e0", fontSize: 12, width: "100%", outline: "none", fontFamily: "inherit" },
    clearSearch: { background: "none", border: "none", color: "#444", fontSize: 11, cursor: "pointer", padding: 0, flexShrink: 0 },

    statsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 },
    statCard: { background: "#141414", border: "1px solid #1f1f1f", borderRadius: 10, padding: "10px 6px", display: "flex", flexDirection: "column", alignItems: "center", gap: 3 },
    statNum: { fontSize: 20, fontWeight: 800, lineHeight: 1 },
    statLabel: { color: "#444", fontSize: 9, fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase" },
    filterHint: { color: "#444", fontSize: 11, textAlign: "center", margin: 0 },

    middlePanel: { flex: 1, overflowY: "auto", borderRight: "1px solid #1a1a1a" },
    emptyState: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 400, gap: 10 },
    emptyIcon: { fontSize: 44, opacity: 0.2 },
    emptyTitle: { color: "#555", fontSize: 15, fontWeight: 600, margin: 0 },
    emptySubtitle: { color: "#333", fontSize: 12, margin: 0 },

    oppCard: { padding: "16px 20px", borderBottom: "1px solid #161616", cursor: "pointer", animation: "fadeUp 0.4s ease both", background: "#0e0e0e" },
    cardHead: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 8 },
    cardHeadLeft: { display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 },
    cardAvatar: { width: 40, height: 40, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
    cardTitle: { color: "#e8e8e8", fontSize: 13, fontWeight: 700, margin: 0, lineHeight: 1.3 },
    cardOrg: { color: "#555", fontSize: 11, margin: "2px 0 0", fontWeight: 500 },
    cardReason: { color: "#777", fontSize: 12, lineHeight: 1.6, margin: "0 0 10px" },
    cardMeta: { display: "flex", gap: 6, flexWrap: "wrap" },
    metaChip: { color: "#444", fontSize: 11, background: "#141414", border: "1px solid #1f1f1f", borderRadius: 6, padding: "3px 8px" },
    frozenBanner: { marginTop: 10, display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.02)", border: "1px solid #1f1f1f", borderRadius: 7, padding: "6px 10px", color: "#444", fontSize: 11 },

    rightPanel: { width: 300, minWidth: 300, background: "#0a0a0a", padding: "20px 16px", overflowY: "auto" },
    detailHead: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
    detailTitle: { color: "#fff", fontSize: 15, fontWeight: 700, margin: 0 },
    closeBtn: { background: "#1a1a1a", border: "1px solid #222", color: "#555", width: 28, height: 28, borderRadius: "50%", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontFamily: "inherit" },

    hero: { display: "flex", alignItems: "center", gap: 12, background: "linear-gradient(135deg, rgba(0,255,136,0.06) 0%, rgba(0,255,136,0.02) 100%)", border: "1px solid rgba(0,255,136,0.12)", borderRadius: 14, padding: "14px", marginBottom: 12 },
    heroIconWrap: { width: 48, height: 48, background: "rgba(0,255,136,0.1)", border: "1px solid rgba(0,255,136,0.2)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
    heroTitle: { color: "#fff", fontSize: 14, fontWeight: 700, margin: 0, lineHeight: 1.3 },
    heroOrg: { color: "#00ff88", fontSize: 11, fontWeight: 600, margin: "3px 0 0" },

    infoGrid: { background: "#141414", border: "1px solid #1f1f1f", borderRadius: 12, overflow: "hidden", marginBottom: 12 },
    infoRow: { display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", borderBottom: "1px solid #1a1a1a" },
    infoRowIcon: { fontSize: 13, flexShrink: 0 },
    infoLabel: { color: "#444", fontSize: 11, flex: 1 },
    infoValue: { color: "#ccc", fontSize: 12, fontWeight: 500, textAlign: "right" },

    reasonBox: { background: "#141414", border: "1px solid #1f1f1f", borderRadius: 10, padding: "12px 14px", marginBottom: 12 },
    reasonLabel: { color: "#444", fontSize: 10, fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: 6 },
    reasonText: { color: "#bbb", fontSize: 12, lineHeight: 1.7, margin: 0 },

    intBtn: { width: "100%", padding: "13px 16px", border: "1px solid", borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.25s ease" },
    checkmark: { marginLeft: "auto", width: 20, height: 20, background: "rgba(0,255,136,0.2)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#00ff88" },

    frozenDetail: { display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.02)", border: "1px solid #1f1f1f", borderRadius: 10, padding: "12px 14px", color: "#444", fontSize: 12, marginBottom: 10 },

    participantsBtn: { width: "100%", padding: "10px 14px", background: "#141414", border: "1px solid #1f1f1f", borderRadius: 9, color: "#777", fontSize: 12, cursor: "pointer", fontFamily: "inherit", marginBottom: 8, display: "flex", alignItems: "center", gap: 8, fontWeight: 600 },
    participantsList: { background: "#141414", border: "1px solid #1f1f1f", borderRadius: 10, marginBottom: 10, overflow: "hidden" },
    noParticipants: { color: "#444", fontSize: 12, textAlign: "center", padding: "16px", margin: 0 },
    participantRow: { display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderBottom: "1px solid #1a1a1a" },
    participantAvatar: { width: 28, height: 28, background: "rgba(0,255,136,0.08)", border: "1px solid rgba(0,255,136,0.15)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#00ff88", fontSize: 12, fontWeight: 700, flexShrink: 0 },
    participantName: { flex: 1, color: "#ccc", fontSize: 12 },
    approveBtn: { padding: "4px 10px", background: "rgba(0,255,136,0.08)", border: "1px solid rgba(0,255,136,0.25)", borderRadius: 6, color: "#00ff88", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 },
    revokeBtn: { padding: "4px 10px", background: "transparent", border: "1px solid #252525", borderRadius: 6, color: "#555", fontSize: 11, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 },

    adminBtns: { display: "flex", gap: 8, marginTop: 10 },
    editBtn: { flex: 1, padding: "10px", background: "rgba(107,203,255,0.06)", border: "1px solid rgba(107,203,255,0.18)", borderRadius: 9, color: "#6bcbff", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
    deleteBtn: { flex: 1, padding: "10px", background: "transparent", border: "1px solid #222", borderRadius: 9, color: "#444", fontSize: 12, cursor: "pointer", fontFamily: "inherit" },

    detailEmpty: { height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, textAlign: "center", padding: 40, minHeight: 400 },
    emptyDetailIcon: { fontSize: 42, opacity: 0.15 },
    detailEmptyTitle: { color: "#555", fontSize: 14, fontWeight: 600, margin: 0 },
    detailEmptyText: { color: "#333", fontSize: 12, margin: 0, lineHeight: 1.6 },

    formGroup: { display: "flex", flexDirection: "column", gap: 5, marginBottom: 10 },
    formLabel: { color: "#555", fontSize: 10, fontWeight: 700, letterSpacing: "0.6px", textTransform: "uppercase" },
    formInput: { width: "100%", padding: "10px 12px", background: "#141414", border: "1px solid #222", borderRadius: 9, color: "#e0e0e0", fontSize: 13, fontFamily: "inherit", boxSizing: "border-box", transition: "all 0.2s" },
    formTextarea: { width: "100%", padding: "10px 12px", background: "#141414", border: "1px solid #222", borderRadius: 9, color: "#e0e0e0", fontSize: 13, fontFamily: "inherit", resize: "vertical", boxSizing: "border-box", transition: "all 0.2s" },
    formError: { color: "#ff6b6b", fontSize: 12, background: "rgba(255,107,107,0.07)", border: "1px solid rgba(255,107,107,0.2)", borderRadius: 8, padding: "10px 12px", marginBottom: 10 },
    saveBtn: { width: "100%", padding: "12px", background: "rgba(0,255,136,0.1)", border: "1px solid rgba(0,255,136,0.3)", borderRadius: 10, color: "#00ff88", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" },
};

export default Opportunities;