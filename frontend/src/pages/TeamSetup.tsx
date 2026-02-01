import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { toast } from "sonner";
import { apiFetch } from "../lib/api";
import { Building2, Users, Mail, ArrowRight, Check } from "lucide-react";

interface PendingInvitation {
  id: string;
  team: {
    id: string;
    name: string;
    slug: string;
  };
  invited_by: {
    name: string;
    email: string;
  };
  created_at: string;
}

const TeamSetup = () => {
  const { user, refreshUser, hasTeam } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [pendingInvitations, setPendingInvitations] = useState<
    PendingInvitation[]
  >([]);
  const [inviteCode, setInviteCode] = useState("");

  // Create team form
  const [teamForm, setTeamForm] = useState({
    name: "",
    slug: "",
    description: "",
  });

  useEffect(() => {
    document.title = "HydroGrid - Team Setup";

    // If user already has a team, redirect them
    if (hasTeam) {
      const redirectPath =
        user?.team_role === "owner" || user?.team_role === "admin"
          ? "/admin"
          : "/user";
      navigate(redirectPath, { replace: true });
    }

    // Fetch pending invitations
    fetchInvitations();
  }, [hasTeam, navigate, user?.team_role]);

  const fetchInvitations = async () => {
    try {
      const invitations = await apiFetch("/teams/my-invitations");
      setPendingInvitations(Array.isArray(invitations) ? invitations : []);
    } catch (error) {
      console.error("Error fetching invitations:", error);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!teamForm.name || !teamForm.slug) {
      toast.error("Please fill in team name and slug");
      return;
    }

    setIsLoading(true);
    try {
      await apiFetch("/teams", {
        method: "POST",
        body: JSON.stringify(teamForm),
      });

      toast.success("Team created successfully!");
      await refreshUser();
      navigate("/admin");
    } catch (error: any) {
      toast.error(error.message || "Failed to create team");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptInvitation = async (inviteCode: string) => {
    setIsLoading(true);
    try {
      await apiFetch("/teams/accept-invitation", {
        method: "POST",
        body: JSON.stringify({ inviteCode }),
      });

      toast.success("Invitation accepted!");
      await refreshUser();
      navigate("/user");
    } catch (error: any) {
      toast.error(error.message || "Failed to accept invitation");
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinWithCode = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inviteCode.trim()) {
      toast.error("Please enter an invitation code");
      return;
    }

    await handleAcceptInvitation(inviteCode.trim());
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleNameChange = (name: string) => {
    setTeamForm({
      ...teamForm,
      name,
      slug: generateSlug(name),
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome to HydroGrid
          </h1>
          <p className="text-gray-600 mt-2">
            Create a new team or join an existing one to get started
          </p>
        </div>

        <Card>
          <Tabs
            defaultValue={pendingInvitations.length > 0 ? "join" : "create"}
          >
            <CardHeader>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="create" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Create Team
                </TabsTrigger>
                <TabsTrigger value="join" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Join Team
                  {pendingInvitations.length > 0 && (
                    <span className="ml-1 bg-blue-500 text-white text-xs rounded-full px-2">
                      {pendingInvitations.length}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent>
              <TabsContent value="create" className="mt-0">
                <form onSubmit={handleCreateTeam} className="space-y-4">
                  <div>
                    <Label htmlFor="teamName">Team Name</Label>
                    <Input
                      id="teamName"
                      placeholder="My Water Plant Company"
                      value={teamForm.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="teamSlug">Team URL Slug</Label>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500 mr-2">
                        hydrogrid.app/
                      </span>
                      <Input
                        id="teamSlug"
                        placeholder="my-company"
                        value={teamForm.slug}
                        onChange={(e) =>
                          setTeamForm({
                            ...teamForm,
                            slug: e.target.value.toLowerCase(),
                          })
                        }
                        pattern="[a-z0-9-]+"
                        className="flex-1"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Only lowercase letters, numbers, and hyphens
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="description">Description (optional)</Label>
                    <Textarea
                      id="description"
                      placeholder="Brief description of your team or organization"
                      value={teamForm.description}
                      onChange={(e) =>
                        setTeamForm({
                          ...teamForm,
                          description: e.target.value,
                        })
                      }
                      rows={3}
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Creating..." : "Create Team"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>

                  <p className="text-xs text-center text-gray-500">
                    By creating a team, you'll become the team owner with full
                    admin access
                  </p>
                </form>
              </TabsContent>

              <TabsContent value="join" className="mt-0 space-y-6">
                {/* Pending Invitations */}
                {pendingInvitations.length > 0 && (
                  <div className="space-y-3">
                    <Label>Pending Invitations</Label>
                    {pendingInvitations.map((invitation) => (
                      <Card key={invitation.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">
                              {invitation.team.name}
                            </h4>
                            <p className="text-sm text-gray-500">
                              Invited by {invitation.invited_by.name}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() =>
                              handleAcceptInvitation(
                                (invitation as any).invite_code,
                              )
                            }
                            disabled={isLoading}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Accept
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Join with code */}
                <div>
                  <Label>Have an invitation code?</Label>
                  <form
                    onSubmit={handleJoinWithCode}
                    className="mt-2 space-y-3"
                  >
                    <Input
                      placeholder="Enter invitation code"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value)}
                    />
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading}
                    >
                      {isLoading ? "Joining..." : "Join Team"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </form>
                </div>

                {pendingInvitations.length === 0 && (
                  <div className="text-center py-4">
                    <Mail className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">
                      No pending invitations. Ask your team admin to send you an
                      invite.
                    </p>
                  </div>
                )}
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>

        <p className="text-center text-sm text-gray-500 mt-6">
          Logged in as <span className="font-medium">{user?.name}</span> (
          {user?.email})
        </p>
      </div>
    </div>
  );
};

export default TeamSetup;
