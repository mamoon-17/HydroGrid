import { Request } from 'express';
import { RoleType } from '../users/users.entity';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: RoleType;
    [key: string]: any;
  };
}
