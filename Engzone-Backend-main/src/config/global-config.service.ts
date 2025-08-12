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

  get awsConfigForS3() {
    return {
      accessKey: this.config.getOrThrow<string>('AWS_S3_ACCESS_KEY'),
      secretKey: this.config.getOrThrow<string>('AWS_S3_SECRET_KEY'),
      s3Region: this.config.getOrThrow<string>('AWS_S3_REGION'),
      bucketName: this.config.getOrThrow<string>('AWS_S3_BUCKET_NAME'),
    };
  }
}
