import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Team } from './teams.entity';
import { TeamInvitation, InvitationStatus } from './team-invitations.entity';
import { Users, TeamRole } from '../users/users.entity';
import {
  CreateTeamDto,
  UpdateTeamDto,
  InviteMemberDto,
} from './dtos/teams.dto';
import { GeneratorService } from '../shared/generator.service';

@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(Team) private readonly teamsRepo: Repository<Team>,
    @InjectRepository(TeamInvitation)
    private readonly invitationsRepo: Repository<TeamInvitation>,
    @InjectRepository(Users) private readonly usersRepo: Repository<Users>,
    private readonly generatorService: GeneratorService,
  ) {}

  /**
   * Create a new team and set the creating user as owner
   */
  async createTeam(userId: string, payload: CreateTeamDto): Promise<Team> {
    const { name, slug, description } = payload;

    // Check if user already owns or belongs to a team
    const user = await this.usersRepo.findOne({
      where: { id: userId },
      relations: ['team'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.team) {
      throw new ConflictException('You already belong to a team. Leave your current team first.');
    }

    // Check if slug is unique
    const existingTeam = await this.teamsRepo.findOne({ where: { slug } });
    if (existingTeam) {
      throw new ConflictException('Team slug already exists');
    }

    // Create the team
    const team = this.teamsRepo.create({
      name,
      slug: slug.toLowerCase(),
      description,
      owner: user,
    });

    const savedTeam = await this.teamsRepo.save(team);

    // Update user to be the team owner
    user.team = savedTeam;
    user.team_role = TeamRole.OWNER;
    await this.usersRepo.save(user);

    return this.getTeamById(savedTeam.id);
  }

  /**
   * Get team by ID with members
   */
  async getTeamById(teamId: string): Promise<Team> {
    const team = await this.teamsRepo.findOne({
      where: { id: teamId },
      relations: ['owner', 'members'],
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    return team;
  }

  /**
   * Get team by slug
   */
  async getTeamBySlug(slug: string): Promise<Team> {
    const team = await this.teamsRepo.findOne({
      where: { slug },
      relations: ['owner', 'members'],
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    return team;
  }

  /**
   * Get the team for a user
   */
  async getUserTeam(userId: string): Promise<Team | null> {
    const user = await this.usersRepo.findOne({
      where: { id: userId },
      relations: ['team', 'team.owner', 'team.members'],
    });

    return user?.team || null;
  }

  /**
   * Update team details (only owner/admin can do this)
   */
  async updateTeam(
    teamId: string,
    userId: string,
    updates: UpdateTeamDto,
  ): Promise<Team> {
    const team = await this.getTeamById(teamId);
    const user = await this.usersRepo.findOne({ where: { id: userId } });

    if (!user || (user.team?.id !== teamId)) {
      throw new ForbiddenException('You are not a member of this team');
    }

    if (user.team_role !== TeamRole.OWNER && user.team_role !== TeamRole.ADMIN) {
      throw new ForbiddenException('Only team owners and admins can update team settings');
    }

    Object.assign(team, updates);
    return this.teamsRepo.save(team);
  }

  /**
   * Invite a member to the team via email
   */
  async inviteMember(
    teamId: string,
    inviterId: string,
    payload: InviteMemberDto,
  ): Promise<TeamInvitation> {
    const team = await this.getTeamById(teamId);
    const inviter = await this.usersRepo.findOne({
      where: { id: inviterId },
      relations: ['team'],
    });

    if (!inviter || inviter.team?.id !== teamId) {
      throw new ForbiddenException('You are not a member of this team');
    }

    if (inviter.team_role !== TeamRole.OWNER && inviter.team_role !== TeamRole.ADMIN) {
      throw new ForbiddenException('Only team owners and admins can invite members');
    }

    // Check if there's already a pending invitation for this email
    const existingInvitation = await this.invitationsRepo.findOne({
      where: {
        team: { id: teamId },
        email: payload.email.toLowerCase(),
        status: InvitationStatus.PENDING,
      },
    });

    if (existingInvitation) {
      throw new ConflictException('An invitation is already pending for this email');
    }

    // Check if user with this email is already in the team
    const existingMember = await this.usersRepo.findOne({
      where: {
        email: payload.email.toLowerCase(),
        team: { id: teamId },
      },
    });

    if (existingMember) {
      throw new ConflictException('This user is already a member of the team');
    }

    const inviteCode = this.generatorService.generateRandomCode(32);

    const invitation = this.invitationsRepo.create({
      team,
      email: payload.email.toLowerCase(),
      invite_code: inviteCode,
      invited_by: inviter,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    return this.invitationsRepo.save(invitation);
  }

  /**
   * Accept a team invitation
   */
  async acceptInvitation(userId: string, inviteCode: string): Promise<Team> {
    const user = await this.usersRepo.findOne({
      where: { id: userId },
      relations: ['team'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.team) {
      throw new ConflictException('You already belong to a team. Leave your current team first.');
    }

    const invitation = await this.invitationsRepo.findOne({
      where: { invite_code: inviteCode },
      relations: ['team'],
    });

    if (!invitation) {
      throw new NotFoundException('Invalid invitation code');
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('This invitation has already been used or expired');
    }

    if (invitation.expires_at < new Date()) {
      invitation.status = InvitationStatus.EXPIRED;
      await this.invitationsRepo.save(invitation);
      throw new BadRequestException('This invitation has expired');
    }

    // Verify email matches
    if (user.email?.toLowerCase() !== invitation.email.toLowerCase()) {
      throw new ForbiddenException('This invitation was sent to a different email address');
    }

    // Add user to team
    user.team = invitation.team;
    user.team_role = TeamRole.MEMBER;
    await this.usersRepo.save(user);

    // Mark invitation as accepted
    invitation.status = InvitationStatus.ACCEPTED;
    await this.invitationsRepo.save(invitation);

    return this.getTeamById(invitation.team.id);
  }

  /**
   * Get pending invitations for a team
   */
  async getTeamInvitations(teamId: string, userId: string): Promise<TeamInvitation[]> {
    const user = await this.usersRepo.findOne({
      where: { id: userId },
      relations: ['team'],
    });

    if (!user || user.team?.id !== teamId) {
      throw new ForbiddenException('You are not a member of this team');
    }

    if (user.team_role !== TeamRole.OWNER && user.team_role !== TeamRole.ADMIN) {
      throw new ForbiddenException('Only team owners and admins can view invitations');
    }

    return this.invitationsRepo.find({
      where: { team: { id: teamId }, status: InvitationStatus.PENDING },
      relations: ['invited_by'],
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Cancel/revoke a pending invitation
   */
  async cancelInvitation(
    teamId: string,
    invitationId: string,
    userId: string,
  ): Promise<void> {
    const user = await this.usersRepo.findOne({
      where: { id: userId },
      relations: ['team'],
    });

    if (!user || user.team?.id !== teamId) {
      throw new ForbiddenException('You are not a member of this team');
    }

    if (user.team_role !== TeamRole.OWNER && user.team_role !== TeamRole.ADMIN) {
      throw new ForbiddenException('Only team owners and admins can cancel invitations');
    }

    const result = await this.invitationsRepo.delete({
      id: invitationId,
      team: { id: teamId },
      status: InvitationStatus.PENDING,
    });

    if (result.affected === 0) {
      throw new NotFoundException('Invitation not found or already processed');
    }
  }

  /**
   * Update a team member's role
   */
  async updateMemberRole(
    teamId: string,
    memberId: string,
    userId: string,
    newRole: TeamRole,
  ): Promise<Users> {
    const user = await this.usersRepo.findOne({
      where: { id: userId },
      relations: ['team'],
    });

    if (!user || user.team?.id !== teamId) {
      throw new ForbiddenException('You are not a member of this team');
    }

    if (user.team_role !== TeamRole.OWNER) {
      throw new ForbiddenException('Only the team owner can change member roles');
    }

    const member = await this.usersRepo.findOne({
      where: { id: memberId },
      relations: ['team'],
    });

    if (!member || member.team?.id !== teamId) {
      throw new NotFoundException('Member not found in this team');
    }

    if (member.team_role === TeamRole.OWNER) {
      throw new ForbiddenException('Cannot change the owner\'s role');
    }

    member.team_role = newRole;
    return this.usersRepo.save(member);
  }

  /**
   * Remove a member from the team
   */
  async removeMember(
    teamId: string,
    memberId: string,
    userId: string,
  ): Promise<void> {
    const user = await this.usersRepo.findOne({
      where: { id: userId },
      relations: ['team'],
    });

    if (!user || user.team?.id !== teamId) {
      throw new ForbiddenException('You are not a member of this team');
    }

    // Users can remove themselves, or admins/owners can remove others
    const isSelf = userId === memberId;
    const canRemoveOthers =
      user.team_role === TeamRole.OWNER || user.team_role === TeamRole.ADMIN;

    if (!isSelf && !canRemoveOthers) {
      throw new ForbiddenException('You do not have permission to remove members');
    }

    const member = await this.usersRepo.findOne({
      where: { id: memberId },
      relations: ['team'],
    });

    if (!member || member.team?.id !== teamId) {
      throw new NotFoundException('Member not found in this team');
    }

    if (member.team_role === TeamRole.OWNER && !isSelf) {
      throw new ForbiddenException('Cannot remove the team owner');
    }

    // If owner is leaving, they need to transfer ownership first
    if (member.team_role === TeamRole.OWNER && isSelf) {
      throw new ForbiddenException(
        'As the owner, you must transfer ownership before leaving the team',
      );
    }

    member.team = null;
    member.team_role = null;
    await this.usersRepo.save(member);
  }

  /**
   * Transfer team ownership to another member
   */
  async transferOwnership(
    teamId: string,
    currentOwnerId: string,
    newOwnerId: string,
  ): Promise<Team> {
    const currentOwner = await this.usersRepo.findOne({
      where: { id: currentOwnerId },
      relations: ['team'],
    });

    if (!currentOwner || currentOwner.team?.id !== teamId) {
      throw new ForbiddenException('You are not a member of this team');
    }

    if (currentOwner.team_role !== TeamRole.OWNER) {
      throw new ForbiddenException('Only the current owner can transfer ownership');
    }

    const newOwner = await this.usersRepo.findOne({
      where: { id: newOwnerId },
      relations: ['team'],
    });

    if (!newOwner || newOwner.team?.id !== teamId) {
      throw new NotFoundException('New owner must be a member of the team');
    }

    const team = await this.getTeamById(teamId);

    // Update team owner
    team.owner = newOwner;
    await this.teamsRepo.save(team);

    // Update roles
    currentOwner.team_role = TeamRole.ADMIN;
    newOwner.team_role = TeamRole.OWNER;
    await this.usersRepo.save([currentOwner, newOwner]);

    return this.getTeamById(teamId);
  }

  /**
   * Delete a team (only owner can do this)
   */
  async deleteTeam(teamId: string, userId: string): Promise<void> {
    const user = await this.usersRepo.findOne({
      where: { id: userId },
      relations: ['team'],
    });

    if (!user || user.team?.id !== teamId) {
      throw new ForbiddenException('You are not a member of this team');
    }

    if (user.team_role !== TeamRole.OWNER) {
      throw new ForbiddenException('Only the team owner can delete the team');
    }

    // Remove all members from the team first
    await this.usersRepo.update(
      { team: { id: teamId } },
      { team: null, team_role: null },
    );

    // Delete the team (cascade will handle invitations)
    await this.teamsRepo.delete(teamId);
  }

  /**
   * Check if user has access to a team (is a member)
   */
  async verifyTeamAccess(userId: string, teamId: string): Promise<boolean> {
    const user = await this.usersRepo.findOne({
      where: { id: userId },
      relations: ['team'],
    });

    return user?.team?.id === teamId;
  }

  /**
   * Get user's pending invitations (invitations sent to their email)
   */
  async getUserPendingInvitations(userId: string): Promise<TeamInvitation[]> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });

    if (!user || !user.email) {
      return [];
    }

    return this.invitationsRepo.find({
      where: {
        email: user.email.toLowerCase(),
        status: InvitationStatus.PENDING,
      },
      relations: ['team', 'invited_by'],
      order: { created_at: 'DESC' },
    });
  }
}
