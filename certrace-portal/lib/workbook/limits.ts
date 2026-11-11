/* The upload limits the server enforces (certrace-backend/src/modules/workbooks/model.ts).
   The client checks the same numbers so the reader sees a specific message before Confirm. */

export const UPLOAD_LIMITS = {
  files: 200,
  name: 255,
  type: 120,
  description: 1000,
} as const;

export type UploadProblem =
  | { field: "files"; max: number }
  | { field: "name" | "type" | "description"; max: number; file: string };

/** The first limit an upload breaks, or null when every file fits. */
export function uploadProblem(
  files: { name: string; type: string; description: string }[],
): UploadProblem | null {
  if (files.length > UPLOAD_LIMITS.files) return { field: "files", max: UPLOAD_LIMITS.files };
  for (const f of files) {
    if (f.name.length > UPLOAD_LIMITS.name) return { field: "name", max: UPLOAD_LIMITS.name, file: f.name };
    if (f.type.length > UPLOAD_LIMITS.type) return { field: "type", max: UPLOAD_LIMITS.type, file: f.name };
    // Untrimmed, as the server counts it: a padded description is refused here, not silently accepted.
    if (f.description.length > UPLOAD_LIMITS.description)
      return { field: "description", max: UPLOAD_LIMITS.description, file: f.name };
  }
  return null;
}
