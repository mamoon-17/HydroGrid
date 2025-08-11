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
import { Plus, Edit, Trash2, User } from "lucide-react";
import { toast } from "sonner";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

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

const countryOptions = [
  { code: "", label: "Select Country Code", dialCode: "" },
  { code: "PK", label: "PK (+92)", dialCode: "92" },
  { code: "US", label: "US (+1)", dialCode: "1" },
  { code: "IN", label: "IN (+91)", dialCode: "91" },
];

const ManageEmployees = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    phone: "",
    country: "",
    email: "",
    role: "user" as "admin" | "user",
  });
  const [fieldErrors, setFieldErrors] = useState({
    username: "",
    phone: "",
    email: "",
  });
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/users`, {
        credentials: "include",
      });

      const contentType = res.headers.get("content-type");
      if (!res.ok || !contentType?.includes("application/json")) {
        const text = await res.text();
        throw new Error("Unexpected response format");
      }

      const data = await res.json();
      setEmployees(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load employees", err);
      toast.error("Failed to load employees");
    } finally {
      setLoading(false);
    }
  };

  const checkFieldExists = (field: string, value: string) => {
    return employees.some((emp) => {
      if (field === "phone") {
        // For phone numbers, we need to compare the full number with country code
        const fullNumber = formData.country
          ? `+${
              countryOptions.find((c) => c.code === formData.country)
                ?.dialCode || ""
            }${value}`
          : value;
        return (
          emp.phone === fullNumber &&
          (!editingEmployee || emp.id !== editingEmployee.id)
        );
      }
      return (
        emp[field as keyof Employee]?.toString().toLowerCase() ===
          value.toLowerCase() &&
        (!editingEmployee || emp.id !== editingEmployee.id)
      );
    });
  };

  const validateFields = () => {
    const errors = {
      username: "",
      phone: "",
      email: "",
    };

    if (!editingEmployee && !formData.username) {
      errors.username = "Username is required";
    } else if (
      formData.username &&
      checkFieldExists("username", formData.username)
    ) {
      errors.username = "Username already taken";
    }

    if (!editingEmployee && !formData.phone) {
      errors.phone = "Phone number is required";
    } else if (formData.phone) {
      // Check if phone with selected country code already exists
      const fullNumber = formData.country
        ? `+${
            countryOptions.find((c) => c.code === formData.country)?.dialCode ||
            ""
          }${formData.phone}`
        : formData.phone;

      if (
        employees.some(
          (emp) =>
            emp.phone === fullNumber &&
            (!editingEmployee || emp.id !== editingEmployee.id)
        )
      ) {
        errors.phone = "Phone number already exists";
      }
    }

    if (formData.email && checkFieldExists("email", formData.email)) {
      errors.email = "Email already exists";
    }

    setFieldErrors(errors);
    return !Object.values(errors).some((error) => error !== "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    if (!validateFields()) {
      return;
    }

    try {
      let response;
      const payload: any = {
        name: formData.name,
        username: formData.username,
        email: formData.email || null,
        role: formData.role,
      };

      // Include country only if phone is being updated or it's a new user
      if (formData.phone || !editingEmployee) {
        if (!formData.country) {
          throw new Error("Country code is required");
        }
        payload.country = formData.country;
      }

      // Only include password if it's provided
      if (formData.password) {
        payload.password = formData.password;
      }

      // Only include phone if it's provided
      if (formData.phone) {
        payload.phone = formData.phone;
      }

      if (editingEmployee) {
        response = await fetch(`${BASE_URL}/users/${editingEmployee.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(payload),
        });
      } else {
        if (!formData.phone) {
          toast.error("Phone number is required for new users");
          return;
        }
        if (!formData.country) {
          toast.error("Country code is required for new users");
          return;
        }
        response = await fetch(`${BASE_URL}/users`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            ...payload,
            phone: formData.phone,
            country: formData.country,
          }),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        console.log("BACKEND ERROR DATA:", errorData);

        // Handle Zod errors at the top level
        if (errorData.fieldErrors || errorData.formErrors) {
          const fieldMsgs = errorData.fieldErrors
            ? Object.values(errorData.fieldErrors).flat().filter(Boolean)
            : [];
          const formMsgs = errorData.formErrors || [];
          let errorMsg = [...fieldMsgs, ...formMsgs].join("; ");

          // Map technical Zod messages to user-friendly ones
          const friendlyMap = {
            "Too small: expected string to have >=3 characters":
              "Username must be at least 3 characters",
            "Too small: expected string to have >=6 characters":
              "Password must be at least 6 characters",
          };
          const friendlyMsg = errorMsg
            .split("; ")
            .map((msg) => friendlyMap[msg] || msg)
            .join("; ");

          setSubmitError(
            friendlyMsg || "Invalid input. Please check your data."
          );
          throw new Error(
            friendlyMsg || "Invalid input. Please check your data."
          );
        }

        // Fallback for string or array messages
        if (typeof errorData.message === "string") {
          setSubmitError(errorData.message);
          throw new Error(errorData.message);
        }
        if (Array.isArray(errorData.message)) {
          setSubmitError(errorData.message.join("; "));
          throw new Error(errorData.message.join("; "));
        }

        setSubmitError("Something went wrong");
        throw new Error("Something went wrong");
      }

      toast.success(
        editingEmployee
          ? "Employee updated successfully"
          : "Employee added successfully"
      );
      setIsDialogOpen(false);
      resetForm();
      fetchEmployees();
    } catch (error) {
      console.error(error);
      if (!submitError) {
        toast.error("Something went wrong");
      }
    }
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      name: employee.name,
      username: employee.username,
      password: "",
      phone: "", // Leave empty by default to remain unchanged
      country: employee.country,
      email: employee.email || "",
      role: employee.role,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`${BASE_URL}/users/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(err);
      }

      toast.success("Employee deleted successfully");
      fetchEmployees();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete employee");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      username: "",
      password: "",
      phone: "",
      country: "",
      email: "",
      role: "user",
    });
    setFieldErrors({
      username: "",
      phone: "",
      email: "",
    });
    setSubmitError("");
    setEditingEmployee(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Manage Employees
          </h1>
          <p className="text-muted-foreground mt-1">
            Add, edit, and manage employee accounts
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Employee
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingEmployee ? "Edit Employee" : "Add New Employee"}
              </DialogTitle>
              <DialogDescription>
                {editingEmployee
                  ? "Update employee information below."
                  : "Fill in the details to create a new employee account."}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              {submitError && (
                <div className="text-red-500 text-sm">{submitError}</div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      username: e.target.value,
                    }))
                  }
                  placeholder="Enter username"
                  required={!editingEmployee}
                  disabled={editingEmployee !== null}
                  className={editingEmployee ? "bg-gray-100" : ""}
                />
                {fieldErrors.username && (
                  <p className="text-sm text-red-500">{fieldErrors.username}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">
                  Password {editingEmployee && "(leave empty to keep current)"}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  placeholder="Enter password"
                  required={!editingEmployee}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="flex gap-2">
                  <select
                    value={formData.country}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        country: e.target.value,
                      }))
                    }
                    className="w-[40%] border rounded px-3 py-2"
                    required={!editingEmployee || !!formData.phone}
                  >
                    {countryOptions.map((opt) => (
                      <option key={opt.code} value={opt.code}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        phone: e.target.value.replace(/^0+/, ""),
                      }))
                    }
                    placeholder={
                      editingEmployee
                        ? "Leave empty to keep current"
                        : "3001234567"
                    }
                    pattern={formData.phone ? "^[1-9][0-9]{9,}$" : undefined}
                  />
                </div>
                {fieldErrors.phone && (
                  <p className="text-sm text-red-500">{fieldErrors.phone}</p>
                )}
                {!editingEmployee && !fieldErrors.phone && (
                  <p className="text-sm text-muted-foreground">
                    Phone number is required for new users
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="Enter email address"
                />
                {fieldErrors.email && (
                  <p className="text-sm text-red-500">{fieldErrors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <select
                  id="role"
                  value={formData.role}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      role: e.target.value as "admin" | "user",
                    }))
                  }
                  className="w-full border rounded px-3 py-2"
                  required
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
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
                  {editingEmployee ? "Update" : "Create"} Employee
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Employee List
          </CardTitle>
          <CardDescription>
            {loading ? "Loading..." : `Total: ${employees.length} employees`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell className="font-medium">{employee.name}</TableCell>
                  <TableCell>{employee.username}</TableCell>
                  <TableCell>{employee.email || "-"}</TableCell>
                  <TableCell>
                    {employee.country
                      ? `+${
                          countryOptions.find(
                            (c) => c.code === employee.country
                          )?.dialCode || ""
                        }${employee.phone}`
                      : employee.phone}
                  </TableCell>
                  <TableCell>{employee.role}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(employee)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(employee.id)}
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

export default ManageEmployees;
