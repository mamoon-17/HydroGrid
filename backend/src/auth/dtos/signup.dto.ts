import { z } from 'zod';

export const SignupSchema = z.object({
  username: z.string().min(6, 'Username must be at least 6 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(5, 'Phone number is required'),
  country: z.string().length(2, 'Country code must be 2 letters').toUpperCase(),
});

export type SignupDto = z.infer<typeof SignupSchema>;
