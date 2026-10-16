import { drizzle } from "drizzle-orm/node-postgres";

const globalForDb = globalThis as unknown as { db?: ReturnType<typeof create> };

function create() {
  return drizzle({ connection: process.env.DATABASE_URL! });
}

export const db = globalForDb.db ?? create();

if (process.env.NODE_ENV !== "production") globalForDb.db = db;