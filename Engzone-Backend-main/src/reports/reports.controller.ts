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
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { RoleType } from 'src/users/users.entity';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
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
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: diskStorage({
        destination: './uploads',
        filename: (_req, file, cb) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, uniqueSuffix + extname(file.originalname));
        },
      }),
    }),
  )
  createReport(
    @UploadedFiles() files: Express.Multer.File[],
    @Body(new ZodValidationPipe(CreateReportSchema)) body: CreateReportDto,
  ) {
    const filePaths = files.map(
      (f) => `https://dummy-s3.com/uploads/${f.filename}`,
    );
    return this.reportsService.createReport(body, filePaths);
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  getReportById(@Param('id') id: string) {
    return this.reportsService.getReportById(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      storage: diskStorage({
        destination: './uploads',
        filename: (_req, file, cb) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, uniqueSuffix + extname(file.originalname));
        },
      }),
    }),
  )
  updateReport(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Body(new ZodValidationPipe(UpdateReportSchema))
    body: UpdateReportDto & {
      mediaToRemove?: string[];
    },
  ) {
    const filePaths = files.map(
      (f) => `https://dummy-s3.com/uploads/${f.filename}`,
    );
    return this.reportsService.updateReport(
      id,
      body,
      filePaths,
      body.mediaToRemove || [],
    );
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
}
