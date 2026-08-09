import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { resolveSession } from "../services/auth.js";
import { SESSION_COOKIE_NAME } from "../config.js";

/**
 * Require a valid session cookie. Attaches req.user and req.sessionId.
 */
export const requireAuth = asyncHandler(async (req, _res, next) => {
  const rawToken = req.cookies?.[SESSION_COOKIE_NAME];
  const session = await resolveSession(rawToken);
  if (!session) {
    throw ApiError.unauthorized();
  }
  req.user = session.user;
  req.sessionId = session.sessionId;
  next();
});
