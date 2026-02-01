import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TeamRole } from '../users/users.entity';
import { TEAM_ROLES_KEY } from './team-roles.decorator';

@Injectable()
export class TeamRolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<TeamRole[]>(
      TEAM_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    if (!user.teamId) {
      throw new ForbiddenException('You must be a member of a team to perform this action');
    }

    if (!user.teamRole) {
      throw new ForbiddenException('You do not have a role in this team');
    }

    const hasRole = requiredRoles.includes(user.teamRole);

    if (!hasRole) {
      throw new ForbiddenException(
        `This action requires one of the following team roles: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
