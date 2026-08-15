import { D1Database } from './types';

/**
 * Cloudflare D1 Parameterized Database Operations
 * All queries strictly use prepared statements with positional parameters (?)
 * to ensure 100% immunity against SQL injection vulnerabilities.
 */

export async function querySubjects(db: D1Database, yearId?: string, semesterId?: string) {
  let query = `
    SELECT s.*, 
           COALESCE(y.name, s.year_id) as year_name, 
           COALESCE(sem.name, s.semester_id) as semester_name, 
           COALESCE(d.name, s.department_id) as department_name
    FROM subjects s
    LEFT JOIN academic_years y ON s.year_id = y.id
    LEFT JOIN semesters sem ON s.semester_id = sem.id
    LEFT JOIN departments d ON s.department_id = d.id
  `;
  const params: any[] = [];

  if (yearId && semesterId) {
    query += ` WHERE s.year_id = ? AND s.semester_id = ?`;
    params.push(yearId, semesterId);
  } else if (yearId) {
    query += ` WHERE s.year_id = ?`;
    params.push(yearId);
  } else if (semesterId) {
    query += ` WHERE s.semester_id = ?`;
    params.push(semesterId);
  }

  query += ` ORDER BY s.code ASC`;

  const stmt = db.prepare(query);
  return params.length > 0 ? await stmt.bind(...params).all() : await stmt.all();
}

export async function queryQuestionPapers(db: D1Database, isAdmin = false, filters?: any) {
  let query = `
    SELECT p.*, 
           COALESCE(s.name, 'Subject') as subject_name, 
           COALESCE(s.code, 'CSE') as course_code,
           COALESCE(e.name, 'Exam') as exam_type_name, 
           COALESCE(e.code, 'Exam') as exam_type_code, 
           COALESCE(e.color_badge, 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30') as badge_color,
           COALESCE(y.name, 'Year') as year_name, 
           COALESCE(sem.name, 'Semester') as semester_name
    FROM question_papers p
    LEFT JOIN subjects s ON p.subject_id = s.id
    LEFT JOIN exam_types e ON p.exam_type_id = e.id
    LEFT JOIN academic_years y ON s.year_id = y.id
    LEFT JOIN semesters sem ON s.semester_id = sem.id
  `;
  const whereClauses: string[] = [];
  const params: any[] = [];

  if (!isAdmin) {
    whereClauses.push(`(p.visibility = 1 OR p.visibility IS NULL)`);
  }

  if (filters?.subjectId) {
    whereClauses.push(`p.subject_id = ?`);
    params.push(filters.subjectId);
  }
  if (filters?.examTypeId) {
    whereClauses.push(`p.exam_type_id = ?`);
    params.push(filters.examTypeId);
  }
  if (filters?.sessionYear) {
    whereClauses.push(`p.session_year = ?`);
    params.push(filters.sessionYear);
  }

  if (whereClauses.length > 0) {
    query += ` WHERE ` + whereClauses.join(` AND `);
  }

  query += ` ORDER BY p.uploaded_at DESC`;

  const stmt = db.prepare(query);
  const raw = params.length > 0 ? await stmt.bind(...params).all() : await stmt.all();
  const results = (raw.results || []).map((p: any) => {
    let pages: string[] = [];
    if (p.pages) {
      try {
        pages = typeof p.pages === 'string' ? JSON.parse(p.pages) : p.pages;
      } catch {
        pages = [p.file_data_url || p.pages];
      }
    } else if (p.file_data_url) {
      pages = [p.file_data_url];
    }
    return {
      ...p,
      pages,
      has_solution: Boolean(p.has_solution),
    };
  });

  return { ...raw, results };
}

