import { useState, useEffect } from "react";
import axios from "axios";
import useAuth from "../../hooks/useAuth";
import Navbar from "../../components/Navbar";

const AdminReports = () => {
  const { token } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await axios.get("http://localhost:3001/api/admin/reports", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setReports(res.data);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    fetchReports();
  }, [token]);

  const statusColor = (status) => {
    if (status === "Pending") return "#ffaa00";
    if (status === "Verified") return "#00ff88";
    if (status === "Resolved") return "#4444ff";
    return "#666666";
  };

  if (loading) return <div style={styles.loading}>Loading...</div>;

  return (
    <div style={styles.page}>
      <Navbar />
      <div style={styles.container}>
        <h2 style={styles.title}>All Emergency Reports</h2>
        <p style={styles.subtitle}>{reports.length} total reports</p>

        {reports.length === 0 ? (
          <div style={styles.empty}>No reports yet.</div>
        ) : (
          <div style={styles.list}>
            {reports.map(report => (
              <div key={report._id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <span style={styles.type}>🚨 {report.emergencyType?.toUpperCase()}</span>
                  <span style={{ ...styles.status, color: statusColor(report.status) }}>● {report.status}</span>
                </div>
                <p style={styles.description}>{report.description}</p>
                <div style={styles.cardFooter}>
                  <span style={styles.user}>👤 {report.userId?.name} — {report.userId?.area}</span>
                  <span style={styles.date}>{new Date(report.createdAt).toLocaleString()}</span>
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
  container: { padding: "40px 20px", maxWidth: "800px", margin: "0 auto" },
  title: { color: "#ffffff", fontSize: "22px", fontWeight: "600", marginBottom: "8px" },
  subtitle: { color: "#666666", fontSize: "14px", marginBottom: "32px" },
  empty: { color: "#666666", textAlign: "center", marginTop: "60px", fontSize: "16px" },
  list: { display: "flex", flexDirection: "column", gap: "16px" },
  card: {
    backgroundColor: "#111111", border: "1px solid #1e1e1e",
    borderRadius: "12px", padding: "24px",
  },
  cardHeader: { display: "flex", justifyContent: "space-between", marginBottom: "12px" },
  type: { color: "#00ff88", fontSize: "13px", fontWeight: "600" },
  status: { fontSize: "13px", fontWeight: "500" },
  description: { color: "#cccccc", fontSize: "14px", lineHeight: "1.6", marginBottom: "16px" },
  cardFooter: { display: "flex", justifyContent: "space-between" },
  user: { color: "#aaaaaa", fontSize: "12px" },
  date: { color: "#555555", fontSize: "12px" },
};

export default AdminReports;