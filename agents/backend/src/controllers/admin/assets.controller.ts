import { Request, Response, NextFunction } from "express";
import path from "path";
import { ValidationError } from "../../utils/errors";
import { getPublicUrl } from "../../services/storageService";

/**
 * POST /api/v1/admin/assets/upload
 * Sube una imagen genérica (logo, banner, slide de carrusel, etc.)
 * y devuelve la URL pública relativa.
 */
export async function uploadAsset(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.file) {
      throw new ValidationError("Se requiere un archivo en el campo 'file'");
    }

    const empresaId = req.tenant!.empresaId;
    const filename = path.basename(req.file.path);
    const url = getPublicUrl(empresaId, filename);

    res.status(201).json({ url });
  } catch (err) {
    next(err);
  }
}
