-- =========================================================================
-- CSE Question-Paper Archive - Initial D1 SQLite Schema Migration
-- =========================================================================

-- Enable foreign keys
PRAGMA foreign_keys = ON;

-- 1. Departments Table
CREATE TABLE IF NOT EXISTS departments (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Academic Years Table (1st Year, 2nd Year, 3rd Year, 4th Year)
CREATE TABLE IF NOT EXISTS academic_years (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    order_index INTEGER NOT NULL UNIQUE
);

-- 3. Semesters Table (1st Semester, 2nd Semester)
CREATE TABLE IF NOT EXISTS semesters (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    order_index INTEGER NOT NULL UNIQUE
);

-- 4. Exam Types Table (CT, Midterm, Final, Lab, Presentation, Assignment, Other)
CREATE TABLE IF NOT EXISTS exam_types (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    color_badge TEXT NOT NULL,
    order_index INTEGER NOT NULL
);

-- 5. Subjects Table
CREATE TABLE IF NOT EXISTS subjects (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    department_id TEXT NOT NULL,
    year_id TEXT NOT NULL,
    semester_id TEXT NOT NULL,
    credits REAL DEFAULT 3.0,
    syllabus_overview TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
    FOREIGN KEY (year_id) REFERENCES academic_years(id) ON DELETE RESTRICT,
    FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE RESTRICT
);

-- 6. Question Papers Table
CREATE TABLE IF NOT EXISTS question_papers (
    id TEXT PRIMARY KEY,
    subject_id TEXT NOT NULL,
    exam_type_id TEXT NOT NULL,
    session_year TEXT NOT NULL,            -- e.g. "2023-2024", "2024-2025"
    file_key TEXT NOT NULL UNIQUE,         -- R2 storage key path
    file_name TEXT NOT NULL,               -- Original or sanitized file name
    file_type TEXT NOT NULL,               -- "application/pdf", "image/jpeg", "image/png", "image/webp"
    file_size INTEGER NOT NULL,            -- Size in bytes
    visibility INTEGER DEFAULT 1,          -- 1 = visible (public), 0 = hidden (admin draft)
    download_count INTEGER DEFAULT 0,
    uploaded_by TEXT DEFAULT 'admin',
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (exam_type_id) REFERENCES exam_types(id) ON DELETE RESTRICT
);

-- 7. Admin Users Table (Enterprise Security: Salted & Hashed Credentials)
CREATE TABLE IF NOT EXISTS admin_users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    display_name TEXT NOT NULL,
    role TEXT DEFAULT 'admin',             -- 'super_admin' or 'admin'
    last_login DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 8. Download & Access Logs Table (GDPR-safe IP Hash)
CREATE TABLE IF NOT EXISTS download_logs (
    id TEXT PRIMARY KEY,
    paper_id TEXT NOT NULL,
    downloaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    ip_hash TEXT,
    user_agent TEXT,
    FOREIGN KEY (paper_id) REFERENCES question_papers(id) ON DELETE CASCADE
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_subjects_lookup ON subjects(year_id, semester_id, department_id);
CREATE INDEX IF NOT EXISTS idx_subjects_code ON subjects(code);
CREATE INDEX IF NOT EXISTS idx_papers_subject ON question_papers(subject_id);
CREATE INDEX IF NOT EXISTS idx_papers_exam_type ON question_papers(exam_type_id);
CREATE INDEX IF NOT EXISTS idx_papers_session ON question_papers(session_year);
CREATE INDEX IF NOT EXISTS idx_papers_visibility ON question_papers(visibility);
CREATE INDEX IF NOT EXISTS idx_logs_paper ON download_logs(paper_id);
