// client/src/lib/backup/database/PostgresSchemaValidator.ts

import { Pool } from "pg";

export interface SchemaValidationReport {
  isCompatible: boolean;
  backupMigration: string | null;
  currentMigration: string | null;
  migrationDiff: {
    missingInBackup: string[];
    extraInBackup: string[];
  };
  warnings: string[];
  databaseStats: {
    activeTablesCount: number;
    activeRecordsCount: number;
  };
}

export class PostgresSchemaValidator {
  private connectionString: string;

  constructor(connectionString?: string) {
    this.connectionString = connectionString || process.env.DATABASE_URL || "";
  }

  private getCleanPool(): Pool {
    const isSsl = this.connectionString.includes("sslmode=require") || this.connectionString.includes("neon.tech");
    return new Pool({
      connectionString: this.connectionString,
      ssl: isSsl ? { rejectUnauthorized: false } : undefined,
      max: 2,
      idleTimeoutMillis: 5000,
      connectionTimeoutMillis: 10000,
    });
  }

  /**
   * Evaluates schema and migration compatibility between a target backup snapshot and current live database.
   */
  public async validateCompatibility(backupLatestMigration: string | null): Promise<SchemaValidationReport> {
    const pool = this.getCleanPool();
    const warnings: string[] = [];

    try {
      const client = await pool.connect();

      // 1. Fetch current migrations from live database
      let currentMigration: string | null = null;
      let appliedMigrations: string[] = [];

      try {
        const migrationsRes = await client.query(
          `SELECT migration_name FROM _prisma_migrations WHERE rolled_back_at IS NULL ORDER BY finished_at ASC`
        );
        appliedMigrations = migrationsRes.rows.map((r) => r.migration_name);
        if (appliedMigrations.length > 0) {
          currentMigration = appliedMigrations[appliedMigrations.length - 1];
        }
      } catch {
        // _prisma_migrations might not exist
      }

      // 2. Count active tables and records
      const tablesRes = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
      `);

      const activeTablesCount = tablesRes.rows.length;
      let activeRecordsCount = 0;

      for (const r of tablesRes.rows) {
        try {
          const countRes = await client.query(`SELECT COUNT(*)::int AS cnt FROM "${r.table_name}"`);
          activeRecordsCount += countRes.rows[0]?.cnt || 0;
        } catch {}
      }

      client.release();
      await pool.end();

      // 3. Migration Diff Analysis
      const missingInBackup: string[] = [];
      const extraInBackup: string[] = [];

      if (backupLatestMigration && currentMigration) {
        const backupIndex = appliedMigrations.indexOf(backupLatestMigration);
        const currentIndex = appliedMigrations.indexOf(currentMigration);

        if (backupIndex !== -1 && currentIndex !== -1 && backupIndex < currentIndex) {
          // Backup is behind current application
          for (let i = backupIndex + 1; i <= currentIndex; i++) {
            missingInBackup.push(appliedMigrations[i]);
          }
          warnings.push(
            `This backup was created before ${missingInBackup.length} subsequent database migration(s) were applied: ${missingInBackup.join(", ")}. Restoring this backup will restore the schema to state '${backupLatestMigration}'.`
          );
        } else if (backupIndex === -1 && backupLatestMigration !== currentMigration) {
          warnings.push(
            `The backup's recorded migration '${backupLatestMigration}' is not recognized in current application migration history.`
          );
        }
      }

      const isCompatible = warnings.length === 0;

      return {
        isCompatible,
        backupMigration: backupLatestMigration,
        currentMigration,
        migrationDiff: {
          missingInBackup,
          extraInBackup,
        },
        warnings,
        databaseStats: {
          activeTablesCount,
          activeRecordsCount,
        },
      };
    } catch (err: any) {
      await pool.end();
      return {
        isCompatible: false,
        backupMigration: backupLatestMigration,
        currentMigration: null,
        migrationDiff: { missingInBackup: [], extraInBackup: [] },
        warnings: [`Failed to introspect database schema: ${err.message || String(err)}`],
        databaseStats: { activeTablesCount: 0, activeRecordsCount: 0 },
      };
    }
  }
}
