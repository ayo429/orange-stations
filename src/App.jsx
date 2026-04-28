import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import './App.css'

// Pages
import Login from './pages/Login';

// Admin pages
import AdminDashboard from './pages/Admin/Dashboard';
import AdminManagers from './pages/Admin/Managers';
import AdminStation from './pages/Admin/Stations';
import AdminReports from './pages/Admin/Reports';

// Manager pages
import ManagerDashboard from './pages/manager/Dashboard';
import ManagerHistory from './pages/Manager/History';

// Protected route component
function ProtectedRoute({ children, role }) {
  const { user, userData } = useAuth();

  if (!user) return <Navigate to="/login" />;
  if (role && userData?.role !== role) return <Navigate to="/login" />;

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />

      {/* Admin routes */}
      <Route path="/admin" element={
        <ProtectedRoute role="admin">
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/admin/managers" element={
        <ProtectedRoute role="admin">
          <AdminManagers />
        </ProtectedRoute>
      } />
      <Route path="/admin/station/:id" element={
        <ProtectedRoute role="admin">
          <AdminStation />
        </ProtectedRoute>
      } />
      <Route path="/admin/reports" element={
        <ProtectedRoute role="admin">
          <AdminReports />
        </ProtectedRoute>
      } />

      {/* Manager routes */}
      <Route path="/manager" element={
        <ProtectedRoute role="manager">
          <ManagerDashboard />
        </ProtectedRoute>
      } />
      <Route path="/manager/history" element={
        <ProtectedRoute role="manager">
          <ManagerHistory />
        </ProtectedRoute>
      } />

      {/* Default redirect */}
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