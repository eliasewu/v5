import type { Migration } from "./types";

const migration: Migration = {
  name: "001_ip_limit_rate_column",
  description: "Add rate_limit_cps column to e_ip_limit table",

  async up(db) {
    try {
      await db.execute(
        "ALTER TABLE e_ip_limit ADD COLUMN rate_limit_cps INT DEFAULT 0"
      );
    } catch (err: any) {
      if (err?.code !== "ER_DUP_FIELDNAME") throw err;
    }
  },

  async down(db) {
    await db.execute("ALTER TABLE e_ip_limit DROP COLUMN rate_limit_cps");
  },
};

export default migration;
