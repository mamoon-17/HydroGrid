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
      relations: ['users'],
    });
  }

  async getAssignedPlants(userId: string): Promise<Plants[]> {
    return this.plantsRepo.find({
      relations: ['users'],
      where: {
        users: {
          id: userId,
        },
      },
    });
  }

  async createPlant(payload: CreatePlantDto): Promise<Plants> {
    const { address, lat, lng, tehsil, type, capacity, userIds } = payload;

    const users = userIds?.length
      ? await this.usersService.getUsersOrThrow(userIds)
      : [];

    const plant = this.plantsRepo.create({
      address,
      lat,
      lng,
      tehsil: tehsil.trim().toLowerCase(),
      type,
      capacity,
      users,
    });

    return this.plantsRepo.save(plant);
  }

  async getPlantsByIds(ids: string[]): Promise<Plants[]> {
    if (!ids.length) return [];
    return this.plantsRepo.find({
      where: { id: In(ids) },
      relations: ['users'],
    });
  }

  async getPlantEmployees(id: string): Promise<Users[]> {
    const plant = await this.plantsRepo.findOne({
      where: { id },
      relations: ['users'],
    });

    if (!plant) {
      throw new NotFoundException('Plant not found');
    }

    return plant.users;
  }

  async updatePlant(
    id: string,
    updates: UpdatePlantDto,
  ): Promise<Plants | { message: string }> {
    const existing = await this.plantsRepo.findOne({
      where: { id },
      relations: ['users'],
    });

    if (!existing) {
      throw new NotFoundException('Plant not found');
    }

    const { userIds, tehsil, ...rest } = updates;

    // Normalize tehsil
    if (tehsil) {
      existing.tehsil = tehsil.trim().toLowerCase();
    }

    if (userIds?.length) {
      const users = await this.usersService.getUsersOrThrow(userIds);

      const existingUserIds = new Set(existing.users.map((u) => u.id));
      const newUsers = users.filter((user) => !existingUserIds.has(user.id));

      const originalLength = existing.users.length;
      existing.users.push(...newUsers);

      if (existing.users.length === originalLength) {
        return { message: 'No new users were assigned (already assigned)' };
      }
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

  async unassignUsers(
    plantId: string,
    userIds: string[],
  ): Promise<{ message: string }> {
    if (!userIds?.length) {
      throw new BadRequestException('userIds array is required');
    }

    const plant = await this.plantsRepo.findOne({
      where: { id: plantId },
      relations: ['users'],
    });

    if (!plant) {
      throw new NotFoundException('Plant not found');
    }

    // Filter out the users to be unassigned
    plant.users = plant.users = plant.users.filter(
      (user) => user.id && !userIds.includes(user.id),
    );

    await this.plantsRepo.save(plant);

    return { message: 'Users unassigned from plant successfully' };
  }

  async getPlantsOrThrow(ids: string[]): Promise<Plants[]> {
    if (!ids.length) return [];

    const plants = await this.plantsRepo.find({ where: { id: In(ids) } });

    if (plants.length !== ids.length) {
      throw new NotFoundException('One or more plants not found');
    }

    return plants;
  }
}
