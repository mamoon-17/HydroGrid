import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  Req,
  InternalServerErrorException,
  Query,
  ForbiddenException,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { TeamRolesGuard } from 'src/auth/team-roles.guard';
import { TeamRoles } from 'src/auth/team-roles.decorator';
import { TeamRole } from 'src/users/users.entity';
import {
  FileFieldsInterceptor,
  FilesInterceptor,
} from '@nestjs/platform-express';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import {
  CreateReportDto,
  CreateReportSchema,
  UpdateReportDto,
  UpdateReportSchema,
} from './dtos/reports.dto';
import { IFile } from 'src/shared/upload.service';
import { User } from 'src/common/decorators/user.decorator';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  @UseGuards(AuthGuard, TeamRolesGuard)
  @TeamRoles(TeamRole.OWNER, TeamRole.ADMIN)
  getAllReports(
    @User('teamId') teamId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('select') select?: string,
  ) {
    if (!teamId) {
      throw new ForbiddenException('You must be a member of a team');
    }

    const parsedLimit = limit
      ? Math.min(parseInt(limit, 10) || 10, 100)
      : undefined;
    const parsedOffset = offset
      ? Math.max(parseInt(offset, 10) || 0, 0)
      : undefined;
    const selectFields = select
      ? select
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : undefined;

    if (
      parsedLimit !== undefined ||
      parsedOffset !== undefined ||
      selectFields
    ) {
      return this.reportsService.getAllReportsPaginated(teamId, {
        limit: parsedLimit ?? 10,
        offset: parsedOffset ?? 0,
        select: selectFields,
      });
    }

    return this.reportsService.getAllReports(teamId);
  }

  @Post()
  @UseGuards(AuthGuard)
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'reportImages', maxCount: 4 }]),
  )
  createReport(
    @Req() req: any,
    @User('teamId') teamId: string,
    @UploadedFiles() files: { reportImages: IFile[] },
  ) {
    if (!teamId) {
      throw new ForbiddenException('You must be a member of a team to create reports');
    }

    console.log('=== FILE UPLOAD DEBUG ===');
    console.log('Team ID:', teamId);
    console.log('Raw request body:', req.body);
    console.log('Files:', files?.reportImages?.length);
    console.log('=== END DEBUG ===');

    return this.reportsService.createReport(
      teamId,
      req.body,
      files?.reportImages || [],
    );
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  getReportById(@Param('id') id: string, @User('teamId') teamId: string) {
    return this.reportsService.getReportById(id, teamId);
  }

  @Patch(':id')
  @UseGuards(AuthGuard)
  @UseInterceptors(FilesInterceptor('files', 10))
  async updateReport(
    @Param('id') id: string,
    @User('teamId') teamId: string,
    @UploadedFiles() files: IFile[],
    @Body(new ZodValidationPipe(UpdateReportSchema))
    body: UpdateReportDto & { mediaToRemove?: string[] },
    @Req() req,
  ) {
    if (!teamId) {
      throw new ForbiddenException('You must be a member of a team');
    }

    try {
      let mediaToRemove: string[] = [];
      const raw = req?.body?.mediaToRemove ?? req?.body?.['mediaToRemove[]'];
      if (Array.isArray(raw)) {
        mediaToRemove = raw as string[];
      } else if (typeof raw === 'string' && raw.length > 0) {
        mediaToRemove = [raw];
      }

      const userRole = req.user?.teamRole;
      return await this.reportsService.updateReport(
        id,
        teamId,
        body,
        files || [],
        mediaToRemove,
        userRole === TeamRole.OWNER || userRole === TeamRole.ADMIN ? 'admin' : 'user',
      );
    } catch (err) {
      console.error('Update report error:', err);
      throw new InternalServerErrorException(
        err.message || JSON.stringify(err),
      );
    }
  }

  @Delete(':id')
  @UseGuards(AuthGuard, TeamRolesGuard)
  @TeamRoles(TeamRole.OWNER, TeamRole.ADMIN)
  deleteReport(@Param('id') id: string, @User('teamId') teamId: string) {
    if (!teamId) {
      throw new ForbiddenException('You must be a member of a team');
    }
    return this.reportsService.deleteReport(id, teamId);
  }

  @Get('plant/:plantId')
  @UseGuards(AuthGuard, TeamRolesGuard)
  @TeamRoles(TeamRole.OWNER, TeamRole.ADMIN)
  getReportsByPlant(
    @Param('plantId') plantId: string,
    @User('teamId') teamId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    if (!teamId) {
      throw new ForbiddenException('You must be a member of a team');
    }
    return this.reportsService.getReportsByPlantId(
      plantId,
      teamId,
      limit ? parseInt(limit) : undefined,
      offset ? parseInt(offset) : undefined,
    );
  }

  @Get('user/:userId')
  @UseGuards(AuthGuard)
  getReportsByUser(
    @Param('userId') userId: string,
    @User('teamId') teamId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const parsedLimit = limit
      ? Math.min(parseInt(limit, 10) || 10, 100)
      : undefined;
    const parsedOffset = offset
      ? Math.max(parseInt(offset, 10) || 0, 0)
      : undefined;

    if (parsedLimit !== undefined || parsedOffset !== undefined) {
      return this.reportsService.getReportsByUserIdPaginated(
        userId,
        teamId,
        parsedLimit ?? 10,
        parsedOffset ?? 0,
      );
    }

    return this.reportsService.getReportsByUserId(userId, teamId);
  }
}
