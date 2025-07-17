import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GlobalConfigService {
  constructor(private config: ConfigService) {}

  get jwtSecret(): string {
    return this.config.getOrThrow<string>('JWT_SECRET');
  }

  get refreshTokenSecret(): string {
    return this.config.getOrThrow<string>('JWT_REFRESH_SECRET');
  }

  get dbConfig() {
    return {
      host: this.config.getOrThrow<string>('DATABASE_HOST'),
      port: this.config.getOrThrow<number>('DATABASE_PORT'),
      username: this.config.getOrThrow<string>('DATABASE_USERNAME'),
      password: this.config.getOrThrow<string>('DATABASE_PASSWORD'),
      database: this.config.getOrThrow<string>('DATABASE_NAME'),
    };
  }
}
