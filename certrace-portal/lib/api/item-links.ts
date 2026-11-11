/* Smart Links for one Convert checklist item.

   A member creates the link; whoever holds it opens the same fill-in form with no
   account. The token alone decides the installation, year and item on the server,
   so the public calls send nothing else and run with `auth: false`. */

import { api, result } from "./client";

export type ItemLinkField = {
  key: string;
  label: string;
  section: string;
  kind: "text" | "number" | "date" | "select";
  unit?: string;
  options?: string[];
  optional?: boolean;
  value: string;
};

export type ItemLinkResolution = {
  token: string;
  itemKey: string;
  label: string;
  year: number;
  expiresAt: number;
  fields: ItemLinkField[];
};

export async function createItemLink(input: {
  installationId: string;
  year: number;
  itemKey: string;
}): Promise<{ token: string; path: string; expiresAt: number }> {
  return result(api().api.v1["item-links"].post(input));
}

export async function resolveItemLink(token: string): Promise<ItemLinkResolution> {
  return (await result(
    api(false).api.v1["item-links"]({ token: encodeURIComponent(token) }).get(),
  )) as ItemLinkResolution;
}

export async function submitItemLink(token: string, values: Record<string, string | null>) {
  return result(
    api(false).api.v1["item-links"]({ token: encodeURIComponent(token) }).submit.post({ values }),
  );
}
