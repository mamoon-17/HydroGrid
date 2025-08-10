import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import {
  FileText,
  Search,
  Eye,
  Trash2,
  Calendar,
  User,
  MapPin,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

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
  raw_water_tds: number;
  permeate_water_tds: number;
  raw_water_ph: number;
  permeate_water_ph: number;
  product_water_tds: number;
  product_water_flow: number;
  product_water_ph: number;
  reject_water_flow: number;
  membrane_inlet_pressure: number;
  membrane_outlet_pressure: number;
  raw_water_inlet_pressure: number;
  volts_amperes: number;
  multimedia_backwash: "done" | "not_done" | "not_required";
  carbon_backwash: "done" | "not_done" | "not_required";
  membrane_cleaning: "done" | "not_done" | "not_required";
  arsenic_media_backwash: "done" | "not_done" | "not_required";
  cip: boolean;
  chemical_refill_litres: number;
  cartridge_filter_replacement: number;
  membrane_replacement: number;
  created_at: string;
  updated_at: string;
}

const QualityReports = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState<string>("all");
  const [tehsilFilter, setTehsilFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/reports`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        if (res.status === 403) {
          throw new Error("You don't have permission to view reports");
        }
        throw new Error(`Failed to fetch: ${res.status}`);
      }

      const data = await res.json();
      setReports(data);
    } catch (err) {
      console.error("Failed to load reports", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to load reports"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`${BASE_URL}/reports/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to delete report");
      }

      toast.success("Report deleted successfully");
      fetchReports();
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete report"
      );
    }
  };

  // Helper function to determine report status
  const getReportStatus = (report: Report) => {
    // Check if all required maintenance tasks are done
    const maintenanceTasks = [
      report.multimedia_backwash,
      report.carbon_backwash,
      report.membrane_cleaning,
      report.arsenic_media_backwash,
    ];

    const allDone = maintenanceTasks.every(
      (task) => task === "done" || task === "not_required"
    );

    if (allDone) {
      return "complete";
    } else if (maintenanceTasks.some((task) => task === "not_done")) {
      return "issues";
    } else {
      return "pending";
    }
  };

  // Helper function to get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "complete":
        return "default";
      case "pending":
        return "secondary";
      case "issues":
        return "destructive";
      default:
        return "secondary";
    }
  };

  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return (
      date.toLocaleDateString() +
      ", " +
      date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      })
    );
  };

  // Get unique employees and tehsils for filters
  const uniqueEmployees = [
    ...new Set(reports.map((report) => report.submitted_by.name)),
  ];
  const uniqueTehsils = [
    ...new Set(reports.map((report) => report.plant.tehsil)),
  ];

  // Filter reports
  let filteredReports = reports.filter((report) => {
    const matchesSearch =
      report.plant.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.submitted_by.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEmployee =
      employeeFilter === "all" || report.submitted_by.name === employeeFilter;
    const matchesTehsil =
      tehsilFilter === "all" || report.plant.tehsil === tehsilFilter;
    const matchesStatus =
      statusFilter === "all" || getReportStatus(report) === statusFilter;

    return matchesSearch && matchesEmployee && matchesTehsil && matchesStatus;
  });
  filteredReports = filteredReports.sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
  });

  // Calculate statistics
  const stats = {
    totalReports: reports.length,
    completeReports: reports.filter((r) => getReportStatus(r) === "complete")
      .length,
    issuesReports: reports.filter((r) => getReportStatus(r) === "issues")
      .length,
    thisMonthReports: reports.filter((r) => {
      const reportDate = new Date(r.created_at);
      const now = new Date();
      return (
        reportDate.getMonth() === now.getMonth() &&
        reportDate.getFullYear() === now.getFullYear()
      );
    }).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-lg">Loading reports...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Quality Reports
          </h1>
          <p className="text-muted-foreground mt-1">
            Browse and analyze quality reports from all plants
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReports}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Complete</CardTitle>
            <div className="w-3 h-3 bg-success rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {stats.completeReports}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {stats.thisMonthReports}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search & Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <Input
                placeholder="Search location or employee..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Employee</label>
              <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                  {uniqueEmployees.map((employee) => (
                    <SelectItem key={employee} value={employee}>
                      {employee}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tehsil</label>
              <Select value={tehsilFilter} onValueChange={setTehsilFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tehsils</SelectItem>
                  {uniqueTehsils.map((tehsil) => (
                    <SelectItem key={tehsil} value={tehsil}>
                      {tehsil}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="complete">Complete</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="issues">Issues</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Sort By Date</label>
              <Select
                value={sortOrder}
                onValueChange={(v) => setSortOrder(v as "desc" | "asc")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Latest to Oldest</SelectItem>
                  <SelectItem value="asc">Oldest to Latest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle>Quality Reports</CardTitle>
          <CardDescription>
            Showing {filteredReports.length} of {reports.length} reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredReports.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p>No reports found matching your criteria.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plant Location</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Tehsil</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        {report.plant.address}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {report.submitted_by.name}
                      </div>
                    </TableCell>
                    <TableCell>{report.plant.tehsil}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {formatDate(report.created_at)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedReport(report)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Quality Report Details</DialogTitle>
                              <DialogDescription>
                                Detailed view of quality report for{" "}
                                {report.plant.address}
                              </DialogDescription>
                            </DialogHeader>
                            {selectedReport && (
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <strong>Plant Information</strong>
                                  <div className="text-sm space-y-1">
                                    <div>
                                      Location: {selectedReport.plant.address}
                                    </div>
                                    <div>
                                      Employee:{" "}
                                      {selectedReport.submitted_by.name}
                                    </div>
                                    <div>
                                      Tehsil: {selectedReport.plant.tehsil}
                                    </div>
                                    <div>
                                      Date:{" "}
                                      {formatDate(selectedReport.created_at)}
                                    </div>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <strong>Quality Measurements</strong>
                                  <div className="text-sm space-y-1">
                                    <div>
                                      Raw TDS: {selectedReport.raw_water_tds}{" "}
                                      ppm
                                    </div>
                                    <div>
                                      Permeate TDS:{" "}
                                      {selectedReport.permeate_water_tds} ppm
                                    </div>
                                    <div>
                                      Product TDS:{" "}
                                      {selectedReport.product_water_tds} ppm
                                    </div>
                                    <div>
                                      Product pH:{" "}
                                      {selectedReport.product_water_ph}
                                    </div>
                                    <div>
                                      Flow Rate:{" "}
                                      {selectedReport.product_water_flow} LPH
                                    </div>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <strong>Maintenance Status</strong>
                                  <div className="text-sm space-y-1">
                                    <div>
                                      Multimedia Backwash:{" "}
                                      {selectedReport.multimedia_backwash}
                                    </div>
                                    <div>
                                      Carbon Backwash:{" "}
                                      {selectedReport.carbon_backwash}
                                    </div>
                                    <div>
                                      Membrane Cleaning:{" "}
                                      {selectedReport.membrane_cleaning}
                                    </div>
                                    <div>
                                      Arsenic Media Backwash:{" "}
                                      {selectedReport.arsenic_media_backwash}
                                    </div>
                                    <div>
                                      CIP: {selectedReport.cip ? "Yes" : "No"}
                                    </div>
                                  </div>
                                </div>
                                <div className="space-y-2">
                                  <strong>Replacements</strong>
                                  <div className="text-sm space-y-1">
                                    <div>
                                      Cartridge Filters:{" "}
                                      {
                                        selectedReport.cartridge_filter_replacement
                                      }
                                    </div>
                                    <div>
                                      Membranes:{" "}
                                      {selectedReport.membrane_replacement}
                                    </div>
                                    <div>
                                      Chemical Refill:{" "}
                                      {selectedReport.chemical_refill_litres}L
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(report.id)}
                          className="text-danger hover:text-danger"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default QualityReports;
