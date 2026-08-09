import { cleanLineEndings } from "../utils/text.js";
import { ApiError } from "../utils/ApiError.js";
import { validateLyricsFormat } from "./lyricsPpt.js";

const LINES_PER_SLIDE = 2;

/**
 * Build PowerPoint-style preview slides (one slide per labelled stanza).
 * @param {string} content
 */
function previewPptSlides(content) {
  const stanzas = String(content)
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  const title = stanzas[0]?.split("\n")[0]?.trim() ?? "";
  const slides = [];

  for (const stanza of stanzas.slice(1)) {
    const lines = stanza
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length < 2) continue;

    const [label, ...rawLyrics] = lines;
    const lyricLines = cleanLineEndings(rawLyrics.join("\n"))
      .split("\n")
      .filter(Boolean);

    slides.push({
      kind: "stanza",
      label,
      lines: lyricLines,
      text: lyricLines.join("\n"),
    });
  }

  return { title, slides };
}

/**
 * Build ProPresenter-style preview slides (section label slides + 2-line lyric slides).
 * Mirrors parseLyricsToPp7Slides / generateLyricsPp7.
 * @param {string} content
 */
function previewPp7Slides(content) {
  const stanzas = String(content ?? "")
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  const title = stanzas[0]?.split("\n")[0]?.trim() ?? "";
  const slides = [];

  for (const stanza of stanzas.slice(1)) {
    const lines = stanza
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) continue;

    const [label, ...rawLyricLines] = lines;
    slides.push({ kind: "section", label, lines: [label], text: label });

    const lyricLines = cleanLineEndings(rawLyricLines.join("\n"))
      .split("\n")
      .filter(Boolean);

    for (let i = 0; i < lyricLines.length; i += LINES_PER_SLIDE) {
      const chunk = lyricLines.slice(i, i + LINES_PER_SLIDE);
      slides.push({ kind: "lyrics", label: null, lines: chunk, text: chunk.join("\n") });
    }
  }

  return { title, slides };
}

/**
 * Preview lyrics slides for the selected output format.
 * @param {string} content
 * @param {"ppt"|"pp7"} format
 * @param {{useTheme?: boolean}} [options]
 */
export function previewLyrics(content, format, { useTheme = false } = {}) {
  const { valid, message } = validateLyricsFormat(content);
  if (!valid) throw ApiError.unprocessable(message);

  const result = format === "pp7" ? previewPp7Slides(content) : previewPptSlides(content);

  if (!result.slides.length) {
    throw ApiError.unprocessable("No slides could be built from the lyrics.");
  }

  return {
    format,
    useTheme: format === "pp7" ? Boolean(useTheme) : false,
    // Matches the bundled background used by generateLyricsPptx.
    backgroundUrl: format === "ppt" ? "/previews/lyrics-bg.jpg" : null,
    title: result.title,
    slideCount: result.slides.length,
    slides: result.slides,
  };
}
