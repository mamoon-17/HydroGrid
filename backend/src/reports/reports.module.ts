// reports.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { Report } from './reports.entity';
import { ReportMedia } from 'src/report_media/report_media.entity';
import { Team } from 'src/teams/teams.entity';
import { UsersModule } from 'src/users/users.module';
import { PlantsModule } from 'src/plants/plants.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Report, ReportMedia, Team]),
    forwardRef(() => UsersModule),
    forwardRef(() => PlantsModule),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
