import type { users } from "../generated/prisma/client";
import type { ProfileValues } from "../modules/master-data/profile-contract";
import { config } from "./config";

export const REGISTRATION_SHEET_HEADERS = [
  "user_id",
  "registered_at",
  "email",
  "first_name",
  "last_name",
  "company_name",
  "question_status",
  "sector",
  "job_title",
  "goals",
  "current_management",
  "biggest_challenges",
  "cbam_product_count",
  "supplier_count",
  "installation_count",
  "customer_count",
  "heard_about",
  "phone",
  "line_id",
] as const;

export type SheetUser = Pick<
  users,
  "id" | "created_at" | "email" | "first_name" | "last_name" | "company_name"
>;
export type SheetFetch = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

export function registrationSheetFields(
  user: SheetUser,
  profile: ProfileValues | null,
): Record<(typeof REGISTRATION_SHEET_HEADERS)[number], string> {
  const multiple = (items?: string[]) => items?.join(" | ") ?? "";
  return {
    user_id: user.id,
    registered_at: user.created_at.toISOString(),
    email: user.email,
    first_name: profile?.firstName || user.first_name || "",
    last_name: profile?.lastName || user.last_name || "",
    company_name: profile?.companyName || user.company_name || "",
    question_status: registrationQuestionsComplete(profile)
      ? "Completed"
      : "Pending",
    sector: profile?.sector ?? "",
    job_title: profile?.jobTitle ?? "",
    goals: multiple(profile?.goalAchieve),
    current_management: multiple(profile?.currentManagement),
    biggest_challenges: multiple(profile?.biggestChallenge),
    cbam_product_count: profile?.cbamProductCount ?? "",
    supplier_count: profile?.supplierCount ?? "",
    installation_count: profile?.installationCount ?? "",
    customer_count: profile?.customerCount ?? "",
    heard_about: profile?.hearAbout ?? "",
    phone: profile?.phone ?? "",
    line_id: profile?.lineId ?? "",
  };
}

/** Matches the required answers in the portal's onboardingQuestionsComplete. */
export function registrationQuestionsComplete(
  profile: ProfileValues | null,
): boolean {
  return Boolean(
    profile?.companyName?.trim() &&
      profile.sector &&
      profile.jobTitle?.trim() &&
      profile.goalAchieve?.length &&
      profile.currentManagement?.length &&
      profile.biggestChallenge?.length &&
      profile.cbamProductCount &&
      profile.supplierCount &&
      profile.installationCount &&
      profile.customerCount &&
      profile.hearAbout &&
      profile.phone?.trim() &&
      profile.lineId?.trim(),
  );
}

export async function postRegistrationSheet(
  url: string,
  user: SheetUser,
  profile: ProfileValues | null,
  fetcher: SheetFetch = fetch,
): Promise<void> {
  const body = new FormData();
  body.set("sheet", "Registrations");
  for (const [key, value] of Object.entries(
    registrationSheetFields(user, profile),
  ))
    body.set(key, value);
  const response = await fetcher(url, {
    method: "POST",
    body,
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok)
    throw new Error(`Registration Sheet request returned ${response.status}`);
  const result = (await response.json()) as {
    ok?: boolean;
    error?: string;
    sheet?: string;
  };
  if (!result.ok || result.sheet !== "Registrations")
    throw new Error(
      `Registration Sheet rejected submission: ${result.error ?? "unexpected response"}`,
    );
}

/** The database remains authoritative if the landing page's Sheet endpoint fails. */
const pendingSheetSyncs = new Map<string, Promise<void>>();

export function syncRegistrationSheet(
  user: SheetUser,
  profile: ProfileValues | null = null,
): Promise<void> {
  if (!config.registrationSheetWebhookUrl) return Promise.resolve();
  const previous = pendingSheetSyncs.get(user.id) ?? Promise.resolve();
  const current = previous
    .then(() =>
      postRegistrationSheet(config.registrationSheetWebhookUrl, user, profile),
    )
    .catch((error) => {
      console.error("Registration Sheet sync failed", user.id, error);
    });
  pendingSheetSyncs.set(user.id, current);
  void current.then(() => {
    if (pendingSheetSyncs.get(user.id) === current)
      pendingSheetSyncs.delete(user.id);
  });
  return current;
}
