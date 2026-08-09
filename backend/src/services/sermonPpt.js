import { createRequire } from "node:module";
import { SERMON_PPT_BACKGROUND_PATH } from "../config.js";

// See lyricsPpt.js: load pptxgenjs' CommonJS build for cross-Node ESM support.
const require = createRequire(import.meta.url);
const pptxgenModule = require("pptxgenjs");
const PptxGenJS = pptxgenModule.default ?? pptxgenModule;
import { ApiError } from "../utils/ApiError.js";

const SLIDE_WIDTH = 16;
const SLIDE_HEIGHT = 9;
const FONT_NAME = "Arial";
const TEXT_COLOR = "FFFFFF";
const BG_COLOR = "000000";
const BG_TRANSPARENCY = 20;

const TITLE_FONT_SIZE = 50;
const VERSE_FONT_SIZE = 45;
const SERMON_TITLE_FONT_SIZE = 55;
const PASTOR_NAME_FONT_SIZE = 45;
const PASTOR_INFO_FONT_SIZE = 35;

function darkFill() {
  return { color: BG_COLOR, transparency: BG_TRANSPARENCY };
}

function addTitleSlide(pptx, pastor, sermonTitle) {
  const slide = pptx.addSlide();
  slide.background = { path: SERMON_PPT_BACKGROUND_PATH };

  const titleText = sermonTitle && sermonTitle.trim() ? sermonTitle.trim() : "[Insert sermon title]";
  const nameText = pastor ? pastor.name : "[Pastor Name]";
  const infoText = pastor ? `${pastor.title}, ${pastor.location}` : "[Pastor Title] - [Church location]";

  slide.addText(
    [
      { text: titleText, options: { fontSize: SERMON_TITLE_FONT_SIZE, breakLine: true } },
      { text: " ", options: { fontSize: 20, breakLine: true } },
      { text: nameText, options: { fontSize: PASTOR_NAME_FONT_SIZE, breakLine: true } },
      { text: infoText, options: { fontSize: PASTOR_INFO_FONT_SIZE, breakLine: true } },
    ],
    {
      x: 1,
      y: (SLIDE_HEIGHT - 4) / 2,
      w: SLIDE_WIDTH - 2,
      h: 4,
      align: "center",
      valign: "middle",
      fontFace: FONT_NAME,
      color: TEXT_COLOR,
      bold: true,
      fill: darkFill(),
    },
  );
}

function addEmptySlide(pptx) {
  const slide = pptx.addSlide();
  slide.background = { path: SERMON_PPT_BACKGROUND_PATH };
}

function addVerseSlide(pptx, referenceTitle, verseContent) {
  const slide = pptx.addSlide();
  slide.background = { path: SERMON_PPT_BACKGROUND_PATH };

  slide.addText(referenceTitle, {
    x: 0.5,
    y: 0.5,
    w: 15,
    h: 1.5,
    align: "center",
    valign: "middle",
    fontFace: FONT_NAME,
    fontSize: TITLE_FONT_SIZE,
    color: TEXT_COLOR,
    bold: true,
    fill: darkFill(),
  });

  slide.addText(verseContent, {
    x: 0.5,
    y: 2.5,
    w: 15,
    h: 5.5,
    align: "left",
    valign: "top",
    fontFace: FONT_NAME,
    fontSize: VERSE_FONT_SIZE,
    color: TEXT_COLOR,
    bold: true,
    fill: darkFill(),
  });
}

/**
 * Generate a sermon PowerPoint.
 * @param {object} params
 * @param {Array<{title:string, verses:Array<{content:string}>}>} params.slides
 * @param {object|null} [params.pastor]
 * @param {string|null} [params.sermonTitle]
 * @returns {Promise<{buffer:Buffer, filename:string}>}
 */
export async function generateSermonPptx({ slides, pastor = null, sermonTitle = null }) {
  if (!Array.isArray(slides) || slides.length === 0) {
    throw ApiError.unprocessable("No passage data provided to build the sermon presentation.");
  }

  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: "SLIDESMITH_16x9", width: SLIDE_WIDTH, height: SLIDE_HEIGHT });
  pptx.layout = "SLIDESMITH_16x9";

  addTitleSlide(pptx, pastor, sermonTitle);
  addEmptySlide(pptx);

  for (const passage of slides) {
    const referenceTitle = passage.title ?? "";
    for (const verse of passage.verses ?? []) {
      addVerseSlide(pptx, referenceTitle, verse.content ?? "");
    }
  }

  const buffer = await pptx.write({ outputType: "nodebuffer" });
  return { buffer, filename: "sermon_ppt.pptx" };
}
