import { db } from "./db";
import { sendEmail } from "./email";
import { Prisma } from "../generated/prisma/client";
import { renderEmail, type EmailKind } from "./email-templates";

type Recipient = { id: string; email: string; locale: string; first_name?: string | null };

/** Sends one templated email. With `once`, a (user, kind) pair is sent at most
    once: the delivery row is inserted first, so two job runs cannot both send. */
export async function notify(
  user: Recipient,
  kind: EmailKind,
  vars: Record<string, string> = {},
  once = false,
): Promise<boolean> {
  if (once) {
    try {
      await db.email_deliveries.create({ data: { user_id: user.id, kind } });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")
        return false;
      throw e;
    }
  }
  const m = renderEmail(kind, user.locale === "th" ? "th" : "en", {
    name: user.first_name ?? "",
    email: user.email,
    ...vars,
  });
  try {
    await sendEmail(user.email, m.subject, m.text, once ? `${kind}:${user.id}` : undefined, m.action);
  } catch (e) {
    if (once) {
      // Cleanup has its own catch so a failed delete never replaces the send error.
      try {
        await db.email_deliveries.deleteMany({ where: { user_id: user.id, kind } });
      } catch (cleanupError) {
        console.error(
          "email delivery cleanup failed",
          (cleanupError as { code?: string } | undefined)?.code,
        );
      }
    }
    throw e;
  }
  return true;
}