export async function insertQuestionPaper(db: D1Database, paper: {
  id: string;
  subject_id: string;
  exam_type_id: string;
  session_year: string;
  file_key: string;
  file_name: string;
  file_type: string;
  file_size: number;
  visibility: number;
  uploaded_by: string;
}) {
  const stmt = db.prepare(`
    INSERT INTO question_papers (
      id, subject_id, exam_type_id, session_year, file_key,
      file_name, file_type, file_size, visibility, uploaded_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  return await stmt.bind(
    paper.id,
    paper.subject_id,
    paper.exam_type_id,
    paper.session_year,
    paper.file_key,
    paper.file_name,
    paper.file_type,
    paper.file_size,
    paper.visibility,
    paper.uploaded_by
  ).run();
}

export async function incrementPaperDownloads(db: D1Database, paperId: string) {
  const stmt = db.prepare(`
    UPDATE question_papers
    SET download_count = COALESCE(download_count, 0) + 1
    WHERE id = ?
  `);
  return await stmt.bind(paperId).run();
}

export async function getBootstrapData(db: D1Database) {
  const [departments, years, semesters, examTypes, subjects, papers] = await Promise.all([
    db.prepare(`SELECT * FROM departments ORDER BY name ASC`).all().then(r => r.results || []).catch(() => []),
    db.prepare(`SELECT * FROM academic_years ORDER BY order_index ASC`).all().then(r => r.results || []).catch(() => []),
    db.prepare(`SELECT * FROM semesters ORDER BY order_index ASC`).all().then(r => r.results || []).catch(() => []),
    db.prepare(`SELECT * FROM exam_types ORDER BY order_index ASC`).all().then(r => r.results || []).catch(() => []),
    querySubjects(db).then(r => r.results || []).catch(() => []),
    queryQuestionPapers(db, false).then(r => r.results || []).catch(() => []),
  ]);

  return {
    departments,
    years,
    semesters,
    examTypes,
    subjects,
    papers,
  };
}

export async function syncPushData(db: D1Database, data: any) {
  const { departments, years, semesters, examTypes, subjects, papers } = data || {};

  // Ensure tables and all columns exist
  try {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS departments (id TEXT PRIMARY KEY, name TEXT NOT NULL, code TEXT NOT NULL, description TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
      CREATE TABLE IF NOT EXISTS academic_years (id TEXT PRIMARY KEY, name TEXT NOT NULL, order_index INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS semesters (id TEXT PRIMARY KEY, name TEXT NOT NULL, order_index INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS exam_types (id TEXT PRIMARY KEY, name TEXT NOT NULL, code TEXT NOT NULL, color_badge TEXT NOT NULL, order_index INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS subjects (id TEXT PRIMARY KEY, code TEXT NOT NULL, name TEXT NOT NULL, department_id TEXT, year_id TEXT, semester_id TEXT, credits REAL DEFAULT 3.0, syllabus_overview TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
      CREATE TABLE IF NOT EXISTS question_papers (id TEXT PRIMARY KEY, subject_id TEXT, exam_type_id TEXT, session_year TEXT, file_key TEXT, file_name TEXT, file_type TEXT, file_size INTEGER, visibility INTEGER DEFAULT 1, download_count INTEGER DEFAULT 0, uploaded_by TEXT DEFAULT 'admin', uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP);
    `);
  } catch (e) {
    console.warn('Schema init note:', e);
  }

  // Safely ensure new columns exist in D1 SQLite
  try { await db.exec(`ALTER TABLE question_papers ADD COLUMN file_data_url TEXT;`); } catch {}
  try { await db.exec(`ALTER TABLE question_papers ADD COLUMN pages TEXT;`); } catch {}
  try { await db.exec(`ALTER TABLE question_papers ADD COLUMN has_solution INTEGER DEFAULT 0;`); } catch {}

  const batchQueries: any[] = [];

  if (Array.isArray(departments) && departments.length > 0) {
    for (const d of departments) {
      batchQueries.push(
        db.prepare(
          `INSERT INTO departments (id, name, code, description) VALUES (?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET name=excluded.name, code=excluded.code, description=excluded.description`
        ).bind(d.id, d.name, d.code, d.description || '')
      );
    }
  }

  if (Array.isArray(years) && years.length > 0) {
    for (const y of years) {
      batchQueries.push(
        db.prepare(
          `INSERT INTO academic_years (id, name, order_index) VALUES (?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET name=excluded.name, order_index=excluded.order_index`
        ).bind(y.id, y.name, y.order_index || 1)
      );
    }
  }

  if (Array.isArray(semesters) && semesters.length > 0) {
    for (const sem of semesters) {
      batchQueries.push(
        db.prepare(
          `INSERT INTO semesters (id, name, order_index) VALUES (?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET name=excluded.name, order_index=excluded.order_index`
        ).bind(sem.id, sem.name, sem.order_index || 1)
      );
    }
  }

  if (Array.isArray(examTypes) && examTypes.length > 0) {
    for (const e of examTypes) {
      batchQueries.push(
        db.prepare(
          `INSERT INTO exam_types (id, name, code, color_badge, order_index) VALUES (?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET name=excluded.name, code=excluded.code, color_badge=excluded.color_badge, order_index=excluded.order_index`
        ).bind(e.id, e.name, e.code, e.color_badge || '', e.order_index || 1)
      );
    }
  }

  if (Array.isArray(subjects) && subjects.length > 0) {
    for (const s of subjects) {
      batchQueries.push(
        db.prepare(
          `INSERT INTO subjects (id, code, name, department_id, year_id, semester_id, credits, syllabus_overview)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET code=excluded.code, name=excluded.name, department_id=excluded.department_id, year_id=excluded.year_id, semester_id=excluded.semester_id, credits=excluded.credits, syllabus_overview=excluded.syllabus_overview`
        ).bind(s.id, s.code, s.name, s.department_id || '', s.year_id || '', s.semester_id || '', s.credits || 3.0, s.syllabus_overview || '')
      );
    }
  }

  if (Array.isArray(papers) && papers.length > 0) {
    for (const p of papers) {
      const pagesJson = Array.isArray(p.pages) ? JSON.stringify(p.pages) : '';
      batchQueries.push(
        db.prepare(
          `INSERT INTO question_papers (id, subject_id, exam_type_id, session_year, file_key, file_name, file_type, file_size, visibility, download_count, uploaded_by, uploaded_at, updated_at, file_data_url, pages, has_solution)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET subject_id=excluded.subject_id, exam_type_id=excluded.exam_type_id, session_year=excluded.session_year, file_key=excluded.file_key, file_name=excluded.file_name, file_type=excluded.file_type, file_size=excluded.file_size, visibility=excluded.visibility, download_count=excluded.download_count, uploaded_by=excluded.uploaded_by, updated_at=excluded.updated_at, file_data_url=excluded.file_data_url, pages=excluded.pages, has_solution=excluded.has_solution`
        ).bind(
          p.id,
          p.subject_id || '',
          p.exam_type_id || '',
          p.session_year || '',
          p.file_key || p.id,
          p.file_name || 'paper.jpg',
          p.file_type || 'image/jpeg',
          p.file_size || 0,
          p.visibility !== undefined ? p.visibility : 1,
          p.download_count || 0,
          p.uploaded_by || 'admin',
          p.uploaded_at || new Date().toISOString(),
          p.updated_at || new Date().toISOString(),
          p.file_data_url || '',
          pagesJson,
          p.has_solution ? 1 : 0
        )
      );
    }
  }

  if (batchQueries.length > 0) {
    for (let i = 0; i < batchQueries.length; i += 50) {
      const chunk = batchQueries.slice(i, i + 50);
      await db.batch(chunk);
    }
  }

  return { success: true, count: batchQueries.length };
}
