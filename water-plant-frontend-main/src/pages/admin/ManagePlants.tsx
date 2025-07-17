import { useState } from "react";
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
import { Plus, Edit, Trash2, Database, MapPin } from "lucide-react";
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
  created_at: string;
  updated_at: string;
}

const ManagePlants = () => {
  const [plants, setPlants] = useState<Plant[]>([
    {
      id: "1",
      address: "Sector 15, Karachi",
      lat: 24.8607,
      lng: 67.0011,
      point: null,
      tehsil: "Karachi South",
      type: "ro",
      capacity: 1000,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
    {
      id: "2",
      address: "Phase 2, Lahore",
      lat: 31.5204,
      lng: 74.3587,
      point: null,
      tehsil: "Lahore Cantt",
      type: "uf",
      capacity: 2000,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
    {
      id: "3",
      address: "Block A, Islamabad",
      lat: 33.6844,
      lng: 73.0479,
      point: null,
      tehsil: "Islamabad",
      type: "ro",
      capacity: 500,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
    },
  ]);

  const [employees] = useState([
    "John Doe",
    "Jane Smith",
    "Ahmed Ali",
    "Sarah Khan",
    "Ali Hassan",
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlant, setEditingPlant] = useState<Plant | null>(null);
  const [formData, setFormData] = useState({
    address: "",
    lat: undefined as number | undefined,
    lng: undefined as number | undefined,
    point: "",
    tehsil: "",
    type: "ro" as "uf" | "ro",
    capacity: 1000 as number,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingPlant) {
      // Update plant
      setPlants((prev) =>
        prev.map((plant) =>
          plant.id === editingPlant.id
            ? { ...plant, ...formData, updated_at: new Date().toISOString() }
            : plant
        )
      );
      toast.success("Plant updated successfully");
    } else {
      // Add new plant
      const newPlant: Plant = {
        id: Date.now().toString(),
        ...formData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setPlants((prev) => [...prev, newPlant]);
      toast.success("Plant added successfully");
    }

    resetForm();
    setIsDialogOpen(false);
  };

  const handleEdit = (plant: Plant) => {
    setEditingPlant(plant);
    setFormData({
      address: plant.address,
      lat: plant.lat,
      lng: plant.lng,
      point: plant.point || "",
      tehsil: plant.tehsil,
      type: plant.type,
      capacity: plant.capacity,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setPlants((prev) => prev.filter((plant) => plant.id !== id));
    toast.success("Plant deleted successfully");
  };

  const resetForm = () => {
    setFormData({
      address: "",
      lat: undefined,
      lng: undefined,
      point: "",
      tehsil: "",
      type: "ro",
      capacity: 1000,
    });
    setEditingPlant(null);
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
                <Label htmlFor="point">Point</Label>
                <Input
                  id="point"
                  value={formData.point}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, point: e.target.value }))
                  }
                  placeholder="Enter point (optional)"
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
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      type: e.target.value as "uf" | "ro",
                    }))
                  }
                  className="w-full border rounded px-3 py-2"
                  required
                >
                  <option value="ro">RO</option>
                  <option value="uf">UF</option>
                </select>
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
                <TableHead>Assigned Employee</TableHead>
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
                    {plant.lat}, {plant.lng}
                  </TableCell>
                  <TableCell>{plant.tehsil}</TableCell>
                  <TableCell>
                    <Badge
                      variant={plant.type === "ro" ? "default" : "secondary"}
                    >
                      {plant.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{plant.capacity} LPH</TableCell>
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
