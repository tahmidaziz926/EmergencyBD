import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import useAuth from "../hooks/useAuth";

const NotificationWidget = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [sosCount, setSosCount] = useState(0);
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const tooltipRef = useRef(null);

  useEffect(() => {
    if (!token) return;
    const fetchCount = async () => {
      try {
        const res = await axios.get("http://localhost:3001/api/notifications/counts", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUnreadCount(res.data.all || 0);
      } catch { }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const fetchSOS = async () => {
      try {
        const res = await axios.get("http://localhost:3001/api/sos/active", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSosCount(res.data.length || 0);
      } catch { }
    };
    fetchSOS();
    const interval = setInterval(fetchSOS, 15000);
    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    const handler = (e) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target)) {
        setTooltipOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const hasSOS = sosCount > 0;
  const hasNotifs = unreadCount > 0;

  const handleBellClick = () => {
    if (hasSOS) {
      setTooltipOpen(prev => !prev);
    } else {
      setUnreadCount(0);
      navigate("/notifications");
    }
  };

  return (
    <div ref={tooltipRef} style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
      <style>{`
        @keyframes tooltipFade {
          from { opacity:0; transform:translateY(4px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .bell-btn {
          position:relative; cursor:pointer; display:flex; align-items:center;
          justify-content:center; padding:7px; border-radius:10px;
          transition:background 0.2s; background:none; border:none;
        }
        .bell-btn:hover { background:rgba(255,255,255,0.05); }
      `}</style>

      <button className="bell-btn" onClick={handleBellClick}
        title={hasSOS ? `${sosCount} active SOS` : hasNotifs ? `${unreadCount} unread notifications` : "Notifications"}>

        <span style={{ fontSize: "22px", display: "block", lineHeight: 1 }}>🔔</span>

        {hasSOS ? (
          <span style={{
            position: "absolute", top: "-5px", right: "-8px",
            borderRadius: "10px", minWidth: "20px", height: "16px",
            padding: "0 4px", fontSize: "9px",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "2px",
            fontWeight: "800", fontFamily: "inherit",
            backgroundColor: "#ff0000", color: "#fff",
            border: "1.5px solid #1a1a1a", whiteSpace: "nowrap",
          }}>
            🆘 {sosCount}
          </span>
        ) : (
          <span style={{
            position: "absolute", top: "-2px", right: "-2px",
            borderRadius: "50%", width: "17px", height: "17px", fontSize: "9px",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: "800", fontFamily: "inherit",
            backgroundColor: hasNotifs ? "#00ff88" : "#333",
            color: hasNotifs ? "#0a0a0a" : "#555",
            border: "1.5px solid #262626", transition: "all 0.3s ease",
          }}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {hasSOS && tooltipOpen && (
        <div style={{
          position: "absolute", top: "calc(100% + 12px)", right: 0,
          background: "#141414", border: "1px solid rgba(255,51,51,0.3)",
          borderRadius: 12, padding: "16px", minWidth: 220, zIndex: 9999,
          animation: "tooltipFade 0.2s ease",
          boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
        }}>
          <div style={{ position: "absolute", top: -6, right: 14, width: 10, height: 10, background: "#141414", border: "1px solid rgba(255,51,51,0.3)", borderRight: "none", borderBottom: "none", transform: "rotate(45deg)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#ff3333" }} />
            <span style={{ color: "#ff4444", fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>
              {sosCount} ACTIVE SOS ALERT{sosCount > 1 ? "S" : ""}
            </span>
          </div>
          <p style={{ color: "#e0e0e0", fontSize: 13, margin: "0 0 4px", fontWeight: 600 }}>Emergency near your area</p>
          <p style={{ color: "#555", fontSize: 12, margin: "0 0 14px", lineHeight: 1.5 }}>
            {sosCount} active event{sosCount > 1 ? "s" : ""}. Responders have been alerted.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button onClick={() => { setTooltipOpen(false); navigate("/sos-map"); }}
              style={{ padding: "9px 14px", background: "rgba(255,51,51,0.1)", border: "1px solid rgba(255,51,51,0.3)", borderRadius: 8, color: "#ff6666", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
              🗺️ View Live SOS Map
            </button>
            <button onClick={() => { setTooltipOpen(false); setUnreadCount(0); navigate("/notifications"); }}
              style={{ padding: "9px 14px", background: "rgba(0,255,136,0.06)", border: "1px solid rgba(0,255,136,0.2)", borderRadius: 8, color: "#00ff88", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
              🔔 Notifications{hasNotifs ? ` (${unreadCount})` : ""}
            </button>
            <button onClick={() => setTooltipOpen(false)}
              style={{ padding: "7px 14px", background: "none", border: "1px solid #222", borderRadius: 8, color: "#555", fontSize: 12, cursor: "pointer", fontFamily: "inherit", textAlign: "center" }}>
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationWidget;