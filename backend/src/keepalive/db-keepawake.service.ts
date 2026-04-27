import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { Repository } from 'typeorm';
import { DbKeepaliveProbe } from './db-keepalive-probe.entity';

/**
 * DB sleep prevention.
 *
 * Some managed Postgres services scale-to-zero / sleep when idle.
 * This job performs minimal write activity (insert + delete) on a dedicated
 * table so the purpose is explicit and safe.
 */
@Injectable()
export class DbKeepAwakeService implements OnModuleInit {
  private readonly logger = new Logger(DbKeepAwakeService.name);
  private jobStarted = false;

  constructor(
    @InjectRepository(DbKeepaliveProbe)
    private readonly probeRepo: Repository<DbKeepaliveProbe>,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  onModuleInit() {
    const enabled =
      (process.env.DB_KEEPALIVE_ENABLED ?? 'true').toLowerCase() !== 'false';
    if (!enabled) {
      this.logger.log('DB keep-awake is disabled');
      return;
    }

    // Default: every 10 minutes (prevents cold starts)
    // Override with DB_KEEPALIVE_CRON env var if needed
    let rawCronExpr = process.env.DB_KEEPALIVE_CRON || '*/10 * * * *';
    rawCronExpr = rawCronExpr.trim().replace(/^['"]|['"]$/g, '');

    this.logger.log(`Registering DB keep-awake cron: '${rawCronExpr}'`);

    const job = new CronJob(
      rawCronExpr,
      async () => {
        try {
          const created = await this.probeRepo.save({});
          await this.probeRepo.delete({ id: created.id });

          this.logger.log(
            `[${new Date().toISOString()}] DB keep-awake probe touched (insert+delete). id=${created.id}`,
          );
        } catch (error) {
          this.logger.error(
            `DB keep-awake probe failed: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      },
      null,
      false,
      'UTC',
    );

    this.schedulerRegistry.addCronJob('db-keepawake', job);
    job.start();
    this.jobStarted = true;

    this.logger.log(
      `✓ DB keep-awake started successfully. cron: '${rawCronExpr}'`,
    );
  }
}
