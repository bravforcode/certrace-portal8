import { request } from "./api/http";
import { publicScope } from "./account-storage";
import { downloadFile, downloadLinkFile } from "./api/files";
const publicFiles = new Map<string, Blob>();
/** Resolve original evidence bytes for both account and token-scoped readers. */
export async function loadEvidenceFile(item: {
  serverFileId?: string;
  localFileId?: string;
  fileDataUrl?: string;
}): Promise<Blob | undefined> {
  if (item.serverFileId) {
    const scope = publicScope();
    return scope
      ? downloadLinkFile(
          decodeURIComponent(scope.split("/")[2]!),
          item.serverFileId,
        )
      : downloadFile(item.serverFileId);
  }
  if (item.localFileId) {
    const file = await loadDocumentFile(item.localFileId);
    if (file) return file;
  }
  if (item.fileDataUrl) {
    if (!item.fileDataUrl.startsWith("data:"))
      throw new Error(
        "The attached file has an invalid inline URL. Upload the original file again.",
      );
    const match = /^data:([^;,]*)(;base64)?,([\s\S]*)$/.exec(item.fileDataUrl);
    if (!match) throw new Error("The attached inline file could not be read.");
    const bytes = match[2]
      ? Uint8Array.from(atob(match[3]!), (c) => c.charCodeAt(0))
      : new TextEncoder().encode(decodeURIComponent(match[3]!));
    return new Blob([bytes], { type: match[1] || "application/octet-stream" });
  }
}
export async function storeDocumentFile(id: string, file: Blob): Promise<void> {
  const scope = publicScope();
  if (scope) {
    publicFiles.set(`${scope}:${id}`, file);
    return;
  }
  const name = file instanceof File ? file.name : id;
  await request(
    `/api/v1/account/files/${encodeURIComponent(id)}?filename=${encodeURIComponent(name)}`,
    { method: "PUT", rawBody: file, contentType: file.type },
  );
}
export async function loadDocumentFile(id: string): Promise<Blob | undefined> {
  const scope = publicScope();
  if (scope) return publicFiles.get(`${scope}:${id}`);
  try {
    return await request<Blob>(
      `/api/v1/account/files/${encodeURIComponent(id)}`,
      { responseType: "blob" },
    );
  } catch (e) {
    if (e && typeof e === "object" && "status" in e && e.status === 404)
      return undefined;
    throw e;
  }
}
/** Import is only invoked after the user chooses the account for old browser data. */
export async function importLegacyFiles(): Promise<number> {
  const db = await database();
  try {
    const entries = await new Promise<{ id: string; file: Blob }[]>(
      (resolve, reject) => {
        const rows: { id: string; file: Blob }[] = [];
        const request = db
          .transaction("files", "readonly")
          .objectStore("files")
          .openCursor();
        request.onsuccess = () => {
          const cursor = request.result;
          if (!cursor) {
            resolve(rows);
            return;
          }
          if (typeof cursor.key === "string" && cursor.value instanceof Blob)
            rows.push({ id: cursor.key, file: cursor.value });
          cursor.continue();
        };
        request.onerror = () => reject(request.error);
      },
    );
    for (const entry of entries) await storeDocumentFile(entry.id, entry.file);
    return entries.length;
  } finally {
    db.close();
  }
}
/** Keep uploaded originals out of localStorage, including pending reviews. */
function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("certrace-documents", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("files");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function documentDataUrl(id: string): Promise<string | undefined> {
  const file = await loadDocumentFile(id);
  if (!file) return;
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
