import type { QueryClient } from "@tanstack/react-query";
import { flushAccount } from "./account-storage";
export async function persistReportChange<T>(
  action: () => T | Promise<T>,
): Promise<T> {
  const value = await action();
  await flushAccount();
  return value;
}
const roots = new Set([
  "workspaces",
  "workspace-data",
  "installations",
  "suppliers",
  "supplier-companies",
  "precursor-suppliers",
]);
export const invalidateReportViews = (client: QueryClient) =>
  client.invalidateQueries({
    predicate: (q) => roots.has(String(q.queryKey[0])),
  });
