import { api, result } from "./client";

export const sendInvite = (email: string) =>
  result(
    api().api.v1.team.invitations.post({ email: email.trim().toLowerCase() }),
  );
