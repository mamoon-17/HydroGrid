import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Plants } from './plants.entity';
import { Team } from '../teams/teams.entity';
import { PlantsService } from './plants.service';
import { PlantsController } from './plants.controller';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Plants, Team]),
    forwardRef(() => UsersModule),
  ],
  providers: [PlantsService],
  controllers: [PlantsController],
  exports: [PlantsService],
})
export class PlantsModule {}
