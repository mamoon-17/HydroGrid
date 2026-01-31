import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { RoleType } from 'src/users/users.entity';
import { PlantsService } from './plants.service';
import {
  CreatePlantDto,
  CreatePlantSchema,
  UpdatePlantDto,
  UpdatePlantSchema,
} from './dtos/create-plant.dto';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';

@Controller('plants')
export class PlantsController {
  constructor(private readonly plantsService: PlantsService) {}
  @Get()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  getAllPlants(
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
      return this.plantsService.getAllPlantsPaginated({
        limit: parsedLimit ?? 10,
        offset: parsedOffset ?? 0,
        select: selectFields,
      });
    }

    return this.plantsService.getAllPlants();
  }

  @Get('assigned')
  @UseGuards(AuthGuard)
  getAssignedPlants(@Request() req: any) {
    return this.plantsService.getAssignedPlants(req.user.id);
  }

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  createPlant(
    @Body(new ZodValidationPipe(CreatePlantSchema)) body: CreatePlantDto,
  ) {
    return this.plantsService.createPlant(body);
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  getPlantById(@Param('id') id: string) {
    return this.plantsService.getPlantsByIds([id]);
  }

  @Get('by-ids')
  @UseGuards(AuthGuard)
  getPlantsByQuery(@Query('ids') ids: string) {
    const idArray = ids.split(',').map((id) => id.trim());
    return this.plantsService.getPlantsByIds(idArray);
  }

  @Get(':id/employee')
  @UseGuards(AuthGuard)
  getPlantEmployees(@Param('id') id: string) {
    return this.plantsService.getPlantEmployee(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  updatePlant(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdatePlantSchema)) updates: UpdatePlantDto,
  ) {
    return this.plantsService.updatePlant(id, updates);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  deletePlant(@Param('id') id: string) {
    return this.plantsService.deletePlant(id);
  }
}
