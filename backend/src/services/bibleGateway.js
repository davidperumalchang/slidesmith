import { DEFAULT_BIBLE_VERSION } from "../config.js";
import { sanitizeText } from "../utils/text.js";
import { ApiError } from "../utils/ApiError.js";

const REQUEST_TIMEOUT_MS = 15000;
const INTER_REQUEST_DELAY_MS = 500;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// axios + cheerio are only needed for the (optional) online lookup path and
// pull in heavy deps (undici) that require a newer Node. Load them lazily so the
// server and the offline path never depend on them.
let _axios;
let _cheerio;
async function loadHttpDeps() {
  if (!_axios) _axios = (await import("axios")).default;
  if (!_cheerio) _cheerio = await import("cheerio");
  return { axios: _axios, cheerio: _cheerio };
}

// Expand "Book C:V-V" into individual "Book C:V" references.
function splitReference(reference) {
  const match = String(reference).match(/^(.*\s\d+):(\d+)-(\d+)$/);
  if (!match) return [reference];
  const bookChapter = match[1];
  const start = Number.parseInt(match[2], 10);
  const end = Number.parseInt(match[3], 10);
  const refs = [];
  for (let i = start; i <= end; i += 1) refs.push(`${bookChapter}:${i}`);
  return refs;
}

async function lookupSingleVerse(reference, version) {
  const { axios, cheerio } = await loadHttpDeps();
  const url = `https://www.biblegateway.com/passage/?search=${encodeURIComponent(
    reference,
  )}&version=${encodeURIComponent(version)}`;

  const response = await axios.get(url, {
    timeout: REQUEST_TIMEOUT_MS,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; SlideSmith/1.0; +https://example.invalid)",
      Accept: "text/html",
    },
    maxRedirects: 3,
    responseType: "text",
  });

  const $ = cheerio.load(response.data);
  const title = $('meta[name="twitter:title"]').attr("content");
  const passageText = $('meta[property="og:description"]').attr("content");
  if (!title || passageText == null) return null;

  let parsedReference = title;
  let parsedVersion = version;
  const refMatch = title.match(/(.*?)\s*\((.*?)\)/);
  if (refMatch) {
    parsedReference = refMatch[1].trim();
    parsedVersion = refMatch[2].trim();
  }

  return { reference: parsedReference, version: parsedVersion, text: passageText };
}

async function lookupPassage(reference, version) {
  const verseReferences = splitReference(reference);

  if (verseReferences.length > 1) {
    let combinedText = "";
    let firstResult = null;

    for (const verseRef of verseReferences) {
      const verseInfo = await lookupSingleVerse(verseRef, version);
      if (verseInfo) {
        if (!firstResult) firstResult = { ...verseInfo };
        const verseNum = verseRef.split(":").pop();
        combinedText += `${combinedText ? " " : ""}${verseNum} ${verseInfo.text}`;
        await sleep(INTER_REQUEST_DELAY_MS);
      }
    }

    if (firstResult) {
      firstResult.text = combinedText;
      firstResult.reference = reference;
      return firstResult;
    }
    return null;
  }

  const verseInfo = await lookupSingleVerse(reference, version);
  if (verseInfo) {
    const verseNum = reference.split(":").pop();
    verseInfo.text = `${verseNum} ${verseInfo.text}`;
  }
  return verseInfo;
}

function passageToSlide(passage) {
  const reference = passage.reference;
  const text = passage.text;

  const verses = [];
  const parts = (" " + text).split(/(?<=\s)(\d+\s)/);

  if (parts.length > 1) {
    let arr = parts;
    if (arr[0].trim() === "") arr = arr.slice(1);
    for (let i = 0; i < arr.length - 1; i += 2) {
      const verseNum = arr[i].trim();
      const verseText = arr[i + 1].trim();
      verses.push({ content: sanitizeText(`${verseNum} ${verseText}`) });
    }
  } else {
    verses.push({ content: sanitizeText(text) });
  }

  return { title: reference, verses };
}

/**
 * Look up references online via BibleGateway.
 * @param {string[]} references
 * @param {string} version
 */
export async function lookupPassagesOnline(references, version = DEFAULT_BIBLE_VERSION) {
  if (!Array.isArray(references) || references.length === 0) {
    throw ApiError.badRequest("No verse references provided.");
  }

  const slides = [];
  const notFound = [];

  for (const reference of references) {
    const ref = String(reference).trim();
    if (!ref) continue;
    try {
      const passage = await lookupPassage(ref, version);
      if (passage) slides.push(passageToSlide(passage));
      else notFound.push(ref);
    } catch {
      notFound.push(ref);
    }
    await sleep(INTER_REQUEST_DELAY_MS);
  }

  return { slides, notFound };
}
