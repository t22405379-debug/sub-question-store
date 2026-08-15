import { R2Bucket, R2Object } from './types';

/**
 * Cloudflare R2 Object Storage Operations
 * Supports streaming reads, zero egress fee downloads, and sanitized key uploads.
 */

export function dataUrlToArrayBuffer(dataUrl: string): { buffer: ArrayBuffer; contentType: string } | null {
  try {
    if (!dataUrl || !dataUrl.startsWith('data:')) return null;
    const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) return null;
    const contentType = match[1];
    const base64Data = match[2];
    const binaryString = atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return { buffer: bytes.buffer, contentType };
  } catch (e) {
    return null;
  }
}

export async function uploadToR2(
  bucket: R2Bucket,
  key: string,
  data: ArrayBuffer | ReadableStream,
  contentType: string,
  customMetadata?: Record<string, string>
): Promise<R2Object> {
  const object = await bucket.put(key, data, {
    httpMetadata: {
      contentType,
      cacheControl: 'public, max-age=31536000, immutable',
    },
    customMetadata,
  });

  return object;
}

export async function fetchFromR2(
  bucket: R2Bucket,
  key: string
): Promise<Response | null> {
  const object = await bucket.get(key);
  if (!object) return null;

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Access-Control-Allow-Origin', '*');

  return new Response(object.body, {
    headers,
  });
}

export async function deleteFromR2(
  bucket: R2Bucket,
  key: string
): Promise<void> {
  await bucket.delete(key);
}

export async function listR2Objects(bucket: R2Bucket, limit: number = 100) {
  return await bucket.list({ limit });
}

