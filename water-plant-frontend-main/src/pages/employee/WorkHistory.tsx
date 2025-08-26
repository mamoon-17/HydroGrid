import { useState, useEffect } from "react";
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
  History,
  Calendar,
  MapPin,
  Eye,
  Filter,
  FileText,
  Loader2,
  ExternalLink,
  Printer,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { toast } from "sonner";
import { Label } from "../../components/ui/label";
import { apiFetch } from "../../lib/api";

interface Report {
  id: string;
  plant: {
    id: string;
    address: string;
    tehsil: string;
    type: "uf" | "ro";
    lat: number;
    lng: number;
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
  notes?: string;
  created_at: string;
  updated_at: string;
  edit_count: number; // Added for edit count
  media?: { id: string; url: string }[]; // Add media for images
}

const WorkHistory = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [plantFilter, setPlantFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  // 1. Add edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const openEdit = (report: Report) => {
    setEditReport(report);
    setEditForm({ ...report, _newFiles: [], _mediaToRemove: [] });
    setEditDialogOpen(true);
  };
  const closeEdit = () => {
    setEditDialogOpen(false);
    setEditReport(null);
    setEditForm(null);
  };
  const [editReport, setEditReport] = useState<Report | null>(null);
  const [editForm, setEditForm] = useState<any>(null);

  useEffect(() => {
    if (user) {
      // Set page title
      document.title = "Engzone - Work History";

      fetchUserReports();
    }
  }, [user]);

  const fetchUserReports = async () => {
    try {
      setLoading(true);
      const userReports = await apiFetch(`/reports/user/${user?.id}`);
      console.log("User reports received:", userReports);
      console.log("First report plant data:", userReports[0]?.plant);
      setReports(userReports);
    } catch (err) {
      console.error("Failed to load user reports", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to load work history"
      );
    } finally {
      setLoading(false);
    }
  };

  const uniquePlants = [
    ...new Set(reports.map((report) => report.plant.address)),
  ];

  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      report.plant.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (report.notes &&
        report.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesPlant =
      plantFilter === "all" || report.plant.address === plantFilter;

    let matchesDate = true;
    if (dateFilter !== "all") {
      const reportDate = new Date(report.created_at);
      const now = new Date();
      switch (dateFilter) {
        case "week": {
          matchesDate =
            now.getTime() - reportDate.getTime() <= 7 * 24 * 60 * 60 * 1000;
          break;
        }
        case "month": {
          matchesDate =
            reportDate.getMonth() === now.getMonth() &&
            reportDate.getFullYear() === now.getFullYear();
          break;
        }
        case "quarter": {
          const quarter = Math.floor(now.getMonth() / 3);
          const reportQuarter = Math.floor(reportDate.getMonth() / 3);
          matchesDate =
            quarter === reportQuarter &&
            reportDate.getFullYear() === now.getFullYear();
          break;
        }
      }
    }

    return matchesSearch && matchesPlant && matchesDate;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const stats = {
    totalReports: reports.length,
    thisMonth: reports.filter(
      (r) => new Date(r.created_at).getMonth() === new Date().getMonth()
    ).length,
    averagePerWeek: Math.round((reports.length / 4) * 10) / 10,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-lg">Loading work history...</span>
        </div>
      </div>
    );
  }

