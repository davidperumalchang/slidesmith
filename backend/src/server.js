import "dotenv/config";
import { createApp } from "./app.js";
import { PORT } from "./config.js";
import { getTypes } from "./services/proPresenter.js";

const app = createApp();

// Warm the protobuf schema at startup so the first ProPresenter request is fast
// and any schema loading error surfaces immediately.
getTypes().catch((err) => {
  console.error("[startup] Failed to load ProPresenter protobuf schema:", err);
});

const server = app.listen(PORT, () => {
  console.log(`SlideSmith backend listening on port ${PORT}`);
});

const shutdown = (signal) => {
  console.log(`\n${signal} received, shutting down...`);
  server.close(() => process.exit(0));
  // Force-exit if not closed in time.
  setTimeout(() => process.exit(1), 10_000).unref();
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
