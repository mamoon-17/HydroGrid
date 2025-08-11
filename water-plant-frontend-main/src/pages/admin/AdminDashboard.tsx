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
  Settings,
  TrendingUp,
  Calendar,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { Button } from "../../components/ui/button";

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

interface RecentActivity {
  id: string;
  action: string;
  plant: string;
  timestamp: string;
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
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

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
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-lg">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            RO/UF Admin Dashboard
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Monitor and manage RO/UF plant maintenance operations
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Plants</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">
              {stats.totalPlants}
            </div>
            <p className="text-xs text-muted-foreground">Under management</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Employees
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">
              {stats.totalEmployees}
            </div>
            <p className="text-xs text-muted-foreground">Field workers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Reports This Month
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">
              {stats.recentReports}
            </div>
            <p className="text-xs text-muted-foreground">Quality reports</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Maintenance Due
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold text-warning">
              {stats.warningPlants}
            </div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Common administrative tasks and shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link to="/admin/employees">
              <Button className="w-full justify-start text-base" size="lg">
                <Users className="h-4 w-4 mr-2" />
                Manage Employees
              </Button>
            </Link>
            <Link to="/admin/plants">
              <Button
                variant="outline"
                className="w-full justify-start text-base"
                size="lg"
              >
                <Database className="h-4 w-4 mr-2" />
                Manage Plants
              </Button>
            </Link>
            <Link to="/admin/analytics">
              <Button
                variant="outline"
                className="w-full justify-start text-base"
                size="lg"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                View Analytics
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5" />
              Recent Reports
            </CardTitle>
            <CardDescription>
              Latest quality reports from field workers
            </CardDescription>
          </CardHeader>
          <CardContent>
            {warningPlants.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm">No recent reports</p>
                <p className="text-xs">
                  Reports will appear here once submitted
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {warningPlants.map((plant) => (
                  <div
                    key={plant.id}
                    className="flex items-start gap-3 p-3 rounded-lg border"
                  >
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{plant.address}</p>
                      <p className="text-xs text-muted-foreground">
                        {getLastReport(plant)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Plant Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Plant Status Overview</CardTitle>
          <CardDescription className="text-sm">
            Current status of all plants under management
          </CardDescription>
        </CardHeader>
        <CardContent>
          {plants.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Database className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm">No plants found</p>
              <p className="text-xs">Add plants to start monitoring</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {plants.map((plant) => {
                const daysAgo = getLastReport(plant);
                return (
                  <Card key={plant.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <CardTitle className="text-sm truncate">
                            {plant.address}
                          </CardTitle>
                        </div>
                        <StatusBadge
                          status={
                            daysAgo === "Never"
                              ? "warning"
                              : daysAgo === "Today"
                              ? "maintained"
                              : daysAgo === "1 day ago"
                              ? "pending"
                              : "maintained"
                          }
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Type:</span>
                          <span className="font-medium">
                            {plant.type.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Capacity:
                          </span>
                          <span className="font-medium">
                            {plant.capacity.toLocaleString()} LPH
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Last Report:
                          </span>
                          <span
                            className={`font-medium ${
                              daysAgo === "Never"
                                ? "text-danger"
                                : daysAgo === "Today"
                                ? "text-success"
                                : daysAgo === "1 day ago"
                                ? "text-warning"
                                : "text-success"
                            }`}
                          >
                            {daysAgo}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
