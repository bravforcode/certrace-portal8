/* ════════════════════════════════════════════════════════════
   THE PORTAL'S DATA STORE — one import for every screen

   All TanStack Query hooks, one surface: screens say
   `import { useWorkspaces, useDeclaration } from "@/lib/store"` and never
   learn which domain sits on the real API (declarations) and which still
   sits on localStorage awaiting its backend (workspaces, suppliers). When a
   domain migrates, its hooks keep their names and the screens stay still.
   ════════════════════════════════════════════════════════════ */

export {
  useDeclarations,
  useDeclaration,
  useSaveDeclaration,
  useDeleteDeclaration,
} from "./declarations-query";

export {
  useWorkspaces,
  useArchivedWorkspaces,
  useKnownInstallations,
  useInvalidateWorkspaces,
  useCreateWorkspace,
  useUpdateWorkspace,
  useArchiveWorkspace,
  useRestoreWorkspace,
  useWorkspaceDrafts,
  useSaveWorkspaceDraft,
  useDeleteWorkspaceDraft,
} from "./workspaces-query";

export {
  useSupplierRows,
  useSupplierDirectory,
  useAddDirectorySupplier,
  useInvalidateSuppliers,
} from "./suppliers-query";
