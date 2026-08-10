import "./loadEnv.js";
import { createApp } from "./app.js";
import { PORT, DATABASE_URL } from "./config.js";
import { runMigrations } from "./db/migrate.js";
import { closePool } from "./db/pool.js";
import { purgeExpiredSessions } from "./services/auth.js";
import { getTypes } from "./services/proPresenter.js";

async function start() {
  if (!DATABASE_URL) {
    console.error("[startup] DATABASE_URL is required.");
    process.exit(1);
  }

  console.log("[startup] Running database migrations…");
  await runMigrations();

  // Best-effort cleanup; never block startup on this.
  purgeExpiredSessions().catch((err) => {
    console.warn("[startup] Session purge skipped:", err?.message ?? err);
  });

  // Warm the protobuf schema at startup so the first ProPresenter request is fast
  // and any schema loading error surfaces immediately.
  getTypes().catch((err) => {
    console.error("[startup] Failed to load ProPresenter protobuf schema:", err);
  });

  const app = createApp();
  const server = app.listen(PORT, () => {
    console.log(`SlideSmith backend listening on port ${PORT}`);
  });

  const shutdown = (signal) => {
    console.log(`\n${signal} received, shutting down...`);
    server.close(async () => {
      try {
        await closePool();
      } catch {
        /* ignore */
      }
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

start().catch((err) => {
  console.error("[startup] Fatal:", err);
  process.exit(1);
});
