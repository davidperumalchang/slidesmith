import fs from "node:fs";
import path from "node:path";
import { BIBLE_USX_DIR } from "../config.js";
import { BOOK_CODES } from "../data/bibleBooks.js";
import { sanitizeText } from "../utils/text.js";
import { ApiError } from "../utils/ApiError.js";

// code (e.g. "GEN") -> absolute path to its USX file. Built once at load.
const BOOK_MAP = (() => {
  const map = {};
  let files = [];
  try {
    files = fs.readdirSync(BIBLE_USX_DIR);
  } catch {
    files = [];
  }
  for (const file of files) {
    if (file.toLowerCase().endsWith(".usx")) {
      map[file.slice(0, -4)] = path.join(BIBLE_USX_DIR, file);
    }
  }
  return map;
})();

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
 * @returns {{reference:string, verseTexts:Map<number,string>}|null}
 */
export function lookupVerse(bookName, bookCode, chapter, startVerse, endVerse) {
  if (!bookCode || !BOOK_MAP[bookCode]) return null;
  const content = readUsx(BOOK_MAP[bookCode]);

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
 * @returns {{slides: Array<{title:string, verses:Array<{content:string}>}>, notFound: string[]}}
 */
export function lookupPassagesOffline(references) {
  if (!Array.isArray(references) || references.length === 0) {
    throw ApiError.badRequest("No verse references provided.");
  }

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

  return { slides, notFound };
}
