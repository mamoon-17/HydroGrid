import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { TeamsService } from './teams.service';
import { AuthGuard } from '../auth/auth.guard';
import { User } from '../common/decorators/user.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  CreateTeamDto,
  CreateTeamSchema,
  UpdateTeamDto,
  UpdateTeamSchema,
  InviteMemberDto,
  InviteMemberSchema,
  AcceptInvitationDto,
  AcceptInvitationSchema,
  UpdateMemberRoleSchema,
} from './dtos/teams.dto';
import { TeamRole } from '../users/users.entity';

@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  /**
   * Create a new team (user becomes owner)
   */
  @Post()
  @UseGuards(AuthGuard)
  async createTeam(
    @User('id') userId: string,
    @Body(new ZodValidationPipe(CreateTeamSchema)) payload: CreateTeamDto,
  ) {
    return this.teamsService.createTeam(userId, payload);
  }

  /**
   * Get current user's team
   */
  @Get('my-team')
  @UseGuards(AuthGuard)
  async getMyTeam(@User('id') userId: string) {
    const team = await this.teamsService.getUserTeam(userId);
    return team || { hasTeam: false };
  }

  /**
   * Get pending invitations for the current user
   */
  @Get('my-invitations')
  @UseGuards(AuthGuard)
  async getMyInvitations(@User('id') userId: string) {
    return this.teamsService.getUserPendingInvitations(userId);
  }

  /**
   * Accept a team invitation
   */
  @Post('accept-invitation')
  @UseGuards(AuthGuard)
  async acceptInvitation(
    @User('id') userId: string,
    @Body(new ZodValidationPipe(AcceptInvitationSchema))
    payload: AcceptInvitationDto,
  ) {
    return this.teamsService.acceptInvitation(userId, payload.inviteCode);
  }

  /**
   * Get team by ID
   */
  @Get(':id')
  @UseGuards(AuthGuard)
  async getTeamById(@Param('id') teamId: string, @User('id') userId: string) {
    // Verify user has access to this team
    const hasAccess = await this.teamsService.verifyTeamAccess(userId, teamId);
    if (!hasAccess) {
      return { error: 'Access denied' };
    }
    return this.teamsService.getTeamById(teamId);
  }

  /**
   * Update team details
   */
  @Patch(':id')
  @UseGuards(AuthGuard)
  async updateTeam(
    @Param('id') teamId: string,
    @User('id') userId: string,
    @Body(new ZodValidationPipe(UpdateTeamSchema)) updates: UpdateTeamDto,
  ) {
    return this.teamsService.updateTeam(teamId, userId, updates);
  }

  /**
   * Invite a member to the team
   */
  @Post(':id/invite')
  @UseGuards(AuthGuard)
  async inviteMember(
    @Param('id') teamId: string,
    @User('id') userId: string,
    @Body(new ZodValidationPipe(InviteMemberSchema)) payload: InviteMemberDto,
  ) {
    return this.teamsService.inviteMember(teamId, userId, payload);
  }

  /**
   * Get pending invitations for the team
   */
  @Get(':id/invitations')
  @UseGuards(AuthGuard)
  async getTeamInvitations(
    @Param('id') teamId: string,
    @User('id') userId: string,
  ) {
    return this.teamsService.getTeamInvitations(teamId, userId);
  }

  /**
   * Cancel a pending invitation
   */
  @Delete(':id/invitations/:invitationId')
  @UseGuards(AuthGuard)
  async cancelInvitation(
    @Param('id') teamId: string,
    @Param('invitationId') invitationId: string,
    @User('id') userId: string,
  ) {
    await this.teamsService.cancelInvitation(teamId, invitationId, userId);
    return { message: 'Invitation cancelled' };
  }

  /**
   * Update a member's role
   */
  @Patch(':id/members/:memberId/role')
  @UseGuards(AuthGuard)
  async updateMemberRole(
    @Param('id') teamId: string,
    @Param('memberId') memberId: string,
    @User('id') userId: string,
    @Body(new ZodValidationPipe(UpdateMemberRoleSchema))
    body: { role: 'admin' | 'member' },
  ) {
    const teamRole = body.role === 'admin' ? TeamRole.ADMIN : TeamRole.MEMBER;
    return this.teamsService.updateMemberRole(teamId, memberId, userId, teamRole);
  }

  /**
   * Remove a member from the team
   */
  @Delete(':id/members/:memberId')
  @UseGuards(AuthGuard)
  async removeMember(
    @Param('id') teamId: string,
    @Param('memberId') memberId: string,
    @User('id') userId: string,
  ) {
    await this.teamsService.removeMember(teamId, memberId, userId);
    return { message: 'Member removed' };
  }

  /**
   * Leave the team (current user removes themselves)
   */
  @Post(':id/leave')
  @UseGuards(AuthGuard)
  async leaveTeam(@Param('id') teamId: string, @User('id') userId: string) {
    await this.teamsService.removeMember(teamId, userId, userId);
    return { message: 'Left team successfully' };
  }

  /**
   * Transfer ownership to another member
   */
  @Post(':id/transfer-ownership/:newOwnerId')
  @UseGuards(AuthGuard)
  async transferOwnership(
    @Param('id') teamId: string,
    @Param('newOwnerId') newOwnerId: string,
    @User('id') userId: string,
  ) {
    return this.teamsService.transferOwnership(teamId, userId, newOwnerId);
  }

  /**
   * Delete the team (owner only)
   */
  @Delete(':id')
  @UseGuards(AuthGuard)
  async deleteTeam(@Param('id') teamId: string, @User('id') userId: string) {
    await this.teamsService.deleteTeam(teamId, userId);
    return { message: 'Team deleted' };
  }
}
