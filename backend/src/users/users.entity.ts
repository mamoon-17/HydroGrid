import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Plants } from '../plants/plants.entity';
import { RefreshToken } from '../refresh_tokens/refresh_tokens.entity';
import { Team } from '../teams/teams.entity';

export enum RoleType {
  ADMIN = 'admin',
  USER = 'user',
}

export enum TeamRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
}

@Entity('users')
export class Users {
  @PrimaryGeneratedColumn('uuid')
  id?: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  username: string;

  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({ type: 'enum', enum: RoleType, default: RoleType.USER })
  role?: RoleType;

  @Column({ type: 'varchar', length: 255, unique: true, nullable: true })
  email?: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', unique: true, length: 16 })
  phone: string;

  // Team membership - users can belong to one team
  @ManyToOne(() => Team, (team) => team.members, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'team_id' })
  team?: Team | null;

  // Role within the team (owner, admin, member)
  @Column({ type: 'enum', enum: TeamRole, nullable: true })
  team_role?: TeamRole | null;

  @OneToMany(() => Plants, (plant) => plant.user)
  plants: Plants[];

  @OneToMany(() => RefreshToken, (token) => token.user)
  refreshTokens: RefreshToken[];

  @CreateDateColumn()
  created_at?: Date;

  @UpdateDateColumn()
  updated_at?: Date;
}
