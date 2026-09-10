/* The evidence upload client, against a stub server.

   What is worth asserting here is not that a POST happens. It is the four
   things that would quietly break the pipeline R5 exists to build:

     • the file goes up as ITSELF, not as base64 inside JSON — the whole
       reason a 4 MB certificate now survives;
     • the supplier's calls carry NO credential, because whoever opens a Smart
       Link has none, and the exporter opening the same link must not lend
       theirs to a route that has to work without it;
     • the name travels in the query string, encoded, so a name with a space
       or a hash does not truncate the URL;
     • a refusal from the server keeps its code, because the portal shows the
       server's own message and only the server knows whether it was a size, a
       type, or a file that was not what it claimed.
*/

import { test } from "node:test";
import assert from "node:assert/strict";

class MemoryStorage {
  private map = new Map<string, string>();
  getItem(key: string): string | null {
    return this.map.has(key) ? (this.map.get(key) as string) : null;
  }
  setItem(key: string, value: string): void {
    this.map.set(key, String(value));
  }
  removeItem(key: string): void {
    this.map.delete(key);
  }
  clear(): void {
    this.map.clear();
  }
}

const g = globalThis as unknown as { window?: unknown; localStorage?: unknown };
const storage = new MemoryStorage();
g.window = { localStorage: storage };
g.localStorage = storage;

const { configureApi } = await import("../api/config");
const { ApiError } = await import("../api/errors");
const { saveSession, clearSession } = await import("../api/session");
const { uploadDeclarationFile, uploadLinkFile, downloadFile, deleteFile, uploadLimits, listLinkFiles } =
  await import("../api/files");

type Captured = { url: string; init: RequestInit };

function stubServer(answer: () => Response): Captured[] {
  const calls: Captured[] = [];
  configureApi({
    baseUrl: "https://api.certrace.co",
    fetchImpl: (async (url: string | URL | Request, init?: RequestInit) => {
      calls.push({ url: String(url), init: init ?? {} });
      return answer();
    }) as unknown as typeof fetch,
  });
  return calls;
}

const storedFile = (over: Record<string, unknown> = {}) => ({
  id: "f-1",
  declarationId: "decl-1",
  docId: null,
  filename: "mill-cert.pdf",
  contentType: "application/pdf",
  sizeBytes: 4_200_000,
  sha256: "a".repeat(64),
  uploadedAt: 1_760_000_000_000,
  uploadedBySupplier: false,
  ...over,
});

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

/* A File is not in every Node build's globals the way Blob is, so the tests
   construct one only where the real class exists and fall back to a Blob with
   the two properties the client actually reads. */
function fileOf(name: string, type: string, bytes: Uint8Array): File {
  if (typeof File === "function") return new File([bytes as BlobPart], name, { type });
  const blob = new Blob([bytes as BlobPart], { type }) as Blob & { name: string };
  blob.name = name;
  return blob as unknown as File;
}

const PDF = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]);

test("the file goes up as itself, not wrapped in JSON", async () => {
  const calls = stubServer(() => json(storedFile()));
  saveSession({ accessToken: "tok", refreshToken: "r", user: { id: "u", email: "e@x.co", onboarded: true } });

  const file = fileOf("mill cert.pdf", "application/pdf", PDF);
  await uploadDeclarationFile("decl-1", file);

  const [call] = calls;
  assert.equal(call.init.method, "POST");
  assert.equal(
    (call.init.headers as Record<string, string>)["Content-Type"],
    "application/pdf",
    "the browser's own type for the file is what the server checks the bytes against",
  );
  assert.equal(call.init.body, file, "the File itself is the body — base64 in JSON costs a third more bytes");
  clearSession();
});

test("the filename travels encoded in the query string", async () => {
  const calls = stubServer(() => json(storedFile()));
  saveSession({ accessToken: "tok", refreshToken: "r", user: { id: "u", email: "e@x.co", onboarded: true } });

  await uploadDeclarationFile("decl 1/x", fileOf("cert #7 (final).pdf", "application/pdf", PDF), "iso-14064");

  const url = new URL(calls[0].url);
  assert.equal(url.pathname, "/api/v1/declarations/decl%201%2Fx/files");
  assert.equal(url.searchParams.get("filename"), "cert #7 (final).pdf");
  assert.equal(url.searchParams.get("docId"), "iso-14064");
  clearSession();
});

