// Run with: npx tsx src/scripts/add-routing-settings-columns.ts
// Adds missing columns to e_gatewayroutingsetting that the routing gateway UI expects.

import mysql from "mysql2/promise";

const DB_CONFIG = {
  host: process.env.VOS_DB_HOST || "127.0.0.1",
  port: parseInt(process.env.VOS_DB_PORT || "3306"),
  user: process.env.VOS_DB_USER || "root",
  password: process.env.VOS_DB_PASSWORD || "",
  database: process.env.VOS_DB_NAME || "vos3000",
};

const MIGRATIONS: { table: string; sql: string; description: string }[] = [
  // ── e_gatewayroutingsetting ──
  {
    table: "e_gatewayroutingsetting",
    sql: "ALTER TABLE e_gatewayroutingsetting ADD COLUMN localip VARCHAR(50) NOT NULL DEFAULT ''",
    description: "localip — local IP address for signaling",
  },
  {
    table: "e_gatewayroutingsetting",
    sql: "ALTER TABLE e_gatewayroutingsetting ADD COLUMN stopswitchafteruserbusy TINYINT NOT NULL DEFAULT 0",
    description: "stopswitchafteruserbusy — stop switch after user busy (0=Forbidden, 1=Allowed)",
  },
  {
    table: "e_gatewayroutingsetting",
    sql: "ALTER TABLE e_gatewayroutingsetting ADD COLUMN stopswitchaftersdp TINYINT NOT NULL DEFAULT 0",
    description: "stopswitchaftersdp — stop switch after receiving SDP (0=Forbidden, 1=Allowed)",
  },
  {
    table: "e_gatewayroutingsetting",
    sql: "ALTER TABLE e_gatewayroutingsetting ADD COLUMN stopswitchafterrtpstart TINYINT NOT NULL DEFAULT 0",
    description: "stopswitchafterrtpstart — stop switch after RTP starts (0=Forbidden, 1=Allowed)",
  },
  {
    table: "e_gatewayroutingsetting",
    sql: "ALTER TABLE e_gatewayroutingsetting ADD COLUMN stopswitchsipcodes VARCHAR(200) NOT NULL DEFAULT ''",
    description: "stopswitchsipcodes — comma-separated SIP error codes that trigger stop-switch",
  },
  {
    table: "e_gatewayroutingsetting",
    sql: "ALTER TABLE e_gatewayroutingsetting ADD COLUMN calculatequality TINYINT NOT NULL DEFAULT 0",
    description: "calculatequality — enable quality calculation (0=Default, 1=Enabled)",
  },
  {
    table: "e_gatewayroutingsetting",
    sql: "ALTER TABLE e_gatewayroutingsetting ADD COLUMN minprofitpercent INT NOT NULL DEFAULT 0",
    description: "minprofitpercent — minimum profit percentage threshold",
  },
  {
    table: "e_gatewayroutingsetting",
    sql: "ALTER TABLE e_gatewayroutingsetting ADD COLUMN maxsecondrates DECIMAL(10,4) NOT NULL DEFAULT 0",
    description: "maxsecondrates — maximum per-second rate cap",
  },
  {
    table: "e_gatewayroutingsetting",
    sql: "ALTER TABLE e_gatewayroutingsetting ADD COLUMN feeraterestrict TINYINT NOT NULL DEFAULT 0",
    description: "feeraterestrict — enable fee rate restriction (0=Disabled, 1=Enabled)",
  },
];

async function main() {
  console.log("🔌 Connecting to MySQL...");
  const pool = mysql.createPool(DB_CONFIG);

  try {
    const [version] = (await pool.execute("SELECT VERSION() as v")) as any;
    console.log(`✅ Connected. MySQL v${version[0].v}`);

    let added = 0;
    let skipped = 0;

    for (const m of MIGRATIONS) {
      try {
        await pool.execute(m.sql);
        console.log(`  ✅ ${m.description}`);
        added++;
      } catch (err: any) {
        if (err.code === "ER_DUP_FIELDNAME") {
          console.log(`  ⏭️  Skipped (already exists): ${m.description}`);
          skipped++;
        } else {
          console.error(`  ❌ Failed: ${m.description} — ${err.message}`);
        }
      }
    }

    console.log("\n═══════════════════════════════════");
    console.log(`   Added:   ${added}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`   Failed:  ${MIGRATIONS.length - added - skipped}`);
    console.log("═══════════════════════════════════");
    console.log("\n✅ Migration complete!");
  } catch (err: any) {
    console.error("❌ Fatal error:", err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
