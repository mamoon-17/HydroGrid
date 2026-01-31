import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Loader2, Eye, EyeOff, Key, User } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface ChangePasswordDialogProps {
  open: boolean;
  onClose: () => void;
}

export const ChangePasswordDialog = ({
  open,
  onClose,
}: ChangePasswordDialogProps) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    retypePassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
    retype: false,
  });
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [errors, setErrors] = useState<{
    oldPassword?: string;
    newPassword?: string;
    retypePassword?: string;
  }>({});

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!formData.oldPassword) {
      newErrors.oldPassword = "Old password is required";
    }

    if (!formData.newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = "New password must be at least 6 characters";
    }

    if (!formData.retypePassword) {
      newErrors.retypePassword = "Please retype your new password";
    } else if (formData.newPassword !== formData.retypePassword) {
      newErrors.retypePassword = "Passwords do not match";
    }

    if (formData.oldPassword === formData.newPassword) {
      newErrors.newPassword =
        "New password must be different from old password";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Show confirmation first
    setShowConfirmation(true);
  };

  const handleConfirmChange = async () => {
    setLoading(true);
    try {
      const requestBody = {
        oldPassword: formData.oldPassword,
        newPassword: formData.newPassword,
      };

      const response = await fetch(`${BASE_URL}/users/change-password`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        let errorMessage = `Server error: ${response.status} ${response.statusText}`;

        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (parseError) {
          try {
            const errorText = await response.text();
            if (errorText) {
              errorMessage = `Server error: ${errorText}`;
            }
          } catch (textError) {
            // Ignore text parsing errors
          }
        }

        throw new Error(errorMessage);
      }

      toast.success("Password changed successfully!");
      handleClose();
    } catch (error) {
      console.error("Change password error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to change password"
      );
    } finally {
      setLoading(false);
      setShowConfirmation(false);
    }
  };

  const handleClose = () => {
    setFormData({
      oldPassword: "",
      newPassword: "",
      retypePassword: "",
    });
    setErrors({});
    setShowPasswords({
      old: false,
      new: false,
      retype: false,
    });
    onClose();
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const getPasswordStrength = (password: string) => {
    if (password.length === 0)
      return { strength: "none", color: "text-muted-foreground", text: "" };
    if (password.length < 6)
      return { strength: "weak", color: "text-red-500", text: "Too short" };
    if (password.length < 8)
      return { strength: "weak", color: "text-red-500", text: "Weak" };
    if (password.length < 10)
      return { strength: "medium", color: "text-yellow-500", text: "Medium" };
    return { strength: "strong", color: "text-green-500", text: "Strong" };
  };

  const passwordStrength = getPasswordStrength(formData.newPassword);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Change Password
          </DialogTitle>
          <DialogDescription asChild>
            <div>
              <p>
                Enter your current password and choose a new one. Make sure to
                remember your new password.
              </p>
              <div className="mt-2 text-xs text-muted-foreground">
                <p>• Use a strong, unique password</p>
                <p>• Avoid common words or personal information</p>
                <p>• Consider using a mix of letters, numbers, and symbols</p>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* User Info */}
          {user && (
            <div className="p-3 bg-muted/50 rounded-lg border">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{user.name}</span>
                <span className="text-muted-foreground">({user.username})</span>
                <span className="ml-auto text-xs capitalize bg-primary/10 text-primary px-2 py-1 rounded">
                  {user.role}
                </span>
              </div>
            </div>
          )}

          {/* Old Password */}
          <div className="space-y-2">
            <Label htmlFor="oldPassword">Current Password</Label>
            <div className="relative">
              <Input
                id="oldPassword"
                type={showPasswords.old ? "text" : "password"}
                value={formData.oldPassword}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    oldPassword: e.target.value,
                  }))
                }
                placeholder="Enter your current password"
                className={errors.oldPassword ? "border-red-500" : ""}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => togglePasswordVisibility("old")}
              >
                {showPasswords.old ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {errors.oldPassword && (
              <p className="text-sm text-red-500">{errors.oldPassword}</p>
            )}
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showPasswords.new ? "text" : "password"}
                value={formData.newPassword}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    newPassword: e.target.value,
                  }))
                }
                placeholder="Enter your new password"
                className={errors.newPassword ? "border-red-500" : ""}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => togglePasswordVisibility("new")}
              >
                {showPasswords.new ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {errors.newPassword && (
              <p className="text-sm text-red-500">{errors.newPassword}</p>
            )}
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted-foreground">
                Password must be at least 6 characters long
              </p>
              {passwordStrength.text && (
                <span
                  className={`text-xs font-medium ${passwordStrength.color}`}
                >
                  {passwordStrength.text}
                </span>
              )}
            </div>
          </div>

          {/* Retype New Password */}
          <div className="space-y-2">
            <Label htmlFor="retypePassword">Confirm New Password</Label>
            <div className="relative">
              <Input
                id="retypePassword"
                type={showPasswords.retype ? "text" : "password"}
                value={formData.retypePassword}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    retypePassword: e.target.value,
                  }))
                }
                placeholder="Retype your new password"
                className={errors.retypePassword ? "border-red-500" : ""}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => togglePasswordVisibility("retype")}
              >
                {showPasswords.retype ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {errors.retypePassword && (
              <p className="text-sm text-red-500">{errors.retypePassword}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Changing...
                </>
              ) : (
                "Change Password"
              )}
            </Button>
          </div>
        </form>

        {/* Confirmation Dialog */}
        {showConfirmation && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-background p-6 rounded-lg border max-w-md mx-4">
              <h3 className="text-lg font-semibold mb-4">
                Confirm Password Change
              </h3>
              <p className="text-muted-foreground mb-4">
                Are you sure you want to change your password? You will need to
                use your new password for future logins.
              </p>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmation(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmChange}
                  disabled={loading}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Changing...
                    </>
                  ) : (
                    "Yes, Change Password"
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
