import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import ManageEmployees from "./pages/admin/ManageEmployees";
import ManagePlants from "./pages/admin/ManagePlants";
import PlantDetails from "./pages/admin/PlantDetails";
import QualityReports from "./pages/admin/QualityReports";
import Analytics from "./pages/admin/Analytics";

// Employee Pages
import EmployeeDashboard from "./pages/employee/EmployeeDashboard";
import FillReport from "./pages/employee/FillReport";
import WorkHistory from "./pages/employee/WorkHistory";

// Auth Pages
import Login from "./pages/Login";
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
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Layout />}>
              {/* Admin Routes */}
              <Route path="admin" element={<ProtectedRoute role="admin" />}>
                <Route index element={<AdminDashboard />} />
                <Route path="employees" element={<ManageEmployees />} />
                <Route path="plants" element={<ManagePlants />} />
                <Route path="plant-details" element={<PlantDetails />} />
                <Route path="reports" element={<QualityReports />} />
                <Route path="analytics" element={<Analytics />} />
              </Route>
              
              {/* Employee Routes */}
              <Route path="employee" element={<ProtectedRoute role="employee" />}>
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