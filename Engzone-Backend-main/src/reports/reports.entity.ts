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

export enum BackwashStatus {
  DONE = 'done',
  NOT_DONE = 'not_done',
  NOT_REQUIRED = 'not_required',
}

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Plants, { onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'plant_id' })
  plant: Plants;

  @ManyToOne(() => Users, { onDelete: 'SET NULL', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  submitted_by: Users;

  // Parameters
  @Column('int')
  raw_water_tds: number;

  @Column('int')
  permeate_water_tds: number;

  @Column('int')
  raw_water_ph: number;

  @Column('int')
  permeate_water_ph: number;

  @Column('int')
  product_water_tds: number;

  @Column('int')
  product_water_flow: number;

  @Column('int')
  product_water_ph: number;

  @Column('int')
  reject_water_flow: number;

  // Pressure & power
  @Column('int')
  membrane_inlet_pressure: number;

  @Column('int')
  membrane_outlet_pressure: number;

  @Column('int')
  raw_water_inlet_pressure: number;

  @Column('int')
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

  @Column('int')
  chemical_refill_litres: number;

  @Column({ type: 'int' })
  @Check(`"cartridge_filter_replacement" BETWEEN 0 AND 2`)
  cartridge_filter_replacement: number;

  @Column({ type: 'int' })
  @Check(`"membrane_replacement" BETWEEN 0 AND 8`)
  membrane_replacement: number;

  @OneToMany(() => ReportMedia, (media) => media.report, { cascade: true })
  media: ReportMedia[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
