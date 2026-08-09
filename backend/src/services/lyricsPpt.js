import { createRequire } from "node:module";
import { LYRICS_PPT_BACKGROUND_PATH } from "../config.js";

// pptxgenjs ships a dual package whose ESM entry is a `.js` file without a
// `type: module` declaration, which breaks native ESM import on Node < 22.
// Loading the CommonJS build via createRequire works on every supported Node.
const require = createRequire(import.meta.url);
const pptxgenModule = require("pptxgenjs");
const PptxGenJS = pptxgenModule.default ?? pptxgenModule;
import { cleanLineEndings, safeFilename } from "../utils/text.js";
import { ApiError } from "../utils/ApiError.js";

const SLIDE_WIDTH = 16;
const SLIDE_HEIGHT = 9;
const FONT_NAME = "Arial";
const FONT_SIZE = 50;
const STANZA_GROUP_FONT_SIZE = 12;
const TEXT_COLOR = "FFFFFF";
const BG_COLOR = "000000";
const BG_TRANSPARENCY = 20; // percent (from original 0.2)

/**
 * Validate lyrics text. First line is the title, stanzas are separated by a
 * blank line, and every stanza after the title must have a label line plus at
 * least one lyric line. Ported from the original Python validator.
 * @param {string} content
 * @returns {{valid:boolean, message:string}}
 */
export function validateLyricsFormat(content) {
  const text = String(content ?? "");

  if (!text.trim()) {
    return { valid: false, message: "Lyrics content cannot be empty." };
  }

  const stanzas = text.split("\n\n");
  if (stanzas.length < 2) {
    return {
      valid: false,
      message:
        "No lyrics found after the title. Please add at least one stanza separated by a blank line.",
    };
  }

  for (const stanza of stanzas.slice(1)) {
    const lines = stanza.trim().split("\n");
    if (lines.length < 2) {
      return {
        valid: false,
        message:
          "Each stanza must have a stanza group label (e.g., 'Verse 1') and at least one line of lyrics.",
      };
    }
  }

  return { valid: true, message: "Lyrics format is valid." };
}

/**
 * Generate a lyrics PowerPoint from formatted lyrics text.
 * @param {string} content
 * @returns {Promise<{buffer:Buffer, filename:string, title:string}>}
 */
export async function generateLyricsPptx(content) {
  const text = String(content ?? "");
  const { valid, message } = validateLyricsFormat(text);
  if (!valid) throw ApiError.unprocessable(message);

  const title = text.split("\n")[0].trim();
  const stanzas = text
    .split("\n\n")
    .slice(1)
    .map((s) => s.trim())
    .filter(Boolean);

  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: "SLIDESMITH_16x9", width: SLIDE_WIDTH, height: SLIDE_HEIGHT });
  pptx.layout = "SLIDESMITH_16x9";

  for (const stanza of stanzas) {
    const lines = stanza.split("\n");
    const stanzaGroup = lines[0];
    const lyrics = cleanLineEndings(lines.slice(1).join("\n"));

    const slide = pptx.addSlide();
    slide.background = { path: LYRICS_PPT_BACKGROUND_PATH };

    // Main lyrics text box (leaves room at the bottom for the stanza label).
    slide.addText(lyrics, {
      x: 0,
      y: 0,
      w: SLIDE_WIDTH,
      h: SLIDE_HEIGHT - 0.4,
      align: "center",
      valign: "middle",
      fontFace: FONT_NAME,
      fontSize: FONT_SIZE,
      color: TEXT_COLOR,
      bold: true,
      fill: { color: BG_COLOR, transparency: BG_TRANSPARENCY },
    });

    // Stanza group label at the bottom.
    slide.addText(stanzaGroup, {
      x: 0,
      y: SLIDE_HEIGHT - 0.4,
      w: SLIDE_WIDTH,
      h: 0.4,
      align: "center",
      valign: "middle",
      fontFace: FONT_NAME,
      fontSize: STANZA_GROUP_FONT_SIZE,
      color: TEXT_COLOR,
      bold: true,
      fill: { color: BG_COLOR, transparency: BG_TRANSPARENCY },
    });
  }

  const buffer = await pptx.write({ outputType: "nodebuffer" });
  return { buffer, filename: `${safeFilename(title, "lyrics")}.pptx`, title };
}
