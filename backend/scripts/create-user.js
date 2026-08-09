#!/usr/bin/env node
/**
 * Create a login user (Argon2id hash + DB insert), or print a hash only.
 *
 * Usage:
 *   npm run create-user -- <email> <password> [displayName]
 *   npm run hash-password -- <password>
 */
import "dotenv/config";
import { DATABASE_URL } from "../src/config.js";
import { closePool } from "../src/db/pool.js";
import { createUser, hashPassword } from "../src/services/auth.js";

function usage() {
  console.log(`Usage:
  npm run create-user -- <email> <password> [displayName]
  npm run hash-password -- <password>

Password must be at least 12 characters.
`);
}

async function main() {
  const argv = process.argv.slice(2);
  const hashOnly = process.env.npm_lifecycle_event === "hash-password" || argv[0] === "--hash-only";

  if (hashOnly) {
    const password = argv[0] === "--hash-only" ? argv[1] : argv[0];
    if (!password) {
      usage();
      process.exit(1);
    }
    const hash = await hashPassword(password);
    console.log(hash);
    return;
  }

  const [email, password, displayName] = argv;
  if (!email || !password) {
    usage();
    process.exit(1);
  }

  if (!DATABASE_URL) {
    console.error("DATABASE_URL is required (set it in backend/.env).");
    process.exit(1);
  }

  const user = await createUser({ email, password, displayName });
  console.log("Created user:");
  console.log(`  id:           ${user.id}`);
  console.log(`  email:        ${user.email}`);
  console.log(`  displayName:  ${user.displayName || "(none)"}`);
}

main()
  .catch((err) => {
    console.error(err?.message ?? err);
    process.exit(1);
  })
  .finally(async () => {
    try {
      await closePool();
    } catch {
      /* ignore */
    }
  });
