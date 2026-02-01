import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestWithCookies } from '../request-with-cookies.interface';

export const User = createParamDecorator(
  (data: 'id' | 'role' | 'teamId' | 'teamRole' | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithCookies>();
    const user = request.user;

    if (!user) return null;

    return data ? user[data] : user;
  },
);
