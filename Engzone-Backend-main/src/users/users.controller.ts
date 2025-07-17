// src/users/users.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '../auth/auth.guard';
import { AuthenticatedRequest } from '../common/express-request.interface';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { RoleType } from './users.entity';
import { CreateUserDto, CreateUserSchema } from './dtos/create-user.dto';
import { ZodValidationPipe } from 'src/common/pipes/zod-validation.pipe';
import { UpdateUserDto, updateUserSchema } from './dtos/update-user.dto';
import {
  ChangePasswordDto,
  changePasswordSchema,
} from './dtos/change-password.dto';
import { User } from 'src/common/decorators/user.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  async getAllUsers() {
    return this.usersService.getAllUsers();
  }

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  async createUser(
    @Body(new ZodValidationPipe(CreateUserSchema)) payload: CreateUserDto,
  ) {
    this.usersService.createUser(payload);
    return { msg: 'User created successfully' };
  }

  @Get('me')
  @UseGuards(AuthGuard)
  getUserSelf(@User('id') userId: string) {
    return this.usersService.getUserSelf(userId);
  }

  @Get(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  getUserById(@Param('id') id: string) {
    if (!id) {
      throw new UnauthorizedException('User ID not found in request');
    }
    return this.usersService.getUserSelf(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  async updateUserById(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateUserSchema)) updates: UpdateUserDto,
  ) {
    return this.usersService.updateUserById(id, updates);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  async deleteUserById(@Param('id') id: string) {
    return this.usersService.deleteUserById(id);
  }

  @Patch('change-password')
  @UseGuards(AuthGuard)
  async changePassword(
    @User('id') userId: string,
    @Body(new ZodValidationPipe(changePasswordSchema)) body: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(userId, body);
  }
}
