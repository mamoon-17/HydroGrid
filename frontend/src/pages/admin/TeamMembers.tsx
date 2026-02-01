import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import { Badge } from "../../components/ui/badge";
import {
  UserPlus,
  Trash2,
  Users,
  Mail,
  Copy,
  Check,
  Crown,
  Shield,
  User,
  Loader2,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "../../lib/api";
import { useAuth } from "../../contexts/AuthContext";

interface TeamMember {
  id: string;
  name: string;
  username: string;
  phone: string;
  email?: string | null;
  team_role: "owner" | "admin" | "member";
  created_at?: string;
}

interface Invitation {
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
}

const TeamMembers = () => {
  const { user, isTeamOwner } = useAuth();
  const queryClient = useQueryClient();

  // State
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);
  const [roleChangeData, setRoleChangeData] = useState<{
    member: TeamMember;
    newRole: "admin" | "member";
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  useEffect(() => {
    document.title = "HydroGrid - Team Members";
  }, []);

  // Fetch team
  const { data: team } = useQuery<Team>({
    queryKey: ["team"],
    queryFn: () => apiFetch("/teams/my-team"),
  });

  // Fetch members
  const { data: membersData, isLoading: membersLoading } = useQuery<{
    data: TeamMember[];
    total: number;
  }>({
    queryKey: ["team-members", currentPage],
    queryFn: () =>
      apiFetch(
        `/users?limit=${PAGE_SIZE}&offset=${(currentPage - 1) * PAGE_SIZE}`,
      ),
  });

  // Fetch invitations
  const { data: invitations, isLoading: invitationsLoading } = useQuery<
    Invitation[]
  >({
    queryKey: ["team-invitations"],
    queryFn: async () => {
      if (!team?.id) return [];
      return apiFetch(`/teams/${team.id}/invitations`);
    },
    enabled: !!team?.id,
  });

  const members = membersData?.data ?? [];
  const totalMembers = membersData?.total ?? 0;
  const pendingInvitations = (invitations ?? []).filter(
    (inv) => inv.status === "pending",
  );

  // Invite mutation
  const inviteMutation = useMutation({
    mutationFn: (email: string) =>
      apiFetch(`/teams/${team?.id}/invite`, {
        method: "POST",
        body: JSON.stringify({ email }),
      }),
    onSuccess: () => {
      toast.success("Invitation sent successfully!");
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

  // Update role mutation
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
      apiFetch(`/users/${memberId}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Member removed from team");
      queryClient.invalidateQueries({ queryKey: ["team-members"] });
      setMemberToDelete(null);
      setDeleteDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to remove member");
    },
  });

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) {
      toast.error("Please enter an email address");
      return;
    }
    if (!inviteEmail.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    inviteMutation.mutate(inviteEmail.trim().toLowerCase());
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success("Invite code copied!");
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleDeleteClick = (member: TeamMember) => {
    setMemberToDelete(member);
    setDeleteDialogOpen(true);
  };

  const handleRoleChange = (
    member: TeamMember,
    newRole: "admin" | "member",
  ) => {
    if (member.team_role === newRole) return;
    setRoleChangeData({ member, newRole });
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return <Crown className="h-3 w-3" />;
      case "admin":
        return <Shield className="h-3 w-3" />;
      default:
        return <User className="h-3 w-3" />;
    }
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case "owner":
        return "bg-amber-100 text-amber-700";
      case "admin":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const canDeleteMember = (member: TeamMember) => {
    if (member.team_role === "owner") return false;
    if (member.team_role === "admin" && !isTeamOwner) return false;
    return true;
  };

  const totalPages = Math.ceil(totalMembers / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Team Members</h1>
        <p className="text-muted-foreground mt-1">
          Manage your team members and invitations
        </p>
      </div>

      <Tabs defaultValue="members" className="space-y-4">
        <TabsList>
          <TabsTrigger value="members" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Members ({totalMembers})
          </TabsTrigger>
          <TabsTrigger value="invitations" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Invitations ({pendingInvitations.length})
          </TabsTrigger>
        </TabsList>

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
                  {totalMembers} member{totalMembers !== 1 ? "s" : ""} in your
                  team
                </CardDescription>
              </div>
              <Button onClick={() => setInviteDialogOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Member
              </Button>
            </CardHeader>
            <CardContent>
              {membersLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : members.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No team members yet</p>
                  <p className="text-sm mt-1">
                    Invite members to join your team
                  </p>
                  <Button
                    className="mt-4"
                    onClick={() => setInviteDialogOpen(true)}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Send First Invitation
                  </Button>
                </div>
              ) : (
                <>
                  {/* Mobile View */}
                  <div className="md:hidden space-y-3">
                    {members.map((member) => (
                      <div
                        key={member.id}
                        className="border rounded-lg p-4 space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-medium">{member.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              @{member.username}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {member.email || "No email"}
                            </p>
                          </div>
                          <Badge
                            className={`${getRoleBadgeClass(member.team_role)} flex items-center gap-1`}
                          >
                            {getRoleIcon(member.team_role)}
                            <span className="capitalize">
                              {member.team_role}
                            </span>
                          </Badge>
                        </div>

                        {member.team_role !== "owner" && (
                          <div className="flex items-center gap-2 pt-2 border-t">
                            {isTeamOwner && (
                              <Select
                                value={member.team_role}
                                onValueChange={(value: "admin" | "member") =>
                                  handleRoleChange(member, value)
                                }
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="admin">Admin</SelectItem>
                                  <SelectItem value="member">Member</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                            {canDeleteMember(member) && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => handleDeleteClick(member)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Desktop View */}
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Username</TableHead>
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
                            <TableCell>@{member.username}</TableCell>
                            <TableCell>{member.email || "-"}</TableCell>
                            <TableCell>
                              <Badge
                                className={`${getRoleBadgeClass(member.team_role)} flex items-center gap-1 w-fit`}
                              >
                                {getRoleIcon(member.team_role)}
                                <span className="capitalize">
                                  {member.team_role}
                                </span>
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {member.team_role !== "owner" ? (
                                <div className="flex items-center justify-end gap-2">
                                  {isTeamOwner && (
                                    <Select
                                      value={member.team_role}
                                      onValueChange={(
                                        value: "admin" | "member",
                                      ) => handleRoleChange(member, value)}
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
                                  {canDeleteMember(member) && (
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="text-destructive hover:text-destructive"
                                      onClick={() => handleDeleteClick(member)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="text-muted-foreground"
                                >
                                  Protected
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <p className="text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setCurrentPage((p) => Math.max(1, p - 1))
                          }
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setCurrentPage((p) => Math.min(totalPages, p + 1))
                          }
                          disabled={currentPage === totalPages}
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invitations Tab */}
        <TabsContent value="invitations">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Pending Invitations
                </CardTitle>
                <CardDescription>
                  Invitations waiting to be accepted
                </CardDescription>
              </div>
              <Button onClick={() => setInviteDialogOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Send Invitation
              </Button>
            </CardHeader>
            <CardContent>
              {invitationsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : pendingInvitations.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No pending invitations</p>
                  <p className="text-sm mt-1">
                    Send invitations to add members to your team
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingInvitations.map((invitation) => (
                    <div
                      key={invitation.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="space-y-1">
                        <p className="font-medium">{invitation.email}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Expires:{" "}
                            {new Date(
                              invitation.expires_at,
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-muted px-3 py-1.5 rounded">
                          <code className="text-sm font-mono">
                            {invitation.invite_code}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() =>
                              handleCopyCode(invitation.invite_code)
                            }
                          >
                            {copiedCode === invitation.invite_code ? (
                              <Check className="h-3 w-3 text-green-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                        <Button
                          variant="outline"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() =>
                            cancelInvitationMutation.mutate(invitation.id)
                          }
                          disabled={cancelInvitationMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Invite Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Send an invitation email. The recipient will need to sign up (or
              log in) and enter the invite code to join your team.
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
                  disabled={inviteMutation.isPending}
                />
              </div>
              <div className="bg-muted p-3 rounded-lg text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">
                  How it works:
                </p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>We'll generate a unique invite code</li>
                  <li>Share the code with your team member</li>
                  <li>They sign up and enter the code to join</li>
                  <li>They'll appear in your team as a Member</li>
                </ol>
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

      {/* Role Change Confirmation */}
      <AlertDialog
        open={!!roleChangeData}
        onOpenChange={() => setRoleChangeData(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Member Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change{" "}
              <strong>{roleChangeData?.member.name}</strong>'s role from{" "}
              <strong>{roleChangeData?.member.team_role}</strong> to{" "}
              <strong>{roleChangeData?.newRole}</strong>?
              {roleChangeData?.newRole === "admin" && (
                <span className="block mt-2 text-amber-600">
                  Admins can manage plants, reports, and team members.
                </span>
              )}
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

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              <strong>{memberToDelete?.name}</strong> from the team? They will
              lose access to all team resources.
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

export default TeamMembers;
