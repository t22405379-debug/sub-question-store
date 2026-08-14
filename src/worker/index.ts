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

      // 2. Admin Authentication via Cloudflare D1 SQL (Zero Hardcoding)
      if (path === '/api/admin/login' && request.method === 'POST') {
        if (!env.DB) {
          return jsonResponse({ success: false, error: 'D1 database not connected' }, corsHeaders, 500);
        }

        const { username, password } = await request.json() as any;
        if (!username || !password) {
          return jsonResponse({ success: false, error: 'Username and password required' }, corsHeaders, 400);
        }

        const userRow = await env.DB.prepare(
          'SELECT id, username, password_hash, salt, display_name, role FROM admin_users WHERE username = ?'
        )
          .bind(username.trim())
          .first<{
            id: string;
            username: string;
            password_hash: string;
            salt: string;
            display_name: string;
            role: string;
          }>();

        // Verify PBKDF2 hash with 100,000 iterations using Web Crypto API
        const computedHash = await pbkdf2Hash(password, userRow.salt);
        const isMatch = timingSafeEqual(computedHash, userRow.password_hash);

        if (!isMatch) {
          return jsonResponse({ success: false, error: 'Invalid credentials' }, corsHeaders, 401);
        }

        // Update last login timestamp in D1
        await env.DB.prepare('UPDATE admin_users SET last_login = CURRENT_TIMESTAMP WHERE id = ?')
          .bind(userRow.id)
          .run();

        const token = `cf_${Date.now()}_${crypto.randomUUID()}`;
        return jsonResponse(
          {
            success: true,
            token,
            user: {
              id: userRow.id,
              username: userRow.username,
              display_name: userRow.display_name,
              role: userRow.role,
            },
          },
          corsHeaders
        );
      }

      // 3. Query Subjects from D1
      if (path === '/api/subjects' && request.method === 'GET') {
        const yearId = url.searchParams.get('yearId') || undefined;
        const semId = url.searchParams.get('semesterId') || undefined;
        if (env.DB) {
          const results = await querySubjects(env.DB, yearId, semId);
          return jsonResponse(results, corsHeaders);
        }
        return jsonResponse([], corsHeaders);
      }

      // 4. Query Question Papers from D1
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

      // 5. Upload File Directly to R2 Bucket
      if (path === '/api/papers/upload' && request.method === 'POST') {
        if (!env.PAPERS_BUCKET) {
          return jsonResponse({ error: 'R2 bucket PAPERS_BUCKET is not bound in Cloudflare' }, corsHeaders, 500);
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;
        const key = (formData.get('key') as string) || `papers/${Date.now()}_${file?.name || 'scan.webp'}`;

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

      // 6. Download / Stream Paper Directly from R2 Bucket
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

      // 7. Increment download count in D1
      if (path.startsWith('/api/papers/') && path.endsWith('/download') && request.method === 'POST') {
        const id = path.split('/')[3];
        if (env.DB) {
          await incrementPaperDownloads(env.DB, id);
        }
        return jsonResponse({ success: true, message: 'Download counted' }, corsHeaders);
      }

      // 8. Multi-Model Cloudflare Workers AI Question Explainer & Formula Solver
      if (path === '/api/ai/ask' && request.method === 'POST') {
        const body = (await request.json().catch(() => ({}))) as any;
        const prompt = (body.prompt || '').trim();
        const courseCode = body.courseCode || 'General';
        const subjectName = body.subjectName || '';
        const examType = body.examType || '';
        const requestedModel = body.model || 'auto';

        if (!prompt) {
          return jsonResponse({ error: 'Please provide a question or problem description.' }, corsHeaders, 400);
        }

        // Smart Model Selector: Route to the optimal model based on subject & prompt
        let targetModel = requestedModel;
        if (targetModel === 'auto') {
          const lower = (prompt + ' ' + courseCode + ' ' + subjectName).toLowerCase();
          if (
            lower.includes('code') ||
            lower.includes('c++') ||
            lower.includes('java') ||
            lower.includes('python') ||
            lower.includes('algorithm') ||
            lower.includes('complexity') ||
            lower.includes('pointer') ||
            lower.includes('function')
          ) {
            targetModel = '@cf/mistral/mistral-7b-instruct-v0.2'; // Code specialist
          } else if (
            lower.includes('math') ||
            lower.includes('proof') ||
            lower.includes('integral') ||
            lower.includes('derivative') ||
            lower.includes('calculus') ||
            lower.includes('matrix') ||
            lower.includes('circuit') ||
            lower.includes('voltage') ||
            lower.includes('current')
          ) {
            targetModel = '@cf/deepseek-ai/deepseek-r1-distill-qwen-32b'; // Deep reasoning & math specialist
          } else {
            targetModel = '@cf/meta/llama-3.3-70b-instruct'; // Flagship general tutor
          }
        }

        const modelDisplayNames: Record<string, string> = {
          '@cf/meta/llama-3.3-70b-instruct': 'Meta Llama 3.3 (70B)',
          '@cf/deepseek-ai/deepseek-r1-distill-qwen-32b': 'DeepSeek R1 (32B Reasoning)',
          '@cf/qwen/qwq-32b': 'Qwen QwQ (32B Math)',
          '@cf/mistral/mistral-7b-instruct-v0.2': 'Mistral 7B (Code & Algorithms)',
          '@cf/meta/llama-3.1-8b-instruct': 'Meta Llama 3.1 (8B Fast)',
        };

        if (env.AI) {
          // Model execution with automatic fallback cascade
          const modelsToTry = [
            targetModel,
            '@cf/meta/llama-3.3-70b-instruct',
            '@cf/meta/llama-3.1-8b-instruct',
          ];

          for (const modelName of modelsToTry) {
            try {
              const aiResult = await env.AI.run(modelName as any, {
                messages: [
                  {
                    role: 'system',
                    content: `You are an expert University Examination Professor and Academic Tutor for ${courseCode} (${subjectName} - ${examType}).
Provide rigorous, structured, step-by-step academic solutions, mathematical formulas, and problem-solving hints tailored for undergraduate university students.
Format with clean markdown:
- **Concept / Theorem / Formula Involved**
- **Step-by-Step Mathematical/Algorithmic Derivation**
- **Final Answer / Exam Tip to avoid common student mistakes**`,
                  },
                  {
                    role: 'user',
                    content: prompt,
                  },
                ],
              });

              const answer = aiResult?.response || aiResult?.result;
              if (answer) {
                return jsonResponse(
                  {
                    success: true,
                    answer,
                    model: modelName,
                    modelDisplayName: modelDisplayNames[modelName] || modelName,
                  },
                  corsHeaders
                );
              }
            } catch (aiErr: any) {
              console.warn(`Model ${modelName} attempt failed, trying fallback:`, aiErr?.message);
            }
          }
        }

        // Resilient fallback explanation if AI binding is offline
        return jsonResponse(
          {
            success: true,
            answer: `### Academic Solution Framework for ${courseCode} (${subjectName})

**Question Analyzed:**
> ${prompt}

#### 1. Core Principle & Governing Formulas:
- Identify key variables and standard university syllabus parameters for **${courseCode}**.
- State standard boundary conditions and theorem assumptions.

#### 2. Analytical Approach:
1. Break down given parameters and given numerical data.
2. Substitute into the standard governing formula step-by-step.
3. Validate units and dimensional consistency.

#### 3. Key Exam Strategy:
* Show complete intermediate calculation steps to secure full partial marking.
* Draw clear schematics, diagrams, or trace tables in your answer script.`,
            model: 'academic-tutor-engine',
            modelDisplayName: 'Academic Study Framework',
          },
          corsHeaders
        );
      }

      // Fallback
      return jsonResponse({ error: 'Endpoint not found', path }, corsHeaders, 404);
    } catch (err: any) {
      return jsonResponse({ error: err?.message || 'Server error' }, corsHeaders, 500);
    }
  },
};

// PBKDF2 Web Cryptography hasher for Edge Runtime
async function pbkdf2Hash(password: string, saltHex: string): Promise<string> {
  const enc = new TextEncoder();
  const salt = enc.encode(saltHex);
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), { name: 'PBKDF2' }, false, [
    'deriveBits',
  ]);

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  return bufferToHex(derivedBits);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

function hexToBuffer(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

function bufferToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function jsonResponse(data: any, headers: Record<string, string>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}
