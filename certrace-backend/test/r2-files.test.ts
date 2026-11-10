import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  test,
} from "bun:test";
import { app } from "../src/app";
import { db } from "../src/lib/db";
import { config } from "../src/lib/config";
import { hash } from "../src/lib/security";
import { legalVersionIds } from "./fixtures/legal";
import { migrateFilesToR2 } from "../src/modules/files/migrate";
import {
  saveFileContent,
  validateFileStorage,
} from "../src/modules/files/storage";

// A real local S3 HTTP endpoint exercises Bun's R2 client, signing, and bytes.
// No Cloudflare credentials or production data are used by this suite.
const objects = new Map<string, Uint8Array>();
const multipart = new Map<string, Map<number, Uint8Array>>();
const originalConfig = { ...config };
const users: string[] = [];
const pdf = "%PDF-1.7\nR2 original evidence";
let unavailable = false;
let objectReads = 0;
let corruptReads = false;
let server: ReturnType<typeof Bun.serve>;
type Account = { cookie: string; user: { id: string } };
let owner: Account, other: Account;

function call(path: string, method = "GET", body?: unknown, cookie?: string) {
  return app.handle(
    new Request(`http://localhost${path}`, {
      method,
      headers: {
        ...(body === undefined ? {} : { "content-type": "application/json" }),
        ...(cookie ? { cookie, origin: "http://localhost:3000" } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  );
}
function upload(
  path: string,
  cookie?: string,
  bytes = pdf,
  type = "application/pdf",
) {
  return app.handle(
    new Request(`http://localhost${path}`, {
      method: path.includes("/account/") ? "PUT" : "POST",
      headers: {
        "content-type": type,
        ...(cookie ? { cookie, origin: "http://localhost:3000" } : {}),
      },
      body: bytes,
    }),
  );
}
async function account(): Promise<Account> {
  const response = await call("/api/auth/register", "POST", {
    email: `r2-${crypto.randomUUID()}@example.invalid`,
    password: "r2-test-password-123",
    termsAccepted: true,
    privacyAccepted: true,
    marketingOptIn: false,
    ...(await legalVersionIds()),
  });
  expect(response.status).toBe(201);
  const result = await response.json();
  users.push(result.user.id);
  await db.users.update({
    where: { id: result.user.id },
    data: { ready: true },
  });
  return {
    ...result,
    cookie: response.headers.get("set-cookie")!.split(";")[0]!,
  };
}
function enableR2() {
  Object.assign(config, {
    fileStorage: "r2",
    r2Endpoint: server.url.origin,
    r2Bucket: "private-files",
    r2AccessKeyId: "synthetic-access-key",
    r2SecretAccessKey: "synthetic-secret-key",
  });
}
beforeAll(async () => {
  server = Bun.serve({
    hostname: "127.0.0.1",
    port: 0,
    async fetch(request) {
      expect(request.headers.get("authorization")).toStartWith(
        "AWS4-HMAC-SHA256 ",
      );
      if (unavailable)
        return new Response("<Error><Code>ServiceUnavailable</Code></Error>", {
          status: 503,
        });
      const url = new URL(request.url),
        key = decodeURIComponent(url.pathname);
      if (request.method === "POST" && url.searchParams.has("uploads")) {
        const id = crypto.randomUUID();
        multipart.set(id, new Map());
        return new Response(
          `<InitiateMultipartUploadResult><Bucket>private-files</Bucket><Key>${key}</Key><UploadId>${id}</UploadId></InitiateMultipartUploadResult>`,
          { headers: { "content-type": "application/xml" } },
        );
      }
      const uploadId = url.searchParams.get("uploadId");
      if (uploadId && request.method === "PUT") {
        multipart
          .get(uploadId)!
          .set(
            Number(url.searchParams.get("partNumber")),
            new Uint8Array(await request.arrayBuffer()),
          );
        return new Response(null, { headers: { etag: '"test-part"' } });
      }
      if (uploadId && request.method === "POST") {
        const parts = [...multipart.get(uploadId)!.entries()]
          .sort((a, b) => a[0] - b[0])
          .map(([, bytes]) => bytes);
        objects.set(key, Buffer.concat(parts));
        multipart.delete(uploadId);
        return new Response(
          `<CompleteMultipartUploadResult><ETag>"complete"</ETag></CompleteMultipartUploadResult>`,
          { headers: { "content-type": "application/xml" } },
        );
      }
      if (request.method === "PUT") {
        objects.set(key, new Uint8Array(await request.arrayBuffer()));
        return new Response(null, { headers: { etag: '"test-file"' } });
      }
      if (request.method === "DELETE") {
        objects.delete(key);
        return new Response(null, { status: 204 });
      }
      if (request.method === "GET" || request.method === "HEAD") {
        objectReads++;
        const bytes = objects.get(key);
        if (!bytes)
          return new Response("<Error><Code>NoSuchKey</Code></Error>", {
            status: 404,
          });
        const body = corruptReads
          ? new TextEncoder().encode("corrupted")
          : new Uint8Array(bytes);
        return new Response(request.method === "HEAD" ? null : body, {
          headers: { "content-length": String(body.length) },
        });
      }
      return new Response(null, { status: 400 });
    },
  });
  owner = await account();
  other = await account();
});
afterEach(() => {
  Object.assign(config, originalConfig);
  unavailable = false;
  corruptReads = false;
});
afterAll(async () => {
  await db.users.deleteMany({ where: { id: { in: users } } });
  await server.stop(true);
  await db.$disconnect();
});

describe("private R2 files", () => {
  test("uploads store only R2 references and keep account authorization before reads", async () => {
    enableR2();
    const id = crypto.randomUUID();
    const response = await upload(
      `/api/v1/account/files/${id}?filename=evidence.pdf`,
      owner.cookie,
    );
    expect(response.status).toBe(200);
    const row = await db.account_files.findUniqueOrThrow({
      where: { user_id_id: { user_id: owner.user.id, id } },
    });
    expect(row.data).toBeNull();
    expect(row.object_key).toStartWith(`files/${owner.user.id}/`);
    const before = objectReads;
    expect(
      (
        await call(
          `/api/v1/account/files/${id}`,
          "GET",
          undefined,
          other.cookie,
        )
      ).status,
    ).toBe(404);
    expect(objectReads).toBe(before);
    const downloaded = await call(
      `/api/v1/account/files/${id}`,
      "GET",
      undefined,
      owner.cookie,
    );
    expect(downloaded.status).toBe(200);
    expect(await downloaded.text()).toBe(pdf);
    expect(downloaded.headers.get("content-disposition")).toContain(
      "evidence.pdf",
    );
    expect(JSON.stringify(await response.json())).not.toContain("object_key");
  });
  test("failed uploads preserve the prior file; replacements use a new key", async () => {
    enableR2();
    const id = crypto.randomUUID(),
      path = `/api/v1/account/files/${id}?filename=original.pdf`;
    expect((await upload(path, owner.cookie)).status).toBe(200);
    const where = { user_id_id: { user_id: owner.user.id, id } },
      original = await db.account_files.findUniqueOrThrow({ where });
    unavailable = true;
    const failed = await upload(path, owner.cookie, pdf + " replacement");
    expect(failed.status).toBe(503);
    expect(await db.account_files.findUniqueOrThrow({ where })).toEqual(
      original,
    );
    unavailable = false;
    expect(
      (await upload(path, owner.cookie, pdf + " replacement")).status,
    ).toBe(200);
    const replaced = await db.account_files.findUniqueOrThrow({ where });
    expect(replaced.object_key).not.toBe(original.object_key);
    expect(objects.has(`/private-files/${original.object_key}`)).toBe(false);
    expect(
      await (
        await call(
          `/api/v1/account/files/${id}`,
          "GET",
          undefined,
          owner.cookie,
        )
      ).text(),
    ).toBe(pdf + " replacement");
    const count = objects.size;
    await expect(
      saveFileContent(
        owner.user.id,
        Buffer.from(pdf),
        "application/pdf",
        async () => {
          throw new Error("SQL rejected");
        },
      ),
    ).rejects.toThrow("SQL rejected");
    expect(objects.size).toBe(count);
  });
  test("supplier files remain token scoped and owner downloads/deletion work", async () => {
    enableR2();
    const id = `r2-${crypto.randomUUID()}`;
    expect(
      (
        await call(
          `/api/v1/declarations/${id}`,
          "PUT",
          {
            id,
            suppliers: [
              { id: "one", name: "Synthetic mill" },
              { id: "two", name: "Other mill" },
            ],
            requests: [],
          },
          owner.cookie,
        )
      ).status,
    ).toBe(200);
    const tokens = [];
    for (const supplierId of ["one", "two"]) {
      const result = await call(
        `/api/v1/declarations/${id}/links`,
        "POST",
        { supplierId },
        owner.cookie,
      );
      expect(result.status).toBe(201);
      tokens.push((await result.json()).token);
    }
    const response = await upload(
      `/api/v1/links/${tokens[0]}/files?filename=supplier.pdf`,
    );
    expect(response.status).toBe(201);
    const file = await response.json();
    const row = await db.uploaded_files.findUniqueOrThrow({
      where: { id: file.id },
    });
    expect(row.data).toBeNull();
    expect(row.object_key).toBeTruthy();
    expect(
      (await call(`/api/v1/links/${tokens[1]}/files/${file.id}`)).status,
    ).toBe(404);
    expect(
      await (await call(`/api/v1/links/${tokens[0]}/files/${file.id}`)).text(),
    ).toBe(pdf);
    expect(
      await (
        await call(`/api/v1/files/${file.id}`, "GET", undefined, owner.cookie)
      ).text(),
    ).toBe(pdf);
    expect(
      (
        await call(
          `/api/v1/files/${file.id}`,
          "DELETE",
          undefined,
          other.cookie,
        )
      ).status,
    ).toBe(404);
    expect(
      (
        await call(
          `/api/v1/files/${file.id}`,
          "DELETE",
          undefined,
          owner.cookie,
        )
      ).status,
    ).toBe(204);
    expect(objects.has(`/private-files/${row.object_key}`)).toBe(false);
    const direct = await upload(
      `/api/v1/declarations/${id}/files?filename=owner.pdf`,
      owner.cookie,
    );
    expect(direct.status).toBe(201);
    const directFile = await direct.json();
    const directRow = await db.uploaded_files.findUniqueOrThrow({
      where: { id: directFile.id },
    });
    expect(
      await (
        await call(
          `/api/v1/files/${directFile.id}`,
          "GET",
          undefined,
          owner.cookie,
        )
      ).text(),
    ).toBe(pdf);
    expect(
      (
        await call(
          `/api/v1/declarations/${id}`,
          "DELETE",
          undefined,
          owner.cookie,
        )
      ).status,
    ).toBe(204);
    expect(objects.has(`/private-files/${directRow.object_key}`)).toBe(false);
  });
  test("large valid uploads survive byte-for-byte object storage downloads", async () => {
    enableR2();
    const id = crypto.randomUUID(),
      bytes = "a,b\n".repeat(1_600_000);
    expect(
      (
        await upload(
          `/api/v1/account/files/${id}?filename=large.csv`,
          owner.cookie,
          bytes,
          "text/csv",
        )
      ).status,
    ).toBe(200);
    const downloaded = await call(
      `/api/v1/account/files/${id}`,
      "GET",
      undefined,
      owner.cookie,
    );
    expect(hash(new Uint8Array(await downloaded.arrayBuffer()))).toBe(
      hash(bytes),
    );
  }, 15000);
  test("legacy files copy with matching hashes; reruns preserve IDs and only explicit pruning clears bytes", async () => {
    config.fileStorage = "database";
    const id = crypto.randomUUID();
    expect(
      (
        await upload(
          `/api/v1/account/files/${id}?filename=legacy.pdf`,
          owner.cookie,
        )
      ).status,
    ).toBe(200);
    const where = { user_id_id: { user_id: owner.user.id, id } },
      legacy = await db.account_files.findUniqueOrThrow({ where });
    const declarationId = `legacy-${crypto.randomUUID()}`;
    expect(
      (
        await call(
          `/api/v1/declarations/${declarationId}`,
          "PUT",
          { id: declarationId },
          owner.cookie,
        )
      ).status,
    ).toBe(200);
    const legacyResponse = await upload(
      `/api/v1/declarations/${declarationId}/files?filename=legacy-link.pdf`,
      owner.cookie,
    );
    expect(legacyResponse.status).toBe(201);
    const legacyFile = await legacyResponse.json();
    enableR2();
    expect(
      await (
        await call(
          `/api/v1/account/files/${id}`,
          "GET",
          undefined,
          owner.cookie,
        )
      ).text(),
    ).toBe(pdf);
    expect((await migrateFilesToR2()).copied).toBeGreaterThan(0);
    const copied = await db.account_files.findUniqueOrThrow({ where });
    expect(copied.data).toEqual(legacy.data);
    expect(copied.object_key).toBeTruthy();
    expect(copied.sha256).toBe(legacy.sha256);
    expect(copied.created_at).toEqual(legacy.created_at);
    expect((await migrateFilesToR2()).copied).toBe(0);
    corruptReads = true;
    await expect(migrateFilesToR2(true)).rejects.toThrow();
    expect((await db.account_files.findUniqueOrThrow({ where })).data).toEqual(
      legacy.data,
    );
    corruptReads = false;
    expect(
      (await migrateFilesToR2(true)).databaseCopiesCleared,
    ).toBeGreaterThan(0);
    expect(
      (await db.account_files.findUniqueOrThrow({ where })).data,
    ).toBeNull();
    const migratedUpload = await db.uploaded_files.findUniqueOrThrow({
      where: { id: legacyFile.id },
    });
    expect(migratedUpload.data).toBeNull();
    expect(migratedUpload.object_key).toBeTruthy();
    expect(migratedUpload.filename).toBe("legacy-link.pdf");
    expect(
      await (
        await call(
          `/api/v1/files/${legacyFile.id}`,
          "GET",
          undefined,
          owner.cookie,
        )
      ).text(),
    ).toBe(pdf);
    expect(
      await (
        await call(
          `/api/v1/account/files/${id}`,
          "GET",
          undefined,
          owner.cookie,
        )
      ).text(),
    ).toBe(pdf);
  });
  test("missing storage objects and invalid config fail without exposing credentials", async () => {
    enableR2();
    const id = crypto.randomUUID();
    expect(
      (
        await upload(
          `/api/v1/account/files/${id}?filename=missing.pdf`,
          owner.cookie,
        )
      ).status,
    ).toBe(200);
    const row = await db.account_files.findUniqueOrThrow({
      where: { user_id_id: { user_id: owner.user.id, id } },
    });
    objects.delete(`/private-files/${row.object_key}`);
    const response = await call(
      `/api/v1/account/files/${id}`,
      "GET",
      undefined,
      owner.cookie,
    );
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain("synthetic-secret-key");
    config.r2SecretAccessKey = "";
    expect(() => validateFileStorage()).toThrow();
    expect(
      (
        await upload(
          `/api/v1/account/files/${crypto.randomUUID()}?filename=failed.pdf`,
          owner.cookie,
        )
      ).status,
    ).toBe(503);
  });
});
