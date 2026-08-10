import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {
  ACCEPTED_LABEL,
  detectDocumentKind,
  isValidDocumentBuffer,
} from "../middleware/upload.js";
import {
  extractVersesFromDocument,
  versesToEditableText,
} from "../services/verseExtractor.js";

export const extractVerses = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw ApiError.badRequest(
      `No document uploaded. Attach a ${ACCEPTED_LABEL} file as 'document'.`,
    );
  }

  const kind = detectDocumentKind(req.file.originalname);
  if (!kind) {
    throw ApiError.badRequest(`Only ${ACCEPTED_LABEL} files are accepted.`);
  }
  if (!isValidDocumentBuffer(kind, req.file.buffer)) {
    throw ApiError.badRequest(`Uploaded file is not a valid .${kind} document.`);
  }

  const verses = await extractVersesFromDocument(kind, req.file.buffer);
  res.json({
    verses,
    text: versesToEditableText(verses),
    count: verses.length,
    kind,
  });
});
