import { db } from "../../lib/db";
import { config } from "../../lib/config";
import { hash } from "../../lib/security";
import {
  cleanupUnusedFileObject,
  readFileContent,
  storeFileContent,
  validateFileStorage,
} from "./storage";

/** Copy first; only an explicit second pass removes verified database copies.
 * Compare the original key/hash when updating so concurrent replacements win. */
export async function migrateFilesToR2(clearDbBytes = false) {
  validateFileStorage();
  if (config.fileStorage !== "r2")
    throw new Error("Set CERTRACE_FILE_STORAGE=r2 before migrating files.");
  const counts = {
    copied: 0,
    databaseCopiesCleared: 0,
    changedConcurrently: 0,
  };
  for (const table of ["account_files", "uploaded_files"] as const) {
    while (true) {
      const where = {
        data: { not: null },
        ...(!clearDbBytes ? { object_key: null } : {}),
      };
      const rows =
        table === "account_files"
          ? await db.account_files.findMany({ where, take: 1 })
          : await db.uploaded_files.findMany({ where, take: 1 });
      if (!rows.length) break;
      for (const row of rows) {
        if (!row.data || hash(row.data) !== row.sha256)
          throw new Error(
            `File integrity check failed in ${table}; database bytes retained.`,
          );
        const stored = row.object_key
          ? { object_key: row.object_key, data: null }
          : await storeFileContent(row.user_id, row.data, row.content_type);
        try {
          await readFileContent({ ...stored, sha256: row.sha256 });
          const unchanged = {
            user_id: row.user_id,
            id: row.id,
            sha256: row.sha256,
            object_key: row.object_key,
            data: { not: null },
          };
          const data = {
            object_key: stored.object_key,
            ...(clearDbBytes ? { data: null } : {}),
          };
          const result =
            table === "account_files"
              ? await db.account_files.updateMany({ where: unchanged, data })
              : await db.uploaded_files.updateMany({ where: unchanged, data });
          if (!result.count) {
            counts.changedConcurrently++;
            if (!row.object_key)
              await cleanupUnusedFileObject(stored.object_key);
            continue;
          }
          if (!row.object_key) counts.copied++;
          if (clearDbBytes) counts.databaseCopiesCleared++;
        } catch (error) {
          if (!row.object_key) await cleanupUnusedFileObject(stored.object_key);
          throw error;
        }
      }
    }
  }
  return counts;
}
