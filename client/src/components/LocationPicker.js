import { useState } from "react";

const LocationPicker = ({ onLocationSelect }) => {
  const [detecting, setDetecting] = useState(false);
  const [detected, setDetected] = useState(false);
  const [manualArea, setManualArea] = useState("");
  const [mode, setMode] = useState(null); // "gps" | "manual"
  const [error, setError] = useState("");

  const handleGPS = () => {
    setDetecting(true);
    setError("");
    setMode("gps");

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      setDetecting(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setDetected(true);
        setDetecting(false);
        onLocationSelect({ lat, lng, area: `${lat.toFixed(4)}, ${lng.toFixed(4)}` });
      },
      (err) => {
        setDetecting(false);
        setError("GPS access denied. Please enter location manually.");
        setMode("manual");
      }
    );
  };

  const handleManualChange = (e) => {
    const value = e.target.value;
    setManualArea(value);
    onLocationSelect({ lat: null, lng: null, area: value });
  };

  return (
    <div style={styles.wrapper}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .loc-gps-btn { transition: all 0.3s ease !important; }
        .loc-gps-btn:hover { transform: translateY(-2px) !important; box-shadow: 0 8px 20px rgba(0,255,136,0.3) !important; }
        .loc-manual-btn { transition: all 0.3s ease !important; }
        .loc-manual-btn:hover { border-color: #00ff88 !important; color: #00ff88 !important; }
        .loc-input:focus { border-color: #00ff88 !important; box-shadow: 0 0 0 3px rgba(0,255,136,0.1) !important; outline: none !important; }
      `}</style>

      {/* Mode selector buttons */}
      {!mode && (
        <div style={styles.modeBtns}>
          <button
            type="button"
            className="loc-gps-btn"
            style={styles.gpsBtn}
            onClick={handleGPS}
          >
            <span style={styles.btnIcon}>📍</span>
            <div style={styles.btnText}>
              <p style={styles.btnLabel}>Detect My Location</p>
              <p style={styles.btnSub}>Uses GPS automatically</p>
            </div>
          </button>

          <button
            type="button"
            className="loc-manual-btn"
            style={styles.manualBtn}
            onClick={() => setMode("manual")}
          >
            <span style={styles.btnIcon}>✏️</span>
            <div style={styles.btnText}>
              <p style={styles.btnLabel}>Enter Manually</p>
              <p style={styles.btnSub}>Type your area name</p>
            </div>
          </button>
        </div>
      )}

      {/* GPS detecting state */}
      {mode === "gps" && detecting && (
        <div style={styles.detectingBox}>
          <div style={styles.spinner}></div>
          <p style={styles.detectingText}>Detecting your location...</p>
        </div>
      )}

      {/* GPS success state */}
      {mode === "gps" && detected && !detecting && (
        <div style={styles.successBox}>
          <span style={styles.successIcon}>✅</span>
          <p style={styles.successText}>Location detected successfully!</p>
          <button
            type="button"
            style={styles.resetBtn}
            onClick={() => { setMode(null); setDetected(false); onLocationSelect({ lat: null, lng: null, area: "" }); }}
          >
            Change
          </button>
        </div>
      )}

      {/* Manual input */}
      {mode === "manual" && (
        <div style={styles.manualBox}>
          <input
            className="loc-input"
            type="text"
            placeholder="e.g. Mirpur, Dhaka"
            value={manualArea}
            onChange={handleManualChange}
            style={styles.manualInput}
          />
          <button
            type="button"
            style={styles.resetBtn}
            onClick={() => { setMode(null); setManualArea(""); onLocationSelect({ lat: null, lng: null, area: "" }); }}
          >
            ← Back
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={styles.errorBox}>
          <span>⚠️</span> {error}
        </div>
      )}
    </div>
  );
};

const styles = {
  wrapper: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  modeBtns: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
  },
  gpsBtn: {
    backgroundColor: "rgba(0,255,136,0.08)",
    border: "1px solid rgba(0,255,136,0.25)",
    borderRadius: "12px",
    padding: "16px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    cursor: "pointer",
    textAlign: "left",
    fontFamily: "inherit",
  },
  manualBtn: {
    backgroundColor: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: "12px",
    padding: "16px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    cursor: "pointer",
    textAlign: "left",
    fontFamily: "inherit",
  },
  btnIcon: { fontSize: "24px", flexShrink: 0 },
  btnText: { display: "flex", flexDirection: "column", gap: "2px" },
  btnLabel: { color: "#e0e0e0", fontSize: "13px", fontWeight: "600" },
  btnSub: { color: "#555555", fontSize: "11px" },
  detectingBox: {
    backgroundColor: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: "12px",
    padding: "20px",
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },
  spinner: {
    width: "20px", height: "20px",
    border: "2px solid rgba(0,255,136,0.1)",
    borderTop: "2px solid #00ff88",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
    flexShrink: 0,
  },
  detectingText: { color: "#888888", fontSize: "13px" },
  successBox: {
    backgroundColor: "rgba(0,255,136,0.06)",
    border: "1px solid rgba(0,255,136,0.2)",
    borderRadius: "12px",
    padding: "14px 16px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  successIcon: { fontSize: "18px" },
  successText: { color: "#00ff88", fontSize: "13px", fontWeight: "500", flex: 1 },
  manualBox: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  manualInput: {
    backgroundColor: "#1a1a1a",
    border: "1px solid #2e2e2e",
    color: "#e0e0e0",
    padding: "13px 16px",
    borderRadius: "10px",
    fontSize: "14px",
    fontFamily: "inherit",
    transition: "all 0.3s ease",
  },
  resetBtn: {
    backgroundColor: "transparent",
    border: "none",
    color: "#555555",
    fontSize: "12px",
    cursor: "pointer",
    fontFamily: "inherit",
    textAlign: "left",
    padding: "0",
    transition: "color 0.3s ease",
  },
  errorBox: {
    backgroundColor: "rgba(255,68,68,0.06)",
    border: "1px solid rgba(255,68,68,0.2)",
    color: "#ff4444",
    padding: "12px 14px",
    borderRadius: "8px",
    fontSize: "13px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
};

export default LocationPicker;