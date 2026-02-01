import { Request } from 'express';
import { RoleType, TeamRole } from '../users/users.entity';

export interface RequestWithCookies extends Request {
  cookies: {
    token?: string;
    refreshToken?: string;
  };
  user?: {
    id: string;
    role: RoleType;
    teamId: string | null;
    teamRole: TeamRole | null;
  };
}
