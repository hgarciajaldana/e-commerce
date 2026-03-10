import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import multer from "multer";
import { AppError } from "../utils/errors";

export function errorMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  // Zod validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Datos de entrada inválidos",
        details: err.errors.map((e) => ({
          campo: e.path.join("."),
          mensaje: e.message,
        })),
      },
    });
    return;
  }

  // Multer errors (file upload)
  if (err instanceof multer.MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "El archivo supera el tamaño máximo permitido (10 MB)"
        : `Error al subir el archivo: ${err.message}`;
    res.status(400).json({ error: { code: "FILE_UPLOAD_ERROR", message } });
    return;
  }

  // AppError (errores conocidos del negocio)
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details !== undefined && { details: err.details }),
      },
    });
    return;
  }

  // Error desconocido — loggear y retornar 500 genérico
  console.error("[ERROR]", err);
  res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "Error interno del servidor",
    },
  });
}
