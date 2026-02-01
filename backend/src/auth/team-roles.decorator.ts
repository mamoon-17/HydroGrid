import { SetMetadata } from '@nestjs/common';
import { TeamRole } from '../users/users.entity';

export const TEAM_ROLES_KEY = 'teamRoles';
export const TeamRoles = (...roles: TeamRole[]) =>
  SetMetadata(TEAM_ROLES_KEY, roles);
