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
} from "lucide-react";
import { useState } from "react";
import { ChangePasswordDialog } from "./ChangePasswordDialog";

interface SidebarProps {
  onClose?: () => void;
}

export const Sidebar = ({ onClose }: SidebarProps) => {
  const { user, logout } = useAuth();
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

  const adminNavItems = [
    { to: "/admin", icon: Home, label: "Dashboard" },
    { to: "/admin/employees", icon: Users, label: "Manage Employees" },
    { to: "/admin/plants", icon: Database, label: "Manage Plants" },
    { to: "/admin/reports", icon: FileText, label: "Quality Reports" },
    { to: "/admin/analytics", icon: TrendingUp, label: "Analytics" },
  ];

  const userNavItems = [
    { to: "/user", icon: Home, label: "Dashboard" },
    { to: "/user/fill-report", icon: ClipboardList, label: "Fill Out Report" },
    { to: "/user/work-history", icon: History, label: "Work History" },
  ];

  const navItems = user?.role === "admin" ? adminNavItems : userNavItems;

  return (
    <div className="w-full h-full bg-card border-r shadow-lg flex flex-col">
      <div className="p-4 md:p-6 border-b">
        <div className="flex items-center gap-2">
          <Droplets className="h-6 w-6 text-primary" />
          <h1 className="text-lg md:text-xl font-bold text-primary">
            HydroGrid
          </h1>
        </div>
        <div className="mt-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="truncate">{user?.name}</span>
          </div>
          <div className="text-xs mt-1 capitalize bg-primary/10 text-primary px-2 py-1 rounded">
            {user?.role}
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
