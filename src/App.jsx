import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Homepage from "./homepage";
import Login from "./login";
import TeacherDashboard from "./TeacherDashboard";
import AdminDashboard from "./adashboard";
import "./App.css";

function AppRoutes() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load user from localStorage on app mount
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error("Failed to parse user data:", err);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login");
  };

  if (loading) {
    return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", fontSize: 18 }}>Loading...</div>;
  }

  return (
    <Routes>
      <Route path="/"      element={<Homepage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/teacher" element={user ? <TeacherDashboard teacher={user} onLogout={handleLogout} /> : <Navigate to="/login" />} />
      <Route path="/admin" element={user ? <AdminDashboard user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;