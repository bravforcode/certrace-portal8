import { afterAll, describe, expect, mock, test } from "bun:test";

const sent: Record<string, unknown>[] = [];
let transport: Record<string, unknown> | undefined;
let relayDown = false;
mock.module("nodemailer", () => ({
  default: {
    createTransport: (options: Record<string, unknown>) => {
      transport = options;
      return {
        sendMail: async (message: Record<string, unknown>) => {
          if (relayDown) throw new Error("connection refused");
          sent.push(message);
        },
      };
    },
  },
}));
const { sendEmail } = await import("../src/lib/email");

const saved = { ...process.env };
afterAll(() => {
  process.env = saved;
});

// Customers whose mail policy blocks third-party senders still need approval,
// trial and reset mail, so SMTP must deliver the same text and escaped HTML
// as Resend, and a relay failure must surface instead of passing silently.
describe("sendEmail in smtp mode", () => {
  Object.assign(process.env, {
    CERTRACE_EMAIL_DELIVERY: "smtp",
    CERTRACE_SMTP_HOST: "smtp.example.com",
    CERTRACE_SMTP_PORT: "465",
    CERTRACE_SMTP_USER: "mailer",
    CERTRACE_SMTP_PASSWORD: "secret",
    CERTRACE_EMAIL_SENDER: "Certrace <no-reply@certrace.co>",
  });
  test("sends through the configured relay with escaped HTML", async () => {
    await sendEmail("a@example.com", "Code", "<b>123456</b>", undefined, {
      label: "Open",
      url: "https://portal.certrace.co/?a=1&b=2",
    });
    expect(transport).toMatchObject({ host: "smtp.example.com", port: 465, secure: true });
    expect(sent[0]).toMatchObject({ to: "a@example.com", subject: "Code", text: "<b>123456</b>" });
    expect(String(sent[0]?.html)).toContain("&lt;b&gt;123456&lt;/b&gt;");
    expect(String(sent[0]?.html)).toContain("a=1&amp;b=2");
  });
  test("a relay error becomes EMAIL_UNAVAILABLE", async () => {
    relayDown = true;
    await expect(sendEmail("a@example.com", "Code", "x")).rejects.toMatchObject({
      code: "EMAIL_UNAVAILABLE",
    });
  });
});
