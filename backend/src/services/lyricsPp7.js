import { LYRICS_PP7_TEMPLATE_SIMPLE, LYRICS_PP7_TEMPLATE_THEME } from "../config.js";
import { safeFilename } from "../utils/text.js";
import { ApiError } from "../utils/ApiError.js";
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

/**
 * Parse lyrics text into a title + list of slide blocks (separated by blank lines).
 * @param {string} content
 */
export function parseLyricsBlocks(content) {
  const blocks = String(content ?? "")
    .split("\n\n")
    .map((b) => b.trim())
    .filter(Boolean);
  if (blocks.length === 0) return { title: null, blocks: [] };
  return { title: blocks[0], blocks: blocks.slice(1) };
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
export async function generateLyricsPp7(content, { useTheme = false } = {}) {
  const { title, blocks } = parseLyricsBlocks(content);
  if (!title || blocks.length === 0) {
    throw ApiError.unprocessable(
      "Lyrics must include a title line followed by at least one block of lyrics.",
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

  // Update the first (template) slide with the first block.
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
      newCue.name = `Slide ${i + 1}`;

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
