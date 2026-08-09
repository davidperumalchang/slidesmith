import multer from "multer";
import { ApiError } from "../utils/ApiError.js";
import { NODE_ENV } from "../config.js";

export function notFoundHandler(_req, res) {
  res.status(404).json({ error: "Not found." });
}

// Central error handler. Emits safe, generic messages to clients while logging
// full detail server-side. Must keep the 4-arg signature for Express.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      error: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
  }

  if (err instanceof multer.MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "Uploaded file is too large."
        : err.field || err.message || "File upload failed.";
    return res.status(400).json({ error: message });
  }

  // Unknown / unexpected error: log full detail, return generic message.
  console.error("[error]", err);
  const body = { error: "An unexpected error occurred." };
  if (NODE_ENV !== "production") body.detail = String(err?.message ?? err);
  return res.status(500).json(body);
}
