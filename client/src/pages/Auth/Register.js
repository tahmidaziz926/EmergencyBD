import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../../services/authService";

const Register = () => {
  const [form, setForm] = useState({
    name: "", email: "", password: "", contactInfo: "", area: ""
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await registerUser(form);
      setSuccess("Registered successfully! Redirecting to login...");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    }
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.logo}>🚨 EmergencyBD</h1>
        <h2 style={styles.title}>Create Account</h2>
        <p style={styles.subtitle}>Join EmergencyBD today</p>

        {error && <div style={styles.error}>{error}</div>}
        {success && <div style={styles.success}>{success}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Full Name</label>
            <input type="text" name="name" placeholder="Enter your full name" value={form.name} onChange={handleChange} required />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input type="email" name="email" placeholder="Enter your email" value={form.email} onChange={handleChange} required />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input type="password" name="password" placeholder="Create a password" value={form.password} onChange={handleChange} required />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Contact Number</label>
            <input type="text" name="contactInfo" placeholder="Enter your phone number" value={form.contactInfo} onChange={handleChange} required />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Area</label>
            <input type="text" name="area" placeholder="Enter your area" value={form.area} onChange={handleChange} required />
          </div>

          <button
            type="submit"
            style={styles.btn}
            disabled={loading}
            onMouseEnter={e => e.target.style.backgroundColor = "#00cc6a"}
            onMouseLeave={e => e.target.style.backgroundColor = "#00ff88"}
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p style={styles.footer}>
          Already have an account?{" "}
          <Link to="/login" style={styles.link}>Sign in here</Link>
        </p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#0a0a0a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
  },
  card: {
    backgroundColor: "#111111",
    border: "1px solid #1e1e1e",
    borderRadius: "16px",
    padding: "48px 40px",
    width: "100%",
    maxWidth: "420px",
    boxShadow: "0 0 40px rgba(0, 255, 136, 0.05)",
  },
  logo: {
    color: "#00ff88",
    fontSize: "24px",
    textAlign: "center",
    marginBottom: "24px",
  },
  title: {
    color: "#ffffff",
    fontSize: "22px",
    fontWeight: "600",
    textAlign: "center",
    marginBottom: "8px",
  },
  subtitle: {
    color: "#666666",
    fontSize: "14px",
    textAlign: "center",
    marginBottom: "32px",
  },
  error: {
    backgroundColor: "#1a0a0a",
    border: "1px solid #ff4444",
    color: "#ff4444",
    padding: "12px",
    borderRadius: "8px",
    fontSize: "13px",
    marginBottom: "20px",
    textAlign: "center",
  },
  success: {
    backgroundColor: "#0a1a0a",
    border: "1px solid #00ff88",
    color: "#00ff88",
    padding: "12px",
    borderRadius: "8px",
    fontSize: "13px",
    marginBottom: "20px",
    textAlign: "center",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  label: {
    color: "#aaaaaa",
    fontSize: "13px",
    fontWeight: "500",
  },
  btn: {
    backgroundColor: "#00ff88",
    color: "#0a0a0a",
    border: "none",
    padding: "14px",
    borderRadius: "8px",
    fontSize: "15px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "background-color 0.3s ease",
    marginTop: "8px",
  },
  footer: {
    color: "#666666",
    fontSize: "13px",
    textAlign: "center",
    marginTop: "24px",
  },
  link: {
    color: "#00ff88",
    textDecoration: "none",
  },
};

export default Register;