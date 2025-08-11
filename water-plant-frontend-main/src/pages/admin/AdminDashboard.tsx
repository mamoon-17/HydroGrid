import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { StatusBadge } from "../../components/StatusBadge";
import {
  Users,
  Database,
  FileText,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface Plant {
  id: string;
  address: string;
  type: "uf" | "ro";
  tehsil: string;
  capacity: number;
  lat?: number;
  lng?: number;
  users?: Array<{
    id: string;
    name: string;
    username: string;
  }>;
  created_at?: string;
  updated_at?: string;
}

interface User {
  id: string;
  username: string;
  name: string;
  phone: string;
  email?: string | null;
  role: "admin" | "user";
  created_at: string;
  updated_at: string;
}

interface DashboardStats {
  totalPlants: number;
  warningPlants: number;
  totalEmployees: number;
  recentReports: number;
}

const AdminDashboard = () => {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalPlants: 0,
    warningPlants: 0,
    totalEmployees: 0,
    recentReports: 0,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch plants and users in parallel
      const [plantsResponse, usersResponse] = await Promise.all([
        fetch(`${BASE_URL}/plants`, {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }),
        fetch(`${BASE_URL}/users`, {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }),
      ]);

      if (!plantsResponse.ok) {
        throw new Error(`Failed to fetch plants: ${plantsResponse.status}`);
      }

      if (!usersResponse.ok) {
        throw new Error(`Failed to fetch users: ${usersResponse.status}`);
      }

      const plantsData = await plantsResponse.json();
      const usersData = await usersResponse.json();

      setPlants(plantsData);
      setUsers(usersData);

      // Calculate statistics
      calculateStats(plantsData, usersData);
    } catch (err) {
      console.error("Failed to load dashboard data", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to load dashboard data"
      );
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (plantsData: Plant[], usersData: User[]) => {
    const now = new Date();
    const fifteenDaysAgo = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Calculate warning plants (no update in 15+ days)
    const warningPlants = plantsData.filter((plant) => {
      if (!plant.updated_at) return true;
      const lastUpdate = new Date(plant.updated_at);
      return lastUpdate < fifteenDaysAgo;
    });

    // Calculate recent reports (updates in last week)
    const recentReports = plantsData.filter((plant) => {
      if (!plant.updated_at) return false;
      const lastUpdate = new Date(plant.updated_at);
      return lastUpdate > oneWeekAgo;
    });

    // Count employees (users with role 'user')
    const employees = usersData.filter((user) => user.role === "user");

    setStats({
      totalPlants: plantsData.length,
      warningPlants: warningPlants.length,
      totalEmployees: employees.length,
      recentReports: recentReports.length,
    });
  };

  // Helper function to get last report time
  const getLastReport = (plant: Plant) => {
    if (!plant.updated_at) return "Never";

    const lastUpdate = new Date(plant.updated_at);
    const now = new Date();
    const daysDiff = Math.floor(
      (now.getTime() - lastUpdate.getTime()) / (1000 * 3600 * 24)
    );

    if (daysDiff === 0) return "Today";
    if (daysDiff === 1) return "1 day ago";
    return `${daysDiff} days ago`;
  };

  // Get warning plants (no update in 15+ days)
  const warningPlants = plants.filter((plant) => {
    if (!plant.updated_at) return true;
    const lastUpdate = new Date(plant.updated_at);
    const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
    return lastUpdate < fifteenDaysAgo;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <div className="space-y-2">
            <span className="text-lg font-semibold">Loading dashboard...</span>
            <p className="text-sm text-muted-foreground max-w-xs">
              Please wait while we fetch your data
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 sm:px-6 lg:px-8 pb-6">
      {/* Header */}
      <div className="flex flex-col gap-4 pt-6">
        <div className="space-y-3">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
            Admin Dashboard
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-3xl leading-relaxed">
            Monitor and manage your RO/UF plant maintenance system
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="hover:shadow-lg transition-all duration-200 border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 px-4 sm:px-6">
            <CardTitle className="text-sm sm:text-base font-semibold">
              Total Plants
            </CardTitle>
            <Database className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-6">
            <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary mb-2">
              {stats.totalPlants}
            </div>
            <p className="text-sm text-muted-foreground">Across all regions</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200 border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 px-4 sm:px-6">
            <CardTitle className="text-sm sm:text-base font-semibold">
              Warning Plants
            </CardTitle>
            <AlertTriangle className="h-5 w-5 text-danger flex-shrink-0" />
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-6">
            <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-danger mb-2">
              {stats.warningPlants}
            </div>
            <p className="text-sm text-muted-foreground">
              No report in 15+ days
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200 border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 px-4 sm:px-6">
            <CardTitle className="text-sm sm:text-base font-semibold">
              Total Employees
            </CardTitle>
            <Users className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-6">
            <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-accent mb-2">
              {stats.totalEmployees}
            </div>
            <p className="text-sm text-muted-foreground">
              Active maintenance staff
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200 border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 px-4 sm:px-6">
            <CardTitle className="text-sm sm:text-base font-semibold">
              Recent Reports
            </CardTitle>
            <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-6">
            <div className="text-2xl sm:text-3xl lg:text-4xl font-bold text-success mb-2">
              {stats.recentReports}
            </div>
            <p className="text-sm text-muted-foreground">This week</p>
          </CardContent>
        </Card>
      </div>

      {/* Warning Plants */}
      <Card className="hover:shadow-lg transition-all duration-200 border-0 shadow-sm">
        <CardHeader className="px-4 sm:px-6 pb-4">
          <CardTitle className="flex items-center gap-3 text-xl sm:text-2xl font-bold">
            <AlertTriangle className="h-6 w-6 text-danger flex-shrink-0" />
            Plants Requiring Attention
          </CardTitle>
          <CardDescription className="text-base sm:text-lg text-muted-foreground">
            Plants that haven't submitted reports in 15+ days
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-6">
          {warningPlants.length === 0 ? (
            <div className="text-center py-12 sm:py-16 text-muted-foreground">
              <AlertTriangle className="h-16 w-16 sm:h-20 sm:w-20 mx-auto mb-6 text-muted-foreground" />
              <div className="space-y-3">
                <p className="text-lg sm:text-xl font-semibold">
                  No plants require attention at the moment.
                </p>
                <p className="text-base text-muted-foreground">
                  All plants have recent activity.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {warningPlants.map((plant) => (
                <div
                  key={plant.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 sm:p-6 border border-border rounded-xl hover:bg-muted/30 transition-all duration-200"
                >
                  <div className="flex items-start sm:items-center gap-4 flex-1 min-w-0">
                    <div className="w-3 h-3 bg-danger rounded-full flex-shrink-0 mt-2 sm:mt-0"></div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <p className="font-semibold text-base sm:text-lg truncate">
                        {plant.address}
                      </p>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                        <span className="font-medium">
                          Type: {plant.type.toUpperCase()}
                        </span>
                        <span className="hidden sm:inline">•</span>
                        <span>Last Report: {getLastReport(plant)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 sm:mt-0 sm:ml-6 flex-shrink-0">
                    <StatusBadge status="warning" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
