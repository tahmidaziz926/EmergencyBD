import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import NotificationWidget from "./NotificationWidget";

const Navbar = () => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [fundDropdownOpen, setFundDropdownOpen] = useState(false);
  const [bloodDropdownOpen, setBloodDropdownOpen] = useState(false);
  const [sosDropdownOpen, setSosDropdownOpen] = useState(false);
  const [reportDropdownOpen, setReportDropdownOpen] = useState(false);
  const [volunteerDropdownOpen, setVolunteerDropdownOpen] = useState(false);

  const dropdownRef = useRef(null);
  const bloodDropdownRef = useRef(null);
  const sosDropdownRef = useRef(null);
  const reportDropdownRef = useRef(null);
  const volunteerDropdownRef = useRef(null);

  const isBloodActive = () =>
    ["/blood/requests", "/blood/donors", "/blood/campaigns"].some(p => location.pathname === p);

  const isSosActive = () =>
    ["/user/sos", "/sos-map", "/emergency-map"].some(p => location.pathname === p);

  const isReportActive = () =>
    ["/user/emergency", "/user/emergency/list"].some(p => location.pathname === p);

  const isVolunteerActive = () =>
    ["/volunteer/opportunities", "/volunteer/list", "/volunteer/leaderboard"].some(p => location.pathname === p);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setFundDropdownOpen(false);
      if (bloodDropdownRef.current && !bloodDropdownRef.current.contains(e.target))
        setBloodDropdownOpen(false);
      if (sosDropdownRef.current && !sosDropdownRef.current.contains(e.target))
        setSosDropdownOpen(false);
      if (reportDropdownRef.current && !reportDropdownRef.current.contains(e.target))
        setReportDropdownOpen(false);
      if (volunteerDropdownRef.current && !volunteerDropdownRef.current.contains(e.target))
        setVolunteerDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    setFundDropdownOpen(false);
    setBloodDropdownOpen(false);
    setSosDropdownOpen(false);
    setReportDropdownOpen(false);
    setVolunteerDropdownOpen(false);
  }, [location.pathname]);

  const handleLogout = () => { logout(); navigate("/login"); };
  const isActive = (path) => location.pathname === path;

  const isFundActive = () =>
    ["/user/fund", "/user/fund/list", "/user/mass-funding", "/admin/mass-funding", "/admin/fund-requests"].some(
      p => location.pathname === p
    );

  // Sub-links
  const userFundSubLinks = [
    { path: "/user/mass-funding", label: "Mass Funding", icon: "🌍" },
    { path: "/user/fund", label: "Request Funds", icon: "📝" },
    { path: "/user/fund/list", label: "My Requests", icon: "📂" },
  ];
  const adminFundSubLinks = [
    { path: "/admin/mass-funding", label: "Mass Funding", icon: "🌍" },
    { path: "/admin/fund-requests", label: "Fund Requests", icon: "💰" },
  ];
  const userBloodSubLinks = [
    { path: "/blood/requests", label: "Blood Requests", icon: "🩸" },
    { path: "/blood/donors", label: "Donor List", icon: "🫀" },
    { path: "/blood/campaigns", label: "Campaigns", icon: "📢" },
  ];
  const adminBloodSubLinks = [...userBloodSubLinks];

  const sosSubLinks = [
    { path: "/user/sos", label: "Send SOS", icon: "🆘", adminHide: true },
    { path: "/sos-map", label: "Live SOS Map", icon: "📡", isLive: true },
    { path: "/emergency-map", label: "View Report Location", icon: "🗺️" },
  ];

  const userReportSubLinks = [
    { path: "/user/emergency", label: "Report Emergency", icon: "🚨" },
    { path: "/user/emergency/list", label: "My Reports", icon: "📋" },
  ];
  const adminReportSubLinks = [
    { path: "/admin/reports", label: "Reports", icon: "🚨" },
  ];

  const volunteerSubLinks = [
    { path: "/volunteer/opportunities", label: "Opportunities", icon: "🤝" },
    { path: "/volunteer/list",          label: "Volunteer List", icon: "👥" },
    { path: "/volunteer/leaderboard",   label: "Leaderboard",   icon: "🏆" },
  ];

  const fundSubLinks = role === "admin" ? adminFundSubLinks : userFundSubLinks;
  const bloodSubLinks = role === "admin" ? adminBloodSubLinks : userBloodSubLinks;
  const reportSubLinks = role === "admin" ? adminReportSubLinks : userReportSubLinks;

  const userLinks = [
    { path: "/user/profile", label: "Profile", icon: "👤" },
    { path: "/user/contacts", label: "Contacts", icon: "📞" },
  ];
  const adminLinks = [
    { path: "/admin/dashboard", label: "Dashboard", icon: "📊" },
    { path: "/admin/users", label: "Users", icon: "👥" },
    { path: "/admin/contacts", label: "Contacts", icon: "📞" },
  ];
  const links = role === "admin" ? adminLinks : userLinks;

  // Helper: compute dropdown position from ref
  const getMenuStyle = (ref) => {
    const trigger = ref.current?.querySelector(".fund-trigger");
    const rect = trigger?.getBoundingClientRect();
    return {
      top: rect ? rect.bottom + 6 : 74,
      left: rect ? rect.left + rect.width / 2 - 100 : "auto",
    };
  };

  return (
    <>
      <style>{`
        @keyframes slideDown    { from{transform:translateY(-100%);opacity:0}to{transform:translateY(0);opacity:1} }
        @keyframes float        { 0%,100%{transform:translateY(0)}50%{transform:translateY(-2px)} }
        @keyframes gradientFlow { 0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%} }
        @keyframes glowPulse    { 0%,100%{filter:drop-shadow(0 0 2px #ff3333)}50%{filter:drop-shadow(0 0 6px #ff3333)} }
        @keyframes emergencyBlink { 0%,100%{opacity:1}50%{opacity:0.7} }
        @keyframes sosPulse     { 0%,100%{box-shadow:0 0 0 0 rgba(255,0,0,0.4)}50%{box-shadow:0 0 0 6px rgba(255,0,0,0)} }
        @keyframes liveDot      { 0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.4;transform:scale(0.8)} }
        @keyframes dropIn       { from{opacity:0;transform:translateY(-8px) scale(0.97)}to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes itemFadeIn   { from{opacity:0;transform:translateX(-4px)}to{opacity:1;transform:translateX(0)} }

        .nav-link {
          color:#e0e0e0; font-size:14px; font-weight:500; text-decoration:none;
          padding:8px 12px; border-radius:10px; transition:all 0.25s ease;
          display:flex; align-items:center; gap:6px;
          background:transparent; white-space:nowrap; position:relative;
        }
        .nav-link::after {
          content:''; position:absolute; bottom:2px; left:50%; transform:translateX(-50%);
          width:0; height:2px; background:linear-gradient(90deg,#ff3333,#ff6666);
          border-radius:2px; transition:width 0.25s ease;
        }
        .nav-link:hover::after,.nav-link.active::after { width:60%; }
        .nav-link:hover  { color:#ff3333; background:rgba(255,51,51,0.04); transform:translateY(-1px); }
        .nav-link.active { color:#ff3333; background:rgba(255,51,51,0.08); font-weight:600; }
        .nav-link .link-icon { font-size:15px; transition:transform 0.2s; }
        .nav-link:hover .link-icon { transform:scale(1.1); }
        .nav-link.active .link-icon { animation:glowPulse 2s infinite; }

        .live-dot { width:6px; height:6px; border-radius:50%; background:#00ff88; animation:liveDot 1.2s ease-in-out infinite; flex-shrink:0; }

        /* ── Shared dropdown wrapper ── */
        .fund-wrap { position:relative; }

        /* ── Trigger button ── */
        .fund-trigger {
          display:flex; align-items:center; gap:6px;
          padding:8px 12px; border-radius:10px; cursor:pointer;
          color:#e0e0e0; font-size:14px; font-weight:500;
          transition:all 0.25s ease; white-space:nowrap;
          background:transparent; border:none; font-family:inherit; position:relative;
        }
        .fund-trigger::after {
          content:''; position:absolute; bottom:2px; left:50%; transform:translateX(-50%);
          width:0; height:2px; border-radius:2px; transition:width 0.25s ease;
        }
        .fund-trigger:hover::after,.fund-trigger.active::after { width:60%; }

        /* Red triggers */
        .fund-trigger.red::after { background:linear-gradient(90deg,#ff3333,#ff6666); }
        .fund-trigger.red:hover, .fund-trigger.red.open { color:#ff3333; background:rgba(255,51,51,0.06); transform:translateY(-1px); }
        .fund-trigger.red.active { color:#ff3333; background:rgba(255,51,51,0.08); font-weight:600; }

        /* Green triggers */
        .fund-trigger.green::after { background:linear-gradient(90deg,#00ff88,#00ccaa); }
        .fund-trigger.green:hover, .fund-trigger.green.open { color:#00ff88; background:rgba(0,255,136,0.06); transform:translateY(-1px); }
        .fund-trigger.green.active { color:#00ff88; background:rgba(0,255,136,0.08); font-weight:600; }

        .fund-arrow { font-size:9px; transition:transform 0.22s ease; line-height:1; opacity:0.7; }
        .fund-arrow.open { transform:rotate(180deg); }

        /* ── Dropdown menu ── */
        .fund-menu {
          position:fixed;
          background:#1e1e1e; border:1px solid #2a2a2a;
          border-radius:14px; padding:6px; min-width:200px;
          z-index:9999;
          box-shadow:0 24px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.03), 0 0 40px rgba(0,0,0,0.4);
          animation:dropIn 0.2s cubic-bezier(0.34,1.56,0.64,1);
        }

        .fund-menu-header {
          padding:4px 14px 8px;
          font-size:10px; font-weight:700; letter-spacing:1.2px;
          text-transform:uppercase; color:#444;
        }

        /* ── Menu items ── */
        .fund-menu-item {
          display:flex; align-items:center; gap:10px;
          padding:11px 14px; border-radius:9px;
          color:#888; font-size:13px; font-weight:500;
          text-decoration:none; transition:all 0.18s ease; white-space:nowrap;
          border:1px solid transparent;
        }
        .fund-menu-item:nth-child(2)  { animation:itemFadeIn 0.15s ease 0.04s both; }
        .fund-menu-item:nth-child(3)  { animation:itemFadeIn 0.15s ease 0.08s both; }
        .fund-menu-item:nth-child(4)  { animation:itemFadeIn 0.15s ease 0.12s both; }

        /* Red items */
        .fund-menu-item.red:hover  { background:rgba(255,51,51,0.08); color:#ff6666; border-color:rgba(255,51,51,0.12); transform:translateX(3px); }
        .fund-menu-item.red.active { background:rgba(255,51,51,0.10); color:#ff6666; border-color:rgba(255,51,51,0.15); font-weight:600; }

        /* Green items */
        .fund-menu-item.green:hover  { background:rgba(0,255,136,0.08); color:#00ff88; border-color:rgba(0,255,136,0.12); transform:translateX(3px); }
        .fund-menu-item.green.active { background:rgba(0,255,136,0.10); color:#00ff88; border-color:rgba(0,255,136,0.15); font-weight:600; }

        .fund-menu-divider { height:1px; background:rgba(255,255,255,0.05); margin:4px 8px; }

        /* ── Right-side elements ── */
        .logout-btn {
          background:transparent; border:1.5px solid rgba(255,51,51,0.5);
          color:#ff3333; padding:8px 16px; border-radius:40px;
          font-size:13px; font-weight:600; cursor:pointer;
          transition:all 0.3s ease; display:flex; align-items:center; gap:6px;
          white-space:nowrap; font-family:inherit;
        }
        .logout-btn:hover { border-color:#ff3333; background:rgba(255,51,51,0.05); transform:translateY(-1px); box-shadow:0 4px 16px rgba(255,51,51,0.2); }

        .logo-text {
          font-size:21px; font-weight:800;
          background:linear-gradient(135deg,#ff3333,#ff6666,#ff9999);
          background-size:200% 200%; -webkit-background-clip:text;
          -webkit-text-fill-color:transparent; animation:gradientFlow 6s ease infinite;
        }
        .logo-icon { animation:float 3s ease-in-out infinite; display:inline-block; font-size:26px; }

        .avatar-circle {
          width:36px; height:36px; background:linear-gradient(135deg,#ff3333,#ff6666);
          color:#fff; border-radius:50%; display:flex; align-items:center; justify-content:center;
          font-size:15px; font-weight:700; cursor:pointer; transition:transform 0.3s;
          border:2px solid rgba(255,255,255,0.2); flex-shrink:0;
        }
        .avatar-circle:hover { transform:scale(1.08); }

        .user-info {
          display:flex; align-items:center; gap:10px;
          background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06);
          border-radius:50px; padding:3px 14px 3px 3px;
          transition:border-color 0.3s; cursor:pointer; flex-shrink:0;
        }
        .user-info:hover { border-color:rgba(255,51,51,0.3); }
        .user-name  { color:#fff; font-size:13px; font-weight:500; }
        .user-role  { color:rgba(255,255,255,0.45); font-size:11px; display:flex; align-items:center; gap:3px; }
        .user-role::before { content:''; width:5px; height:5px; background:#ff3333; border-radius:50%; display:inline-block; animation:emergencyBlink 2s infinite; }
        .nav-divider { width:1px; height:24px; background:rgba(255,255,255,0.1); flex-shrink:0; }
        .hot-badge { background:rgba(255,51,51,0.15); color:#ff6666; padding:1px 6px; border-radius:20px; font-size:10px; font-weight:600; border:1px solid rgba(255,51,51,0.2); }
        .live-badge { background:rgba(0,255,136,0.12); color:#00ff88; padding:1px 6px; border-radius:20px; font-size:10px; font-weight:600; border:1px solid rgba(0,255,136,0.25); display:flex; align-items:center; gap:4px; }
      `}</style>

      <nav style={{
        background: isScrolled ? "#1f1f1f" : "#262626",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        padding: "0 20px",
        height: "68px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 500,
        transition: "all 0.3s ease",
        animation: "slideDown 0.5s ease",
        gap: 8,
        ...(isScrolled ? { backdropFilter: "blur(10px)", boxShadow: "0 4px 20px rgba(0,0,0,0.25)" } : {}),
      }}>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, cursor: "pointer" }}
          onClick={() => navigate(role === "admin" ? "/admin/dashboard" : "/user/profile")}>
          <span className="logo-icon">🚨</span>
          <span className="logo-text">EmergencyBD</span>
        </div>

        {/* Nav Links */}
        <div style={{ display: "flex", alignItems: "center", gap: 2, flex: 1, justifyContent: "center" }}>

          {/* Static links */}
          {links.map((link) => (
            <Link key={link.path} to={link.path}
              className={`nav-link ${isActive(link.path) ? "active" : ""}`}>
              <span className="link-icon">{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          ))}

          {/* ── Reports Dropdown ── */}
          <div className="fund-wrap" ref={reportDropdownRef}>
            <button
              className={`fund-trigger red ${isReportActive() ? "active" : ""} ${reportDropdownOpen ? "open" : ""}`}
              onClick={(e) => { e.stopPropagation(); setReportDropdownOpen(prev => !prev); }}
            >
              <span style={{ fontSize: 15 }}>🚨</span>
              <span>Reports</span>
              <span className="hot-badge">HOT</span>
              <span className={`fund-arrow ${reportDropdownOpen ? "open" : ""}`}>▾</span>
            </button>

            {reportDropdownOpen && (() => {
              const style = getMenuStyle(reportDropdownRef);
              return (
                <div className="fund-menu" style={style}>
                  <div className="fund-menu-header">Reports</div>
                  {reportSubLinks.map((sub, idx) => (
                    <div key={sub.path}>
                      {idx > 0 && <div className="fund-menu-divider" />}
                      <Link
                        to={sub.path}
                        className={`fund-menu-item red ${isActive(sub.path) ? "active" : ""}`}
                        onClick={() => setReportDropdownOpen(false)}
                      >
                        <span style={{ fontSize: 16 }}>{sub.icon}</span>
                        <span>{sub.label}</span>
                      </Link>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* ── SOS Maps Dropdown ── */}
          <div className="fund-wrap" ref={sosDropdownRef}>
            <button
              className={`fund-trigger red ${isSosActive() ? "active" : ""} ${sosDropdownOpen ? "open" : ""}`}
              onClick={(e) => { e.stopPropagation(); setSosDropdownOpen(prev => !prev); }}
            >
              <span style={{ fontSize: 15 }}>🆘</span>
              <span>SOS Maps</span>
              <span className={`fund-arrow ${sosDropdownOpen ? "open" : ""}`}>▾</span>
            </button>

            {sosDropdownOpen && (() => {
              const style = getMenuStyle(sosDropdownRef);
              const filteredSos = sosSubLinks.filter(s => !(s.adminHide && role === "admin"));
              return (
                <div className="fund-menu" style={style}>
                  <div className="fund-menu-header">SOS &amp; Maps</div>
                  {filteredSos.map((sub, idx) => (
                    <div key={sub.path}>
                      {idx > 0 && <div className="fund-menu-divider" />}
                      <Link
                        to={sub.path}
                        className={`fund-menu-item red ${isActive(sub.path) ? "active" : ""}`}
                        onClick={() => setSosDropdownOpen(false)}
                        style={{ justifyContent: "space-between" }}
                      >
                        <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: 16 }}>{sub.icon}</span>
                          <span>{sub.label}</span>
                        </span>
                        {sub.isLive && (
                          <span className="live-badge">
                            <span className="live-dot" />LIVE
                          </span>
                        )}
                      </Link>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* ── Funding Dropdown ── */}
          <div className="fund-wrap" ref={dropdownRef}>
            <button
              className={`fund-trigger green ${isFundActive() ? "active" : ""} ${fundDropdownOpen ? "open" : ""}`}
              onClick={(e) => { e.stopPropagation(); setFundDropdownOpen(prev => !prev); }}
            >
              <span style={{ fontSize: 15 }}>💰</span>
              <span>Funding</span>
              <span className={`fund-arrow ${fundDropdownOpen ? "open" : ""}`}>▾</span>
            </button>

            {fundDropdownOpen && (() => {
              const style = getMenuStyle(dropdownRef);
              return (
                <div className="fund-menu" style={style}>
                  <div className="fund-menu-header">Funding</div>
                  {fundSubLinks.map((sub, idx) => (
                    <div key={sub.path}>
                      {idx > 0 && <div className="fund-menu-divider" />}
                      <Link
                        to={sub.path}
                        className={`fund-menu-item green ${isActive(sub.path) ? "active" : ""}`}
                        onClick={() => setFundDropdownOpen(false)}
                      >
                        <span style={{ fontSize: 16 }}>{sub.icon}</span>
                        <span>{sub.label}</span>
                      </Link>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* ── Blood Dropdown ── */}
          <div className="fund-wrap" ref={bloodDropdownRef}>
            <button
              className={`fund-trigger green ${isBloodActive() ? "active" : ""} ${bloodDropdownOpen ? "open" : ""}`}
              onClick={(e) => { e.stopPropagation(); setBloodDropdownOpen(prev => !prev); }}
            >
              <span style={{ fontSize: 15 }}>🩸</span>
              <span>Blood</span>
              <span className={`fund-arrow ${bloodDropdownOpen ? "open" : ""}`}>▾</span>
            </button>

            {bloodDropdownOpen && (() => {
              const style = getMenuStyle(bloodDropdownRef);
              return (
                <div className="fund-menu" style={style}>
                  <div className="fund-menu-header">Blood Donation</div>
                  {bloodSubLinks.map((sub, idx) => (
                    <div key={sub.path}>
                      {idx > 0 && <div className="fund-menu-divider" />}
                      <Link
                        to={sub.path}
                        className={`fund-menu-item green ${isActive(sub.path) ? "active" : ""}`}
                        onClick={() => setBloodDropdownOpen(false)}
                      >
                        <span style={{ fontSize: 16 }}>{sub.icon}</span>
                        <span>{sub.label}</span>
                      </Link>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* ── Volunteer Dropdown ── */}
          <div className="fund-wrap" ref={volunteerDropdownRef}>
            <button
              className={`fund-trigger green ${isVolunteerActive() ? "active" : ""} ${volunteerDropdownOpen ? "open" : ""}`}
              onClick={(e) => { e.stopPropagation(); setVolunteerDropdownOpen(prev => !prev); }}
            >
              <span style={{ fontSize: 15 }}>🤝</span>
              <span>Volunteer</span>
              <span className={`fund-arrow ${volunteerDropdownOpen ? "open" : ""}`}>▾</span>
            </button>

            {volunteerDropdownOpen && (() => {
              const style = getMenuStyle(volunteerDropdownRef);
              return (
                <div className="fund-menu" style={style}>
                  <div className="fund-menu-header">Volunteer</div>
                  {volunteerSubLinks.map((sub, idx) => (
                    <div key={sub.path}>
                      {idx > 0 && <div className="fund-menu-divider" />}
                      <Link
                        to={sub.path}
                        className={`fund-menu-item green ${isActive(sub.path) ? "active" : ""}`}
                        onClick={() => setVolunteerDropdownOpen(false)}
                      >
                        <span style={{ fontSize: 16 }}>{sub.icon}</span>
                        <span>{sub.label}</span>
                      </Link>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

        </div>

        {/* Right Section */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <NotificationWidget />
          <div className="nav-divider" />
          {user && (
            <div className="user-info">
              <div className="avatar-circle">{user.name?.charAt(0).toUpperCase()}</div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span className="user-name">{user.name?.split(" ")[0]}</span>
                <span className="user-role">{role === "admin" ? "Admin" : "Member"}</span>
              </div>
            </div>
          )}
          <button className="logout-btn" onClick={handleLogout}>
            <span>🚪</span>
            <span>Sign Out</span>
          </button>
        </div>
      </nav>

      <div style={{
        height: "1px",
        background: "linear-gradient(90deg,transparent,rgba(255,51,51,0.3),rgba(255,51,51,0.5),rgba(255,51,51,0.3),transparent)",
        position: "fixed", top: "67px", left: 0, right: 0, zIndex: 499, pointerEvents: "none",
      }} />
    </>
  );
};

export default Navbar;