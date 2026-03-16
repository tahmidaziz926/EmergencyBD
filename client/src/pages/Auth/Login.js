import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../../services/authService";
import useAuth from "../../hooks/useAuth";

const NexusBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let animationId;
    let width, height;
    const nodes = [];
    const NUM_NODES = 80;

    const resize = () => {
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };

    const initNodes = () => {
      nodes.length = 0;
      for (let i = 0; i < NUM_NODES; i++) {
        nodes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35,
          r: Math.random() * 1.5 + 0.8,
          pulse: Math.random() * Math.PI * 2,
          connections: 0,
        });
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Wave lines in background
      for (let w = 0; w < 4; w++) {
        ctx.beginPath();
        ctx.moveTo(0, height * 0.15 + w * height * 0.22);
        for (let x = 0; x <= width; x += 3) {
          const y =
            height * 0.15 +
            w * height * 0.22 +
            Math.sin((x / width) * Math.PI * 4 + Date.now() * 0.0005 + w * 1.2) * 25 +
            Math.sin((x / width) * Math.PI * 7 + Date.now() * 0.0003 + w * 0.6) * 12;
          ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `rgba(0, 255, 136, ${0.025 + w * 0.01})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Update node positions
      nodes.forEach(node => {
        node.x += node.vx;
        node.y += node.vy;
        node.pulse += 0.025;
        node.connections = 0;
        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;
        node.x = Math.max(0, Math.min(width, node.x));
        node.y = Math.max(0, Math.min(height, node.y));
      });

      // Draw connections between nodes
      const MAX_DIST = 150;
      const MAX_CONNECTIONS = 4;

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          if (nodes[i].connections >= MAX_CONNECTIONS) break;
          if (nodes[j].connections >= MAX_CONNECTIONS) continue;

          const dx = nodes[j].x - nodes[i].x;
          const dy = nodes[j].y - nodes[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < MAX_DIST) {
            const alpha = (1 - dist / MAX_DIST) * 0.25;

            const lineGrad = ctx.createLinearGradient(
              nodes[i].x, nodes[i].y,
              nodes[j].x, nodes[j].y
            );
            lineGrad.addColorStop(0, `rgba(0,255,136,${alpha})`);
            lineGrad.addColorStop(0.5, `rgba(0,255,136,${alpha * 1.5})`);
            lineGrad.addColorStop(1, `rgba(0,255,136,${alpha})`);

            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = lineGrad;
            ctx.lineWidth = 0.7;
            ctx.stroke();

            nodes[i].connections++;
            nodes[j].connections++;

            // Moving data packet along line
            const t = (Date.now() * 0.0008 + i * 0.3) % 1;
            const px = nodes[i].x + dx * t;
            const py = nodes[i].y + dy * t;
            const packetAlpha = Math.sin(t * Math.PI) * 0.9;

            ctx.beginPath();
            ctx.arc(px, py, 1.5, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0,255,136,${packetAlpha})`;
            ctx.fill();
          }
        }
      }

      // Draw nodes
      nodes.forEach((node) => {
        const pulseR = Math.max(0.1, node.r + Math.sin(node.pulse) * 0.8);
        const glowR = Math.max(0.1, pulseR * 7);

        const grad = ctx.createRadialGradient(
          node.x, node.y, 0,
          node.x, node.y, glowR
        );
        grad.addColorStop(0, `rgba(0,255,136,${0.15 + node.connections * 0.05})`);
        grad.addColorStop(0.4, "rgba(0,255,136,0.04)");
        grad.addColorStop(1, "rgba(0,255,136,0)");

        ctx.beginPath();
        ctx.arc(node.x, node.y, glowR, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        if (node.connections >= 3) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, pulseR * 3, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(0,255,136,${0.1 + node.connections * 0.04})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(node.x, node.y, pulseR, 0, Math.PI * 2);
        ctx.fillStyle = node.connections >= 2
          ? "rgba(0,255,136,0.9)"
          : "rgba(0,255,136,0.5)";
        ctx.fill();

        ctx.beginPath();
        ctx.arc(node.x, node.y, Math.max(0.1, pulseR * 0.4), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${0.3 + node.connections * 0.1})`;
        ctx.fill();
      });

      animationId = requestAnimationFrame(draw);
    };

    resize();
    initNodes();
    draw();

    const handleResize = () => { resize(); initNodes(); };
    window.addEventListener("resize", handleResize);
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        top: 0, left: 0,
        width: "100%", height: "100%",
        pointerEvents: "none",
      }}
    />
  );
};

const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await loginUser(form);
      login(res.data.token, res.data.role, { name: res.data.name });
      if (res.data.role === "admin") navigate("/admin/dashboard");
      else navigate("/user/profile");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
    setLoading(false);
  };

  return (
    <div style={styles.page}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideInRight { from { opacity: 0; transform: translateX(50px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes slideInLeft { from { opacity: 0; transform: translateX(-50px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes pulse { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.4); opacity: 0.6; } }
        @keyframes glow { 0%,100% { box-shadow: 0 0 20px rgba(0,255,136,0.2); } 50% { box-shadow: 0 0 50px rgba(0,255,136,0.6); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes scanLine {
          0% { top: 0%; opacity: 0.5; }
          100% { top: 100%; opacity: 0; }
        }

        .feature-card { transition: all 0.3s ease !important; }
        .feature-card:hover {
          transform: translateY(-6px) !important;
          border-color: rgba(0,255,136,0.35) !important;
          box-shadow: 0 20px 40px rgba(0,0,0,0.5) !important;
        }
        .cta-btn { transition: all 0.3s ease !important; }
        .cta-btn:hover {
          transform: translateY(-2px) !important;
          box-shadow: 0 12px 35px rgba(0,255,136,0.45) !important;
          background-color: #00e67a !important;
        }
        .outline-btn { transition: all 0.3s ease !important; }
        .outline-btn:hover {
          border-color: #00ff88 !important;
          color: #00ff88 !important;
        }
        .stat-item { transition: all 0.3s ease !important; }
        .stat-item:hover { transform: translateY(-3px) !important; }
        .input-wrap input:focus {
          border-color: #00ff88 !important;
          box-shadow: 0 0 0 3px rgba(0,255,136,0.08) !important;
          outline: none !important;
          background-color: #161616 !important;
        }
        .login-btn { transition: all 0.3s ease !important; }
        .login-btn:hover:not(:disabled) {
          transform: translateY(-2px) !important;
          box-shadow: 0 10px 28px rgba(0,255,136,0.45) !important;
          background-color: #00e67a !important;
        }
        .nav-btn { transition: all 0.3s ease !important; }
        .nav-btn:hover { border-color: #00ff88 !important; color: #00ff88 !important; }
        .type-card { transition: all 0.3s ease !important; }
        .type-card:hover {
          transform: translateY(-5px) !important;
          box-shadow: 0 16px 32px rgba(0,0,0,0.4) !important;
        }
        .visual-row { transition: all 0.2s ease !important; }
        .visual-row:hover { background-color: #0a0a0a !important; }
      `}</style>

      {!showLogin ? (

        /* ========== LANDING PAGE ========== */
        <div style={styles.landing}>

          {/* Navbar */}
          <nav style={styles.nav}>
            <div style={styles.navLogo}>
              <span style={styles.navLogoIcon}>🚨</span>
              <span style={styles.navLogoText}>EmergencyBD</span>
            </div>
            <div style={styles.navRight}>
              <button className="nav-btn" style={styles.navOutlineBtn} onClick={() => navigate("/register")}>
                Register
              </button>
              <button className="cta-btn" style={styles.navSolidBtn} onClick={() => setShowLogin(true)}>
                Sign In
              </button>
            </div>
          </nav>

          {/* HERO */}
          <div style={styles.hero}>
            <NexusBackground />
            <div style={styles.cornerTL} />
            <div style={styles.cornerBR} />
            <div style={styles.scanLine} />

            <div style={styles.heroContent}>
              <div style={styles.heroBadge}>
                <span style={styles.heroBadgeDot} />
                <span style={styles.heroBadgeText}>Bangladesh's Emergency Response Platform</span>
              </div>

              <h1 style={styles.heroTitle}>
                <span style={styles.heroTitleSmall}>Welcome to</span>
                <span style={styles.heroTitleBig}>EmergencyBD</span>
              </h1>

              <p style={styles.heroDesc}>
                Report emergencies, request community funds, and get help — fast, secure,
                and always available. Connecting communities when they need it most.
              </p>

              <div style={styles.heroBtns}>
                <button className="cta-btn" style={styles.primaryBtn} onClick={() => setShowLogin(true)}>
                  Get Started →
                </button>
                <button className="outline-btn" style={styles.outlineBtn} onClick={() => navigate("/register")}>
                  Create Account
                </button>
              </div>

              <div style={styles.heroStats}>
                {[
                  { v: "24/7", l: "Always On" },
                  { v: "5+", l: "Emergency Types" },
                  { v: "Fast", l: "Response" },
                  { v: "Secure", l: "& Encrypted" },
                ].map((s, i) => (
                  <div key={i} className="stat-item" style={styles.heroStat}>
                    <span style={styles.heroStatVal}>{s.v}</span>
                    <span style={styles.heroStatLabel}>{s.l}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Live feed card */}
            <div style={styles.heroCard}>
              <div style={styles.heroCardHeader}>
                <div style={styles.cardDots}>
                  {["#ff5f57","#ffbd2e","#28ca41"].map((c, i) => (
                    <span key={i} style={{ ...styles.dot, backgroundColor: c }} />
                  ))}
                </div>
                <span style={styles.cardHeaderLabel}>live_feed.json</span>
                <span style={styles.cardStatusDot} />
              </div>

              <div style={styles.heroCardBody}>
                {[
                  { icon: "🔥", type: "Fire", area: "Mirpur, Dhaka", status: "Pending", color: "#ff9f43" },
                  { icon: "🏥", type: "Medical", area: "Gulshan, Dhaka", status: "Verified", color: "#00ff88" },
                  { icon: "🚗", type: "Accident", area: "Dhanmondi", status: "Resolved", color: "#6bcbff" },
                  { icon: "🔫", type: "Robbery", area: "Uttara, Dhaka", status: "Pending", color: "#ff6b6b" },
                ].map((row, i) => (
                  <div key={i} className="visual-row" style={{ ...styles.feedRow, animationDelay: `${i * 0.15}s` }}>
                    <div style={{ ...styles.feedRowIcon, backgroundColor: `${row.color}12` }}>
                      {row.icon}
                    </div>
                    <div style={styles.feedRowInfo}>
                      <p style={styles.feedRowType}>{row.type}</p>
                      <p style={styles.feedRowArea}>{row.area}</p>
                    </div>
                    <span style={{ ...styles.feedRowStatus, color: row.color }}>
                      ● {row.status}
                    </span>
                  </div>
                ))}
              </div>

              <div style={styles.heroCardFooter}>
                <span style={styles.footerActive}>● System Active</span>
                <span style={styles.footerCursor}>|</span>
              </div>
            </div>
          </div>

          {/* FEATURES */}
          <div style={styles.featuresSection}>
            <div style={styles.sectionInner}>
              <div style={styles.sectionTag}>Platform Features</div>
              <h2 style={styles.sectionTitle}>Everything You Need</h2>
              <p style={styles.sectionDesc}>Comprehensive emergency management built for Bangladesh</p>

              <div style={styles.featuresGrid}>
                {[
                  { icon: "🚨", title: "Emergency Reporting", color: "#ff6b6b", desc: "Report robberies, fires, accidents, harassment, and medical emergencies with location and image support." },
                  { icon: "💰", title: "Fund Requests", color: "#00ff88", desc: "Request emergency community funds transparently. Reviewed by admins, distributed fairly and fast." },
                  { icon: "🛡️", title: "Admin Control", color: "#6bcbff", desc: "Powerful admin panel to verify reports, approve funds, and keep communities safe around the clock." },
                  { icon: "🔔", title: "Real-time Alerts", color: "#ffd93d", desc: "Get notified about emergencies near you. Radius-based push notifications coming in Phase 3." },
                  { icon: "📊", title: "Analytics", color: "#a29bfe", desc: "Track emergency hotspots, resolution rates, and fund distributions across Bangladesh in real time." },
                  { icon: "🔒", title: "Secure by Design", color: "#ff9f43", desc: "JWT authentication, role-based access, and end-to-end encryption keep your data protected." },
                ].map((f, i) => (
                  <div key={i} className="feature-card" style={styles.featureCard}>
                    <div style={{ ...styles.featureIcon, backgroundColor: `${f.color}10`, border: `1px solid ${f.color}20` }}>
                      {f.icon}
                    </div>
                    <h3 style={styles.featureTitle}>{f.title}</h3>
                    <p style={styles.featureDesc}>{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* EMERGENCY TYPES */}
          <div style={styles.typesSection}>
            <div style={styles.sectionInner}>
              <h2 style={styles.sectionTitle}>Emergencies We Cover</h2>
              <div style={styles.typesGrid}>
                {[
                  { icon: "🔫", label: "Robbery", color: "#ff6b6b", desc: "Armed & unarmed theft" },
                  { icon: "🔥", label: "Fire", color: "#ff9f43", desc: "Fire & explosion" },
                  { icon: "🚗", label: "Accident", color: "#ffd93d", desc: "Road & vehicle" },
                  { icon: "⚠️", label: "Harassment", color: "#a29bfe", desc: "Physical & verbal" },
                  { icon: "🏥", label: "Medical", color: "#00ff88", desc: "Health emergency" },
                ].map((t, i) => (
                  <div key={i} className="type-card" style={{ ...styles.typeCard, borderColor: `${t.color}20` }}>
                    <div style={{ ...styles.typeIcon, backgroundColor: `${t.color}10` }}>{t.icon}</div>
                    <p style={{ ...styles.typeLabel, color: t.color }}>{t.label}</p>
                    <p style={styles.typeDesc}>{t.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CTA */}
          <div style={styles.ctaSection}>
            <NexusBackground />
            <div style={styles.cornerTL} />
            <div style={styles.cornerBR} />
            <div style={styles.ctaContent}>
              <h2 style={styles.ctaTitle}>Ready to Help Your Community?</h2>
              <p style={styles.ctaDesc}>Join EmergencyBD — free, fast, and always available</p>
              <div style={styles.ctaBtns}>
                <button className="cta-btn" style={styles.primaryBtn} onClick={() => setShowLogin(true)}>
                  Sign In Now
                </button>
                <button className="outline-btn" style={styles.outlineBtn} onClick={() => navigate("/register")}>
                  Create Free Account
                </button>
              </div>
            </div>
          </div>

          {/* FOOTER */}
          <div style={styles.footer}>
            <span style={styles.footerLogo}>🚨 EmergencyBD</span>
            <span style={styles.footerCopy}>© 2026 EmergencyBD. Built for Bangladesh.</span>
          </div>
        </div>

      ) : (

        /* ========== LOGIN PAGE ========== */
        <div style={styles.loginPage}>

          {/* Left panel */}
          <div style={styles.loginLeft}>
            <NexusBackground />
            <div style={styles.cornerTL} />
            <div style={styles.cornerBR} />
            <div style={styles.scanLine} />

            <div style={styles.loginLeftInner}>
              <button style={styles.backBtn} onClick={() => setShowLogin(false)}>
                ← Back
              </button>

              <div style={styles.loginBrand}>
                <div style={styles.loginBrandIcon}>🚨</div>
                <h1 style={styles.loginBrandTitle}>EmergencyBD</h1>
                <p style={styles.loginBrandSub}>Bangladesh's Emergency Response Platform</p>
              </div>

              <div style={styles.loginFeatures}>
                {[
                  { icon: "⚡", text: "Instant emergency reporting" },
                  { icon: "💰", text: "Community fund requests" },
                  { icon: "🛡️", text: "Role-based secure access" },
                  { icon: "🔔", text: "Real-time notifications (Phase 3)" },
                ].map((f, i) => (
                  <div key={i} style={styles.loginFeatureRow}>
                    <div style={styles.loginFeatureIconBox}>{f.icon}</div>
                    <span style={styles.loginFeatureText}>{f.text}</span>
                  </div>
                ))}
              </div>

              <div style={styles.loginLeftBottom}>
                <p style={styles.loginLeftBottomText}>No account yet?</p>
                <Link to="/register" style={styles.loginLeftBottomLink}>
                  Create one free →
                </Link>
              </div>
            </div>
          </div>

          {/* Right panel */}
          <div style={styles.loginRight}>
            <div style={styles.loginFormWrap}>

              <div style={styles.loginFormTop}>
                <h2 style={styles.loginFormTitle}>Welcome Back</h2>
                <p style={styles.loginFormSub}>Sign in to your EmergencyBD account</p>
              </div>

              {error && (
                <div style={styles.errorBox}>
                  <span>⚠️</span> {error}
                </div>
              )}

              <form onSubmit={handleSubmit} style={styles.loginForm}>
                <div style={styles.field}>
                  <label style={styles.fieldLabel}>Email Address</label>
                  <div className="input-wrap">
                    <input
                      type="email"
                      name="email"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={handleChange}
                      required
                      style={styles.input}
                    />
                  </div>
                </div>

                <div style={styles.field}>
                  <label style={styles.fieldLabel}>Password</label>
                  <div className="input-wrap" style={{ position: "relative" }}>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="••••••••"
                      value={form.password}
                      onChange={handleChange}
                      required
                      style={{ ...styles.input, paddingRight: "44px" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={styles.eyeBtn}
                    >
                      {showPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="login-btn"
                  style={styles.loginSubmitBtn}
                  disabled={loading}
                >
                  {loading ? (
                    <span style={styles.loadingRow}>
                      <span style={styles.btnSpinner} /> Signing in...
                    </span>
                  ) : "Sign In →"}
                </button>
              </form>

              <div style={styles.divider}>
                <div style={styles.dividerLine} />
                <span style={styles.dividerLabel}>or</span>
                <div style={styles.dividerLine} />
              </div>

              <Link to="/register" style={{ textDecoration: "none" }}>
                <button className="outline-btn" style={styles.registerBtn}>
                  Create Free Account
                </button>
              </Link>

              <div style={styles.typeIcons}>
                {["🔫","🔥","🚗","⚠️","🏥"].map((icon, i) => (
                  <div key={i} style={styles.typeIconBox}>{icon}</div>
                ))}
              </div>
              <p style={styles.typeIconsLabel}>Report any emergency, anytime</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  page: { backgroundColor: "#080808", minHeight: "100vh" },

  landing: { display: "flex", flexDirection: "column", minHeight: "100vh" },

  // NAV
  nav: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "18px 60px",
    borderBottom: "1px solid #111111",
    backgroundColor: "rgba(8,8,8,0.95)",
    backdropFilter: "blur(12px)",
    position: "sticky", top: 0, zIndex: 100,
    animation: "fadeDown 0.5s ease",
  },
  navLogo: { display: "flex", alignItems: "center", gap: "10px" },
  navLogoIcon: { fontSize: "22px" },
  navLogoText: { color: "#00ff88", fontSize: "18px", fontWeight: "700", letterSpacing: "1px" },
  navRight: { display: "flex", gap: "10px", alignItems: "center" },
  navOutlineBtn: {
    backgroundColor: "transparent", border: "1px solid #222222",
    color: "#666666", padding: "8px 20px", borderRadius: "7px",
    fontSize: "13px", cursor: "pointer", fontFamily: "inherit",
  },
  navSolidBtn: {
    backgroundColor: "#00ff88", color: "#080808",
    border: "none", padding: "8px 22px", borderRadius: "7px",
    fontSize: "13px", fontWeight: "700", cursor: "pointer", fontFamily: "inherit",
  },

  // HERO
  hero: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "90px 60px",
    minHeight: "92vh",
    position: "relative", overflow: "hidden",
    backgroundColor: "#080808",
  },
  cornerTL: {
    position: "absolute", top: "20px", left: "20px",
    width: "36px", height: "36px",
    borderTop: "1px solid rgba(0,255,136,0.25)",
    borderLeft: "1px solid rgba(0,255,136,0.25)",
    pointerEvents: "none",
  },
  cornerBR: {
    position: "absolute", bottom: "20px", right: "20px",
    width: "36px", height: "36px",
    borderBottom: "1px solid rgba(0,255,136,0.25)",
    borderRight: "1px solid rgba(0,255,136,0.25)",
    pointerEvents: "none",
  },
  scanLine: {
    position: "absolute", left: 0, right: 0, height: "1px",
    background: "linear-gradient(90deg, transparent 0%, rgba(0,255,136,0.25) 50%, transparent 100%)",
    animation: "scanLine 7s linear infinite",
    pointerEvents: "none", zIndex: 0,
  },
  heroContent: {
    flex: 1, maxWidth: "540px", zIndex: 1,
    display: "flex", flexDirection: "column", gap: "28px",
    animation: "slideInLeft 0.7s ease",
  },
  heroBadge: {
    display: "inline-flex", alignItems: "center", gap: "8px",
    backgroundColor: "rgba(0,255,136,0.06)",
    border: "1px solid rgba(0,255,136,0.12)",
    borderRadius: "20px", padding: "5px 14px", width: "fit-content",
  },
  heroBadgeDot: {
    width: "6px", height: "6px", borderRadius: "50%",
    backgroundColor: "#00ff88", display: "inline-block",
    animation: "pulse 2s ease-in-out infinite",
  },
  heroBadgeText: { color: "#00ff88", fontSize: "11px", fontWeight: "600", letterSpacing: "0.8px" },
  heroTitle: { display: "flex", flexDirection: "column", gap: "2px" },
  heroTitleSmall: {
    color: "#333333", fontSize: "16px", fontWeight: "400",
    letterSpacing: "4px", textTransform: "uppercase", display: "block",
  },
  heroTitleBig: {
    display: "block", fontSize: "62px", fontWeight: "800",
    lineHeight: "1.05", letterSpacing: "-1px",
    background: "linear-gradient(135deg, #ffffff 20%, #00ff88 100%)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
  },
  heroDesc: { color: "#4a4a4a", fontSize: "15px", lineHeight: "1.8", maxWidth: "440px" },
  heroBtns: { display: "flex", gap: "12px" },
  primaryBtn: {
    backgroundColor: "#00ff88", color: "#080808",
    border: "none", padding: "14px 28px",
    borderRadius: "8px", fontSize: "14px",
    fontWeight: "700", cursor: "pointer", fontFamily: "inherit",
    letterSpacing: "0.3px",
  },
  outlineBtn: {
    backgroundColor: "transparent", border: "1px solid #222222",
    color: "#666666", padding: "14px 24px",
    borderRadius: "8px", fontSize: "14px",
    cursor: "pointer", fontFamily: "inherit",
  },
  heroStats: {
    display: "flex", gap: "28px",
    paddingTop: "20px", borderTop: "1px solid #111111",
  },
  heroStat: { display: "flex", flexDirection: "column", gap: "4px", cursor: "default" },
  heroStatVal: { color: "#00ff88", fontSize: "17px", fontWeight: "700", letterSpacing: "0.3px" },
  heroStatLabel: { color: "#333333", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px" },

  // HERO CARD
  heroCard: {
    zIndex: 1, width: "300px", flexShrink: 0,
    backgroundColor: "#0d0d0d",
    border: "1px solid rgba(0,255,136,0.12)",
    borderRadius: "12px", overflow: "hidden",
    boxShadow: "0 0 60px rgba(0,255,136,0.06), 0 40px 80px rgba(0,0,0,0.7)",
    animation: "slideInRight 0.7s ease",
  },
  heroCardHeader: {
    display: "flex", alignItems: "center", gap: "10px",
    padding: "11px 14px",
    backgroundColor: "#080808", borderBottom: "1px solid #111111",
  },
  cardDots: { display: "flex", gap: "5px" },
  dot: { width: "8px", height: "8px", borderRadius: "50%" },
  cardHeaderLabel: { color: "#2a2a2a", fontSize: "10px", letterSpacing: "1px", flex: 1 },
  cardStatusDot: {
    width: "6px", height: "6px", borderRadius: "50%",
    backgroundColor: "#00ff88", animation: "pulse 2s infinite",
  },
  heroCardBody: { padding: "10px", display: "flex", flexDirection: "column", gap: "5px" },
  feedRow: {
    display: "flex", alignItems: "center", gap: "10px",
    padding: "10px", borderRadius: "8px",
    backgroundColor: "#080808", border: "1px solid #0f0f0f",
    animation: "fadeUp 0.4s ease both", cursor: "default",
  },
  feedRowIcon: {
    width: "30px", height: "30px", borderRadius: "7px",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "13px", flexShrink: 0,
  },
  feedRowInfo: { flex: 1 },
  feedRowType: { color: "#cccccc", fontSize: "11px", fontWeight: "600" },
  feedRowArea: { color: "#333333", fontSize: "10px", marginTop: "1px" },
  feedRowStatus: { fontSize: "10px", fontWeight: "600", flexShrink: 0 },
  heroCardFooter: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "9px 14px", borderTop: "1px solid #0f0f0f",
    backgroundColor: "#080808",
  },
  footerActive: { color: "#00ff88", fontSize: "10px", letterSpacing: "0.5px" },
  footerCursor: { color: "#00ff88", fontSize: "13px", animation: "blink 1s infinite" },

  // FEATURES
  featuresSection: {
    backgroundColor: "#0a0a0a",
    borderTop: "1px solid #111111", borderBottom: "1px solid #111111",
    padding: "90px 60px",
  },
  sectionInner: {
    maxWidth: "1200px", margin: "0 auto",
    display: "flex", flexDirection: "column", alignItems: "center", gap: "52px",
  },
  sectionTag: {
    backgroundColor: "rgba(0,255,136,0.06)",
    border: "1px solid rgba(0,255,136,0.12)",
    color: "#00ff88", fontSize: "10px",
    fontWeight: "700", letterSpacing: "2px",
    padding: "5px 14px", borderRadius: "20px", textTransform: "uppercase",
  },
  sectionTitle: {
    color: "#ffffff", fontSize: "34px",
    fontWeight: "700", textAlign: "center", marginTop: "-36px",
  },
  sectionDesc: {
    color: "#3a3a3a", fontSize: "15px",
    textAlign: "center", marginTop: "-36px",
  },
  featuresGrid: {
    display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
    gap: "16px", width: "100%",
  },
  featureCard: {
    backgroundColor: "#0d0d0d", border: "1px solid #141414",
    borderRadius: "14px", padding: "28px",
    display: "flex", flexDirection: "column", gap: "14px",
  },
  featureIcon: {
    width: "48px", height: "48px", borderRadius: "12px",
    display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px",
  },
  featureTitle: { color: "#e0e0e0", fontSize: "15px", fontWeight: "700" },
  featureDesc: { color: "#3a3a3a", fontSize: "13px", lineHeight: "1.7" },

  // TYPES
  typesSection: { backgroundColor: "#080808", padding: "90px 60px" },
  typesGrid: {
    display: "grid", gridTemplateColumns: "repeat(5, 1fr)",
    gap: "14px", width: "100%",
  },
  typeCard: {
    backgroundColor: "#0d0d0d", border: "1px solid",
    borderRadius: "12px", padding: "24px 16px",
    display: "flex", flexDirection: "column",
    alignItems: "center", gap: "10px", textAlign: "center",
  },
  typeIcon: {
    width: "52px", height: "52px", borderRadius: "14px",
    display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px",
  },
  typeLabel: { fontSize: "14px", fontWeight: "700" },
  typeDesc: { color: "#333333", fontSize: "11px" },

  // CTA
  ctaSection: {
    backgroundColor: "#080808",
    borderTop: "1px solid #111111", borderBottom: "1px solid #111111",
    padding: "100px 60px", textAlign: "center",
    position: "relative", overflow: "hidden",
  },
  ctaContent: {
    position: "relative", zIndex: 1,
    display: "flex", flexDirection: "column", alignItems: "center", gap: "20px",
  },
  ctaTitle: { color: "#ffffff", fontSize: "34px", fontWeight: "700" },
  ctaDesc: { color: "#3a3a3a", fontSize: "15px" },
  ctaBtns: { display: "flex", gap: "12px", marginTop: "8px" },

  // FOOTER
  footer: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "22px 60px", borderTop: "1px solid #0f0f0f",
    backgroundColor: "#080808",
  },
  footerLogo: { color: "#00ff88", fontSize: "15px", fontWeight: "700" },
  footerCopy: { color: "#222222", fontSize: "12px" },

  // LOGIN PAGE
  loginPage: { display: "flex", minHeight: "100vh", animation: "fadeIn 0.4s ease" },

  loginLeft: {
    width: "44%", minWidth: "380px",
    backgroundColor: "#080808",
    borderRight: "1px solid #111111",
    display: "flex", flexDirection: "column",
    position: "relative", overflow: "hidden",
  },
  loginLeftInner: {
    flex: 1, padding: "40px",
    display: "flex", flexDirection: "column",
    position: "relative", zIndex: 1,
  },
  backBtn: {
    backgroundColor: "transparent",
    border: "1px solid rgba(0,255,136,0.15)",
    color: "#00ff88", padding: "7px 14px",
    borderRadius: "7px", fontSize: "12px",
    cursor: "pointer", fontFamily: "inherit",
    width: "fit-content", transition: "all 0.3s ease",
    letterSpacing: "0.3px",
  },
  loginBrand: {
    display: "flex", flexDirection: "column", gap: "12px",
    margin: "48px 0 40px",
  },
  loginBrandIcon: {
    width: "56px", height: "56px",
    backgroundColor: "rgba(0,255,136,0.08)",
    border: "1px solid rgba(0,255,136,0.2)",
    borderRadius: "14px",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "26px", animation: "glow 3s ease-in-out infinite",
  },
  loginBrandTitle: {
    color: "#ffffff", fontSize: "32px", fontWeight: "800",
    background: "linear-gradient(135deg, #ffffff 20%, #00ff88 100%)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
    letterSpacing: "-0.5px",
  },
  loginBrandSub: { color: "#333333", fontSize: "13px", lineHeight: "1.5" },
  loginFeatures: { display: "flex", flexDirection: "column", gap: "14px" },
  loginFeatureRow: { display: "flex", alignItems: "center", gap: "12px" },
  loginFeatureIconBox: {
    width: "34px", height: "34px",
    backgroundColor: "rgba(0,255,136,0.06)",
    border: "1px solid rgba(0,255,136,0.1)",
    borderRadius: "9px",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "14px", flexShrink: 0,
  },
  loginFeatureText: { color: "#555555", fontSize: "13px" },
  loginLeftBottom: {
    marginTop: "auto", paddingTop: "24px",
    borderTop: "1px solid #111111",
    display: "flex", flexDirection: "column", gap: "6px",
  },
  loginLeftBottomText: { color: "#333333", fontSize: "12px" },
  loginLeftBottomLink: {
    color: "#00ff88", fontSize: "13px",
    fontWeight: "600", textDecoration: "none",
  },

  loginRight: {
    flex: 1, backgroundColor: "#0d0d0d",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: "40px",
  },
  loginFormWrap: {
    width: "100%", maxWidth: "400px",
    display: "flex", flexDirection: "column", gap: "22px",
    animation: "fadeUp 0.5s ease",
  },
  loginFormTop: { display: "flex", flexDirection: "column", gap: "6px" },
  loginFormTitle: { color: "#ffffff", fontSize: "26px", fontWeight: "700" },
  loginFormSub: { color: "#333333", fontSize: "13px" },
  errorBox: {
    display: "flex", alignItems: "center", gap: "8px",
    backgroundColor: "rgba(255,68,68,0.06)",
    border: "1px solid rgba(255,68,68,0.15)",
    color: "#ff4444", padding: "12px 14px",
    borderRadius: "8px", fontSize: "13px",
  },
  loginForm: { display: "flex", flexDirection: "column", gap: "18px" },
  field: { display: "flex", flexDirection: "column", gap: "7px" },
  fieldLabel: {
    color: "#444444", fontSize: "12px", fontWeight: "500",
    letterSpacing: "0.5px", textTransform: "uppercase",
  },
  input: {
    backgroundColor: "#111111", border: "1px solid #1a1a1a",
    color: "#e0e0e0", padding: "13px 14px",
    borderRadius: "8px", fontSize: "14px",
    width: "100%", fontFamily: "inherit",
    transition: "all 0.3s ease",
  },
  eyeBtn: {
    position: "absolute", right: "12px", top: "50%",
    transform: "translateY(-50%)",
    backgroundColor: "transparent", border: "none",
    fontSize: "15px", cursor: "pointer",
  },
  loginSubmitBtn: {
    backgroundColor: "#00ff88", color: "#080808",
    border: "none", padding: "14px",
    borderRadius: "8px", fontSize: "15px",
    fontWeight: "700", cursor: "pointer",
    width: "100%", fontFamily: "inherit", letterSpacing: "0.3px",
  },
  loadingRow: {
    display: "flex", alignItems: "center",
    justifyContent: "center", gap: "8px",
  },
  btnSpinner: {
    width: "15px", height: "15px",
    border: "2px solid rgba(0,0,0,0.15)",
    borderTop: "2px solid #080808",
    borderRadius: "50%", animation: "spin 0.7s linear infinite",
    display: "inline-block",
  },
  divider: { display: "flex", alignItems: "center", gap: "14px" },
  dividerLine: { flex: 1, height: "1px", backgroundColor: "#111111" },
  dividerLabel: { color: "#222222", fontSize: "11px" },
  registerBtn: {
    width: "100%", backgroundColor: "transparent",
    border: "1px solid #1a1a1a", color: "#555555",
    padding: "13px", borderRadius: "8px",
    fontSize: "14px", cursor: "pointer", fontFamily: "inherit",
  },
  typeIcons: {
    display: "flex", justifyContent: "center", gap: "10px", marginTop: "4px",
  },
  typeIconBox: {
    width: "34px", height: "34px",
    backgroundColor: "#111111", border: "1px solid #161616",
    borderRadius: "8px",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "14px",
  },
  typeIconsLabel: { color: "#222222", fontSize: "11px", textAlign: "center" },
};

export default Login;