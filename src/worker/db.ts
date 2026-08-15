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
