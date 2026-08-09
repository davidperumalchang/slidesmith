import { asyncHandler } from "../utils/asyncHandler.js";
import {
  loginWithPassword,
  revokeSession,
  resolveSession,
} from "../services/auth.js";
import {
  COOKIE_SAMESITE,
  COOKIE_SECURE,
  SESSION_COOKIE_NAME,
} from "../config.js";

function clientIp(req) {
  const xf = req.headers["x-forwarded-for"];
  if (typeof xf === "string" && xf.length > 0) {
    return xf.split(",")[0].trim();
  }
  return req.ip;
}

function sessionCookieOptions(expiresAt) {
  const sameSite =
    COOKIE_SAMESITE === "none"
      ? "none"
      : COOKIE_SAMESITE === "strict"
        ? "strict"
        : "lax";

  return {
    httpOnly: true,
    secure: COOKIE_SECURE || sameSite === "none",
    sameSite,
    path: "/",
    expires: expiresAt,
  };
}

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { user, rawToken, expiresAt } = await loginWithPassword(email, password, {
    userAgent: req.get("user-agent"),
    ipAddress: clientIp(req),
  });

  res.cookie(SESSION_COOKIE_NAME, rawToken, sessionCookieOptions(expiresAt));
  res.json({ user });
});

export const logout = asyncHandler(async (req, res) => {
  const rawToken = req.cookies?.[SESSION_COOKIE_NAME];
  await revokeSession(rawToken);
  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: COOKIE_SAMESITE === "none" ? "none" : COOKIE_SAMESITE === "strict" ? "strict" : "lax",
    path: "/",
  });
  res.json({ ok: true });
});

export const me = asyncHandler(async (req, res) => {
  // Prefer middleware-attached user when present; otherwise resolve from cookie
  // so /auth/me can also be used as a soft session check.
  if (req.user) {
    return res.json({ user: req.user });
  }

  const rawToken = req.cookies?.[SESSION_COOKIE_NAME];
  const session = await resolveSession(rawToken);
  if (!session) {
    return res.status(401).json({ error: "Authentication required." });
  }
  return res.json({ user: session.user });
});
