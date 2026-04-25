import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import useAuth from "../../hooks/useAuth";
import Navbar from "../../components/Navbar";
import LocationPicker from "../../components/LocationPicker";

const QUOTA_LIMIT = 5;

const emergencyTypes = [
  { value: "robbery",    label: "Robbery",    icon: "🔫", color: "#ff6b6b", description: "Armed or unarmed theft" },
  { value: "fire",       label: "Fire",       icon: "🔥", color: "#ff9f43", description: "Fire or explosion incident" },
  { value: "accident",   label: "Accident",   icon: "🚗", color: "#ffd93d", description: "Vehicle or road accident" },
  { value: "harassment", label: "Harassment", icon: "⚠️", color: "#a29bfe", description: "Verbal or physical harassment" },
  { value: "medical",    label: "Medical",    icon: "🏥", color: "#00ff88", description: "Medical emergency" },
];

// ── Quota tracker component ────────────────────────────────────────────────────
const QuotaTracker = ({ quota, compact = false }) => {
  if (!quota) return null;

  const pct = Math.min(100, (quota.used / quota.limit) * 100);
  const barColor = pct >= 100 ? "#ff6b6b" : pct >= 80 ? "#ffaa00" : "#00ff88";
  const remaining = quota.limit - quota.used;

  if (compact) {
    return (
      <div style={qt.compact}>
        <div style={qt.compactTop}>
          <span style={qt.compactLabel}>{"Monthly Quota"}</span>
          <span style={{ ...qt.compactCount, color: barColor }}>
            {quota.used}/{quota.limit}
          </span>
        </div>
        <div style={qt.barTrack}>
          <div style={{ ...qt.barFill, width: `${pct}%`, backgroundColor: barColor }} />
        </div>
        {quota.exceeded && (
          <p style={qt.compactWarning}>
            {"Resets in " + quota.daysUntilReset + " day" + (quota.daysUntilReset !== 1 ? "s" : "")}
          </p>
        )}
      </div>
    );
  }

  return (
    <div style={{
      ...qt.box,
      borderColor: quota.exceeded ? "rgba(255,107,107,0.3)" : "rgba(0,255,136,0.15)",
      backgroundColor: quota.exceeded ? "rgba(255,107,107,0.05)" : "rgba(0,255,136,0.03)",
    }}>
      <div style={qt.header}>
        <div style={qt.headerLeft}>
          <span style={{ fontSize: 18 }}>{quota.exceeded ? "🚫" : "📊"}</span>
          <div>
            <p style={qt.title}>{"Monthly Report Quota"}</p>
            <p style={qt.subtitle}>{quota.month + " " + quota.year}</p>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ ...qt.bigNum, color: barColor }}>{quota.used}</p>
          <p style={qt.bigDenom}>{"/ " + quota.limit}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div style={qt.barTrack}>
        <div style={{ ...qt.barFill, width: `${pct}%`, backgroundColor: barColor, transition: "width 0.6s ease" }} />
      </div>

      {/* Slot indicators */}
      <div style={qt.slots}>
        {Array.from({ length: quota.limit }).map((_, i) => (
          <div
            key={i}
            style={{
              ...qt.slot,
              backgroundColor: i < quota.used ? barColor : "rgba(255,255,255,0.06)",
              border: `1px solid ${i < quota.used ? barColor + "60" : "#2a2a2a"}`,
            }}
          />
        ))}
      </div>

      {/* Status message */}
      {quota.exceeded ? (
        <div style={qt.exceededMsg}>
          <p style={qt.exceededTitle}>{"⛔ Quota Reached"}</p>
          <p style={qt.exceededSub}>
            {"You have used all " + quota.limit + " reports for " + quota.month + ". "}
            {"Your quota resets in " + quota.daysUntilReset + " day" + (quota.daysUntilReset !== 1 ? "s" : "") + "."}
          </p>
        </div>
      ) : remaining === 1 ? (
        <div style={qt.warningMsg}>
          <p style={qt.warningText}>{"⚠️ Only 1 report remaining this month — use it wisely."}</p>
        </div>
      ) : (
        <p style={qt.okMsg}>
          {"✅ " + remaining + " report" + (remaining !== 1 ? "s" : "") + " remaining this month"}
        </p>
      )}

      <p style={qt.resetNote}>
        {"Resets on 1 " + new Date(quota.resetDate).toLocaleString("en-US", { month: "long" }) + " " + new Date(quota.resetDate).getFullYear()}
      </p>
    </div>
  );
};