  const openInGoogleMaps = (lat: number, lng: number, _address: string) => {
    const baseUrl = "https://www.google.com/maps";
    const searchParams = new URLSearchParams({
      q: `${lat},${lng}`,
      ll: `${lat},${lng}`,
      z: "15",
    });
    window.open(`${baseUrl}?${searchParams.toString()}`, "_blank");
  };

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
          report.plant.address || "Unknown Location"
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
            report.plant.address || "Unknown Location"
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
                report.plant.address || "Unknown Location"
              }
            </div>
            <div class="detail-item">
              <span class="detail-label">Address:</span> ${
                report.plant.tehsil || "Unknown Tehsil"
              }
            </div>
            <div class="detail-item">
              <span class="detail-label">Type:</span> ${
                report.plant.type?.toUpperCase() || "UNKNOWN"
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
            report.plant.type?.toUpperCase() || "UNKNOWN"
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
          <h1 className="text-3xl font-bold text-foreground">Work History</h1>
          <p className="text-muted-foreground mt-1">
            View and track all your submitted reports
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="md:col-span-1 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {stats.totalReports}
            </div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card className="md:col-span-1 lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">
              {stats.thisMonth}
            </div>
            <p className="text-xs text-muted-foreground">Reports submitted</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
          <CardDescription>Filter your work history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search by plant or notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="plant">Plant</Label>
              <Select value={plantFilter} onValueChange={setPlantFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All plants" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All plants</SelectItem>
                  {uniquePlants.map((plant) => (
                    <SelectItem key={plant} value={plant}>
                      {plant}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date Range</Label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All time</SelectItem>
                  <SelectItem value="week">This week</SelectItem>
                  <SelectItem value="month">This month</SelectItem>
                  <SelectItem value="quarter">This quarter</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Card>
        <CardHeader>
          <CardTitle>Reports</CardTitle>
          <CardDescription>
            {filteredReports.length} of {reports.length} reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredReports.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p>No reports found</p>
              <p className="text-sm">
                Try adjusting your filters or submit your first report
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plant</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Raw TDS</TableHead>
                  <TableHead>Product TDS</TableHead>
                  <TableHead>Flow Rate</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {report.plant.address}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {report.plant.type.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>{report.raw_water_tds} ppm</TableCell>
                    <TableCell>{report.product_water_tds} ppm</TableCell>
                    <TableCell>{report.product_water_flow} LPH</TableCell>
                    <TableCell>{formatDate(report.created_at)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {/* View Button */}
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
                          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Report Details</DialogTitle>
                              <DialogDescription>
                                Quality and maintenance report for{" "}
                                {report.plant.address}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-4">
                                <div>
                                  <h3 className="font-semibold mb-2">
                                    Plant Information
                                  </h3>
                                  <div className="space-y-1 text-sm">
                                    <p>
                                      <span className="font-medium">
                                        Address:
                                      </span>{" "}
                                      {report.plant.address}
                                    </p>
                                    <p>
                                      <span className="font-medium">Type:</span>{" "}
                                      {report.plant.type.toUpperCase()}
                                    </p>
                                    <p>
                                      <span className="font-medium">
                                        Tehsil:
                                      </span>{" "}
                                      {report.plant.tehsil}
                                    </p>
                                  </div>
                                </div>

                                <div>
                                  <h3 className="font-semibold mb-2">
                                    Water Quality
                                  </h3>
                                  <div className="space-y-1 text-sm">
                                    <p>
                                      <span className="font-medium">
                                        Raw TDS:
                                      </span>{" "}
                                      {report.raw_water_tds} ppm
                                    </p>
                                    <p>
                                      <span className="font-medium">
                                        Permeate TDS:
                                      </span>{" "}
                                      {report.permeate_water_tds} ppm
                                    </p>
                                    <p>
                                      <span className="font-medium">
                                        Product TDS:
                                      </span>{" "}
                                      {report.product_water_tds} ppm
                                    </p>
                                    <p>
                                      <span className="font-medium">
                                        Raw pH:
                                      </span>{" "}
                                      {report.raw_water_ph}
                                    </p>
                                    <p>
                                      <span className="font-medium">
                                        Permeate pH:
                                      </span>{" "}
                                      {report.permeate_water_ph}
                                    </p>
                                    <p>
                                      <span className="font-medium">
                                        Product pH:
                                      </span>{" "}
                                      {report.product_water_ph}
                                    </p>
                                  </div>
                                </div>

                                <div>
                                  <h3 className="font-semibold mb-2">
                                    Flow & Pressure
                                  </h3>
                                  <div className="space-y-1 text-sm">
                                    <p>
                                      <span className="font-medium">
                                        Product Flow:
                                      </span>{" "}
                                      {report.product_water_flow} LPH
                                    </p>
                                    <p>
                                      <span className="font-medium">
                                        Reject Flow:
                                      </span>{" "}
                                      {report.reject_water_flow} LPH
                                    </p>
                                    <p>
                                      <span className="font-medium">
                                        Membrane Inlet Pressure:
                                      </span>{" "}
                                      {report.membrane_inlet_pressure} PSI
                                    </p>
                                    <p>
                                      <span className="font-medium">
                                        Membrane Outlet Pressure:
                                      </span>{" "}
                                      {report.membrane_outlet_pressure} PSI
                                    </p>
                                    <p>
                                      <span className="font-medium">
                                        Raw Water Inlet Pressure:
                                      </span>{" "}
                                      {report.raw_water_inlet_pressure} PSI
                                    </p>
                                    <p>
                                      <span className="font-medium">
                                        Volts/Amperes:
                                      </span>{" "}
                                      {report.volts_amperes}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-4">
                                <div>
                                  <h3 className="font-semibold mb-2">
                                    Maintenance Activities
                                  </h3>
                                  <div className="space-y-1 text-sm">
                                    <p>
                                      <span className="font-medium">
                                        Multimedia Backwash:
                                      </span>
                                      <Badge variant="outline" className="ml-2">
                                        {report.multimedia_backwash}
                                      </Badge>
                                    </p>
                                    <p>
                                      <span className="font-medium">
                                        Carbon Backwash:
                                      </span>
                                      <Badge variant="outline" className="ml-2">
                                        {report.carbon_backwash}
                                      </Badge>
                                    </p>
                                    <p>
                                      <span className="font-medium">
                                        Membrane Cleaning:
                                      </span>
                                      <Badge variant="outline" className="ml-2">
                                        {report.membrane_cleaning}
                                      </Badge>
                                    </p>
                                    <p>
                                      <span className="font-medium">
                                        Arsenic Media Backwash:
                                      </span>
                                      <Badge variant="outline" className="ml-2">
                                        {report.arsenic_media_backwash}
                                      </Badge>
                                    </p>
                                    <p>
                                      <span className="font-medium">CIP:</span>
                                      <Badge variant="outline" className="ml-2">
                                        {report.cip ? "Yes" : "No"}
                                      </Badge>
                                    </p>
                                  </div>
                                </div>

                                <div>
                                  <h3 className="font-semibold mb-2">
                                    Replacements
                                  </h3>
                                  <div className="space-y-1 text-sm">
                                    <p>
                                      <span className="font-medium">
                                        Cartridge Filter:
                                      </span>{" "}
                                      {report.cartridge_filter_replacement}
                                    </p>
                                    <p>
                                      <span className="font-medium">
                                        Membrane:
                                      </span>{" "}
                                      {report.membrane_replacement}
                                    </p>
                                    <p>
                                      <span className="font-medium">
                                        Chemical Refill:
                                      </span>{" "}
                                      {report.chemical_refill_litres} litres
                                    </p>
                                  </div>
                                </div>

                                {report.notes && (
                                  <div>
                                    <h3 className="font-semibold mb-2">
                                      Notes
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                      {report.notes}
                                    </p>
                                  </div>
                                )}

                                {report.media && report.media.length > 0 && (
                                  <div>
                                    <h3 className="font-semibold mb-2">
                                      Pictures
                                    </h3>
                                    <div className="grid grid-cols-3 gap-2">
                                      {report.media.map((m) => (
                                        <button
                                          key={m.id}
                                          type="button"
                                          className="block w-full h-24 overflow-hidden rounded border"
                                          onClick={() =>
                                            window.open(m.url, "_blank")
                                          }
                                          title="Click to open"
                                        >
                                          <img
                                            src={m.url}
                                            alt="Report media"
                                            className="w-full h-full object-cover"
                                          />
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

                        {/* Google Maps Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={
                            !report.plant.lat ||
                            !report.plant.lng ||
                            Number(report.plant.lat) === 0 ||
                            Number(report.plant.lng) === 0
                          }
                          onClick={() =>
                            openInGoogleMaps(
                              report.plant.lat!,
                              report.plant.lng!,
                              report.plant.address
                            )
                          }
                          className="text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          title={
                            report.plant.lat &&
                            report.plant.lng &&
                            Number(report.plant.lat) !== 0 &&
                            Number(report.plant.lng) !== 0
                              ? `Open ${report.plant.address} in Google Maps`
                              : "No coordinates available"
                          }
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>

                        {/* Print Report Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => printReport(report)}
                          className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-800 shadow-sm hover:shadow-md transition-all duration-200 font-medium px-3 py-2"
                          title="Print this report"
                        >
                          <Printer className="h-4 w-4" />
                        </Button>

                        {/* Edit Button */}
                        <Dialog
                          open={editDialogOpen}
                          onOpenChange={(open) => {
                            if (!open) closeEdit();
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={report.edit_count >= 2}
                              onClick={() => openEdit(report)}
                            >
                              Edit
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Edit Report</DialogTitle>
                              <DialogDescription />
                            </DialogHeader>
                            {report.edit_count >= 2 ? (
                              <div className="text-danger">
                                You can only edit a report twice.
                              </div>
                            ) : editForm ? (
                              <form
                                onSubmit={async (e) => {
                                  e.preventDefault();
                                  try {
                                    const cleanEnum = (val, allowed) =>
                                      allowed.includes(val) ? val : allowed[0];
                                    const allowedBackwash = [
                                      "done",
                                      "not_done",
                                      "not_required",
                                    ];
                                    const payload = {
                                      raw_water_tds:
                                        Number(editForm.raw_water_tds) || 0,
                                      permeate_water_tds:
                                        Number(editForm.permeate_water_tds) ||
                                        0,
                                      raw_water_ph:
                                        Number(editForm.raw_water_ph) || 0,
                                      permeate_water_ph:
                                        Number(editForm.permeate_water_ph) || 0,
                                      product_water_tds:
                                        Number(editForm.product_water_tds) || 0,
                                      product_water_flow:
                                        Number(editForm.product_water_flow) ||
                                        0,
                                      product_water_ph:
                                        Number(editForm.product_water_ph) || 0,
                                      reject_water_flow:
                                        Number(editForm.reject_water_flow) || 0,
                                      membrane_inlet_pressure:
                                        Number(
                                          editForm.membrane_inlet_pressure
                                        ) || 0,
                                      membrane_outlet_pressure:
                                        Number(
                                          editForm.membrane_outlet_pressure
                                        ) || 0,
                                      raw_water_inlet_pressure:
                                        Number(
                                          editForm.raw_water_inlet_pressure
                                        ) || 0,
                                      volts_amperes:
                                        Number(editForm.volts_amperes) || 0,
                                      chemical_refill_litres:
                                        Number(
                                          editForm.chemical_refill_litres
                                        ) || 0,
                                      cartridge_filter_replacement: Math.max(
                                        0,
                                        Math.min(
                                          2,
                                          Number(
                                            editForm.cartridge_filter_replacement
                                          ) || 0
                                        )
                                      ),
                                      membrane_replacement: Math.max(
                                        0,
                                        Math.min(
                                          8,
                                          Number(
                                            editForm.membrane_replacement
                                          ) || 0
                                        )
                                      ),
                                      cip:
                                        editForm.cip === true ||
                                        editForm.cip === "yes",
                                      multimedia_backwash: cleanEnum(
                                        editForm.multimedia_backwash,
                                        allowedBackwash
                                      ),
                                      carbon_backwash: cleanEnum(
                                        editForm.carbon_backwash,
                                        allowedBackwash
                                      ),
                                      membrane_cleaning: cleanEnum(
                                        editForm.membrane_cleaning,
                                        allowedBackwash
                                      ),
                                      arsenic_media_backwash: cleanEnum(
                                        editForm.arsenic_media_backwash,
                                        allowedBackwash
                                      ),
                                      notes: editForm.notes || "",
                                    };

                                    // If no media changes queued, send JSON only
                                    const hasNewFiles =
                                      editForm._newFiles &&
                                      editForm._newFiles.length > 0;
                                    const hasRemovals =
                                      editForm._mediaToRemove &&
                                      editForm._mediaToRemove.length > 0;
                                    if (!hasNewFiles && !hasRemovals) {
                                      await apiFetch(
                                        `/reports/${editReport.id}`,
                                        {
                                          method: "PATCH",
                                          body: JSON.stringify(payload),
                                        }
                                      );
                                    } else {
                                      const fd = new FormData();
                                      Object.entries(payload).forEach(
                                        ([k, v]) => fd.append(k, String(v))
                                      );
                                      // append removals
                                      (editForm._mediaToRemove || []).forEach(
                                        (id) => fd.append("mediaToRemove", id)
                                      );
                                      // append new files
                                      (editForm._newFiles || []).forEach(
                                        (file) => fd.append("files", file)
                                      );

                                      await fetch(
                                        `${
                                          import.meta.env.VITE_API_BASE_URL
                                        }/reports/${editReport.id}`,
                                        {
                                          method: "PATCH",
                                          credentials: "include",
                                          body: fd,
                                        }
                                      ).then(async (res) => {
                                        if (!res.ok) {
                                          const err = await res
                                            .json()
                                            .catch(() => ({}));
                                          throw new Error(
                                            err.message || "API error"
                                          );
                                        }
                                      });
                                    }

                                    toast.success(
                                      "Report updated successfully!"
                                    );
                                    setEditDialogOpen(false);
                                    fetchUserReports();
                                  } catch (err) {
                                    toast.error(
                                      err instanceof Error
                                        ? err.message
                                        : "Failed to update report"
                                    );
                                  }
                                }}
                              >
                                <Label htmlFor="raw_water_tds">
                                  Raw Water TDS
                                </Label>
                                <Input
                                  id="raw_water_tds"
                                  type="number"
                                  value={editForm.raw_water_tds}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      raw_water_tds: e.target.value,
                                    })
                                  }
                                />
                                <Label htmlFor="permeate_water_tds">
                                  Permeate Water TDS
                                </Label>
                                <Input
                                  id="permeate_water_tds"
                                  type="number"
                                  value={editForm.permeate_water_tds}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      permeate_water_tds: e.target.value,
                                    })
                                  }
                                />
                                <Label htmlFor="raw_water_ph">
                                  Raw Water pH
                                </Label>
                                <Input
                                  id="raw_water_ph"
                                  type="number"
                                  step="0.01"
                                  value={editForm.raw_water_ph}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      raw_water_ph: e.target.value,
                                    })
                                  }
                                />
                                <Label htmlFor="permeate_water_ph">
                                  Permeate Water pH
                                </Label>
                                <Input
                                  id="permeate_water_ph"
                                  type="number"
                                  step="0.01"
                                  value={editForm.permeate_water_ph}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      permeate_water_ph: e.target.value,
                                    })
                                  }
                                />
                                <Label htmlFor="product_water_tds">
                                  Product Water TDS
                                </Label>
                                <Input
                                  id="product_water_tds"
                                  type="number"
                                  value={editForm.product_water_tds}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      product_water_tds: e.target.value,
                                    })
                                  }
                                />
                                <Label htmlFor="product_water_flow">
                                  Product Water Flow
                                </Label>
                                <Input
                                  id="product_water_flow"
                                  type="number"
                                  value={editForm.product_water_flow}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      product_water_flow: e.target.value,
                                    })
                                  }
                                />
                                <Label htmlFor="product_water_ph">
                                  Product Water pH
                                </Label>
                                <Input
                                  id="product_water_ph"
                                  type="number"
                                  step="0.01"
                                  value={editForm.product_water_ph}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      product_water_ph: e.target.value,
                                    })
                                  }
                                />
                                <Label htmlFor="reject_water_flow">
                                  Reject Water Flow
                                </Label>
                                <Input
                                  id="reject_water_flow"
                                  type="number"
                                  value={editForm.reject_water_flow}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      reject_water_flow: e.target.value,
                                    })
                                  }
                                />
                                <Label htmlFor="membrane_inlet_pressure">
                                  Membrane Inlet Pressure
                                </Label>
                                <Input
                                  id="membrane_inlet_pressure"
                                  type="number"
                                  value={editForm.membrane_inlet_pressure}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      membrane_inlet_pressure: e.target.value,
                                    })
                                  }
                                />
                                <Label htmlFor="membrane_outlet_pressure">
                                  Membrane Outlet Pressure
                                </Label>
                                <Input
                                  id="membrane_outlet_pressure"
                                  type="number"
                                  value={editForm.membrane_outlet_pressure}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      membrane_outlet_pressure: e.target.value,
                                    })
                                  }
                                />
                                <Label htmlFor="raw_water_inlet_pressure">
                                  Raw Water Inlet Pressure
                                </Label>
                                <Input
                                  id="raw_water_inlet_pressure"
                                  type="number"
                                  value={editForm.raw_water_inlet_pressure}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      raw_water_inlet_pressure: e.target.value,
                                    })
                                  }
                                />
                                <Label htmlFor="volts_amperes">
                                  Volts/Amperes
                                </Label>
                                <Input
                                  id="volts_amperes"
                                  type="number"
                                  value={editForm.volts_amperes}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      volts_amperes: e.target.value,
                                    })
                                  }
                                />
                                <Label htmlFor="multimedia_backwash">
                                  Multimedia Backwash
                                </Label>
                                <Select
                                  value={editForm.multimedia_backwash}
                                  onValueChange={(value) =>
                                    setEditForm({
                                      ...editForm,
                                      multimedia_backwash: value,
                                    })
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="done">Done</SelectItem>
                                    <SelectItem value="not_done">
                                      Not Done
                                    </SelectItem>
                                    <SelectItem value="not_required">
                                      Not Required
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                                <Label htmlFor="carbon_backwash">
                                  Carbon Backwash
                                </Label>
                                <Select
                                  value={editForm.carbon_backwash}
                                  onValueChange={(value) =>
                                    setEditForm({
                                      ...editForm,
                                      carbon_backwash: value,
                                    })
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="done">Done</SelectItem>
                                    <SelectItem value="not_done">
                                      Not Done
                                    </SelectItem>
                                    <SelectItem value="not_required">
                                      Not Required
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                                <Label htmlFor="membrane_cleaning">
                                  Membrane Cleaning
                                </Label>
                                <Select
                                  value={editForm.membrane_cleaning}
                                  onValueChange={(value) =>
                                    setEditForm({
                                      ...editForm,
                                      membrane_cleaning: value,
                                    })
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="done">Done</SelectItem>
                                    <SelectItem value="not_done">
                                      Not Done
                                    </SelectItem>
                                    <SelectItem value="not_required">
                                      Not Required
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                                <Label htmlFor="arsenic_media_backwash">
                                  Arsenic Media Backwash
                                </Label>
                                <Select
                                  value={editForm.arsenic_media_backwash}
                                  onValueChange={(value) =>
                                    setEditForm({
                                      ...editForm,
                                      arsenic_media_backwash: value,
                                    })
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="done">Done</SelectItem>
                                    <SelectItem value="not_done">
                                      Not Done
                                    </SelectItem>
                                    <SelectItem value="not_required">
                                      Not Required
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                                <Label htmlFor="cip">CIP</Label>
                                <Select
                                  value={editForm.cip ? "yes" : "no"}
                                  onValueChange={(value) =>
                                    setEditForm({
                                      ...editForm,
                                      cip: value === "yes",
                                    })
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="yes">Yes</SelectItem>
                                    <SelectItem value="no">No</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Label htmlFor="chemical_refill_litres">
                                  Chemical Refill (Litres)
                                </Label>
                                <Input
                                  id="chemical_refill_litres"
                                  type="number"
                                  value={editForm.chemical_refill_litres}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      chemical_refill_litres: e.target.value,
                                    })
                                  }
                                />
                                <Label htmlFor="cartridge_filter_replacement">
                                  Cartridge Filter Replacement
                                </Label>
                                <Input
                                  id="cartridge_filter_replacement"
                                  type="number"
                                  value={editForm.cartridge_filter_replacement}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      cartridge_filter_replacement:
                                        e.target.value,
                                    })
                                  }
                                />
                                <Label htmlFor="membrane_replacement">
                                  Membrane Replacement
                                </Label>
                                <Input
                                  id="membrane_replacement"
                                  type="number"
                                  value={editForm.membrane_replacement}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      membrane_replacement: e.target.value,
                                    })
                                  }
                                />
                                <Label htmlFor="notes">Notes</Label>
                                <Input
                                  id="notes"
                                  value={editForm.notes || ""}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      notes: e.target.value,
                                    })
                                  }
                                />

                                {/* Manage existing images */}
                                {editReport?.media &&
                                  editReport.media.length > 0 && (
                                    <div className="mt-4">
                                      <Label>Existing Pictures</Label>
                                      <div className="grid grid-cols-3 gap-2 mt-2">
                                        {(editForm?.media || [])
                                          .filter(
                                            (m: any) =>
                                              !(
                                                editForm?._mediaToRemove || []
                                              ).includes(m.id)
                                          )
                                          .map((m: any) => (
                                            <div
                                              key={m.id}
                                              className="relative group border rounded overflow-hidden"
                                            >
                                              <img
                                                src={m.url}
                                                alt="media"
                                                className="w-full h-24 object-cover"
                                              />
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  setEditForm((prev) => ({
                                                    ...prev,
                                                    _mediaToRemove: Array.from(
                                                      new Set([
                                                        ...(prev?._mediaToRemove ||
                                                          []),
                                                        m.id,
                                                      ])
                                                    ),
                                                  }))
                                                }
                                                className="absolute top-1 right-1 bg-red-500 text-white text-xs px-2 py-1 rounded opacity-90 group-hover:opacity-100"
                                              >
                                                Remove
                                              </button>
                                            </div>
                                          ))}
                                      </div>
                                    </div>
                                  )}

                                {/* Add new images */}
                                <div className="mt-4">
                                  <Label>Add New Pictures</Label>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={(e) => {
                                      const files = Array.from(
                                        e.target.files || []
                                      );
                                      setEditForm((prev) => ({
                                        ...prev,
                                        _newFiles: [
                                          ...(prev?._newFiles || []),
                                          ...files,
                                        ],
                                      }));
                                    }}
                                    className="mt-2"
                                  />
                                  {editForm?._newFiles?.length > 0 && (
                                    <div className="grid grid-cols-3 gap-2 mt-2">
                                      {editForm._newFiles.map(
                                        (file: File, idx: number) => (
                                          <div
                                            key={idx}
                                            className="relative border rounded overflow-hidden"
                                          >
                                            <img
                                              src={URL.createObjectURL(file)}
                                              className="w-full h-24 object-cover"
                                            />
                                            <button
                                              type="button"
                                              onClick={() =>
                                                setEditForm((prev) => ({
                                                  ...prev,
                                                  _newFiles:
                                                    prev._newFiles.filter(
                                                      (_: File, i: number) =>
                                                        i !== idx
                                                    ),
                                                }))
                                              }
                                              className="absolute top-1 right-1 bg-red-500 text-white text-xs px-2 py-1 rounded"
                                            >
                                              Remove
                                            </button>
                                          </div>
                                        )
                                      )}
                                    </div>
                                  )}
                                </div>

                                <div className="flex justify-end gap-2 mt-4">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={closeEdit}
                                  >
                                    Cancel
                                  </Button>
                                  <Button type="submit">Save</Button>
                                </div>
                              </form>
                            ) : null}
                          </DialogContent>
                        </Dialog>
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

export default WorkHistory;
