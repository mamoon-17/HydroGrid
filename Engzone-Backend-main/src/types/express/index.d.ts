import { RoleType } from '../../users/users.entity';

declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      id: string;
      role: RoleType;
      [key: string]: any;
    };
  }
}
