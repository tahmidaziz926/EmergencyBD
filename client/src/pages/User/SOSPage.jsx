import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Circle, Popup, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { triggerSOS } from "../../services/sosService";

// ── Fix leaflet default icon ────────────────────────────────────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ── Emergency type config ────────────────────────────────────────────────────
const EMERGENCY_TYPES = [
  { value: "fire",       label: "Fire",       icon: "🔥", color: "#ff4500" },
  { value: "robbery",    label: "Robbery",    icon: "🔫", color: "#8b0000" },
  { value: "accident",   label: "Accident",   icon: "💥", color: "#ff8c00" },
  { value: "harassment", label: "Harassment", icon: "⚠️", color: "#ffd700" },
  { value: "medical",    label: "Medical",    icon: "🏥", color: "#00bfff" },
  { value: "flood",      label: "Flood",      icon: "🌊", color: "#1e90ff" },
  { value: "other",      label: "Other",      icon: "🚨", color: "#ff0066" },
];

// ── Custom SOS marker icon ───────────────────────────────────────────────────
const createSOSIcon = (type) => {
  const et = EMERGENCY_TYPES.find((e) => e.value === type) || EMERGENCY_TYPES[6];
  return L.divIcon({
    className: "",
    html: `
      <div style="
        position:relative;
        display:flex;
        align-items:center;
        justify-content:center;
        width:56px;
        height:56px;
      ">
        <div style="
          position:absolute;
          width:56px; height:56px;
          border-radius:50%;
          background:${et.color}22;
          border:2.5px solid ${et.color};
          animation:sosRing1 1.8s ease-out infinite;
        "></div>
        <div style="
          position:absolute;
          width:40px; height:40px;
          border-radius:50%;
          background:${et.color}33;
          border:2px solid ${et.color};
          animation:sosRing2 1.8s ease-out infinite 0.4s;
        "></div>
        <div style="
          position:relative;
          width:28px; height:28px;
          border-radius:50%;
          background:${et.color};
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:14px;
          box-shadow:0 0 12px ${et.color}88;
          z-index:10;
        ">${et.icon}</div>
      </div>
    `,
    iconSize: [56, 56],
    iconAnchor: [28, 28],
  });
};

// ── Map click handler component ──────────────────────────────────────────────
function MapClickHandler({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// ── Auto-pan map to coordinates ──────────────────────────────────────────────
function MapPanner({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) map.flyTo([lat, lng], 14, { duration: 1.2 });
  }, [lat, lng, map]);
  return null;
}

