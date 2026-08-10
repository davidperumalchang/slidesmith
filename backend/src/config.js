import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Backend project root (one level up from src/)
export const ROOT_DIR = path.resolve(__dirname, "..");

// Server — PORT (container/Fly) or BACKEND_PORT (repo-root .env for local/Compose host mapping)
export const PORT = Number.parseInt(process.env.PORT ?? process.env.BACKEND_PORT ?? "4000", 10);
export const NODE_ENV = process.env.NODE_ENV ?? "development";
// Fly private networking (.internal) is IPv6 — production defaults to "::".
// Local `npm run dev` stays on IPv4 any-address for macOS friendliness.
export const HOST = process.env.HOST ?? (NODE_ENV === "production" ? "::" : "0.0.0.0");

/**
 * Prefer an explicit DATABASE_URL (Docker Compose sets this to host `db`).
 * Otherwise build one from POSTGRES_* for local `npm run dev`.
 */
function resolveDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  const user = process.env.POSTGRES_USER;
  const password = process.env.POSTGRES_PASSWORD;
  const db = process.env.POSTGRES_DB ?? "slidesmith";
  const host = process.env.POSTGRES_HOST ?? "localhost";
  const port = process.env.POSTGRES_PORT ?? "5433";
  if (!user || !password) return "";

  return `postgres://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${db}`;
}

export const DATABASE_URL = resolveDatabaseUrl();

/**
 * SSL for managed Postgres (Supabase). Local Docker Postgres stays plaintext unless
 * DATABASE_SSL=true. Set DATABASE_SSL=false to force-disable.
 */
export function resolveDatabaseSsl(connectionString = DATABASE_URL) {
  const flag = (process.env.DATABASE_SSL ?? "").toLowerCase();
  if (flag === "false" || flag === "0") return undefined;
  if (flag === "true" || flag === "1") {
    return {
      rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== "false",
    };
  }
  if (!connectionString) return undefined;

  try {
    const normalized = connectionString.includes("://")
      ? connectionString
      : `postgres://${connectionString}`;
    const u = new URL(normalized);
    const host = u.hostname.toLowerCase();
    const sslmode = (u.searchParams.get("sslmode") ?? "").toLowerCase();
    if (sslmode === "disable") return undefined;

    const isSupabase =
      host.endsWith(".supabase.co") ||
      host.endsWith(".supabase.com") ||
      host.includes("pooler.supabase.com");
    if (!isSupabase && !sslmode) return undefined;

    // verify-full / verify-ca need the Supabase CA; default require-style encryption.
    const verify =
      sslmode === "verify-full" ||
      sslmode === "verify-ca" ||
      process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === "true";
    return { rejectUnauthorized: verify };
  } catch {
    return undefined;
  }
}

// Session cookie
export const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? "slidesmith_session";
export const SESSION_TTL_DAYS = Number.parseInt(process.env.SESSION_TTL_DAYS ?? "7", 10);
// When the browser talks to the API via the Next.js same-origin proxy, Lax is ideal.
// Use None only for true cross-site setups (requires Secure).
export const COOKIE_SAMESITE = (process.env.COOKIE_SAMESITE ?? "lax").toLowerCase();
// Secure cookies on HTTPS production (Fly). Docker Compose sets COOKIE_SECURE=false for local HTTP.
export const COOKIE_SECURE =
  process.env.COOKIE_SECURE === "true" ||
  (process.env.COOKIE_SECURE !== "false" && NODE_ENV === "production");

// CORS: comma-separated allowlist of origins permitted to call the API.
// Defaults cover local Next.js dev + the docker-compose frontend service.
export const CORS_ALLOWED_ORIGINS = (
  process.env.CORS_ALLOWED_ORIGINS ??
  "http://localhost:3000,http://127.0.0.1:3000,http://localhost:4001,http://127.0.0.1:4001"
)
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

// Upload limits
export const MAX_UPLOAD_BYTES = Number.parseInt(
  process.env.MAX_UPLOAD_BYTES ?? String(10 * 1024 * 1024), // 10 MB
  10,
);

// Asset directories
export const PROTO_DIR = path.join(ROOT_DIR, "proto");
export const BIBLE_DIR = path.join(ROOT_DIR, "bible");
export const BIBLE_USX_DIR = path.join(BIBLE_DIR, "release", "USX_1");
export const BIBLE_METADATA_PATH = path.join(BIBLE_DIR, "metadata.xml");

export const BACKGROUNDS_DIR = path.join(ROOT_DIR, "assets", "backgrounds");
export const LYRICS_PPT_BACKGROUND_PATH = path.join(BACKGROUNDS_DIR, "lyrics_bg.jpg");
export const SERMON_PPT_BACKGROUND_PATH = path.join(BACKGROUNDS_DIR, "sermon_bg.jpg");

export const TEMPLATES_DIR = path.join(ROOT_DIR, "assets", "templates");
export const LYRICS_PP7_TEMPLATE_SIMPLE = path.join(TEMPLATES_DIR, "lyrics", "Template_Basic.pro");
export const LYRICS_PP7_TEMPLATE_THEME = path.join(TEMPLATES_DIR, "lyrics", "Template_Lower_Third.pro");
export const SERMON_PP7_TEMPLATE_SIMPLE = path.join(TEMPLATES_DIR, "sermon", "Sermon_Template_Basic.pro");
export const SERMON_PP7_TEMPLATE_THEME = path.join(TEMPLATES_DIR, "sermon", "Sermon_Template_Lower_Third.pro");

export const PASTORS_INFO_PATH = path.join(ROOT_DIR, "data", "pastors_info.json");

// Bible version metadata (bundled offline Bible is NKJV)
export const DEFAULT_BIBLE_VERSION = "NKJV";

// ProPresenter font sizes (points, before RTF doubling where noted)
export const LYRICS_PP7_DEFAULT_FONT_SIZE = 100; // RTF half-points already
