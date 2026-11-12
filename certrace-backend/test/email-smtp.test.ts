import {
  afterEach,
  beforeEach,
  describe,
  expect,
  mock,
  spyOn,
  test,
} from "bun:test";

const sent: Record<string, unknown>[] = [];
let transport: Record<string, unknown> | undefined;
let relayDown = false;
mock.module("nodemailer", () => ({
  default: {
    createTransport: (options: Record<string, unknown>) => {
      transport = options;
      return {
        sendMail: async (message: Record<string, unknown>) => {
          if (relayDown)
            throw Object.assign(
              new Error("connect ECONNREFUSED to a@example.com"),
              {
                code: "ECONNREFUSED",
              },
            );
          sent.push(message);
        },
      };
    },
  },
}));
const { sendEmail } = await import("../src/lib/email");

const saved = { ...process.env };
const smtpEnv = {
  CERTRACE_EMAIL_DELIVERY: "smtp",
  CERTRACE_SMTP_HOST: "smtp.example.com",
  CERTRACE_SMTP_PORT: "465",
  CERTRACE_SMTP_USER: "mailer",
  CERTRACE_SMTP_PASSWORD: "secret",
  CERTRACE_EMAIL_SENDER: "Certrace <no-reply@certrace.co>",
};

// Each test starts from the real environment plus SMTP settings, and the
// environment is restored afterwards so no test leaks into another.
beforeEach(() => {
  for (const key of Object.keys(process.env)) delete process.env[key];
  Object.assign(process.env, saved, smtpEnv);
  sent.length = 0;
  transport = undefined;
  relayDown = false;
});
afterEach(() => {
  for (const key of Object.keys(process.env)) delete process.env[key];
  Object.assign(process.env, saved);
});

// Customers whose mail policy blocks third-party senders still need approval,
// trial and reset mail, so SMTP must deliver the same text and escaped HTML
// as Resend, and a relay failure must surface instead of passing silently.
describe("sendEmail in smtp mode", () => {
  test("sends through the configured relay with escaped HTML", async () => {
    await sendEmail("a@example.com", "Code", "<b>123456</b>", undefined, {
      label: "Open",
      url: "https://portal.certrace.co/?a=1&b=2",
    });
    expect(transport).toMatchObject({
      host: "smtp.example.com",
      port: 465,
      secure: true,
    });
    expect(sent[0]).toMatchObject({
      to: "a@example.com",
      subject: "Code",
      text: "<b>123456</b>",
    });
    expect(String(sent[0]?.html)).toContain("&lt;b&gt;123456&lt;/b&gt;");
    expect(String(sent[0]?.html)).toContain("a=1&amp;b=2");
  });
  test("port 465 uses implicit TLS", async () => {
    await sendEmail("a@example.com", "Code", "x");
    expect(transport).toMatchObject({ port: 465, secure: true });
  });
  test("port 587 upgrades with STARTTLS and refuses plain text", async () => {
    process.env.CERTRACE_SMTP_PORT = "587";
    await sendEmail("a@example.com", "Code", "x");
    expect(transport).toMatchObject({
      port: 587,
      secure: false,
      requireTLS: true,
    });
  });
  test("a relay error becomes EMAIL_UNAVAILABLE", async () => {
    relayDown = true;
    await expect(sendEmail("a@example.com", "Code", "x")).rejects.toMatchObject(
      {
        status: 503,
        code: "EMAIL_UNAVAILABLE",
      },
    );
  });
  test("a missing host becomes EMAIL_UNAVAILABLE with status 503", async () => {
    process.env.CERTRACE_SMTP_HOST = "";
    await expect(sendEmail("a@example.com", "Code", "x")).rejects.toMatchObject(
      {
        status: 503,
        code: "EMAIL_UNAVAILABLE",
      },
    );
    expect(transport).toBeUndefined();
  });
  test("a relay failure logs only the error code, never the message or recipient", async () => {
    relayDown = true;
    const errorSpy = spyOn(console, "error").mockImplementation(() => {});
    try {
      await expect(
        sendEmail("a@example.com", "Code", "123456"),
      ).rejects.toMatchObject({
        code: "EMAIL_UNAVAILABLE",
      });
      expect(errorSpy.mock.calls).toEqual([
        ["smtp delivery failed", "ECONNREFUSED"],
      ]);
    } finally {
      errorSpy.mockRestore();
    }
  });
});
