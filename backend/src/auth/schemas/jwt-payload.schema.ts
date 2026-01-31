import { z } from 'zod';
import { RoleType } from 'src/users/users.entity';

export const JwtPayloadSchema = z.object({
  id: z.uuid(),
  role: z.enum(RoleType),
});

export type JwtPayload = z.infer<typeof JwtPayloadSchema>;
