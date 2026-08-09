import multer from "multer";
import { MAX_UPLOAD_BYTES } from "../config.js";

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

// In-memory storage: files are processed and returned, never persisted to disk.
const storage = multer.memoryStorage();

function fileFilter(_req, file, cb) {
  const isDocxExt = file.originalname.toLowerCase().endsWith(".docx");
  const isDocxMime = file.mimetype === DOCX_MIME || file.mimetype === "application/octet-stream";
  if (isDocxExt && isDocxMime) {
    cb(null, true);
  } else {
    cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", "Only .docx files are accepted."));
  }
}

export const uploadDocx = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
}).single("document");

// DOCX files are ZIP archives: verify the PK magic number (defense in depth,
// don't trust the client-declared extension/mime alone).
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
