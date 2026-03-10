export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(
      404,
      "NOT_FOUND",
      id ? `${resource} con id '${id}' no encontrado` : `${resource} no encontrado`
    );
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "No autorizado") {
    super(401, "UNAUTHORIZED", message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Acceso denegado") {
    super(403, "FORBIDDEN", message);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: unknown) {
    super(409, "CONFLICT", message, details);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(400, "VALIDATION_ERROR", message, details);
  }
}

export class OccConflictError extends AppError {
  constructor(resource: string) {
    super(
      409,
      "OCC_CONFLICT",
      `Conflicto de concurrencia en ${resource}. El recurso fue modificado por otra operación. Recarga e intenta nuevamente.`
    );
  }
}
