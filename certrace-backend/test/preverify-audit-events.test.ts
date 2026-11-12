import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

// The decide() transaction writes account_audit_events with event `preverification.${decision}`.
// The database CHECK constraint must allow both decisions, or Approve / Request changes returns 500.
const MIGRATIONS = join(import.meta.dir, "..", "prisma", "migrations");

function latestConstraintMigration(): string {
  const folders = readdirSync(MIGRATIONS).sort().reverse();
  for (const folder of folders) {
    const path = join(MIGRATIONS, folder, "migration.sql");
    let sql: string;
    try {
      sql = readFileSync(path, "utf8");
    } catch {
      continue;
    }
    if (sql.includes("account_audit_events_event_check")) return sql;
  }
  throw new Error("no migration defines account_audit_events_event_check");
}

describe("account_audit_events event constraint", () => {
  test("allows the pre-verification decisions that decide() writes", () => {
    // Without these values Postgres rejects the audit insert (23514) after the status update, so the admin sees a 500.
    const sql = latestConstraintMigration();
    expect(sql).toContain("'preverification.approved'");
    expect(sql).toContain("'preverification.changes_requested'");
  });

  test("keeps the team and admin events that were already allowed", () => {
    // Re-creating the constraint must not drop the existing values, or team invites and admin actions start failing.
    const sql = latestConstraintMigration();
    for (const event of ["SUSPENDED", "team.invite.created", "ADMIN_TRIAL_EXTENDED"]) {
      expect(sql).toContain(`'${event}'`);
    }
  });
});
