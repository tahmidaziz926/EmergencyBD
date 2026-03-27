import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import useAuth from "../../hooks/useAuth";
import Navbar from "../../components/Navbar";
import LocationPicker from "../../components/LocationPicker";

const emergencyTypes = [
  { value: "robbery", label: "Robbery", icon: "🔫", color: "#ff6b6b", description: "Armed or unarmed theft" },
  { value: "fire", label: "Fire", icon: "🔥", color: "#ff9f43", description: "Fire or explosion incident" },
  { value: "accident", label: "Accident", icon: "🚗", color: "#ffd93d", description: "Vehicle or road accident" },
  { value: "harassment", label: "Harassment", icon: "⚠️", color: "#a29bfe", description: "Verbal or physical harassment" },
  { value: "medical", label: "Medical", icon: "🏥", color: "#00ff88", description: "Medical emergency" },
];

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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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

      await axios.post("http://localhost:3001/api/emergency/report", formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" }
      });
      setMessage("Emergency report submitted successfully!");
      setTimeout(() => navigate("/user/emergency/list"), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Submission failed");
    }
    setLoading(false);
  };

  const selectedTypeData = emergencyTypes.find(t => t.value === selectedType);

  return (
    <div style={styles.page}>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }

        .type-card { transition: all 0.3s ease !important; cursor: pointer; }
        .type-card:hover { transform: translateY(-4px) !important; box-shadow: 0 12px 30px rgba(0,0,0,0.3) !important; }
        .submit-btn { transition: all 0.3s ease !important; }
        .submit-btn:hover { transform: translateY(-2px) !important; box-shadow: 0 10px 30px rgba(0,255,136,0.4) !important; }
        .submit-btn:disabled { opacity: 0.6 !important; cursor: not-allowed !important; transform: none !important; }
        .next-btn { transition: all 0.3s ease !important; }
        .next-btn:hover { transform: translateY(-2px) !important; box-shadow: 0 10px 30px rgba(0,255,136,0.3) !important; }
        .back-btn { transition: all 0.3s ease !important; }
        .back-btn:hover { background: rgba(255,255,255,0.05) !important; color: #fff !important; }
        .upload-area { transition: all 0.3s ease !important; }
        .upload-area:hover { border-color: #00ff88 !important; background: rgba(0,255,136,0.04) !important; }
        textarea:focus { border-color: #00ff88 !important; box-shadow: 0 0 0 3px rgba(0,255,136,0.1) !important; outline: none !important; }
      `}</style>

      <Navbar />

      <div style={styles.layout}>

        {/* LEFT PANEL */}
        <div style={styles.leftPanel}>
          <div style={styles.leftContent}>

            <div style={styles.leftHeader}>
              <div style={styles.alertIcon}>🚨</div>
              <h2 style={styles.leftTitle}>Emergency Report</h2>
              <p style={styles.leftSubtitle}>Report any emergency in your area quickly and securely</p>
            </div>

            {/* Step Indicator */}
            <div style={styles.stepsContainer}>
              {[
                { num: 1, label: "Select Type" },
                { num: 2, label: "Add Details" },
                { num: 3, label: "Submit" },
              ].map((s, i) => (
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

            {/* Tips */}
            <div style={styles.tipsBox}>
              <h4 style={styles.tipsTitle}>📌 Quick Tips</h4>
              {[
                "Enable GPS for accurate location",
                "Add an image if possible",
                "Describe the situation clearly",
                "Stay safe while reporting",
              ].map((tip, i) => (
                <div key={i} style={styles.tipItem}>
                  <span style={styles.tipDot}>●</span>
                  <span style={styles.tipText}>{tip}</span>
                </div>
              ))}
            </div>

            {/* Selected Type Preview */}
            {selectedTypeData && (
              <div style={{
                ...styles.selectedPreview,
                borderColor: `${selectedTypeData.color}40`,
                backgroundColor: `${selectedTypeData.color}08`,
              }}>
                <span style={styles.selectedIcon}>{selectedTypeData.icon}</span>
                <div>
                  <p style={{ ...styles.selectedLabel, color: selectedTypeData.color }}>
                    {selectedTypeData.label}
                  </p>
                  <p style={styles.selectedDesc}>{selectedTypeData.description}</p>
                </div>
              </div>
            )}

            {/* Location Preview */}
            {location.area && (
              <div style={styles.locationPreview}>
                <span style={styles.locationPreviewIcon}>📍</span>
                <div>
                  <p style={styles.locationPreviewLabel}>Location Set</p>
                  <p style={styles.locationPreviewValue}>{location.area}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div style={styles.rightPanel}>

          {message && <div style={styles.successMsg}>✅ {message}</div>}
          {error && <div style={styles.errorMsg}>❌ {error}</div>}

          <form onSubmit={handleSubmit} style={styles.form}>

            {/* STEP 1 - Select Type */}
            {step === 1 && (
              <div style={{ animation: "slideIn 0.3s ease" }}>
                <h3 style={styles.stepTitle}>Step 1 — Select Emergency Type</h3>
                <p style={styles.stepSubtitle}>What kind of emergency are you reporting?</p>

                <div style={styles.typeGrid}>
                  {emergencyTypes.map((type) => (
                    <div
                      key={type.value}
                      className="type-card"
                      style={{
                        ...styles.typeCard,
                        ...(selectedType === type.value ? {
                          borderColor: type.color,
                          backgroundColor: `${type.color}10`,
                          boxShadow: `0 0 20px ${type.color}20`,
                        } : {}),
                      }}
                      onClick={() => setSelectedType(type.value)}
                    >
                      <div style={{ ...styles.typeIconBox, backgroundColor: `${type.color}15`, border: `1px solid ${type.color}30` }}>
                        <span style={styles.typeIcon}>{type.icon}</span>
                      </div>
                      <p style={{ ...styles.typeLabel, color: selectedType === type.value ? type.color : "#e0e0e0" }}>
                        {type.label}
                      </p>
                      <p style={styles.typeDesc}>{type.description}</p>
                      {selectedType === type.value && (
                        <div style={{ ...styles.typeCheck, backgroundColor: type.color }}>✓</div>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  className="next-btn"
                  style={{ ...styles.nextBtn, opacity: selectedType ? 1 : 0.4 }}
                  onClick={() => selectedType && setStep(2)}
                >
                  Continue →
                </button>
              </div>
            )}

            {/* STEP 2 - Details + Location */}
            {step === 2 && (
              <div style={{ animation: "slideIn 0.3s ease" }}>
                <h3 style={styles.stepTitle}>Step 2 — Add Details & Location</h3>
                <p style={styles.stepSubtitle}>Describe the emergency and set your location</p>

                <div style={styles.field}>
                  <label style={styles.fieldLabel}>📝 Description <span style={styles.required}>*</span></label>
                  <textarea
                    rows="5"
                    placeholder="Describe the emergency in detail..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    required
                    style={styles.textarea}
                  />
                  <span style={styles.charCount}>{description.length} characters</span>
                </div>

                {/* Location Picker */}
                <div style={styles.field}>
                  <label style={styles.fieldLabel}>
                    📍 Location <span style={styles.optional}>(Recommended)</span>
                  </label>
                  <LocationPicker onLocationSelect={(loc) => setLocation(loc)} />
                </div>

                <div style={styles.field}>
                  <label style={styles.fieldLabel}>📷 Upload Image <span style={styles.optional}>(Optional)</span></label>
                  <label className="upload-area" style={styles.uploadArea}>
                    <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: "none" }} />
                    {imagePreview ? (
                      <div style={styles.previewContainer}>
                        <img src={imagePreview} alt="preview" style={styles.imagePreview} />
                        <p style={styles.previewText}>✅ Image selected — click to change</p>
                      </div>
                    ) : (
                      <div style={styles.uploadPlaceholder}>
                        <span style={styles.uploadIcon}>📷</span>
                        <p style={styles.uploadText}>Click to upload an image</p>
                        <p style={styles.uploadSubtext}>JPG, PNG up to 5MB</p>
                      </div>
                    )}
                  </label>
                </div>

                <div style={styles.btnRow}>
                  <button type="button" className="back-btn" style={styles.backBtn} onClick={() => setStep(1)}>
                    ← Back
                  </button>
                  <button
                    type="button"
                    className="next-btn"
                    style={{ ...styles.nextBtn, flex: 1, opacity: description.trim() ? 1 : 0.4 }}
                    onClick={() => description.trim() && setStep(3)}
                  >
                    Continue →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3 - Review & Submit */}
            {step === 3 && (
              <div style={{ animation: "slideIn 0.3s ease" }}>
                <h3 style={styles.stepTitle}>Step 3 — Review & Submit</h3>
                <p style={styles.stepSubtitle}>Review your report before submitting</p>

                <div style={styles.reviewCard}>
                  <div style={styles.reviewRow}>
                    <span style={styles.reviewLabel}>Emergency Type</span>
                    <span style={{ color: selectedTypeData?.color, fontWeight: "600", fontSize: "14px" }}>
                      {selectedTypeData?.icon} {selectedTypeData?.label}
                    </span>
                  </div>
                  <div style={styles.reviewDivider} />
                  <div style={styles.reviewRow}>
                    <span style={styles.reviewLabel}>Description</span>
                    <span style={styles.reviewValue}>
                      {description.substring(0, 80)}{description.length > 80 ? "..." : ""}
                    </span>
                  </div>
                  <div style={styles.reviewDivider} />
                  <div style={styles.reviewRow}>
                    <span style={styles.reviewLabel}>📍 Location</span>
                    <span style={styles.reviewValue}>
                      {location.area
                        ? location.lat
                          ? `GPS: ${location.area}`
                          : location.area
                        : "Not provided"}
                    </span>
                  </div>
                  <div style={styles.reviewDivider} />
                  <div style={styles.reviewRow}>
                    <span style={styles.reviewLabel}>Image</span>
                    <span style={styles.reviewValue}>{image ? `✅ ${image.name}` : "No image attached"}</span>
                  </div>
                  <div style={styles.reviewDivider} />
                  <div style={styles.reviewRow}>
                    <span style={styles.reviewLabel}>Status</span>
                    <span style={{ color: "#ffaa00", fontWeight: "600", fontSize: "14px" }}>⏳ Pending</span>
                  </div>
                </div>

                {imagePreview && (
                  <img src={imagePreview} alt="preview" style={styles.reviewImage} />
                )}

                <div style={styles.btnRow}>
                  <button type="button" className="back-btn" style={styles.backBtn} onClick={() => setStep(2)}>
                    ← Back
                  </button>
                  <button
                    type="submit"
                    className="submit-btn"
                    style={{ ...styles.submitBtn, flex: 1 }}
                    disabled={loading}
                  >
                    {loading ? (
                      <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                        <span style={styles.btnSpinner}></span> Submitting...
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
  leftPanel: {
    width: "320px", minWidth: "320px",
    backgroundColor: "#0d0d0d",
    borderRight: "1px solid #1e1e1e",
    display: "flex", flexDirection: "column",
  },
  leftContent: {
    padding: "36px 24px",
    display: "flex", flexDirection: "column", gap: "24px",
  },
  leftHeader: { display: "flex", flexDirection: "column", gap: "10px" },
  alertIcon: { fontSize: "40px" },
  leftTitle: { color: "#ffffff", fontSize: "22px", fontWeight: "700" },
  leftSubtitle: { color: "#555555", fontSize: "13px", lineHeight: "1.7" },
  stepsContainer: { display: "flex", flexDirection: "column" },
  stepItem: { display: "flex", alignItems: "center", gap: "12px", position: "relative" },
  stepCircle: {
    width: "32px", height: "32px", borderRadius: "50%",
    backgroundColor: "#1e1e1e", border: "1px solid #333333",
    color: "#555555", fontSize: "13px", fontWeight: "700",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0, transition: "all 0.3s ease", zIndex: 1,
  },
  stepActive: { backgroundColor: "rgba(0,255,136,0.15)", border: "1px solid #00ff88", color: "#00ff88" },
  stepDone: { backgroundColor: "#00ff88", border: "1px solid #00ff88", color: "#0a0a0a" },
  stepLabel: { color: "#444444", fontSize: "13px", fontWeight: "500", flex: 1, transition: "color 0.3s ease" },
  stepLabelActive: { color: "#e0e0e0" },
  stepLine: {
    position: "absolute", left: "15px", top: "32px",
    width: "2px", height: "24px",
    backgroundColor: "#222222", transition: "background-color 0.3s ease",
  },
  stepLineDone: { backgroundColor: "#00ff88" },
  tipsBox: {
    backgroundColor: "#1a1a1a", border: "1px solid #222222",
    borderRadius: "12px", padding: "20px",
    display: "flex", flexDirection: "column", gap: "10px",
  },
  tipsTitle: { color: "#ffffff", fontSize: "13px", fontWeight: "600" },
  tipItem: { display: "flex", alignItems: "flex-start", gap: "10px" },
  tipDot: { color: "#00ff88", fontSize: "8px", marginTop: "4px", flexShrink: 0 },
  tipText: { color: "#666666", fontSize: "12px", lineHeight: "1.5" },
  selectedPreview: {
    border: "1px solid", borderRadius: "12px", padding: "16px",
    display: "flex", alignItems: "center", gap: "14px",
  },
  selectedIcon: { fontSize: "28px" },
  selectedLabel: { fontSize: "14px", fontWeight: "700" },
  selectedDesc: { color: "#555555", fontSize: "12px", marginTop: "2px" },
  locationPreview: {
    backgroundColor: "rgba(0,255,136,0.06)",
    border: "1px solid rgba(0,255,136,0.2)",
    borderRadius: "12px", padding: "14px",
    display: "flex", alignItems: "center", gap: "12px",
  },
  locationPreviewIcon: { fontSize: "20px" },
  locationPreviewLabel: { color: "#00ff88", fontSize: "11px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" },
  locationPreviewValue: { color: "#e0e0e0", fontSize: "12px", marginTop: "2px" },
  rightPanel: { flex: 1, padding: "40px", overflowY: "auto" },
  successMsg: {
    backgroundColor: "rgba(0,255,136,0.08)", border: "1px solid rgba(0,255,136,0.2)",
    color: "#00ff88", padding: "14px 20px", borderRadius: "10px",
    fontSize: "14px", marginBottom: "24px",
  },
  errorMsg: {
    backgroundColor: "rgba(255,68,68,0.08)", border: "1px solid rgba(255,68,68,0.2)",
    color: "#ff4444", padding: "14px 20px", borderRadius: "10px",
    fontSize: "14px", marginBottom: "24px",
  },
  form: { display: "flex", flexDirection: "column" },
  stepTitle: { color: "#ffffff", fontSize: "20px", fontWeight: "700", marginBottom: "6px" },
  stepSubtitle: { color: "#555555", fontSize: "13px", marginBottom: "28px" },
  typeGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "28px" },
  typeCard: {
    backgroundColor: "#1a1a1a", border: "1px solid #222222",
    borderRadius: "14px", padding: "20px 16px",
    display: "flex", flexDirection: "column", alignItems: "center",
    gap: "10px", position: "relative", textAlign: "center",
  },
  typeIconBox: {
    width: "52px", height: "52px", borderRadius: "14px",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  typeIcon: { fontSize: "24px" },
  typeLabel: { fontSize: "14px", fontWeight: "600", transition: "color 0.3s ease" },
  typeDesc: { color: "#555555", fontSize: "11px", lineHeight: "1.4" },
  typeCheck: {
    position: "absolute", top: "10px", right: "10px",
    width: "20px", height: "20px", borderRadius: "50%",
    color: "#0a0a0a", fontSize: "11px", fontWeight: "700",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  nextBtn: {
    width: "100%", backgroundColor: "#00ff88", color: "#0a0a0a",
    border: "none", padding: "15px", borderRadius: "10px",
    fontSize: "15px", fontWeight: "700", cursor: "pointer", letterSpacing: "0.5px",
  },
  field: { display: "flex", flexDirection: "column", gap: "8px", marginBottom: "24px" },
  fieldLabel: { color: "#888888", fontSize: "13px", fontWeight: "500" },
  required: { color: "#ff4444" },
  optional: { color: "#444444", fontSize: "12px" },
  textarea: {
    backgroundColor: "#1a1a1a", border: "1px solid #2e2e2e",
    color: "#e0e0e0", padding: "16px", borderRadius: "10px",
    fontSize: "14px", resize: "vertical", fontFamily: "inherit",
    lineHeight: "1.6", transition: "all 0.3s ease",
  },
  charCount: { color: "#444444", fontSize: "11px", textAlign: "right" },
  uploadArea: {
    border: "2px dashed #2a2a2a", borderRadius: "12px", padding: "32px",
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", minHeight: "120px",
  },
  uploadPlaceholder: { textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" },
  uploadIcon: { fontSize: "32px" },
  uploadText: { color: "#aaaaaa", fontSize: "14px", fontWeight: "500" },
  uploadSubtext: { color: "#444444", fontSize: "12px" },
  previewContainer: { display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" },
  imagePreview: { width: "100%", maxHeight: "160px", objectFit: "cover", borderRadius: "8px" },
  previewText: { color: "#00ff88", fontSize: "12px" },
  btnRow: { display: "flex", gap: "12px" },
  backBtn: {
    padding: "15px 24px", backgroundColor: "transparent",
    border: "1px solid #333333", color: "#888888",
    borderRadius: "10px", fontSize: "14px", cursor: "pointer",
  },
  reviewCard: {
    backgroundColor: "#1a1a1a", border: "1px solid #222222",
    borderRadius: "14px", padding: "24px", marginBottom: "24px",
    display: "flex", flexDirection: "column", gap: "16px",
  },
  reviewRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "20px" },
  reviewLabel: { color: "#555555", fontSize: "13px", fontWeight: "500", flexShrink: 0 },
  reviewValue: { color: "#e0e0e0", fontSize: "13px", textAlign: "right" },
  reviewDivider: { height: "1px", backgroundColor: "#1e1e1e" },
  reviewImage: { width: "100%", maxHeight: "180px", objectFit: "cover", borderRadius: "10px", marginBottom: "24px" },
  submitBtn: {
    backgroundColor: "#00ff88", color: "#0a0a0a", border: "none",
    padding: "15px", borderRadius: "10px", fontSize: "15px",
    fontWeight: "700", cursor: "pointer", letterSpacing: "0.5px",
  },
  btnSpinner: {
    width: "16px", height: "16px",
    border: "2px solid rgba(0,0,0,0.2)", borderTop: "2px solid #0a0a0a",
    borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block",
  },
};

export default EmergencyForm;