const qt = {
  box: { border: "1px solid", borderRadius: 14, padding: "18px", display: "flex", flexDirection: "column", gap: 12 },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  headerLeft: { display: "flex", alignItems: "center", gap: 10 },
  title: { color: "#e0e0e0", fontSize: 13, fontWeight: 700, margin: 0 },
  subtitle: { color: "#555", fontSize: 11, margin: "2px 0 0" },
  bigNum: { fontSize: 28, fontWeight: 800, margin: 0, lineHeight: 1 },
  bigDenom: { color: "#444", fontSize: 12, margin: "2px 0 0", textAlign: "right" },
  barTrack: { height: 6, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 10, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 10 },
  slots: { display: "flex", gap: 6 },
  slot: { flex: 1, height: 8, borderRadius: 4 },
  exceededMsg: { backgroundColor: "rgba(255,107,107,0.08)", border: "1px solid rgba(255,107,107,0.2)", borderRadius: 10, padding: "12px 14px" },
  exceededTitle: { color: "#ff6b6b", fontSize: 13, fontWeight: 700, margin: "0 0 4px" },
  exceededSub: { color: "#888", fontSize: 12, margin: 0, lineHeight: 1.5 },
  warningMsg: { backgroundColor: "rgba(255,170,0,0.08)", border: "1px solid rgba(255,170,0,0.2)", borderRadius: 10, padding: "10px 14px" },
  warningText: { color: "#ffaa00", fontSize: 12, margin: 0 },
  okMsg: { color: "#00ff88", fontSize: 12, fontWeight: 600 },
  resetNote: { color: "#333", fontSize: 10, margin: 0 },
  compact: { backgroundColor: "#1a1a1a", border: "1px solid #222", borderRadius: 10, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 },
  compactTop: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  compactLabel: { color: "#555", fontSize: 11, fontWeight: 600 },
  compactCount: { fontSize: 13, fontWeight: 800 },
  compactWarning: { color: "#ff6b6b", fontSize: 10, margin: 0 },
};

