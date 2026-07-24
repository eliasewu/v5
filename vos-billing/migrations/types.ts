import type { Pool } from "mysql2/promise";

export interface Migration {
  /** Unique migration name (e.g. "001_ip_limit_rate_column") */
  name: string;
  /** Human-readable description */
  description: string;
  /** Apply the migration */
  up(db: Pool): Promise<void>;
  /** Rollback the migration (optional) */
  down?(db: Pool): Promise<void>;
}
