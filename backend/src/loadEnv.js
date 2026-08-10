import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

// Single source of truth: repo-root .env (shared with docker compose + frontend).
const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../..");

dotenv.config({ path: path.join(repoRoot, ".env") });
