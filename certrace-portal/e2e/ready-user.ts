import { createRequire } from "node:module";
import { resolve } from "node:path";

const { Client } = createRequire(
  resolve(__dirname, "../../certrace-backend/package.json"),
)("pg");

/** Local integration fixtures need explicit approval before entering onboarding. */
export async function readyUser(id: string) {
  const db = new Client({
    connectionString:
      process.env.DATABASE_URL ??
      "postgresql://certrace:certrace-local@localhost:55432/certrace",
  });
  await db.connect();
  try {
    const result = await db.query(
      "UPDATE public.users SET ready=true WHERE id=$1",
      [id],
    );
    if (result.rowCount !== 1)
      throw new Error("Account fixture was not found.");
  } finally {
    await db.end();
  }
}
