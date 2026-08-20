import { getVosPool } from "./vos-db";

/**
 * Globally-unique ID allocator for VOS3000 MIT (Management Information Tree) tables.
 *
 * VOS3000's MIT loader builds one node tree from many tables (e_customer,
 * e_gatewaymapping, e_gatewayrouting, e_areacode, e_phone, e_user, e_mbx,
 * e_feerate, e_feerategroup, e_dns, ...). Node ids must be unique ACROSS all
 * of those tables — per-table AUTO_INCREMENT or MAX(id)+1 is unsafe and caused
 * "Node conflict" crashes in vos3000d.
 *
 * We allocate from a reserved high range (100,000,000+) so we can never collide
 * with ids VOS3000 allocates itself (which stay small). The counter persists in
 * VOS3000's own sequence table `e_othermaxid` (type `gui_mit`) and is bumped
 * atomically via LAST_INSERT_ID() on a single connection, so concurrent GUI
 * requests can never hand out the same id twice.
 */

const SEQ_TYPE = "gui_mit";
const SEQ_ROW_ID = 9000; // free id in e_othermaxid (existing rows: 229-233, 445)
const SEQ_BASE = 100000000;

/** Allocate one globally-unique MIT node id. */
export async function nextMitId(): Promise<number> {
  const conn = await getVosPool().getConnection();
  try {
    // Ensure the sequence row exists without overwriting its current value.
    await conn.execute(
      "INSERT INTO e_othermaxid (id, type, maxid) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE maxid = maxid",
      [SEQ_ROW_ID, SEQ_TYPE, SEQ_BASE]
    );
    await conn.execute(
      "UPDATE e_othermaxid SET maxid = LAST_INSERT_ID(maxid + 1) WHERE type = ?",
      [SEQ_TYPE]
    );
    const [rows] = await conn.query("SELECT LAST_INSERT_ID() AS id");
    const id = Number((rows as { id: unknown }[])[0]?.id) || 0;
    if (id < SEQ_BASE) throw new Error("MIT id allocator returned an out-of-range id");
    return id;
  } finally {
    conn.release();
  }
}

/** Allocate a contiguous block of `count` globally-unique MIT node ids. */
export async function nextMitIds(count: number): Promise<number[]> {
  if (count <= 0) return [];
  const conn = await getVosPool().getConnection();
  try {
    await conn.execute(
      "INSERT INTO e_othermaxid (id, type, maxid) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE maxid = maxid",
      [SEQ_ROW_ID, SEQ_TYPE, SEQ_BASE]
    );
    await conn.execute(
      "UPDATE e_othermaxid SET maxid = LAST_INSERT_ID(maxid + ?) WHERE type = ?",
      [count, SEQ_TYPE]
    );
    const [rows] = await conn.query("SELECT LAST_INSERT_ID() AS id");
    const end = Number((rows as { id: unknown }[])[0]?.id) || 0;
    if (end < SEQ_BASE + count - 1) throw new Error("MIT id allocator returned an out-of-range id");
    const ids: number[] = [];
    for (let i = end - count + 1; i <= end; i++) ids.push(i);
    return ids;
  } finally {
    conn.release();
  }
}
