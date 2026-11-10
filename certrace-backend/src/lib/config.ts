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
  masterPassword: process.env.CERTRACE_MASTER_PASSWORD ?? "",
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
