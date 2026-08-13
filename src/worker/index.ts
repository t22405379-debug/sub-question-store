import { Env, ExecutionContext } from './types';
import { querySubjects, queryQuestionPapers, incrementPaperDownloads } from './db';
import { fetchFromR2, uploadToR2 } from './r2';

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // 1. Health check & Diagnostics
      if (path === '/api/health') {
        let r2Status = 'not configured';
        let d1Status = 'not configured';

        if (env.PAPERS_BUCKET) {
          try {
            await env.PAPERS_BUCKET.list({ limit: 1 });
            r2Status = 'connected (sub-question-r2)';
          } catch (e: any) {
            r2Status = `error: ${e.message}`;
          }
        }

        if (env.DB) {
          try {
            await env.DB.prepare('SELECT 1').run();
            d1Status = 'connected (sub-question-d1)';
          } catch (e: any) {
            d1Status = `error: ${e.message}`;
          }
        }

        return jsonResponse(
          {
            status: 'ok',
            engine: 'Cloudflare Pages Functions',
            r2: r2Status,
            d1: d1Status,
          },
          corsHeaders
        );
      }

      // 2. Query Subjects from D1
      if (path === '/api/subjects' && request.method === 'GET') {
        const yearId = url.searchParams.get('yearId') || undefined;
        const semId = url.searchParams.get('semesterId') || undefined;
        if (env.DB) {
          const results = await querySubjects(env.DB, yearId, semId);
          return jsonResponse(results, corsHeaders);
        }
        return jsonResponse([], corsHeaders);
      }

      // 3. Query Question Papers from D1
      if (path === '/api/papers' && request.method === 'GET') {
        const isAdmin = url.searchParams.get('admin') === 'true';
        if (env.DB) {
          const results = await queryQuestionPapers(env.DB, isAdmin, {
            subjectId: url.searchParams.get('subjectId'),
            examTypeId: url.searchParams.get('examTypeId'),
            sessionYear: url.searchParams.get('sessionYear'),
          });
          return jsonResponse(results, corsHeaders);
        }
        return jsonResponse([], corsHeaders);
      }

      // 4. Upload File Directly to R2 Bucket
      if (path === '/api/papers/upload' && request.method === 'POST') {
        if (!env.PAPERS_BUCKET) {
          return jsonResponse({ error: 'R2 bucket PAPERS_BUCKET is not bound in Cloudflare' }, corsHeaders, 500);
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;
        const key = formData.get('key') as string || `papers/${Date.now()}_${file?.name || 'scan.webp'}`;

        if (!file) {
          return jsonResponse({ error: 'No file provided' }, corsHeaders, 400);
        }

        const arrayBuffer = await file.arrayBuffer();
        await uploadToR2(env.PAPERS_BUCKET, key, arrayBuffer, file.type || 'image/webp', {
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
        });

        return jsonResponse(
          {
            success: true,
            key,
            file_name: file.name,
            file_size: file.size,
            file_type: file.type,
            url: `/api/papers/${encodeURIComponent(key)}/file`,
          },
          corsHeaders
        );
      }

      // 5. Download / Stream Paper Directly from R2 Bucket
      if (path.startsWith('/api/papers/') && path.endsWith('/file') && request.method === 'GET') {
        if (!env.PAPERS_BUCKET) {
          return new Response('R2 bucket not bound', { status: 500, headers: corsHeaders });
        }
        const key = decodeURIComponent(path.replace('/api/papers/', '').replace('/file', ''));
        const fileResponse = await fetchFromR2(env.PAPERS_BUCKET, key);
        if (!fileResponse) {
          return new Response('File not found in R2', { status: 404, headers: corsHeaders });
        }
        return fileResponse;
      }

      // 6. Increment download count in D1
      if (path.startsWith('/api/papers/') && path.endsWith('/download') && request.method === 'POST') {
        const id = path.split('/')[3];
        if (env.DB) {
          await incrementPaperDownloads(env.DB, id);
        }
        return jsonResponse({ success: true, message: 'Download counted' }, corsHeaders);
      }

      // Fallback
      return jsonResponse({ error: 'Endpoint not found', path }, corsHeaders, 404);
    } catch (err: any) {
      return jsonResponse({ error: err?.message || 'Server error' }, corsHeaders, 500);
    }
  },
};

function jsonResponse(data: any, headers: Record<string, string>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}
