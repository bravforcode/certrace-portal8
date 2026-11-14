import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { config } from "./config";
export const db = new PrismaClient({
  // pg closes idle connections after 10 s by default, so the first request after a short pause paid
  // a new connection (and TLS on hosted databases). Keep them for 5 minutes instead.
  adapter: new PrismaPg({
    connectionString: config.databaseUrl,
    max: 10,
    idleTimeoutMillis: 300_000,
  }),
});
export type Database = typeof db;
