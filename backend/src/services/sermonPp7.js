import { SERMON_PP7_TEMPLATE_SIMPLE, SERMON_PP7_TEMPLATE_THEME } from "../config.js";
import { ApiError } from "../utils/ApiError.js";
import {
  getTypes,
  readPresentation,
  writePresentation,
  cloneCue,
  createRtfTextSermon,
  getBaseSlide,
  getElementName,
  elementHasText,
  setElementRtf,
  newUuid,
} from "./proPresenter.js";

const PASTOR_PATTERN = /Pastor|Senior Pastor|Associate Pastor/;

// Find the cue that contains both a "Reference" and a "Verse" element.
function findReferenceVerseCue(presentation, slideType) {
  for (const cue of presentation.cues ?? []) {
    let hasReference = false;
    let hasVerse = false;
    for (const action of cue.actions ?? []) {
      if (action.type !== slideType) continue;
      const baseSlide = getBaseSlide(action);
      for (const el of baseSlide?.elements ?? []) {
        const name = getElementName(el);
        if (name === "Reference") hasReference = true;
        else if (name === "Verse") hasVerse = true;
      }
    }
    if (hasReference && hasVerse) return cue;
  }
  return null;
}

function detectTemplateType(templateCue, slideType) {
  const result = { hasTheme: false, refIndex: -1, verseIndex: -1 };
  const slideAction = (templateCue.actions ?? []).find((a) => a.type === slideType);
  if (!slideAction) return result;

  const baseSlide = getBaseSlide(slideAction);
  if (!baseSlide?.elements?.length) return result;

  baseSlide.elements.forEach((el, i) => {
    const name = getElementName(el);
    if (name === "Reference") result.refIndex = i;
    else if (name === "Verse") result.verseIndex = i;
  });
  result.hasTheme = baseSlide.elements.length > 2;
  return result;
}

function findPastorInfoElement(presentation, slideType) {
  for (const cue of presentation.cues ?? []) {
    for (const action of cue.actions ?? []) {
      if (action.type !== slideType) continue;
      const baseSlide = getBaseSlide(action);
      const elements = baseSlide?.elements ?? [];
      for (let i = 0; i < elements.length; i += 1) {
        const el = elements[i];
        if (elementHasText(el)) {
          const rtf = Buffer.from(el.element.text.rtf_data).toString("utf-8");
          if (PASTOR_PATTERN.test(rtf)) return { cue, elementIndex: i };
        }
      }
    }
  }
  return null;
}

/**
 * Generate a ProPresenter 7 (.pro) sermon file from passage data.
 * @param {object} params
 * @param {Array<{title:string, verses:Array<{content:string}>}>} params.slides
 * @param {object|null} [params.pastor]
 * @param {boolean} [params.useTheme]
 * @returns {Promise<{buffer:Buffer, filename:string, slideCount:number}>}
 */
export async function generateSermonPp7({ slides, pastor = null, useTheme = false }) {
  if (!Array.isArray(slides) || slides.length === 0) {
    throw ApiError.unprocessable("No passage data provided to build the sermon presentation.");
  }

  const { UUID, ACTION_TYPE_PRESENTATION_SLIDE: slideType } = await getTypes();
  const mkUuid = (v) => UUID.create({ string: v });

  const templatePath = useTheme ? SERMON_PP7_TEMPLATE_THEME : SERMON_PP7_TEMPLATE_SIMPLE;
  const presentation = await readPresentation(templatePath);

  const templateCue = findReferenceVerseCue(presentation, slideType);
  if (!templateCue) {
    throw ApiError.internal("Template slide with Reference and Verse elements not found.");
  }

  const { hasTheme, refIndex, verseIndex } = detectTemplateType(templateCue, slideType);
  if (refIndex === -1 || verseIndex === -1) {
    throw ApiError.internal("Could not find Reference or Verse elements in the template.");
  }

  const cueGroup = presentation.cue_groups?.length ? presentation.cue_groups[0] : null;

  let isFirst = true;
  for (const referenceData of slides) {
    const referenceTitle = referenceData.title ?? "";
    const verses = referenceData.verses ?? [];

    for (let verseIdx = 0; verseIdx < verses.length; verseIdx += 1) {
      const verseContent = verses[verseIdx].content ?? "";

      let currentCue;
      if (isFirst) {
        currentCue = templateCue;
      } else {
        currentCue = await cloneCue(templateCue);
        const newCueUuid = newUuid();
        currentCue.uuid = mkUuid(newCueUuid);
        presentation.cues.push(currentCue);
        if (cueGroup) {
          cueGroup.cue_identifiers = cueGroup.cue_identifiers ?? [];
          cueGroup.cue_identifiers.push(mkUuid(newCueUuid));
        }
      }

      currentCue.name = `${referenceTitle} - Verse ${verseIdx + 1}`;

      for (const action of currentCue.actions ?? []) {
        if (action.type !== slideType) continue;
        if (!isFirst) action.uuid = mkUuid(newUuid());

        const baseSlide = getBaseSlide(action);
        if (!baseSlide) continue;
        if (!isFirst) baseSlide.uuid = mkUuid(newUuid());

        const elements = baseSlide.elements ?? [];
        elements.forEach((el, i) => {
          if (!isFirst) el.element.uuid = mkUuid(newUuid());
          if (i === refIndex) {
            setElementRtf(el, createRtfTextSermon(referenceTitle, "reference", hasTheme));
          } else if (i === verseIndex) {
            setElementRtf(el, createRtfTextSermon(verseContent, "verse", hasTheme));
          }
        });
      }

      isFirst = false;
    }
  }

  // Update pastor info on the template's title/pastor cue if present.
  if (pastor) {
    const found = findPastorInfoElement(presentation, slideType);
    if (found) {
      const pastorText = `${pastor.name}\n${pastor.title}\n${pastor.location}`;
      const rtf = createRtfTextSermon(pastorText, "pastor", useTheme);
      const el = found.cue.actions.find((a) => a.type === slideType)
        ? getBaseSlide(found.cue.actions.find((a) => a.type === slideType)).elements[found.elementIndex]
        : null;
      if (el) setElementRtf(el, rtf);
    }
  }

  const buffer = await writePresentation(presentation);
  return { buffer, filename: "Sermon.pro", slideCount: presentation.cues.length };
}