// ── Inline CSS injector ──────────────────────────────────────────────────────
const injectStyles = () => {
  if (document.getElementById("sos-page-styles")) return;
  const style = document.createElement("style");
  style.id = "sos-page-styles";
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Share+Tech+Mono&display=swap');

    @keyframes sosRing1 {
      0%   { transform:scale(1); opacity:0.8; }
      100% { transform:scale(2.5); opacity:0; }
    }
    @keyframes sosRing2 {
      0%   { transform:scale(1); opacity:0.6; }
      100% { transform:scale(2.2); opacity:0; }
    }
    @keyframes sosPulse {
      0%,100% { opacity:1; }
      50%      { opacity:0.4; }
    }
    @keyframes waveExpand {
      0%   { transform:scale(0.8); opacity:0.9; }
      100% { transform:scale(3.5); opacity:0; }
    }
    @keyframes alertSlideIn {
      from { transform:translateY(30px); opacity:0; }
      to   { transform:translateY(0);    opacity:1; }
    }
    @keyframes scanLine {
      0%   { top:0; }
      100% { top:100%; }
    }
    @keyframes glitch {
      0%,100% { clip-path:inset(0 0 95% 0); transform:translateX(-4px); }
      20%     { clip-path:inset(30% 0 50% 0); transform:translateX(4px); }
      40%     { clip-path:inset(60% 0 20% 0); transform:translateX(-2px); }
      60%     { clip-path:inset(10% 0 80% 0); transform:translateX(2px); }
      80%     { clip-path:inset(80% 0 5% 0);  transform:translateX(-3px); }
    }
    @keyframes borderGlow {
      0%,100% { box-shadow: 0 0 8px #00ff8844, inset 0 0 8px #00ff8811; }
      50%     { box-shadow: 0 0 20px #00ff8888, inset 0 0 16px #00ff8822; }
    }

    .sos-page { font-family:'Rajdhani',sans-serif; }
    .sos-mono { font-family:'Share Tech Mono',monospace; }
    
    .sos-type-btn {
      transition: all 0.2s ease;
      cursor: pointer;
      border: 1.5px solid #333;
      background: #1a1a1a;
    }
    .sos-type-btn:hover { transform:translateY(-2px); }
    .sos-type-btn.selected { border-color: currentColor; background: #222; }

    .sos-input {
      background: #161616;
      border: 1px solid #2a2a2a;
      color: #e0e0e0;
      font-family: 'Rajdhani', sans-serif;
      font-size: 15px;
      transition: border-color 0.2s, box-shadow 0.2s;
      outline: none;
    }
    .sos-input:focus {
      border-color: #00ff88;
      box-shadow: 0 0 0 2px #00ff8822;
    }
    .sos-input::placeholder { color: #444; }

    .sos-trigger-btn {
      position: relative;
      overflow: hidden;
      font-family: 'Rajdhani', sans-serif;
      font-weight: 700;
      letter-spacing: 3px;
      text-transform: uppercase;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    .sos-trigger-btn::before {
      content:'';
      position:absolute;
      inset:0;
      background:linear-gradient(90deg,transparent,rgba(255,255,255,0.1),transparent);
      transform:translateX(-100%);
      transition:transform 0.5s ease;
    }
    .sos-trigger-btn:hover::before { transform:translateX(100%); }
    .sos-trigger-btn:hover {
      box-shadow: 0 0 30px #ff000066, 0 0 60px #ff000033;
      transform: scale(1.02);
    }
    .sos-trigger-btn:active { transform: scale(0.98); }

    .map-wave-ring {
      position:absolute;
      border-radius:50%;
      border:2px solid;
      animation:waveExpand 2.5s ease-out infinite;
      pointer-events:none;
    }

    .radius-slider {
      -webkit-appearance:none;
      width:100%;
      height:4px;
      border-radius:2px;
      background: linear-gradient(to right, #00ff88 0%, #00ff88 var(--val,50%), #333 var(--val,50%));
      outline:none;
    }
    .radius-slider::-webkit-slider-thumb {
      -webkit-appearance:none;
      width:18px; height:18px;
      border-radius:50%;
      background:#00ff88;
      cursor:pointer;
      box-shadow:0 0 8px #00ff8866;
    }

    .alert-success {
      animation: alertSlideIn 0.5s ease;
      border: 1px solid #00ff8844;
      background: #00ff8811;
    }
    .alert-error {
      animation: alertSlideIn 0.5s ease;
      border: 1px solid #ff000044;
      background: #ff000011;
    }

    .scan-overlay {
      position:absolute; left:0; right:0; height:2px;
      background:linear-gradient(to right, transparent, #00ff8844, transparent);
      animation:scanLine 3s linear infinite;
      pointer-events:none;
    }
  `;
  document.head.appendChild(style);
};

// ── Main Component ───────────────────────────────────────────────────────────
const SOSPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState("form"); // "form" | "map"
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [triggered, setTriggered] = useState(false);

  const [form, setForm] = useState({
    emergencyType: "",
    title: "",
    description: "",
    latitude: null,
    longitude: null,
    address: "",
    radius: 5,
    locationMode: "auto",
    manualAddress: "",
  });

  const geocodeTimeout = useRef(null);

  useEffect(() => {
    injectStyles();
  }, []);

  // ── Auto-detect GPS ──────────────────────────────────────────────────────
  const detectGPS = useCallback(() => {
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        // Reverse geocode
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
          );
          const data = await res.json();
          setForm((f) => ({
            ...f,
            latitude: lat,
            longitude: lng,
            address: data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
          }));
        } catch {
          setForm((f) => ({ ...f, latitude: lat, longitude: lng, address: `${lat.toFixed(5)}, ${lng.toFixed(5)}` }));
        }
        setGpsLoading(false);
      },
      () => {
        // Only show error if we have no location at all yet
        setForm((f) => {
          if (!f.latitude && !f.longitude) {
            setAlert({ type: "error", message: "GPS unavailable. Please click on the map to set your location manually." });
          }
          return f;
        });
        setGpsLoading(false);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  }, []);

  useEffect(() => {
    if (form.locationMode === "auto") detectGPS();
  }, [form.locationMode, detectGPS]);

  // ── Map click → reverse geocode ──────────────────────────────────────────
  const handleMapLocationSelect = useCallback(async (lat, lng) => {
    setForm((f) => ({ ...f, latitude: lat, longitude: lng }));
    clearTimeout(geocodeTimeout.current);
    geocodeTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
        );
        const data = await res.json();
        setForm((f) => ({ ...f, address: data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}` }));
      } catch {
        setForm((f) => ({ ...f, address: `${lat.toFixed(5)}, ${lng.toFixed(5)}` }));
      }
    }, 600);
  }, []);

  // ── Proceed to map preview ───────────────────────────────────────────────
  const handlePreview = () => {
    if (!form.emergencyType) return setAlert({ type: "error", message: "Please select an emergency type." });
    if (!form.title.trim()) return setAlert({ type: "error", message: "Please enter a title." });
    if (!form.description.trim()) return setAlert({ type: "error", message: "Please enter a description." });
    if (!form.latitude || !form.longitude) return setAlert({ type: "error", message: "Please set a location." });
    setAlert(null);
    setStep("map");
  };

  // ── Trigger SOS ──────────────────────────────────────────────────────────
  const handleTriggerSOS = async () => {
    setLoading(true);
    try {
      const res = await triggerSOS({
        emergencyType: form.emergencyType,
        title: form.title,
        description: form.description,
        latitude: form.latitude,
        longitude: form.longitude,
        address: form.address,
        radius: form.radius,
      });
      setTriggered(true);
      setAlert({
        type: "success",
        message: `SOS triggered! ${res.data.notifiedCount} user(s) in your area have been notified.`,
      });
    } catch (err) {
      setAlert({ type: "error", message: err.response?.data?.message || "Failed to trigger SOS." });
    } finally {
      setLoading(false);
    }
  };

  const selectedType = EMERGENCY_TYPES.find((e) => e.value === form.emergencyType);
  const sliderPct = ((form.radius - 0.5) / (50 - 0.5)) * 100;

  // ════════════════════════════════════════════════════════════════════════════
  // RENDER: FORM STEP
  // ════════════════════════════════════════════════════════════════════════════
  if (step === "form") {
    return (
      <div className="sos-page" style={{ minHeight: "100vh", background: "#0a0a0a", color: "#e0e0e0", padding: "24px" }}>
        {/* Header */}
        <div style={{ maxWidth: 900, margin: "0 auto 32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 8 }}>
            <div style={{
              width: 48, height: 48, borderRadius: "50%",
              background: "#ff000022", border: "2px solid #ff0000",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22, animation: "sosPulse 1.5s ease-in-out infinite"
            }}>🆘</div>
            <div>
              <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: 2, color: "#ff3333" }}>
                SOS EMERGENCY
              </h1>
              <p className="sos-mono" style={{ margin: 0, fontSize: 12, color: "#555", letterSpacing: 1 }}>
                REPORT AN ACTIVE EMERGENCY IN YOUR AREA
              </p>
            </div>
          </div>
          <div style={{ height: 1, background: "linear-gradient(to right, #ff0000, #ff000000)" }} />
        </div>

        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          {/* Alert */}
          {alert && (
            <div className={alert.type === "error" ? "alert-error" : "alert-success"}
              style={{ padding: "12px 16px", borderRadius: 8, marginBottom: 20, fontSize: 14, color: alert.type === "error" ? "#ff6666" : "#00ff88" }}>
              {alert.message}
            </div>
          )}

          {/* Emergency Type */}
          <section style={{ marginBottom: 28 }}>
            <label style={{ display: "block", fontSize: 12, letterSpacing: 2, color: "#00ff88", marginBottom: 12, fontWeight: 600 }}>
              SELECT EMERGENCY TYPE *
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(100px,1fr))", gap: 10 }}>
              {EMERGENCY_TYPES.map((et) => (
                <button
                  key={et.value}
                  className={`sos-type-btn ${form.emergencyType === et.value ? "selected" : ""}`}
                  style={{
                    padding: "14px 8px",
                    borderRadius: 10,
                    color: form.emergencyType === et.value ? et.color : "#666",
                    borderColor: form.emergencyType === et.value ? et.color : "#2a2a2a",
                    boxShadow: form.emergencyType === et.value ? `0 0 12px ${et.color}44` : "none",
                  }}
                  onClick={() => setForm((f) => ({ ...f, emergencyType: et.value }))}
                >
                  <div style={{ fontSize: 24, marginBottom: 6 }}>{et.icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: 0.5 }}>{et.label}</div>
                </button>
              ))}
            </div>
          </section>

          {/* Title */}
          <section style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 12, letterSpacing: 2, color: "#00ff88", marginBottom: 8, fontWeight: 600 }}>
              INCIDENT TITLE *
            </label>
            <input
              className="sos-input"
              placeholder="e.g. Building fire on 5th floor"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              style={{ width: "100%", padding: "12px 16px", borderRadius: 8, boxSizing: "border-box" }}
            />
          </section>

          {/* Description */}
          <section style={{ marginBottom: 24 }}>
            <label style={{ display: "block", fontSize: 12, letterSpacing: 2, color: "#00ff88", marginBottom: 8, fontWeight: 600 }}>
              DESCRIPTION *
            </label>
            <textarea
              className="sos-input"
              placeholder="Describe the emergency in detail — what's happening, how many people are affected, any immediate dangers..."
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={4}
              style={{ width: "100%", padding: "12px 16px", borderRadius: 8, resize: "vertical", boxSizing: "border-box" }}
            />
          </section>

          {/* Location */}
          <section style={{ marginBottom: 24 }}>
            <label style={{ display: "block", fontSize: 12, letterSpacing: 2, color: "#00ff88", marginBottom: 12, fontWeight: 600 }}>
              LOCATION *
            </label>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              {["auto", "manual"].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setForm((f) => ({ ...f, locationMode: mode }))}
                  style={{
                    padding: "8px 20px", borderRadius: 6, fontSize: 13, fontWeight: 600,
                    letterSpacing: 1, cursor: "pointer", fontFamily: "Rajdhani,sans-serif",
                    background: form.locationMode === mode ? "#00ff8822" : "#1a1a1a",
                    border: `1.5px solid ${form.locationMode === mode ? "#00ff88" : "#333"}`,
                    color: form.locationMode === mode ? "#00ff88" : "#666",
                    transition: "all 0.2s",
                  }}
                >
                  {mode === "auto" ? "📍 AUTO GPS" : "🗺️ PICK ON MAP"}
                </button>
              ))}
              {form.locationMode === "auto" && (
                <button
                  onClick={detectGPS}
                  disabled={gpsLoading}
                  style={{
                    padding: "8px 16px", borderRadius: 6, fontSize: 12, cursor: "pointer",
                    background: "#1a1a1a", border: "1.5px solid #333", color: "#888",
                    fontFamily: "Rajdhani,sans-serif", letterSpacing: 1,
                  }}
                >
                  {gpsLoading ? "⏳ Detecting..." : "↺ REFRESH"}
                </button>
              )}
            </div>

            {/* Map for picking location */}
            <div style={{ height: 520, borderRadius: 12, overflow: "hidden", border: "1px solid #2a2a2a", boxShadow: "0 0 32px #00000088, 0 0 0 1px #ffffff08", position: "relative" }}>
              <div className="scan-overlay" />
              <MapContainer
                center={[form.latitude || 23.8103, form.longitude || 90.4125]}
                zoom={14}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  attribution="© CartoDB"
                />
                {form.locationMode === "manual" && (
                  <MapClickHandler onLocationSelect={handleMapLocationSelect} />
                )}
                {form.latitude && form.longitude && (
                  <>
                    <MapPanner lat={form.latitude} lng={form.longitude} />
                    <Marker
                      position={[form.latitude, form.longitude]}
                      icon={createSOSIcon(form.emergencyType || "other")}
                    >
                      <Popup closeButton={false} maxWidth={280}>
                        <div style={{
                          background: "#141414",
                          border: `1px solid ${selectedType?.color || "#00ff88"}44`,
                          borderRadius: 10,
                          padding: "14px 16px",
                          fontFamily: "Rajdhani, sans-serif",
                          color: "#e0e0e0",
                          minWidth: 220,
                        }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                            <span style={{ fontSize: 24 }}>{selectedType?.icon || "🚨"}</span>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: 14, color: selectedType?.color || "#00ff88", letterSpacing: 0.5 }}>
                                {form.emergencyType ? form.emergencyType.toUpperCase() : "EMERGENCY TYPE"}
                              </div>
                              <div style={{ fontSize: 13, color: "#e0e0e0" }}>
                                {form.title || "Untitled incident"}
                              </div>
                            </div>
                          </div>
                          {form.description && (
                            <p style={{ margin: "0 0 10px", fontSize: 12, color: "#aaa", lineHeight: 1.5 }}>
                              {form.description.length > 100 ? form.description.slice(0, 100) + "..." : form.description}
                            </p>
                          )}
                          <div style={{ fontSize: 11, color: "#555", fontFamily: "monospace", marginBottom: 6 }}>
                            📍 {form.address ? (form.address.length > 70 ? form.address.slice(0, 70) + "..." : form.address) : `${form.latitude?.toFixed(5)}, ${form.longitude?.toFixed(5)}`}
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#444", fontFamily: "monospace" }}>
                            <span>RADIUS: {form.radius} km</span>
                            <span>{form.latitude?.toFixed(4)}, {form.longitude?.toFixed(4)}</span>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                    <Circle
                      center={[form.latitude, form.longitude]}
                      radius={form.radius * 1000}
                      pathOptions={{ color: selectedType?.color || "#00ff88", fillOpacity: 0.08, weight: 1.5, dashArray: "6 4" }}
                    />
                  </>
                )}
              </MapContainer>

              {/* Manual mode instruction */}
              {form.locationMode === "manual" && (
                <div style={{
                  position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)",
                  background: "#111111cc", backdropFilter: "blur(8px)",
                  border: "1px solid #333", borderRadius: 20,
                  padding: "6px 16px", fontSize: 12, color: "#888",
                  fontFamily: "Rajdhani, sans-serif", letterSpacing: 0.5,
                  zIndex: 1000, pointerEvents: "none", whiteSpace: "nowrap",
                }}>
                  🖱️ Click anywhere on the map to place the emergency marker
                </div>
              )}

              {/* Click hint */}
              {form.latitude && form.longitude && (
                <div style={{
                  position: "absolute", top: 12, right: 12,
                  background: "#111111cc", backdropFilter: "blur(8px)",
                  border: "1px solid #00ff8833", borderRadius: 20,
                  padding: "5px 12px", fontSize: 11, color: "#00ff8899",
                  fontFamily: "monospace", zIndex: 1000, pointerEvents: "none",
                }}>
                  📍 Click marker for details
                </div>
              )}
            </div>

            {form.address && (
              <p className="sos-mono" style={{ margin: "8px 0 0", fontSize: 11, color: "#555", wordBreak: "break-word" }}>
                📍 {form.address}
              </p>
            )}
            {form.locationMode === "manual" && (
              <p style={{ margin: "6px 0 0", fontSize: 12, color: "#444" }}>
                Click anywhere on the map to set the emergency location.
              </p>
            )}
          </section>

          {/* Radius Slider */}
          <section style={{ marginBottom: 32 }}>
            <label style={{ display: "flex", justifyContent: "space-between", fontSize: 12, letterSpacing: 2, color: "#00ff88", marginBottom: 12, fontWeight: 600 }}>
              <span>ALERT RADIUS</span>
              <span className="sos-mono" style={{ color: "#e0e0e0" }}>{form.radius} KM</span>
            </label>
            <input
              type="range" min="0.5" max="50" step="0.5"
              value={form.radius}
              className="radius-slider"
              style={{ "--val": `${sliderPct}%` }}
              onChange={(e) => setForm((f) => ({ ...f, radius: parseFloat(e.target.value) }))}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#444", marginTop: 4 }}>
              <span>0.5 km</span><span>25 km</span><span>50 km</span>
            </div>
          </section>

          {/* CTA */}
          <button
            className="sos-trigger-btn"
            onClick={handlePreview}
            style={{
              width: "100%", padding: "18px",
              background: "linear-gradient(135deg,#cc0000,#ff0000)",
              border: "none", borderRadius: 10, color: "#fff",
              fontSize: 18, letterSpacing: 3,
              boxShadow: "0 4px 20px #ff000044",
            }}
          >
          🗺️ PROCEED TO SOS MAP →
          </button>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // RENDER: MAP STEP
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className="sos-page" style={{ height: "100vh", background: "#0a0a0a", display: "flex", flexDirection: "column" }}>
      {/* Top Bar */}
      <div style={{
        padding: "14px 20px", background: "#111",
        borderBottom: "1px solid #1e1e1e",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => { setStep("form"); setTriggered(false); setAlert(null); }}
            style={{ background: "none", border: "1px solid #333", color: "#888", padding: "6px 14px", borderRadius: 6, cursor: "pointer", fontSize: 13, fontFamily: "Rajdhani,sans-serif" }}
          >
            ← BACK
          </button>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: 2, color: "#ff3333" }}>
              {selectedType?.icon} {form.title}
            </div>
            <div className="sos-mono" style={{ fontSize: 11, color: "#555" }}>
              RADIUS: {form.radius}km · {form.address || `${form.latitude?.toFixed(4)}, ${form.longitude?.toFixed(4)}`}
            </div>
          </div>
        </div>

        {/* SOS Trigger Button */}
        {!triggered ? (
          <button
            className="sos-trigger-btn"
            onClick={handleTriggerSOS}
            disabled={loading}
            style={{
              padding: "12px 32px",
              background: loading ? "#333" : "linear-gradient(135deg,#cc0000,#ff0000)",
              border: "none", borderRadius: 8, color: "#fff",
              fontSize: 16, letterSpacing: 3,
              boxShadow: loading ? "none" : "0 0 20px #ff000055",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "SENDING..." : "🆘 TRIGGER SOS"}
          </button>
        ) : (
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{
              padding: "10px 20px", background: "#00ff8811",
              border: "1px solid #00ff8844", borderRadius: 8,
              color: "#00ff88", fontSize: 14, fontWeight: 600,
            }}>
              ✓ SOS ACTIVE
            </div>
            <button
              onClick={() => navigate("/dashboard")}
              style={{
                padding: "10px 20px", background: "#1a1a1a",
                border: "1px solid #333", borderRadius: 8,
                color: "#888", fontSize: 13, cursor: "pointer",
                fontFamily: "Rajdhani,sans-serif",
              }}
            >
              DASHBOARD
            </button>
          </div>
        )}
      </div>

      {/* Alert bar */}
      {alert && (
        <div
          className={alert.type === "error" ? "alert-error" : "alert-success"}
          style={{ padding: "10px 20px", fontSize: 13, color: alert.type === "error" ? "#ff6666" : "#00ff88", flexShrink: 0 }}
        >
          {alert.message}
        </div>
      )}

      {/* Map */}
      <div style={{ flex: 1, position: "relative" }}>
        <MapContainer
          center={[form.latitude, form.longitude]}
          zoom={14}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution="© CartoDB"
          />

          {/* Animated wave circles */}
          {[1, 2, 3].map((i) => (
            <Circle
              key={i}
              center={[form.latitude, form.longitude]}
              radius={form.radius * 1000 * (i / 3)}
              pathOptions={{
                color: selectedType?.color || "#ff0000",
                fillOpacity: triggered ? 0.04 : 0.02,
                weight: triggered ? 1.5 : 1,
                dashArray: triggered ? undefined : "6 4",
              }}
            />
          ))}

          {/* Radius boundary */}
          <Circle
            center={[form.latitude, form.longitude]}
            radius={form.radius * 1000}
            pathOptions={{
              color: triggered ? (selectedType?.color || "#ff0000") : "#00ff88",
              fillOpacity: 0.06,
              weight: 2,
            }}
          />

          {/* SOS Marker */}
          <Marker
            position={[form.latitude, form.longitude]}
            icon={createSOSIcon(form.emergencyType || "other")}
          />
        </MapContainer>

        {/* Info card overlay */}
        <div style={{
          position: "absolute", bottom: 20, left: 20, zIndex: 1000,
          background: "#111111ee", backdropFilter: "blur(10px)",
          border: `1px solid ${selectedType?.color || "#333"}44`,
          borderRadius: 12, padding: "16px 20px", maxWidth: 320,
          boxShadow: `0 8px 32px #00000088, 0 0 0 1px ${selectedType?.color || "#333"}22`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <span style={{ fontSize: 24 }}>{selectedType?.icon}</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: selectedType?.color }}>{form.emergencyType?.toUpperCase()}</div>
              <div style={{ fontSize: 12, color: "#888" }}>{form.title}</div>
            </div>
            {triggered && (
              <div style={{
                marginLeft: "auto", width: 10, height: 10, borderRadius: "50%",
                background: "#ff3333", boxShadow: "0 0 8px #ff3333",
                animation: "sosPulse 1s ease-in-out infinite",
              }} />
            )}
          </div>
          <p style={{ margin: "0 0 10px", fontSize: 13, color: "#aaa", lineHeight: 1.5 }}>{form.description}</p>
          <div className="sos-mono" style={{ fontSize: 11, color: "#555" }}>
            RADIUS: {form.radius}km · {form.latitude?.toFixed(4)}, {form.longitude?.toFixed(4)}
          </div>
        </div>

        {/* LIVE badge */}
        {triggered && (
          <div style={{
            position: "absolute", top: 16, right: 16, zIndex: 1000,
            background: "#ff000022", border: "1px solid #ff000066",
            borderRadius: 20, padding: "6px 16px",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ff3333", animation: "sosPulse 1s ease-in-out infinite" }} />
            <span className="sos-mono" style={{ fontSize: 12, color: "#ff6666", letterSpacing: 2 }}>LIVE</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SOSPage;