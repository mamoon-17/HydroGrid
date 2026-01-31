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
import { StatusBadge } from "../../components/StatusBadge";
import {
  Database,
  Filter,
  FileText,
  MapPin,
  User,
  Calendar,
  Plus,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
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
import { Label } from "../../components/ui/label";
import { apiFetch } from "../../lib/api";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// 1. Add Employee type
interface Employee {
  id: string;
  name: string;
  username: string;
  phone: string;
  country: string;
  email?: string | null;
  role: "admin" | "user";
  assignedPlants?: number;
  created_at?: string;
  updated_at?: string;
}

interface PlantDetail {
  id: string;
  address: string;
  type: "uf" | "ro";
  tehsil: string;
  capacity: number;
  lat?: number;
  lng?: number;
  employee?: Employee; // single employee
  created_at?: string;
  updated_at?: string;
}

interface CreatePlantData {
  id?: string;
  address: string;
  lat?: number | null;
  lng?: number | null;
  tehsil: string;
  type: "uf" | "ro";
  capacity: number;
  employeeId?: string | null;
}

function getInitialFormData(): CreatePlantData {
  return {
    address: "",
    type: "ro",
    tehsil: "",
    capacity: 1000,
    lat: undefined,
    lng: undefined,
    employeeId: undefined,
  };
}

const ManagePlants = () => {
  const [plants, setPlants] = useState<PlantDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<CreatePlantData | null>(
    null
  );
  const [addFormData, setAddFormData] = useState<CreatePlantData>(
    getInitialFormData()
  );
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [viewPlant, setViewPlant] = useState<PlantDetail | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [plantToDelete, setPlantToDelete] = useState<PlantDetail | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [tehsilFilter, setTehsilFilter] = useState<string>("all");
  const [employeeFilter, setEmployeeFilter] = useState<string>("all");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPlants, setTotalPlants] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PLANTS_PAGE_SIZE = 10;

  useEffect(() => {
    // Set page title
    document.title = "Engzone - Manage Plants";

    fetchPlants();
    fetchEmployees();
  }, [currentPage]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, tehsilFilter, employeeFilter]);

  const fetchPlants = async () => {
    try {
      setLoading(true);
      const offset = (currentPage - 1) * PLANTS_PAGE_SIZE;
      const url = `/plants?limit=${PLANTS_PAGE_SIZE}&offset=${offset}`;

      const response = await apiFetch(url);

      // Handle paginated response structure
      if (response && typeof response === "object" && "data" in response) {
        // Paginated response: { data, total, limit, offset }
        const { data, total } = response;

        if (!Array.isArray(data)) {
          console.error(
            "Expected array in data field, got:",
            typeof data,
            data
          );
          throw new Error("Invalid response format from server");
        }

        setPlants(
          data.map((plant: any) => ({
            ...plant,
            employee: plant.user || undefined, // map user to employee for UI
          }))
        );
        setTotalPlants(total);
        setHasMore(data.length === PLANTS_PAGE_SIZE);
      } else if (Array.isArray(response)) {
        // Fallback: direct array response (non-paginated)
        setPlants(
          response.map((plant: any) => ({
            ...plant,
            employee: plant.user || undefined, // map user to employee for UI
          }))
        );
        setTotalPlants(response.length);
        setHasMore(response.length === PLANTS_PAGE_SIZE);
      } else {
        console.error("Unexpected response format:", typeof response, response);
        throw new Error("Invalid response format from server");
      }
    } catch (err) {
      console.error("Failed to load plants", err);
      toast.error(err instanceof Error ? err.message : "Failed to load plants");
      setPlants([]);
      setTotalPlants(0);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch(`${BASE_URL}/users`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch employees");
      const data = await res.json();
      // Only keep users with employee role
      setEmployees(
        Array.isArray(data)
          ? data.filter((u: Employee) => u.role === "user")
          : []
      );
    } catch (err) {
      toast.error("Failed to load employees");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let response;
      const payload: any = {
        address: addFormData.address,
        type: addFormData.type,
        tehsil: addFormData.tehsil,
        capacity: addFormData.capacity,
      };

      if (addFormData.lat !== undefined) {
        payload.lat = addFormData.lat;
      }
      if (addFormData.lng !== undefined) {
        payload.lng = addFormData.lng;
      }
      if (addFormData.employeeId === "none") {
        payload.userId = null;
      } else if (addFormData.employeeId) {
        payload.userId = addFormData.employeeId;
      }

      if (addFormData.id) {
        response = await fetch(`${BASE_URL}/plants/${addFormData.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch(`${BASE_URL}/plants`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(payload),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Something went wrong");
      }

      toast.success(
        addFormData.id
          ? "Plant updated successfully"
          : "Plant added successfully"
      );
      setIsAddDialogOpen(false);
      resetForm();
      fetchPlants();
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Something went wrong"
      );
    }
  };

  const handleEdit = (plant: PlantDetail) => {
    setEditFormData({ ...plant, employeeId: plant.employee?.id ?? null });
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (plant: PlantDetail) => {
    setPlantToDelete(plant);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!plantToDelete) return;

    try {
      const res = await fetch(`${BASE_URL}/plants/${plantToDelete.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to delete plant");
      }

      toast.success("Plant deleted successfully");
      fetchPlants();
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete plant"
      );
    } finally {
      setDeleteDialogOpen(false);
      setPlantToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setPlantToDelete(null);
  };

  // Helper function to open Google Maps
  const openInGoogleMaps = (lat: number, lng: number, address: string) => {
    const url = `https://www.google.com/maps?q=${lat},${lng}&z=15&t=m`;
    window.open(url, "_blank");
  };

  const resetForm = () => {
    setAddFormData({
      address: "",
      type: "ro",
      tehsil: "",
      capacity: 1000,
      lat: undefined,
      lng: undefined,
      employeeId: undefined,
    });
    setEditFormData(null);
  };

  // Helper function to get assigned employee as string
  const getAssignedEmployee = (plant: PlantDetail) => {
    if (!plant.employee) {
      return "No employee assigned";
    }
    return plant.employee.name;
  };

  // Helper function to determine status based on last activity
  const getPlantStatus = (plant: PlantDetail) => {
    if (!plant.updated_at) return "pending";

    const lastUpdate = new Date(plant.updated_at);
    const now = new Date();
    const daysDiff =
      (now.getTime() - lastUpdate.getTime()) / (1000 * 3600 * 24);

    if (daysDiff <= 7) return "maintained";
    if (daysDiff <= 14) return "pending";
    return "warning";
  };

  // Helper function to get last report time
  const getLastReport = (plant: PlantDetail) => {
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

  const uniqueTehsils = [...new Set(plants.map((plant) => plant.tehsil))];
  const allEmployees = employees; // already filtered to role === 'user'

  const filteredPlants = plants.filter((plant) => {
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      plant.address.toLowerCase().includes(search) ||
      (plant.employee?.name?.toLowerCase().includes(search) ?? false) ||
      (plant.employee?.username?.toLowerCase().includes(search) ?? false);
    const matchesStatus =
      statusFilter === "all" || getPlantStatus(plant) === statusFilter;
    const matchesTehsil =
      tehsilFilter === "all" || plant.tehsil === tehsilFilter;
    const matchesEmployee =
      employeeFilter === "all" || plant.employee?.id === employeeFilter;

    return matchesSearch && matchesStatus && matchesTehsil && matchesEmployee;
  });

  const statusCounts = {
    maintained: plants.filter((p) => getPlantStatus(p) === "maintained").length,
    pending: plants.filter((p) => getPlantStatus(p) === "pending").length,
    warning: plants.filter((p) => getPlantStatus(p) === "warning").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading plants...</div>
      </div>
    );
  }

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let response;
      const payload: any = {
        address: addFormData.address,
        type: addFormData.type,
        tehsil: addFormData.tehsil,
        capacity: addFormData.capacity,
      };
      if (addFormData.lat !== undefined) payload.lat = addFormData.lat;
      if (addFormData.lng !== undefined) payload.lng = addFormData.lng;
      if (addFormData.employeeId === "none") payload.userId = null;
      else if (addFormData.employeeId) payload.userId = addFormData.employeeId;
      response = await fetch(`${BASE_URL}/plants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Something went wrong");
      }
      toast.success("Plant added successfully");
      setIsAddDialogOpen(false);
      setAddFormData(getInitialFormData());
      fetchPlants();
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Something went wrong"
      );
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData || !editFormData.id) return;
    try {
      let response;
      const payload: any = {
        address: editFormData.address,
        type: editFormData.type,
        tehsil: editFormData.tehsil,
        capacity: editFormData.capacity,
      };
      if (editFormData.lat !== undefined) payload.lat = editFormData.lat;
      if (editFormData.lng !== undefined) payload.lng = editFormData.lng;
      if (editFormData.employeeId === "none") payload.userId = null;
      else if (editFormData.employeeId)
        payload.userId = editFormData.employeeId;
      response = await fetch(`${BASE_URL}/plants/${editFormData.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Something went wrong");
      }
      toast.success("Plant updated successfully");
      setIsEditDialogOpen(false);
      setEditFormData(null);
      fetchPlants();
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Something went wrong"
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Manage Plants</h1>
          <p className="text-muted-foreground mt-1">
            Configure plant locations and assignments
          </p>
        </div>
        <Button
          className="flex items-center gap-2"
          variant="default"
          size="sm"
          onClick={() => setIsAddDialogOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Add Plant
        </Button>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Plants</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPlants}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintained</CardTitle>
            <div className="w-3 h-3 bg-success rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {statusCounts.maintained}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <div className="w-3 h-3 bg-warning rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {statusCounts.pending}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warning</CardTitle>
            <div className="w-3 h-3 bg-danger rounded-full"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-danger">
              {statusCounts.warning}
            </div>
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
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <Input
                placeholder="Search address or employee..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="maintained">Maintained</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
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
              <label className="text-sm font-medium">Employee</label>
              <Select value={employeeFilter} onValueChange={setEmployeeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                  {allEmployees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plants Table */}
      <Card>
        <CardHeader>
          <CardTitle>Plant Status Overview</CardTitle>
          <CardDescription>
            Showing {plants.length} of {totalPlants} plants
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Mobile Cards View */}
          <div className="block md:hidden space-y-4">
            {filteredPlants.map((plant) => (
              <div key={plant.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="font-medium text-sm">{plant.address}</h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge
                        variant={plant.type === "ro" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {plant.type.toUpperCase()}
                      </Badge>
                      <span>•</span>
                      <span>{plant.tehsil}</span>
                    </div>
                  </div>
                  <StatusBadge status={getPlantStatus(plant)} />
                </div>

                <div className="text-xs text-muted-foreground space-y-1">
                  <div>Employee: {getAssignedEmployee(plant)}</div>
                  <div>Last Report: {getLastReport(plant)}</div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewPlant(plant)}
                    className="text-xs h-8"
                  >
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(plant)}
                    className="text-xs h-8"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      openInGoogleMaps(plant.lat!, plant.lng!, plant.address)
                    }
                    disabled={!plant.lat || !plant.lng}
                    title={
                      plant.lat && plant.lng
                        ? `Open ${plant.address} in Google Maps`
                        : "No coordinates available"
                    }
                    className="text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed text-xs h-8"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Map
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteClick(plant)}
                    className="text-red-600 hover:text-red-700 text-xs h-8"
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
                  <TableHead>Address</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Assigned Employee</TableHead>
                  <TableHead>Tehsil</TableHead>
                  <TableHead>Current Status</TableHead>
                  <TableHead>Last Report</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPlants.map((plant) => (
                  <TableRow key={plant.id}>
                    <TableCell className="font-medium">
                      {plant.address}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={plant.type === "ro" ? "default" : "secondary"}
                      >
                        {plant.type.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>{getAssignedEmployee(plant)}</TableCell>
                    <TableCell>{plant.tehsil}</TableCell>
                    <TableCell>
                      <StatusBadge status={getPlantStatus(plant)} />
                    </TableCell>
                    <TableCell>{getLastReport(plant)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setViewPlant(plant)}
                        >
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(plant)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            openInGoogleMaps(
                              plant.lat!,
                              plant.lng!,
                              plant.address
                            )
                          }
                          disabled={!plant.lat || !plant.lng}
                          title={
                            plant.lat && plant.lng
                              ? `Open ${plant.address} in Google Maps`
                              : "No coordinates available"
                          }
                          className="text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteClick(plant)}
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

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 sm:px-6 py-4 border-t">
            <div className="text-sm text-muted-foreground text-center sm:text-left">
              Showing {plants.length} of {totalPlants} plants
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
      {/* View Plant Dialog */}
      <Dialog open={!!viewPlant} onOpenChange={() => setViewPlant(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Plant Details</DialogTitle>
            <DialogDescription>
              Full details of the selected plant
            </DialogDescription>
          </DialogHeader>
          {viewPlant && (
            <div className="space-y-2 text-sm">
              <div>
                <strong>Address:</strong> {viewPlant.address}
              </div>
              <div>
                <strong>Type:</strong> {viewPlant.type.toUpperCase()}
              </div>
              <div>
                <strong>Tehsil:</strong> {viewPlant.tehsil}
              </div>
              <div>
                <strong>Point:</strong>{" "}
                {viewPlant.lat != null && viewPlant.lng != null
                  ? `${viewPlant.lat}, ${viewPlant.lng}`
                  : "N/A"}
                {viewPlant.lat != null && viewPlant.lng != null && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      openInGoogleMaps(
                        viewPlant.lat!,
                        viewPlant.lng!,
                        viewPlant.address
                      )
                    }
                    className="ml-2 text-blue-600 hover:text-blue-700"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Open in Maps
                  </Button>
                )}
              </div>
              <div>
                <strong>Assigned Employee:</strong>{" "}
                {viewPlant.employee?.name ?? "Unassigned"}
              </div>
              <div>
                <strong>Created At:</strong>{" "}
                {viewPlant.created_at
                  ? new Date(viewPlant.created_at).toLocaleString()
                  : "N/A"}
              </div>
              <div>
                <strong>Updated At:</strong>{" "}
                {viewPlant.updated_at
                  ? new Date(viewPlant.updated_at).toLocaleString()
                  : "N/A"}
              </div>
              <div>
                <strong>Capacity:</strong>{" "}
                {viewPlant.capacity?.toLocaleString() ?? "N/A"}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* Add Plant Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Plant</DialogTitle>
            <DialogDescription>Add a new plant to the system</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={addFormData.address}
                onChange={(e) =>
                  setAddFormData({ ...addFormData, address: e.target.value })
                }
                placeholder="Plant address"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={addFormData.type}
                onValueChange={(value: "uf" | "ro") =>
                  setAddFormData({ ...addFormData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ro">RO</SelectItem>
                  <SelectItem value="uf">UF</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tehsil">Tehsil</Label>
              <Input
                id="tehsil"
                value={addFormData.tehsil}
                onChange={(e) =>
                  setAddFormData({ ...addFormData, tehsil: e.target.value })
                }
                placeholder="Tehsil name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity (Liters)</Label>
              <Input
                id="capacity"
                type="number"
                value={addFormData.capacity}
                onChange={(e) =>
                  setAddFormData({
                    ...addFormData,
                    capacity: parseInt(e.target.value),
                  })
                }
                placeholder="1000"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lat">Latitude (Optional)</Label>
                <Input
                  id="lat"
                  type="number"
                  step="any"
                  value={addFormData.lat || ""}
                  onChange={(e) =>
                    setAddFormData({
                      ...addFormData,
                      lat: e.target.value
                        ? parseFloat(e.target.value)
                        : undefined,
                    })
                  }
                  placeholder="0.000000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lng">Longitude (Optional)</Label>
                <Input
                  id="lng"
                  type="number"
                  step="any"
                  value={addFormData.lng || ""}
                  onChange={(e) =>
                    setAddFormData({
                      ...addFormData,
                      lng: e.target.value
                        ? parseFloat(e.target.value)
                        : undefined,
                    })
                  }
                  placeholder="0.000000"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="employee">Assigned Employee</Label>
              <Select
                value={addFormData.employeeId || "none"}
                onValueChange={(value) =>
                  setAddFormData({
                    ...addFormData,
                    employeeId: value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddDialogOpen(false);
                  setAddFormData(getInitialFormData());
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                Add
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      {/* Edit Plant Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Plant</DialogTitle>
            <DialogDescription>Update plant information</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={editFormData?.address}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, address: e.target.value })
                }
                placeholder="Plant address"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={editFormData?.type}
                onValueChange={(value: "uf" | "ro") =>
                  setEditFormData({ ...editFormData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ro">RO</SelectItem>
                  <SelectItem value="uf">UF</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tehsil">Tehsil</Label>
              <Input
                id="tehsil"
                value={editFormData?.tehsil}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, tehsil: e.target.value })
                }
                placeholder="Tehsil name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity (Liters)</Label>
              <Input
                id="capacity"
                type="number"
                value={editFormData?.capacity}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    capacity: parseInt(e.target.value),
                  })
                }
                placeholder="1000"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lat">Latitude (Optional)</Label>
                <Input
                  id="lat"
                  type="number"
                  step="any"
                  value={editFormData?.lat || ""}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      lat: e.target.value
                        ? parseFloat(e.target.value)
                        : undefined,
                    })
                  }
                  placeholder="0.000000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lng">Longitude (Optional)</Label>
                <Input
                  id="lng"
                  type="number"
                  step="any"
                  value={editFormData?.lng || ""}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      lng: e.target.value
                        ? parseFloat(e.target.value)
                        : undefined,
                    })
                  }
                  placeholder="0.000000"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="employee">Assigned Employee</Label>
              <Select
                value={editFormData?.employeeId || "none"}
                onValueChange={(value) =>
                  setEditFormData({
                    ...editFormData,
                    employeeId: value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setEditFormData(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                Update
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Plant</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this plant? This action cannot be
              undone.
              <br />
              <br />
              <strong>This will permanently delete:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>The plant and all its configuration</li>
                <li>All quality reports associated with this plant</li>
                <li>All images and media files from reports</li>
                <li>All maintenance records and history</li>
                <li>Employee assignments and relationships</li>
              </ul>
              <br />
              <span className="text-sm text-muted-foreground">
                Plant:{" "}
                <strong>{plantToDelete?.address || "Unknown Location"}</strong>
                <br />
                Type:{" "}
                <strong>
                  {plantToDelete?.type?.toUpperCase() || "Unknown"}
                </strong>
                <br />
                Tehsil: <strong>{plantToDelete?.tehsil || "Unknown"}</strong>
                <br />
                Assigned Employee:{" "}
                <strong>{plantToDelete?.employee?.name || "Unassigned"}</strong>
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
              Delete Plant
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ManagePlants;
