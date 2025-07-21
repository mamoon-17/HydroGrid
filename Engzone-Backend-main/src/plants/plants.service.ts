import {
  Injectable,
  BadRequestException,
  NotFoundException,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Plants } from './plants.entity';
import { Users } from '../users/users.entity';
import { UsersService } from 'src/users/users.service';
import { CreatePlantDto, UpdatePlantDto } from './dtos/create-plant.dto';

@Injectable()
export class PlantsService {
  constructor(
    @InjectRepository(Plants) private plantsRepo: Repository<Plants>,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
  ) {}

  async getAllPlants(): Promise<Plants[]> {
    return this.plantsRepo.find({
      relations: ['user'],
    });
  }

  async getAssignedPlants(userId: string): Promise<Plants[]> {
    return this.plantsRepo.find({
      relations: ['user'],
      where: {
        user: {
          id: userId,
        },
      },
    });
  }

  async createPlant(payload: CreatePlantDto): Promise<Plants> {
    const { address, lat, lng, tehsil, type, capacity, userId } = payload;

    let user: Users | undefined = undefined;
    if (userId) {
      const [foundUser] = await this.usersService.getUsersOrThrow([userId]);
      user = foundUser;
    }

    const plant = this.plantsRepo.create({
      address,
      lat,
      lng,
      tehsil: tehsil.trim().toLowerCase(),
      type,
      capacity,
      user,
    });

    return this.plantsRepo.save(plant);
  }

  async getPlantsByIds(ids: string[]): Promise<Plants[]> {
    if (!ids.length) return [];
    return this.plantsRepo.find({
      where: { id: In(ids) },
      relations: ['user'],
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

  async updatePlant(id: string, updates: UpdatePlantDto): Promise<Plants> {
    const existing = await this.plantsRepo.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!existing) {
      throw new NotFoundException('Plant not found');
    }

    const { userId, tehsil, ...rest } = updates;

    if (userId === null) {
      // Unassign user
      existing.user = null;
    } else if (userId) {
      // Assign new user
      const [user] = await this.usersService.getUsersOrThrow([userId]);
      existing.user = user;
    }

    if (tehsil) {
      existing.tehsil = tehsil.trim().toLowerCase();
    }

    Object.assign(existing, rest);
    return this.plantsRepo.save(existing);
  }

  async deletePlant(id: string): Promise<{ message: string }> {
    const result = await this.plantsRepo.delete({ id });
    if (result.affected === 0) {
      throw new NotFoundException('Plant not found');
    }

    return { message: 'Plant deleted successfully' };
  }

  async getPlantsOrThrow(ids: string[]): Promise<Plants[]> {
    if (!ids.length) return [];

    const plants = await this.plantsRepo.find({
      where: { id: In(ids) },
    });

    if (plants.length !== ids.length) {
      throw new NotFoundException('One or more plants not found');
    }

    return plants;
  }
}
