import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "./ui/button";
import {
  Users,
  Settings,
  Database,
  FileText,
  TrendingUp,
  User,
  ClipboardList,
  History,
  LogOut,
  Home,
  Key,
  Droplets,
  Building2,
  Crown,
  Shield,
} from "lucide-react";
import { useState } from "react";
import { ChangePasswordDialog } from "./ChangePasswordDialog";

interface SidebarProps {
  onClose?: () => void;
}

export const Sidebar = ({ onClose }: SidebarProps) => {
  const { user, logout, isTeamAdmin, isTeamOwner } = useAuth();
  const navigate = useNavigate();
  const [showChangePasswordDialog, setShowChangePasswordDialog] =
    useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleNavClick = () => {
    // Close mobile sidebar when nav item is clicked
    if (onClose) {
      onClose();
    }
  };

  // Build admin nav items - Team Settings only for owners
  const adminNavItems = [
    { to: "/admin", icon: Home, label: "Dashboard" },
    { to: "/admin/team-members", icon: Users, label: "Team Members" },
    { to: "/admin/plants", icon: Database, label: "Manage Plants" },
    { to: "/admin/reports", icon: FileText, label: "Quality Reports" },
    { to: "/admin/analytics", icon: TrendingUp, label: "Analytics" },
    ...(isTeamOwner
      ? [{ to: "/admin/team-settings", icon: Settings, label: "Team Settings" }]
      : []),
  ];

  const userNavItems = [
    { to: "/user", icon: Home, label: "Dashboard" },
    { to: "/user/fill-report", icon: ClipboardList, label: "Fill Out Report" },
    { to: "/user/work-history", icon: History, label: "Work History" },
  ];

  const navItems = isTeamAdmin ? adminNavItems : userNavItems;

  // Get role badge info
  const getRoleBadge = () => {
    switch (user?.team_role) {
      case "owner":
        return {
          label: "Owner",
          icon: Crown,
          color: "bg-amber-500/10 text-amber-600",
        };
      case "admin":
        return {
          label: "Admin",
          icon: Shield,
          color: "bg-blue-500/10 text-blue-600",
        };
      default:
        return {
          label: "Member",
          icon: User,
          color: "bg-primary/10 text-primary",
        };
    }
  };

  const roleBadge = getRoleBadge();

  return (
    <div className="w-full h-full bg-card border-r shadow-lg flex flex-col">
      <div className="p-4 md:p-6 border-b">
        <div className="flex items-center gap-2">
          <Droplets className="h-6 w-6 text-primary" />
          <h1 className="text-lg md:text-xl font-bold text-primary">
            HydroGrid
          </h1>
        </div>

        {/* Team Info */}
        {user?.team && (
          <div className="mt-3 p-2 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="truncate">{user.team.name}</span>
            </div>
          </div>
        )}

        <div className="mt-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="truncate">{user?.name}</span>
          </div>
          <div
            className={`text-xs mt-2 px-2 py-1 rounded flex items-center gap-1 w-fit ${roleBadge.color}`}
          >
            <roleBadge.icon className="h-3 w-3" />
            {roleBadge.label}
          </div>
          <Button
            onClick={() => setShowChangePasswordDialog(true)}
            variant="ghost"
            size="sm"
            className="w-full mt-2 flex items-center gap-2 text-xs"
          >
            <Key className="h-3 w-3" />
            Change Password
          </Button>
        </div>
      </div>

      <nav className="flex-1 p-3 md:p-4">
        <ul className="space-y-1 md:space-y-2">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to.endsWith("/admin") || item.to.endsWith("/user")}
                onClick={handleNavClick}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 md:py-2.5 rounded-lg transition-colors text-sm md:text-base ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`
                }
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-3 md:p-4 border-t space-y-2">
        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full flex items-center gap-2 text-sm md:text-base"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>

      <ChangePasswordDialog
        open={showChangePasswordDialog}
        onClose={() => setShowChangePasswordDialog(false)}
      />
    </div>
  );
};
