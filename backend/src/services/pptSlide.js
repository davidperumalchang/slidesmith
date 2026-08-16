/**
 * Create a slide whose photo is a regular picture shape, not a theme/background
 * fill. PowerPoint treats `slide.background` (and masters) as destination-theme
 * chrome, so the image is dropped when slides are copied into another deck.
 *
 * Adding the image first keeps it behind the editable text boxes.
 *
 * @param {object} pptx
 * @param {string} backgroundPath
 * @param {{ width: number, height: number }} size
 */
export function addPptSlide(pptx, backgroundPath, { width, height }) {
  const slide = pptx.addSlide();
  slide.background = { color: "000000" };
  slide.addImage({
    path: backgroundPath,
    x: 0,
    y: 0,
    w: width,
    h: height,
    objectName: "Background",
    altText: "Slide background",
  });
  return slide;
}
