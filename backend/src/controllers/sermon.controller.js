import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { getPastorById } from "../services/pastors.js";
import { generateSermonPptx } from "../services/sermonPpt.js";
import { generateSermonPp7 } from "../services/sermonPp7.js";
import { previewSermon } from "../services/sermonPreview.js";
import { sendDownload, CONTENT_TYPES } from "../utils/download.js";

function resolvePastor(pastorId) {
  if (pastorId == null) return null;
  const pastor = getPastorById(pastorId);
  if (!pastor) throw ApiError.badRequest(`Pastor with id ${pastorId} not found.`);
  return pastor;
}

export const previewSermonSlides = asyncHandler(async (req, res) => {
  const { slides, format, pastorId, sermonTitle, useTheme } = req.body;
  const pastor = resolvePastor(pastorId);
  res.json(
    previewSermon({
      slides,
      format,
      pastor,
      sermonTitle,
      useTheme,
    }),
  );
});

export const createSermonPptx = asyncHandler(async (req, res) => {
  const { slides, pastorId, sermonTitle } = req.body;
  const pastor = resolvePastor(pastorId);
  const { buffer, filename } = await generateSermonPptx({ slides, pastor, sermonTitle });
  sendDownload(res, buffer, filename, CONTENT_TYPES.pptx);
});

export const createSermonPp7 = asyncHandler(async (req, res) => {
  const { slides, pastorId, useTheme } = req.body;
  const pastor = resolvePastor(pastorId);
  const { buffer, filename } = await generateSermonPp7({ slides, pastor, useTheme });
  sendDownload(res, buffer, filename, CONTENT_TYPES.pro);
});
