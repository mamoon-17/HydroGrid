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
} from "lucide-react";

export const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const adminNavItems = [
    { to: "/admin", icon: Home, label: "Dashboard" },
    { to: "/admin/employees", icon: Users, label: "Manage Employees" },
    { to: "/admin/plants", icon: Database, label: "Manage Plants" },
    { to: "/admin/plant-details", icon: Settings, label: "Plant Details" },
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
    <div className="w-64 bg-card border-r shadow-lg flex flex-col">
      <div className="p-6 border-b">
        <h1 className="text-xl font-bold text-primary">RO/UF Plant Manager</h1>
        <div className="mt-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>{user?.name}</span>
          </div>
          <div className="text-xs mt-1 capitalize bg-primary/10 text-primary px-2 py-1 rounded">
            {user?.role}
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to.endsWith("/admin") || item.to.endsWith("/user")}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`
                }
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t">
        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
};
