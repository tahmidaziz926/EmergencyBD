import { useState, useEffect } from "react";
import axios from "axios";
import useAuth from "../../hooks/useAuth";
import Navbar from "../../components/Navbar";
import { Link } from "react-router-dom";

const STATUS_CONFIG = {
  Pending:  { color: "#ffaa00", bg: "rgba(255,170,0,0.08)",  border: "rgba(255,170,0,0.2)",  icon: "⏳" },
  Approved: { color: "#00ff88", bg: "rgba(0,255,136,0.08)",  border: "rgba(0,255,136,0.2)",  icon: "✅" },
  Rejected: { color: "#ff4444", bg: "rgba(255,68,68,0.08)",  border: "rgba(255,68,68,0.2)",  icon: "❌" },
};

const ProgressBar = ({ raised = 0, needed, status }) => {
  if (status !== "Approved") return null;
  const pct = Math.min(needed > 0 ? (raised / needed) * 100 : 0, 100);
  const isComplete = raised >= needed;
  return (
    <div style={{ marginTop: 4 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ color: "#00cc6a", fontSize: 13, fontWeight: 700 }}>
          {isComplete ? "🎉 " : "💚 "}৳{raised.toLocaleString()} raised
        </span>
        <span style={{ color: "#444", fontSize: 12 }}>of ৳{needed.toLocaleString()}</span>
      </div>
      <div style={{ height: 7, background: "#1e1e1e", borderRadius: 4, overflow: "hidden" }}>
        <div style={{
          height: "100%", borderRadius: 4,
          background: "linear-gradient(90deg,#00cc6a,#00ff88)",
          width: `${pct}%`, transition: "width 1s ease",
          boxShadow: "0 0 8px rgba(0,255,136,0.4)",
        }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
        <span style={{ color: "#444", fontSize: 11 }}>{pct.toFixed(0)}% funded</span>
        {!isComplete
          ? <span style={{ color: "#333", fontSize: 11 }}>৳{(needed - raised).toLocaleString()} remaining</span>
          : <span style={{ color: "#00ff88", fontSize: 11, fontWeight: 600 }}>Goal reached!</span>}
      </div>
    </div>
  );
};

const FundRequestList = () => {
  const { token } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await axios.get("http://localhost:3001/api/fund/my-requests", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRequests(res.data);
      } catch (err) { console.error(err); }
      setLoading(false);
    };
    fetchRequests();
  }, [token]);

  const filtered = filter === "all" ? requests : requests.filter(r => r.status === filter);
  const stats = {
    total: requests.length,
    approved: requests.filter(r => r.status === "Approved").length,
    pending: requests.filter(r => r.status === "Pending").length,
    totalRaised: requests.reduce((s, r) => s + (r.amountRaised || 0), 0),
  };

  if (loading) return (
    <div style={{ background: "#111", minHeight: "100vh" }}>
      <Navbar />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", flexDirection: "column", gap: 12 }}>
        <div style={{ width: 36, height: 36, border: "3px solid rgba(0,255,136,0.1)", borderTop: "3px solid #00ff88", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <p style={{ color: "#00ff88", fontSize: 14 }}>Loading...</p>
      </div>
    </div>
  );

  return (
    <div style={{ background: "#111", minHeight: "100vh" }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        .req-card{transition:all 0.25s ease;}
        .req-card:hover{transform:translateY(-3px);box-shadow:0 12px 32px rgba(0,0,0,0.3)!important;}
        .filter-tab{transition:all 0.2s ease;cursor:pointer;}
        .filter-tab:hover{border-color:#00ff88!important;color:#00ff88!important;}
      `}</style>
      <Navbar />
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "36px 24px" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
          <div>
            <h2 style={{ color: "#fff", fontSize: 24, fontWeight: 700, margin: "0 0 6px" }}>My Fund Requests</h2>
            <p style={{ color: "#555", fontSize: 13, margin: 0 }}>Track your funding campaigns and donations received</p>
          </div>
          <Link to="/user/fund" style={{ textDecoration: "none" }}>
            <button style={{ background: "linear-gradient(135deg,#00ff88,#00cc6a)", color: "#0a0a0a", border: "none", padding: "10px 20px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              + New Request
            </button>
          </Link>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Total Requests", value: stats.total,    color: "#e0e0e0" },
            { label: "Approved",       value: stats.approved, color: "#00ff88" },
            { label: "Pending",        value: stats.pending,  color: "#ffaa00" },
            { label: "Total Raised",   value: `৳${stats.totalRaised.toLocaleString()}`, color: "#6bcbff" },
          ].map((s, i) => (
            <div key={i} style={{ background: "#1a1a1a", border: "1px solid #222", borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ color: s.color, fontWeight: 700, fontSize: 20 }}>{s.value}</div>
              <div style={{ color: "#555", fontSize: 11, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {["all", "Pending", "Approved", "Rejected"].map(f => (
            <button key={f} className="filter-tab" onClick={() => setFilter(f)} style={{
              padding: "7px 16px", borderRadius: 20, fontSize: 13,
              background: filter === f ? "rgba(0,255,136,0.1)" : "#1a1a1a",
              border: `1px solid ${filter === f ? "#00ff88" : "#2a2a2a"}`,
              color: filter === f ? "#00ff88" : "#666",
              fontFamily: "inherit", fontWeight: 600,
            }}>
              {f === "all" ? "All" : `${STATUS_CONFIG[f].icon} ${f}`}
              {f !== "all" && <span style={{ marginLeft: 6, fontSize: 11, color: filter === f ? "#00ff8899" : "#333" }}>{requests.filter(r => r.status === f).length}</span>}
            </button>
          ))}
        </div>

        {/* Cards */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", border: "1px dashed #1e1e1e", borderRadius: 16 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>💸</div>
            <p style={{ color: "#00ff88", fontWeight: 700, fontSize: 16, marginBottom: 6 }}>No requests found</p>
            <p style={{ color: "#444", fontSize: 13 }}>{filter === "all" ? "You haven't submitted any fund requests yet." : `No ${filter} requests.`}</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {filtered.map((req, idx) => {
              const sc = STATUS_CONFIG[req.status] || STATUS_CONFIG.Pending;
              return (
                <div key={req._id} className="req-card" style={{
                  background: "#1a1a1a", border: "1px solid #222", borderLeft: `4px solid ${sc.color}`,
                  borderRadius: 14, padding: "22px 24px", boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
                  animation: `fadeUp 0.3s ease ${idx * 0.05}s both`,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div style={{ flex: 1, minWidth: 0, paddingRight: 12 }}>
                      <h3 style={{ color: "#e0e0e0", fontSize: 16, fontWeight: 700, margin: "0 0 4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>💰 {req.title}</h3>
                      <span style={{ color: "#444", fontSize: 11 }}>{new Date(req.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 20, background: sc.bg, border: `1px solid ${sc.border}`, flexShrink: 0 }}>
                      <span style={{ fontSize: 12 }}>{sc.icon}</span>
                      <span style={{ color: sc.color, fontSize: 12, fontWeight: 700 }}>{req.status}</span>
                    </div>
                  </div>
                  <p style={{ color: "#777", fontSize: 13, lineHeight: 1.6, margin: "0 0 16px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{req.description}</p>
                  <div style={{ borderTop: "1px solid #222", paddingTop: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: req.status === "Approved" ? 10 : 0 }}>
                      <div>
                        <div style={{ color: "#555", fontSize: 11, marginBottom: 2 }}>TARGET AMOUNT</div>
                        <div style={{ color: "#00ff88", fontWeight: 800, fontSize: 18 }}>৳{req.amountNeeded.toLocaleString()}</div>
                      </div>
                      {req.status === "Approved" && (
                        <div style={{ textAlign: "right" }}>
                          <div style={{ color: "#555", fontSize: 11, marginBottom: 2 }}>RAISED SO FAR</div>
                          <div style={{ color: "#6bcbff", fontWeight: 800, fontSize: 18 }}>৳{(req.amountRaised || 0).toLocaleString()}</div>
                        </div>
                      )}
                    </div>
                    <ProgressBar raised={req.amountRaised || 0} needed={req.amountNeeded} status={req.status} />
                    {req.status === "Pending" && (
                      <div style={{ marginTop: 8, padding: "8px 12px", background: "rgba(255,170,0,0.05)", border: "1px solid rgba(255,170,0,0.15)", borderRadius: 8, color: "#ffaa0099", fontSize: 12 }}>
                        ⏳ Awaiting admin review. Progress bar will appear once approved.
                      </div>
                    )}
                    {req.status === "Rejected" && (
                      <div style={{ marginTop: 8, padding: "8px 12px", background: "rgba(255,68,68,0.05)", border: "1px solid rgba(255,68,68,0.15)", borderRadius: 8, color: "#ff444499", fontSize: 12 }}>
                        ❌ This request was not approved. You may submit a new request.
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default FundRequestList;