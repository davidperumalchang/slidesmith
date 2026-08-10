import multer from "multer";
import { MAX_UPLOAD_BYTES } from "../config.js";

/** @typedef {"doc"|"docx"|"txt"|"md"|"pdf"} DocumentKind */

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const DOC_MIME = "application/msword";

const ALLOWED = {
  ".doc": {
    kind: /** @type {DocumentKind} */ ("doc"),
    mimes: new Set([DOC_MIME, "application/octet-stream"]),
  },
  ".docx": {
    kind: /** @type {DocumentKind} */ ("docx"),
    mimes: new Set([DOCX_MIME, "application/octet-stream", "application/zip"]),
  },
  ".txt": {
    kind: /** @type {DocumentKind} */ ("txt"),
    mimes: new Set(["text/plain", "application/octet-stream", "text/csv"]),
  },
  ".md": {
    kind: /** @type {DocumentKind} */ ("md"),
    mimes: new Set([
      "text/markdown",
      "text/x-markdown",
      "text/plain",
      "application/octet-stream",
    ]),
  },
  ".pdf": {
    kind: /** @type {DocumentKind} */ ("pdf"),
    mimes: new Set(["application/pdf", "application/octet-stream"]),
  },
};

const ACCEPTED_LABEL = ".doc, .docx, .txt, .md, and .pdf";

// In-memory storage: files are processed and returned, never persisted to disk.
const storage = multer.memoryStorage();

function extensionOf(filename) {
  const lower = String(filename ?? "").toLowerCase();
  const idx = lower.lastIndexOf(".");
  if (idx < 0) return "";
  return lower.slice(idx);
}

function fileFilter(_req, file, cb) {
  const ext = extensionOf(file.originalname);
  const rule = ALLOWED[ext];
  if (!rule || !rule.mimes.has(file.mimetype)) {
    cb(
      new multer.MulterError(
        "LIMIT_UNEXPECTED_FILE",
        `Only ${ACCEPTED_LABEL} files are accepted.`,
      ),
    );
    return;
  }
  cb(null, true);
}

export const uploadDocument = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
}).single("document");

// Keep old export name so existing imports don't break unexpectedly.
export const uploadDocx = uploadDocument;

export function detectDocumentKind(filename) {
  return ALLOWED[extensionOf(filename)]?.kind ?? null;
}

export function isValidDocxBuffer(buffer) {
  return (
    Buffer.isBuffer(buffer) &&
    buffer.length >= 4 &&
    buffer[0] === 0x50 && // P
    buffer[1] === 0x4b && // K
    (buffer[2] === 0x03 || buffer[2] === 0x05 || buffer[2] === 0x07) &&
    (buffer[3] === 0x04 || buffer[3] === 0x06 || buffer[3] === 0x08)
  );
}

/** Legacy Word .doc files are OLE Compound Document (CFB) binaries. */
export function isValidDocBuffer(buffer) {
  // D0 CF 11 E0 A1 B1 1A E1
  return (
    Buffer.isBuffer(buffer) &&
    buffer.length >= 8 &&
    buffer[0] === 0xd0 &&
    buffer[1] === 0xcf &&
    buffer[2] === 0x11 &&
    buffer[3] === 0xe0 &&
    buffer[4] === 0xa1 &&
    buffer[5] === 0xb1 &&
    buffer[6] === 0x1a &&
    buffer[7] === 0xe1
  );
}

export function isValidPdfBuffer(buffer) {
  // "%PDF"
  return (
    Buffer.isBuffer(buffer) &&
    buffer.length >= 5 &&
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46 &&
    buffer[4] === 0x2d
  );
}

/**
 * Reject obvious binary payloads for text/markdown uploads.
 * Allows UTF-8 (including BOM) and common whitespace.
 */
export function isValidTextBuffer(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) return false;
  // NUL bytes => binary
  if (buffer.includes(0x00)) return false;

  // Sample up to 8 KiB for high-bit / control-char density.
  const sample = buffer.subarray(0, Math.min(buffer.length, 8192));
  let suspicious = 0;
  for (let i = 0; i < sample.length; i += 1) {
    const b = sample[i];
    // Allow tab/lf/cr and printable ASCII; count other C0 controls.
    if (b < 0x09 || (b > 0x0d && b < 0x20) || b === 0x7f) suspicious += 1;
  }
  if (suspicious / sample.length > 0.05) return false;

  try {
    new TextDecoder("utf-8", { fatal: true }).decode(sample);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate buffer contents for the declared document kind.
 * @param {DocumentKind} kind
 * @param {Buffer} buffer
 */
export function isValidDocumentBuffer(kind, buffer) {
  switch (kind) {
    case "doc":
      return isValidDocBuffer(buffer);
    case "docx":
      return isValidDocxBuffer(buffer);
    case "pdf":
      return isValidPdfBuffer(buffer);
    case "txt":
    case "md":
      return isValidTextBuffer(buffer);
    default:
      return false;
  }
}

export { ACCEPTED_LABEL };
