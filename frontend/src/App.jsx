import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Homepage from "./homepage";
import Login from "./login";
import TeacherDashboard from "./TeacherDashboard";
import AdminDashboard from "./adashboard";
import { normaliseTeacherForToday } from "./attendance";
import "./App.css";

function AppRoutes() {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? normaliseTeacherForToday(JSON.parse(stored)) : null;
    } catch { return null; }
  });

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login");
  };

  const handleLogin = (userData) => {
    setUser(normaliseTeacherForToday(userData));
  };

  return (
      <Routes>
      <Route path="/"        element={<Homepage />} />
      <Route path="/login"   element={<Login onLogin={handleLogin} />} />
      <Route path="/teacher" element={user ? <TeacherDashboard teacher={user} onLogout={handleLogout} /> : <Navigate to="/login" />} />
      <Route
        path="/admin"
        element={
          user
            ? (user.role === 'admin' ? <AdminDashboard user={user} onLogout={handleLogout} /> : <Navigate to="/teacher" />)
            : <Navigate to="/login" />
        }
      />
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
