import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  NotFoundException,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { RoleType } from 'src/users/users.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { Express } from 'express';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import {
  CreateReportDto,
  CreateReportSchema,
  UpdateReportDto,
  UpdateReportSchema,
} from './dtos/reports.dto';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  getAllReports() {
    return this.reportsService.getAllReports();
  }

  @Post()
  @UseGuards(AuthGuard)
  createReport(
    @Body(new ZodValidationPipe(CreateReportSchema)) body: CreateReportDto,
  ) {
    return this.reportsService.createReport(body);
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  getReportById(@Param('id') id: string) {
    return this.reportsService.getReportById(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  updateReport(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateReportSchema)) body: UpdateReportDto,
  ) {
    return this.reportsService.updateReport(id, body);
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
  getReportsByPlant(@Param('plantId') plantId: string) {
    return this.reportsService.getReportsByPlantId(plantId);
  }

  @Get('user/:userId')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  getReportsByUser(@Param('userId') userId: string) {
    return this.reportsService.getReportsByUserId(userId);
  }

  // === MEDIA ROUTES ===

  @Post(':id/media')
  @UseGuards(AuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads', // Placeholder: replace with S3 later
        filename: (_req, file, callback) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          callback(null, unique + extname(file.originalname));
        },
      }),
    }),
  )
  async uploadMediaToReport(
    @Param('id') reportId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new NotFoundException('No file uploaded');
    }

    const saved = await this.reportsService.saveMedia(reportId, file.path);
    return { message: 'Media uploaded successfully', data: saved };
  }

  @Get(':id/media')
  @UseGuards(AuthGuard)
  async getReportMedia(@Param('id') reportId: string) {
    return this.reportsService.getMediaByReportId(reportId);
  }

  @Delete('media/:mediaId')
  @UseGuards(AuthGuard)
  async deleteReportMedia(@Param('mediaId') mediaId: string) {
    return this.reportsService.deleteMedia(mediaId);
  }
}
