import crypto from "node:crypto";
import argon2 from "argon2";
import { query } from "../db/pool.js";
import { ApiError } from "../utils/ApiError.js";
import { SESSION_TTL_DAYS } from "../config.js";

const EMAIL_MAX = 254;
const PASSWORD_MIN = 12;
const PASSWORD_MAX = 128;

const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19456, // ~19 MiB
  timeCost: 2,
  parallelism: 1,
};

function normalizeEmail(email) {
  return String(email ?? "")
    .trim()
    .toLowerCase();
}

function assertPasswordPolicy(password) {
  if (typeof password !== "string" || password.length < PASSWORD_MIN) {
    throw ApiError.badRequest(`Password must be at least ${PASSWORD_MIN} characters.`);
  }
  if (password.length > PASSWORD_MAX) {
    throw ApiError.badRequest(`Password must be at most ${PASSWORD_MAX} characters.`);
  }
}

function hashToken(rawToken) {
  return crypto.createHash("sha256").update(rawToken, "utf8").digest("hex");
}

function publicUser(row) {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
  };
}

export async function hashPassword(password) {
  assertPasswordPolicy(password);
  return argon2.hash(password, ARGON2_OPTIONS);
}

export async function verifyPassword(hash, password) {
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
}

/**
 * Create a user with an Argon2id password hash.
 * @param {{ email: string, password: string, displayName?: string }} params
 */
export async function createUser({ email, password, displayName = "" }) {
  const normalized = normalizeEmail(email);
  if (!normalized || normalized.length > EMAIL_MAX || !normalized.includes("@")) {
    throw ApiError.badRequest("A valid email is required.");
  }

  const passwordHash = await hashPassword(password);
  const name = String(displayName ?? "").trim().slice(0, 200);

  try {
    const { rows } = await query(
      `INSERT INTO users (email, password_hash, display_name)
       VALUES ($1, $2, $3)
       RETURNING id, email, display_name`,
      [normalized, passwordHash, name],
    );
    return publicUser(rows[0]);
  } catch (err) {
    if (err?.code === "23505") {
      throw ApiError.badRequest("A user with that email already exists.");
    }
    throw err;
  }
}

/**
 * Authenticate email/password and create a server-side session.
 * @returns {{ user: object, rawToken: string, expiresAt: Date }}
 */
export async function loginWithPassword(email, password, { userAgent, ipAddress } = {}) {
  const normalized = normalizeEmail(email);
  if (!normalized || normalized.length > EMAIL_MAX || !normalized.includes("@")) {
    throw ApiError.unauthorized("Invalid email or password.");
  }
  if (typeof password !== "string" || password.length === 0 || password.length > PASSWORD_MAX) {
    throw ApiError.unauthorized("Invalid email or password.");
  }

  const { rows } = await query(
    `SELECT id, email, password_hash, display_name FROM users WHERE email = $1 LIMIT 1`,
    [normalized],
  );
  const user = rows[0];

  // Constant-ish failure path: always do a verify-like delay when user missing.
  if (!user) {
    await argon2.hash("invalid-password-placeholder!!", ARGON2_OPTIONS).catch(() => {});
    throw ApiError.unauthorized("Invalid email or password.");
  }

  const ok = await verifyPassword(user.password_hash, password);
  if (!ok) throw ApiError.unauthorized("Invalid email or password.");

  const rawToken = crypto.randomBytes(32).toString("base64url");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);

  await query(
    `INSERT INTO sessions (user_id, token_hash, expires_at, user_agent, ip_address)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      user.id,
      tokenHash,
      expiresAt.toISOString(),
      userAgent ? String(userAgent).slice(0, 512) : null,
      ipAddress ? String(ipAddress).slice(0, 64) : null,
    ],
  );

  return { user: publicUser(user), rawToken, expiresAt };
}

/**
 * Resolve a session cookie token to the authenticated user.
 */
export async function resolveSession(rawToken) {
  if (!rawToken || typeof rawToken !== "string" || rawToken.length > 200) {
    return null;
  }

  const tokenHash = hashToken(rawToken);
  const { rows } = await query(
    `SELECT s.id AS session_id, s.expires_at, s.revoked_at,
            u.id, u.email, u.display_name
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = $1
     LIMIT 1`,
    [tokenHash],
  );

  const row = rows[0];
  if (!row) return null;
  if (row.revoked_at) return null;
  if (new Date(row.expires_at).getTime() <= Date.now()) return null;

  return {
    sessionId: row.session_id,
    user: publicUser(row),
  };
}

export async function revokeSession(rawToken) {
  if (!rawToken) return;
  const tokenHash = hashToken(rawToken);
  await query(
    `UPDATE sessions
     SET revoked_at = now()
     WHERE token_hash = $1 AND revoked_at IS NULL`,
    [tokenHash],
  );
}

/** Best-effort cleanup of expired/revoked sessions. */
export async function purgeExpiredSessions() {
  await query(
    `DELETE FROM sessions
     WHERE expires_at < now() - interval '7 days'
        OR (revoked_at IS NOT NULL AND revoked_at < now() - interval '7 days')`,
  );
}
