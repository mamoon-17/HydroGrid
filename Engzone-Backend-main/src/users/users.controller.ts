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
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '../auth/auth.guard';
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
  async getAllUsers(
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
      return this.usersService.getAllUsersPaginated({
        limit: parsedLimit ?? 10,
        offset: parsedOffset ?? 0,
        select: selectFields,
      });
    }

    return this.usersService.getAllUsers();
  }

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  async createUser(
    @Body(new ZodValidationPipe(CreateUserSchema)) payload: CreateUserDto,
  ) {
    return this.usersService.createUser(payload);
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

  // IMPORTANT: Place static route before dynamic ':id' to avoid route conflicts
  @Patch('change-password')
  @UseGuards(AuthGuard)
  async changePassword(
    @User('id') userId: string,
    @Body(new ZodValidationPipe(changePasswordSchema)) body: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(userId, body);
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
}
