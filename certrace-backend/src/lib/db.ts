import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { config } from "./config";
export const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: config.databaseUrl, max: 10 }),
});
export type Database = typeof db;
