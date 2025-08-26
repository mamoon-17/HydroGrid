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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  Plus,
  Edit,
  Trash2,
  User,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "../../lib/api";

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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(
    null
  );

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const EMPLOYEES_PAGE_SIZE = 10;

  useEffect(() => {
    // Set page title
    document.title = "Engzone - Manage Employees";

    console.log("🔄 useEffect triggered - currentPage:", currentPage);
    fetchEmployees();
  }, [currentPage]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const offset = (currentPage - 1) * EMPLOYEES_PAGE_SIZE;
      const url = `/users?limit=${EMPLOYEES_PAGE_SIZE}&offset=${offset}`;

      console.log("🔍 Fetching employees with pagination:");
      console.log("📡 Current page:", currentPage);
      console.log("📡 Page size:", EMPLOYEES_PAGE_SIZE);
      console.log("📡 Offset:", offset);
      console.log("📡 Full URL:", url);

      const response = await apiFetch(url);

      console.log("📊 Raw API response:", response);
      console.log("📊 Response type:", typeof response);
      console.log(
        "📊 Response keys:",
        response ? Object.keys(response) : "null/undefined"
      );

      // Handle paginated response structure
      if (response && typeof response === "object" && "data" in response) {
        // Paginated response: { data, total, limit, offset }
        const { data, total } = response;

        console.log("📊 Paginated response detected:");
        console.log("📊 Data length:", data?.length);
        console.log("📊 Total count:", total);

        if (!Array.isArray(data)) {
          console.error(
            "Expected array in data field, got:",
            typeof data,
            data
          );
          throw new Error("Invalid response format from server");
        }

        setEmployees(data);
        setTotalEmployees(total);
        setHasMore(data.length === EMPLOYEES_PAGE_SIZE);
      } else if (Array.isArray(response)) {
        // Fallback: direct array response (non-paginated)
        console.log(
          "📊 Direct array response detected, length:",
          response.length
        );
        setEmployees(response);
        setTotalEmployees(response.length);
        setHasMore(response.length === EMPLOYEES_PAGE_SIZE);
      } else {
        console.error("Unexpected response format:", typeof response, response);
        throw new Error("Invalid response format from server");
      }
    } catch (err) {
      console.error("Failed to load employees", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to load employees"
      );
      setEmployees([]);
      setTotalEmployees(0);
      setHasMore(false);
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

  const handleDeleteClick = (employee: Employee) => {
    setEmployeeToDelete(employee);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!employeeToDelete) return;

    try {
      const res = await fetch(`${BASE_URL}/users/${employeeToDelete.id}`, {
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
    } finally {
      setDeleteDialogOpen(false);
      setEmployeeToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setEmployeeToDelete(null);
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
          <p className="text-xs text-muted-foreground mt-1">
            Note: Admin accounts are protected and cannot be deleted
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
            {loading ? "Loading..." : `Total: ${totalEmployees} employees`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Mobile Cards View */}
          <div className="block md:hidden space-y-4">
            {employees.map((employee) => (
              <div
                key={employee.id}
                className="border rounded-lg p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="font-medium text-sm">{employee.name}</h3>
                    <div className="text-xs text-muted-foreground">
                      @{employee.username}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`capitalize text-xs px-2 py-1 rounded ${
                        employee.role === "admin"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {employee.role}
                    </span>
                    {employee.role === "admin" && (
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                        Protected
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-xs text-muted-foreground space-y-1">
                  <div>Email: {employee.email || "-"}</div>
                  <div>
                    Phone:{" "}
                    {employee.country
                      ? `+${
                          countryOptions.find(
                            (c) => c.code === employee.country
                          )?.dialCode || ""
                        }${employee.phone}`
                      : employee.phone}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(employee)}
                    className="text-xs h-8"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteClick(employee)}
                    className="text-red-600 hover:text-red-700 text-xs h-8"
                    disabled={employee.role === "admin"}
                    title={
                      employee.role === "admin"
                        ? "Admins cannot delete other admin accounts"
                        : "Delete employee"
                    }
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
                    <TableCell className="font-medium">
                      {employee.name}
                    </TableCell>
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
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="capitalize">{employee.role}</span>
                        {employee.role === "admin" && (
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                            Protected
                          </span>
                        )}
                      </div>
                    </TableCell>
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
                          onClick={() => handleDeleteClick(employee)}
                          className="text-danger hover:text-danger"
                          disabled={employee.role === "admin"}
                          title={
                            employee.role === "admin"
                              ? "Admins cannot delete other admin accounts"
                              : "Delete employee"
                          }
                        >
                          <Trash2
                            className={`h-4 w-4 ${
                              employee.role === "admin" ? "opacity-50" : ""
                            }`}
                          />
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
              {loading ? "Loading..." : `Total: ${totalEmployees} employees`}
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
            <AlertDialogTitle>Delete Employee</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this employee? This action cannot
              be undone.
              <br />
              <br />
              <strong>This will permanently delete:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>The employee account and all credentials</li>
                <li>Access permissions and role settings</li>
              </ul>
              <br />
              <span className="text-sm text-muted-foreground">
                Employee: <strong>{employeeToDelete?.name || "Unknown"}</strong>
                <br />
                Username:{" "}
                <strong>{employeeToDelete?.username || "Unknown"}</strong>
                <br />
                Role:{" "}
                <strong>
                  {employeeToDelete?.role?.toUpperCase() || "Unknown"}
                </strong>
                <br />
                Phone: <strong>{employeeToDelete?.phone || "Unknown"}</strong>
                {employeeToDelete?.email && (
                  <>
                    <br />
                    Email: <strong>{employeeToDelete.email}</strong>
                  </>
                )}
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
              Delete Employee
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ManageEmployees;
