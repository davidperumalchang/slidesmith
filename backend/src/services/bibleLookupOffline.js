import fs from "node:fs";
import path from "node:path";
import { BIBLE_DIR, BIBLE_USX_DIR, DEFAULT_BIBLE_VERSION } from "../config.js";
import { BOOK_CODES } from "../data/bibleBooks.js";
import { sanitizeText } from "../utils/text.js";
import { ApiError } from "../utils/ApiError.js";

function isDirectory(dir) {
  try {
    return fs.statSync(dir).isDirectory();
  } catch {
    return false;
  }
}

/** Pull the abbreviation/name out of a DBL `metadata.xml` bundle descriptor. */
function readBundleMetadata(bundleDir) {
  try {
    const xml = fs.readFileSync(path.join(bundleDir, "metadata.xml"), "utf-8");
    const identification = xml.match(/<identification>([\s\S]*?)<\/identification>/)?.[1] ?? "";
    return {
      abbreviation: identification.match(/<abbreviation>([^<]+)<\/abbreviation>/)?.[1]?.trim(),
      name: identification.match(/<name>([^<]+)<\/name>/)?.[1]?.trim(),
    };
  } catch {
    return {};
  }
}

/**
 * Bundled translations, keyed by uppercased abbreviation. The original single
 * bundle lives at `bible/release/USX_1`; additional translations are picked up
 * from `bible/<ABBREVIATION>/release/USX_1`.
 */
const VERSIONS = (() => {
  const versions = new Map();

  const add = (fallbackId, bundleDir, usxDir) => {
    const meta = readBundleMetadata(bundleDir);
    const id = (meta.abbreviation || fallbackId).toUpperCase();
    if (!id || versions.has(id)) return;
    versions.set(id, { id, name: meta.name || id, usxDir, bookMap: null });
  };

  if (isDirectory(BIBLE_USX_DIR)) {
    add(DEFAULT_BIBLE_VERSION, BIBLE_DIR, BIBLE_USX_DIR);
  }

  let entries = [];
  try {
    entries = fs.readdirSync(BIBLE_DIR, { withFileTypes: true });
  } catch {
    entries = [];
  }
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name === "release") continue;
    const bundleDir = path.join(BIBLE_DIR, entry.name);
    const usxDir = path.join(bundleDir, "release", "USX_1");
    if (isDirectory(usxDir)) add(entry.name, bundleDir, usxDir);
  }

  return versions;
})();

/** code (e.g. "GEN") -> absolute path of its USX file, built on first use. */
function bookMapFor(version) {
  if (version.bookMap) return version.bookMap;

  const map = {};
  let files = [];
  try {
    files = fs.readdirSync(version.usxDir);
  } catch {
    files = [];
  }
  for (const file of files) {
    if (file.toLowerCase().endsWith(".usx")) {
      map[file.slice(0, -4)] = path.join(version.usxDir, file);
    }
  }
  version.bookMap = map;
  return map;
}

/**
 * Translations available for offline lookup.
 * @returns {Array<{id:string, name:string}>}
 */
