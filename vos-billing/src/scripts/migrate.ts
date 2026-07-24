#!/usr/bin/env npx tsx
/**
 * Database Migration Runner
 *
 * Usage: npx tsx src/scripts/migrate.ts
 *   or:  npm run migrate
 *
 * Discovers migration files in the migrations/ directory, applies pending
 * migrations in order, and records them in the _migrations tracking table.
 */

import mysql from "mysql2/promise";
import * as fs from "fs";
import * as path from "path";

const DB_CONFIG = {
  host: process.env.VOS_DB_HOST || "127.0.0.1",
  port: parseInt(process.env.VOS_DB_PORT || "3306"),
  user: process.env.VOS_DB_USER || "root",
  password: process.env.VOS_DB_PASSWORD || "",
  database: process.env.VOS_DB_NAME || "vos3000",
};

const TRACKING_TABLE = "_migrations";
const MIGRATIONS_DIR = path.resolve(__dirname, "../../migrations");

interface MigrationModule {
  default: {
    name: string;
    description: string;
    up(db: mysql.Pool): Promise<void>;
    down?(db: mysql.Pool): Promise<void>;
  };
}

async function ensureTrackingTable(db: mysql.Pool): Promise<void> {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS \`${TRACKING_TABLE}\` (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_name (name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8
  `);
}

async function getAppliedMigrations(db: mysql.Pool): Promise<Set<string>> {
  const [rows] = (await db.execute(
    `SELECT name FROM \`${TRACKING_TABLE}\` ORDER BY id ASC`
  )) as any;
  return new Set((rows as any[]).map((r) => r.name));
}

async function recordMigration(
  db: mysql.Pool,
  name: string
): Promise<void> {
  await db.execute(
    `INSERT INTO \`${TRACKING_TABLE}\` (name, applied_at) VALUES (?, NOW())`,
    [name]
  );
}

async function discoverMigrations(): Promise<MigrationModule[]> {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    console.error(`❌ Migrations directory not found: ${MIGRATIONS_DIR}`);
    process.exit(1);
  }

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter(
      (f) =>
        /^\d{3}_.+\.ts$/.test(f) || /^\d{3}_.+\.js$/.test(f)
    )
    .sort();

  const migrations: MigrationModule[] = [];
  for (const file of files) {
    const fullPath = path.join(MIGRATIONS_DIR, file);
    // Dynamic import for ESM compatibility
    const mod = await import(fullPath);
    if (!mod.default || !mod.default.name || !mod.default.up) {
      console.warn(`⚠️  Skipping ${file}: missing default export with name/up`);
      continue;
    }
    migrations.push(mod);
  }
  return migrations;
}

async function main() {
  const args = process.argv.slice(2);
  const isStatus = args.includes("--status") || args.includes("-s");

  console.log("🔌 Connecting to MySQL...");
  const db = mysql.createPool(DB_CONFIG);

  try {
    const [version] = (await db.execute("SELECT VERSION() as v")) as any;
    console.log(`✅ Connected. MySQL v${version[0].v}`);

    await ensureTrackingTable(db);
    const applied = await getAppliedMigrations(db);
    const migrations = await discoverMigrations();

    if (migrations.length === 0) {
      console.log("📭 No migration files found.");
      return;
    }

    if (isStatus) {
      console.log(`\n📋 Migration Status (${migrations.length} total):\n`);
      for (const m of migrations) {
        const mig = m.default;
        const status = applied.has(mig.name) ? "✅ Applied" : "⏳ Pending";
        console.log(`  ${status}  ${mig.name} — ${mig.description}`);
      }
      return;
    }

    const pending = migrations.filter((m) => !applied.has(m.default.name));

    if (pending.length === 0) {
      console.log("✅ All migrations are already applied.");
      return;
    }

    console.log(`\n📦 Applying ${pending.length} pending migration(s)...\n`);

    for (const m of pending) {
      const mig = m.default;
      console.log(`  ▶ ${mig.name} — ${mig.description}`);
      try {
        await mig.up(db);
        await recordMigration(db, mig.name);
        console.log(`  ✅ ${mig.name} — applied successfully`);
      } catch (err: any) {
        console.error(`  ❌ ${mig.name} — FAILED: ${err.message}`);
        process.exit(1);
      }
    }

    console.log("\n═══════════════════════════════════");
    console.log(`   ✅ ${pending.length} migration(s) applied`);
    console.log("═══════════════════════════════════");
  } catch (err: any) {
    console.error("❌ Fatal error:", err.message);
    await db.end();
    process.exit(1);
  } finally {
    await db.end();
  }
}

main();
