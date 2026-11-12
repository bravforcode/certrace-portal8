export const config = {
  databaseUrl:
    process.env.DATABASE_URL ??
    "postgresql://certrace:certrace-local@localhost:55432/certrace",
  trustedProxyHops: Number(process.env.CERTRACE_TRUSTED_PROXY_HOPS ?? 0),
  port: Number(process.env.PORT ?? 8000),
  appUrl: process.env.CERTRACE_APP_BASE_URL ?? "http://localhost:3000",
  origins: (
    process.env.CERTRACE_CORS_ALLOWED_ORIGINS ?? "http://localhost:3000"
  )
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  jwtSecret: process.env.CERTRACE_JWT_SECRET ?? "",
  secureCookie: process.env.COOKIE_SECURE === "true",
  googleClientId: process.env.CERTRACE_GOOGLE_CLIENT_ID ?? "",
  registrationSheetWebhookUrl: process.env.CERTRACE_SHEET_WEBHOOK_URL ?? "",
  jobsToken: process.env.CERTRACE_JOBS_TOKEN ?? "",
  supplierEmails: process.env.CERTRACE_SUPPLIER_EMAILS === "1",
  maxUploadBytes: Number(process.env.CERTRACE_MAX_UPLOAD_BYTES ?? 15728640),
  fileStorage: process.env.CERTRACE_FILE_STORAGE ?? "database",
  r2Endpoint: process.env.R2_ENDPOINT ?? "",
  r2Bucket: process.env.R2_BUCKET ?? "",
  r2AccessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
  r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
  docs: process.env.CERTRACE_ENABLE_API_DOCS !== "false",
};
export const SESSION_COOKIE = "certrace_session";
export const SESSION_SECONDS = 7 * 24 * 60 * 60;

export function assertProductionConfig(
  env: Record<string, string | undefined> = process.env,
) {
  if (env.NODE_ENV !== "production") return;
  // Whitespace-only values count as missing, so every read is trimmed first.
  const get = (key: string) => (env[key] ?? "").trim();
  const problems: string[] = [];
  if (get("CERTRACE_JWT_SECRET").length < 32)
    problems.push("CERTRACE_JWT_SECRET must be at least 32 characters");
  if (!get("DATABASE_URL")) problems.push("DATABASE_URL is required");
  const mode = get("CERTRACE_EMAIL_DELIVERY");
  if (mode === "resend") {
    if (!get("RESEND_API_KEY") || !get("CERTRACE_EMAIL_SENDER"))
      problems.push("RESEND_API_KEY and CERTRACE_EMAIL_SENDER are required");
  } else if (mode === "smtp") {
    const missing = [
      "CERTRACE_SMTP_HOST",
      "CERTRACE_SMTP_PORT",
      "CERTRACE_SMTP_USER",
      "CERTRACE_SMTP_PASSWORD",
      "CERTRACE_EMAIL_SENDER",
    ].filter((k) => !get(k));
    if (missing.length)
      problems.push(`${missing.join(", ")} required for smtp`);
    const port = get("CERTRACE_SMTP_PORT");
    if (
      port &&
      !(/^\d+$/.test(port) && Number(port) >= 1 && Number(port) <= 65535)
    )
      problems.push("CERTRACE_SMTP_PORT must be an integer from 1 to 65535");
  } else problems.push("CERTRACE_EMAIL_DELIVERY must be resend or smtp");
  if (!get("CERTRACE_APP_BASE_URL").startsWith("https://"))
    problems.push("CERTRACE_APP_BASE_URL must be an https URL");
  if (get("CERTRACE_MASTER_PASSWORD"))
    problems.push("CERTRACE_MASTER_PASSWORD is no longer supported; remove it");
  if (problems.length)
    throw new Error(
      "Unsafe production configuration:\n- " + problems.join("\n- "),
    );
}
