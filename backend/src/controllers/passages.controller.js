import { asyncHandler } from "../utils/asyncHandler.js";
import { parseVerseListText } from "../services/verseExtractor.js";
import { lookupPassagesOffline } from "../services/bibleLookupOffline.js";
import { lookupPassagesOnline } from "../services/bibleGateway.js";

export const lookupPassages = asyncHandler(async (req, res) => {
  const { references, text, source, version } = req.body;
  const refs = references && references.length > 0 ? references : parseVerseListText(text);

  const result =
    source === "online"
      ? await lookupPassagesOnline(refs, version)
      : lookupPassagesOffline(refs);

  res.json({
    slides: result.slides,
    notFound: result.notFound,
    source,
    count: result.slides.length,
  });
});
