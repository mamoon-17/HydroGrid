import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import * as dotenv from 'dotenv';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as fs from 'fs';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Ensure uploads directory exists
  const uploadsPath = join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
  }

  // Serve uploads folder as static files
  app.useStaticAssets(uploadsPath, {
    prefix: '/uploads/',
  });

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

    // Allow Vercel preview/prod app domains like https://*.vercel.app
    const vercelRegex = /^https:\/\/(?:[a-z0-9-]+\.)*vercel\.app$/i;
    // Allow Render app domains like https://*.onrender.com
    const renderRegex = /^https:\/\/(?:[a-z0-9-]+\.)*onrender\.com$/i;

    if (vercelRegex.test(origin) || renderRegex.test(origin)) {
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
