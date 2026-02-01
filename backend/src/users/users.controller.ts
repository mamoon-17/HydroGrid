import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
  Query,
  ForbiddenException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '../auth/auth.guard';
import { TeamRolesGuard } from 'src/auth/team-roles.guard';
import { TeamRoles } from 'src/auth/team-roles.decorator';
import { TeamRole } from './users.entity';
import { CreateUserDto, CreateUserSchema } from './dtos/create-user.dto';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import { UpdateUserDto, updateUserSchema } from './dtos/update-user.dto';
import {
  ChangePasswordDto,
  changePasswordSchema,
} from './dtos/change-password.dto';
import { User } from 'src/common/decorators/user.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Get all team members (team admin/owner only)
   */
  @Get()
  @UseGuards(AuthGuard, TeamRolesGuard)
  @TeamRoles(TeamRole.OWNER, TeamRole.ADMIN)
  async getAllUsers(
    @User('teamId') teamId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('select') select?: string,
  ) {
    if (!teamId) {
      throw new ForbiddenException('You must be a member of a team');
    }

    const parsedLimit = limit
      ? Math.min(parseInt(limit, 10) || 10, 100)
      : undefined;
    const parsedOffset = offset
      ? Math.max(parseInt(offset, 10) || 0, 0)
      : undefined;
    const selectFields = select
      ? select
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : undefined;

    if (
      parsedLimit !== undefined ||
      parsedOffset !== undefined ||
      selectFields
    ) {
      return this.usersService.getTeamMembersPaginated(teamId, {
        limit: parsedLimit ?? 10,
        offset: parsedOffset ?? 0,
        select: selectFields,
      });
    }

    return this.usersService.getTeamMembers(teamId);
  }

  /**
   * Create a new team member (admin invites them)
   */
  @Post()
  @UseGuards(AuthGuard, TeamRolesGuard)
  @TeamRoles(TeamRole.OWNER, TeamRole.ADMIN)
  async createUser(
    @User('teamId') teamId: string,
    @User('teamRole') creatorRole: TeamRole,
    @Body(new ZodValidationPipe(CreateUserSchema)) payload: CreateUserDto,
  ) {
    if (!teamId) {
      throw new ForbiddenException('You must be a member of a team');
    }
    return this.usersService.createTeamMember(teamId, payload, creatorRole);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  getUserSelf(@User('id') userId: string) {
    return this.usersService.getUserSelf(userId);
  }

  @Get(':id')
  @UseGuards(AuthGuard, TeamRolesGuard)
  @TeamRoles(TeamRole.OWNER, TeamRole.ADMIN)
  getUserById(@Param('id') id: string, @User('teamId') teamId: string) {
    if (!id) {
      throw new UnauthorizedException('User ID not found in request');
    }
    return this.usersService.getTeamMemberById(teamId, id);
  }

  // IMPORTANT: Place static route before dynamic ':id' to avoid route conflicts
  @Patch('change-password')
  @UseGuards(AuthGuard)
  async changePassword(
    @User('id') userId: string,
    @Body(new ZodValidationPipe(changePasswordSchema)) body: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(userId, body);
  }

  @Patch(':id')
  @UseGuards(AuthGuard, TeamRolesGuard)
  @TeamRoles(TeamRole.OWNER, TeamRole.ADMIN)
  async updateUserById(
    @Param('id') id: string,
    @User('teamId') teamId: string,
    @Body(new ZodValidationPipe(updateUserSchema)) updates: UpdateUserDto,
  ) {
    if (!teamId) {
      throw new ForbiddenException('You must be a member of a team');
    }
    return this.usersService.updateTeamMember(teamId, id, updates);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, TeamRolesGuard)
  @TeamRoles(TeamRole.OWNER, TeamRole.ADMIN)
  async deleteUserById(
    @Param('id') id: string,
    @User('teamId') teamId: string,
    @User('teamRole') deleterRole: TeamRole,
  ) {
    if (!teamId) {
      throw new ForbiddenException('You must be a member of a team');
    }
    return this.usersService.removeTeamMember(teamId, id, deleterRole);
  }
}
