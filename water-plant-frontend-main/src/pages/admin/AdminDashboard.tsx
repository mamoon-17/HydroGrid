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
    // Set page title
    document.title = "Engzone - Admin Dashboard";

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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Monitor and manage your plant maintenance system
            </p>
          </div>
        </div>

        {/* Loading State */}
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-4 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <div className="space-y-2">
              <span className="text-lg font-semibold">
                Loading dashboard...
              </span>
              <p className="text-sm text-muted-foreground max-w-xs">
                Please wait while we fetch your data
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitor and manage your plant maintenance system
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Plants</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {stats.totalPlants}
            </div>
            <p className="text-xs text-muted-foreground">Across all regions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Warning Plants
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-danger" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-danger">
              {stats.warningPlants}
            </div>
            <p className="text-xs text-muted-foreground">
              No report in 15+ days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Employees
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">
              {stats.totalEmployees}
            </div>
            <p className="text-xs text-muted-foreground">
              Active maintenance staff
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Recent Reports
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {stats.recentReports}
            </div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>
      </div>

      {/* Warning Plants */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-danger" />
            Plants Requiring Attention
          </CardTitle>
          <CardDescription>
            Plants that haven't submitted reports in 15+ days
          </CardDescription>
        </CardHeader>
        <CardContent>
          {warningPlants.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p>No plants require attention at the moment.</p>
              <p className="text-sm">All plants have recent activity.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {warningPlants.map((plant) => (
                <div
                  key={plant.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-danger rounded-full"></div>
                    <div>
                      <p className="font-medium">{plant.address}</p>
                      <p className="text-sm text-muted-foreground">
                        Type: {plant.type.toUpperCase()} • Last Report:{" "}
                        {getLastReport(plant)}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status="warning" />
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
