import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Users } from '../users/users.entity';
import { Team } from '../teams/teams.entity';

export enum PlantType {
  UF = 'uf',
  RO = 'ro',
}

@Entity('plants')
export class Plants {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: false })
  address: string;

  @Column({ type: 'decimal', nullable: true, precision: 10, scale: 6 })
  lat?: number;

  @Column({ type: 'decimal', nullable: true, precision: 10, scale: 6 })
  lng?: number;

  @Column({ type: 'point', nullable: true })
  point?: string;

  @Column({ type: 'varchar', nullable: false })
  tehsil: string;

  @Column({ type: 'enum', enum: PlantType, nullable: false })
  type: PlantType;

  @Column({ type: 'int', unsigned: true, nullable: false })
  capacity: number;

  // Plant belongs to a team (required for SaaS multi-tenancy)
  @ManyToOne(() => Team, (team) => team.plants, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'team_id' })
  team: Team;

  // Assigned employee within the team
  @ManyToOne(() => Users, (user) => user.plants, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  user: Users | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
