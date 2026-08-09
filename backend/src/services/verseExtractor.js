import mammoth from "mammoth";
import { BIBLE_BOOKS, BOOK_MAX_CHAPTERS, BOOK_NAME_MAP } from "../data/bibleBooks.js";

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Build the reference-matching regex once. Full book names first, then every
// abbreviation, mirroring the original Python ordering.
const BOOKS_PATTERN = [
  ...Object.keys(BIBLE_BOOKS).map(escapeRegex),
  ...Object.values(BIBLE_BOOKS).flat().map(escapeRegex),
].join("|");

const VERSE_REGEX = new RegExp(
  `\\b(${BOOKS_PATTERN})\\s*(\\d+)(?::(\\d+)(?:-(\\d+))?)?\\b`,
  "gi",
);

function normalizeBookName(bookName) {
  return BOOK_NAME_MAP[bookName.toLowerCase()] ?? bookName;
}

function titleCase(name) {
  return name
    .split(" ")
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function isValidReference(book, chapter) {
  const standard = normalizeBookName(book);
  const chapterNum = Number.parseInt(chapter, 10);
  const maxChapters = BOOK_MAX_CHAPTERS[standard.toLowerCase()];
  if (maxChapters && chapterNum >= 1 && chapterNum <= maxChapters) {
    return { valid: true, book: standard };
  }
  return { valid: false, book };
}

/**
 * Extract Bible verse references from plain text.
 * @param {string} text
 * @returns {string[]} e.g. ["John 3:16", "Romans 8:28-30"]
 */
export function extractVersesFromText(text) {
  const fullText = String(text ?? "").replace(/\s+/g, " ");
  const verses = [];

  for (const match of fullText.matchAll(VERSE_REGEX)) {
    const [, book, chapter, verseStart, verseEnd] = match;

    // Skip references without a verse number (e.g. "Mark 2").
    if (!verseStart) continue;

    const { valid, book: normalized } = isValidReference(book, chapter);
    if (!valid) continue;

    const titled = titleCase(normalized);
    verses.push(
      verseEnd
        ? `${titled} ${chapter}:${verseStart}-${verseEnd}`
        : `${titled} ${chapter}:${verseStart}`,
    );
  }

  return verses;
}

/**
 * Extract Bible verse references from an uploaded .docx buffer.
 * @param {Buffer} buffer
 * @returns {Promise<string[]>}
 */
export async function extractVersesFromDocx(buffer) {
  const { value } = await mammoth.extractRawText({ buffer });
  return extractVersesFromText(value);
}

/**
 * Serialize a verse list to the on-screen/editable text format used by the
 * original app: first reference on its own line, each subsequent line prefixed
 * with a comma.
 * @param {string[]} verses
 * @returns {string}
 */
export function versesToEditableText(verses) {
  return verses.map((v, i) => (i === 0 ? v : `,${v}`)).join("\n");
}

/**
 * Parse the editable verse text (comma/newline separated) back into a clean
 * array of references.
 * @param {string} text
 * @returns {string[]}
 */
export function parseVerseListText(text) {
  return String(text ?? "")
    .split(",")
    .map((ref) => ref.trim())
    .filter(Boolean);
}