export function listOfflineVersions() {
  return [...VERSIONS.values()]
    .map(({ id, name }) => ({ id, name }))
    .sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * Resolve a requested version against the bundled allowlist (never a path).
 * @param {string} [version]
 */
function resolveVersion(version) {
  const requested = String(version ?? "").trim().toUpperCase();
  if (!requested) {
    return VERSIONS.get(DEFAULT_BIBLE_VERSION) ?? [...VERSIONS.values()][0] ?? null;
  }
  return VERSIONS.get(requested) ?? null;
}

const usxCache = new Map();

function readUsx(filePath) {
  if (usxCache.has(filePath)) return usxCache.get(filePath);
  const content = fs.readFileSync(filePath, "utf-8");
  usxCache.set(filePath, content);
  return content;
}

function getBookCode(bookName) {
  return BOOK_CODES[String(bookName).toLowerCase()] ?? null;
}

/**
 * Parse a reference like "James 1:5" or "James 5:13-18".
 * @returns {{bookName:string, bookCode:string|null, chapter:number, startVerse:number, endVerse:number}|null}
 */
export function parseReference(reference) {
  const match = String(reference).match(/^([\w\s]+)\s+(\d+):(\d+)(?:-(\d+))?$/);
  if (!match) return null;
  const bookName = match[1].trim();
  const chapter = Number.parseInt(match[2], 10);
  const startVerse = Number.parseInt(match[3], 10);
  const endVerse = match[4] ? Number.parseInt(match[4], 10) : startVerse;
  return { bookName, bookCode: getBookCode(bookName), chapter, startVerse, endVerse };
}

function extractVerseText(rawVerse) {
  let text = rawVerse;
  // Remove note elements (cross references / footnotes).
  text = text.replace(/<note.*?<\/note>/gs, "");
  // Remove section headings.
  text = text.replace(/<para style="s">[^<]*<\/para>/g, "");
  // Replace italic char runs with their content.
  text = text.replace(/<char style="it"[^>]*>([^<]*)<\/char>/g, "$1");
  // Strip any remaining tags.
  text = text.replace(/<[^>]*>/g, "");
  // Collapse whitespace.
  text = text.replace(/\s+/g, " ").trim();
  return text;
}

/**
 * Look up verses for a single reference from the bundled USX files.
 * @param {Record<string,string>} bookMap book code -> USX file path
 * @returns {{reference:string, verseTexts:Map<number,string>}|null}
 */
export function lookupVerse(bookMap, bookName, bookCode, chapter, startVerse, endVerse) {
  if (!bookCode || !bookMap[bookCode]) return null;
  const content = readUsx(bookMap[bookCode]);

  const chapterMatch = content.match(new RegExp(`<chapter number="${chapter}"[^>]*>`));
  if (!chapterMatch) return null;

  const chapterStart = chapterMatch.index;
  const nextChapterMatch = content
    .slice(chapterStart)
    .match(new RegExp(`<chapter number="${chapter + 1}"[^>]*>`));
  const chapterContent = nextChapterMatch
    ? content.slice(chapterStart, chapterStart + nextChapterMatch.index)
    : content.slice(chapterStart);

  const verseTexts = new Map();
  for (let v = startVerse; v <= endVerse; v += 1) {
    const verseMatch = chapterContent.match(
      new RegExp(`<verse number="${v}"[^>]*>(.*?)(?:<verse number="|<chapter|$)`, "s"),
    );
    if (verseMatch) {
      verseTexts.set(v, extractVerseText(verseMatch[1]));
    }
  }

  let reference = `${bookName} ${chapter}:${startVerse}`;
  if (startVerse !== endVerse) reference += `-${endVerse}`;

  return { reference, verseTexts };
}

function passageToSlide(passage) {
  const verses = [];
  for (const verseNum of [...passage.verseTexts.keys()].sort((a, b) => a - b)) {
    const verseText = passage.verseTexts.get(verseNum);
    verses.push({ content: sanitizeText(`${verseNum} ${verseText}`) });
  }
  return { title: sanitizeText(passage.reference), verses };
}

/**
 * Look up a list of references offline and return the slides document.
 * @param {string[]} references
 * @param {string} [version] bundled translation abbreviation (e.g. "NKJV")
 * @returns {{slides: Array<{title:string, verses:Array<{content:string}>}>, notFound: string[], version: string}}
 */
export function lookupPassagesOffline(references, version) {
  if (!Array.isArray(references) || references.length === 0) {
    throw ApiError.badRequest("No verse references provided.");
  }

  const resolved = resolveVersion(version);
  if (!resolved) {
    throw ApiError.badRequest("That Bible version is not available offline.");
  }
  const bookMap = bookMapFor(resolved);

  const slides = [];
  const notFound = [];

  for (const reference of references) {
    const ref = String(reference).trim();
    if (!ref) continue;

    const parsed = parseReference(ref);
    if (!parsed || !parsed.bookCode) {
      notFound.push(ref);
      continue;
    }

    const passage = lookupVerse(
      bookMap,
      parsed.bookName,
      parsed.bookCode,
      parsed.chapter,
      parsed.startVerse,
      parsed.endVerse,
    );

    if (passage && passage.verseTexts.size > 0) {
      slides.push(passageToSlide(passage));
    } else {
      notFound.push(ref);
    }
  }

  return { slides, notFound, version: resolved.id };
}
