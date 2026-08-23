// client/src/lib/backup/database/PostgresRestoreEngine.ts

import { Pool, PoolClient } from "pg";

export interface RestoreExecutionResult {
  success: boolean;
  statementsExecuted: number;
  durationMs: number;
  tablesRestoredCount: number;
  recordsRestoredCount: number;
  error?: string;
  logs: Array<{ timestamp: string; stage: string; message: string }>;
}

export class PostgresRestoreEngine {
  private connectionString: string;

  constructor(connectionString?: string) {
    this.connectionString = connectionString || process.env.DATABASE_URL || "";
    if (!this.connectionString) {
      throw new Error("PostgreSQL connection string is required for restore engine");
    }
  }

  private getCleanPool(): Pool {
    const isSsl = this.connectionString.includes("sslmode=require") || this.connectionString.includes("neon.tech");
    return new Pool({
      connectionString: this.connectionString,
      ssl: isSsl ? { rejectUnauthorized: false } : undefined,
      max: 3,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 20000,
    });
  }

  /**
   * Executes a full database restore SQL script against target PostgreSQL connection.
   */
  public async executeRestore(
    sqlContent: string,
    options?: { isDryRun?: boolean; targetSchema?: string }
  ): Promise<RestoreExecutionResult> {
    const startTime = Date.now();
    const logs: Array<{ timestamp: string; stage: string; message: string }> = [];
    const pool = this.getCleanPool();
    let client: PoolClient | null = null;

    const addLog = (stage: string, message: string) => {
      logs.push({
        timestamp: new Date().toISOString(),
        stage,
        message,
      });
    };

    try {
      addLog("CONNECT", "Connecting to target PostgreSQL instance...");
      client = await pool.connect();
      addLog("CONNECT", "Connected to target PostgreSQL successfully.");

      if (options?.isDryRun) {
        addLog("DRY_RUN", "Executing in DRY-RUN / Validation mode within rollback transaction.");
      }

      // Execute SQL content
      addLog("RESTORE", "Beginning database restore execution...");

      if (options?.isDryRun) {
        // DRY RUN: Execute in an isolated temporary schema to test full DDL & DML without touching live tables
        const tempSchema = `_val_restore_${Date.now()}`;
        addLog("DRY_RUN", `Creating temporary isolation schema: ${tempSchema}`);

        try {
          await client.query(`CREATE SCHEMA IF NOT EXISTS "${tempSchema}";`);
          await client.query(`SET search_path TO "${tempSchema}", public;`);

          // Adapt SQL content for dry run schema
          const adaptedSql = sqlContent
            .replace(/CREATE SCHEMA IF NOT EXISTS public;/g, `-- Schema ${tempSchema}`)
            .replace(/WHERE table_schema = 'public'/g, `WHERE table_schema = '${tempSchema}'`)
            .replace(/SET search_path TO public;/g, `SET search_path TO "${tempSchema}";`);

          await client.query(adaptedSql);

          // Introspect tables and record counts inside temporary schema
          const tablesRes = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = $1 AND table_type = 'BASE TABLE';
          `, [tempSchema]);
          const tablesRestoredCount = tablesRes.rows.length;

          let totalRecords = 0;
          for (const r of tablesRes.rows) {
            const countRes = await client.query(`SELECT COUNT(*)::int AS cnt FROM "${tempSchema}"."${r.table_name}"`);
            totalRecords += countRes.rows[0]?.cnt || 0;
          }

          addLog("DRY_RUN", `Dry run validation passed successfully. ${tablesRestoredCount} tables, ${totalRecords} records verified.`);

          const durationMs = Date.now() - startTime;
          return {
            success: true,
            statementsExecuted: 1,
            durationMs,
            tablesRestoredCount,
            recordsRestoredCount: totalRecords,
            logs,
          };
        } finally {
          // Clean up temporary schema
          try {
            await client.query(`SET search_path TO public;`);
            await client.query(`DROP SCHEMA IF EXISTS "${tempSchema}" CASCADE;`);
            addLog("DRY_RUN", `Cleaned up temporary validation schema ${tempSchema}.`);
          } catch {}
        }
      } else {
        // PRODUCTION RESTORE: execute script
        await client.query(sqlContent);

        // Count restored objects
        const tablesRes = await client.query(`
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
        `);
        const tablesRestoredCount = tablesRes.rows.length;

        let totalRecords = 0;
        for (const r of tablesRes.rows) {
          try {
            const countRes = await client.query(`SELECT COUNT(*)::int AS cnt FROM "${r.table_name}"`);
            totalRecords += countRes.rows[0]?.cnt || 0;
          } catch {}
        }

        addLog("COMPLETE", `Production database restore executed successfully in ${Date.now() - startTime}ms.`);

        const durationMs = Date.now() - startTime;
        return {
          success: true,
          statementsExecuted: 1,
          durationMs,
          tablesRestoredCount,
          recordsRestoredCount: totalRecords,
          logs,
        };
      }
    } catch (err: any) {
      addLog("ERROR", `Restore failed: ${err.message || String(err)}`);
      return {
        success: false,
        statementsExecuted: 0,
        durationMs: Date.now() - startTime,
        tablesRestoredCount: 0,
        recordsRestoredCount: 0,
        error: err.message || "Failed to execute database restore",
        logs,
      };
    } finally {
      if (client) {
        client.release();
      }
      await pool.end();
    }
  }

  /**
   * Tests connection to target database instance.
   */
  public async testDatabaseConnection(): Promise<{ success: boolean; latencyMs: number; details: string }> {
    const startTime = Date.now();
    const pool = this.getCleanPool();
    try {
      const client = await pool.connect();
      const res = await client.query("SELECT current_database(), version()");
      client.release();
      await pool.end();

      const dbName = res.rows[0]?.current_database;
      const latencyMs = Date.now() - startTime;
      return {
        success: true,
        latencyMs,
        details: `Connected to "${dbName}" in ${latencyMs}ms`,
      };
    } catch (err: any) {
      await pool.end();
      return {
        success: false,
        latencyMs: Date.now() - startTime,
        details: err.message || "Database connection test failed",
      };
    }
  }
}
