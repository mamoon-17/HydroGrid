import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Building2,
  Mail,
  UserPlus,
  Copy,
  Check,
  Trash2,
  Crown,
  Shield,
  User,
  Clock,
  Loader2,
  Settings,
  Users,
} from "lucide-react";
import { toast } from "sonner";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  username: string;
  team_role: "owner" | "admin" | "member";
  created_at: string;
}

interface TeamInvitation {
  id: string;
  email: string;
  invite_code: string;
  status: "pending" | "accepted" | "declined" | "expired";
  expires_at: string;
  created_at: string;
}

interface Team {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  is_active: boolean;
}

const TeamSettings = () => {
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [editingTeam, setEditingTeam] = useState(false);
  const [teamForm, setTeamForm] = useState({
    name: "",
    description: "",
  });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);
  const [roleChangeData, setRoleChangeData] = useState<{
    member: TeamMember;
    newRole: string;
  } | null>(null);

  const isOwner = user?.team_role === "owner";

  useEffect(() => {
    document.title = "Team Settings - HydroGrid";
  }, []);

  // Fetch team details
  const { data: team, isLoading: teamLoading } = useQuery<Team>({
    queryKey: ["team"],
    queryFn: () => apiFetch("/teams/my-team"),
  });

  // Fetch team members
  const { data: membersData, isLoading: membersLoading } = useQuery<{
    data: TeamMember[];
    total: number;
  }>({
    queryKey: ["team-members"],
    queryFn: () => apiFetch("/users"),
  });

  // Fetch pending invitations
  const { data: invitations, isLoading: invitationsLoading } = useQuery<
    TeamInvitation[]
  >({
    queryKey: ["team-invitations"],
    queryFn: async () => {
      if (!team?.id) return [];
      return apiFetch(`/teams/${team.id}/invitations`);
    },
    enabled: !!team?.id,
  });

  // Safe access to arrays
  const members = membersData?.data ?? [];
  const pendingInvitations = invitations ?? [];

  // Update team mutation
  const updateTeamMutation = useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      apiFetch(`/teams/${team?.id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast.success("Team updated successfully");
      queryClient.invalidateQueries({ queryKey: ["team"] });
      refreshUser();
      setEditingTeam(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update team");
    },
  });

  // Invite member mutation
  const inviteMutation = useMutation({
    mutationFn: (email: string) =>
      apiFetch(`/teams/${team?.id}/invite`, {
        method: "POST",
        body: JSON.stringify({ email }),
      }),
    onSuccess: () => {
      toast.success("Invitation sent successfully");
      queryClient.invalidateQueries({ queryKey: ["team-invitations"] });
      setInviteEmail("");
      setInviteDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to send invitation");
    },
  });

  // Cancel invitation mutation
  const cancelInvitationMutation = useMutation({
    mutationFn: (invitationId: string) =>
      apiFetch(`/teams/${team?.id}/invitations/${invitationId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      toast.success("Invitation cancelled");
      queryClient.invalidateQueries({ queryKey: ["team-invitations"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to cancel invitation");
    },
  });

  // Update member role mutation
  const updateRoleMutation = useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: string }) =>
      apiFetch(`/teams/${team?.id}/members/${memberId}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
      }),
    onSuccess: () => {
      toast.success("Role updated successfully");
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      setRoleChangeData(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update role");
    },
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: (memberId: string) =>
      apiFetch(`/teams/${team?.id}/members/${memberId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      toast.success("Member removed from team");
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      setMemberToDelete(null);
      setDeleteConfirmOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to remove member");
    },
  });

  useEffect(() => {
    if (team) {
      setTeamForm({
        name: team.name,
        description: team.description || "",
      });
    }
  }, [team]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success("Invite code copied to clipboard");
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) {
      toast.error("Please enter an email address");
      return;
    }
    inviteMutation.mutate(inviteEmail);
  };

  const handleUpdateTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamForm.name.trim()) {
      toast.error("Team name is required");
      return;
    }
    updateTeamMutation.mutate(teamForm);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return <Crown className="h-4 w-4 text-amber-500" />;
      case "admin":
        return <Shield className="h-4 w-4 text-blue-500" />;
      default:
        return <User className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "owner":
        return "bg-amber-100 text-amber-800";
      case "admin":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (teamLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Team Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your team, members, and invitations
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="members" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Members
          </TabsTrigger>
          <TabsTrigger value="invitations" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Invitations
          </TabsTrigger>
        </TabsList>

        {/* General Settings Tab */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Team Information
              </CardTitle>
              <CardDescription>
                View and update your team's basic information
              </CardDescription>
            </CardHeader>
            <CardContent>
              {editingTeam ? (
                <form onSubmit={handleUpdateTeam} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="team-name">Team Name</Label>
                    <Input
                      id="team-name"
                      value={teamForm.name}
                      onChange={(e) =>
                        setTeamForm({ ...teamForm, name: e.target.value })
                      }
                      placeholder="Enter team name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="team-description">Description</Label>
                    <Textarea
                      id="team-description"
                      value={teamForm.description}
                      onChange={(e) =>
                        setTeamForm({
                          ...teamForm,
                          description: e.target.value,
                        })
                      }
                      placeholder="Enter team description (optional)"
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={updateTeamMutation.isPending}
                    >
                      {updateTeamMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setEditingTeam(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Team Name</Label>
                      <p className="text-lg font-medium">{team?.name}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Team Slug</Label>
                      <p className="text-lg font-medium font-mono">
                        {team?.slug}
                      </p>
                    </div>
                  </div>
                  {team?.description && (
                    <div>
                      <Label className="text-muted-foreground">
                        Description
                      </Label>
                      <p className="mt-1">{team.description}</p>
                    </div>
                  )}
                  {isOwner && (
                    <Button onClick={() => setEditingTeam(true)}>
                      Edit Team Info
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Team Members
                </CardTitle>
                <CardDescription>
                  Manage your team members and their roles
                </CardDescription>
              </div>
              <Dialog
                open={inviteDialogOpen}
                onOpenChange={setInviteDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Invite Member
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invite Team Member</DialogTitle>
                    <DialogDescription>
                      Send an invitation email to add a new member to your team
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleInvite}>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="invite-email">Email Address</Label>
                        <Input
                          id="invite-email"
                          type="email"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          placeholder="colleague@example.com"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setInviteDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={inviteMutation.isPending}>
                        {inviteMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Mail className="h-4 w-4 mr-2" />
                            Send Invitation
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {membersLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : members.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No team members yet</p>
                  <p className="text-sm mt-1">
                    Invite members to join your team
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">
                          {member.name}
                          {member.id === user?.id && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              (You)
                            </span>
                          )}
                        </TableCell>
                        <TableCell>{member.email}</TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={`flex items-center gap-1 w-fit ${getRoleBadgeColor(
                              member.team_role,
                            )}`}
                          >
                            {getRoleIcon(member.team_role)}
                            <span className="capitalize">
                              {member.team_role}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {member.id !== user?.id &&
                            member.team_role !== "owner" && (
                              <div className="flex items-center justify-end gap-2">
                                {isOwner && (
                                  <Select
                                    value={member.team_role}
                                    onValueChange={(value) =>
                                      setRoleChangeData({
                                        member,
                                        newRole: value,
                                      })
                                    }
                                  >
                                    <SelectTrigger className="w-28">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="admin">
                                        Admin
                                      </SelectItem>
                                      <SelectItem value="member">
                                        Member
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => {
                                    setMemberToDelete(member);
                                    setDeleteConfirmOpen(true);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invitations Tab */}
        <TabsContent value="invitations">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Pending Invitations
              </CardTitle>
              <CardDescription>
                View and manage pending team invitations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {invitationsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : pendingInvitations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No pending invitations</p>
                  <p className="text-sm mt-1">
                    Invite team members from the Members tab
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Invite Code</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingInvitations
                      .filter((inv) => inv.status === "pending")
                      .map((invitation) => (
                        <TableRow key={invitation.id}>
                          <TableCell>{invitation.email}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <code className="bg-muted px-2 py-1 rounded text-sm">
                                {invitation.invite_code}
                              </code>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() =>
                                  handleCopyCode(invitation.invite_code)
                                }
                              >
                                {copiedCode === invitation.invite_code ? (
                                  <Check className="h-4 w-4 text-green-500" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="capitalize">
                              <Clock className="h-3 w-3 mr-1" />
                              {invitation.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(
                              invitation.expires_at,
                            ).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() =>
                                cancelInvitationMutation.mutate(invitation.id)
                              }
                              disabled={cancelInvitationMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Role Change Confirmation */}
      <AlertDialog
        open={!!roleChangeData}
        onOpenChange={() => setRoleChangeData(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Member Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change {roleChangeData?.member.name}'s
              role from {roleChangeData?.member.team_role} to{" "}
              {roleChangeData?.newRole}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (roleChangeData) {
                  updateRoleMutation.mutate({
                    memberId: roleChangeData.member.id,
                    role: roleChangeData.newRole,
                  });
                }
              }}
            >
              Change Role
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Member Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {memberToDelete?.name} from the
              team? They will lose access to all team resources.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (memberToDelete) {
                  removeMemberMutation.mutate(memberToDelete.id);
                }
              }}
            >
              Remove Member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TeamSettings;
