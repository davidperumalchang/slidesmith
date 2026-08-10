import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Backend project root (one level up from src/)
export const ROOT_DIR = path.resolve(__dirname, "..");

// Server — PORT (container) or BACKEND_PORT (repo-root .env for local/Compose host mapping)
export const PORT = Number.parseInt(process.env.PORT ?? process.env.BACKEND_PORT ?? "4000", 10);
export const NODE_ENV = process.env.NODE_ENV ?? "development";

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

// Session cookie
export const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? "slidesmith_session";
export const SESSION_TTL_DAYS = Number.parseInt(process.env.SESSION_TTL_DAYS ?? "7", 10);
// When the browser talks to the API via the Next.js same-origin proxy, Lax is ideal.
// Use None only for true cross-site setups (requires Secure).
export const COOKIE_SAMESITE = (process.env.COOKIE_SAMESITE ?? "lax").toLowerCase();
export const COOKIE_SECURE =
  process.env.COOKIE_SECURE === "true" ||
  (process.env.COOKIE_SECURE !== "false" && NODE_ENV === "production" && COOKIE_SAMESITE === "none");

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
