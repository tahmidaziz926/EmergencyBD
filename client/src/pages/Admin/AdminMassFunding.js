import { useState, useEffect } from "react";
import axios from "axios";
import useAuth from "../../hooks/useAuth";
import Navbar from "../../components/Navbar";

const API = "http://localhost:3001/api";

const STATUS_CONFIG = {
  Pending:  { color:"#ffaa00", bg:"rgba(255,170,0,0.08)",  border:"rgba(255,170,0,0.2)",  icon:"⏳" },
  Approved: { color:"#00ff88", bg:"rgba(0,255,136,0.08)",  border:"rgba(0,255,136,0.2)",  icon:"✅" },
  Rejected: { color:"#ff4444", bg:"rgba(255,68,68,0.08)",  border:"rgba(255,68,68,0.2)",  icon:"❌" },
};

const timeAgo = (date) => {
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return `${Math.floor(diff/86400)}d ago`;
};

const ProgressBar = ({ raised=0, goal }) => {
  const pct = Math.min(goal>0 ? (raised/goal)*100 : 0, 100);
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
        <span style={{ color:"#00ff88", fontSize:12, fontWeight:700 }}>৳{raised.toLocaleString()} raised</span>
        <span style={{ color:"#444", fontSize:11 }}>of ৳{goal.toLocaleString()}</span>
      </div>
      <div style={{ height:6, background:"#222", borderRadius:3, overflow:"hidden" }}>
        <div style={{ height:"100%", borderRadius:3, width:`${pct}%`, background:"linear-gradient(90deg,#00cc6a,#00ff88)", transition:"width 0.8s ease" }} />
      </div>
      <span style={{ color:"#444", fontSize:11 }}>{pct.toFixed(0)}% funded</span>
    </div>
  );
};

