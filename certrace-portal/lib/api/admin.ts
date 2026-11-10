import { api, result } from "./client";

export async function listAdminUsers(search = "", cursor?: string) {
  return result(
    api().api.admin.users.get({
      query: { search, ...(cursor ? { cursor } : {}) },
    }),
  );
}

export type AdminUser = Awaited<
  ReturnType<typeof listAdminUsers>
>["users"][number];

export async function setAdminUserReady(id: string, ready: boolean) {
  return result(api().api.admin.users({ id }).ready.put({ ready }));
}

export async function rejectAdminUser(id: string, reason: string) {
  return result(api().api.admin.users({ id }).reject.post({ reason }));
}

export async function extendAdminTrial(id: string, days: number) {
  return result(api().api.admin.users({ id })["extend-trial"].post({ days }));
}
