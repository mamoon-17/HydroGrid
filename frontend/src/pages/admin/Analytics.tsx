import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "../../components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../components/ui/popover";
import { Badge } from "../../components/ui/badge";
import { ScrollArea, ScrollBar } from "../../components/ui/scroll-area";
import {
  BarChart3,
  LineChart,
  Table as TableIcon,
  Calendar,
  ChevronDown,
  Check,
  MapPin,
  User,
  Droplets,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  LineChart as RechartsLineChart,
  Line,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { cn } from "../../lib/utils";
import { apiFetch } from "../../lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";

const Analytics = () => {
  const [viewMode, setViewMode] = useState<"table" | "chart">("table");
  const [plants, setPlants] = useState<any[]>([]);
  const [selectedPlant, setSelectedPlant] = useState<string>("");
  const [plantSelectorOpen, setPlantSelectorOpen] = useState(false);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const REPORTS_PAGE_SIZE = 5;

  // Pagination state: show exactly 5 reports per page
  const [visibleDates, setVisibleDates] = useState<string[]>([]);

  // --- Fix 2: Plant Dropdown Robustness (improved) ---
  const safePlants = Array.isArray(plants) ? plants : [];
  const safeCurrentPlant =
    safePlants.find((plant) => plant.id === selectedPlant) ||
    safePlants[0] ||
    {};
  const hasPlants = safePlants.length > 0;

  // --- Fix 3: Status Color Logic ---
  // Green: last report within 7 days, Yellow: 8-15, Red: >15 or never
  let statusColor = "bg-danger";
  let statusText = "No recent reports";
  if (reports.length > 0) {
    const lastReportDate = new Date(reports[0].created_at);
    const now = new Date();
    const daysAgo = Math.floor(
      (now.getTime() - lastReportDate.getTime()) / (1000 * 3600 * 24)
    );
    if (daysAgo <= 7) {
      statusColor = "bg-success";
      statusText = "Maintained";
    } else if (daysAgo <= 15) {
      statusColor = "bg-warning";
      statusText = "Pending";
    } else {
      statusColor = "bg-danger";
      statusText = "Warning";
    }
  }

  // Fetch plants on mount
  useEffect(() => {
    // Set page title
    document.title = "Engzone - Analytics";

    const fetchPlants = async () => {
      try {
        setLoading(true);
        const data = await apiFetch("/plants");
        setPlants(data);
        if (data.length > 0 && !selectedPlant) {
          setSelectedPlant(data[0].id);
        }
      } catch (err) {
        // handle error
      } finally {
        setLoading(false);
      }
    };
    fetchPlants();
  }, []);

  // Fetch reports for selected plant for current page
  useEffect(() => {
    if (!selectedPlant) return;
    const fetchReports = async () => {
      try {
        setLoading(true);
        const offset = (currentPage - 1) * REPORTS_PAGE_SIZE;
        const data = await apiFetch(
          `/reports/plant/${selectedPlant}?limit=${REPORTS_PAGE_SIZE}&offset=${offset}`
        );
        setReports(data);
        setHasMore(Array.isArray(data) && data.length === REPORTS_PAGE_SIZE);
        const dates = (Array.isArray(data) ? data : [])
          .map((r) => r.created_at)
          .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
        setVisibleDates(dates);
      } catch (err) {
        setReports([]);
        setHasMore(false);
        setVisibleDates([]);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [selectedPlant, currentPage]);

  // Reset to first page when plant changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedPlant]);

  const currentPlant =
    plants.find((plant) => plant.id === selectedPlant) || plants[0];

  // Build parameter history from reports
  const parameterKeys =
    reports.length > 0
      ? Object.keys(reports[0]).filter((k) =>
          [
            "raw_water_tds",
            "permeate_water_tds",
            "raw_water_ph",
            "permeate_water_ph",
            "product_water_tds",
            "product_water_flow",
            "product_water_ph",
            "reject_water_flow",
            "membrane_inlet_pressure",
            "membrane_outlet_pressure",
            "raw_water_inlet_pressure",
            "volts_amperes",
            "chemical_refill_litres",
            "cartridge_filter_replacement",
            "membrane_replacement",
          ].includes(k)
        )
      : [];

  const parameterLabels: Record<string, string> = {
    raw_water_tds: "Raw Water TDS (ppm)",
    permeate_water_tds: "Permeate Water TDS (ppm)",
    raw_water_ph: "Raw Water pH",
    permeate_water_ph: "Permeate Water pH",
    product_water_tds: "Product Water TDS (ppm)",
    product_water_flow: "Product Water Flow (LPH)",
    product_water_ph: "Product Water pH",
    reject_water_flow: "Reject Water Flow (LPH)",
    membrane_inlet_pressure: "Membrane Inlet Pressure (PSI)",
    membrane_outlet_pressure: "Membrane Outlet Pressure (PSI)",
    raw_water_inlet_pressure: "Raw Water Inlet Pressure (PSI)",
    volts_amperes: "Volts/Amperes",
    chemical_refill_litres: "Chemical Refill (L)",
    cartridge_filter_replacement: "Cartridge Filter Replacement",
    membrane_replacement: "Membrane Replacement",
  };

  const allDates = reports
    .map((r) => r.created_at)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  // Fix: Popover/plant selector should always be clickable
  const handlePlantSelect = (plantId: string) => {
    setSelectedPlant(plantId);
    setPlantSelectorOpen(false);
  };

  // Chart data: build from reports (fallback to empty if no data)
  const chartData =
    reports.length > 0
      ? reports.map((r) => ({
          date: new Date(r.created_at).toLocaleDateString(),
          flowRate: r.product_water_flow,
          tds: r.product_water_tds,
          inletPressure: r.membrane_inlet_pressure,
          outletPressure: r.membrane_outlet_pressure,
        }))
      : [];

  const getValueChangeIndicator = (current: number, previous: number) => {
    if (current > previous) return { icon: "↗", color: "text-success" };
    if (current < previous) return { icon: "↘", color: "text-danger" };
    return { icon: "→", color: "text-muted-foreground" };
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Responsive Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Analytics
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Historical performance data and parameter tracking
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button
            variant={viewMode === "table" ? "default" : "outline"}
            onClick={() => setViewMode("table")}
            className="flex items-center justify-center gap-2 w-full sm:w-auto"
            size="sm"
          >
            <TableIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Historical Data</span>
            <span className="sm:hidden">Table</span>
          </Button>
          <Button
            variant={viewMode === "chart" ? "default" : "outline"}
            onClick={() => setViewMode("chart")}
            className="flex items-center justify-center gap-2 w-full sm:w-auto"
            size="sm"
          >
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Chart View</span>
            <span className="sm:hidden">Charts</span>
          </Button>
        </div>
      </div>

      {/* Plant Selector - Mobile Optimized */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-3">
            <label className="text-sm font-medium text-muted-foreground">
              Select Plant
            </label>
            <Select
              value={selectedPlant}
              onValueChange={(value) => handlePlantSelect(value)}
              disabled={!hasPlants}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a plant..." />
              </SelectTrigger>
              <SelectContent>
                {safePlants.map((plant) => (
                  <SelectItem key={plant.id} value={plant.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{plant.address}</span>
                      <span className="text-xs text-muted-foreground">
                        {plant.type?.toUpperCase()} •{" "}
                        {plant.capacity?.toLocaleString()} LPH
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Plant Information Header - Mobile Optimized */}
      <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
        <CardContent className="p-4 md:p-6">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Droplets className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg md:text-2xl font-bold text-foreground">
                    {safeCurrentPlant?.address}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {safeCurrentPlant?.type?.toUpperCase()} Plant •{" "}
                    {safeCurrentPlant?.capacity?.toLocaleString()} LPH
                  </p>
                </div>
              </div>
              <Badge
                variant="outline"
                className="capitalize text-xs md:text-sm"
              >
                {safeCurrentPlant?.type} System
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              <div className="flex items-center gap-2 p-3 bg-background/50 rounded-lg">
                <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {safeCurrentPlant?.address}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {safeCurrentPlant?.tehsil}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-background/50 rounded-lg">
                <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {safeCurrentPlant?.employee?.name || "Unassigned"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Assigned Employee
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-background/50 rounded-lg sm:col-span-2 lg:col-span-1">
                <div className="h-4 w-4 flex items-center justify-center">
                  <div className={`h-2 w-2 rounded-full ${statusColor}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground capitalize">
                    {statusText}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Current Status
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      {viewMode === "table" ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Parameter History
            </CardTitle>
            <CardDescription>
              Historical values for each parameter with timestamps and reporting
              details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Mobile Cards View */}
            <div className="block md:hidden space-y-4">
              {reports.map((report) => {
                const date = new Date(report.created_at);
                return (
                  <div
                    key={report.created_at}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h3 className="font-medium text-sm">
                          {date.toLocaleDateString()}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {date.toLocaleTimeString()}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {report.submitted_by?.name || "Unknown"}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                      {parameterKeys.map((paramKey) => (
                        <div
                          key={paramKey}
                          className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0"
                        >
                          <span className="text-xs font-medium text-muted-foreground">
                            {parameterLabels[paramKey]}
                          </span>
                          <span className="text-sm font-semibold">
                            {report && report[paramKey] !== undefined ? (
                              report[paramKey]
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block">
              <div className="overflow-x-auto">
                <table
                  style={{
                    minWidth: "100%",
                    tableLayout: "fixed",
                    borderCollapse: "separate",
                  }}
                >
                  <thead>
                    <tr className="border-b-2">
                      <th
                        style={{
                          minWidth: 200,
                          position: "sticky",
                          left: 0,
                          zIndex: 2,
                          background: "#fff",
                        }}
                        className="font-semibold border-r"
                      >
                        Parameter
                      </th>
                      {reports.map((report) => {
                        const date = new Date(report.created_at);
                        return (
                          <th
                            key={report.created_at}
                            style={{ minWidth: 160 }}
                            className="text-center border-l"
                          >
                            <div className="flex flex-col">
                              <span className="font-semibold">
                                {date.toLocaleDateString()}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {date.toLocaleTimeString()}
                              </span>
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {parameterKeys.map((paramKey) => (
                      <tr key={paramKey} className="hover:bg-muted/30">
                        <td
                          style={{
                            minWidth: 200,
                            position: "sticky",
                            left: 0,
                            zIndex: 2,
                            background: "#fff",
                          }}
                          className="font-medium border-r"
                        >
                          <div className="flex flex-col">
                            <span className="font-semibold text-foreground">
                              {parameterLabels[paramKey]}
                            </span>
                          </div>
                        </td>
                        {reports.map((report) => (
                          <td
                            key={report.created_at}
                            style={{ minWidth: 160 }}
                            className="text-center border-l relative group"
                          >
                            {report && report[paramKey] !== undefined ? (
                              <div className="flex flex-col items-center space-y-1">
                                <span className="font-semibold text-foreground">
                                  {report[paramKey]}
                                </span>
                                {report.submitted_by && (
                                  <div
                                    className="absolute left-1/2 -translate-x-1/2 bg-popover border rounded-md p-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity z-20 whitespace-nowrap pointer-events-none shadow-lg"
                                    style={{
                                      bottom: "-2.5rem",
                                      top: "auto",
                                      marginTop: 0,
                                      marginBottom: 0,
                                      // If this is the last row, show above
                                      ...(paramKey ===
                                      parameterKeys[parameterKeys.length - 1]
                                        ? { bottom: "auto", top: "-2.5rem" }
                                        : {}),
                                    }}
                                  >
                                    <div>
                                      Reported by:{" "}
                                      {report.submitted_by.name || "Unknown"}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">
                                —
                              </span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination Controls - Mobile Optimized */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 sm:px-6 py-4 border-t">
              <div className="text-sm text-muted-foreground text-center sm:text-left">
                Showing {reports.length} reports
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1 || loading}
                  className="flex items-center gap-1 h-9 px-3"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Previous</span>
                  <span className="sm:hidden">Prev</span>
                </Button>
                <span className="text-sm text-muted-foreground px-2 sm:px-3 min-w-[60px] text-center">
                  Page {currentPage}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => p + 1)}
                  disabled={!hasMore || loading}
                  className="flex items-center gap-1 h-9 px-3"
                >
                  <span className="hidden sm:inline">Next</span>
                  <span className="sm:hidden">Next</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Tabs defaultValue="line" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger
                value="line"
                className="flex items-center justify-center gap-2 text-xs sm:text-sm"
                onClick={() => setViewMode("chart")}
              >
                <LineChart className="h-4 w-4" />
                <span className="hidden sm:inline">Line Chart</span>
                <span className="sm:hidden">Line</span>
              </TabsTrigger>
              <TabsTrigger
                value="bar"
                className="flex items-center justify-center gap-2 text-xs sm:text-sm"
                onClick={() => setViewMode("chart")}
              >
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Bar Chart</span>
                <span className="sm:hidden">Bar</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="line" className="space-y-4">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base md:text-lg">
                      Flow Rate & TDS Trends
                    </CardTitle>
                    <CardDescription className="text-xs md:text-sm">
                      Monthly performance tracking
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer
                      width="100%"
                      height={250}
                      className="min-h-[250px]"
                    >
                      <RechartsLineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="flowRate"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          name="Flow Rate (LPH)"
                        />
                        <Line
                          type="monotone"
                          dataKey="tds"
                          stroke="hsl(var(--accent))"
                          strokeWidth={2}
                          name="TDS (ppm)"
                        />
                      </RechartsLineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base md:text-lg">
                      Pressure Monitoring
                    </CardTitle>
                    <CardDescription className="text-xs md:text-sm">
                      Inlet vs Outlet pressure trends
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer
                      width="100%"
                      height={250}
                      className="min-h-[250px]"
                    >
                      <RechartsLineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="inletPressure"
                          stroke="hsl(var(--success))"
                          strokeWidth={2}
                          name="Inlet Pressure (PSI)"
                        />
                        <Line
                          type="monotone"
                          dataKey="outletPressure"
                          stroke="hsl(var(--warning))"
                          strokeWidth={2}
                          name="Outlet Pressure (PSI)"
                        />
                      </RechartsLineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="bar" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base md:text-lg">
                    Performance Comparison
                  </CardTitle>
                  <CardDescription className="text-xs md:text-sm">
                    Monthly performance metrics comparison
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer
                    width="100%"
                    height={300}
                    className="min-h-[300px]"
                  >
                    <RechartsBarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="flowRate"
                        fill="hsl(var(--primary))"
                        name="Flow Rate (LPH)"
                      />
                      <Bar
                        dataKey="tds"
                        fill="hsl(var(--accent))"
                        name="TDS (ppm)"
                      />
                      <Bar
                        dataKey="inletPressure"
                        fill="hsl(var(--success))"
                        name="Inlet Pressure (PSI)"
                      />
                      <Bar
                        dataKey="outletPressure"
                        fill="hsl(var(--warning))"
                        name="Outlet Pressure (PSI)"
                      />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default Analytics;
