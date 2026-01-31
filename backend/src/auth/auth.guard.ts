import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { RequestWithCookies } from '../common/request-with-cookies.interface';
import { UsersService } from 'src/users/users.service';
import { JwtPayloadSchema } from './schemas/jwt-payload.schema';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly userService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<RequestWithCookies>();
    const token = req.cookies?.token;

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const raw = jwt.verify(token, process.env.JWT_SECRET);

      if (
        typeof raw === 'object' &&
        raw !== null &&
        'role' in raw &&
        typeof raw.role === 'string'
      ) {
        raw.role = raw.role.toLowerCase();
      }

      const result = JwtPayloadSchema.safeParse(raw);

      if (!result.success) {
        throw new UnauthorizedException('Invalid token payload');
      }

      const user = await this.userService.getUserSelf(result.data.id);

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Include team information in the request user object
      req.user = {
        id: user.id!,
        role: user.role!,
        teamId: (user.team as any)?.id || null,
        teamRole: user.team_role || null,
      };

      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
