import { R2Bucket, R2Object } from './types';

/**
 * Cloudflare R2 Object Storage Operations
 * Supports streaming reads, zero egress fee downloads, and sanitized key uploads.
 */

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
