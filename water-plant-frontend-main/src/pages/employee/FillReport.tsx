//check for
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
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
import { Textarea } from "../../components/ui/textarea";
import { ClipboardList, Save, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../contexts/AuthContext";
import { apiFetch } from "../../lib/api";

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

interface ReportMediaItem {
  id: string;
  file: File; // Change from url to file
  created_at: string;
}

interface ReportFormData {
  plantId: string;
  raw_water_tds: string;
  permeate_water_tds: string;
  raw_water_ph: string;
  permeate_water_ph: string;
  product_water_tds: string;
  product_water_flow: string;
  product_water_ph: string;
  reject_water_flow: string;
  membrane_inlet_pressure: string;
  membrane_outlet_pressure: string;
  raw_water_inlet_pressure: string;
  volts_amperes: string;
  multimedia_backwash: "done" | "not_done" | "not_required" | "";
  carbon_backwash: "done" | "not_done" | "not_required" | "";
  membrane_cleaning: "done" | "not_done" | "not_required" | "";
  arsenic_media_backwash: "done" | "not_done" | "not_required" | "";
  cip: boolean;
  chemical_refill_litres: string;
  cartridge_filter_replacement: string;
  membrane_replacement: string;
  notes?: string;
  media: ReportMediaItem[];
}

const FillReport = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [assignedPlants, setAssignedPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Set default values for enum fields in formData
  const [formData, setFormData] = useState<ReportFormData>({
    plantId: "",
    raw_water_tds: "",
    permeate_water_tds: "",
    raw_water_ph: "",
    permeate_water_ph: "",
    product_water_tds: "",
    product_water_flow: "",
    product_water_ph: "",
    reject_water_flow: "",
    membrane_inlet_pressure: "",
    membrane_outlet_pressure: "",
    raw_water_inlet_pressure: "",
    volts_amperes: "",
    multimedia_backwash: "done", // default to valid value
    carbon_backwash: "done",
    membrane_cleaning: "done",
    arsenic_media_backwash: "done",
    cip: false,
    chemical_refill_litres: "",
    cartridge_filter_replacement: "",
    membrane_replacement: "",
    notes: "",
    media: [],
  });

  // 1. Save/load draft helpers
  const DRAFT_KEY = "plant_report_draft";

  function saveDraftToStorage(draft: ReportFormData) {
    // Create a copy without media files since File objects can't be serialized
    const draftWithoutMedia = {
      ...draft,
      media: [], // Don't save media files to localStorage
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draftWithoutMedia));
  }

  function loadDraftFromStorage(): ReportFormData | null {
    const data = localStorage.getItem(DRAFT_KEY);
    if (!data) return null;
    try {
      const parsed = JSON.parse(data);
      // Ensure media array is initialized as empty since we don't save it
      return {
        ...parsed,
        media: [],
      };
    } catch {
      return null;
    }
  }

  function clearDraftFromStorage() {
    localStorage.removeItem(DRAFT_KEY);
  }

  // 2. On mount, load draft if present
  useEffect(() => {
    if (user) {
      fetchAssignedPlants();
      const draft = loadDraftFromStorage();
      if (draft) setFormData(draft);
    }
  }, [user]);

  const fetchAssignedPlants = async () => {
    try {
      setLoading(true);
      const plants = await apiFetch("/plants/assigned");
      setAssignedPlants(plants);
      // Auto-select logic: URL param plantId > first assigned plant
      const plantIdFromUrl = searchParams.get("plantId");
      const validPlantIds = new Set(plants.map((p: Plant) => p.id));
      const initialPlantId =
        plantIdFromUrl && validPlantIds.has(plantIdFromUrl)
          ? plantIdFromUrl
          : plants[0]?.id || "";
      if (initialPlantId && formData.plantId === "") {
        setFormData((prev) => ({ ...prev, plantId: initialPlantId }));
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to load assigned plants"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    field: keyof ReportFormData,
    value: string | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((fileItem) => {
      setFormData((prev) => ({
        ...prev,
        media: [
          ...prev.media,
          {
            id: Date.now().toString() + Math.random().toString(36).substring(2),
            file: fileItem, // Store the actual File object
            created_at: new Date().toISOString(),
          },
        ],
      }));
    });
  };

  // 2. Update validateForm to allow decimals for all number fields
  const validateForm = () => {
    const requiredFields = [
      "plantId",
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
      "multimedia_backwash",
      "carbon_backwash",
      "membrane_cleaning",
      "arsenic_media_backwash",
      "chemical_refill_litres",
      "cartridge_filter_replacement",
      "membrane_replacement",
    ];
    for (const field of requiredFields) {
      const value = formData[field as keyof ReportFormData];
      if (value === "" || value === undefined || value === null) {
        toast.error(`Field '${field}' is required.`);
        return false;
      }
    }
    // Enum fields must be valid
    const validEnums = ["done", "not_done", "not_required"];
    if (!validEnums.includes(formData.multimedia_backwash)) {
      toast.error("Invalid value for multimedia_backwash");
      return false;
    }
    if (!validEnums.includes(formData.carbon_backwash)) {
      toast.error("Invalid value for carbon_backwash");
      return false;
    }
    if (!validEnums.includes(formData.membrane_cleaning)) {
      toast.error("Invalid value for membrane_cleaning");
      return false;
    }
    if (!validEnums.includes(formData.arsenic_media_backwash)) {
      toast.error("Invalid value for arsenic_media_backwash");
      return false;
    }
    // All number fields must be valid (allow decimals)
    const numberFields = [
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
    ];
    for (const field of numberFields) {
      const value = formData[field as keyof ReportFormData];
      if (
        isNaN(Number(value)) ||
        !Number.isFinite(Number(value)) ||
        Number(value) < 0
      ) {
        toast.error(`Field '${field}' must be a nonnegative number.`);
        return false;
      }
    }
    return true;
  };

  // 3. Update handleSaveDraft to save to localStorage
  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      saveDraftToStorage(formData);
      toast.success("Draft saved locally");
    } catch (err) {
      toast.error("Failed to save draft");
    } finally {
      setIsSaving(false);
    }
  };

  // 4. Add clear draft button
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fill in all required fields correctly");
      return;
    }

    setIsSubmitting(true);

    try {
      // Create FormData for multipart/form-data submission
      const formDataToSend = new FormData();

      // Add all the form fields
      formDataToSend.append("plantId", formData.plantId);
      formDataToSend.append("userId", user?.id || "");
      formDataToSend.append("raw_water_tds", formData.raw_water_tds);
      formDataToSend.append("permeate_water_tds", formData.permeate_water_tds);
      formDataToSend.append("raw_water_ph", formData.raw_water_ph);
      formDataToSend.append("permeate_water_ph", formData.permeate_water_ph);
      formDataToSend.append("product_water_tds", formData.product_water_tds);
      formDataToSend.append("product_water_flow", formData.product_water_flow);
      formDataToSend.append("product_water_ph", formData.product_water_ph);
      formDataToSend.append("reject_water_flow", formData.reject_water_flow);
      formDataToSend.append(
        "membrane_inlet_pressure",
        formData.membrane_inlet_pressure
      );
      formDataToSend.append(
        "membrane_outlet_pressure",
        formData.membrane_outlet_pressure
      );
      formDataToSend.append(
        "raw_water_inlet_pressure",
        formData.raw_water_inlet_pressure
      );
      formDataToSend.append("volts_amperes", formData.volts_amperes);
      formDataToSend.append(
        "multimedia_backwash",
        formData.multimedia_backwash
      );
      formDataToSend.append("carbon_backwash", formData.carbon_backwash);
      formDataToSend.append("membrane_cleaning", formData.membrane_cleaning);
      formDataToSend.append(
        "arsenic_media_backwash",
        formData.arsenic_media_backwash
      );
      formDataToSend.append("cip", formData.cip.toString());
      formDataToSend.append(
        "chemical_refill_litres",
        formData.chemical_refill_litres
      );
      formDataToSend.append(
        "cartridge_filter_replacement",
        formData.cartridge_filter_replacement
      );
      formDataToSend.append(
        "membrane_replacement",
        formData.membrane_replacement
      );
      formDataToSend.append("notes", formData.notes || "");

      // Add all media files
      formData.media.forEach((mediaItem, index) => {
        formDataToSend.append(`reportImages`, mediaItem.file);
      });

      // Use apiFetch with FormData (no JSON.stringify needed)
      await apiFetch("/reports", {
        method: "POST",
        body: formDataToSend, // Send FormData directly
        headers: {
          // Don't set Content-Type header - let browser set it with boundary for multipart/form-data
        },
      });

      toast.success("Report submitted successfully!");

      // Reset form
      setFormData({
        plantId: "",
        raw_water_tds: "",
        permeate_water_tds: "",
        raw_water_ph: "",
        permeate_water_ph: "",
        product_water_tds: "",
        product_water_flow: "",
        product_water_ph: "",
        reject_water_flow: "",
        membrane_inlet_pressure: "",
        membrane_outlet_pressure: "",
        raw_water_inlet_pressure: "",
        volts_amperes: "",
        multimedia_backwash: "done",
        carbon_backwash: "done",
        membrane_cleaning: "done",
        arsenic_media_backwash: "done",
        cip: false,
        chemical_refill_litres: "",
        cartridge_filter_replacement: "",
        membrane_replacement: "",
        notes: "",
        media: [],
      });
      clearDraftFromStorage();
    } catch (err) {
      console.error("Failed to submit report", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to submit report"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-lg">Loading assigned plants...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 overflow-visible">
      {" "}
      {/* No h-screen or overflow classes here */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Fill Out Report
          </h1>
          <p className="text-muted-foreground mt-1">
            Submit quality and maintenance report for your assigned plants
          </p>
        </div>
      </div>
      {assignedPlants.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <ClipboardList className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Plants Assigned</h3>
            <p className="text-muted-foreground">
              You don't have any plants assigned to you yet. Contact your
              administrator to get assigned to plants.
            </p>
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Plant Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Plant Information
              </CardTitle>
              <CardDescription>
                Select the plant for this report
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="plant">Select Plant *</Label>
                <Select
                  value={formData.plantId}
                  onValueChange={(value) => handleInputChange("plantId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a plant..." />
                  </SelectTrigger>
                  <SelectContent>
                    {assignedPlants.map((plant) => (
                      <SelectItem key={plant.id} value={plant.id}>
                        {plant.address} ({plant.type.toUpperCase()})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Water Quality Measurements */}
          <Card>
            <CardHeader>
              <CardTitle>Water Quality Measurements</CardTitle>
              <CardDescription>
                Enter TDS, pH, and pressure readings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rawTds">Raw TDS (ppm) *</Label>
                  <Input
                    id="rawTds"
                    type="number"
                    value={formData.raw_water_tds}
                    onChange={(e) =>
                      handleInputChange("raw_water_tds", e.target.value)
                    }
                    placeholder="e.g., 850"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="permateTds">Permeate TDS (ppm) *</Label>
                  <Input
                    id="permateTds"
                    type="number"
                    value={formData.permeate_water_tds}
                    onChange={(e) =>
                      handleInputChange("permeate_water_tds", e.target.value)
                    }
                    placeholder="e.g., 45"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="productTds">Product TDS (ppm) *</Label>
                  <Input
                    id="productTds"
                    type="number"
                    value={formData.product_water_tds}
                    onChange={(e) =>
                      handleInputChange("product_water_tds", e.target.value)
                    }
                    placeholder="e.g., 35"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rawPh">Raw Water pH *</Label>
                  <Input
                    id="rawPh"
                    type="number"
                    step="0.1"
                    value={formData.raw_water_ph}
                    onChange={(e) =>
                      handleInputChange("raw_water_ph", e.target.value)
                    }
                    placeholder="e.g., 7.2"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="permeatePh">Permeate Water pH *</Label>
                  <Input
                    id="permeatePh"
                    type="number"
                    step="0.1"
                    value={formData.permeate_water_ph}
                    onChange={(e) =>
                      handleInputChange("permeate_water_ph", e.target.value)
                    }
                    placeholder="e.g., 6.8"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="productPh">Product Water pH *</Label>
                  <Input
                    id="productPh"
                    type="number"
                    step="0.1"
                    value={formData.product_water_ph}
                    onChange={(e) =>
                      handleInputChange("product_water_ph", e.target.value)
                    }
                    placeholder="e.g., 6.5"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="membraneInletPressure">
                    Membrane Inlet Pressure (PSI) *
                  </Label>
                  <Input
                    id="membraneInletPressure"
                    type="number"
                    value={formData.membrane_inlet_pressure}
                    onChange={(e) =>
                      handleInputChange(
                        "membrane_inlet_pressure",
                        e.target.value
                      )
                    }
                    placeholder="e.g., 185"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="membraneOutletPressure">
                    Membrane Outlet Pressure (PSI) *
                  </Label>
                  <Input
                    id="membraneOutletPressure"
                    type="number"
                    value={formData.membrane_outlet_pressure}
                    onChange={(e) =>
                      handleInputChange(
                        "membrane_outlet_pressure",
                        e.target.value
                      )
                    }
                    placeholder="e.g., 95"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rawWaterInletPressure">
                    Raw Water Inlet Pressure (PSI) *
                  </Label>
                  <Input
                    id="rawWaterInletPressure"
                    type="number"
                    value={formData.raw_water_inlet_pressure}
                    onChange={(e) =>
                      handleInputChange(
                        "raw_water_inlet_pressure",
                        e.target.value
                      )
                    }
                    placeholder="e.g., 200"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Flow and Electrical */}
          <Card>
            <CardHeader>
              <CardTitle>Flow Rate & Electrical Measurements</CardTitle>
              <CardDescription>
                Record flow rates and electrical readings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="flowRate">Product Water Flow (LPH) *</Label>
                  <Input
                    id="flowRate"
                    type="number"
                    value={formData.product_water_flow}
                    onChange={(e) =>
                      handleInputChange("product_water_flow", e.target.value)
                    }
                    placeholder="e.g., 950"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rejectFlow">Reject Water Flow (LPH) *</Label>
                  <Input
                    id="rejectFlow"
                    type="number"
                    value={formData.reject_water_flow}
                    onChange={(e) =>
                      handleInputChange("reject_water_flow", e.target.value)
                    }
                    placeholder="e.g., 50"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="voltage">Volts/Amperes *</Label>
                  <Input
                    id="voltage"
                    type="number"
                    value={formData.volts_amperes}
                    onChange={(e) =>
                      handleInputChange("volts_amperes", e.target.value)
                    }
                    placeholder="e.g., 220"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Maintenance Activities */}
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Activities</CardTitle>
              <CardDescription>
                Record maintenance tasks and component replacements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="multimediaBackwash">
                      Multimedia Backwash *
                    </Label>
                    <Select
                      value={formData.multimedia_backwash}
                      onValueChange={(value) =>
                        handleInputChange("multimedia_backwash", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="done">Done</SelectItem>
                        <SelectItem value="not_done">Not Done</SelectItem>
                        <SelectItem value="not_required">
                          Not Required
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="carbonBackwash">Carbon Backwash *</Label>
                    <Select
                      value={formData.carbon_backwash}
                      onValueChange={(value) =>
                        handleInputChange("carbon_backwash", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="done">Done</SelectItem>
                        <SelectItem value="not_done">Not Done</SelectItem>
                        <SelectItem value="not_required">
                          Not Required
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="membraneCleaning">
                      Membrane Cleaning *
                    </Label>
                    <Select
                      value={formData.membrane_cleaning}
                      onValueChange={(value) =>
                        handleInputChange("membrane_cleaning", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="done">Done</SelectItem>
                        <SelectItem value="not_done">Not Done</SelectItem>
                        <SelectItem value="not_required">
                          Not Required
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="arsenicBackwash">
                      Arsenic Media Backwash *
                    </Label>
                    <Select
                      value={formData.arsenic_media_backwash}
                      onValueChange={(value) =>
                        handleInputChange("arsenic_media_backwash", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="done">Done</SelectItem>
                        <SelectItem value="not_done">Not Done</SelectItem>
                        <SelectItem value="not_required">
                          Not Required
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cartridgeFilterReplacement">
                      Cartridge Filter Replacement (0-2) *
                    </Label>
                    <Input
                      id="cartridgeFilterReplacement"
                      type="number"
                      min="0"
                      max="2"
                      value={formData.cartridge_filter_replacement}
                      onChange={(e) =>
                        handleInputChange(
                          "cartridge_filter_replacement",
                          e.target.value
                        )
                      }
                      placeholder="0, 1, or 2"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="membraneReplacement">
                      Membrane Replacement (0-8) *
                    </Label>
                    <Input
                      id="membraneReplacement"
                      type="number"
                      min="0"
                      max="8"
                      value={formData.membrane_replacement}
                      onChange={(e) =>
                        handleInputChange(
                          "membrane_replacement",
                          e.target.value
                        )
                      }
                      placeholder="0 to 8"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="chemicalRefill">
                      Chemical Refill (Litres) *
                    </Label>
                    <Input
                      id="chemicalRefill"
                      type="number"
                      step="0.1"
                      min="0"
                      value={formData.chemical_refill_litres}
                      onChange={(e) =>
                        handleInputChange(
                          "chemical_refill_litres",
                          e.target.value
                        )
                      }
                      placeholder="e.g., 5.5"
                      required
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Notes</CardTitle>
              <CardDescription>
                Any additional observations or comments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                  placeholder="Enter any additional notes, observations, or issues..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Attach Pictures */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Attach Pictures
              </CardTitle>
              <CardDescription>
                Add one or more images as evidence or documentation (optional)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleMediaChange}
                className="mb-2"
              />
              <div className="flex flex-wrap gap-2">
                {formData.media.map((media) => (
                  <div
                    key={media.id}
                    className="relative w-24 h-24 border rounded overflow-hidden"
                  >
                    <img
                      src={URL.createObjectURL(media.file)} // Use URL.createObjectURL for File objects
                      alt="Report media"
                      className="object-cover w-full h-full"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          media: prev.media.filter((m) => m.id !== media.id),
                        }));
                      }}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:justify-end gap-3 sm:gap-4 pb-8 mb-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleSaveDraft}
              disabled={isSaving || isSubmitting}
              className="flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <Save className="h-4 w-4" />
              {isSaving ? "Saving..." : "Save Draft"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                clearDraftFromStorage();
                toast.success("Draft cleared");
              }}
              disabled={isSaving || isSubmitting}
              className="flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              Clear Draft
            </Button>
            <Button
              type="submit"
              disabled={isSaving || isSubmitting}
              className="flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <Send className="h-4 w-4" />
              {isSubmitting ? "Submitting..." : "Submit Report"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default FillReport;
