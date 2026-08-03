/**
 * Base class for errors that should be translated into a specific HTTP
 * response by the error-handling middleware. Anything thrown that is *not*
 * an AppError is treated as an unexpected 500.
 */
export class AppError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = new.target.name;
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** 400 — request body failed validation (e.g. zod). */
export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

/** 404 — referenced resource does not exist. */
export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404);
  }
}

/** 409 — resource exists but is not in a state that allows this operation. */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}

/** 500 — the upstream AI provider failed to produce a usable result. */
export class UpstreamAIError extends AppError {
  constructor(message: string, public readonly cause?: unknown) {
    super(message, 500);
  }
}
