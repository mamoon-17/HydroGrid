import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
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

  onModuleInit() {
    const enabled = (process.env.KEEPALIVE_ENABLED ?? 'true').toLowerCase() !== 'false';
    if (!enabled) return;

    const intervalSeconds = Number(process.env.KEEPALIVE_INTERVAL_SECONDS) || 300;
    const port = process.env.PORT || 3000;
    const selfUrl = process.env.KEEPALIVE_SELF_URL || `http://localhost:${port}/health`;

    const pingOnce = async () => {
      const status = await simpleGet(selfUrl);
      this.logger.log(
        `[keepalive] ${new Date().toISOString()} url=${selfUrl} status=${status}`,
      );
    };

    pingOnce();
    intervalId = setInterval(pingOnce, intervalSeconds * 1000);
    this.logger.log(
      `Keepalive enabled. interval=${intervalSeconds}s url=${selfUrl}`,
    );
  }

  onModuleDestroy() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }
}

