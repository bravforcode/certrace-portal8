import { app } from "./app";
import { config } from "./lib/config";
import { db } from "./lib/db";
import { validateFileStorage } from "./modules/files/storage";
if (!config.jwtSecret)
  throw new Error("CERTRACE_JWT_SECRET must be configured.");
validateFileStorage();
await db.$connect();
app.listen({ port: config.port, hostname: "0.0.0.0" });
console.info(`Certrace API listening on port ${config.port}`);
async function shutdown() {
  await app.stop();
  await db.$disconnect();
  process.exit(0);
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
