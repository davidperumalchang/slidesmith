import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import protobuf from "protobufjs";
import { PROTO_DIR, LYRICS_PP7_DEFAULT_FONT_SIZE } from "../config.js";

// ---------------------------------------------------------------------------
// Protobuf schema loading (lazy + cached)
// ---------------------------------------------------------------------------
let cache = null;

async function loadRoot() {
  const root = new protobuf.Root();
  await new Promise((resolve, reject) => {
    root.load(
      path.join(PROTO_DIR, "presentation.proto"),
      { keepCase: true },
      (err, r) => (err ? reject(err) : resolve(r)),
    );
  });
  return root;
}

export async function getTypes() {
  if (cache) return cache;
  const root = await loadRoot();
  const Presentation = root.lookupType("rv.data.Presentation");
  const Cue = root.lookupType("rv.data.Cue");
  const UUID = root.lookupType("rv.data.UUID");
  const Action = root.lookupType("rv.data.Action");

  let presentationSlideType = 11;
  try {
    const enumType = root.lookupEnum("rv.data.Action.ActionType");
    if (enumType?.values?.ACTION_TYPE_PRESENTATION_SLIDE != null) {
      presentationSlideType = enumType.values.ACTION_TYPE_PRESENTATION_SLIDE;
    }
  } catch {
    /* fall back to 11 */
  }

  cache = { root, Presentation, Cue, UUID, Action, ACTION_TYPE_PRESENTATION_SLIDE: presentationSlideType };
  return cache;
}

// ---------------------------------------------------------------------------
// Read / write / clone helpers
// ---------------------------------------------------------------------------
export async function readPresentation(filePath) {
  const { Presentation } = await getTypes();
  const data = await fs.readFile(filePath);
  return Presentation.decode(data);
}

export async function writePresentation(presentation) {
  const { Presentation } = await getTypes();
  return Buffer.from(Presentation.encode(presentation).finish());
}

export async function cloneCue(cue) {
  const { Cue } = await getTypes();
  return Cue.decode(Cue.encode(cue).finish());
}

export async function makeUuidMessage(value) {
  const { UUID } = await getTypes();
  return UUID.create({ string: value });
}

export function newUuid() {
  return randomUUID();
}

// ---------------------------------------------------------------------------
// Slide element accessors (defensive; mirror the original attribute walks)
// ---------------------------------------------------------------------------
export function getBaseSlide(action) {
  return action?.slide?.presentation?.base_slide ?? null;
}

export function getSlideAction(cue, presentationSlideType) {
  if (!cue?.actions) return null;
  return cue.actions.find((a) => a.type === presentationSlideType) ?? null;
}

export function elementHasText(el) {
  return Boolean(el?.element?.text && el.element.text.rtf_data != null);
}

export function getElementName(el) {
  return el?.element?.name ?? null;
}

export function setElementRtf(el, rtfString) {
  el.element.text.rtf_data = Buffer.from(rtfString, "utf-8");
}

// ---------------------------------------------------------------------------
// RTF helpers
// ---------------------------------------------------------------------------

/**
 * Create RTF text for lyrics slides (ported from lyrics_to_pp7.create_rtf_text).
 */
export function createRtfTextLyrics(
  text,
  { useLeftAlign = false, useBlackColor = false, fontSize = LYRICS_PP7_DEFAULT_FONT_SIZE } = {},
) {
  let rtf =
    "{\\rtf0\\ansi\\ansicpg1252" +
    "{\\fonttbl\\f0\\fnil ArialMT;}" +
    "{\\colortbl\\red255\\green255\\blue255;}" +
    "{\\*\\expandedcolortbl\\csgenericrgb\\c100000\\c100000\\c100000\\c100000;}" +
    "{\\*\\listtable}{\\*\\listoverridetable}" +
    "\\uc1\\paperw28800\\margl0\\margr0\\margt0\\margb0";

  if (useBlackColor) {
    rtf =
      "{\\rtf0\\ansi\\ansicpg1252" +
      "{\\fonttbl\\f0\\fnil ArialMT;}" +
      "{\\colortbl\\red0\\green0\\blue0;\\red255\\green255\\blue255;}" +
      "{\\*\\expandedcolortbl\\csgenericrgb\\c0\\c0\\c0\\c100000;\\csgenericrgb\\c100000\\c100000\\c100000\\c100000;}" +
      "{\\*\\listtable}{\\*\\listoverridetable}" +
      "\\uc1\\paperw12240\\margl0\\margr0\\margt0\\margb0";
  }

  const lines = String(text).split("\n");
  const alignment = useLeftAlign ? "\\ql" : "\\qc";
  const colorIndex = "\\cf0";
  const strokeColor = useBlackColor ? "\\strokec1" : "\\strokec0";

  let rtfContent = "";
  lines.forEach((line, i) => {
    if (i > 0) rtfContent += "\\par";
    rtfContent +=
      "\\pard" +
      alignment +
      "\\li0\\fi0\\ri0\\sb0\\sa0\\sl240\\slmult1\\slleading0\\f0\\b0\\i0\\ul0\\strike0\\fs" +
      String(fontSize) +
      "\\expnd0\\expndtw0" +
      colorIndex +
      "\\strokewidth0" +
      strokeColor +
      "\\nosupersub ";
    rtfContent += line;
  });

  return rtf + rtfContent + "}";
}

