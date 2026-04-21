import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import useAuth from "./hooks/useAuth";
import { useState, useEffect, useRef, useContext } from "react";
import { AuthContext } from "./context/AuthContext";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import Profile from "./pages/User/Profile";
import EmergencyForm from "./pages/User/EmergencyForm";
import EmergencyList from "./pages/User/EmergencyList";
import FundRequestForm from "./pages/User/FundRequestForm";
import FundRequestList from "./pages/User/FundRequestList";
import MassFunding from "./pages/User/MassFunding";
import EmergencyContacts from "./pages/User/EmergencyContacts";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import AdminReports from "./pages/Admin/AdminReports";
import AdminFundRequests from "./pages/Admin/AdminFundRequests";
import AdminMassFunding from "./pages/Admin/AdminMassFunding";
import AdminUsers from "./pages/Admin/AdminUsers";
import AdminContacts from "./pages/Admin/AdminContacts";
import EmergencyMap from "./pages/EmergencyMap";
import Notifications from "./pages/Notifications";
import SOSPage from "./pages/User/SOSPage";
import SOSMapView from "./pages/User/SOSMapView";
import SOSAlertContainer from "./components/SOSAlert";
import { getActiveSOSEvents } from "./services/sosService";

const ProtectedRoute = ({ children, allowedRole }) => {
  const { token, role, loading } = useAuth();
  if (loading) return <div style={{ color: "#00ff88", textAlign: "center", marginTop: "50px" }}>Loading...</div>;
  if (!token) return <Navigate to="/login" />;
  if (allowedRole && role !== allowedRole) return <Navigate to="/login" />;
  return children;
};

const SOSAlertPoller = () => {
  const { user, role } = useContext(AuthContext);
  const [sosAlerts, setSosAlerts] = useState([]);
  const seenIds = useRef(new Set());
  const pollRef = useRef(null);

  useEffect(() => {
    if (!user || role === "admin") return;
    const poll = async () => {
      try {
        const res = await getActiveSOSEvents();
        res.data.forEach((event) => {
          const senderId = event.sender?._id || event.sender;
          if (!seenIds.current.has(event._id) && senderId !== user._id) {
            seenIds.current.add(event._id);
            setSosAlerts(prev => [...prev, {
              _id: event._id,
              title: `🚨 SOS: ${event.title}`,
              message: `${event.emergencyType} alert within ${event.radius}km of your area`,
              data: { sosEventId: event._id, emergencyType: event.emergencyType },
            }]);
          }
        });
      } catch { }
    };
    poll();
    pollRef.current = setInterval(poll, 20000);
    return () => clearInterval(pollRef.current);
  }, [user, role]);

  const handleDismiss = (id) => setSosAlerts(prev => prev.filter(a => a._id !== id));
  return <SOSAlertContainer notifications={sosAlerts} onDismiss={handleDismiss} />;
};

const AppRoutes = () => {
  const { token, role } = useAuth();
  return (
    <>
      <SOSAlertPoller />
      <Routes>
        <Route path="/" element={token ? (role==="admin" ? <Navigate to="/admin/dashboard"/> : <Navigate to="/user/profile"/>) : <Navigate to="/login"/>} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* User Routes */}
        <Route path="/user/profile" element={<ProtectedRoute allowedRole="user"><Profile /></ProtectedRoute>} />
        <Route path="/user/emergency" element={<ProtectedRoute allowedRole="user"><EmergencyForm /></ProtectedRoute>} />
        <Route path="/user/emergency/list" element={<ProtectedRoute allowedRole="user"><EmergencyList /></ProtectedRoute>} />
        <Route path="/user/fund" element={<ProtectedRoute allowedRole="user"><FundRequestForm /></ProtectedRoute>} />
        <Route path="/user/fund/list" element={<ProtectedRoute allowedRole="user"><FundRequestList /></ProtectedRoute>} />
        <Route path="/user/mass-funding" element={<ProtectedRoute allowedRole="user"><MassFunding /></ProtectedRoute>} />
        <Route path="/user/contacts" element={<ProtectedRoute allowedRole="user"><EmergencyContacts /></ProtectedRoute>} />
        <Route path="/user/sos" element={<ProtectedRoute allowedRole="user"><SOSPage /></ProtectedRoute>} />
        <Route path="/sos-map" element={<ProtectedRoute><SOSMapView /></ProtectedRoute>} />

        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={<ProtectedRoute allowedRole="admin"><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/reports" element={<ProtectedRoute allowedRole="admin"><AdminReports /></ProtectedRoute>} />
        <Route path="/admin/fund-requests" element={<ProtectedRoute allowedRole="admin"><AdminFundRequests /></ProtectedRoute>} />
        <Route path="/admin/mass-funding" element={<ProtectedRoute allowedRole="admin"><AdminMassFunding /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute allowedRole="admin"><AdminUsers /></ProtectedRoute>} />
        <Route path="/admin/contacts" element={<ProtectedRoute allowedRole="admin"><AdminContacts /></ProtectedRoute>} />

        {/* Shared */}
        <Route path="/emergency-map" element={<ProtectedRoute><EmergencyMap /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
      </Routes>
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;