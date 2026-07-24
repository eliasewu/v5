const mysql = require("mysql2/promise");
require("dotenv").config({ path: ".env" });

(async () => {
  const pool = mysql.createPool({
    host: process.env.VOS_DB_HOST || "127.0.0.1",
    port: parseInt(process.env.VOS_DB_PORT || "3306"),
    user: process.env.VOS_DB_USER || "root",
    password: process.env.VOS_DB_PASSWORD || "",
    database: process.env.VOS_DB_NAME || "vos3000",
  });

  // Bangladesh operators and their prefixes
  const opPrefixes = {
    Airtel: ["88016"],
    Banglalink: ["88014", "88019"],
    Grameenphone: ["88013", "88017"],
    Teletalk: ["88015"],
    Robi: ["88018"],
  };

  // Get all Bangladesh operators
  const [ops] = await pool.execute(
    "SELECT id, operator, mnc FROM e_mccmnc WHERE country='Bangladesh' ORDER BY operator"
  );
  console.log("=== Bangladesh Operators ===");
  for (const o of ops) console.log(`  ID=${o.id}  ${o.operator}  MNC=${o.mnc}`);

  console.log("\n=== Updating Prefixes ===");
  for (const o of ops) {
    let matched = null;
    for (const [keyword, prefixes] of Object.entries(opPrefixes)) {
      if (o.operator.toLowerCase().includes(keyword.toLowerCase())) {
        matched = prefixes;
        break;
      }
    }

    if (matched) {
      await pool.execute("DELETE FROM e_prefixes WHERE mccmnc_id = ?", [o.id]);
      for (const pfx of matched) {
        await pool.execute(
          "INSERT INTO e_prefixes (prefix, mccmnc_id) VALUES (?, ?)",
          [pfx, o.id]
        );
      }
      console.log(`  ${o.operator} (ID=${o.id}): ${matched.join(", ")}`);
    } else {
      console.log(`  ${o.operator} (ID=${o.id}): SKIPPED (Citycell — no prefix)`);
    }
  }

  // Show final state
  console.log("\n=== Final Bangladesh Prefixes ===");
  const [final] = await pool.execute(
    "SELECT p.prefix, m.operator FROM e_prefixes p LEFT JOIN e_mccmnc m ON p.mccmnc_id=m.id WHERE m.country='Bangladesh' ORDER BY m.operator, p.prefix"
  );
  for (const r of final) console.log(`  ${r.prefix} → ${r.operator}`);

  await pool.end();
  console.log("\n✅ Done");
})().catch((e) => console.error(e.message));
