import { Router } from "express";
import { rateLimit } from "express-rate-limit";

import { validateBody } from "../middleware/validate.js";
import { uploadDocument } from "../middleware/upload.js";
import { requireAuth } from "../middleware/auth.js";
import {
  lookupSchema,
  lyricsContentSchema,
  lyricsPreviewSchema,
  lyricsPp7Schema,
  sermonPptSchema,
  sermonPp7Schema,
  sermonPreviewSchema,
  loginSchema,
} from "../schemas.js";

import { login, logout, me } from "../controllers/auth.controller.js";
import { listPastors } from "../controllers/pastors.controller.js";
import { extractVerses } from "../controllers/verses.controller.js";
import { lookupPassages } from "../controllers/passages.controller.js";
import {
  validateLyrics,
  previewLyricsSlides,
  createLyricsPptx,
  createLyricsPp7,
} from "../controllers/lyrics.controller.js";
import {
  previewSermonSlides,
  createSermonPptx,
  createSermonPp7,
} from "../controllers/sermon.controller.js";

const router = Router();

// Public: liveness (used by Docker healthchecks)
router.get("/health", (_req, res) => res.json({ status: "ok", service: "slidesmith-backend" }));

// Auth — strict rate limit on login to blunt credential stuffing / spam.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many login attempts. Please try again later." },
});

router.post("/auth/login", loginLimiter, validateBody(loginSchema), login);
router.get("/auth/me", me);
router.post("/auth/logout", logout);

// Everything below requires a valid session.
router.use(requireAuth);

router.get("/pastors", listPastors);

router.post("/verses/extract", uploadDocument, extractVerses);
router.post("/passages/lookup", validateBody(lookupSchema), lookupPassages);

router.post("/lyrics/validate", validateBody(lyricsContentSchema), validateLyrics);
router.post("/lyrics/preview", validateBody(lyricsPreviewSchema), previewLyricsSlides);
router.post("/generate/lyrics-ppt", validateBody(lyricsContentSchema), createLyricsPptx);
router.post("/generate/lyrics-pp7", validateBody(lyricsPp7Schema), createLyricsPp7);

router.post("/sermon/preview", validateBody(sermonPreviewSchema), previewSermonSlides);
router.post("/generate/sermon-ppt", validateBody(sermonPptSchema), createSermonPptx);
router.post("/generate/sermon-pp7", validateBody(sermonPp7Schema), createSermonPp7);

export default router;