test("the exporter's upload carries their credential", async () => {
  const calls = stubServer(() => json(storedFile()));
  saveSession({ accessToken: "tok-abc", refreshToken: "r", user: { id: "u", email: "e@x.co", onboarded: true } });

  await uploadDeclarationFile("decl-1", fileOf("a.pdf", "application/pdf", PDF));

  assert.equal((calls[0].init.headers as Record<string, string>).Authorization, "Bearer tok-abc");
  clearSession();
});

test("a supplier's upload carries no credential, even when one is stored", async () => {
  /* The exporter opens the Smart Link in their own browser to see what the
     supplier sees. Their token must not travel to a route that has to work
     for someone who has none. */
  const calls = stubServer(() => json(storedFile({ uploadedBySupplier: true })));
  saveSession({ accessToken: "exporter-token", refreshToken: "r", user: { id: "u", email: "e@x.co", onboarded: true } });

  await uploadLinkFile("tok-123", fileOf("a.pdf", "application/pdf", PDF));
  await listLinkFiles("tok-123");

  for (const call of calls) {
    assert.equal(
      (call.init.headers as Record<string, string>).Authorization,
      undefined,
      `${call.url} must not carry the exporter's session`,
    );
  }
  clearSession();
});

test("a refusal keeps the server's code and message", async () => {
  stubServer(() =>
    json({ detail: { code: "FILE_TOO_LARGE", message: "That file is 41,000,000 bytes and the limit is 15,728,640." } }, 422),
  );
  saveSession({ accessToken: "tok", refreshToken: "r", user: { id: "u", email: "e@x.co", onboarded: true } });

  await assert.rejects(
    () => uploadDeclarationFile("decl-1", fileOf("huge.pdf", "application/pdf", PDF)),
    (error: unknown) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.code, "FILE_TOO_LARGE");
      assert.match(error.message, /15,728,640/, "the portal shows the server's own message");
      return true;
    },
  );
  clearSession();
});

test("a file the browser cannot type is refused before it is sent", async () => {
  /* An empty `type` would be declared as nothing, and the server refuses an
     upload with no declared type. Saying so here names the file. */
  const calls = stubServer(() => json(storedFile()));
  saveSession({ accessToken: "tok", refreshToken: "r", user: { id: "u", email: "e@x.co", onboarded: true } });

  await assert.rejects(
    () => uploadDeclarationFile("decl-1", fileOf("scan.xyz", "", PDF)),
    /did not recognise \.xyz/,
  );
  assert.equal(calls.length, 0, "nothing should reach the network");
  clearSession();
});

test("a download comes back as bytes, not as parsed JSON", async () => {
  stubServer(() => new Response(PDF as unknown as BodyInit, { status: 200, headers: { "Content-Type": "application/pdf" } }));
  saveSession({ accessToken: "tok", refreshToken: "r", user: { id: "u", email: "e@x.co", onboarded: true } });

  const blob = await downloadFile("f-1");
  assert.equal(blob.size, PDF.byteLength);
  clearSession();
});

test("a delete accepts the empty 204 body", async () => {
  stubServer(() => new Response(null, { status: 204 }));
  saveSession({ accessToken: "tok", refreshToken: "r", user: { id: "u", email: "e@x.co", onboarded: true } });

  await deleteFile("f-1");
  clearSession();
});

test("the limits are readable without a session", async () => {
  const calls = stubServer(() =>
    json({ maxBytes: 15_728_640, allowedContentTypes: ["application/pdf"], allowedExtensions: [".pdf"] }),
  );
  saveSession({ accessToken: "tok", refreshToken: "r", user: { id: "u", email: "e@x.co", onboarded: true } });

  const limits = await uploadLimits();
  assert.equal(limits.maxBytes, 15_728_640);
  assert.equal((calls[0].init.headers as Record<string, string>).Authorization, undefined);
  clearSession();
});
