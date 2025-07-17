import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from './users.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PlantsModule } from 'src/plants/plants.module';
import { RefreshTokensModule } from 'src/refresh_tokens/refresh_tokens.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Users]),
    forwardRef(() => PlantsModule),
    RefreshTokensModule,
  ],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
