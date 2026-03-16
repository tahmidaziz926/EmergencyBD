import { useState, useEffect } from "react";
import axios from "axios";
import useAuth from "../../hooks/useAuth";
import Navbar from "../../components/Navbar";
import { Link } from "react-router-dom";

const FundRequestList = () => {
  const { token } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await axios.get("http://localhost:3001/api/fund/my-requests", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRequests(res.data);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    fetchRequests();
  }, [token]);

  const statusColor = (status) => {
    if (status === "Pending") return "#ffaa00";
    if (status === "Approved") return "#00ff88";
    if (status === "Rejected") return "#ff4444";
    return "#666666";
  };

  if (loading) return <div style={styles.loading}>Loading...</div>;

  return (
    <div style={styles.page}>
      <Navbar />
      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.title}>My Fund Requests</h2>
          <Link to="/user/fund">
            <button
              style={styles.btn}
              onMouseEnter={e => e.target.style.backgroundColor = "#00cc6a"}
              onMouseLeave={e => e.target.style.backgroundColor = "#00ff88"}
            >
              + New Request
            </button>
          </Link>
        </div>

        {requests.length === 0 ? (
          <div style={styles.empty}>No fund requests yet.</div>
        ) : (
          <div style={styles.list}>
            {requests.map(req => (
              <div key={req._id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <span style={styles.title2}>💰 {req.title}</span>
                  <span style={{ ...styles.status, color: statusColor(req.status) }}>● {req.status}</span>
                </div>
                <p style={styles.description}>{req.description}</p>
                <div style={styles.cardFooter}>
                  <span style={styles.amount}>BDT {req.amountNeeded.toLocaleString()}</span>
                  <span style={styles.date}>{new Date(req.createdAt).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  page: { backgroundColor: "#0a0a0a", minHeight: "100vh" },
  loading: { color: "#00ff88", textAlign: "center", marginTop: "100px", fontSize: "18px" },
  container: { padding: "40px 20px", maxWidth: "700px", margin: "0 auto" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" },
  title: { color: "#ffffff", fontSize: "22px", fontWeight: "600" },
  btn: {
    backgroundColor: "#00ff88", color: "#0a0a0a",
    border: "none", padding: "10px 20px", borderRadius: "8px",
    fontSize: "14px", fontWeight: "600", cursor: "pointer",
    transition: "background-color 0.3s ease",
  },
  empty: { color: "#666666", textAlign: "center", marginTop: "60px", fontSize: "16px" },
  list: { display: "flex", flexDirection: "column", gap: "16px" },
  card: {
    backgroundColor: "#111111", border: "1px solid #1e1e1e",
    borderRadius: "12px", padding: "24px",
  },
  cardHeader: { display: "flex", justifyContent: "space-between", marginBottom: "12px" },
  title2: { color: "#ffffff", fontSize: "15px", fontWeight: "600" },
  status: { fontSize: "13px", fontWeight: "500" },
  description: { color: "#cccccc", fontSize: "14px", lineHeight: "1.6", marginBottom: "16px" },
  cardFooter: { display: "flex", justifyContent: "space-between" },
  amount: { color: "#00ff88", fontSize: "14px", fontWeight: "600" },
  date: { color: "#555555", fontSize: "12px" },
};

export default FundRequestList;