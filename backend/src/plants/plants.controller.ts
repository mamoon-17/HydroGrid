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
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { TeamRolesGuard } from 'src/auth/team-roles.guard';
import { TeamRoles } from 'src/auth/team-roles.decorator';
import { RoleType, TeamRole } from 'src/users/users.entity';
import { PlantsService } from './plants.service';
import {
  CreatePlantDto,
  CreatePlantSchema,
  UpdatePlantDto,
  UpdatePlantSchema,
} from './dtos/create-plant.dto';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import { User } from 'src/common/decorators/user.decorator';

@Controller('plants')
export class PlantsController {
  constructor(private readonly plantsService: PlantsService) {}

  @Get()
  @UseGuards(AuthGuard, TeamRolesGuard)
  @TeamRoles(TeamRole.OWNER, TeamRole.ADMIN)
  getAllPlants(
    @User('teamId') teamId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('select') select?: string,
  ) {
    if (!teamId) {
      throw new ForbiddenException('You must be a member of a team to access plants');
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
      return this.plantsService.getAllPlantsPaginated(teamId, {
        limit: parsedLimit ?? 10,
        offset: parsedOffset ?? 0,
        select: selectFields,
      });
    }

    return this.plantsService.getAllPlants(teamId);
  }

  @Get('assigned')
  @UseGuards(AuthGuard)
  getAssignedPlants(@User('id') userId: string) {
    return this.plantsService.getAssignedPlants(userId);
  }

  @Post()
  @UseGuards(AuthGuard, TeamRolesGuard)
  @TeamRoles(TeamRole.OWNER, TeamRole.ADMIN)
  createPlant(
    @User('teamId') teamId: string,
    @Body(new ZodValidationPipe(CreatePlantSchema)) body: CreatePlantDto,
  ) {
    if (!teamId) {
      throw new ForbiddenException('You must be a member of a team to create plants');
    }
    return this.plantsService.createPlant(teamId, body);
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  getPlantById(@Param('id') id: string, @User('teamId') teamId: string) {
    return this.plantsService.getPlantsByIds([id], teamId);
  }

  @Get('by-ids')
  @UseGuards(AuthGuard)
  getPlantsByQuery(@Query('ids') ids: string, @User('teamId') teamId: string) {
    const idArray = ids.split(',').map((id) => id.trim());
    return this.plantsService.getPlantsByIds(idArray, teamId);
  }

  @Get(':id/employee')
  @UseGuards(AuthGuard)
  getPlantEmployees(@Param('id') id: string) {
    return this.plantsService.getPlantEmployee(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard, TeamRolesGuard)
  @TeamRoles(TeamRole.OWNER, TeamRole.ADMIN)
  updatePlant(
    @Param('id') id: string,
    @User('teamId') teamId: string,
    @Body(new ZodValidationPipe(UpdatePlantSchema)) updates: UpdatePlantDto,
  ) {
    if (!teamId) {
      throw new ForbiddenException('You must be a member of a team to update plants');
    }
    return this.plantsService.updatePlant(id, teamId, updates);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, TeamRolesGuard)
  @TeamRoles(TeamRole.OWNER, TeamRole.ADMIN)
  deletePlant(@Param('id') id: string, @User('teamId') teamId: string) {
    if (!teamId) {
      throw new ForbiddenException('You must be a member of a team to delete plants');
    }
    return this.plantsService.deletePlant(id, teamId);
  }
}
