export const CONTENT_TYPES = {
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  pro: "application/octet-stream",
};

// Send a binary buffer as a file download with a safe Content-Disposition.
export function sendDownload(res, buffer, filename, contentType) {
  const asciiFallback = filename.replace(/[^\x20-\x7E]/g, "_").replace(/["\\]/g, "_");
  res.setHeader("Content-Type", contentType);
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
  );
  res.setHeader("Content-Length", buffer.length);
  res.setHeader("X-Filename", encodeURIComponent(filename));
  res.status(200).end(buffer);
}
