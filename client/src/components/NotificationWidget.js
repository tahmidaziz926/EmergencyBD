import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import useAuth from "../hooks/useAuth";

const NotificationWidget = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [sosCount, setSosCount] = useState(0);
  const [showSOSTooltip, setShowSOSTooltip] = useState(false);

  // Fetch normal notification count
  useEffect(() => {
    if (!token) return;
    const fetchCount = async () => {
      try {
        const res = await axios.get(
          "http://localhost:3001/api/notifications/counts",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setUnreadCount(res.data.all || 0);
      } catch (err) {
        console.error("Notification count fetch failed:", err);
      }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [token]);

  // Fetch active SOS events count separately
  useEffect(() => {
    if (!token) return;
    const fetchSOS = async () => {
      try {
        const res = await axios.get(
          "http://localhost:3001/api/sos/active",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSosCount(res.data.length || 0);
      } catch (err) {
        // silent — SOS route may not always be reachable
      }
    };
    fetchSOS();
    const interval = setInterval(fetchSOS, 15000);
    return () => clearInterval(interval);
  }, [token]);

  const hasSOS = sosCount > 0;
  const hasNotifs = unreadCount > 0;

  return (
    <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
      <style>{`
        @keyframes bellRing {
          0%, 100% { transform: rotate(0deg); }
          20%  { transform: rotate(-18deg); }
          40%  { transform: rotate(18deg); }
          60%  { transform: rotate(-12deg); }
          80%  { transform: rotate(12deg); }
        }
        @keyframes sosBellRing {
          0%, 100% { transform: rotate(0deg); }
          15%  { transform: rotate(-20deg); }
          30%  { transform: rotate(20deg); }
          45%  { transform: rotate(-14deg); }
          60%  { transform: rotate(14deg); }
          75%  { transform: rotate(-8deg); }
          90%  { transform: rotate(8deg); }
        }
        @keyframes sosBadgePulse {
          0%, 100% { transform: scale(1);   box-shadow: 0 0 0 0 rgba(255,51,51,0.6); }
          50%      { transform: scale(1.15); box-shadow: 0 0 0 5px rgba(255,51,51,0); }
        }
        @keyframes sosRing {
          0%   { transform: scale(1);   opacity: 0.8; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes tooltipFade {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes sosGlow {
          0%,100% { filter: drop-shadow(0 0 3px #ff3333); }
          50%     { filter: drop-shadow(0 0 10px #ff3333); }
        }

        .notif-bell-wrap {
          position: relative;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 6px;
          border-radius: 10px;
          transition: background 0.2s ease;
        }
        .notif-bell-wrap:hover {
          background: rgba(255,255,255,0.05);
        }
      `}</style>

      {/* SOS wave ring behind bell — only when SOS active */}
      {hasSOS && (
        <>
          <div style={{
            position: "absolute",
            width: 38, height: 38,
            borderRadius: "50%",
            border: "1.5px solid #ff3333",
            animation: "sosRing 1.8s ease-out infinite",
            pointerEvents: "none",
            zIndex: 0,
          }} />
          <div style={{
            position: "absolute",
            width: 38, height: 38,
            borderRadius: "50%",
            border: "1.5px solid #ff3333",
            animation: "sosRing 1.8s ease-out infinite 0.6s",
            pointerEvents: "none",
            zIndex: 0,
          }} />
        </>
      )}

      {/* Bell button */}
      <div
        className="notif-bell-wrap"
        style={{ zIndex: 1 }}
        onClick={() => navigate("/notifications")}
        onMouseEnter={() => hasSOS && setShowSOSTooltip(true)}
        onMouseLeave={() => setShowSOSTooltip(false)}
        title={hasSOS ? `🆘 ${sosCount} active SOS alert${sosCount > 1 ? "s" : ""}` : "View notifications"}
      >
        {/* Bell icon */}
        <span style={{
          fontSize: "22px",
          display: "block",
          lineHeight: 1,
          animation: hasSOS
            ? "sosBellRing 1.2s ease infinite, sosGlow 1.5s ease-in-out infinite"
            : hasNotifs
              ? "bellRing 2s ease infinite"
              : "none",
          transition: "filter 0.3s ease",
        }}>
          🔔
        </span>

        {/* Normal notification count badge */}
        {!hasSOS && (
          <span style={{
            position: "absolute",
            top: "-2px", right: "-2px",
            borderRadius: "50%",
            width: "17px", height: "17px",
            fontSize: "9px",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: "800", fontFamily: "inherit",
            backgroundColor: hasNotifs ? "#00ff88" : "#333333",
            color: hasNotifs ? "#0a0a0a" : "#555555",
            transition: "all 0.3s ease",
            border: "1.5px solid #111",
          }}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}

        {/* SOS badge — replaces normal badge when SOS is active */}
        {hasSOS && (
          <span style={{
            position: "absolute",
            top: "-6px", right: "-8px",
            borderRadius: "10px",
            minWidth: "20px", height: "17px",
            padding: "0 5px",
            fontSize: "9px",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "2px",
            fontWeight: "800", fontFamily: "inherit",
            backgroundColor: "#ff0000",
            color: "#ffffff",
            border: "1.5px solid #111",
            animation: "sosBadgePulse 1.2s ease-in-out infinite",
            letterSpacing: "0.3px",
            whiteSpace: "nowrap",
          }}>
            🆘 {sosCount}
          </span>
        )}
      </div>

      {/* SOS Tooltip */}
      {hasSOS && showSOSTooltip && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 10px)",
          right: 0,
          background: "#141414",
          border: "1px solid rgba(255,51,51,0.4)",
          borderRadius: 10,
          padding: "12px 14px",
          minWidth: 200,
          zIndex: 9999,
          animation: "tooltipFade 0.2s ease",
          boxShadow: "0 8px 24px rgba(0,0,0,0.5), 0 0 16px rgba(255,0,0,0.1)",
          pointerEvents: "none",
        }}>
          {/* Arrow */}
          <div style={{
            position: "absolute", top: -6, right: 14,
            width: 10, height: 10,
            background: "#141414",
            border: "1px solid rgba(255,51,51,0.4)",
            borderRight: "none", borderBottom: "none",
            transform: "rotate(45deg)",
          }} />

          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <div style={{
              width: 7, height: 7, borderRadius: "50%",
              background: "#ff3333",
              animation: "sosBadgePulse 1s ease-in-out infinite",
            }} />
            <span style={{ color: "#ff4444", fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>
              ACTIVE SOS ALERT{sosCount > 1 ? "S" : ""}
            </span>
          </div>
          <p style={{ color: "#e0e0e0", fontSize: 12, margin: "0 0 6px", fontWeight: 600 }}>
            {sosCount} emergency event{sosCount > 1 ? "s" : ""} near you
          </p>
          <p style={{ color: "#666", fontSize: 11, margin: "0 0 10px" }}>
            Click bell → check Emergency Alert category
          </p>
          <div style={{
            background: "rgba(255,51,51,0.1)",
            border: "1px solid rgba(255,51,51,0.2)",
            borderRadius: 6, padding: "5px 10px",
            color: "#ff6666", fontSize: 11, fontWeight: 600,
            textAlign: "center",
          }}>
            🗺️ View Live SOS Map →
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationWidget;