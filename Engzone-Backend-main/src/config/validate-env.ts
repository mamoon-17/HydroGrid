import { z } from 'zod';

export const envSchema = z.object({
  JWT_SECRET: z.string(),
  JWT_REFRESH_SECRET: z.string(),
  DATABASE_HOST: z.string(),
  DATABASE_PORT: z.string().regex(/^\d+$/),
  DATABASE_USERNAME: z.string(),
  DATABASE_PASSWORD: z.string(),
  DATABASE_NAME: z.string(),
  NODE_ENV: z.enum(['development', 'production', 'test']).optional(),
});
