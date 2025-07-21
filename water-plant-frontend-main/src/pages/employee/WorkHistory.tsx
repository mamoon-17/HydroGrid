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
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { toast } from "sonner";
import { Label } from "../../components/ui/label";

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
  notes?: string;
  created_at: string;
  updated_at: string;
  edit_count: number; // Added for edit count
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
  const [editReport, setEditReport] = useState<Report | null>(null);
  const [editForm, setEditForm] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetchUserReports();
    }
  }, [user]);

  const fetchUserReports = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `http://localhost:3000/reports/user/${user?.id}`,
        {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch reports: ${response.status}`);
      }

      const userReports = await response.json();
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
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

        <Card>
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Weekly Average
            </CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">
              {stats.averagePerWeek}
            </div>
            <p className="text-xs text-muted-foreground">Reports per week</p>
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
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
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
                                    <span className="font-medium">Tehsil:</span>{" "}
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
                                    <span className="font-medium">Raw pH:</span>{" "}
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
                                  <h3 className="font-semibold mb-2">Notes</h3>
                                  <p className="text-sm text-muted-foreground">
                                    {report.notes}
                                  </p>
                                </div>
                              )}

                              <div>
                                <h3 className="font-semibold mb-2">
                                  Report Information
                                </h3>
                                <div className="space-y-1 text-sm">
                                  <p>
                                    <span className="font-medium">
                                      Submitted:
                                    </span>{" "}
                                    {formatDate(report.created_at)}
                                  </p>
                                  <p>
                                    <span className="font-medium">
                                      Last Updated:
                                    </span>{" "}
                                    {formatDate(report.updated_at)}
                                  </p>
                                  <p>
                                    <span className="font-medium">
                                      Submitted By:
                                    </span>{" "}
                                    {report.submitted_by.name}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={report.edit_count >= 2}
                            onClick={() => {
                              setEditReport(report);
                              setEditForm({ ...report });
                              setEditDialogOpen(true);
                            }}
                          >
                            Edit
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Edit Report</DialogTitle>
                          </DialogHeader>
                          {report.edit_count >= 2 ? (
                            <div className="text-danger">
                              You can only edit a report twice.
                            </div>
                          ) : editForm ? (
                            <form
                              onSubmit={async (e) => {
                                e.preventDefault();
                                // Call backend PATCH /reports/:id with editForm
                                // On success, close dialog and refresh reports
                                // On error, show toast
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
                              <Label htmlFor="raw_water_ph">Raw Water pH</Label>
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
                              <div className="flex justify-end gap-2 mt-4">
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => setEditDialogOpen(false)}
                                >
                                  Cancel
                                </Button>
                                <Button type="submit">Save</Button>
                              </div>
                            </form>
                          ) : null}
                        </DialogContent>
                      </Dialog>
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
