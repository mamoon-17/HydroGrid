import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Report } from './reports.entity';
import { ReportMedia } from '../report_media/report_media.entity';
import { unlink } from 'fs/promises';
import { UsersService } from 'src/users/users.service';
import { PlantsService } from 'src/plants/plants.service';
import { CreateReportDto, UpdateReportDto } from './dtos/reports.dto';
import { AwsService, IFile } from '../shared/aws.service';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report) private readonly reportsRepo: Repository<Report>,
    @InjectRepository(ReportMedia)
    private readonly mediaRepo: Repository<ReportMedia>,
    private readonly usersService: UsersService,
    private readonly plantsService: PlantsService,
    private readonly awsService: AwsService,
  ) {}

  async getAllReports(): Promise<Report[]> {
    return this.reportsRepo.find({
      relations: ['plant', 'submitted_by', 'media'],
    });
  }

  async getAllReportsPaginated(params: {
    limit: number;
    offset: number;
    select?: string[];
  }): Promise<{
    data: Report[];
    total: number;
    limit: number;
    offset: number;
  }> {
    const { limit, offset } = params;

    const qb = this.reportsRepo
      .createQueryBuilder('report')
      .leftJoinAndSelect('report.plant', 'plant')
      .leftJoinAndSelect('report.submitted_by', 'user')
      .leftJoinAndSelect('report.media', 'media')
      .orderBy('report.created_at', 'DESC')
      .take(limit)
      .skip(offset);

    const [rows, total] = await qb.getManyAndCount();

    return { data: rows, total, limit, offset };
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
    payload: any, // Temporarily accept any type to test file upload
    files: IFile[],
  ): Promise<Report> {
    console.log('Service received payload:', payload);
    console.log('Service received files:', files);
    console.log('Payload keys:', Object.keys(payload));
    console.log('Payload values:', Object.values(payload));

    const { plantId, userId, ...data } = payload;

    console.log('Extracted plantId:', plantId);
    console.log('Extracted userId:', userId);
    console.log('Extracted data:', data);

    const [plant] = await this.plantsService.getPlantsOrThrow([plantId]);
    const [user] = await this.usersService.getUsersOrThrow([userId]);

    const report = this.reportsRepo.create({
      ...data,
      plant,
      submitted_by: user,
    });

    const result = await this.reportsRepo.insert(report);
    const savedReport: Report = (await this.reportsRepo.findOne({
      where: { id: result.identifiers[0].id },
      relations: ['plant', 'submitted_by', 'media'],
    })) as Report;

    if (files && files.length > 0) {
      console.log('Processing files for upload...');
      const uploadedMedia = await Promise.all(
        files.map((f) => this.awsService.uploadImage(f)),
      );

      const media = uploadedMedia.map((url) =>
        this.mediaRepo.create({ url, report: savedReport }),
      );

      await this.mediaRepo.save(media);
      console.log('Files processed and saved successfully');
    } else {
      console.log('No files to process');
    }

    return this.getReportById(savedReport.id);
  }

  async updateReport(
    id: string,
    updates: UpdateReportDto,
    files: IFile[] = [],
    mediaToRemove: string[] = [],
    userRole?: string,
  ): Promise<Report> {
    const report = await this.reportsRepo.findOne({
      where: { id },
      relations: ['media'],
    });
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

    // Remove selected media from S3 and DB
    if (mediaToRemove?.length) {
      const toRemove = await this.mediaRepo.find({
        where: { id: In(mediaToRemove) },
      });
      await Promise.all(
        toRemove.map(async (m) => {
          const key = this.extractS3KeyFromUrl(m.url);
          await this.awsService.deleteImage(key).catch(() => undefined);
          await this.mediaRepo.delete({ id: m.id });
        }),
      );
    }

    // Upload new files to S3 and create media records
    if (files && files.length > 0) {
      const uploadedUrls = await Promise.all(
        files.map((f) => this.awsService.uploadImage(f)),
      );
      const media = uploadedUrls
        .filter((u) => !!u)
        .map((url) => this.mediaRepo.create({ url, report }));
      if (media.length) {
        await this.mediaRepo.save(media);
      }
    }

    return this.getReportById(report.id);
  }

  async deleteReport(id: string): Promise<{ message: string }> {
    const report = await this.reportsRepo.findOne({
      where: { id },
      relations: ['media'],
    });
    if (!report) throw new NotFoundException('Report not found');

    // Delete associated media from S3 first
    if (report.media?.length) {
      await Promise.all(
        report.media.map(async (m) => {
          const key = this.extractS3KeyFromUrl(m.url);
          await this.awsService.deleteImage(key).catch(() => undefined);
        }),
      );
    }

    await this.reportsRepo.delete({ id });
    return { message: 'Report deleted successfully' };
  }

  async getReportsByPlantId(
    plantId: string,
    limit?: number,
    offset?: number,
  ): Promise<Report[]> {
    await this.plantsService.getPlantsOrThrow([plantId]);
    return this.reportsRepo.find({
      where: { plant: { id: plantId } },
      relations: ['plant', 'submitted_by', 'media'],
      order: { created_at: 'DESC' },
      ...(limit !== undefined ? { take: limit } : {}),
      ...(offset !== undefined ? { skip: offset } : {}),
    });
  }

  async getReportsByUserId(userId: string): Promise<Report[]> {
    await this.usersService.getUsersOrThrow([userId]);
    return this.reportsRepo.find({
      where: { submitted_by: { id: userId } },
      relations: ['plant', 'submitted_by', 'media'],
    });
  }

  async getReportsByUserIdPaginated(
    userId: string,
    limit: number,
    offset: number,
  ): Promise<{
    data: Report[];
    total: number;
    limit: number;
    offset: number;
    stats: { thisMonth: number };
  }> {
    await this.usersService.getUsersOrThrow([userId]);
    const qb = this.reportsRepo
      .createQueryBuilder('report')
      .leftJoinAndSelect('report.plant', 'plant')
      .leftJoinAndSelect('report.submitted_by', 'user')
      .leftJoinAndSelect('report.media', 'media')
      .where('user.id = :userId', { userId })
      .orderBy('report.created_at', 'DESC')
      .take(limit)
      .skip(offset);

    const [rows, total] = await qb.getManyAndCount();

    // Compute this month's reports count for the user
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const startOfNextMonth = new Date(startOfMonth);
    startOfNextMonth.setMonth(startOfNextMonth.getMonth() + 1);

    const thisMonth = await this.reportsRepo
      .createQueryBuilder('report')
      .leftJoin('report.submitted_by', 'user')
      .where('user.id = :userId', { userId })
      .andWhere('report.created_at >= :start AND report.created_at < :end', {
        start: startOfMonth,
        end: startOfNextMonth,
      })
      .getCount();

    return { data: rows, total, limit, offset, stats: { thisMonth } };
  }

  async deleteMedia(mediaId: string): Promise<{ message: string }> {
    const media = await this.mediaRepo.findOne({ where: { id: mediaId } });

    if (!media) throw new NotFoundException('Media not found');

    // Delete from S3
    const key = this.extractS3KeyFromUrl(media.url);
    await this.awsService.deleteImage(key).catch(() => undefined);

    await this.mediaRepo.delete({ id: mediaId });

    return { message: 'Media deleted successfully' };
  }

  async getMediaByReportId(reportId: string): Promise<ReportMedia[]> {
    return this.mediaRepo.find({
      where: { report: { id: reportId } },
      order: { created_at: 'DESC' },
    });
  }

  private extractS3KeyFromUrl(possibleUrl: string): string {
    try {
      // If it's a full URL, parse and strip leading '/'
      if (
        possibleUrl.startsWith('http://') ||
        possibleUrl.startsWith('https://')
      ) {
        const u = new URL(possibleUrl);
        return u.pathname.startsWith('/') ? u.pathname.slice(1) : u.pathname;
      }
      // Otherwise assume it's already a key
      return possibleUrl;
    } catch {
      return possibleUrl;
    }
  }
}
