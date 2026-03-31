import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useState } from "react";
import Homepage from "./homepage";
import Login from "./login";
import TeacherDashboard from "./TeacherDashboard";
import AdminDashboard from "./adashboard";
import "./App.css";

function ProtectedRoute({ user, allow, children }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allow.includes(user.role)) {
    return <Navigate to={user.role === "admin" ? "/admin" : "/teacher"} replace />;
  }

  return children;
}

function AppRoutes() {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login");
  };

  const handleLogin = (userData) => {
    setUser(userData);
  };

  return (
    <Routes>
      <Route path="/"        element={<Homepage />} />
      <Route path="/login"   element={<Login onLogin={handleLogin} />} />
      <Route
        path="/teacher"
        element={
          <ProtectedRoute user={user} allow={["teacher"]}>
            <TeacherDashboard teacher={user} onLogout={handleLogout} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute user={user} allow={["admin"]}>
            <AdminDashboard user={user} onLogout={handleLogout} />
          </ProtectedRoute>
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
