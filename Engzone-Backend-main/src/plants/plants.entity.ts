import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Users } from '../users/users.entity';

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

  @ManyToMany(() => Users, (user) => user.plants)
  @JoinTable()
  users: Users[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
