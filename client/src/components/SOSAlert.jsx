import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

// ── Inject styles once ───────────────────────────────────────────────────────
const injectStyles = () => {
  if (document.getElementById("sos-alert-styles")) return;
  const s = document.createElement("style");
  s.id = "sos-alert-styles";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700&display=swap');

    @keyframes sosAlertSlide {
      from { transform:translateX(120%); opacity:0; }
      to   { transform:translateX(0);   opacity:1; }
    }
    @keyframes sosAlertDismiss {
      from { transform:translateX(0);   opacity:1; }
      to   { transform:translateX(120%); opacity:0; }
    }
    @keyframes sosAlertPulse {
      0%,100% { box-shadow:0 0 0 0 rgba(255,51,51,0.4); }
      50%     { box-shadow:0 0 0 8px rgba(255,51,51,0); }
    }
    @keyframes sosAlertProgress {
      from { width:100%; }
      to   { width:0%; }
    }
    @keyframes alertIconWave {
      0%,100% { transform:scale(1); }
      50%     { transform:scale(1.15); }
    }

    .sos-alert-card {
      font-family:'Rajdhani',sans-serif;
      animation:sosAlertSlide 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards;
    }
    .sos-alert-card.dismissing {
      animation:sosAlertDismiss 0.3s ease forwards;
    }
    .sos-alert-map-btn {
      transition:all 0.2s ease;
      cursor:pointer;
    }
    .sos-alert-map-btn:hover {
      filter:brightness(1.2);
      transform:translateY(-1px);
    }
    .sos-alert-dismiss-btn {
      transition:all 0.2s ease;
      cursor:pointer;
    }
    .sos-alert-dismiss-btn:hover { background:#2a2a2a !important; }
  `;
  document.head.appendChild(s);
};

const EMERGENCY_TYPES = {
  fire:       { icon: "🔥", color: "#ff4500", label: "Fire" },
  robbery:    { icon: "🔫", color: "#cc0000", label: "Robbery" },
  accident:   { icon: "💥", color: "#ff8c00", label: "Accident" },
  harassment: { icon: "⚠️", color: "#ffd700", label: "Harassment" },
  medical:    { icon: "🏥", color: "#00bfff", label: "Medical" },
  flood:      { icon: "🌊", color: "#1e90ff", label: "Flood" },
  other:      { icon: "🚨", color: "#ff0066", label: "Emergency" },
};

// ────────────────────────────────────────────────────────────────────────────
// SOSAlertToast — single alert card
// Props: notification, onDismiss, autoHideDuration (ms, default 12000)
// ────────────────────────────────────────────────────────────────────────────
export const SOSAlertToast = ({ notification, onDismiss, autoHideDuration = 12000 }) => {
  const navigate = useNavigate();
  const cardRef = useRef(null);
  const timerRef = useRef(null);
  const et = EMERGENCY_TYPES[notification?.data?.emergencyType] || EMERGENCY_TYPES.other;

  useEffect(() => {
    injectStyles();
    timerRef.current = setTimeout(() => handleDismiss(), autoHideDuration);
    return () => clearTimeout(timerRef.current);
  }, []);

  const handleDismiss = () => {
    if (cardRef.current) cardRef.current.classList.add("dismissing");
    setTimeout(() => onDismiss(notification._id), 300);
  };

  const handleViewMap = () => {
    handleDismiss();
    navigate(`/sos-map?id=${notification.data?.sosEventId}`);
  };

  return (
    <div
      ref={cardRef}
      className="sos-alert-card"
      style={{
        background: "#141414",
        border: `1px solid ${et.color}66`,
        borderLeft: `4px solid ${et.color}`,
        borderRadius: 12,
        padding: "14px 16px",
        marginBottom: 10,
        width: 340,
        position: "relative",
        overflow: "hidden",
        boxShadow: `0 8px 32px #00000088, 0 0 16px ${et.color}22`,
        animation: "sosAlertPulse 2s ease-in-out 2",
      }}
    >
      {/* Auto-dismiss progress bar */}
      <div style={{
        position: "absolute", bottom: 0, left: 0,
        height: 2, background: et.color,
        animation: `sosAlertProgress ${autoHideDuration}ms linear forwards`,
        opacity: 0.6,
      }} />

      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        {/* Icon */}
        <div style={{
          width: 42, height: 42, borderRadius: "50%", flexShrink: 0,
          background: `${et.color}22`, border: `2px solid ${et.color}66`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 20, animation: "alertIconWave 1.5s ease-in-out 3",
        }}>
          {et.icon}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
            <span style={{
              fontSize: 10, color: et.color, fontWeight: 700,
              letterSpacing: 1.5, background: `${et.color}18`,
              padding: "2px 8px", borderRadius: 10,
            }}>
              🆘 SOS ALERT
            </span>
          </div>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#e0e0e0", marginBottom: 4 }}>
            {notification.title}
          </div>
          <div style={{ fontSize: 12, color: "#888", lineHeight: 1.4, marginBottom: 10 }}>
            {notification.message}
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="sos-alert-map-btn"
              onClick={handleViewMap}
              style={{
                flex: 1, padding: "8px 0",
                background: `linear-gradient(135deg,${et.color}cc,${et.color}88)`,
                border: "none", borderRadius: 7,
                color: "#fff", fontSize: 12, fontWeight: 700,
                letterSpacing: 1, fontFamily: "Rajdhani,sans-serif",
              }}
            >
              🗺️ VIEW ON MAP
            </button>
            <button
              className="sos-alert-dismiss-btn"
              onClick={handleDismiss}
              style={{
                padding: "8px 14px",
                background: "#1e1e1e", border: "1px solid #333",
                borderRadius: 7, color: "#666",
                fontSize: 12, fontFamily: "Rajdhani,sans-serif",
              }}
            >
              DISMISS
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────────────────────
// SOSAlertContainer — manages multiple SOS toasts
// Place this in your App.jsx or layout component
// Usage: <SOSAlertContainer notifications={sosNotifications} onDismiss={handleDismiss} />
// ────────────────────────────────────────────────────────────────────────────
export const SOSAlertContainer = ({ notifications = [], onDismiss }) => {
  if (notifications.length === 0) return null;

  return (
    <div style={{
      position: "fixed",
      top: 20,
      right: 20,
      zIndex: 9999,
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-end",
      pointerEvents: "none",
    }}>
      {notifications.map((notif) => (
        <div key={notif._id} style={{ pointerEvents: "all" }}>
          <SOSAlertToast
            notification={notif}
            onDismiss={onDismiss}
          />
        </div>
      ))}
    </div>
  );
};

export default SOSAlertContainer;