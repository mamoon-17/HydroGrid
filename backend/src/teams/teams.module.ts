import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Team } from './teams.entity';
import { TeamInvitation } from './team-invitations.entity';
import { TeamsService } from './teams.service';
import { TeamsController } from './teams.controller';
import { Users } from '../users/users.entity';
import { SharedModule } from '../shared/shared.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Team, TeamInvitation, Users]),
    SharedModule,
    forwardRef(() => UsersModule),
  ],
  controllers: [TeamsController],
  providers: [TeamsService],
  exports: [TeamsService],
})
export class TeamsModule {}
