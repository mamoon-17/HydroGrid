import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchedulerRegistry } from '@nestjs/schedule';
import { HealthController } from './health.controller';
import { KeepaliveService } from './keepalive.service';
import { DbKeepaliveProbe } from './db-keepalive-probe.entity';
import { DbKeepAwakeService } from './db-keepawake.service';

@Module({
  imports: [TypeOrmModule.forFeature([DbKeepaliveProbe])],
  controllers: [HealthController],
  providers: [SchedulerRegistry, KeepaliveService, DbKeepAwakeService],
})
export class KeepaliveModule {}

