import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Workspace from "./pages/Workspace";
import Home from "./pages/Home";
import "./App.css";
import AdminPanel from "./pages/AdminPanel";
import AuditLogs from "./pages/AuditLogs";


function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/" element={<Home />} />
        
        <Route
          path="/workspace"
          element={
            <ProtectedRoute>
              <Workspace/>
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminPanel />
            </ProtectedRoute>
          }
        />

        <Route
          path="/rooms/:id"
          element={
            <ProtectedRoute>
              <Workspace />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dm/:userId"
          element={
            <ProtectedRoute>
              <Workspace />
            </ProtectedRoute>
          }
        />

        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <Navigate to="/dashboard" replace />
            </ProtectedRoute>
          }
        />

<Route
  path="/audit"
  element={
    <ProtectedRoute>
      <AuditLogs />
    </ProtectedRoute>
  }
/>


      </Routes>

      
    </BrowserRouter>
  );
}

export default App;
