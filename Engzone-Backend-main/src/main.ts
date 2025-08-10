import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: 'https://main.d388pv08axqfog.amplifyapp.com/login', // frontend dev server
    credentials: true, // allow cookies (for auth/session)
  });

  app.use(cookieParser());
  await app.listen(process.env.PORT || 3000);
  console.log(`Server listening on port ${process.env.PORT || 3000}`);
}
bootstrap();
