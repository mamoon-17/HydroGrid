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
    @Body(new ZodValidationPipe(CreateReportSchema)) body: CreateReportDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    // files is optional; if not present, use empty array
    const filePaths = (files ?? []).map(
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
  @Roles(RoleType.ADMIN, RoleType.USER)
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
  async updateReport(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Body(new ZodValidationPipe(UpdateReportSchema))
    body: UpdateReportDto & { mediaToRemove?: string[] },
    @Req() req,
  ) {
    try {
      const filePaths = (files ?? []).map(
        (f) => `https://dummy-s3.com/uploads/${f.filename}`,
      );
      const userRole = req.user?.role;
      return await this.reportsService.updateReport(
        id,
        body,
        filePaths,
        body.mediaToRemove || [],
        userRole,
      );
    } catch (err) {
      console.error('Update report error:', err);
      throw new InternalServerErrorException(
        err.message || JSON.stringify(err)
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
    @Query('offset') offset?: string
  ) {
    return this.reportsService.getReportsByPlantId(
      plantId,
      limit ? parseInt(limit) : undefined,
      offset ? parseInt(offset) : undefined
    );
  }

  @Get('user/:userId')
  @UseGuards(AuthGuard)
  getReportsByUser(@Param('userId') userId: string) {
    return this.reportsService.getReportsByUserId(userId);
  }
}
