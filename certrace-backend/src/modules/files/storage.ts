import { S3Client } from "bun";
import { config } from "../../lib/config";
import { fail } from "../../lib/errors";
import { hash } from "../../lib/security";
import { db } from "../../lib/db";

export type FileContent = {
  data: Uint8Array | null;
  object_key: string | null;
  sha256: string;
};

export function validateFileStorage() {
  if (!["database", "r2"].includes(config.fileStorage))
    throw new Error("CERTRACE_FILE_STORAGE must be database or r2.");
  if (config.fileStorage === "r2") r2();
}

function r2() {
  if (
    !config.r2Endpoint ||
    !config.r2Bucket ||
    !config.r2AccessKeyId ||
    !config.r2SecretAccessKey
  )
    fail(503, "FILE_STORAGE_CONFIG", "R2 file storage is not configured.");
  let endpoint: URL;
  try {
    endpoint = new URL(config.r2Endpoint);
  } catch {
    fail(503, "FILE_STORAGE_CONFIG", "R2_ENDPOINT must be a valid URL.");
  }
  if (
    endpoint.username ||
    endpoint.password ||
    endpoint.search ||
    endpoint.hash ||
    endpoint.pathname !== "/" ||
    (endpoint.protocol !== "https:" &&
      !(
        endpoint.protocol === "http:" &&
        ["localhost", "127.0.0.1"].includes(endpoint.hostname)
      ))
  )
    fail(503, "FILE_STORAGE_CONFIG", "Use the R2 S3 API HTTPS endpoint.");
  return new S3Client({
    endpoint: endpoint.origin,
    bucket: config.r2Bucket,
    accessKeyId: config.r2AccessKeyId,
    secretAccessKey: config.r2SecretAccessKey,
    region: "auto",
    virtualHostedStyle: false,
    retry: 1,
  });
}

export async function readFileContent(row: FileContent): Promise<Uint8Array> {
  let bytes: Uint8Array;
  if (row.object_key) {
    const client = r2();
    try {
      bytes = new Uint8Array(await client.file(row.object_key).arrayBuffer());
    } catch {
      fail(
        503,
        "FILE_STORAGE_UNAVAILABLE",
        "The file could not be read from storage. Please try again.",
      );
    }
  } else if (row.data) bytes = row.data;
  else
    fail(
      410,
      "FILE_CONTENT_MISSING",
      "The file contents are no longer stored.",
    );
  if (hash(bytes) !== row.sha256)
    fail(
      503,
      "FILE_CONTENT_MISMATCH",
      "The stored file failed its integrity check.",
    );
  return bytes;
}

export async function storeFileContent(
  userId: string,
  bytes: Uint8Array,
  contentType: string,
): Promise<{
  data: Uint8Array<ArrayBuffer> | null;
  object_key: string | null;
}> {
  validateFileStorage();
  if (config.fileStorage === "database")
    return { data: new Uint8Array(bytes), object_key: null };
  const client = r2();
  const key = `files/${userId}/${crypto.randomUUID()}`;
  try {
    await client.file(key).write(bytes, { type: contentType });
    return { data: null, object_key: key };
  } catch {
    fail(
      503,
      "FILE_STORAGE_UNAVAILABLE",
      "The file could not be saved to storage. Please try again.",
    );
  }
}

/** SQL remains the access authority. A failed cleanup must not undo a committed
 * replacement or deletion; retain the private orphan and log its key for cleanup. */
export async function cleanupFileObject(key: string | null) {
  if (!key) return;
  try {
    await r2().file(key).delete();
  } catch {
    console.error("R2 orphan cleanup failed; private object retained:", key);
  }
}

// A connection failure can make a commit's outcome uncertain. Never remove
// an object if SQL may already reference it, or SQL cannot confirm it is unused.
export async function cleanupUnusedFileObject(key: string | null) {
  if (!key) return;
  try {
    const references =
      (await db.account_files.count({ where: { object_key: key } })) +
      (await db.uploaded_files.count({ where: { object_key: key } }));
    if (!references) await cleanupFileObject(key);
  } catch {
    console.error(
      "R2 cleanup could not confirm SQL state; private object retained:",
      key,
    );
  }
}

/** Persist metadata only after R2 has accepted the bytes. On SQL failure the
 * new object is unused; a retry always writes a fresh immutable object key. */
export async function saveFileContent<T>(
  userId: string,
  bytes: Uint8Array,
  contentType: string,
  save: (content: {
    data: Uint8Array<ArrayBuffer> | null;
    object_key: string | null;
  }) => Promise<T>,
): Promise<T> {
  const content = await storeFileContent(userId, bytes, contentType);
  try {
    return await save(content);
  } catch (error) {
    await cleanupUnusedFileObject(content.object_key);
    throw error;
  }
}
