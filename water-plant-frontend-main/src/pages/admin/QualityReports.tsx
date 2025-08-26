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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";
import {
  FileText,
  Search,
  Eye,
  Trash2,
  Calendar,
  User,
  MapPin,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Printer,
} from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "../../lib/api";

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
  media?: Array<{
    id: string;
    url: string;
    created_at: string;
  }>;
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<Report | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalReports, setTotalReports] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const REPORTS_PAGE_SIZE = 10;

  useEffect(() => {
    // Set page title
    document.title = "Engzone - Quality Reports";

    fetchReports();
  }, [currentPage]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, employeeFilter, tehsilFilter, statusFilter, sortOrder]);

  // Debug: Log reports state changes
  useEffect(() => {
    console.log("🔄 Reports state updated:", reports);
    console.log("🔄 Reports length:", reports.length);
  }, [reports]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      console.log("🔍 Fetching reports from:", `${BASE_URL}/reports`);

      const offset = (currentPage - 1) * REPORTS_PAGE_SIZE;
      const url = `/reports?limit=${REPORTS_PAGE_SIZE}&offset=${offset}&select=id,plant,submitted_by,raw_water_tds,permeate_water_tds,raw_water_ph,permeate_water_ph,product_water_tds,product_water_flow,product_water_ph,reject_water_flow,membrane_inlet_pressure,membrane_outlet_pressure,raw_water_inlet_pressure,volts_amperes,multimedia_backwash,carbon_backwash,membrane_cleaning,arsenic_media_backwash,cip,chemical_refill_litres,cartridge_filter_replacement,membrane_replacement,created_at,updated_at,media`;

      console.log("📡 Pagination URL:", url);

      const response = await apiFetch(url);

      console.log("📊 Raw API response:", response);

      // Handle paginated response structure
      let data: any[];
      let total: number;

      if (response && typeof response === "object" && "data" in response) {
        // Paginated response: { data, total, limit, offset }
        data = response.data;
        total = response.total;
        console.log("📊 Paginated response - data length:", data.length);
        console.log("📊 Paginated response - total:", total);
      } else if (Array.isArray(response)) {
        // Fallback: direct array response (non-paginated)
        data = response;
        total = response.length;
        console.log("📊 Direct array response - length:", data.length);
      } else {
        console.error(
          "Expected paginated response or array, got:",
          typeof response,
          response
        );
        throw new Error("Invalid response format from server");
      }

      console.log("📊 Number of reports received:", data.length);

      // Ensure data is an array before processing
      if (!Array.isArray(data)) {
        console.error("Expected array response, got:", typeof data, data);
        throw new Error("Invalid response format from server");
      }

      console.log("📊 First report sample:", data[0]);
      console.log(
        "🔍 First report structure:",
        JSON.stringify(data[0], null, 2)
      );
      console.log("🔍 First report submitted_by:", data[0]?.submitted_by);
      console.log("🔍 First report plant:", data[0]?.plant);
      console.log("🔍 First report plant.address:", data[0]?.plant?.address);
      console.log("🔍 First report media:", data[0]?.media);

      // Filter out reports with null/undefined critical data
      const validReports = data.filter(
        (report: Report) => report.plant && report.plant.address
      );

      console.log("✅ Valid reports after filtering:", validReports);
      console.log("✅ Number of valid reports:", validReports.length);

      setReports(validReports);
      setTotalReports(total);
      setHasMore(data.length === REPORTS_PAGE_SIZE);
    } catch (err) {
      console.error("❌ Failed to load reports", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to load reports"
      );
      setReports([]);
      setTotalReports(0);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (report: Report) => {
    setReportToDelete(report);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!reportToDelete) return;

    try {
      const res = await fetch(`${BASE_URL}/reports/${reportToDelete.id}`, {
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
    } finally {
      setDeleteDialogOpen(false);
      setReportToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setReportToDelete(null);
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

  // Helper function to download image
  const downloadImage = async (imageUrl: string, filename?: string) => {
    try {
      toast.info("Downloading image... Please wait.");

      // Fetch the image data
      const response = await fetch(imageUrl, {
        method: "GET",
        mode: "cors",
        credentials: "omit",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Get the image as a blob
      const blob = await response.blob();

      // Create a URL for the blob
      const blobUrl = window.URL.createObjectURL(blob);

      // Create download link
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename || `report-image-${Date.now()}.jpg`;

      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the blob URL
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 1000);

      toast.success("Image downloaded successfully!");
    } catch (error) {
      console.error("Failed to download image:", error);

      // Fallback: open in new tab for manual download
      try {
        window.open(imageUrl, "_blank");
        toast.info(
          "Download failed. Image opened in new tab. Right-click and 'Save image as...' to download manually."
        );
      } catch (fallbackError) {
        toast.error("Failed to open image");
      }
    }
  };

  // Get unique employees and tehsils for filters - add null checks
  const uniqueEmployees = [
    ...new Set(
      reports
        .filter((report) => report.plant && report.plant.tehsil)
        .map((report) => report.submitted_by?.name || "Unknown User")
    ),
  ];
  const uniqueTehsils = [
    ...new Set(
      reports
        .filter((report) => report.plant && report.plant.tehsil)
        .map((report) => report.plant.tehsil)
    ),
  ];

  // Filter reports - add null checks
  let filteredReports = reports.filter((report) => {
    // Add null checks before accessing properties
    if (!report.plant) {
      console.log("⚠️ Skipping report with null plant:", report);
      return false; // Skip reports with null plant data
    }

    const matchesSearch =
      report.plant.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (report.submitted_by?.name || "Unknown User")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesEmployee =
      employeeFilter === "all" ||
      (report.submitted_by?.name || "Unknown User") === employeeFilter;
    const matchesTehsil =
      tehsilFilter === "all" || report.plant.tehsil === tehsilFilter;
    const matchesStatus =
      statusFilter === "all" || getReportStatus(report) === statusFilter;

    return matchesSearch && matchesEmployee && matchesTehsil && matchesStatus;
  });

  console.log("🔍 Filtered reports:", filteredReports);
  console.log("🔍 Filtered reports length:", filteredReports.length);
  filteredReports = filteredReports.sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
  });

  // Calculate statistics
  const stats = {
    totalReports: totalReports,
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

  const printReport = (report: Report) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const formatDate = (date: Date) => {
      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    };

    const currentDate = new Date();
    const reportDate = new Date(report.created_at);

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Water Quality Report - ${
          report.plant?.address || "Unknown Location"
        }</title>
        <style>
          @media print {
            body { margin: 0; padding: 10px; }
            .no-print { display: none !important; }
            @page { size: A4; margin: 10mm; }
          }
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 10px;
            line-height: 1.2;
            font-size: 10px;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            font-size: 10px;
          }
          .date-time {
            font-weight: bold;
          }
          .report-title {
            text-align: center;
            font-weight: bold;
            font-size: 12px;
          }
          .main-title {
            text-align: center;
            border: 1px solid #000;
            padding: 8px;
            margin-bottom: 15px;
            background-color: #f8f8f8;
          }
          .main-title h1 {
            margin: 0 0 5px 0;
            font-size: 16px;
            font-weight: bold;
          }
          .main-title h2 {
            margin: 0;
            font-size: 12px;
            color: #0066cc;
            font-weight: bold;
          }
          .site-details {
            display: flex;
            justify-content: space-between;
            margin-bottom: 15px;
          }
          .left-column, .right-column {
            width: 48%;
          }
          .detail-item {
            margin-bottom: 8px;
            font-size: 10px;
          }
          .detail-label {
            font-weight: bold;
            min-width: 80px;
            display: inline-block;
          }
          .sample-info {
            background-color: #f0f0f0;
            padding: 8px;
            margin-bottom: 15px;
            text-align: center;
            font-size: 10px;
            border: 1px solid #000;
          }
          .sample-info span {
            font-weight: bold;
          }
          .analysis-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
            font-size: 9px;
          }
          .analysis-table th, .analysis-table td {
            border: 1px solid #000;
            padding: 4px;
            text-align: center;
          }
          .analysis-table th {
            background-color: #f0f0f0;
            font-weight: bold;
          }
          .section-header {
            background-color: #e0e0e0;
            font-weight: bold;
            text-align: left;
            padding: 6px 4px;
          }
          .footer {
            text-align: center;
            margin-top: 15px;
            font-size: 9px;
            line-height: 1.2;
            border-top: 1px solid #000;
            padding-top: 8px;
          }
          .print-button {
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            color: #334155;
            border: 2px solid #cbd5e1;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            transition: all 0.2s ease-in-out;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .print-button:hover {
            background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
            border-color: #94a3b8;
            color: #1e293b;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            transform: translateY(-1px);
          }
          .print-button:active {
            transform: translateY(0);
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          }
        </style>
      </head>
      <body>
        <button class="print-button no-print" onclick="window.print()">🖨️ Print</button>
        
        <div class="header">
          <div class="date-time">${formatDate(currentDate)}, ${currentDate
      .getHours()
      .toString()
      .padStart(2, "0")}:${currentDate
      .getMinutes()
      .toString()
      .padStart(2, "0")}</div>
          <div class="report-title">Water Quality Report - ${
            report.plant?.address || "Unknown Location"
          }</div>
          <div></div>
        </div>

        <div class="main-title">
          <h1>Water Quality Report</h1>
          <h2>PLANT MANAGEMENT SYSTEM</h2>
        </div>

        <div class="site-details">
          <div class="left-column">
            <div class="detail-item">
              <span class="detail-label">Site Name:</span> ${
                report.plant?.address || "Unknown Location"
              }
            </div>
            <div class="detail-item">
              <span class="detail-label">Address:</span> ${
                report.plant?.tehsil || "Unknown Tehsil"
              }
            </div>
            <div class="detail-item">
              <span class="detail-label">Type:</span> ${
                report.plant?.type?.toUpperCase() || "UNKNOWN"
              }
            </div>
          </div>
          <div class="right-column">
            <div class="detail-item">
              <span class="detail-label">Operator:</span> ${
                report.submitted_by?.name || "Unknown User"
              }
            </div>
            <div class="detail-item">
              <span class="detail-label">Date Sampled:</span> ${formatDate(
                reportDate
              )}
            </div>
            <div class="detail-item">
              <span class="detail-label">Date Completed:</span> ${formatDate(
                reportDate
              )}
            </div>
          </div>
        </div>

        <div class="sample-info">
          <span>Sample:</span> ${
            report.plant?.type?.toUpperCase() || "UNKNOWN"
          } Plant Water | <span>Range:</span> Water Treatment
        </div>

        <table class="analysis-table">
          <thead>
            <tr>
              <th>Components</th>
              <th>Symbol</th>
              <th>Results mg/L</th>
              <th>Target Ranges (mg/L)</th>
            </tr>
          </thead>
          <tbody>
            <tr class="section-header">
              <td colspan="4">WATER QUALITY PARAMETERS</td>
            </tr>
            <tr>
              <td>Raw Water TDS</td>
              <td>TDS</td>
              <td>${report.raw_water_tds}</td>
              <td>0 - 500</td>
            </tr>
            <tr>
              <td>Permeate Water TDS</td>
              <td>P-TDS</td>
              <td>${report.permeate_water_tds}</td>
              <td>0 - 50</td>
            </tr>
            <tr>
              <td>Product Water TDS</td>
              <td>PR-TDS</td>
              <td>${report.product_water_tds}</td>
              <td>0 - 50</td>
            </tr>
            <tr>
              <td>Raw Water pH</td>
              <td>pH</td>
              <td>${report.raw_water_ph}</td>
              <td>6.5 - 8.5</td>
            </tr>
            <tr>
              <td>Permeate Water pH</td>
              <td>P-pH</td>
              <td>${report.permeate_water_ph}</td>
              <td>6.5 - 8.5</td>
            </tr>
            <tr>
              <td>Product Water pH</td>
              <td>PR-pH</td>
              <td>${report.product_water_ph}</td>
              <td>6.5 - 8.5</td>
            </tr>
            
            <tr class="section-header">
              <td colspan="4">FLOW & PRESSURE PARAMETERS</td>
            </tr>
            <tr>
              <td>Product Water Flow</td>
              <td>PWF</td>
              <td>${report.product_water_flow}</td>
              <td>50 - 200</td>
            </tr>
            <tr>
              <td>Reject Water Flow</td>
              <td>RWF</td>
              <td>${report.reject_water_flow}</td>
              <td>10 - 50</td>
            </tr>
            <tr>
              <td>Membrane Inlet Pressure</td>
              <td>MIP</td>
              <td>${report.membrane_inlet_pressure}</td>
              <td>40 - 80</td>
            </tr>
            <tr>
              <td>Membrane Outlet Pressure</td>
              <td>MOP</td>
              <td>${report.membrane_outlet_pressure}</td>
              <td>5 - 20</td>
            </tr>
            <tr>
              <td>Raw Water Inlet Pressure</td>
              <td>RWIP</td>
              <td>${report.raw_water_inlet_pressure}</td>
              <td>20 - 60</td>
            </tr>
            <tr>
              <td>Volts/Amperes</td>
              <td>V/A</td>
              <td>${report.volts_amperes}</td>
              <td>-</td>
            </tr>
            
            <tr class="section-header">
              <td colspan="4">MAINTENANCE STATUS</td>
            </tr>
            <tr>
              <td>Multimedia Backwash</td>
              <td>MMB</td>
              <td>${report.multimedia_backwash.toUpperCase()}</td>
              <td>DONE</td>
            </tr>
            <tr>
              <td>Carbon Backwash</td>
              <td>CB</td>
              <td>${report.carbon_backwash.toUpperCase()}</td>
              <td>DONE</td>
            </tr>
            <tr>
              <td>Membrane Cleaning</td>
              <td>MC</td>
              <td>${report.membrane_cleaning.toUpperCase()}</td>
              <td>DONE</td>
            </tr>
            <tr>
              <td>Arsenic Media Backwash</td>
              <td>AMB</td>
              <td>${report.arsenic_media_backwash.toUpperCase()}</td>
              <td>DONE</td>
            </tr>
            <tr>
              <td>CIP Process</td>
              <td>CIP</td>
              <td>${report.cip ? "YES" : "NO"}</td>
              <td>AS REQUIRED</td>
            </tr>
            
            <tr class="section-header">
              <td colspan="4">REPLACEMENTS & REFILLS</td>
            </tr>
            <tr>
              <td>Chemical Refill</td>
              <td>CR</td>
              <td>${report.chemical_refill_litres}</td>
              <td>0 - 50</td>
            </tr>
            <tr>
              <td>Cartridge Filter Replacement</td>
              <td>CFR</td>
              <td>${report.cartridge_filter_replacement}</td>
              <td>0 - 2</td>
            </tr>
            <tr>
              <td>Membrane Replacement</td>
              <td>MR</td>
              <td>${report.membrane_replacement}</td>
              <td>0 - 8</td>
            </tr>
          </tbody>
        </table>

        <div class="footer">
          <div>Plant Management System</div>
          <div>Quality Assurance Laboratory</div>
          <div>Professional Water Treatment Solutions</div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

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
            Showing {reports.length} of {totalReports} reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredReports.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p>No reports found matching your criteria.</p>
            </div>
          ) : (
            <>
              {/* Mobile Cards View */}
              <div className="block md:hidden space-y-4">
                {filteredReports.map((report) => (
                  <div
                    key={report.id}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h3 className="font-medium text-sm">
                          {report.plant?.address || "N/A"}
                        </h3>
                        <div className="text-xs text-muted-foreground">
                          {report.submitted_by?.name || "Unknown User"}
                        </div>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        {formatDate(report.created_at)}
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>Tehsil: {report.plant?.tehsil || "N/A"}</div>
                      <div>Raw TDS: {report.raw_water_tds} ppm</div>
                      <div>Product TDS: {report.product_water_tds} ppm</div>
                      <div>Flow Rate: {report.product_water_flow} LPH</div>
                      <div className="flex items-center gap-2">
                        Images:{" "}
                        {report.media && report.media.length > 0 ? (
                          <div className="flex items-center gap-1">
                            <div className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-xs font-medium text-blue-600">
                                {report.media.length}
                              </span>
                            </div>
                            <span>
                              {report.media.length === 1
                                ? "1 image"
                                : `${report.media.length} images`}
                            </span>
                          </div>
                        ) : (
                          <span>No images</span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedReport(report)}
                            className="text-xs h-8"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Quality Report Details</DialogTitle>
                            <DialogDescription>
                              Detailed view of quality report for{" "}
                              {report.plant?.address || "N/A"}
                            </DialogDescription>
                          </DialogHeader>
                          {selectedReport && (
                            <>
                              {/* Report Summary with Image Count */}
                              <div className="mb-4 p-3 bg-muted rounded-lg">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-muted-foreground">
                                    Report ID: {selectedReport.id}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    {selectedReport.media &&
                                    selectedReport.media.length > 0 ? (
                                      <div className="flex items-center gap-1">
                                        <svg
                                          className="w-4 h-4 text-blue-500"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                          />
                                        </svg>
                                        <span className="text-sm font-medium text-blue-600">
                                          {selectedReport.media.length}{" "}
                                          {selectedReport.media.length === 1
                                            ? "image"
                                            : "images"}{" "}
                                          attached
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="text-sm text-muted-foreground">
                                        No images attached
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <strong>Plant Information</strong>
                                  <div className="text-sm space-y-1">
                                    <div>
                                      Location:{" "}
                                      {selectedReport.plant?.address || "N/A"}
                                    </div>
                                    <div>
                                      Employee:{" "}
                                      {selectedReport.submitted_by?.name ||
                                        "Unknown User"}
                                    </div>
                                    <div>
                                      Tehsil:{" "}
                                      {selectedReport.plant?.tehsil || "N/A"}
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

                              {/* Images Section */}
                              {selectedReport.media &&
                              selectedReport.media.length > 0 ? (
                                <div className="mt-6">
                                  <div className="flex items-center gap-2 mb-3">
                                    <strong className="text-base">
                                      Report Images
                                    </strong>
                                    <div className="px-2 py-1 bg-blue-100 rounded-full">
                                      <span className="text-xs font-medium text-blue-600">
                                        {selectedReport.media.length}{" "}
                                        {selectedReport.media.length === 1
                                          ? "image"
                                          : "images"}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-3">
                                    {selectedReport.media.map((image) => (
                                      <div
                                        key={image.id}
                                        className="relative group cursor-pointer"
                                        onClick={() => {
                                          console.log(
                                            "🖼️ Image clicked:",
                                            image
                                          );
                                          downloadImage(
                                            image.url,
                                            `report-image-${image.id}.jpg`
                                          );
                                        }}
                                      >
                                        <img
                                          src={image.url}
                                          alt={`Report image ${image.id}`}
                                          className="w-full h-32 object-cover rounded-lg border hover:opacity-80 transition-opacity"
                                          title="Click to download"
                                        />
                                        {/* Download overlay */}
                                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white bg-opacity-90 rounded-full p-2">
                                            <svg
                                              className="w-5 h-5 text-gray-700"
                                              fill="none"
                                              stroke="currentColor"
                                              viewBox="0 0 24 24"
                                            >
                                              <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                              />
                                            </svg>
                                          </div>
                                        </div>
                                        {/* Click indicator */}
                                        <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                          Click
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                  <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                    <div className="flex items-center gap-2 text-blue-700">
                                      <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                      </svg>
                                      <span className="text-sm font-medium">
                                        Click any image to download. The image
                                        will be fetched and downloaded to your
                                        device.
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="mt-6 p-4 bg-gray-50 rounded-lg text-center">
                                  <p className="text-muted-foreground">
                                    No images attached to this report
                                  </p>
                                </div>
                              )}
                            </>
                          )}
                        </DialogContent>
                      </Dialog>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => printReport(report)}
                        className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-800 shadow-sm hover:shadow-md transition-all duration-200 font-medium text-xs h-8 px-3"
                        title="Print this report"
                      >
                        <Printer className="h-3 w-3 mr-1.5" />
                        Print
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClick(report)}
                        className="text-danger hover:text-danger text-xs h-8"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Plant Location</TableHead>
                      <TableHead>Employee</TableHead>
                      <TableHead>Tehsil</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Images</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <div className="flex items-center gap-2">
                              <span>{report.plant?.address || "N/A"}</span>
                              {report.media && report.media.length > 0 && (
                                <div
                                  className="w-2 h-2 bg-blue-500 rounded-full"
                                  title={`${report.media.length} image${
                                    report.media.length === 1 ? "" : "s"
                                  } attached`}
                                ></div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            {report.submitted_by?.name || "Unknown User"}
                          </div>
                        </TableCell>
                        <TableCell>{report.plant?.tehsil || "N/A"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {formatDate(report.created_at)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {report.media && report.media.length > 0 ? (
                              <>
                                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                  <span className="text-xs font-medium text-blue-600">
                                    {report.media.length}
                                  </span>
                                </div>
                                <span className="text-sm text-muted-foreground">
                                  {report.media.length === 1
                                    ? "1 image"
                                    : `${report.media.length} images`}
                                </span>
                              </>
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                No images
                              </span>
                            )}
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
                              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>
                                    Quality Report Details
                                  </DialogTitle>
                                  <DialogDescription>
                                    Detailed view of quality report for{" "}
                                    {report.plant?.address || "N/A"}
                                  </DialogDescription>
                                </DialogHeader>
                                {selectedReport && (
                                  <>
                                    {/* Report Summary with Image Count */}
                                    <div className="mb-4 p-3 bg-muted rounded-lg">
                                      <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">
                                          Report ID: {selectedReport.id}
                                        </span>
                                        <div className="flex items-center gap-2">
                                          {selectedReport.media &&
                                          selectedReport.media.length > 0 ? (
                                            <div className="flex items-center gap-1">
                                              <svg
                                                className="w-4 h-4 text-blue-500"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                              >
                                                <path
                                                  strokeLinecap="round"
                                                  strokeLinejoin="round"
                                                  strokeWidth={2}
                                                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                />
                                              </svg>
                                              <span className="text-sm font-medium text-blue-600">
                                                {selectedReport.media.length}{" "}
                                                {selectedReport.media.length ===
                                                1
                                                  ? "image"
                                                  : "images"}{" "}
                                                attached
                                              </span>
                                            </div>
                                          ) : (
                                            <span className="text-sm text-muted-foreground">
                                              No images attached
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <strong>Plant Information</strong>
                                        <div className="text-sm space-y-1">
                                          <div>
                                            Location:{" "}
                                            {selectedReport.plant?.address ||
                                              "N/A"}
                                          </div>
                                          <div>
                                            Employee:{" "}
                                            {selectedReport.submitted_by
                                              ?.name || "Unknown User"}
                                          </div>
                                          <div>
                                            Tehsil:{" "}
                                            {selectedReport.plant?.tehsil ||
                                              "N/A"}
                                          </div>
                                          <div>
                                            Date:{" "}
                                            {formatDate(
                                              selectedReport.created_at
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="space-y-2">
                                        <strong>Quality Measurements</strong>
                                        <div className="text-sm space-y-1">
                                          <div>
                                            Raw TDS:{" "}
                                            {selectedReport.raw_water_tds} ppm
                                          </div>
                                          <div>
                                            Permeate TDS:{" "}
                                            {selectedReport.permeate_water_tds}{" "}
                                            ppm
                                          </div>
                                          <div>
                                            Product TDS:{" "}
                                            {selectedReport.product_water_tds}{" "}
                                            ppm
                                          </div>
                                          <div>
                                            Product pH:{" "}
                                            {selectedReport.product_water_ph}
                                          </div>
                                          <div>
                                            Flow Rate:{" "}
                                            {selectedReport.product_water_flow}{" "}
                                            LPH
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
                                            {
                                              selectedReport.arsenic_media_backwash
                                            }
                                          </div>
                                          <div>
                                            CIP:{" "}
                                            {selectedReport.cip ? "Yes" : "No"}
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
                                            {
                                              selectedReport.membrane_replacement
                                            }
                                          </div>
                                          <div>
                                            Chemical Refill:{" "}
                                            {
                                              selectedReport.chemical_refill_litres
                                            }
                                            L
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Images Section */}
                                    {selectedReport.media &&
                                    selectedReport.media.length > 0 ? (
                                      <div className="mt-6">
                                        <div className="flex items-center gap-2 mb-3">
                                          <strong className="text-base">
                                            Report Images
                                          </strong>
                                          <div className="px-2 py-1 bg-blue-100 rounded-full">
                                            <span className="text-xs font-medium text-blue-600">
                                              {selectedReport.media.length}{" "}
                                              {selectedReport.media.length === 1
                                                ? "image"
                                                : "images"}
                                            </span>
                                          </div>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-3">
                                          {selectedReport.media.map((image) => (
                                            <div
                                              key={image.id}
                                              className="relative group cursor-pointer"
                                              onClick={() => {
                                                console.log(
                                                  "🖼️ Image clicked:",
                                                  image
                                                );
                                                downloadImage(
                                                  image.url,
                                                  `report-image-${image.id}.jpg`
                                                );
                                              }}
                                            >
                                              <img
                                                src={image.url}
                                                alt={`Report image ${image.id}`}
                                                className="w-full h-32 object-cover rounded-lg border hover:opacity-80 transition-opacity"
                                                title="Click to download"
                                              />
                                              {/* Download overlay */}
                                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white bg-opacity-90 rounded-full p-2">
                                                  <svg
                                                    className="w-5 h-5 text-gray-700"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                  >
                                                    <path
                                                      strokeLinecap="round"
                                                      strokeLinejoin="round"
                                                      strokeWidth={2}
                                                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                    />
                                                  </svg>
                                                </div>
                                              </div>
                                              {/* Click indicator */}
                                              <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                                Click
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                        <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                          <div className="flex items-center gap-2 text-blue-700">
                                            <svg
                                              className="w-4 h-4"
                                              fill="none"
                                              stroke="currentColor"
                                              viewBox="0 0 24 24"
                                            >
                                              <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                              />
                                            </svg>
                                            <span className="text-sm font-medium">
                                              Click any image to download. The
                                              image will be fetched and
                                              downloaded to your device.
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="mt-6 p-4 bg-gray-50 rounded-lg text-center">
                                        <p className="text-muted-foreground">
                                          No images attached to this report
                                        </p>
                                      </div>
                                    )}
                                  </>
                                )}
                              </DialogContent>
                            </Dialog>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => printReport(report)}
                              className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-800 shadow-sm hover:shadow-md transition-all duration-200 font-medium px-3 py-2"
                              title="Print this report"
                            >
                              <Printer className="h-4 w-4" />
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteClick(report)}
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
              </div>
            </>
          )}

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 sm:px-6 py-4 border-t">
            <div className="text-sm text-muted-foreground text-center sm:text-left">
              Showing {reports.length} of {totalReports} reports
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
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Quality Report</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this quality report? This action
              cannot be undone.
              <br />
              <br />
              <strong>This will permanently delete:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>The quality report data</li>
                <li>
                  All associated images ({reportToDelete?.media?.length || 0}{" "}
                  image{reportToDelete?.media?.length !== 1 ? "s" : ""})
                </li>
                <li>All related records and metadata</li>
              </ul>
              <br />
              <span className="text-sm text-muted-foreground">
                Report for:{" "}
                <strong>
                  {reportToDelete?.plant?.address || "Unknown Location"}
                </strong>
                <br />
                Submitted by:{" "}
                <strong>
                  {reportToDelete?.submitted_by?.name || "Unknown User"}
                </strong>
                <br />
                Date:{" "}
                <strong>
                  {reportToDelete
                    ? formatDate(reportToDelete.created_at)
                    : "Unknown"}
                </strong>
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Report
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default QualityReports;
