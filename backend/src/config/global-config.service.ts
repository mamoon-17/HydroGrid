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
    // Support Supabase connection string or individual config values
    const connectionString =
      this.config.get<string>('DATABASE_URL') ||
      this.config.get<string>('SUPABASE_CONNECTION');

    if (connectionString) {
      // Parse connection string: postgresql://user:password@host:port/database
      const url = new URL(connectionString);
      return {
        host: url.hostname,
        port: parseInt(url.port) || 5432,
        username: url.username,
        password: url.password,
        database: url.pathname.slice(1), // Remove leading '/'
      };
    }

    return {
      host: this.config.getOrThrow<string>('DATABASE_HOST'),
      port: this.config.getOrThrow<number>('DATABASE_PORT'),
      username: this.config.getOrThrow<string>('DATABASE_USERNAME'),
      password: this.config.getOrThrow<string>('DATABASE_PASSWORD'),
      database: this.config.getOrThrow<string>('DATABASE_NAME'),
    };
  }
}
