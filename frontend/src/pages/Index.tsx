import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const Index = () => {
  const { user, hasTeam, isTeamAdmin } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // User needs to set up a team first
  if (!hasTeam) {
    return <Navigate to="/team-setup" replace />;
  }

  // Redirect based on team role
  return <Navigate to={isTeamAdmin ? "/admin" : "/user"} replace />;
};

export default Index;