// ── Main component ─────────────────────────────────────────────────────────────
const EmergencyForm = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [location, setLocation] = useState({ lat: null, lng: null, area: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [step, setStep] = useState(1);
  const [quota, setQuota] = useState(null);
  const [quotaLoading, setQuotaLoading] = useState(true);

  // Fetch quota on mount
  useEffect(() => {
    const fetchQuota = async () => {
      setQuotaLoading(true);
      try {
        const res = await axios.get("http://localhost:3001/api/emergency/quota", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setQuota(res.data);
      } catch (err) {
        console.error("Failed to fetch quota:", err);
      }
      setQuotaLoading(false);
    };
    fetchQuota();
  }, [token]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (quota?.exceeded) {
      setError(`Monthly quota reached (${quota.used}/${quota.limit}). Resets in ${quota.daysUntilReset} days.`);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("emergencyType", selectedType);
      formData.append("description", description);
      if (image) formData.append("image", image);
      if (location.lat) formData.append("lat", location.lat);
      if (location.lng) formData.append("lng", location.lng);
      if (location.area) formData.append("area", location.area);

      const res = await axios.post("http://localhost:3001/api/emergency/report", formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });

      // Update quota from response
      if (res.data.quota) setQuota(prev => ({ ...prev, ...res.data.quota }));

      setMessage("Emergency report submitted successfully!");
      setTimeout(() => navigate("/user/emergency/list"), 2000);
    } catch (err) {
      if (err.response?.data?.quotaExceeded) {
        setQuota(prev => ({ ...prev, exceeded: true, used: err.response.data.used }));
        setError(err.response.data.message);
      } else {
        setError(err.response?.data?.message || "Submission failed");
      }
    }
    setLoading(false);
  };

  const selectedTypeData = emergencyTypes.find(t => t.value === selectedType);
  const isBlocked = quota?.exceeded;

  return (
    <div style={styles.page}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes slideIn { from{opacity:0;transform:translateX(-20px)}to{opacity:1;transform:translateX(0)} }
        @keyframes pulseRed { 0%,100%{box-shadow:0 0 0 0 rgba(255,107,107,0.3)}50%{box-shadow:0 0 0 8px rgba(255,107,107,0)} }

        .type-card { transition:all 0.3s ease !important; cursor:pointer; }
        .type-card:hover { transform:translateY(-4px) !important; box-shadow:0 12px 30px rgba(0,0,0,0.3) !important; }
        .type-card.blocked { opacity:0.4 !important; pointer-events:none !important; }
        .submit-btn { transition:all 0.3s ease !important; }
        .submit-btn:hover:not(:disabled) { transform:translateY(-2px) !important; box-shadow:0 10px 30px rgba(0,255,136,0.4) !important; }
        .submit-btn:disabled { opacity:0.5 !important; cursor:not-allowed !important; }
        .next-btn { transition:all 0.3s ease !important; }
        .next-btn:hover { transform:translateY(-2px) !important; }
        .back-btn:hover { background:rgba(255,255,255,0.05) !important; color:#fff !important; }
        .upload-area:hover { border-color:#00ff88 !important; background:rgba(0,255,136,0.04) !important; }
        textarea:focus { border-color:#00ff88 !important; box-shadow:0 0 0 3px rgba(0,255,136,0.1) !important; outline:none !important; }
      `}</style>

      <Navbar />
      <div style={styles.layout}>

        {/* ── LEFT PANEL ── */}
        <div style={styles.leftPanel}>
          <div style={styles.leftContent}>
            <div style={styles.leftHeader}>
              <div style={styles.alertIcon}>{"🚨"}</div>
              <h2 style={styles.leftTitle}>{"Emergency Report"}</h2>
              <p style={styles.leftSubtitle}>{"Report any emergency in your area quickly and securely"}</p>
            </div>

            {/* Step Indicator */}
            <div style={styles.stepsContainer}>
              {[
                { num: 1, label: "Select Type" },
                { num: 2, label: "Add Details" },
                { num: 3, label: "Submit" },
              ].map((s) => (
                <div key={s.num} style={styles.stepItem}>
                  <div style={{
                    ...styles.stepCircle,
                    ...(step >= s.num ? styles.stepActive : {}),
                    ...(step > s.num ? styles.stepDone : {}),
                  }}>
                    {step > s.num ? "✓" : s.num}
                  </div>
                  <span style={{ ...styles.stepLabel, ...(step >= s.num ? styles.stepLabelActive : {}) }}>
                    {s.label}
                  </span>
                  {s.num < 3 && (
                    <div style={{ ...styles.stepLine, ...(step > s.num ? styles.stepLineDone : {}) }} />
                  )}
                </div>
              ))}
            </div>

            {/* ── QUOTA TRACKER ── */}
            {quotaLoading ? (
              <div style={{ textAlign: "center", padding: "16px" }}>
                <div style={styles.miniSpinner} />
              </div>
            ) : (
              <QuotaTracker quota={quota} />
            )}

            {/* Tips */}
            <div style={styles.tipsBox}>
              <h4 style={styles.tipsTitle}>{"📌 Quick Tips"}</h4>
              {[
                "Enable GPS for accurate location",
                "Add an image if possible",
                "Describe the situation clearly",
                "Stay safe while reporting",
              ].map((tip, i) => (
                <div key={i} style={styles.tipItem}>
                  <span style={styles.tipDot}>{"●"}</span>
                  <span style={styles.tipText}>{tip}</span>
                </div>
              ))}
            </div>

            {selectedTypeData && (
              <div style={{
                ...styles.selectedPreview,
                borderColor: selectedTypeData.color + "40",
                backgroundColor: selectedTypeData.color + "08",
              }}>
                <span style={styles.selectedIcon}>{selectedTypeData.icon}</span>
                <div>
                  <p style={{ ...styles.selectedLabel, color: selectedTypeData.color }}>{selectedTypeData.label}</p>
                  <p style={styles.selectedDesc}>{selectedTypeData.description}</p>
                </div>
              </div>
            )}

            {location.area && (
              <div style={styles.locationPreview}>
                <span style={styles.locationPreviewIcon}>{"📍"}</span>
                <div>
                  <p style={styles.locationPreviewLabel}>{"Location Set"}</p>
                  <p style={styles.locationPreviewValue}>{location.area}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div style={styles.rightPanel}>

          {/* Quota exceeded banner */}
          {isBlocked && (
            <div style={styles.quotaBanner}>
              <div style={styles.quotaBannerIcon}>{"🚫"}</div>
              <div>
                <p style={styles.quotaBannerTitle}>{"Monthly Quota Reached"}</p>
                <p style={styles.quotaBannerSub}>
                  {"You have used all " + quota.limit + " reports for " + quota.month + ". "}
                  {"Come back in " + quota.daysUntilReset + " day" + (quota.daysUntilReset !== 1 ? "s" : "") + " when your quota resets."}
                </p>
              </div>
            </div>
          )}

          {message && <div style={styles.successMsg}>{"✅ " + message}</div>}
          {error && <div style={styles.errorMsg}>{"❌ " + error}</div>}

          <form onSubmit={handleSubmit} style={{ ...styles.form, opacity: isBlocked ? 0.5 : 1, pointerEvents: isBlocked ? "none" : "auto" }}>

            {/* STEP 1 */}
            {step === 1 && (
              <div style={{ animation: "slideIn 0.3s ease" }}>
                <h3 style={styles.stepTitle}>{"Step 1 — Select Emergency Type"}</h3>
                <p style={styles.stepSubtitle}>{"What kind of emergency are you reporting?"}</p>

                <div style={styles.typeGrid}>
                  {emergencyTypes.map((type) => (
                    <div
                      key={type.value}
                      className={"type-card" + (isBlocked ? " blocked" : "")}
                      style={{
                        ...styles.typeCard,
                        ...(selectedType === type.value ? {
                          borderColor: type.color,
                          backgroundColor: type.color + "10",
                          boxShadow: `0 0 20px ${type.color}20`,
                        } : {}),
                      }}
                      onClick={() => !isBlocked && setSelectedType(type.value)}
                    >
                      <div style={{ ...styles.typeIconBox, backgroundColor: type.color + "15", border: `1px solid ${type.color}30` }}>
                        <span style={styles.typeIcon}>{type.icon}</span>
                      </div>
                      <p style={{ ...styles.typeLabel, color: selectedType === type.value ? type.color : "#e0e0e0" }}>
                        {type.label}
                      </p>
                      <p style={styles.typeDesc}>{type.description}</p>
                      {selectedType === type.value && (
                        <div style={{ ...styles.typeCheck, backgroundColor: type.color }}>{"✓"}</div>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  className="next-btn"
                  style={{ ...styles.nextBtn, opacity: selectedType && !isBlocked ? 1 : 0.4 }}
                  onClick={() => selectedType && !isBlocked && setStep(2)}
                >
                  {"Continue →"}
                </button>
              </div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <div style={{ animation: "slideIn 0.3s ease" }}>
                <h3 style={styles.stepTitle}>{"Step 2 — Add Details & Location"}</h3>
                <p style={styles.stepSubtitle}>{"Describe the emergency and set your location"}</p>

                <div style={styles.field}>
                  <label style={styles.fieldLabel}>
                    {"📝 Description "}
                    <span style={styles.required}>{"*"}</span>
                  </label>
                  <textarea
                    rows="5"
                    placeholder="Describe the emergency in detail..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    required
                    style={styles.textarea}
                  />
                  <span style={styles.charCount}>{description.length + " characters"}</span>
                </div>

                <div style={styles.field}>
                  <label style={styles.fieldLabel}>
                    {"📍 Location "}
                    <span style={styles.optional}>{"(Recommended)"}</span>
                  </label>
                  <LocationPicker onLocationSelect={(loc) => setLocation(loc)} />
                </div>

                <div style={styles.field}>
                  <label style={styles.fieldLabel}>
                    {"📷 Upload Image "}
                    <span style={styles.optional}>{"(Optional)"}</span>
                  </label>
                  <label className="upload-area" style={styles.uploadArea}>
                    <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: "none" }} />
                    {imagePreview ? (
                      <div style={styles.previewContainer}>
                        <img src={imagePreview} alt="preview" style={styles.imagePreview} />
                        <p style={styles.previewText}>{"✅ Image selected — click to change"}</p>
                      </div>
                    ) : (
                      <div style={styles.uploadPlaceholder}>
                        <span style={styles.uploadIcon}>{"📷"}</span>
                        <p style={styles.uploadText}>{"Click to upload an image"}</p>
                        <p style={styles.uploadSubtext}>{"JPG, PNG up to 5MB"}</p>
                      </div>
                    )}
                  </label>
                </div>

                <div style={styles.btnRow}>
                  <button type="button" className="back-btn" style={styles.backBtn} onClick={() => setStep(1)}>
                    {"← Back"}
                  </button>
                  <button
                    type="button"
                    className="next-btn"
                    style={{ ...styles.nextBtn, flex: 1, opacity: description.trim() ? 1 : 0.4 }}
                    onClick={() => description.trim() && setStep(3)}
                  >
                    {"Continue →"}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <div style={{ animation: "slideIn 0.3s ease" }}>
                <h3 style={styles.stepTitle}>{"Step 3 — Review & Submit"}</h3>
                <p style={styles.stepSubtitle}>{"Review your report before submitting"}</p>

                <div style={styles.reviewCard}>
                  <div style={styles.reviewRow}>
                    <span style={styles.reviewLabel}>{"Emergency Type"}</span>
                    <span style={{ color: selectedTypeData?.color, fontWeight: "600", fontSize: "14px" }}>
                      {selectedTypeData?.icon + " " + selectedTypeData?.label}
                    </span>
                  </div>
                  <div style={styles.reviewDivider} />
                  <div style={styles.reviewRow}>
                    <span style={styles.reviewLabel}>{"Description"}</span>
                    <span style={styles.reviewValue}>
                      {description.substring(0, 80)}{description.length > 80 ? "..." : ""}
                    </span>
                  </div>
                  <div style={styles.reviewDivider} />
                  <div style={styles.reviewRow}>
                    <span style={styles.reviewLabel}>{"📍 Location"}</span>
                    <span style={styles.reviewValue}>
                      {location.area
                        ? location.lat ? "GPS: " + location.area : location.area
                        : "Not provided"}
                    </span>
                  </div>
                  <div style={styles.reviewDivider} />
                  <div style={styles.reviewRow}>
                    <span style={styles.reviewLabel}>{"Image"}</span>
                    <span style={styles.reviewValue}>{image ? "✅ " + image.name : "No image attached"}</span>
                  </div>
                  <div style={styles.reviewDivider} />
                  <div style={styles.reviewRow}>
                    <span style={styles.reviewLabel}>{"Status"}</span>
                    <span style={{ color: "#ffaa00", fontWeight: "600", fontSize: "14px" }}>{"⏳ Pending"}</span>
                  </div>
                  <div style={styles.reviewDivider} />
                  {/* Quota reminder in review */}
                  <div style={styles.reviewRow}>
                    <span style={styles.reviewLabel}>{"Quota"}</span>
                    <span style={{
                      color: quota?.remaining <= 1 ? "#ffaa00" : "#00ff88",
                      fontWeight: "600", fontSize: "13px",
                    }}>
                      {quota
                        ? quota.used + "/" + quota.limit + " used — " + (quota.remaining - 1) + " remaining after submit"
                        : "—"}
                    </span>
                  </div>
                </div>

                {imagePreview && (
                  <img src={imagePreview} alt="preview" style={styles.reviewImage} />
                )}

                <div style={styles.btnRow}>
                  <button type="button" className="back-btn" style={styles.backBtn} onClick={() => setStep(2)}>
                    {"← Back"}
                  </button>
                  <button
                    type="submit"
                    className="submit-btn"
                    style={{ ...styles.submitBtn, flex: 1 }}
                    disabled={loading || isBlocked}
                  >
                    {loading ? (
                      <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                        <span style={styles.btnSpinner} />
                        {"Submitting..."}
                      </span>
                    ) : "🚨 Submit Emergency Report"}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

const styles = {
  page: { backgroundColor: "#111111", minHeight: "100vh" },
  layout: { display: "flex", minHeight: "calc(100vh - 70px)" },
  leftPanel: { width: "320px", minWidth: "320px", backgroundColor: "#0d0d0d", borderRight: "1px solid #1e1e1e", display: "flex", flexDirection: "column" },
  leftContent: { padding: "36px 24px", display: "flex", flexDirection: "column", gap: "20px" },
  leftHeader: { display: "flex", flexDirection: "column", gap: "10px" },
  alertIcon: { fontSize: "40px" },
  leftTitle: { color: "#ffffff", fontSize: "22px", fontWeight: "700" },
  leftSubtitle: { color: "#555555", fontSize: "13px", lineHeight: "1.7" },
  stepsContainer: { display: "flex", flexDirection: "column" },
  stepItem: { display: "flex", alignItems: "center", gap: "12px", position: "relative" },
  stepCircle: { width: "32px", height: "32px", borderRadius: "50%", backgroundColor: "#1e1e1e", border: "1px solid #333333", color: "#555555", fontSize: "13px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.3s ease", zIndex: 1 },
  stepActive: { backgroundColor: "rgba(0,255,136,0.15)", border: "1px solid #00ff88", color: "#00ff88" },
  stepDone: { backgroundColor: "#00ff88", border: "1px solid #00ff88", color: "#0a0a0a" },
  stepLabel: { color: "#444444", fontSize: "13px", fontWeight: "500", flex: 1, transition: "color 0.3s ease" },
  stepLabelActive: { color: "#e0e0e0" },
  stepLine: { position: "absolute", left: "15px", top: "32px", width: "2px", height: "24px", backgroundColor: "#222222", transition: "background-color 0.3s ease" },
  stepLineDone: { backgroundColor: "#00ff88" },
  miniSpinner: { width: "20px", height: "20px", border: "2px solid rgba(0,255,136,0.1)", borderTop: "2px solid #00ff88", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto" },
  tipsBox: { backgroundColor: "#1a1a1a", border: "1px solid #222222", borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column", gap: "10px" },
  tipsTitle: { color: "#ffffff", fontSize: "13px", fontWeight: "600" },
  tipItem: { display: "flex", alignItems: "flex-start", gap: "10px" },
  tipDot: { color: "#00ff88", fontSize: "8px", marginTop: "4px", flexShrink: 0 },
  tipText: { color: "#666666", fontSize: "12px", lineHeight: "1.5" },
  selectedPreview: { border: "1px solid", borderRadius: "12px", padding: "16px", display: "flex", alignItems: "center", gap: "14px" },
  selectedIcon: { fontSize: "28px" },
  selectedLabel: { fontSize: "14px", fontWeight: "700" },
  selectedDesc: { color: "#555555", fontSize: "12px", marginTop: "2px" },
  locationPreview: { backgroundColor: "rgba(0,255,136,0.06)", border: "1px solid rgba(0,255,136,0.2)", borderRadius: "12px", padding: "14px", display: "flex", alignItems: "center", gap: "12px" },
  locationPreviewIcon: { fontSize: "20px" },
  locationPreviewLabel: { color: "#00ff88", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" },
  locationPreviewValue: { color: "#e0e0e0", fontSize: "12px", marginTop: "2px" },
  rightPanel: { flex: 1, padding: "40px", overflowY: "auto" },
  quotaBanner: { backgroundColor: "rgba(255,107,107,0.08)", border: "1px solid rgba(255,107,107,0.25)", borderRadius: "14px", padding: "18px 20px", marginBottom: "24px", display: "flex", alignItems: "flex-start", gap: "14px" },
  quotaBannerIcon: { fontSize: "28px", flexShrink: 0 },
  quotaBannerTitle: { color: "#ff6b6b", fontSize: "15px", fontWeight: "700", margin: "0 0 4px" },
  quotaBannerSub: { color: "#888888", fontSize: "13px", lineHeight: "1.6", margin: 0 },
  successMsg: { backgroundColor: "rgba(0,255,136,0.08)", border: "1px solid rgba(0,255,136,0.2)", color: "#00ff88", padding: "14px 20px", borderRadius: "10px", fontSize: "14px", marginBottom: "24px" },
  errorMsg: { backgroundColor: "rgba(255,68,68,0.08)", border: "1px solid rgba(255,68,68,0.2)", color: "#ff4444", padding: "14px 20px", borderRadius: "10px", fontSize: "14px", marginBottom: "24px" },
  form: { display: "flex", flexDirection: "column", transition: "opacity 0.3s ease" },
  stepTitle: { color: "#ffffff", fontSize: "20px", fontWeight: "700", marginBottom: "6px" },
  stepSubtitle: { color: "#555555", fontSize: "13px", marginBottom: "28px" },
  typeGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "28px" },
  typeCard: { backgroundColor: "#1a1a1a", border: "1px solid #222222", borderRadius: "14px", padding: "20px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", position: "relative", textAlign: "center" },
  typeIconBox: { width: "52px", height: "52px", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center" },
  typeIcon: { fontSize: "24px" },
  typeLabel: { fontSize: "14px", fontWeight: "600", transition: "color 0.3s ease" },
  typeDesc: { color: "#555555", fontSize: "11px", lineHeight: "1.4" },
  typeCheck: { position: "absolute", top: "10px", right: "10px", width: "20px", height: "20px", borderRadius: "50%", color: "#0a0a0a", fontSize: "11px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center" },
  nextBtn: { width: "100%", backgroundColor: "#00ff88", color: "#0a0a0a", border: "none", padding: "15px", borderRadius: "10px", fontSize: "15px", fontWeight: "700", cursor: "pointer", letterSpacing: "0.5px" },
  field: { display: "flex", flexDirection: "column", gap: "8px", marginBottom: "24px" },
  fieldLabel: { color: "#888888", fontSize: "13px", fontWeight: "500" },
  required: { color: "#ff4444" },
  optional: { color: "#444444", fontSize: "12px" },
  textarea: { backgroundColor: "#1a1a1a", border: "1px solid #2e2e2e", color: "#e0e0e0", padding: "16px", borderRadius: "10px", fontSize: "14px", resize: "vertical", fontFamily: "inherit", lineHeight: "1.6", transition: "all 0.3s ease" },
  charCount: { color: "#444444", fontSize: "11px", textAlign: "right" },
  uploadArea: { border: "2px dashed #2a2a2a", borderRadius: "12px", padding: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", minHeight: "120px" },
  uploadPlaceholder: { textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" },
  uploadIcon: { fontSize: "32px" },
  uploadText: { color: "#aaaaaa", fontSize: "14px", fontWeight: "500" },
  uploadSubtext: { color: "#444444", fontSize: "12px" },
  previewContainer: { display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" },
  imagePreview: { width: "100%", maxHeight: "160px", objectFit: "cover", borderRadius: "8px" },
  previewText: { color: "#00ff88", fontSize: "12px" },
  btnRow: { display: "flex", gap: "12px" },
  backBtn: { padding: "15px 24px", backgroundColor: "transparent", border: "1px solid #333333", color: "#888888", borderRadius: "10px", fontSize: "14px", cursor: "pointer" },
  reviewCard: { backgroundColor: "#1a1a1a", border: "1px solid #222222", borderRadius: "14px", padding: "24px", marginBottom: "24px", display: "flex", flexDirection: "column", gap: "16px" },
  reviewRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "20px" },
  reviewLabel: { color: "#555555", fontSize: "13px", fontWeight: "500", flexShrink: 0 },
  reviewValue: { color: "#e0e0e0", fontSize: "13px", textAlign: "right" },
  reviewDivider: { height: "1px", backgroundColor: "#1e1e1e" },
  reviewImage: { width: "100%", maxHeight: "180px", objectFit: "cover", borderRadius: "10px", marginBottom: "24px" },
  submitBtn: { backgroundColor: "#00ff88", color: "#0a0a0a", border: "none", padding: "15px", borderRadius: "10px", fontSize: "15px", fontWeight: "700", cursor: "pointer", letterSpacing: "0.5px" },
  btnSpinner: { width: "16px", height: "16px", border: "2px solid rgba(0,0,0,0.2)", borderTop: "2px solid #0a0a0a", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" },
};

export default EmergencyForm;