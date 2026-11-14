import "./lib/startup-check";
import { app } from "./app";
import { config } from "./lib/config";
import { db } from "./lib/db";
import { validateFileStorage } from "./modules/files/storage";
if (!config.jwtSecret)
  throw new Error("CERTRACE_JWT_SECRET must be configured.");
validateFileStorage();
await db.$connect();
// Opens the first pool connection now, so the first request after a start does not wait for it.
await db.$queryRaw`select 1`;
app.listen({ port: config.port, hostname: "0.0.0.0" });
console.info(`Certrace API listening on port ${config.port}`);
async function shutdown() {
  await app.stop();
  await db.$disconnect();
  process.exit(0);
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
