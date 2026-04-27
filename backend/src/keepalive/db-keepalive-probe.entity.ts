import { CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Render + some hosted Postgres providers may scale-to-zero when idle.
 *
 * This table exists solely to support a scheduled "DB keep-awake" job that
 * inserts then deletes a row on a daily cadence, creating minimal DB activity
 * to avoid sleep/cold starts.
 */
@Entity('db_keepalive_probes')
export class DbKeepaliveProbe {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  created_at: Date;
}

