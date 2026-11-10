import { describe, expect, test } from "bun:test";
import { assertProductionConfig } from "../src/lib/config";

// Production must refuse to start with secrets or email missing, because a
// silent default (empty JWT secret, email "off") locks customers out of
// password reset and approval mail without any visible error.
describe("assertProductionConfig", () => {
  const complete = {
    NODE_ENV: "production",
    CERTRACE_JWT_SECRET: "x".repeat(48),
    DATABASE_URL: "postgresql://u:p@db:5432/certrace",
    CERTRACE_EMAIL_DELIVERY: "resend",
    RESEND_API_KEY: "re_test",
    CERTRACE_EMAIL_SENDER: "Certrace <no-reply@certrace.co>",
    CERTRACE_APP_BASE_URL: "https://portal.certrace.co",
  };
  test("accepts a complete production environment", () => {
    expect(() => assertProductionConfig(complete)).not.toThrow();
  });
  test("ignores non-production environments", () => {
    expect(() => assertProductionConfig({ NODE_ENV: "development" })).not.toThrow();
  });
  test("lists every missing or unsafe setting", () => {
    expect(() =>
      assertProductionConfig({
        ...complete,
        CERTRACE_JWT_SECRET: "short",
        CERTRACE_EMAIL_DELIVERY: "off",
        CERTRACE_MASTER_PASSWORD: "anything",
      }),
    ).toThrow(
      /CERTRACE_JWT_SECRET.*CERTRACE_EMAIL_DELIVERY.*CERTRACE_MASTER_PASSWORD/s,
    );
  });
  test("accepts a complete SMTP environment", () => {
    const { RESEND_API_KEY: _unused, ...rest } = complete;
    expect(() =>
      assertProductionConfig({
        ...rest,
        CERTRACE_EMAIL_DELIVERY: "smtp",
        CERTRACE_SMTP_HOST: "smtp.example.com",
        CERTRACE_SMTP_PORT: "587",
        CERTRACE_SMTP_USER: "mailer",
        CERTRACE_SMTP_PASSWORD: "secret",
      }),
    ).not.toThrow();
  });
  test("SMTP mode names each missing SMTP setting", () => {
    expect(() =>
      assertProductionConfig({ ...complete, CERTRACE_EMAIL_DELIVERY: "smtp" }),
    ).toThrow(/CERTRACE_SMTP_HOST.*CERTRACE_SMTP_PASSWORD/s);
  });
  // Whitespace-only values look set to a naive check but are empty in practice.
  test.each([
    ["CERTRACE_JWT_SECRET", " ".repeat(48)],
    ["DATABASE_URL", "   "],
    ["RESEND_API_KEY", "  "],
    ["CERTRACE_EMAIL_SENDER", "  "],
    ["CERTRACE_APP_BASE_URL", "   "],
  ])("rejects whitespace-only %s", (key, value) => {
    expect(() => assertProductionConfig({ ...complete, [key]: value })).toThrow(key);
  });
  test("rejects whitespace-only SMTP settings", () => {
    expect(() =>
      assertProductionConfig({
        ...complete,
        CERTRACE_EMAIL_DELIVERY: "smtp",
        CERTRACE_SMTP_HOST: "   ",
        CERTRACE_SMTP_PORT: "587",
        CERTRACE_SMTP_USER: "mailer",
        CERTRACE_SMTP_PASSWORD: "secret",
      }),
    ).toThrow(/CERTRACE_SMTP_HOST required for smtp/);
  });
  test("trims the JWT secret before counting its length", () => {
    expect(() =>
      assertProductionConfig({ ...complete, CERTRACE_JWT_SECRET: ` ${"x".repeat(31)} ` }),
    ).toThrow(/CERTRACE_JWT_SECRET must be at least 32 characters/);
  });
  test.each(["console", "off", "", "RESEND"])(
    "rejects CERTRACE_EMAIL_DELIVERY=%p in production",
    (mode) => {
      expect(() =>
        assertProductionConfig({ ...complete, CERTRACE_EMAIL_DELIVERY: mode }),
      ).toThrow(/CERTRACE_EMAIL_DELIVERY must be resend or smtp/);
    },
  );
  test.each(["abc", "0", "65536", "587.5", "-1", "1e3"])(
    "rejects SMTP port %p",
    (port) => {
      expect(() =>
        assertProductionConfig({
          ...complete,
          CERTRACE_EMAIL_DELIVERY: "smtp",
          CERTRACE_SMTP_HOST: "smtp.example.com",
          CERTRACE_SMTP_PORT: port,
          CERTRACE_SMTP_USER: "mailer",
          CERTRACE_SMTP_PASSWORD: "secret",
        }),
      ).toThrow(/CERTRACE_SMTP_PORT must be an integer from 1 to 65535/);
    },
  );
  test.each(["1", "465", "65535"])("accepts SMTP port %p", (port) => {
    expect(() =>
      assertProductionConfig({
        ...complete,
        CERTRACE_EMAIL_DELIVERY: "smtp",
        CERTRACE_SMTP_HOST: "smtp.example.com",
        CERTRACE_SMTP_PORT: port,
        CERTRACE_SMTP_USER: "mailer",
        CERTRACE_SMTP_PASSWORD: "secret",
      }),
    ).not.toThrow();
  });
});
