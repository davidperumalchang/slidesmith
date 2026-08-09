import { asyncHandler } from "../utils/asyncHandler.js";
import { validateLyricsFormat, generateLyricsPptx } from "../services/lyricsPpt.js";
import { generateLyricsPp7 } from "../services/lyricsPp7.js";
import { previewLyrics } from "../services/lyricsPreview.js";
import { sendDownload, CONTENT_TYPES } from "../utils/download.js";

export const validateLyrics = asyncHandler(async (req, res) => {
  res.json(validateLyricsFormat(req.body.content));
});

export const previewLyricsSlides = asyncHandler(async (req, res) => {
  res.json(
    previewLyrics(req.body.content, req.body.format, {
      useTheme: req.body.useTheme,
    }),
  );
});

export const createLyricsPptx = asyncHandler(async (req, res) => {
  const { buffer, filename } = await generateLyricsPptx(req.body.content);
  sendDownload(res, buffer, filename, CONTENT_TYPES.pptx);
});

export const createLyricsPp7 = asyncHandler(async (req, res) => {
  const { buffer, filename } = await generateLyricsPp7(req.body.content, {
    useTheme: req.body.useTheme,
  });
  sendDownload(res, buffer, filename, CONTENT_TYPES.pro);
});
