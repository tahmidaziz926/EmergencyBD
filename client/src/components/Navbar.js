import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import NotificationWidget from "./NotificationWidget";

const Navbar = () => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [hoveredLink, setHoveredLink] = useState(null);
  const [logoutHover, setLogoutHover] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Add scroll effect
  useState(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  const userLinks = [
    { path: "/user/profile", label: "Profile", icon: "👤" },
    { path: "/user/emergency", label: "Report", icon: "🚨" },
    { path: "/user/emergency/list", label: "My Reports", icon: "📋" },
    { path: "/user/fund", label: "Fund Request", icon: "💰" },
    { path: "/user/fund/list", label: "My Funds", icon: "📂" },
    { path: "/user/contacts", label: "Contacts", icon: "📞" },
    { path: "/emergency-map", label: "Map", icon: "🗺️" },
  ];

  const adminLinks = [
    { path: "/admin/dashboard", label: "Dashboard", icon: "📊" },
    { path: "/admin/reports", label: "Reports", icon: "🚨" },
    { path: "/admin/fund-requests", label: "Fund Requests", icon: "💰" },
    { path: "/admin/users", label: "Users", icon: "👥" },
    { path: "/admin/contacts", label: "Contacts", icon: "📞" },
    { path: "/emergency-map", label: "Map", icon: "🗺️" },
  ];

  const links = role === "admin" ? adminLinks : userLinks;

  return (
    <>
      <style>{`
        @keyframes slideDown {
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        @keyframes softGlow {
          0%, 100% { 
            box-shadow: 0 0 5px rgba(255, 51, 51, 0.3), 0 0 10px rgba(255, 51, 51, 0.2);
          }
          50% { 
            box-shadow: 0 0 15px rgba(255, 51, 51, 0.5), 0 0 25px rgba(255, 51, 51, 0.3);
          }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-2px); }
        }
        
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        
        @keyframes gradientFlow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        @keyframes ripple {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(2); opacity: 0; }
        }
        
        @keyframes iconBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
        
        @keyframes glowPulse {
          0%, 100% { filter: drop-shadow(0 0 2px #ff3333); }
          50% { filter: drop-shadow(0 0 6px #ff3333); }
        }
        
        @keyframes emergencyBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        .nav-link {
          color: #e0e0e0;
          font-size: 15px;
          font-weight: 500;
          text-decoration: none;
          padding: 10px 18px;
          border-radius: 12px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          gap: 8px;
          position: relative;
          background: transparent;
          margin: 0 2px;
          letter-spacing: 0.2px;
        }
        
        .nav-link::before {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 3px;
          background: linear-gradient(90deg, #ff3333, #ff6666);
          border-radius: 3px;
          transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .nav-link:hover::before {
          width: 70%;
        }
        
        .nav-link:hover {
          color: #ff3333;
          background: rgba(255, 51, 51, 0.04);
          transform: translateY(-1px);
        }
        
        .nav-link.active {
          color: #ff3333;
          background: rgba(255, 51, 51, 0.08);
          font-weight: 600;
        }
        
        .nav-link.active::before {
          width: 70%;
        }
        
        .nav-link .link-icon {
          transition: all 0.2s;
          font-size: 17px;
          opacity: 0.9;
        }
        
        .nav-link:hover .link-icon {
          transform: scale(1.1);
          opacity: 1;
        }
        
        .nav-link.active .link-icon {
          animation: glowPulse 2s infinite;
          opacity: 1;
        }
        
        .logout-btn {
          background: transparent;
          border: 1.5px solid rgba(255, 51, 51, 0.5);
          color: #ff3333;
          padding: 10px 24px;
          border-radius: 40px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          letter-spacing: 0.5px;
          position: relative;
          overflow: hidden;
          backdrop-filter: blur(5px);
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .logout-btn::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          border-radius: 50%;
          background: rgba(255, 51, 51, 0.1);
          transform: translate(-50%, -50%);
          transition: width 0.4s, height 0.4s;
          z-index: -1;
        }
        
        .logout-btn:hover::before {
          width: 300px;
          height: 300px;
        }
        
        .logout-btn:hover {
          border-color: #ff3333;
          background: rgba(255, 51, 51, 0.05);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(255, 51, 51, 0.2);
        }
        
        .logout-btn:active {
          transform: translateY(0);
        }
        
        .logo-text {
          font-size: 24px;
          font-weight: 800;
          background: linear-gradient(135deg, #ff3333, #ff6666, #ff9999);
          background-size: 200% 200%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: gradientFlow 6s ease infinite;
          letter-spacing: 1px;
        }
        
        .logo-icon {
          animation: float 3s ease-in-out infinite;
          display: inline-block;
          filter: drop-shadow(0 2px 4px rgba(255, 51, 51, 0.3));
          font-size: 32px;
        }
        
        .avatar-circle {
          width: 42px;
          height: 42px;
          background: linear-gradient(135deg, #ff3333, #ff6666);
          color: #ffffff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          font-weight: 700;
          position: relative;
          cursor: pointer;
          transition: all 0.3s;
          border: 2px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 4px 12px rgba(255, 51, 51, 0.3);
        }
        
        .avatar-circle:hover {
          transform: scale(1.08);
          border-color: rgba(255, 255, 255, 0.4);
          box-shadow: 0 6px 16px rgba(255, 51, 51, 0.4);
        }
        
        .user-info {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 50px;
          padding: 4px 18px 4px 4px;
          backdrop-filter: blur(10px);
          transition: all 0.3s;
          cursor: pointer;
        }
        
        .user-info:hover {
          border-color: rgba(255, 51, 51, 0.3);
          background: rgba(255, 255, 255, 0.05);
          transform: translateX(2px);
        }
        
        .user-name {
          color: #ffffff;
          font-size: 15px;
          font-weight: 500;
          line-height: 1.3;
          transition: all 0.2s;
        }
        
        .user-info:hover .user-name {
          color: #ff6666;
        }
        
        .user-role {
          color: rgba(255, 255, 255, 0.6);
          font-size: 12px;
          text-transform: capitalize;
          letter-spacing: 0.5px;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .user-role::before {
          content: '';
          width: 6px;
          height: 6px;
          background: #ff3333;
          border-radius: 50%;
          display: inline-block;
          animation: emergencyBlink 2s infinite;
        }
        
        .notification-widget {
          position: relative;
          cursor: pointer;
          transition: all 0.2s;
          opacity: 0.9;
        }
        
        .notification-widget:hover {
          opacity: 1;
          transform: scale(1.05);
        }
        
        .nav-divider {
          width: 1px;
          height: 30px;
          background: rgba(255, 255, 255, 0.1);
          margin: 0 15px;
        }
        
        .scrolled {
          background: rgba(38, 38, 38, 0.98) !important;
          backdrop-filter: blur(20px) !important;
          border-bottom: 1px solid rgba(255, 51, 51, 0.2) !important;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3) !important;
        }
        
        .notification-dot {
          position: absolute;
          top: -2px;
          right: -2px;
          width: 8px;
          height: 8px;
          background: #ff3333;
          border-radius: 50%;
          border: 2px solid #262626;
          animation: emergencyBlink 1.5s infinite;
        }
        
        .glass-effect {
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.03);
        }
        
        .badge {
          background: rgba(255, 51, 51, 0.15);
          color: #ff6666;
          padding: 2px 8px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          margin-left: 4px;
          border: 1px solid rgba(255, 51, 51, 0.2);
        }
      `}</style>

      <nav style={{
        ...styles.nav,
        ...(isScrolled ? styles.navScrolled : {})
      }}>
        {/* Logo with modern design */}
        <div style={styles.logo} className="logo-container">
          <span className="logo-icon" style={styles.logoIcon}>🚨</span>
          <span className="logo-text">EmergencyBD</span>
        </div>

        {/* Links with modern styling */}
        <div style={styles.linksContainer}>
          {links.map((link, index) => (
            <Link
              key={link.path}
              to={link.path}
              className={`nav-link ${isActive(link.path) ? "active" : ""}`}
              style={{ animation: `slideIn 0.3s ease ${index * 0.05}s both` }}
              onMouseEnter={() => setHoveredLink(link.path)}
              onMouseLeave={() => setHoveredLink(null)}
            >
              <span className="link-icon">{link.icon}</span>
              <span>{link.label}</span>
              {link.label === "Report" && <span className="badge">URGENT</span>}
            </Link>
          ))}
        </div>

        {/* Right Section with modern design */}
        <div style={styles.rightSection}>
          <div className="notification-widget">
            <NotificationWidget />
            <span className="notification-dot"></span>
          </div>

          <div className="nav-divider"></div>

          {user && (
            <div className="user-info">
              <div className="avatar-circle">
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <div style={styles.userDetails}>
                <span className="user-name">{user.name}</span>
                <span className="user-role">
                  {role === "admin" ? "Admin" : "Member"}
                </span>
              </div>
            </div>
          )}

          <button
            className="logout-btn"
            onClick={handleLogout}
            onMouseEnter={() => setLogoutHover(true)}
            onMouseLeave={() => setLogoutHover(false)}
          >
            <span>🚪</span>
            <span>{logoutHover ? 'Sign Out' : 'Logout'}</span>
          </button>
        </div>
      </nav>

      {/* Subtle bottom gradient line */}
      <div style={styles.bottomLine}></div>
    </>
  );
};

const styles = {
  nav: {
    background: "#262626", // Lightened black (charcoal)
    borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
    padding: "0 48px",
    height: "80px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    position: "sticky",
    top: 0,
    zIndex: 100,
    transition: "all 0.3s ease",
    animation: "slideDown 0.5s ease",
  },
  navScrolled: {
    background: "#1f1f1f", // Slightly darker when scrolled
    backdropFilter: "blur(10px)",
    height: "70px",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    minWidth: "200px",
    cursor: "pointer",
  },
  logoIcon: {
    fontSize: "32px",
    transition: "all 0.3s",
  },
  linksContainer: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginLeft: "auto",
    marginRight: "40px",
  },
  rightSection: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
  },
  userDetails: {
    display: "flex",
    flexDirection: "column",
  },
  bottomLine: {
    height: "1px",
    background: "linear-gradient(90deg, transparent, rgba(255, 51, 51, 0.2), rgba(255, 51, 51, 0.5), rgba(255, 51, 51, 0.2), transparent)",
    position: "fixed",
    top: "79px",
    left: 0,
    right: 0,
    zIndex: 99,
    pointerEvents: "none",
  },
};

export default Navbar;