import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import './App.css'

import Login from './Pages/Login';
import AdminDashboard from './pages/admin/Dashboard';
import AdminManagers from './pages/admin/Managers';
import AdminStation from './pages/admin/Station';
import AdminReports from './pages/admin/Reports';
import ManagerDashboard from './pages/manager/Dashboard';
import ManagerHistory from './pages/manager/History';

function ProtectedRoute({ children, role }) {
  const { user, userData } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (role && userData?.role !== role) return <Navigate to="/login" />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/admin" element={
        <ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>
      } />
      <Route path="/admin/managers" element={
        <ProtectedRoute role="admin"><AdminManagers /></ProtectedRoute>
      } />
      <Route path="/admin/station/:id" element={
        <ProtectedRoute role="admin"><AdminStation /></ProtectedRoute>
      } />
      <Route path="/admin/reports" element={
        <ProtectedRoute role="admin"><AdminReports /></ProtectedRoute>
      } />

      <Route path="/manager" element={
        <ProtectedRoute role="manager"><ManagerDashboard /></ProtectedRoute>
      } />
      <Route path="/manager/history" element={
        <ProtectedRoute role="manager"><ManagerHistory /></ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-right" />
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;