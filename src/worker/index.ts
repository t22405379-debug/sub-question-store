import { Env, ExecutionContext } from './types';
import { querySubjects, queryQuestionPapers, incrementPaperDownloads } from './db';
import { fetchFromR2 } from './r2';

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
      // 1. Health check
      if (path === '/api/health') {
        return jsonResponse({ status: 'ok', engine: 'Cloudflare Worker + D1 + R2' }, corsHeaders);
      }

      // 2. Query Subjects
      if (path === '/api/subjects' && request.method === 'GET') {
        const yearId = url.searchParams.get('yearId') || undefined;
        const semId = url.searchParams.get('semesterId') || undefined;
        const results = await querySubjects(env.DB, yearId, semId);
        return jsonResponse(results, corsHeaders);
      }

      // 3. Query Question Papers
      if (path === '/api/papers' && request.method === 'GET') {
        const isAdmin = url.searchParams.get('admin') === 'true';
        const results = await queryQuestionPapers(env.DB, isAdmin, {
          subjectId: url.searchParams.get('subjectId'),
          examTypeId: url.searchParams.get('examTypeId'),
          sessionYear: url.searchParams.get('sessionYear'),
        });
        return jsonResponse(results, corsHeaders);
      }

      // 4. Download / Stream Paper from R2
      if (path.startsWith('/api/papers/') && path.endsWith('/file') && request.method === 'GET') {
        const key = decodeURIComponent(path.replace('/api/papers/', '').replace('/file', ''));
        const fileResponse = await fetchFromR2(env.PAPERS_BUCKET, key);
        if (!fileResponse) {
          return new Response('File not found', { status: 404, headers: corsHeaders });
        }
        return fileResponse;
      }

      // 5. Increment download count
      if (path.startsWith('/api/papers/') && path.endsWith('/download') && request.method === 'POST') {
        const id = path.split('/')[3];
        await incrementPaperDownloads(env.DB, id);
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
