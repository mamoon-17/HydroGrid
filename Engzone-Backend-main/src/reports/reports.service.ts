import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report } from './reports.entity';
import { ReportMedia } from '../report_media/report_media.entity';
import { unlink } from 'fs/promises';
import { UsersService } from 'src/users/users.service';
import { PlantsService } from 'src/plants/plants.service';
import { CreateReportDto, UpdateReportDto } from './dtos/reports.dto';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report) private readonly reportsRepo: Repository<Report>,
    @InjectRepository(ReportMedia)
    private readonly mediaRepo: Repository<ReportMedia>,
    private readonly usersService: UsersService,
    private readonly plantsService: PlantsService,
  ) {}

  async getAllReports(): Promise<Report[]> {
    return this.reportsRepo.find({
      relations: ['plant', 'submitted_by', 'media'],
    });
  }

  async getReportById(id: string): Promise<Report> {
    const report = await this.reportsRepo.findOne({
      where: { id },
      relations: ['plant', 'submitted_by', 'media'],
    });

    if (!report) throw new NotFoundException('Report not found');
    return report;
  }

  async createReport(
    payload: CreateReportDto,
    filePaths: string[] = [],
  ): Promise<Report> {
    const { plantId, userId, ...data } = payload;

    const [plant] = await this.plantsService.getPlantsOrThrow([plantId]);
    const [user] = await this.usersService.getUsersOrThrow([userId]);

    const report = this.reportsRepo.create({
      ...data,
      plant,
      submitted_by: user,
    });

    const savedReport = await this.reportsRepo.save(report);

    const media = filePaths.map((url) =>
      this.mediaRepo.create({ url, report: savedReport }),
    );
    await this.mediaRepo.save(media);

    return this.getReportById(savedReport.id);
  }

  async updateReport(
    id: string,
    updates: UpdateReportDto,
    filePaths: string[] = [],
    mediaToRemove: string[] = [],
    userRole?: string,
  ): Promise<Report> {
    const report = await this.reportsRepo.findOne({ where: { id } });
    if (!report) throw new NotFoundException('Report not found');

    // Only enforce edit limit for non-admins
    if (userRole !== 'admin') {
      if ((report.edit_count ?? 0) >= 2) {
        throw new ForbiddenException('This report can only be edited twice.');
      }
      report.edit_count = (report.edit_count ?? 0) + 1;
    }

    Object.assign(report, updates);
    await this.reportsRepo.save(report);

    if (mediaToRemove?.length) {
      await Promise.all(mediaToRemove.map((id) => this.deleteMedia(id)));
    }

    if (filePaths.length) {
      const media = filePaths.map((url) =>
        this.mediaRepo.create({ url, report }),
      );
      await this.mediaRepo.save(media);
    }

    return this.getReportById(report.id);
  }

  async deleteReport(id: string): Promise<{ message: string }> {
    const result = await this.reportsRepo.delete({ id });
    if (result.affected === 0) {
      throw new NotFoundException('Report not found');
    }

    return { message: 'Report deleted successfully' };
  }

  async getReportsByPlantId(plantId: string): Promise<Report[]> {
    await this.plantsService.getPlantsOrThrow([plantId]);
    return this.reportsRepo.find({
      where: { plant: { id: plantId } },
      relations: ['plant', 'submitted_by', 'media'],
    });
  }

  async getReportsByUserId(userId: string): Promise<Report[]> {
    await this.usersService.getUsersOrThrow([userId]);
    return this.reportsRepo.find({
      where: { submitted_by: { id: userId } },
      relations: ['plant', 'submitted_by', 'media'],
    });
  }

  async deleteMedia(mediaId: string): Promise<{ message: string }> {
    const media = await this.mediaRepo.findOne({ where: { id: mediaId } });

    if (!media) throw new NotFoundException('Media not found');

    try {
      await unlink(media.url);
    } catch {
      // ignore file not found
    }

    await this.mediaRepo.delete({ id: mediaId });

    return { message: 'Media deleted successfully' };
  }

  async getMediaByReportId(reportId: string): Promise<ReportMedia[]> {
    return this.mediaRepo.find({
      where: { report: { id: reportId } },
      order: { created_at: 'DESC' },
    });
  }
}
