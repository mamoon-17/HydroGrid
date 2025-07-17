import {
  Injectable,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Users, RoleType } from './users.entity';
import { Repository, In } from 'typeorm';
import * as bcrypt from 'bcrypt';
import parsePhoneNumberFromString, {
  CountryCode,
  isSupportedCountry,
} from 'libphonenumber-js';
import { RefreshToken } from 'src/refresh_tokens/refresh_tokens.entity';
import { PlantsService } from 'src/plants/plants.service';
import { ChangePasswordDto } from './dtos/change-password.dto';
import { CreateUserDto } from './dtos/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Users) private readonly usersRepo: Repository<Users>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
    private readonly plantsService: PlantsService,
  ) {}

  async createUser(payload: CreateUserDto): Promise<Object> {
    const { username, password, role, email, name, phone, country, plants } =
      payload;

    const existingUser = await this.usersRepo
      .createQueryBuilder('user')
      .where('LOWER(user.username) = LOWER(:username)', { username })
      .getOne();

    if (existingUser) {
      throw new ConflictException('Username already exists (case-insensitive)');
    }

    if (!isSupportedCountry(country)) {
      throw new BadRequestException('Invalid country code');
    }

    const parsedPhone = parsePhoneNumberFromString(
      phone,
      country as CountryCode,
    );
    if (!parsedPhone || !parsedPhone.isValid()) {
      throw new BadRequestException(
        'Invalid Phone Number for the specified country',
      );
    }

    const plantEntities = plants?.length
      ? await this.plantsService.getPlantsOrThrow(plants)
      : [];

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = this.usersRepo.create({
      username: username.toLowerCase(),
      password: hashedPassword,
      role: role === 'admin' ? RoleType.ADMIN : RoleType.USER,
      email,
      name,
      phone: parsedPhone.number,
      plants: plantEntities,
    });

    await this.usersRepo.save(newUser);

    return { msg: 'User created successfully' };
  }

  async getUserSelf(userId: string): Promise<Partial<Users>> {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { username, role, email, name, phone } = user;
    return { username, role, email, name, phone };
  }

  async getUsersOrThrow(ids: string[]): Promise<Users[]> {
    const users = await this.usersRepo.find({ where: { id: In(ids) } });
    if (users.length !== ids.length) {
      throw new NotFoundException('One or more users not found');
    }
    return users;
  }

  async updateUserById(id: string, updates: any): Promise<Users> {
    const { name, role, email, phone, country } = updates;

    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (phone) {
      if (!isSupportedCountry(country!)) {
        throw new BadRequestException('Invalid country code');
      }

      const parsedPhone = parsePhoneNumberFromString(
        phone,
        country as CountryCode,
      );

      if (!parsedPhone || !parsedPhone.isValid()) {
        throw new BadRequestException(
          'Invalid Phone Number for the specified country',
        );
      }

      user.phone = parsedPhone.number;
    }

    if (name) user.name = name;
    if (role) user.role = role === 'admin' ? RoleType.ADMIN : RoleType.USER;
    if (email) user.email = email;

    return await this.usersRepo.save(user);
  }

  async deleteUserById(id: string): Promise<{ message: string }> {
    const result = await this.usersRepo.delete({ id });
    if (result.affected === 0) {
      throw new NotFoundException('User not found');
    }

    return { message: 'User deleted successfully' };
  }

  async getAllUsers(): Promise<Users[]> {
    return this.usersRepo.find();
  }

  async changePassword(
    userId: string,
    payload: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const { oldPassword, newPassword } = payload;

    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      throw new BadRequestException('Old password is incorrect');
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await this.usersRepo.save(user);

    // Invalidate all existing refresh tokens
    await this.refreshTokenRepo.delete({ user: { id: userId } });

    return { message: 'Password changed successfully' };
  }
}
