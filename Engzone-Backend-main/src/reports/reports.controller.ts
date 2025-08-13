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
import { IFile } from 'src/shared/aws.service';

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
  // @UseGuards(AuthGuard)
  @UseInterceptors(FilesInterceptor('files', 4))
  createReport(@Req() req: any, @UploadedFiles() files: IFile[]) {
    console.log('Raw request headers:', req.headers);
    console.log('Raw request body:', req.body);
    console.log('Raw request files:', files);
    console.log('Content-Type:', req.headers['content-type']);

    return this.reportsService.createReport(req.body, files || []);
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
  getReportsByUser(@Param('userId') userId: string) {
    return this.reportsService.getReportsByUserId(userId);
  }
}
