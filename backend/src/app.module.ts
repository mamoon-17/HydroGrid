import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { PlantsModule } from './plants/plants.module';
import { ReportsModule } from './reports/reports.module';
import { ReportMediaModule } from './report_media/report_media.module';
import { RefreshTokensModule } from './refresh_tokens/refresh_tokens.module';
import { AuthModule } from './auth/auth.module';
import { TeamsModule } from './teams/teams.module';
import { ScheduleModule } from '@nestjs/schedule';
import { CronTasksService } from './cron-tasks/cron-tasks.service';
import { RefreshToken } from './refresh_tokens/refresh_tokens.entity';
import { GlobalConfigModule } from './config/global-config.module';
import { SharedModule } from './shared/shared.module';

@Module({
  imports: [
    GlobalConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        // Support Supabase connection string or individual config values
        const connectionString =
          configService.get<string>('DATABASE_URL') ||
          configService.get<string>('SUPABASE_CONNECTION');

        if (connectionString) {
          return {
            type: 'postgres',
            url: connectionString,
            entities: [__dirname + '/**/*.entity{.ts,.js}'],
            synchronize: true,
            autoLoadEntities: true,
            logging: false,
            ssl: {
              rejectUnauthorized: false, // Required for Supabase
            },
          };
        }

        return {
          type: 'postgres',
          host: configService.get<string>('DATABASE_HOST', { infer: true }),
          port: configService.get<number>('DATABASE_PORT', { infer: true }),
          username: configService.get<string>('DATABASE_USERNAME', {
            infer: true,
          }),
          password: configService.get<string>('DATABASE_PASSWORD', {
            infer: true,
          }),
          database: configService.get<string>('DATABASE_NAME', { infer: true }),
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: true,
          autoLoadEntities: true,
          logging: false,
        };
      },
      inject: [ConfigService],
    }),
    UsersModule,
    PlantsModule,
    ReportsModule,
    ReportMediaModule,
    RefreshTokensModule,
    AuthModule,
    TeamsModule,
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([RefreshToken]),
    SharedModule,
  ],
  providers: [CronTasksService],
})
export class AppModule {}
