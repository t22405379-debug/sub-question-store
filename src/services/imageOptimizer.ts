/**
 * Client-Side Image Optimizer
 * Resizes, optimizes, and strips EXIF GPS/metadata from question paper images
 * before uploading to Cloudflare R2, keeping storage usage minimal and free.
 */

export interface OptimizeResult {
  file: File | Blob;
  dataUrl: string;
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  mimeType: string;
}

export async function optimizeImageFile(
  file: File,
  maxWidth = 1920,
  maxHeight = 2560,
  quality = 0.82
): Promise<OptimizeResult> {
  // If it's already a PDF, return without canvas recompression
  if (file.type === 'application/pdf') {
    const dataUrl = await fileToDataUrl(file);
    return {
      file,
      dataUrl,
      originalSize: file.size,
      optimizedSize: file.size,
      compressionRatio: 0,
      mimeType: 'application/pdf',
    };
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to parse image data'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate scaled dimensions while preserving aspect ratio
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Could not create canvas context'));
        }

        // Fill white background in case of transparent PNG scans
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);

        // Draw image (stripping EXIF metadata automatically)
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to WebP if supported, otherwise JPEG
        const outputMime = 'image/webp';
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              // Fallback to JPEG if WebP blob generation fails
              canvas.toBlob(
                (jpegBlob) => {
                  if (!jpegBlob) return reject(new Error('Compression failed'));
                  const jpegDataUrl = canvas.toDataURL('image/jpeg', quality);
                  const resultFile = new File([jpegBlob], file.name.replace(/\.[^/.]+$/, '.jpg'), {
                    type: 'image/jpeg',
                  });
                  resolve({
                    file: resultFile,
                    dataUrl: jpegDataUrl,
                    originalSize: file.size,
                    optimizedSize: jpegBlob.size,
                    compressionRatio: Math.round(((file.size - jpegBlob.size) / file.size) * 100),
                    mimeType: 'image/jpeg',
                  });
                },
                'image/jpeg',
                quality
              );
              return;
            }

            const dataUrl = canvas.toDataURL(outputMime, quality);
            const resultFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.webp'), {
              type: outputMime,
            });

            resolve({
              file: resultFile,
              dataUrl,
              originalSize: file.size,
              optimizedSize: blob.size,
              compressionRatio: Math.round(((file.size - blob.size) / file.size) * 100),
              mimeType: outputMime,
            });
          },
          outputMime,
          quality
        );
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Auto-Enhance Contrast & Sharpness for camera phone scans
 */
export async function enhanceImageContrast(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(dataUrl);

      // Apply contrast & brightness filter
      ctx.filter = 'contrast(130%) brightness(105%) grayscale(20%)';
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/webp', 0.85));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export function fileToDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('File reading failed'));
    reader.readAsDataURL(file);
  });
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
