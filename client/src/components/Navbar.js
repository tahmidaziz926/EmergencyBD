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
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setFundDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => { setFundDropdownOpen(false); }, [location.pathname]);

  const handleLogout = () => { logout(); navigate("/login"); };
  const isActive = (path) => location.pathname === path;
  const isFundActive = () =>
    ["/user/fund", "/user/fund/list", "/user/mass-funding", "/admin/mass-funding", "/admin/fund-requests"].some(p => location.pathname === p);

  const userFundSubLinks = [
    { path: "/user/mass-funding", label: "Mass Funding", icon: "🌍" },
    { path: "/user/fund",         label: "Request Funds", icon: "📝" },
    { path: "/user/fund/list",    label: "My Requests",   icon: "📂" },
  ];

  const adminFundSubLinks = [
    { path: "/admin/mass-funding",   label: "Mass Funding",   icon: "🌍" },
    { path: "/admin/fund-requests",  label: "Fund Requests",  icon: "💰" },
  ];

  const userLinks = [
    { path: "/user/profile",        label: "Profile",    icon: "👤" },
    { path: "/user/emergency",      label: "Report",     icon: "🚨" },
    { path: "/user/emergency/list", label: "My Reports", icon: "📋" },
    { path: "/user/contacts",       label: "Contacts",   icon: "📞" },
    { path: "/emergency-map",       label: "Map",        icon: "🗺️" },
    { path: "/user/sos",            label: "SOS",        icon: "🆘", isSOS: true },
    { path: "/sos-map",             label: "Live SOS",   icon: "📡", isLive: true },
  ];

  const adminLinks = [
    { path: "/admin/dashboard", label: "Dashboard", icon: "📊" },
    { path: "/admin/reports",   label: "Reports",   icon: "🚨" },
    { path: "/admin/users",     label: "Users",     icon: "👥" },
    { path: "/admin/contacts",  label: "Contacts",  icon: "📞" },
    { path: "/emergency-map",   label: "Map",       icon: "🗺️" },
    { path: "/sos-map",         label: "Live SOS",  icon: "📡", isLive: true },
  ];

  const fundSubLinks = role === "admin" ? adminFundSubLinks : userFundSubLinks;
  const links = role === "admin" ? adminLinks : userLinks;

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
        @keyframes dropIn       { from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)} }

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

        .nav-link-sos {
          color:#fff; font-size:13px; font-weight:700; text-decoration:none;
          padding:7px 14px; border-radius:30px;
          background:linear-gradient(135deg,#cc0000,#ff0000);
          border:1.5px solid #ff000066;
          display:flex; align-items:center; gap:6px;
          letter-spacing:0.8px; transition:all 0.3s ease;
          animation:sosPulse 2s ease-in-out infinite; white-space:nowrap;
        }
        .nav-link-sos:hover { transform:translateY(-2px) scale(1.03); box-shadow:0 6px 20px rgba(255,0,0,0.4); }

        .nav-link-live {
          color:#00ff88; font-size:13px; font-weight:600; text-decoration:none;
          padding:7px 12px; border-radius:30px;
          background:rgba(0,255,136,0.08); border:1.5px solid rgba(0,255,136,0.3);
          display:flex; align-items:center; gap:6px;
          transition:all 0.3s ease; white-space:nowrap;
        }
        .nav-link-live:hover { background:rgba(0,255,136,0.15); border-color:rgba(0,255,136,0.6); transform:translateY(-2px); color:#00ff88; }
        .nav-link-live.active { background:rgba(0,255,136,0.15); border-color:#00ff88; }
        .live-dot { width:6px; height:6px; border-radius:50%; background:#00ff88; animation:liveDot 1.2s ease-in-out infinite; flex-shrink:0; }

        /* Funding dropdown — fixed position so it never shifts the navbar */
        .fund-wrap { position:relative; }

        .fund-trigger {
          display:flex; align-items:center; gap:6px;
          padding:8px 12px; border-radius:10px; cursor:pointer;
          color:#e0e0e0; font-size:14px; font-weight:500;
          transition:color 0.2s, background 0.2s; white-space:nowrap;
          background:transparent; border:none; font-family:inherit;
        }
        .fund-trigger:hover  { color:#00ff88; background:rgba(0,255,136,0.06); }
        .fund-trigger.active { color:#00ff88; background:rgba(0,255,136,0.08); font-weight:600; }
        .fund-trigger.open   { color:#00ff88; background:rgba(0,255,136,0.08); }

        .fund-arrow { font-size:10px; transition:transform 0.22s ease; line-height:1; }
        .fund-arrow.open { transform:rotate(180deg); }

        /* Dropdown uses position:fixed so it never pushes layout */
        .fund-menu {
          position:fixed;
          background:#1a1a1a; border:1px solid #2e2e2e;
          border-radius:12px; padding:6px; min-width:190px;
          z-index:9999; box-shadow:0 20px 50px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.03);
          animation:dropIn 0.18s ease;
        }
        .fund-menu-item {
          display:flex; align-items:center; gap:10px;
          padding:11px 14px; border-radius:8px;
          color:#999; font-size:13px; font-weight:500;
          text-decoration:none; transition:all 0.18s ease; white-space:nowrap;
        }
        .fund-menu-item:hover  { background:rgba(0,255,136,0.08); color:#00ff88; }
        .fund-menu-item.active { background:rgba(0,255,136,0.12); color:#00ff88; font-weight:600; }
        .fund-menu-divider { height:1px; background:#252525; margin:4px 8px; }

        /* Logout button — always says Sign Out */
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

          {links.map((link) => {
            if (link.isLive) return (
              <Link key={link.path} to={link.path} className={`nav-link-live ${isActive(link.path) ? "active" : ""}`}>
                <span className="live-dot" /><span>{link.icon}</span><span>{link.label}</span>
              </Link>
            );
            if (link.isSOS) return (
              <Link key={link.path} to={link.path} className={`nav-link-sos ${isActive(link.path) ? "active" : ""}`}>
                <span>{link.icon}</span><span>{link.label}</span>
              </Link>
            );
            return (
              <Link key={link.path} to={link.path} className={`nav-link ${isActive(link.path) ? "active" : ""}`}>
                <span className="link-icon">{link.icon}</span>
                <span>{link.label}</span>
                {link.label === "Report" && <span className="hot-badge">HOT</span>}
              </Link>
            );
          })}

          {/* Funding Dropdown — position:fixed menu so it never shifts the bar */}
          <div className="fund-wrap" ref={dropdownRef}>
            <button
              className={`fund-trigger ${isFundActive() ? "active" : ""} ${fundDropdownOpen ? "open" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                setFundDropdownOpen(prev => !prev);
              }}
            >
              <span style={{ fontSize: 15 }}>💰</span>
              <span>Funding</span>
              <span className={`fund-arrow ${fundDropdownOpen ? "open" : ""}`}>▾</span>
            </button>

            {fundDropdownOpen && (() => {
              // Calculate position of the trigger button for fixed positioning
              const trigger = dropdownRef.current?.querySelector(".fund-trigger");
              const rect = trigger?.getBoundingClientRect();
              return (
                <div className="fund-menu" style={{
                  top: rect ? rect.bottom + 6 : 74,
                  left: rect ? rect.left + rect.width / 2 - 95 : "auto",
                }}>
                  {fundSubLinks.map((sub, idx) => (
                    <div key={sub.path}>
                      {idx > 0 && <div className="fund-menu-divider" />}
                      <Link
                        to={sub.path}
                        className={`fund-menu-item ${isActive(sub.path) ? "active" : ""}`}
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
          {/* Logout always shows "Sign Out" */}
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