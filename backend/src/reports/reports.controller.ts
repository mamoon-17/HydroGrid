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
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { RoleType } from 'src/users/users.entity';
import {
  FileFieldsInterceptor,
  FilesInterceptor,
} from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import {
  CreateReportDto,
  CreateReportSchema,
  UpdateReportDto,
  UpdateReportSchema,
} from './dtos/reports.dto';
import { IFile } from 'src/shared/upload.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  getAllReports(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('select') select?: string,
  ) {
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
      return this.reportsService.getAllReportsPaginated({
        limit: parsedLimit ?? 10,
        offset: parsedOffset ?? 0,
        select: selectFields,
      });
    }

    return this.reportsService.getAllReports();
  }

  @Post()
  // @UseGuards(AuthGuard)
  @UseInterceptors(
    FileFieldsInterceptor([{ name: 'reportImages', maxCount: 4 }]),
  )
  createReport(
    @Req() req: any,
    @UploadedFiles() files: { reportImages: IFile[] },
  ) {
    console.log('=== FILE UPLOAD DEBUG ===');
    console.log('Raw request headers:', req.headers);
    console.log('Raw request body:', req.body);
    console.log('Raw request files:', files);
    console.log('Content-Type:', req.headers['content-type']);
    console.log('Files type:', typeof files);
    console.log('Files keys:', files ? Object.keys(files) : 'No files object');
    console.log('ReportImages array:', files?.reportImages);
    console.log('ReportImages length:', files?.reportImages?.length);
    console.log('=== END DEBUG ===');

    return this.reportsService.createReport(
      req.body,
      files?.reportImages || [],
    );
  }

  @Post('test-upload')
  @UseInterceptors(FilesInterceptor('testFiles', 1))
  testUpload(@UploadedFiles() files: IFile[]) {
    console.log('=== TEST UPLOAD DEBUG ===');
    console.log('Test files received:', files);
    console.log('Files length:', files?.length);
    console.log('=== END TEST DEBUG ===');
    return { message: 'Test upload successful', files: files || [] };
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  getReportById(@Param('id') id: string) {
    return this.reportsService.getReportById(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN, RoleType.USER)
  @UseInterceptors(FilesInterceptor('files', 10))
  async updateReport(
    @Param('id') id: string,
    @UploadedFiles() files: IFile[],
    @Body(new ZodValidationPipe(UpdateReportSchema))
    body: UpdateReportDto & { mediaToRemove?: string[] },
    @Req() req,
  ) {
    try {
      // Prefer raw req.body for mediaToRemove to avoid Zod stripping
      let mediaToRemove: string[] = [];
      const raw = req?.body?.mediaToRemove ?? req?.body?.['mediaToRemove[]'];
      if (Array.isArray(raw)) {
        mediaToRemove = raw as string[];
      } else if (typeof raw === 'string' && raw.length > 0) {
        mediaToRemove = [raw];
      }

      const userRole = req.user?.role;
      return await this.reportsService.updateReport(
        id,
        body,
        files || [],
        mediaToRemove,
        userRole,
      );
    } catch (err) {
      console.error('Update report error:', err);
      throw new InternalServerErrorException(
        err.message || JSON.stringify(err),
      );
    }
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  deleteReport(@Param('id') id: string) {
    return this.reportsService.deleteReport(id);
  }

  @Get('plant/:plantId')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  getReportsByPlant(
    @Param('plantId') plantId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.reportsService.getReportsByPlantId(
      plantId,
      limit ? parseInt(limit) : undefined,
      offset ? parseInt(offset) : undefined,
    );
  }

  @Get('user/:userId')
  @UseGuards(AuthGuard)
  getReportsByUser(
    @Param('userId') userId: string,
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
        parsedLimit ?? 10,
        parsedOffset ?? 0,
      );
    }

    return this.reportsService.getReportsByUserId(userId);
  }
}
