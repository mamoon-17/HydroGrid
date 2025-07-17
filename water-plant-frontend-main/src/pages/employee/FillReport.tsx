//check for
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
import { Textarea } from "../../components/ui/textarea";
import { ClipboardList, Save, Send } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../contexts/AuthContext";

interface ReportMediaItem {
  id: string;
  url: string; // data URL for mock
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
  media: ReportMediaItem[];
}

const FillReport = () => {
  const { user } = useAuth();

  // Mock assigned plants
  const assignedPlants = [
    { id: "1", location: "Sector 15, Karachi", type: "RO" },
    { id: "2", location: "Phase 2, Lahore", type: "UF" },
    { id: "3", location: "Block A, Islamabad", type: "RO" },
  ];

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
    multimedia_backwash: "",
    carbon_backwash: "",
    membrane_cleaning: "",
    arsenic_media_backwash: "",
    cip: false,
    chemical_refill_litres: "",
    cartridge_filter_replacement: "",
    membrane_replacement: "",
    media: [],
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData((prev) => ({
          ...prev,
          media: [
            ...prev.media,
            {
              id:
                Date.now().toString() + Math.random().toString(36).substring(2),
              url: event.target?.result as string,
              created_at: new Date().toISOString(),
            },
          ],
        }));
      };
      reader.readAsDataURL(file);
    });
  };

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
      if (
        formData[field as keyof ReportFormData] === "" ||
        formData[field as keyof ReportFormData] === undefined
      ) {
        return false;
      }
    }

    // Validate ranges
    const cartridge = parseInt(formData.cartridge_filter_replacement);
    const membrane = parseInt(formData.membrane_replacement);
    const chemical = parseFloat(formData.chemical_refill_litres);

    if (cartridge < 0 || cartridge > 2) {
      toast.error("Cartridge filter replacement must be between 0-2");
      return false;
    }

    if (membrane < 0 || membrane > 8) {
      toast.error("Membrane replacement must be between 0-8");
      return false;
    }

    if (chemical < 0) {
      toast.error("Chemical refill must be a positive number");
      return false;
    }

    return true;
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    toast.success("Report saved as draft");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fill in all required fields correctly");
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setIsSubmitting(false);
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
      multimedia_backwash: "",
      carbon_backwash: "",
      membrane_cleaning: "",
      arsenic_media_backwash: "",
      cip: false,
      chemical_refill_litres: "",
      cartridge_filter_replacement: "",
      membrane_replacement: "",
      media: [],
    });
  };

  return (
    <div className="space-y-6">
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Plant Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Plant Information
            </CardTitle>
            <CardDescription>Select the plant for this report</CardDescription>
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
                      {plant.location} ({plant.type})
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
                <Label htmlFor="ph">pH Level *</Label>
                <Input
                  id="ph"
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
                <Label htmlFor="membraneInletPressure">
                  Membrane Inlet Pressure (PSI) *
                </Label>
                <Input
                  id="membraneInletPressure"
                  type="number"
                  value={formData.membrane_inlet_pressure}
                  onChange={(e) =>
                    handleInputChange("membrane_inlet_pressure", e.target.value)
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
                <Label htmlFor="flowRate">Flow Rate (LPH) *</Label>
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
                <Label htmlFor="voltage">Voltage (V) *</Label>
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

              <div className="space-y-2">
                <Label htmlFor="amperage">Amperage (A) *</Label>
                <Input
                  id="amperage"
                  type="number"
                  step="0.1"
                  value={formData.volts_amperes}
                  onChange={(e) =>
                    handleInputChange("volts_amperes", e.target.value)
                  }
                  placeholder="e.g., 5.2"
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
                  <Label htmlFor="backwash">Backwash *</Label>
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
                      <SelectItem value="not_required">Not Required</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cleaning">Cleaning *</Label>
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
                      <SelectItem value="not_required">Not Required</SelectItem>
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
                      handleInputChange("membrane_replacement", e.target.value)
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
                    src={media.url}
                    alt="Report media"
                    className="object-cover w-full h-full"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleSaveDraft}
            disabled={isSaving || isSubmitting}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Saving..." : "Save Draft"}
          </Button>

          <Button
            type="submit"
            disabled={isSaving || isSubmitting}
            className="flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
            {isSubmitting ? "Submitting..." : "Submit Report"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default FillReport;
