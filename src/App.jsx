import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import './App.css';

import Login from './pages/Login';
import AdminDashboard from './pages/admin/Dashboard';
import AdminManagers from './pages/admin/Managers';
import AdminStation from './pages/admin/Station';
import AdminReports from './pages/admin/Reports';
import ManagerDashboard from './pages/manager/Dashboard';
import ManagerHistory from './pages/manager/History';
import ForgotPassword from './pages/ForgotPassword';
import ProtectedRoute from './components/ProtectedRoutes';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route path="/admin" element={
        <ProtectedRoute allowedRole="admin"><AdminDashboard /></ProtectedRoute>
      } />
      <Route path="/admin/managers" element={
        <ProtectedRoute allowedRole="admin"><AdminManagers /></ProtectedRoute>
      } />
      <Route path="/admin/station/:id" element={
        <ProtectedRoute allowedRole="admin"><AdminStation /></ProtectedRoute>
      } />
      <Route path="/admin/reports" element={
        <ProtectedRoute allowedRole="admin"><AdminReports /></ProtectedRoute>
      } />

      <Route path="/manager" element={
        <ProtectedRoute allowedRole="manager"><ManagerDashboard /></ProtectedRoute>
      } />
      <Route path="/manager/history" element={
        <ProtectedRoute allowedRole="manager"><ManagerHistory /></ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster position="top-right" />
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;