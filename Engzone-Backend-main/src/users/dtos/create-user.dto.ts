import { z } from 'zod';

export const CreateUserSchema = z.object({
  username: z.string().min(6),
  password: z.string().min(6),
  role: z.enum(['admin', 'user']),
  email: z.email().optional(),
  name: z.string(),
  phone: z.string(),
  country: z.string().length(2).toUpperCase(),
  plants: z
    .union([z.uuid(), z.array(z.uuid())])
    .optional()
    .transform((val) => (typeof val === 'string' ? [val] : val)),
});

export type CreateUserDto = z.infer<typeof CreateUserSchema>;
