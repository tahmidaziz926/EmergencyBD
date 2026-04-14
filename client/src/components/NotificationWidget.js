import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import useAuth from "../hooks/useAuth";

const NotificationWidget = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

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

  return (
    <div
      style={styles.container}
      onClick={() => navigate("/notifications")}
      title="View notifications"
    >
      <style>{`
        @keyframes bellRing {
          0%, 100% { transform: rotate(0deg); }
          20% { transform: rotate(-15deg); }
          40% { transform: rotate(15deg); }
          60% { transform: rotate(-10deg); }
          80% { transform: rotate(10deg); }
        }
      `}</style>
      <span style={{
        fontSize: "20px",
        display: "block",
        animation: unreadCount > 0 ? "bellRing 2s ease infinite" : "none",
      }}>
        {"🔔"}
      </span>
      <span style={{
        ...styles.badge,
        backgroundColor: unreadCount > 0 ? "#00ff88" : "#333333",
        color: unreadCount > 0 ? "#0a0a0a" : "#555555",
      }}>
        {unreadCount > 9 ? "9+" : unreadCount}
      </span>
    </div>
  );
};

const styles = {
  container: {
    position: "relative",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: "-6px", right: "-6px",
    borderRadius: "50%",
    width: "16px", height: "16px",
    fontSize: "9px",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: "800", fontFamily: "inherit",
    transition: "all 0.3s ease",
  },
};

export default NotificationWidget;