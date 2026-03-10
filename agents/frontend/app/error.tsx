'use client';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Algo salió mal</h2>
        <p className="text-gray-500 mb-4 text-sm">{error.message || 'Error inesperado'}</p>
        <button
          onClick={reset}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-700 transition-colors"
        >
          Intentar de nuevo
        </button>
      </div>
    </div>
  );
}
