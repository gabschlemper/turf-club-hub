import imageCompression from 'browser-image-compression';

export interface ProcessedImage {
  full: Blob;
  thumb: Blob;
  width: number;
  height: number;
}

/**
 * Compress a photo for upload and produce a small thumbnail.
 * - full: max 1920px, quality ~0.82, WebP
 * - thumb: max 480px, quality ~0.7, WebP
 */
export async function processPhotoForUpload(file: File): Promise<ProcessedImage> {
  const [full, thumb] = await Promise.all([
    imageCompression(file, {
      maxSizeMB: 1.2,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: 'image/webp',
      initialQuality: 0.82,
    }),
    imageCompression(file, {
      maxSizeMB: 0.15,
      maxWidthOrHeight: 480,
      useWebWorker: true,
      fileType: 'image/webp',
      initialQuality: 0.7,
    }),
  ]);

  // Read dimensions from the full version
  const dims = await getImageDimensions(full);

  return { full, thumb, width: dims.width, height: dims.height };
}

function getImageDimensions(blob: Blob): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      resolve({ width: 0, height: 0 });
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}

/** Sanitize a filename for storage. */
export function sanitizeFileName(name: string): string {
  const cleaned = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_');
  return cleaned.slice(0, 80);
}
