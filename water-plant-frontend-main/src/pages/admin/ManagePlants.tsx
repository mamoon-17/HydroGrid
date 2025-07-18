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
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import { Plus, Edit, Trash2, Database, MapPin, User } from "lucide-react";
import { toast } from "sonner";

interface Plant {
  id: string;
  address: string;
  lat?: number | null;
  lng?: number | null;
  point?: string | null;
  tehsil: string;
  type: "uf" | "ro";
  capacity: number;
  users?: Array<{
    id: string;
    name: string;
    username: string;
  }>;
  created_at: string;
  updated_at: string;
}

interface CreatePlantData {
  address: string;
  lat?: number;
  lng?: number;
  tehsil: string;
  type: "uf" | "ro";
  capacity: number;
  userIds?: string[];
}

const ManagePlants = () => {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlant, setEditingPlant] = useState<Plant | null>(null);
  const [formData, setFormData] = useState<CreatePlantData>({
    address: "",
    lat: undefined,
    lng: undefined,
    tehsil: "",
    type: "ro",
    capacity: 1000,
    userIds: [],
  });

  useEffect(() => {
    fetchPlants();
  }, []);

  const fetchPlants = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:3000/plants", {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        if (res.status === 403) {
          throw new Error("You don't have permission to view plants");
        }
        throw new Error(`Failed to fetch: ${res.status}`);
      }

      const data = await res.json();
      setPlants(data);
    } catch (err) {
      console.error("Failed to load plants", err);
      toast.error(err instanceof Error ? err.message : "Failed to load plants");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let response;
      const payload: Partial<CreatePlantData> = {
        address: formData.address,
        tehsil: formData.tehsil,
        type: formData.type,
        capacity: formData.capacity,
      };

      if (formData.lat !== undefined) {
        payload.lat = formData.lat;
      }
      if (formData.lng !== undefined) {
        payload.lng = formData.lng;
      }
      if (formData.userIds && formData.userIds.length > 0) {
        payload.userIds = formData.userIds;
      }

      if (editingPlant) {
        response = await fetch(
          `http://localhost:3000/plants/${editingPlant.id}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
            body: JSON.stringify(payload),
          }
        );
      } else {
        response = await fetch("http://localhost:3000/plants", {
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
        editingPlant ? "Plant updated successfully" : "Plant added successfully"
      );
      setIsDialogOpen(false);
      resetForm();
      fetchPlants();
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Something went wrong"
      );
    }
  };

  const handleEdit = (plant: Plant) => {
    setEditingPlant(plant);
    setFormData({
      address: plant.address,
      lat: plant.lat || undefined,
      lng: plant.lng || undefined,
      tehsil: plant.tehsil,
      type: plant.type,
      capacity: plant.capacity,
      userIds: plant.users?.map((user) => user.id) || [],
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`http://localhost:3000/plants/${id}`, {
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
    }
  };

  const resetForm = () => {
    setFormData({
      address: "",
      lat: undefined,
      lng: undefined,
      tehsil: "",
      type: "ro",
      capacity: 1000,
      userIds: [],
    });
    setEditingPlant(null);
  };

  // Helper function to get assigned employees as string
  const getAssignedEmployees = (plant: Plant) => {
    if (!plant.users || plant.users.length === 0) {
      return "No employees assigned";
    }
    return plant.users.map((user) => user.name).join(", ");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading plants...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Manage Plants</h1>
          <p className="text-muted-foreground mt-1">
            Configure plant locations and assignments
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Plant
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingPlant ? "Edit Plant" : "Add New Plant"}
              </DialogTitle>
              <DialogDescription>
                {editingPlant
                  ? "Update plant information below."
                  : "Fill in the details to register a new plant."}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      address: e.target.value,
                    }))
                  }
                  placeholder="Enter address"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lat">Latitude</Label>
                <Input
                  id="lat"
                  type="number"
                  step="any"
                  value={formData.lat ?? ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      lat: e.target.value
                        ? parseFloat(e.target.value)
                        : undefined,
                    }))
                  }
                  placeholder="Enter latitude (optional)"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lng">Longitude</Label>
                <Input
                  id="lng"
                  type="number"
                  step="any"
                  value={formData.lng ?? ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      lng: e.target.value
                        ? parseFloat(e.target.value)
                        : undefined,
                    }))
                  }
                  placeholder="Enter longitude (optional)"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tehsil">Tehsil</Label>
                <Input
                  id="tehsil"
                  value={formData.tehsil}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, tehsil: e.target.value }))
                  }
                  placeholder="Enter tehsil"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: "uf" | "ro") =>
                    setFormData((prev) => ({ ...prev, type: value }))
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
                <Label htmlFor="capacity">Capacity (LPH)</Label>
                <Input
                  id="capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      capacity: parseInt(e.target.value) || 0,
                    }))
                  }
                  placeholder="Enter capacity"
                  required
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingPlant ? "Update" : "Create"} Plant
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Plant List
          </CardTitle>
          <CardDescription>
            Total: {plants.length} plants registered
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Location</TableHead>
                <TableHead>GPS Coordinates</TableHead>
                <TableHead>Assigned Employees</TableHead>
                <TableHead>Tehsil</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plants.map((plant) => (
                <TableRow key={plant.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      {plant.address}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {plant.lat && plant.lng
                      ? `${plant.lat}, ${plant.lng}`
                      : "Not set"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      {getAssignedEmployees(plant)}
                    </div>
                  </TableCell>
                  <TableCell>{plant.tehsil}</TableCell>
                  <TableCell>
                    <Badge
                      variant={plant.type === "ro" ? "default" : "secondary"}
                    >
                      {plant.type.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>{plant.capacity.toLocaleString()} LPH</TableCell>
                  <TableCell>
                    <Badge variant="default">Active</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
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
                        onClick={() => handleDelete(plant.id)}
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
        </CardContent>
      </Card>
    </div>
  );
};

export default ManagePlants;
