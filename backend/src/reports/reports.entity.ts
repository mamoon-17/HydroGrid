import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Check,
  OneToMany,
} from 'typeorm';
import { Plants } from '../plants/plants.entity';
import { Users } from '../users/users.entity';
import { ReportMedia } from '../report_media/report_media.entity';
import { Team } from '../teams/teams.entity';

export enum BackwashStatus {
  DONE = 'done',
  NOT_DONE = 'not_done',
  NOT_REQUIRED = 'not_required',
}

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Report belongs to a team (required for SaaS multi-tenancy)
  @ManyToOne(() => Team, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'team_id' })
  team: Team;

  @ManyToOne(() => Plants, { onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'plant_id' })
  plant: Plants;

  @ManyToOne(() => Users, { onDelete: 'SET NULL', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  submitted_by: Users;

  // Parameters
  @Column('float')
  raw_water_tds: number;

  @Column('float')
  permeate_water_tds: number;

  @Column('float')
  raw_water_ph: number;

  @Column('float')
  permeate_water_ph: number;

  @Column('float')
  product_water_tds: number;

  @Column('float')
  product_water_flow: number;

  @Column('float')
  product_water_ph: number;

  @Column('float')
  reject_water_flow: number;

  // Pressure & power
  @Column('float')
  membrane_inlet_pressure: number;

  @Column('float')
  membrane_outlet_pressure: number;

  @Column('float')
  raw_water_inlet_pressure: number;

  @Column('float')
  volts_amperes: number;

  // Maintenance / Backwash
  @Column({ type: 'enum', enum: BackwashStatus })
  multimedia_backwash: BackwashStatus;

  @Column({ type: 'enum', enum: BackwashStatus })
  carbon_backwash: BackwashStatus;

  @Column({ type: 'enum', enum: BackwashStatus })
  membrane_cleaning: BackwashStatus;

  @Column({ type: 'enum', enum: BackwashStatus })
  arsenic_media_backwash: BackwashStatus;

  @Column({ type: 'boolean' })
  cip: boolean;

  @Column('float')
  chemical_refill_litres: number;

  @Column({ type: 'float' })
  @Check(`"cartridge_filter_replacement" BETWEEN 0 AND 2`)
  cartridge_filter_replacement: number;

  @Column({ type: 'float' })
  @Check(`"membrane_replacement" BETWEEN 0 AND 8`)
  membrane_replacement: number;

  @Column({ type: 'int', default: 0 })
  edit_count: number;

  @OneToMany(() => ReportMedia, (media) => media.report, { cascade: true })
  media: ReportMedia[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
