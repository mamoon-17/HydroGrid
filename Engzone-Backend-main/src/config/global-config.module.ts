import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { envSchema } from './validate-env';
import { z } from 'zod';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (env) => {
        const parsed = envSchema.safeParse(env);
        if (!parsed.success) {
          console.error('Invalid environment variables', parsed.error.format());
          process.exit(1);
        }

        return parsed.data as z.infer<typeof envSchema>;
      },
    }),
  ],
})
export class GlobalConfigModule {}
