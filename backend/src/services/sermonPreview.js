import { ApiError } from "../utils/ApiError.js";

/**
 * Build PowerPoint-style preview slides.
 * Mirrors generateSermonPptx: title → blank → one slide per verse.
 * @param {Array<{title:string, verses:Array<{content:string}>}>} slides
 * @param {object|null} pastor
 * @param {string|null} sermonTitle
 */
function previewPptSlides(slides, pastor, sermonTitle) {
  const titleText =
    sermonTitle && String(sermonTitle).trim()
      ? String(sermonTitle).trim()
      : "[Insert sermon title]";
  const nameText = pastor ? pastor.name : "[Pastor Name]";
  const infoText = pastor
    ? `${pastor.title}, ${pastor.location}`
    : "[Pastor Title] - [Church location]";

  const out = [
    {
      kind: "title",
      reference: null,
      lines: [titleText, nameText, infoText],
      text: [titleText, nameText, infoText].join("\n"),
      title: titleText,
      pastorName: nameText,
      pastorInfo: infoText,
    },
    {
      kind: "blank",
      reference: null,
      lines: [],
      text: "",
      title: null,
      pastorName: null,
      pastorInfo: null,
    },
  ];

  for (const passage of slides) {
    const reference = passage.title ?? "";
    for (const verse of passage.verses ?? []) {
      const content = verse.content ?? "";
      out.push({
        kind: "verse",
        reference,
        lines: content ? content.split("\n") : [],
        text: content,
        title: null,
        pastorName: null,
        pastorInfo: null,
      });
    }
  }

  return { title: titleText, slides: out };
}

/**
 * Build ProPresenter-style preview slides (one slide per verse).
 * Mirrors generateSermonPp7 cue generation.
 * @param {Array<{title:string, verses:Array<{content:string}>}>} slides
 * @param {object|null} pastor
 */
function previewPp7Slides(slides, pastor) {
  const out = [];

  if (pastor) {
    out.push({
      kind: "pastor",
      reference: null,
      lines: [pastor.name, pastor.title, pastor.location],
      text: `${pastor.name}\n${pastor.title}\n${pastor.location}`,
      title: null,
      pastorName: pastor.name,
      pastorInfo: `${pastor.title}\n${pastor.location}`,
    });
  }

  for (const passage of slides) {
    const reference = passage.title ?? "";
    for (const verse of passage.verses ?? []) {
      const content = verse.content ?? "";
      out.push({
        kind: "verse",
        reference,
        lines: content ? content.split("\n") : [],
        text: content,
        title: null,
        pastorName: null,
        pastorInfo: null,
      });
    }
  }

  const title =
    slides[0]?.title ||
    (pastor ? pastor.name : "Sermon");

  return { title, slides: out };
}

/**
 * Preview sermon slides for the selected output format.
 * @param {object} params
 * @param {Array<{title:string, verses:Array<{content:string}>}>} params.slides
 * @param {"ppt"|"pp7"} params.format
 * @param {object|null} [params.pastor]
 * @param {string|null} [params.sermonTitle]
 * @param {boolean} [params.useTheme]
 */
export function previewSermon({
  slides,
  format,
  pastor = null,
  sermonTitle = null,
  useTheme = false,
}) {
  if (!Array.isArray(slides) || slides.length === 0) {
    throw ApiError.unprocessable("No passage data provided to build the sermon preview.");
  }

  const result =
    format === "pp7"
      ? previewPp7Slides(slides, pastor)
      : previewPptSlides(slides, pastor, sermonTitle);

  if (!result.slides.length) {
    throw ApiError.unprocessable("No slides could be built from the passages.");
  }

  return {
    format,
    useTheme: format === "pp7" ? Boolean(useTheme) : false,
    backgroundUrl: format === "ppt" ? "/previews/sermon-bg.jpg" : null,
    title: result.title,
    slideCount: result.slides.length,
    slides: result.slides,
  };
}
