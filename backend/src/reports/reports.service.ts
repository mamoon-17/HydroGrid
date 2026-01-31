import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Report } from './reports.entity';
import { ReportMedia } from '../report_media/report_media.entity';
import { Team } from '../teams/teams.entity';
import { UsersService } from 'src/users/users.service';
import { PlantsService } from 'src/plants/plants.service';
import { CreateReportDto, UpdateReportDto } from './dtos/reports.dto';
import { UploadService, IFile } from '../shared/upload.service';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report) private readonly reportsRepo: Repository<Report>,
    @InjectRepository(ReportMedia)
    private readonly mediaRepo: Repository<ReportMedia>,
    @InjectRepository(Team) private readonly teamsRepo: Repository<Team>,
    private readonly usersService: UsersService,
    private readonly plantsService: PlantsService,
    private readonly uploadService: UploadService,
  ) {}

  /**
   * Get all reports for a specific team
   */
  async getAllReports(teamId: string): Promise<Report[]> {
    return this.reportsRepo.find({
      where: { team: { id: teamId } },
      relations: ['plant', 'submitted_by', 'media', 'team'],
    });
  }

  async getAllReportsPaginated(
    teamId: string,
    params: {
      limit: number;
      offset: number;
      select?: string[];
    },
  ): Promise<{
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
      .leftJoinAndSelect('report.team', 'team')
      .where('report.team_id = :teamId', { teamId })
      .orderBy('report.created_at', 'DESC')
      .take(limit)
      .skip(offset);

    const [rows, total] = await qb.getManyAndCount();

    return { data: rows, total, limit, offset };
  }

  async getReportById(id: string, teamId?: string): Promise<Report> {
    const whereCondition: any = { id };
    if (teamId) {
      whereCondition.team = { id: teamId };
    }

    const report = await this.reportsRepo.findOne({
      where: whereCondition,
      relations: ['plant', 'submitted_by', 'media', 'team'],
    });

    if (!report) throw new NotFoundException('Report not found');
    return report;
  }

  async createReport(
    teamId: string,
    payload: any,
    files: IFile[],
  ): Promise<Report> {
    console.log('Service received payload:', payload);
    console.log('Service received files:', files);

    const { plantId, userId, ...data } = payload;

    // Verify team exists
    const team = await this.teamsRepo.findOne({ where: { id: teamId } });
    if (!team) {
      throw new NotFoundException('Team not found');
    }

    // Verify plant belongs to the team
    const [plant] = await this.plantsService.getPlantsOrThrow([plantId], teamId);
    const [user] = await this.usersService.getUsersOrThrow([userId]);

    // Verify user belongs to the team
    if (user.team?.id !== teamId) {
      throw new ForbiddenException('User must be a member of the team');
    }

    const report = this.reportsRepo.create({
      ...data,
      plant,
      submitted_by: user,
      team,
    });

    const result = await this.reportsRepo.insert(report);
    const savedReport: Report = (await this.reportsRepo.findOne({
      where: { id: result.identifiers[0].id },
      relations: ['plant', 'submitted_by', 'media', 'team'],
    })) as Report;

    if (files && files.length > 0) {
      console.log('Processing files for upload...');
      const uploadedMedia = await Promise.all(
        files.map((f) => this.uploadService.uploadImage(f)),
      );

      const media = uploadedMedia.map((url) =>
        this.mediaRepo.create({ url, report: savedReport }),
      );

      await this.mediaRepo.save(media);
      console.log('Files processed and saved successfully');
    }

    return this.getReportById(savedReport.id, teamId);
  }

  async updateReport(
    id: string,
    teamId: string,
    updates: UpdateReportDto,
    files: IFile[] = [],
    mediaToRemove: string[] = [],
    userRole?: string,
  ): Promise<Report> {
    const report = await this.reportsRepo.findOne({
      where: { id, team: { id: teamId } },
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

    // Remove selected media from local storage and DB
    if (mediaToRemove?.length) {
      const toRemove = await this.mediaRepo.find({
        where: { id: In(mediaToRemove) },
      });
      await Promise.all(
        toRemove.map(async (m) => {
          await this.uploadService.deleteImage(m.url).catch(() => undefined);
          await this.mediaRepo.delete({ id: m.id });
        }),
      );
    }

    // Upload new files to local storage and create media records
    if (files && files.length > 0) {
      const uploadedUrls = await Promise.all(
        files.map((f) => this.uploadService.uploadImage(f)),
      );
      const media = uploadedUrls
        .filter((u) => !!u)
        .map((url) => this.mediaRepo.create({ url, report }));
      if (media.length) {
        await this.mediaRepo.save(media);
      }
    }

    return this.getReportById(report.id, teamId);
  }

  async deleteReport(id: string, teamId: string): Promise<{ message: string }> {
    const report = await this.reportsRepo.findOne({
      where: { id, team: { id: teamId } },
      relations: ['media'],
    });
    if (!report) throw new NotFoundException('Report not found');

    // Delete associated media from local storage first
    if (report.media?.length) {
      await Promise.all(
        report.media.map(async (m) => {
          await this.uploadService.deleteImage(m.url).catch(() => undefined);
        }),
      );
    }

    await this.reportsRepo.delete({ id });
    return { message: 'Report deleted successfully' };
  }

  async getReportsByPlantId(
    plantId: string,
    teamId: string,
    limit?: number,
    offset?: number,
  ): Promise<Report[]> {
    await this.plantsService.getPlantsOrThrow([plantId], teamId);
    return this.reportsRepo.find({
      where: { plant: { id: plantId }, team: { id: teamId } },
      relations: ['plant', 'submitted_by', 'media'],
      order: { created_at: 'DESC' },
      ...(limit !== undefined ? { take: limit } : {}),
      ...(offset !== undefined ? { skip: offset } : {}),
    });
  }

  async getReportsByUserId(userId: string, teamId?: string): Promise<Report[]> {
    await this.usersService.getUsersOrThrow([userId]);
    const whereCondition: any = { submitted_by: { id: userId } };
    if (teamId) {
      whereCondition.team = { id: teamId };
    }
    return this.reportsRepo.find({
      where: whereCondition,
      relations: ['plant', 'submitted_by', 'media'],
    });
  }

  async getReportsByUserIdPaginated(
    userId: string,
    teamId: string | null,
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
      .where('user.id = :userId', { userId });

    if (teamId) {
      qb.andWhere('report.team_id = :teamId', { teamId });
    }

    qb.orderBy('report.created_at', 'DESC')
      .take(limit)
      .skip(offset);

    const [rows, total] = await qb.getManyAndCount();

    // Compute this month's reports count for the user
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const startOfNextMonth = new Date(startOfMonth);
    startOfNextMonth.setMonth(startOfNextMonth.getMonth() + 1);

    const thisMonthQb = this.reportsRepo
      .createQueryBuilder('report')
      .leftJoin('report.submitted_by', 'user')
      .where('user.id = :userId', { userId })
      .andWhere('report.created_at >= :start AND report.created_at < :end', {
        start: startOfMonth,
        end: startOfNextMonth,
      });

    if (teamId) {
      thisMonthQb.andWhere('report.team_id = :teamId', { teamId });
    }

    const thisMonth = await thisMonthQb.getCount();

    return { data: rows, total, limit, offset, stats: { thisMonth } };
  }

  async deleteMedia(mediaId: string): Promise<{ message: string }> {
    const media = await this.mediaRepo.findOne({ where: { id: mediaId } });

    if (!media) throw new NotFoundException('Media not found');

    // Delete from local storage
    await this.uploadService.deleteImage(media.url).catch(() => undefined);

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
