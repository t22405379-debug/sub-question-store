import { D1Database } from './types';

/**
 * Cloudflare D1 Parameterized Database Operations
 * All queries strictly use prepared statements with positional parameters (?)
 * to ensure 100% immunity against SQL injection vulnerabilities.
 */

export async function querySubjects(db: D1Database, yearId?: string, semesterId?: string) {
  let query = `
    SELECT s.*, y.name as year_name, sem.name as semester_name, d.name as department_name
    FROM subjects s
    JOIN academic_years y ON s.year_id = y.id
    JOIN semesters sem ON s.semester_id = sem.id
    JOIN departments d ON s.department_id = d.id
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
    SELECT p.*, s.name as subject_name, s.code as course_code,
           e.name as exam_type_name, e.code as exam_type_code, e.color_badge as badge_color,
           y.name as year_name, sem.name as semester_name
    FROM question_papers p
    JOIN subjects s ON p.subject_id = s.id
    JOIN exam_types e ON p.exam_type_id = e.id
    JOIN academic_years y ON s.year_id = y.id
    JOIN semesters sem ON s.semester_id = sem.id
  `;
  const whereClauses: string[] = [];
  const params: any[] = [];

  if (!isAdmin) {
    whereClauses.push(`p.visibility = 1`);
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
  return params.length > 0 ? await stmt.bind(...params).all() : await stmt.all();
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
    SET download_count = download_count + 1
    WHERE id = ?
  `);
  return await stmt.bind(paperId).run();
}
