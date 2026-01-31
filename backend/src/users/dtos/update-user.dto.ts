import { z } from 'zod';

export const updateUserSchema = z
  .object({
    name: z.string().min(1).optional(),
    role: z.enum(['admin', 'user']).optional(),
    password: z.string().min(6).optional(),
    email: z.email().optional(),
    phone: z.string().optional(),
    country: z.string().length(2).toUpperCase().optional(),
  })
  .refine(
    (data) => {
      if (data.phone && !data.country) return false;
      return true;
    },
    {
      message: 'Country code is required if phone is being updated',
      path: ['country'],
    },
  );

export type UpdateUserDto = z.infer<typeof updateUserSchema>;
