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
  getAllPlants() {
    return this.plantsService.getAllPlants();
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

  @Get(':id/employees')
  @UseGuards(AuthGuard)
  getPlantEmployees(@Param('id') id: string) {
    return this.plantsService.getPlantEmployees(id);
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

  @Patch(':id/unassign-users')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  unassignUsersFromPlant(
    @Param('id') plantId: string,
    @Body('userIds') userIds: string[],
  ) {
    return this.plantsService.unassignUsers(plantId, userIds);
  }
}
