import path from "path";
import fs from "fs";

const UPLOADS_BASE = process.env.UPLOADS_DIR ?? "./uploads";

export function getPublicUrl(empresaId: string, filename: string): string {
  return `/uploads/${empresaId}/${filename}`;
}

export function resolveFilePath(publicUrl: string): string {
  // publicUrl: /uploads/{empresaId}/{filename}
  const relative = publicUrl.replace(/^\/uploads\//, "");
  return path.join(UPLOADS_BASE, relative);
}

export function deleteFile(publicUrl: string): void {
  const fullPath = resolveFilePath(publicUrl);
  try {
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  } catch {
    // silently ignore — file may already be gone
  }
}
