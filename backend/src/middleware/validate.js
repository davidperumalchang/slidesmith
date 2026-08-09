import { ZodError } from "zod";
import { ApiError } from "../utils/ApiError.js";

// Validate and coerce req.body against a zod schema. On success the parsed data
// replaces req.body; on failure a 400 with field details is thrown.
export const validateBody = (schema) => (req, _res, next) => {
  try {
    req.body = schema.parse(req.body ?? {});
    next();
  } catch (err) {
    if (err instanceof ZodError) {
      const details = err.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
      }));
      next(ApiError.badRequest("Invalid request body.", details));
    } else {
      next(err);
    }
  }
};