/**
 * Create RTF text for sermon slides (ported from sermon_to_pp7.create_rtf_text).
 * @param {string} text
 * @param {"reference"|"verse"|"pastor"} elementType
 * @param {boolean} useTheme
 */
export function createRtfTextSermon(text, elementType = "verse", useTheme = false) {
  let fontSize;
  let alignment;
  let rtf;

  const bodyThemeHeader =
    "{\\rtf1\\ansi\\ansicpg1252\\cocoartf2821" +
    "\\cocoatextscaling0\\cocoaplatform0{\\fonttbl\\f0\\fswiss\\fcharset0 Arial-BoldMT;}";

  if (useTheme) {
    if (elementType === "reference") {
      fontSize = 35 * 2;
      alignment = "\\qc";
      rtf =
        bodyThemeHeader +
        "{\\colortbl;\\red255\\green255\\blue255;\\red0\\green0\\blue0;}" +
        "{\\*\\expandedcolortbl;;\\csgenericrgb\\c0\\c0\\c0;}" +
        "\\deftab1680";
    } else if (elementType === "pastor") {
      fontSize = 40 * 2;
      alignment = "\\qc";
      rtf =
        bodyThemeHeader +
        "{\\colortbl;\\red255\\green255\\blue255;\\red255\\green255\\blue255;}" +
        "{\\*\\expandedcolortbl;;\\csgenericrgb\\c100000\\c100000\\c100000;}" +
        "\\deftab1680";
    } else {
      fontSize = 40 * 2;
      alignment = "\\ql";
      rtf =
        bodyThemeHeader +
        "{\\colortbl;\\red255\\green255\\blue255;\\red255\\green255\\blue255;}" +
        "{\\*\\expandedcolortbl;;\\csgenericrgb\\c100000\\c100000\\c100000;}" +
        "\\deftab1680";
    }
  } else if (elementType === "reference") {
    fontSize = 50 * 2;
    alignment = "\\qc";
    rtf =
      bodyThemeHeader +
      "{\\colortbl;\\red255\\green255\\blue255;\\red255\\green255\\blue255;}" +
      "{\\*\\expandedcolortbl;;\\csgenericrgb\\c100000\\c100000\\c100000;}" +
      "\\deftab1680";
  } else if (elementType === "pastor") {
    fontSize = 55 * 2;
    alignment = "\\qc";
    rtf =
      bodyThemeHeader +
      "{\\colortbl;\\red255\\green255\\blue255;\\red255\\green255\\blue255;}" +
      "{\\*\\expandedcolortbl;;\\csgenericrgb\\c100000\\c100000\\c100000;}" +
      "\\deftab1680";
  } else {
    fontSize = 60 * 2;
    alignment = "\\ql";
    rtf =
      bodyThemeHeader +
      "{\\colortbl;\\red255\\green255\\blue255;\\red255\\green255\\blue255;}" +
      "{\\*\\expandedcolortbl;;\\csgenericrgb\\c100000\\c100000\\c100000;}" +
      "\\deftab1680";
  }

  const leading = "\\slleading200";
  const colorRef = "\\cf2";

  const lines = String(text).split("\n");
  let rtfContent = "";
  lines.forEach((rawLine, i) => {
    if (i > 0) rtfContent += "\\par";
    const line = rawLine
      .replace(/\\/g, "\\\\")
      .replace(/\{/g, "\\{")
      .replace(/\}/g, "\\}")
      .replace(/"/g, '\\"');
    rtfContent +=
      "\\pard\\pardeftab1680" +
      leading +
      alignment +
      "\\partightenfactor0" +
      "\\f0\\b\\fs" +
      String(fontSize) +
      " " +
      colorRef +
      " \\kerning1\\expnd12\\expndtw60 " +
      line;
  });

  return rtf + rtfContent + "}";
}

/** Extract plain text from RTF bytes/string (ported from lyrics_to_pp7). */
export function extractTextFromRtf(rtfData) {
  try {
    let rtfText;
    if (rtfData == null) return "";
    if (Buffer.isBuffer(rtfData) || rtfData instanceof Uint8Array) {
      rtfText = Buffer.from(rtfData).toString("utf-8");
    } else {
      rtfText = String(rtfData);
    }
    let text = rtfText.replace(/\\[a-zA-Z0-9]+-?[0-9]*[ ]?/g, "");
    text = text.replace(/[{}]/g, "");
    text = text.replace(/\\'[0-9a-fA-F]{2}/g, "");
    // eslint-disable-next-line no-control-regex
    text = text.replace(/[\x00-\x1F\x7F]/g, "");
    text = text.replace(/\s+/g, " ").trim();
    return text;
  } catch {
    return "Error extracting text";
  }
}
