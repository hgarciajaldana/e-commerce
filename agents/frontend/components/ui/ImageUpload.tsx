'use client';

import { useRef, useState } from 'react';
import { Upload, X, ImageIcon } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { getImageUrl } from '@/lib/utils';

interface ImageUploadProps {
  label?: string;
  value?: string | null;
  onChange: (url: string) => void;
  onClear?: () => void;
  hint?: string;
  aspectRatio?: 'square' | 'video' | 'banner' | 'free';
}

const ASPECT_CLASSES: Record<string, string> = {
  square: 'aspect-square',
  video: 'aspect-video',
  banner: 'aspect-[3/1]',
  free: 'h-32',
};

export default function ImageUpload({
  label,
  value,
  onChange,
  onClear,
  hint,
  aspectRatio = 'video',
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Solo se permiten imágenes (jpg, png, webp)');
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const res = await adminApi.uploadAsset(file);
      onChange(res.url);
    } catch {
      setError('Error al subir la imagen. Intenta de nuevo.');
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const aspectClass = ASPECT_CLASSES[aspectRatio] ?? ASPECT_CLASSES.video;

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      )}

      {value ? (
        /* Preview con botón de quitar */
        <div className={`relative rounded-lg overflow-hidden bg-gray-100 ${aspectClass}`}>
          <img
            src={getImageUrl(value)}
            alt="preview"
            className="w-full h-full object-cover"
          />
          {/* Overlay con acciones */}
          <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg text-xs font-medium text-gray-800 hover:bg-gray-100 transition-colors"
            >
              <Upload size={13} />
              Cambiar
            </button>
            {onClear && (
              <button
                type="button"
                onClick={onClear}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 rounded-lg text-xs font-medium text-white hover:bg-red-600 transition-colors"
              >
                <X size={13} />
                Quitar
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Drop zone */
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          disabled={uploading}
          className={`w-full ${aspectClass} rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer ${
            dragOver
              ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
              : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
          } ${uploading ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-1.5">
              <div className="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-gray-500">Subiendo...</span>
            </div>
          ) : (
            <>
              <ImageIcon size={24} className="text-gray-400" />
              <div className="text-center">
                <p className="text-sm text-gray-600 font-medium">
                  <span className="text-[var(--color-primary)]">Haz clic</span> o arrastra una imagen
                </p>
                <p className="text-xs text-gray-400 mt-0.5">JPG, PNG, WEBP · máx 10 MB</p>
              </div>
            </>
          )}
        </button>
      )}

      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
      {hint && !error && <p className="mt-1.5 text-xs text-gray-400">{hint}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleInputChange}
      />
    </div>
  );
}
