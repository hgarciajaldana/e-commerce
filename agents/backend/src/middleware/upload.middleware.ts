import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { Request } from "express";
import { AppError } from "../utils/errors";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_MB = parseInt(process.env.UPLOAD_MAX_SIZE_MB ?? "10", 10);
const UPLOADS_BASE = process.env.UPLOADS_DIR ?? "./uploads";

const storage = multer.diskStorage({
  destination(req: Request, _file, cb) {
    const empresaId = req.tenant?.empresaId ?? (req.auth as Record<string, string | undefined>)?.empresaId ?? "unknown";
    const dir = path.join(UPLOADS_BASE, empresaId);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename(_req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

function fileFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError(400, "INVALID_FILE_TYPE", "Tipo de archivo no permitido. Solo jpeg, png, webp"));
  }
}

export const uploadImage = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE_MB * 1024 * 1024 },
});
