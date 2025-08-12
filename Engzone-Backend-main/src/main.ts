import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import * as dotenv from 'dotenv';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const isProd = process.env.NODE_ENV === 'production';

  const allowedDevOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:8080',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
  ];

  // Optional comma-separated list of extra allowed origins via env
  const extraAllowedOriginsEnv = process.env.CORS_EXTRA_ORIGINS || '';
  const extraAllowedOrigins = extraAllowedOriginsEnv
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const originValidator = (
    origin: string,
    callback: (err: Error | null, allow?: boolean) => void,
  ) => {
    if (!origin) {
      return callback(null, true);
    }

    if (!isProd && allowedDevOrigins.includes(origin)) {
      return callback(null, true);
    }

    if (extraAllowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Allow https://engzone.site, https://www.engzone.site, and any https subdomain of engzone.site
    const engzoneRegex = /^https:\/\/(?:[a-z0-9-]+\.)*engzone\.site$/i;
    // Allow Amplify preview/prod app domains like https://*.amplifyapp.com
    const amplifyRegex = /^https:\/\/(?:[a-z0-9-]+\.)*amplifyapp\.com$/i;

    if (engzoneRegex.test(origin) || amplifyRegex.test(origin)) {
      return callback(null, true);
    }

    return callback(new Error('CORS: Origin not allowed'));
  };

  app.enableCors({
    origin: originValidator,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.use(cookieParser());
  await app.listen(process.env.PORT || 3000);
  console.log(`Server listening on port ${process.env.PORT || 3000}`);
}
bootstrap();
