// Typed error carrying an HTTP status code. Thrown by services/controllers and
// translated into a safe JSON response by the central error handler.
export class ApiError extends Error {
  constructor(statusCode, message, details = undefined) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.details = details;
  }

  static badRequest(message, details) {
    return new ApiError(400, message, details);
  }

  static unauthorized(message = "Authentication required.", details) {
    return new ApiError(401, message, details);
  }

  static forbidden(message = "Forbidden.", details) {
    return new ApiError(403, message, details);
  }

  static notFound(message, details) {
    return new ApiError(404, message, details);
  }

  static unprocessable(message, details) {
    return new ApiError(422, message, details);
  }

  static internal(message, details) {
    return new ApiError(500, message, details);
  }
}
