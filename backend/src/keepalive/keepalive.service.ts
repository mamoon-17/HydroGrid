import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import http from 'http';
import https from 'https';

let intervalId: NodeJS.Timeout | null = null;

function simpleGet(url: string, timeout = 10_000): Promise<number> {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(url);
      const lib = parsed.protocol === 'https:' ? https : http;
      const req = lib.get(parsed, (res) => {
        res.on('data', () => {});
        res.on('end', () => resolve(res.statusCode ?? 0));
      });

      req.on('error', () => resolve(0));
      req.setTimeout(timeout, () => {
        req.destroy();
        resolve(0);
      });
    } catch {
      resolve(0);
    }
  });
}

/**
 * Render cold-start prevention.
 *
 * When enabled, this service pings the app's own `/health` endpoint on an interval.
 * This creates lightweight inbound traffic so the web service doesn't go idle.
 *
 * NOTE: Render can also do this externally (recommended), but self-polling is
 * sometimes used as an additional safety net.
 */
@Injectable()
export class KeepaliveService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KeepaliveService.name);
  private pingCount = 0;

  onModuleInit() {
    const enabled =
      (process.env.KEEPALIVE_ENABLED ?? 'true').toLowerCase() !== 'false';
    if (!enabled) {
      this.logger.log('Keepalive is disabled');
      return;
    }

    const intervalSeconds =
      Number(process.env.KEEPALIVE_INTERVAL_SECONDS) || 300;
    const port = process.env.PORT || 3000;
    const selfUrl =
      process.env.KEEPALIVE_SELF_URL || `http://localhost:${port}/health`;

    const pingOnce = async () => {
      try {
        const startTime = Date.now();
        const status = await simpleGet(selfUrl);
        const duration = Date.now() - startTime;
        this.pingCount++;

        if (status === 200) {
          this.logger.debug(
            `[ping #${this.pingCount}] ${new Date().toISOString()} url=${selfUrl} status=${status} time=${duration}ms`,
          );
        } else {
          this.logger.warn(
            `[ping #${this.pingCount}] ${new Date().toISOString()} url=${selfUrl} status=${status} time=${duration}ms`,
          );
        }
      } catch (error) {
        this.logger.error(
          `Ping failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    };

    // Run immediately on startup
    pingOnce();

    // Then run on interval
    intervalId = setInterval(pingOnce, intervalSeconds * 1000);
    this.logger.log(
      `✓ Keepalive started. interval=${intervalSeconds}s url=${selfUrl}`,
    );
  }

  onModuleDestroy() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
      this.logger.log(`Keepalive stopped after ${this.pingCount} pings`);
    }
  }
}
