import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RefreshToken } from 'src/refresh_tokens/refresh_tokens.entity';
import { Repository, LessThan } from 'typeorm';
import { CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import { Logger } from '@nestjs/common';
import { CronJob } from 'cron';

const CRON_EXPR =
  process.env.REFRESH_CLEANUP_CRON || CronExpression.EVERY_DAY_AT_MIDNIGHT;

@Injectable()
export class CronTasksService {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  onModuleInit() {
    const cronExpr = process.env.REFRESH_CLEANUP_CRON || '0 0 * * *';
    Logger.log(
      `Registering cron job with expression: ${cronExpr}`,
      'CronTasksService',
    );

    const job = new CronJob(cronExpr, async () => {
      const now = new Date();
      const deleted = await this.refreshTokenRepo.delete({
        expires_at: LessThan(now),
      });

      Logger.log(
        `Deleted ${deleted.affected} expired refresh token(s) at ${now.toISOString()}`,
        'CronTasksService',
      );
    });

    this.schedulerRegistry.addCronJob('refresh-cleanup', job);
    job.start();
  }
}
