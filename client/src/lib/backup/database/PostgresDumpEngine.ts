// client/src/lib/backup/database/PostgresDumpEngine.ts

import { Pool, PoolClient } from "pg";

export interface DatabaseDumpResult {
  sqlContent: string;
  databaseName: string;
  databaseProvider: string;
  postgresVersion: string;
  tablesCount: number;
  recordsCount: number;
  latestMigration: string | null;
  tableStats: Record<string, number>;
  generatedAt: Date;
}

export class PostgresDumpEngine {
  private connectionString: string;

  constructor(connectionString?: string) {
    this.connectionString = connectionString || process.env.DATABASE_URL || "";
    if (!this.connectionString) {
      throw new Error("PostgreSQL connection string (DATABASE_URL) is not defined");
    }
  }

  /**
   * Cleans connection string parameters for pg client (handles sslmode, channel_binding, etc.)
   */
  private getCleanPool(): Pool {
    const isSsl = this.connectionString.includes("sslmode=require") || this.connectionString.includes("neon.tech");
    return new Pool({
      connectionString: this.connectionString,
      ssl: isSsl ? { rejectUnauthorized: false } : undefined,
      max: 3,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 15000,
    });
  }

  /**
   * Generates a complete, database-level SQL dump of all schemas, types, sequences, tables, constraints, indexes, data, and Prisma migrations.
   */
  public async generateDump(): Promise<DatabaseDumpResult> {
    const pool = this.getCleanPool();
    let client: PoolClient | null = null;

    try {
      client = await pool.connect();

      // 1. Fetch DB info
      const versionRes = await client.query("SELECT version()");
      const postgresVersion = versionRes.rows[0]?.version || "PostgreSQL";

      const currentDbRes = await client.query("SELECT current_database()");
      const databaseName = currentDbRes.rows[0]?.current_database || "jewelry_store";

      // 2. Fetch Latest Prisma Migration
      let latestMigration: string | null = null;
      try {
        const migrationRes = await client.query(
          `SELECT migration_name, finished_at FROM _prisma_migrations WHERE rolled_back_at IS NULL ORDER BY finished_at DESC LIMIT 1`
        );
        if (migrationRes.rows.length > 0) {
          latestMigration = migrationRes.rows[0].migration_name;
        }
      } catch {
        // _prisma_migrations might not exist on clean DBs
      }

      // 3. Fetch all custom ENUM types in public schema
      const enumsRes = await client.query(`
        SELECT t.typname, string_agg(quote_literal(e.enumlabel), ', ' ORDER BY e.enumsortorder) AS enum_values
        FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE n.nspname = 'public'
        GROUP BY t.typname
        ORDER BY t.typname;
      `);

      // 4. Fetch all sequences
      const sequencesRes = await client.query(`
        SELECT sequence_name 
        FROM information_schema.sequences 
        WHERE sequence_schema = 'public'
        ORDER BY sequence_name;
      `);

      // 5. Fetch all public tables (excluding system tables)
      const tablesRes = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
        ORDER BY table_name;
      `);

      const tableNames: string[] = tablesRes.rows.map((r) => r.table_name);
      const tableStats: Record<string, number> = {};
      let totalRecords = 0;

      // Start composing the SQL Dump Script
      const sqlParts: string[] = [];

      sqlParts.push(`-- ====================================================================`);
      sqlParts.push(`-- ATELIER JEWELRY ERP - NATIVE POSTGRESQL DATABASE DUMP`);
      sqlParts.push(`-- Database: ${databaseName}`);
      sqlParts.push(`-- Server Version: ${postgresVersion.split(" on ")[0]}`);
      sqlParts.push(`-- Latest Prisma Migration: ${latestMigration || "None"}`);
      sqlParts.push(`-- Dump Timestamp: ${new Date().toISOString()}`);
      sqlParts.push(`-- ====================================================================\n`);

      sqlParts.push(`SET statement_timeout = 0;`);
      sqlParts.push(`SET lock_timeout = 0;`);
      sqlParts.push(`SET client_encoding = 'UTF8';`);
      sqlParts.push(`SET standard_conforming_strings = on;`);
      sqlParts.push(`SET check_function_bodies = false;`);
      sqlParts.push(`SET client_min_messages = warning;`);
      sqlParts.push(`SET row_security = off;\n`);

      sqlParts.push(`BEGIN;\n`);

      // Disable foreign key constraints trigger validation during bulk restore
      sqlParts.push(`SET CONSTRAINTS ALL DEFERRED;`);
      sqlParts.push(`-- Drop existing schema objects cleanly if required`);
      sqlParts.push(`CREATE SCHEMA IF NOT EXISTS public;\n`);

      // --- SECTION A: CUSTOM ENUMS & TYPES ---
      if (enumsRes.rows.length > 0) {
        sqlParts.push(`-- --------------------------------------------------`);
        sqlParts.push(`-- 1. ENUMS & CUSTOM TYPES`);
        sqlParts.push(`-- --------------------------------------------------`);
        for (const enumRow of enumsRes.rows) {
          sqlParts.push(
            `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = '${enumRow.typname}') THEN CREATE TYPE "${enumRow.typname}" AS ENUM (${enumRow.enum_values}); END IF; END $$;`
          );
        }
        sqlParts.push(`\n`);
      }

      // --- SECTION B: DROP EXISTING TABLES ---
      sqlParts.push(`-- --------------------------------------------------`);
      sqlParts.push(`-- 2. DROP EXISTING TABLES`);
      sqlParts.push(`-- --------------------------------------------------`);
      for (const table of tableNames) {
        sqlParts.push(`DROP TABLE IF EXISTS "${table}" CASCADE;`);
      }
      sqlParts.push(`\n`);

      // --- SECTION C: SEQUENCES ---
      if (sequencesRes.rows.length > 0) {
        sqlParts.push(`-- --------------------------------------------------`);
        sqlParts.push(`-- 3. SEQUENCES`);
        sqlParts.push(`-- --------------------------------------------------`);
        for (const seq of sequencesRes.rows) {
          sqlParts.push(`CREATE SEQUENCE IF NOT EXISTS "${seq.sequence_name}";`);
        }
        sqlParts.push(`\n`);
      }

      // Store table column metadata for typed serialization
      const tableColumnsMeta: Record<string, Record<string, { dataType: string; udtName: string }>> = {};

      for (const table of tableNames) {
        // Fetch columns for table
        const colsRes = await client.query(
          `
          SELECT 
            column_name, 
            data_type, 
            udt_name,
            is_nullable, 
            column_default,
            character_maximum_length,
            numeric_precision,
            numeric_scale
          FROM information_schema.columns 
          WHERE table_schema = 'public' AND table_name = $1
          ORDER BY ordinal_position;
        `,
          [table]
        );

        tableColumnsMeta[table] = {};
        const colDefs: string[] = [];
        for (const col of colsRes.rows) {
          tableColumnsMeta[table][col.column_name] = {
            dataType: col.data_type.toLowerCase(),
            udtName: col.udt_name.toLowerCase(),
          };

          let typeDef = col.data_type.toUpperCase();

          if (typeDef === "USER-DEFINED") {
            typeDef = `"${col.udt_name}"`;
          } else if (typeDef === "ARRAY") {
            typeDef = `${col.udt_name.replace(/^_/, "")}[]`;
          } else if (typeDef === "CHARACTER VARYING") {
            typeDef = col.character_maximum_length ? `VARCHAR(${col.character_maximum_length})` : "VARCHAR";
          } else if (typeDef === "NUMERIC") {
            typeDef = col.numeric_precision
              ? `NUMERIC(${col.numeric_precision}, ${col.numeric_scale || 0})`
              : "NUMERIC";
          }

          let colDef = `"${col.column_name}" ${typeDef}`;
          if (col.column_default) {
            colDef += ` DEFAULT ${col.column_default}`;
          }
          if (col.is_nullable === "NO") {
            colDef += ` NOT NULL`;
          }
          colDefs.push(colDef);
        }

        sqlParts.push(`CREATE TABLE "${table}" (`);
        sqlParts.push(`  ${colDefs.join(",\n  ")}`);
        sqlParts.push(`);\n`);
      }

      // --- SECTION E: TABLE DATA DUMPS (INSERTS) ---
      sqlParts.push(`-- --------------------------------------------------`);
      sqlParts.push(`-- 5. TABLE DATA`);
      sqlParts.push(`-- --------------------------------------------------`);

      for (const table of tableNames) {
        const countRes = await client.query(`SELECT COUNT(*)::int AS count FROM "${table}"`);
        const count = countRes.rows[0]?.count || 0;
        tableStats[table] = count;
        totalRecords += count;

        if (count === 0) continue;

        sqlParts.push(`-- Data for table: "${table}" (${count} records)`);

        const colMeta = tableColumnsMeta[table] || {};

        // Stream rows in batches to avoid memory overload
        const batchSize = 1000;
        let offset = 0;

        while (offset < count) {
          const rowsRes = await client.query(`SELECT * FROM "${table}" LIMIT ${batchSize} OFFSET ${offset}`);
          if (rowsRes.rows.length === 0) break;

          const columns = Object.keys(rowsRes.rows[0]);
          const quotedColumns = columns.map((c) => `"${c}"`).join(", ");

          for (const row of rowsRes.rows) {
            const values = columns.map((col) => {
              const val = row[col];
              if (val === null || val === undefined) return "NULL";

              const meta = colMeta[col];
              const dt = meta?.dataType || "";

              if (dt === "boolean" || typeof val === "boolean") {
                return val ? "TRUE" : "FALSE";
              }

              if (val instanceof Date) {
                return `'${val.toISOString()}'::timestamptz`;
              }

              if (dt === "json" || dt === "jsonb") {
                const jsonStr = (typeof val === "object" ? JSON.stringify(val) : String(val)).replace(/'/g, "''");
                return `'${jsonStr}'::${dt}`;
              }

              if (Array.isArray(val) || dt === "array" || meta?.udtName?.startsWith("_")) {
                const arrVal = Array.isArray(val) ? val : [val];
                const escapedArr = arrVal.map((v) =>
                  typeof v === "string" ? `"${v.replace(/"/g, '\\"')}"` : v
                );
                return `'${JSON.stringify(escapedArr).replace(/\[/g, "{").replace(/\]/g, "}")}'`;
              }

              if (Buffer.isBuffer(val)) {
                return `E'\\\\x${val.toString("hex")}'::bytea`;
              }

              if (typeof val === "number") {
                return val.toString();
              }

              // String escaping
              const strVal = String(val).replace(/'/g, "''");
              return `'${strVal}'`;
            });

            sqlParts.push(`INSERT INTO "${table}" (${quotedColumns}) VALUES (${values.join(", ")});`);
          }

          offset += batchSize;
        }
        sqlParts.push(`\n`);
      }

      // --- SECTION E: PRIMARY KEYS, UNIQUE & CHECK CONSTRAINTS ---
      sqlParts.push(`-- --------------------------------------------------`);
      sqlParts.push(`-- 5. PRIMARY KEYS, UNIQUE & CHECK CONSTRAINTS`);
      sqlParts.push(`-- --------------------------------------------------`);

      const primaryAndUniqueConstraintsRes = await client.query(`
        SELECT 
          conrelid::regclass AS table_name,
          conname AS constraint_name,
          contype,
          pg_get_constraintdef(oid) AS definition
        FROM pg_constraint
        WHERE connamespace = 'public'::regnamespace
          AND contype IN ('p', 'u', 'c')
        ORDER BY CASE contype WHEN 'p' THEN 1 WHEN 'u' THEN 2 WHEN 'c' THEN 3 ELSE 4 END;
      `);

      for (const con of primaryAndUniqueConstraintsRes.rows) {
        const cleanTable = String(con.table_name).replace(/^public\./, "").replace(/"/g, "");
        sqlParts.push(
          `DO $$ BEGIN ALTER TABLE "${cleanTable}" ADD CONSTRAINT "${con.constraint_name}" ${con.definition}; EXCEPTION WHEN duplicate_table THEN NULL; WHEN duplicate_object THEN NULL; END $$;`
        );
      }
      sqlParts.push(`\n`);

      // --- SECTION F: INDEXES ---
      sqlParts.push(`-- --------------------------------------------------`);
      sqlParts.push(`-- 6. INDEXES`);
      sqlParts.push(`-- --------------------------------------------------`);

      const indexesRes = await client.query(`
        SELECT indexdef 
        FROM pg_indexes 
        WHERE schemaname = 'public' AND indexname NOT IN (
          SELECT conname FROM pg_constraint WHERE connamespace = 'public'::regnamespace
        );
      `);

      for (const idx of indexesRes.rows) {
        const cleanDef = idx.indexdef
          .replace(/ ON public\./gi, " ON ")
          .replace(/^CREATE UNIQUE INDEX /i, "CREATE UNIQUE INDEX IF NOT EXISTS ")
          .replace(/^CREATE INDEX /i, "CREATE INDEX IF NOT EXISTS ");
        sqlParts.push(`${cleanDef};`);
      }
      sqlParts.push(`\n`);

      // --- SECTION G: FOREIGN KEYS (APPLIED AFTER ALL UNIQUE KEYS & INDEXES EXIST) ---
      sqlParts.push(`-- --------------------------------------------------`);
      sqlParts.push(`-- 7. FOREIGN KEY CONSTRAINTS`);
      sqlParts.push(`-- --------------------------------------------------`);

      const foreignKeysRes = await client.query(`
        SELECT 
          conrelid::regclass AS table_name,
          conname AS constraint_name,
          contype,
          pg_get_constraintdef(oid) AS definition
        FROM pg_constraint
        WHERE connamespace = 'public'::regnamespace
          AND contype = 'f';
      `);

      for (const con of foreignKeysRes.rows) {
        const cleanTable = String(con.table_name).replace(/^public\./, "").replace(/"/g, "");
        sqlParts.push(
          `DO $$ BEGIN ALTER TABLE "${cleanTable}" ADD CONSTRAINT "${con.constraint_name}" ${con.definition}; EXCEPTION WHEN duplicate_table THEN NULL; WHEN duplicate_object THEN NULL; END $$;`
        );
      }
      sqlParts.push(`\n`);

      // --- SECTION G: SEQUENCE STATE RESTORATION ---
      if (sequencesRes.rows.length > 0) {
        sqlParts.push(`-- --------------------------------------------------`);
        sqlParts.push(`-- 7. SEQUENCE STATES`);
        sqlParts.push(`-- --------------------------------------------------`);

        for (const seq of sequencesRes.rows) {
          try {
            const seqValRes = await client.query(`SELECT last_value, is_called FROM "${seq.sequence_name}"`);
            if (seqValRes.rows.length > 0) {
              const { last_value, is_called } = seqValRes.rows[0];
              sqlParts.push(`SELECT setval('"${seq.sequence_name}"', ${last_value}, ${is_called ? "true" : "false"});`);
            }
          } catch {}
        }
        sqlParts.push(`\n`);
      }

      sqlParts.push(`COMMIT;\n`);
      sqlParts.push(`-- DUMP COMPLETED SUCCESSFULLY`);

      const fullSql = sqlParts.join("\n");

      return {
        sqlContent: fullSql,
        databaseName,
        databaseProvider: "PostgreSQL (Native)",
        postgresVersion,
        tablesCount: tableNames.length,
        recordsCount: totalRecords,
        latestMigration,
        tableStats,
        generatedAt: new Date(),
      };
    } finally {
      if (client) {
        client.release();
      }
      await pool.end();
    }
  }

  /**
   * Acquires a database-level advisory lock to guarantee non-concurrent backups.
   * Returns an unlock function if lock was successfully acquired, or null if locked by another process.
   */
  public async tryAcquireBackupLock(): Promise<(() => Promise<void>) | null> {
    const pool = this.getCleanPool();
    const client = await pool.connect();
    const BACKUP_LOCK_ID = 8472910; // Fixed 32-bit advisory lock key for ERP Backup

    try {
      const res = await client.query("SELECT pg_try_advisory_lock($1) AS locked", [BACKUP_LOCK_ID]);
      const acquired = res.rows[0]?.locked === true;

      if (!acquired) {
        client.release();
        await pool.end();
        return null;
      }

      return async () => {
        try {
          await client.query("SELECT pg_advisory_unlock($1)", [BACKUP_LOCK_ID]);
        } finally {
          client.release();
          await pool.end();
        }
      };
    } catch (err) {
      client.release();
      await pool.end();
      throw err;
    }
  }
}
