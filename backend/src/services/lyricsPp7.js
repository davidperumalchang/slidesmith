import { LYRICS_PP7_TEMPLATE_SIMPLE, LYRICS_PP7_TEMPLATE_THEME } from "../config.js";
import { cleanLineEndings, safeFilename } from "../utils/text.js";
import { ApiError } from "../utils/ApiError.js";
import { validateLyricsFormat } from "./lyricsPpt.js";
import {
  getTypes,
  readPresentation,
  writePresentation,
  cloneCue,
  createRtfTextLyrics,
  extractTextFromRtf,
  getBaseSlide,
  elementHasText,
  setElementRtf,
  newUuid,
} from "./proPresenter.js";

// ProPresenter lyric slides show this many lyric lines per slide.
const LINES_PER_SLIDE = 2;

/**
 * Parse PowerPoint-style lyrics (title + labelled stanzas) into the ordered list
 * of ProPresenter slide texts:
 *   - the first line is the song title (used for the filename, not a slide),
 *   - each stanza's label (e.g. "Verse 1", "Chorus") becomes its own slide,
 *   - each stanza's lyric lines are chunked into slides of 2 lines each.
 * @param {string} content
 * @returns {{ title: string|null, blocks: string[] }}
 */
export function parseLyricsToPp7Slides(content) {
  const stanzas = String(content ?? "")
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (stanzas.length === 0) return { title: null, blocks: [] };

  const title = stanzas[0].split("\n")[0].trim();
  const blocks = [];

  for (const stanza of stanzas.slice(1)) {
    const lines = stanza
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) continue;

    const [label, ...rawLyricLines] = lines;
    blocks.push(label); // section label as its own slide

    // Match PowerPoint: strip trailing punctuation from each lyric line.
    const lyricText = cleanLineEndings(rawLyricLines.join("\n"));
    const lyricLines = lyricText.split("\n").filter(Boolean);

    for (let i = 0; i < lyricLines.length; i += LINES_PER_SLIDE) {
      blocks.push(lyricLines.slice(i, i + LINES_PER_SLIDE).join("\n"));
    }
  }

  return { title, blocks };
}

function detectTemplateType(presentation, presentationSlideType) {
  const empty = { hasTheme: false, mainIndex: 0 };
  if (!presentation.cues?.length || !presentation.cues[0].actions?.length) return empty;

  const action = presentation.cues[0].actions[0];
  if (action.type !== presentationSlideType) return empty;

  const baseSlide = getBaseSlide(action);
  if (!baseSlide?.elements?.length) return empty;

  const textElements = [];
  baseSlide.elements.forEach((el, i) => {
    if (elementHasText(el)) textElements.push(i);
  });

  const hasTheme = textElements.length > 1;

  let mainIndex = 0;
  let maxLen = -1;
  for (const i of textElements) {
    const text = extractTextFromRtf(baseSlide.elements[i].element.text.rtf_data);
    if (text.length > maxLen) {
      maxLen = text.length;
      mainIndex = i;
    }
  }

  return { hasTheme, mainIndex };
}

/**
 * Generate a ProPresenter 7 (.pro) lyrics file.
 * @param {string} content
 * @param {{useTheme?: boolean}} [options]
 * @returns {Promise<{buffer:Buffer, filename:string, slideCount:number}>}
 */
function slideName(text, index) {
  const firstLine = String(text).split("\n")[0].trim();
  return firstLine || `Slide ${index + 1}`;
}

export async function generateLyricsPp7(content, { useTheme = false } = {}) {
  // Same labelled-stanza format as PowerPoint.
  const { valid, message } = validateLyricsFormat(content);
  if (!valid) throw ApiError.unprocessable(message);

  const { title, blocks } = parseLyricsToPp7Slides(content);
  if (!title || blocks.length === 0) {
    throw ApiError.unprocessable(
      "Lyrics must include a title line followed by at least one labelled stanza (e.g. 'Verse 1') with lyric lines.",
    );
  }

  const { UUID, ACTION_TYPE_PRESENTATION_SLIDE } = await getTypes();
  const mkUuid = (v) => UUID.create({ string: v });

  const templatePath = useTheme ? LYRICS_PP7_TEMPLATE_THEME : LYRICS_PP7_TEMPLATE_SIMPLE;
  const presentation = await readPresentation(templatePath);

  if (!presentation.cues?.length) {
    throw ApiError.internal("Template presentation has no slides to use.");
  }

  const { mainIndex } = detectTemplateType(presentation, ACTION_TYPE_PRESENTATION_SLIDE);
  const templateCue = presentation.cues[0];

  // Update the first (template) slide with the first block (usually a section label).
  templateCue.name = slideName(blocks[0], 0);
  for (const action of templateCue.actions ?? []) {
    if (action.type !== ACTION_TYPE_PRESENTATION_SLIDE) continue;
    const baseSlide = getBaseSlide(action);
    if (baseSlide?.elements?.length > mainIndex) {
      const el = baseSlide.elements[mainIndex];
      if (elementHasText(el)) setElementRtf(el, createRtfTextLyrics(blocks[0]));
    }
  }

  // Append a new cue per remaining block.
  if (blocks.length > 1) {
    const cueGroup = presentation.cue_groups?.length ? presentation.cue_groups[0] : null;

    for (let i = 1; i < blocks.length; i += 1) {
      const lyricsText = blocks[i];
      const newCue = await cloneCue(templateCue);
      const newCueUuid = newUuid();
      newCue.uuid = mkUuid(newCueUuid);
      newCue.name = slideName(lyricsText, i);

      if (newCue.actions?.length > 0) {
        const action = newCue.actions[0];
        action.uuid = mkUuid(newUuid());

        const baseSlide = getBaseSlide(action);
        if (baseSlide) {
          baseSlide.uuid = mkUuid(newUuid());

          if (baseSlide.elements?.length > mainIndex) {
            const el = baseSlide.elements[mainIndex];
            el.element.uuid = mkUuid(newUuid());
            if (elementHasText(el)) setElementRtf(el, createRtfTextLyrics(lyricsText));
          }

          baseSlide.elements?.forEach((el, j) => {
            if (j !== mainIndex) el.element.uuid = mkUuid(newUuid());
          });
        }
      }

      presentation.cues.push(newCue);
      if (cueGroup) {
        cueGroup.cue_identifiers = cueGroup.cue_identifiers ?? [];
        cueGroup.cue_identifiers.push(mkUuid(newCueUuid));
      }
    }
  }

  const buffer = await writePresentation(presentation);
  return { buffer, filename: `${safeFilename(title, "lyrics")}.pro`, slideCount: presentation.cues.length };
}
