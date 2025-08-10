import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const allowedOrigins =
    process.env.NODE_ENV === 'production'
      ? ['https://engzone.site', 'https://www.engzone.site']
      : ['http://localhost:8080'];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true, // allow cookies (for auth/session)
  });

  app.use(cookieParser());
  await app.listen(process.env.PORT || 3000);
  console.log(`Server listening on port ${process.env.PORT || 3000}`);
}
bootstrap();
