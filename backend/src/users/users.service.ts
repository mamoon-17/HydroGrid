import {
  Injectable,
  ConflictException,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Users, RoleType, TeamRole } from './users.entity';
import { Team } from '../teams/teams.entity';
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
    @InjectRepository(Team) private readonly teamsRepo: Repository<Team>,
    private readonly plantsService: PlantsService,
  ) {}

  /**
   * Create a team member (used by team admins/owners)
   * Only owners can create admin users
   */
  async createTeamMember(
    teamId: string,
    payload: CreateUserDto,
    creatorRole: TeamRole,
  ): Promise<Object> {
    const { username, password, role, email, name, phone, country, plants } = payload;

    // Only owners can create admin users
    if (role === 'admin' && creatorRole !== TeamRole.OWNER) {
      throw new ForbiddenException('Only team owners can create admin users');
    }

    // Verify team exists
    const team = await this.teamsRepo.findOne({ where: { id: teamId } });
    if (!team) {
      throw new NotFoundException('Team not found');
    }

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

    const parsedPhone = parsePhoneNumberFromString(phone, country as CountryCode);
    if (!parsedPhone || !parsedPhone.isValid()) {
      throw new BadRequestException('Invalid Phone Number for the specified country');
    }

    // Verify plants belong to the same team
    const plantEntities = plants?.length
      ? await this.plantsService.getPlantsOrThrow(plants, teamId)
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
      team: team,
      team_role: role === 'admin' ? TeamRole.ADMIN : TeamRole.MEMBER,
    });

    await this.usersRepo.save(newUser);

    return { msg: 'Team member created successfully' };
  }

  /**
   * Legacy createUser method - now just for self-registration
   */
  async createUser(payload: CreateUserDto): Promise<Object> {
    const { username, password, email, name, phone, country } = payload;

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

    const parsedPhone = parsePhoneNumberFromString(phone, country as CountryCode);
    if (!parsedPhone || !parsedPhone.isValid()) {
      throw new BadRequestException('Invalid Phone Number for the specified country');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = this.usersRepo.create({
      username: username.toLowerCase(),
      password: hashedPassword,
      role: RoleType.USER,
      email,
      name,
      phone: parsedPhone.number,
    });

    await this.usersRepo.save(newUser);

    return { msg: 'User created successfully' };
  }

  async getUserSelf(userId: string): Promise<Partial<Users>> {
    const user = await this.usersRepo.findOne({
      where: { id: userId },
      relations: ['team'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { id, username, role, email, name, phone, team, team_role } = user;
    return {
      id,
      username,
      role,
      email,
      name,
      phone,
      team: team ? { id: team.id, name: team.name, slug: team.slug } : null,
      team_role,
    } as Partial<Users>;
  }

  async getUsersOrThrow(ids: string[]): Promise<Users[]> {
    const users = await this.usersRepo.find({ 
      where: { id: In(ids) },
      relations: ['team'],
    });
    if (users.length !== ids.length) {
      throw new NotFoundException('One or more users not found');
    }
    return users;
  }

  /**
   * Get all members of a team
   */
  async getTeamMembers(teamId: string): Promise<Users[]> {
    return this.usersRepo.find({
      where: { team: { id: teamId } },
      relations: ['plants'],
    });
  }

  /**
   * Get team members with pagination
   */
  async getTeamMembersPaginated(
    teamId: string,
    params: {
      limit: number;
      offset: number;
      select?: string[];
    },
  ): Promise<{
    data: Partial<Users>[];
    total: number;
    limit: number;
    offset: number;
  }> {
    const { limit, offset, select } = params;

    const qb = this.usersRepo
      .createQueryBuilder('user')
      .where('user.team_id = :teamId', { teamId });

    if (select && select.length > 0) {
      const allowed: Array<keyof Users> = [
        'id',
        'username',
        'role',
        'email',
        'name',
        'phone',
        'team_role',
        'created_at',
        'updated_at',
      ];
      const safeFields = select.filter((f) => (allowed as string[]).includes(f));
      if (safeFields.length > 0) {
        qb.select(safeFields.map((f) => `user.${f}`));
      }
    }

    qb.take(limit);
    qb.skip(offset);
    qb.orderBy('user.created_at', 'DESC');

    const [rows, total] = await qb.getManyAndCount();

    const data: Partial<Users>[] = rows.map(
      ({ id, username, role, email, name, phone, team_role, created_at, updated_at }) => ({
        id,
        username,
        role,
        email,
        name,
        phone,
        team_role,
        created_at,
        updated_at,
      }),
    );

    return { data, total, limit, offset };
  }

  /**
   * Get a specific team member by ID
   */
  async getTeamMemberById(teamId: string, memberId: string): Promise<Partial<Users>> {
    const user = await this.usersRepo.findOne({
      where: { id: memberId, team: { id: teamId } },
      relations: ['plants'],
    });

    if (!user) {
      throw new NotFoundException('Team member not found');
    }

    const { id, username, role, email, name, phone, team_role } = user;
    return { id, username, role, email, name, phone, team_role };
  }

  /**
   * Update a team member
   */
  async updateTeamMember(teamId: string, memberId: string, updates: any): Promise<Users> {
    const { name, role, email, phone, country, password } = updates;

    const user = await this.usersRepo.findOne({
      where: { id: memberId, team: { id: teamId } },
    });

    if (!user) {
      throw new NotFoundException('Team member not found');
    }

    if (phone) {
      if (!isSupportedCountry(country!)) {
        throw new BadRequestException('Invalid country code');
      }

      const parsedPhone = parsePhoneNumberFromString(phone, country as CountryCode);

      if (!parsedPhone || !parsedPhone.isValid()) {
        throw new BadRequestException('Invalid Phone Number for the specified country');
      }

      user.phone = parsedPhone.number;
    }

    if (name) user.name = name;
    if (role) {
      user.role = role === 'admin' ? RoleType.ADMIN : RoleType.USER;
      // Also update team role
      if (user.team_role !== TeamRole.OWNER) {
        user.team_role = role === 'admin' ? TeamRole.ADMIN : TeamRole.MEMBER;
      }
    }
    if (email) user.email = email;

    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      user.password = hashed;
      await this.refreshTokenRepo.delete({ user: { id: memberId } });
    }

    return await this.usersRepo.save(user);
  }

  /**
   * Remove a team member
   * - Owners can remove anyone (except themselves)
   * - Admins can only remove regular members (not other admins)
   */
  async removeTeamMember(
    teamId: string,
    memberId: string,
    deleterRole: TeamRole,
  ): Promise<{ message: string }> {
    const user = await this.usersRepo.findOne({
      where: { id: memberId, team: { id: teamId } },
    });

    if (!user) {
      throw new NotFoundException('Team member not found');
    }

    if (user.team_role === TeamRole.OWNER) {
      throw new ForbiddenException('Cannot remove team owner');
    }

    // Admins cannot delete other admins - only owners can
    if (user.team_role === TeamRole.ADMIN && deleterRole !== TeamRole.OWNER) {
      throw new ForbiddenException('Only the team owner can remove admin users');
    }

    // Remove from team (not delete the user)
    user.team = null;
    user.team_role = null;
    await this.usersRepo.save(user);

    return { message: 'Member removed from team successfully' };
  }

  // Legacy methods kept for backward compatibility
  async updateUserById(id: string, updates: any): Promise<Users> {
    const { name, role, email, phone, country, password } = updates;

    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (phone) {
      if (!isSupportedCountry(country!)) {
        throw new BadRequestException('Invalid country code');
      }

      const parsedPhone = parsePhoneNumberFromString(phone, country as CountryCode);

      if (!parsedPhone || !parsedPhone.isValid()) {
        throw new BadRequestException('Invalid Phone Number for the specified country');
      }

      user.phone = parsedPhone.number;
    }

    if (name) user.name = name;
    if (role) user.role = role === 'admin' ? RoleType.ADMIN : RoleType.USER;
    if (email) user.email = email;

    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      user.password = hashed;
      await this.refreshTokenRepo.delete({ user: { id } });
    }

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

  async getAllUsersPaginated(params: {
    limit: number;
    offset: number;
    select?: string[];
  }): Promise<{
    data: Partial<Users>[];
    total: number;
    limit: number;
    offset: number;
  }> {
    const { limit, offset, select } = params;

    const qb = this.usersRepo.createQueryBuilder('user');

    if (select && select.length > 0) {
      const allowed: Array<keyof Users> = [
        'id',
        'username',
        'role',
        'email',
        'name',
        'phone',
        'created_at',
        'updated_at',
      ];
      const safeFields = select.filter((f) => (allowed as string[]).includes(f));
      if (safeFields.length > 0) {
        qb.select(safeFields.map((f) => `user.${f}`));
      }
    }

    qb.take(limit);
    qb.skip(offset);
    qb.orderBy('user.created_at', 'DESC');

    const [rows, total] = await qb.getManyAndCount();

    const data: Partial<Users>[] = rows.map(
      ({ id, username, role, email, name, phone, created_at, updated_at }) => ({
        id,
        username,
        role,
        email,
        name,
        phone,
        created_at,
        updated_at,
      }),
    );

    return { data, total, limit, offset };
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

    return { message: 'Password changed successfully' };
  }
}
