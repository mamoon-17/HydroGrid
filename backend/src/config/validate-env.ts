import { z } from 'zod';

export const envSchema = z
  .object({
    JWT_SECRET: z.string(),
    JWT_REFRESH_SECRET: z.string(),
    // Support either connection string or individual values
    DATABASE_URL: z.string().optional(),
    SUPABASE_CONNECTION: z.string().optional(),
    DATABASE_HOST: z.string().optional(),
    DATABASE_PORT: z.string().regex(/^\d+$/).optional(),
    DATABASE_USERNAME: z.string().optional(),
    DATABASE_PASSWORD: z.string().optional(),
    DATABASE_NAME: z.string().optional(),
    NODE_ENV: z.enum(['development', 'production', 'test']).optional(),
  })
  .refine(
    (data) =>
      data.DATABASE_URL ||
      data.SUPABASE_CONNECTION ||
      (data.DATABASE_HOST &&
        data.DATABASE_PORT &&
        data.DATABASE_USERNAME &&
        data.DATABASE_PASSWORD &&
        data.DATABASE_NAME),
    {
      message:
        'Either DATABASE_URL/SUPABASE_CONNECTION or all individual DATABASE_* variables must be provided',
    },
  );
