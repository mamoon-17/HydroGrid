import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

interface ProtectedRouteProps {
  role?: "admin" | "user";
  requireTeam?: boolean;
  requireOwner?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  role,
  requireTeam = true, // Default to requiring team for most routes
  requireOwner = false,
}) => {
  const { user, hasTeam, isTeamAdmin, isTeamOwner } = useAuth();
  const location = useLocation();

  // Not logged in - redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // User is logged in but doesn't have a team yet
  // (and this route requires a team)
  if (requireTeam && !hasTeam) {
    // Allow access to team setup page
    if (location.pathname === "/team-setup") {
      return <Outlet />;
    }
    return <Navigate to="/team-setup" replace />;
  }

  // Owner-only routes
  if (requireOwner && !isTeamOwner) {
    return <Navigate to="/admin" replace />;
  }

  // Role-based access control (team-based)
  if (role === "admin" && !isTeamAdmin) {
    // User is not a team admin/owner - redirect to user panel
    return <Navigate to="/user" replace />;
  }

  if (role === "user" && isTeamAdmin) {
    // Team admin trying to access user routes - redirect to admin panel
    return <Navigate to="/admin" replace />;
  }

  return <Outlet />;
};
