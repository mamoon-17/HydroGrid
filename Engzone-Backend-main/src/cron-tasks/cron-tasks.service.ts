import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RefreshToken } from 'src/refresh_tokens/refresh_tokens.entity';
import { Repository, LessThan } from 'typeorm';
import { SchedulerRegistry } from '@nestjs/schedule';
import { Logger } from '@nestjs/common';
import { CronJob } from 'cron';

@Injectable()
export class CronTasksService {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  onModuleInit() {
    // Read and trim the cron expression from env var
    const rawCronExpr = process.env.REFRESH_CLEANUP_CRON || '0 0 * * *';
    const cronExpr = rawCronExpr.trim();

    Logger.log(
      `Registering cron job with expression: '${cronExpr}'`,
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
