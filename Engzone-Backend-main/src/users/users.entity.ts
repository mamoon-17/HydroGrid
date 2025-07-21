import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Plants } from '../plants/plants.entity'; // adjust relative path as needed
import { RefreshToken } from '../refresh_tokens/refresh_tokens.entity'; // adjust path

export enum RoleType {
  ADMIN = 'admin',
  USER = 'user',
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

  @OneToMany(() => Plants, (plant) => plant.user)
  plants: Plants[];

  @OneToMany(() => RefreshToken, (token) => token.user)
  refreshTokens: RefreshToken[];

  @CreateDateColumn()
  created_at?: Date;

  @UpdateDateColumn()
  updated_at?: Date;
}