const AdminMassFunding = () => {
  const { token } = useAuth();
  const [funds, setFunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/fund/mass/all`, { headers: { Authorization:`Bearer ${token}` } });
      setFunds(res.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleStatus = async (id, status) => {
    setUpdating(true);
    try {
      const res = await axios.patch(`${API}/fund/mass/${id}/status`, { status }, { headers: { Authorization:`Bearer ${token}` } });
      setFunds(prev => prev.map(f => f._id===id ? { ...f, status } : f));
      setSelected(prev => prev?._id===id ? { ...prev, status } : prev);
      setSuccessMsg(`Status updated to ${status}`);
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) { console.error(err); }
    setUpdating(false);
  };

  const stats = {
    total: funds.length,
    pending: funds.filter(f => f.status==="Pending").length,
    approved: funds.filter(f => f.status==="Approved").length,
    rejected: funds.filter(f => f.status==="Rejected").length,
    totalGoal: funds.reduce((s,f) => s+f.goalAmount, 0),
    totalRaised: funds.reduce((s,f) => s+(f.amountRaised||0), 0),
  };

  const displayed = funds
    .filter(f => filter==="all" || f.status===filter)
    .filter(f => !search ||
      f.title.toLowerCase().includes(search.toLowerCase()) ||
      (f.userId?.name||"").toLowerCase().includes(search.toLowerCase()) ||
      (f.area||"").toLowerCase().includes(search.toLowerCase())
    );

  if (loading) return (
    <div style={{ background:"#111", minHeight:"100vh" }}>
      <Navbar />
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"60vh", gap:14 }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <div style={{ width:36,height:36,border:"3px solid rgba(0,255,136,0.1)",borderTop:"3px solid #00ff88",borderRadius:"50%",animation:"spin 0.8s linear infinite" }} />
        <p style={{ color:"#00ff88", fontSize:14 }}>Loading mass fund requests...</p>
      </div>
    </div>
  );

  return (
    <div style={{ background:"#111", minHeight:"100vh" }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
        .mf-card{transition:all 0.22s ease;cursor:pointer;}
        .mf-card:hover{transform:translateY(-2px);border-color:rgba(0,255,136,0.15)!important;box-shadow:0 10px 28px rgba(0,0,0,0.3)!important;}
        .mf-card.sel{border-color:#00ff88!important;background:rgba(0,255,136,0.02)!important;}
        .st-btn{transition:all 0.2s ease;cursor:pointer;font-family:inherit;}
        .st-btn:hover:not(:disabled){transform:translateY(-1px);}
        .st-btn:disabled{opacity:0.45;cursor:not-allowed;}
        input:focus,select:focus{border-color:#00ff88!important;outline:none!important;}
      `}</style>

      <Navbar />

      <div style={{ display:"flex", minHeight:"calc(100vh - 68px)" }}>

        {/* Left sidebar */}
        <div style={{ width:230, minWidth:230, background:"#0d0d0d", borderRight:"1px solid #1e1e1e", padding:"24px 18px", display:"flex", flexDirection:"column", gap:16, overflowY:"auto" }}>
          <div style={{ paddingBottom:16, borderBottom:"1px solid #1e1e1e" }}>
            <h2 style={{ color:"#fff", fontSize:17, fontWeight:700, margin:0 }}>Mass Funding</h2>
            <p style={{ color:"#444", fontSize:12, margin:"4px 0 0" }}>{funds.length} total requests</p>
          </div>

          {/* Stats */}
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            <p style={{ color:"#333", fontSize:10, fontWeight:700, letterSpacing:1 }}>OVERVIEW</p>
            {[
              { label:"Pending Review", value:stats.pending, color:"#ffaa00" },
              { label:"Approved", value:stats.approved, color:"#00ff88" },
              { label:"Rejected", value:stats.rejected, color:"#ff4444" },
            ].map((s,i) => (
              <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"8px 10px", background:"#1a1a1a", borderRadius:8 }}>
                <span style={{ color:"#555", fontSize:12 }}>{s.label}</span>
                <span style={{ color:s.color, fontWeight:700, fontSize:13 }}>{s.value}</span>
              </div>
            ))}
            <div style={{ padding:"10px", background:"rgba(0,255,136,0.05)", border:"1px solid rgba(0,255,136,0.15)", borderRadius:8, marginTop:4 }}>
              <p style={{ color:"#444", fontSize:10, marginBottom:4 }}>TOTAL RAISED</p>
              <p style={{ color:"#00ff88", fontWeight:700, fontSize:15 }}>৳{stats.totalRaised.toLocaleString()}</p>
              <p style={{ color:"#333", fontSize:10 }}>of ৳{stats.totalGoal.toLocaleString()} goal</p>
            </div>
          </div>

          {/* Filter */}
          <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
            <p style={{ color:"#333", fontSize:10, fontWeight:700, letterSpacing:1 }}>FILTER STATUS</p>
            {["all","Pending","Approved","Rejected"].map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{
                display:"flex", justifyContent:"space-between", alignItems:"center",
                padding:"9px 10px", borderRadius:8, border:`1px solid ${filter===f ? "rgba(0,255,136,0.2)" : "transparent"}`,
                background: filter===f ? "rgba(0,255,136,0.08)" : "transparent",
                color: filter===f ? "#00ff88" : "#555",
                fontSize:13, cursor:"pointer", fontFamily:"inherit", width:"100%",
              }}>
                <span>{f==="all" ? "🗂 All" : `${STATUS_CONFIG[f].icon} ${f}`}</span>
                <span style={{ background:"#222", color:"#444", fontSize:10, padding:"1px 7px", borderRadius:10 }}>
                  {f==="all" ? funds.length : funds.filter(x=>x.status===f).length}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Middle: list */}
        <div style={{ flex:1, borderRight:"1px solid #1e1e1e", overflowY:"auto" }}>
          {/* Search bar */}
          <div style={{ padding:"16px 20px", borderBottom:"1px solid #1a1a1a", display:"flex", alignItems:"center", gap:10, background:"#111", position:"sticky", top:0, zIndex:10 }}>
            <span style={{ color:"#444" }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by title, user, or area..."
              style={{ background:"none", border:"none", color:"#e0e0e0", fontSize:13, width:"100%", outline:"none", fontFamily:"inherit" }} />
          </div>

          {successMsg && (
            <div style={{ margin:"12px 20px", padding:"10px 14px", background:"rgba(0,255,136,0.08)", border:"1px solid rgba(0,255,136,0.2)", borderRadius:8, color:"#00ff88", fontSize:13 }}>
              ✅ {successMsg}
            </div>
          )}

          {displayed.length === 0 ? (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"60%", gap:12, padding:40 }}>
              <div style={{ fontSize:40, opacity:0.2 }}>🌍</div>
              <p style={{ color:"#444", fontSize:14 }}>No mass fund requests found</p>
            </div>
          ) : (
            displayed.map((fund, i) => {
              const sc = STATUS_CONFIG[fund.status] || STATUS_CONFIG.Pending;
              const isSel = selected?._id === fund._id;
              return (
                <div key={fund._id} className={`mf-card ${isSel?"sel":""}`}
                  onClick={() => setSelected(isSel ? null : fund)}
                  style={{ padding:"18px 20px", borderBottom:"1px solid #1a1a1a", border:"1px solid transparent", borderBottomColor:"#1a1a1a", animation:`fadeUp 0.3s ease ${i*0.04}s both` }}>

                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                    <div style={{ flex:1, minWidth:0, paddingRight:10 }}>
                      <p style={{ color:"#e0e0e0", fontSize:14, fontWeight:700, margin:"0 0 3px", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{fund.title}</p>
                      <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                        <span style={{ color:"#555", fontSize:12 }}>👤 {fund.userId?.name || "Unknown"}</span>
                        {fund.area && <span style={{ color:"#333", fontSize:11 }}>📍 {fund.area}</span>}
                        <span style={{ color:"#2a2a2a", fontSize:11 }}>{timeAgo(fund.createdAt)}</span>
                      </div>
                    </div>
                    <span style={{ padding:"4px 10px", borderRadius:20, fontSize:11, fontWeight:700, background:sc.bg, color:sc.color, border:`1px solid ${sc.border}`, flexShrink:0 }}>
                      {sc.icon} {fund.status}
                    </span>
                  </div>

                  <p style={{ color:"#666", fontSize:12, lineHeight:1.5, margin:"0 0 10px", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>{fund.description}</p>

                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span style={{ color:"#00ff88", fontSize:13, fontWeight:700 }}>Goal: ৳{fund.goalAmount.toLocaleString()}</span>
                    {fund.status === "Approved" && (
                      <span style={{ color:"#6bcbff", fontSize:12 }}>Raised: ৳{(fund.amountRaised||0).toLocaleString()}</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right: detail panel */}
        <div style={{ width:320, minWidth:320, background:"#0d0d0d", overflowY:"auto", padding:"24px 20px" }}>
          {selected ? (
            <div style={{ animation:"slideIn 0.25s ease" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
                <h3 style={{ color:"#fff", fontSize:15, fontWeight:700, margin:0 }}>Request Details</h3>
                <button onClick={() => setSelected(null)} style={{ background:"#1a1a1a", border:"1px solid #222", color:"#666", width:26, height:26, borderRadius:"50%", cursor:"pointer", fontSize:12, display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
              </div>

              {/* Goal amount */}
              <div style={{ background:"rgba(0,255,136,0.05)", border:"1px solid rgba(0,255,136,0.15)", borderRadius:12, padding:"14px", textAlign:"center", marginBottom:14 }}>
                <p style={{ color:"#444", fontSize:10, marginBottom:6, letterSpacing:0.8 }}>GOAL AMOUNT</p>
                <p style={{ color:"#00ff88", fontSize:22, fontWeight:800 }}>৳{selected.goalAmount.toLocaleString()}</p>
                {selected.status === "Approved" && <ProgressBar raised={selected.amountRaised||0} goal={selected.goalAmount} />}
              </div>

              {/* Status update */}
              <div style={{ background:"#1a1a1a", border:"1px solid #222", borderRadius:12, padding:"16px", marginBottom:14 }}>
                <p style={{ color:"#fff", fontSize:13, fontWeight:700, marginBottom:8 }}>🔄 Update Status</p>
                <p style={{ color:"#555", fontSize:12, marginBottom:12 }}>
                  Current: <span style={{ color:STATUS_CONFIG[selected.status]?.color, fontWeight:700 }}>{STATUS_CONFIG[selected.status]?.icon} {selected.status}</span>
                </p>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {["Approved","Rejected","Pending"].map(s => {
                    const sc = STATUS_CONFIG[s];
                    const isCurrent = selected.status === s;
                    return (
                      <button key={s} className="st-btn" disabled={isCurrent || updating}
                        onClick={() => handleStatus(selected._id, s)}
                        style={{
                          padding:"10px 14px", borderRadius:8,
                          border:`1.5px solid ${sc.color}${isCurrent?"":"66"}`,
                          background: isCurrent ? sc.color : `${sc.color}10`,
                          color: isCurrent ? "#0a0a0a" : sc.color,
                          fontSize:13, fontWeight:700, display:"flex", alignItems:"center", gap:8,
                        }}>
                        <span>{sc.icon}</span>
                        <span>{updating && !isCurrent ? "Updating..." : s}{isCurrent ? " ✓ Current" : ""}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Description */}
              <div style={{ marginBottom:14 }}>
                <p style={{ color:"#333", fontSize:10, fontWeight:600, letterSpacing:0.8, marginBottom:6 }}>DESCRIPTION</p>
                <p style={{ color:"#ccc", fontSize:13, lineHeight:1.7, background:"#1a1a1a", border:"1px solid #222", borderRadius:10, padding:"12px" }}>{selected.description}</p>
              </div>

              {/* Images */}
              {selected.images?.length > 0 && (
                <div style={{ marginBottom:14 }}>
                  <p style={{ color:"#333", fontSize:10, fontWeight:600, letterSpacing:0.8, marginBottom:8 }}>IMAGES</p>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
                    {selected.images.map((img,i) => (
                      <img key={i} src={img} alt="" style={{ width:"100%", height:80, objectFit:"cover", borderRadius:8, border:"1px solid #222" }} />
                    ))}
                  </div>
                </div>
              )}

              {/* Documents */}
              {selected.documents?.length > 0 && (
                <div style={{ marginBottom:14 }}>
                  <p style={{ color:"#333", fontSize:10, fontWeight:600, letterSpacing:0.8, marginBottom:6 }}>DOCUMENTS</p>
                  {selected.documents.map((doc,i) => (
                    <a key={i} href={doc} target="_blank" rel="noreferrer" style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 10px", background:"#1a1a1a", border:"1px solid #222", borderRadius:8, color:"#6bcbff", fontSize:12, textDecoration:"none", marginBottom:5 }}>
                      📄 Document {i+1}
                    </a>
                  ))}
                </div>
              )}

              {/* Meta info */}
              <div style={{ background:"#1a1a1a", border:"1px solid #222", borderRadius:12, padding:"14px", display:"flex", flexDirection:"column", gap:8 }}>
                {[
                  ["Requester", selected.userId?.name || "Unknown"],
                  ["Email", selected.userId?.email || "N/A"],
                  ["Contact", selected.contactNumber],
                  ["Area", selected.area],
                  ["Donors", `${selected.donations?.length || 0} people`],
                  ["Submitted", new Date(selected.createdAt).toLocaleDateString("en-US", { year:"numeric", month:"long", day:"numeric" })],
                ].map(([l,v],i) => (
                  <div key={i} style={{ display:"flex", justifyContent:"space-between" }}>
                    <span style={{ color:"#444", fontSize:12 }}>{l}</span>
                    <span style={{ color:"#e0e0e0", fontSize:12, fontWeight:500, textAlign:"right", maxWidth:160 }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", gap:12, textAlign:"center", padding:20 }}>
              <div style={{ fontSize:32, opacity:0.2 }}>👆</div>
              <p style={{ color:"#333", fontSize:13 }}>Select a request to review and approve or reject it</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminMassFunding;