import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { isValidDocxBuffer } from "../middleware/upload.js";
import { extractVersesFromDocx, versesToEditableText } from "../services/verseExtractor.js";

export const extractVerses = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw ApiError.badRequest("No document uploaded. Attach a .docx file as 'document'.");
  }
  if (!isValidDocxBuffer(req.file.buffer)) {
    throw ApiError.badRequest("Uploaded file is not a valid .docx document.");
  }

  const verses = await extractVersesFromDocx(req.file.buffer);
  res.json({
    verses,
    text: versesToEditableText(verses),
    count: verses.length,
  });
});
