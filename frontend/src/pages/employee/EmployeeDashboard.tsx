import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { StatusBadge } from "../../components/StatusBadge";
import {
  Database,
  ClipboardList,
  History,
  Calendar,
  MapPin,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
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
  created_at: string;
  updated_at: string;
}

interface Report {
  id: string;
  plant: {
    id: string;
    address: string;
    tehsil: string;
    type: "uf" | "ro";
  };
  submitted_by: {
    id: string;
    name: string;
    username: string;
  };
  created_at: string;
  updated_at: string;
}

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [assignedPlants, setAssignedPlants] = useState<Plant[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      // Set page title
      document.title = "Engzone - Employee Dashboard";

      fetchEmployeeData();
    }
  }, [user]);

  const fetchEmployeeData = async () => {
    try {
      setLoading(true);

      // Fetch assigned plants for the current user
      const plantsResponse = await fetch(`${BASE_URL}/plants/assigned`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!plantsResponse.ok) {
        throw new Error(
          `Failed to fetch assigned plants: ${plantsResponse.status}`
        );
      }

      const assignedPlants = await plantsResponse.json();

      // Normalize decimal strings to numbers for coordinates
      const normalizedPlants: Plant[] = (assignedPlants || []).map(
        (p: any) => ({
          ...p,
          lat:
            p.lat === null || p.lat === undefined || p.lat === ""
              ? undefined
              : Number(p.lat),
          lng:
            p.lng === null || p.lng === undefined || p.lng === ""
              ? undefined
              : Number(p.lng),
        })
      );

      setAssignedPlants(normalizedPlants);

      // Fetch reports submitted by current user
      const reportsResponse = await fetch(
        `${BASE_URL}/reports/user/${user?.id}`,
        {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (reportsResponse.ok) {
        const userReports = await reportsResponse.json();
        setReports(userReports);
      } else {
        console.warn("Could not fetch user reports:", reportsResponse.status);
        setReports([]);
      }
    } catch (err) {
      console.error("Failed to load employee data", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to load employee data"
      );
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get last report time for a plant
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

  // Helper function to get days since last report
  const getDaysAgo = (plant: Plant) => {
    if (!plant.updated_at) return 999; // High number for never reported

    const lastUpdate = new Date(plant.updated_at);
    const now = new Date();
    return Math.floor(
      (now.getTime() - lastUpdate.getTime()) / (1000 * 3600 * 24)
    );
  };

  // Helper function to format report date
  const formatReportDate = (dateString: string) => {
    const reportDate = new Date(dateString);
    const now = new Date();
    const daysDiff = Math.floor(
      (now.getTime() - reportDate.getTime()) / (1000 * 3600 * 24)
    );

    if (daysDiff === 0) return "Today";
    if (daysDiff === 1) return "1 day ago";
    return `${daysDiff} days ago`;
  };

  // Get recent activity from reports
  const recentActivity = reports.slice(0, 3).map((report, index) => ({
    id: report.id,
    action: "Submitted quality report",
    plant: report.plant.address,
    timestamp: formatReportDate(report.created_at),
    type: "report" as const,
  }));

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
            Welcome back, {user?.name}!
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Here's an overview of your assigned plants and recent activity
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="md:col-span-1 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Assigned Plants
            </CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold text-primary">
              {assignedPlants.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Under your maintenance
            </p>
          </CardContent>
        </Card>

        <Card className="md:col-span-1 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Reports This Month
            </CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold text-success">
              {reports.length}
            </div>
            <p className="text-xs text-muted-foreground">Submitted reports</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ClipboardList className="h-5 w-5" />
              Quick Actions
            </CardTitle>
            <CardDescription className="text-sm">
              Common tasks and shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link to="/user/fill-report">
              <Button className="w-full justify-start text-base" size="lg">
                <ClipboardList className="h-4 w-4 mr-2" />
                Fill Out New Report
              </Button>
            </Link>
            <Link to="/user/work-history">
              <Button
                variant="outline"
                className="w-full justify-start text-base"
                size="lg"
              >
                <History className="h-4 w-4 mr-2" />
                View Work History
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <History className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription className="text-sm">
              Your latest actions and updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <p className="text-sm">No recent activity</p>
                <p className="text-xs">Start by submitting your first report</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 rounded-lg border"
                  >
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{activity.action}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {activity.plant}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.timestamp}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Assigned Plants */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Database className="h-5 w-5" />
            Your Assigned Plants
          </CardTitle>
          <CardDescription className="text-sm">
            Plants under your maintenance responsibility
          </CardDescription>
        </CardHeader>
        <CardContent>
          {assignedPlants.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Database className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm">No plants assigned to you yet.</p>
              <p className="text-xs">
                Contact your administrator to get assigned to plants.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {assignedPlants.map((plant) => {
                const daysAgo = getDaysAgo(plant);

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
                              daysAgo > 15
                                ? "text-danger"
                                : daysAgo > 7
                                ? "text-warning"
                                : "text-success"
                            }`}
                          >
                            {daysAgo === 999 ? "Never" : `${daysAgo} days ago`}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 space-y-2">
                        <Link to={`/user/fill-report?plantId=${plant.id}`}>
                          <Button size="sm" className="w-full text-xs">
                            Submit Report
                          </Button>
                        </Link>
                        <a
                          href={
                            typeof plant.lat === "number" &&
                            typeof plant.lng === "number"
                              ? `https://www.google.com/maps?q=${plant.lat},${plant.lng}`
                              : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                  plant.address
                                )}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full text-xs"
                          >
                            Open in Google Maps
                          </Button>
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mobile Floating Submit Report Button */}
      {assignedPlants.length > 0 && (
        <Link
          to={`/user/fill-report?plantId=${assignedPlants[0].id}`}
          className="md:hidden"
        >
          <Button
            size="icon"
            className="fixed bottom-4 right-4 z-50 h-12 w-12 rounded-full shadow-lg"
            aria-label="Submit Report"
            title="Submit Report"
          >
            <ClipboardList className="h-5 w-5" />
          </Button>
        </Link>
      )}
    </div>
  );
};

export default EmployeeDashboard;
