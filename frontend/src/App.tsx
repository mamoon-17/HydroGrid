import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import TeamMembers from "./pages/admin/TeamMembers";
import ManagePlants from "./pages/admin/ManagePlants";
import QualityReports from "./pages/admin/QualityReports";
import Analytics from "./pages/admin/Analytics";
import TeamSettings from "./pages/admin/TeamSettings";

// Employee Pages
import EmployeeDashboard from "./pages/employee/EmployeeDashboard";
import FillReport from "./pages/employee/FillReport";
import WorkHistory from "./pages/employee/WorkHistory";

// Auth Pages
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import TeamSetup from "./pages/TeamSetup";
import Layout from "./components/Layout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Team Setup - requires login but not team */}
            <Route element={<ProtectedRoute requireTeam={false} />}>
              <Route path="/team-setup" element={<TeamSetup />} />
            </Route>

            {/* Redirect old /employee paths to new /user paths */}
            <Route path="/employee" element={<Navigate to="/user" replace />} />
            <Route
              path="/employee/*"
              element={<Navigate to="/user" replace />}
            />

            {/* Redirect old /admin/employees to new /admin/team-members */}
            <Route
              path="/admin/employees"
              element={<Navigate to="/admin/team-members" replace />}
            />

            {/* Main App Routes - requires team */}
            <Route path="/" element={<Layout />}>
              {/* Root redirect */}
              <Route index element={<Navigate to="/admin" replace />} />

              {/* Admin Routes - Team Owner/Admin only */}
              <Route path="admin" element={<ProtectedRoute role="admin" />}>
                <Route index element={<AdminDashboard />} />
                <Route path="team-members" element={<TeamMembers />} />
                <Route path="plants" element={<ManagePlants />} />
                <Route path="reports" element={<QualityReports />} />
                <Route path="analytics" element={<Analytics />} />
              </Route>

              {/* Owner-only Routes */}
              <Route
                path="admin/team-settings"
                element={<ProtectedRoute role="admin" requireOwner />}
              >
                <Route index element={<TeamSettings />} />
              </Route>

              {/* User Routes (Employee Dashboard) - Team Members */}
              <Route path="user" element={<ProtectedRoute role="user" />}>
                <Route index element={<EmployeeDashboard />} />
                <Route path="fill-report" element={<FillReport />} />
                <Route path="work-history" element={<WorkHistory />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
