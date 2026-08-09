import { Router } from "express";

import { validateBody } from "../middleware/validate.js";
import { uploadDocx } from "../middleware/upload.js";
import {
  lookupSchema,
  lyricsContentSchema,
  lyricsPreviewSchema,
  lyricsPp7Schema,
  sermonPptSchema,
  sermonPp7Schema,
  sermonPreviewSchema,
} from "../schemas.js";

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

router.get("/health", (_req, res) => res.json({ status: "ok", service: "slidesmith-backend" }));

// Reference data
router.get("/pastors", listPastors);

// Sermon pipeline: extract references -> look up passages
router.post("/verses/extract", uploadDocx, extractVerses);
router.post("/passages/lookup", validateBody(lookupSchema), lookupPassages);

// Lyrics
router.post("/lyrics/validate", validateBody(lyricsContentSchema), validateLyrics);
router.post("/lyrics/preview", validateBody(lyricsPreviewSchema), previewLyricsSlides);
router.post("/generate/lyrics-ppt", validateBody(lyricsContentSchema), createLyricsPptx);
router.post("/generate/lyrics-pp7", validateBody(lyricsPp7Schema), createLyricsPp7);

// Sermon
router.post("/sermon/preview", validateBody(sermonPreviewSchema), previewSermonSlides);
router.post("/generate/sermon-ppt", validateBody(sermonPptSchema), createSermonPptx);
router.post("/generate/sermon-pp7", validateBody(sermonPp7Schema), createSermonPp7);

export default router;
