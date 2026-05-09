import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, allowedRole }) {
  const { user, userData } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRole && userData?.role !== allowedRole) {
    return <Navigate to="/login" replace />;
  }

  return children;
}