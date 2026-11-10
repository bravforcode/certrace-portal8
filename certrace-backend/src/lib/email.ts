import { fail } from "./errors";
const escape = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
export async function sendEmail(
  to: string,
  subject: string,
  text: string,
  idempotencyKey?: string,
  action?: { label: string; url: string },
) {
  const mode = process.env.CERTRACE_EMAIL_DELIVERY ?? "off";
  if (mode === "console") {
    console.info({ to, subject, text });
    return;
  }
  if (mode === "off") return;
  const key = process.env.RESEND_API_KEY,
    from = process.env.CERTRACE_EMAIL_SENDER;
  if (!key || !from)
    fail(503, "EMAIL_UNAVAILABLE", "Email delivery is not configured.");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      text,
      html:
        `<p>${escape(text).replace(/\n/g, "<br>")}</p>` +
        (action
          ? `<p><a href="${escape(action.url)}">${escape(action.label)}</a></p>`
          : ""),
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok)
    fail(
      503,
      "EMAIL_UNAVAILABLE",
      "The email could not be delivered. Please retry.",
    );
}
