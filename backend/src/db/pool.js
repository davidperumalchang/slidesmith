import pg from "pg";
import { DATABASE_URL, resolveDatabaseSsl } from "../config.js";

const { Pool } = pg;

/** @type {import('pg').Pool | null} */
let pool = null;

export function getPool() {
  if (!pool) {
    if (!DATABASE_URL) {
      throw new Error("DATABASE_URL is not configured.");
    }
    const ssl = resolveDatabaseSsl(DATABASE_URL);
    pool = new Pool({
      connectionString: DATABASE_URL,
      ...(ssl ? { ssl } : {}),
      // Fail fast if the DB is unreachable at query time.
      connectionTimeoutMillis: 10_000,
      idleTimeoutMillis: 30_000,
      // Keep modest for Supabase free/small tiers + session pooler.
      max: Number.parseInt(process.env.DATABASE_POOL_MAX ?? "10", 10),
    });
    pool.on("error", (err) => {
      console.error("[db] Unexpected pool error:", err);
    });
  }
  return pool;
}

export async function query(text, params) {
  return getPool().query(text, params);
}

export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
