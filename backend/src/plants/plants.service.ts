import {
  Injectable,
  BadRequestException,
  NotFoundException,
  forwardRef,
  Inject,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Plants } from './plants.entity';
import { Users } from '../users/users.entity';
import { Team } from '../teams/teams.entity';
import { UsersService } from 'src/users/users.service';
import { CreatePlantDto, UpdatePlantDto } from './dtos/create-plant.dto';

@Injectable()
export class PlantsService {
  constructor(
    @InjectRepository(Plants) private plantsRepo: Repository<Plants>,
    @InjectRepository(Team) private teamsRepo: Repository<Team>,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
  ) {}

  /**
   * Get all plants for a specific team
   */
  async getAllPlants(teamId: string): Promise<Plants[]> {
    return this.plantsRepo.find({
      where: { team: { id: teamId } },
      relations: ['user', 'team'],
    });
  }

  async getAllPlantsPaginated(
    teamId: string,
    params: {
      limit: number;
      offset: number;
      select?: string[];
    },
  ): Promise<{
    data: Plants[];
    total: number;
    limit: number;
    offset: number;
  }> {
    const { limit, offset } = params;

    const qb = this.plantsRepo
      .createQueryBuilder('plant')
      .leftJoinAndSelect('plant.user', 'user')
      .leftJoinAndSelect('plant.team', 'team')
      .where('plant.team_id = :teamId', { teamId })
      .orderBy('plant.created_at', 'DESC')
      .take(limit)
      .skip(offset);

    const [rows, total] = await qb.getManyAndCount();
    return { data: rows, total, limit, offset };
  }

  async getAssignedPlants(userId: string): Promise<Plants[]> {
    return this.plantsRepo.find({
      relations: ['user', 'team'],
      where: {
        user: {
          id: userId,
        },
      },
    });
  }

  async createPlant(teamId: string, payload: CreatePlantDto): Promise<Plants> {
    const { address, lat, lng, tehsil, type, capacity, userId } = payload;

    // Verify team exists
    const team = await this.teamsRepo.findOne({ where: { id: teamId } });
    if (!team) {
      throw new NotFoundException('Team not found');
    }

    let user: Users | undefined = undefined;
    if (userId) {
      const [foundUser] = await this.usersService.getUsersOrThrow([userId]);
      // Verify user belongs to the same team
      if (foundUser.team?.id !== teamId) {
        throw new ForbiddenException('User must be a member of the same team');
      }
      user = foundUser;
    }

    // Compute point from lat/lng
    let point: string | undefined = undefined;
    if (
      lat !== undefined &&
      lng !== undefined &&
      lat !== null &&
      lng !== null
    ) {
      point = `(${lng},${lat})`;
    }

    const plant = this.plantsRepo.create({
      address,
      lat,
      lng,
      tehsil: tehsil.trim().toLowerCase(),
      type,
      capacity,
      team,
      user,
      point,
    });

    return this.plantsRepo.save(plant);
  }

  async getPlantsByIds(ids: string[], teamId?: string): Promise<Plants[]> {
    if (!ids.length) return [];
    
    const whereCondition: any = { id: In(ids) };
    if (teamId) {
      whereCondition.team = { id: teamId };
    }
    
    return this.plantsRepo.find({
      where: whereCondition,
      relations: ['user', 'team'],
    });
  }

  async getPlantEmployee(id: string): Promise<Users | null> {
    const plant = await this.plantsRepo.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!plant) {
      throw new NotFoundException('Plant not found');
    }

    return plant.user ?? null;
  }

  async updatePlant(id: string, teamId: string, updates: UpdatePlantDto): Promise<Plants> {
    const existing = await this.plantsRepo.findOne({
      where: { id, team: { id: teamId } },
      relations: ['user', 'team'],
    });

    if (!existing) {
      throw new NotFoundException('Plant not found');
    }

    const { userId, tehsil, lat, lng, ...rest } = updates;

    if (userId === null) {
      // Unassign user
      existing.user = null;
    } else if (userId) {
      // Assign new user
      const [user] = await this.usersService.getUsersOrThrow([userId]);
      // Verify user belongs to the same team
      if (user.team?.id !== teamId) {
        throw new ForbiddenException('User must be a member of the same team');
      }
      existing.user = user;
    }

    if (tehsil) {
      existing.tehsil = tehsil.trim().toLowerCase();
    }

    // Update lat/lng if provided
    if (lat !== undefined) existing.lat = lat;
    if (lng !== undefined) existing.lng = lng;
    // Compute point from lat/lng
    if (
      existing.lat !== undefined &&
      existing.lng !== undefined &&
      existing.lat !== null &&
      existing.lng !== null
    ) {
      existing.point = `(${existing.lng},${existing.lat})`;
    } else {
      existing.point = undefined;
    }

    Object.assign(existing, rest);
    return this.plantsRepo.save(existing);
  }

  async deletePlant(id: string, teamId: string): Promise<{ message: string }> {
    const result = await this.plantsRepo.delete({ id, team: { id: teamId } });
    if (result.affected === 0) {
      throw new NotFoundException('Plant not found');
    }

    return { message: 'Plant deleted successfully' };
  }

  async getPlantsOrThrow(ids: string[], teamId?: string): Promise<Plants[]> {
    if (!ids.length) return [];

    const whereCondition: any = { id: In(ids) };
    if (teamId) {
      whereCondition.team = { id: teamId };
    }

    const plants = await this.plantsRepo.find({
      where: whereCondition,
    });

    if (plants.length !== ids.length) {
      throw new NotFoundException('One or more plants not found');
    }

    return plants;
  }

  /**
   * Verify that a plant belongs to a specific team
   */
  async verifyPlantTeamAccess(plantId: string, teamId: string): Promise<boolean> {
    const plant = await this.plantsRepo.findOne({
      where: { id: plantId, team: { id: teamId } },
    });
    return !!plant;
  }
}
