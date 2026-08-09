// Shared text helpers ported from the original Python project.

// Straight/smart quotes are stripped so they don't corrupt RTF / slide output.
const QUOTE_CHARS = /["'\u201c\u201d\u2019\u2018]/g;

export function sanitizeText(text) {
  if (text == null) return "";
  return String(text).replace(QUOTE_CHARS, "");
}

// Produce a filesystem-safe base filename from a title. Keeps letters, digits,
// spaces, hyphens and underscores; collapses whitespace; trims.
export function safeFilename(title, fallback = "output") {
  const cleaned = String(title ?? "")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || fallback;
}

// Strip trailing punctuation from each line (used for lyrics slides).
const TRAILING_PUNCT = /[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]+$/;

export function cleanLineEndings(text) {
  return String(text)
    .split("\n")
    .map((line) => {
      let l = line.trim();
      // Remove trailing punctuation repeatedly (matches Python behaviour).
      let prev;
      do {
        prev = l;
        l = l.replace(TRAILING_PUNCT, "").trim();
      } while (l !== prev);
      return l;
    })
    .join("\n");
}
