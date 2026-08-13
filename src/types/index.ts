export type ExamTypeCode = string;

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
}

export interface AcademicYear {
  id: string;
  name: string;
  order_index: number;
}

export interface Semester {
  id: string;
  name: string;
  order_index: number;
}

export interface ExamType {
  id: string;
  name: string;
  code: string;
  color_badge: string;
  order_index: number;
}

export interface Subject {
  id: string;
  code: string;                  // e.g. "CSE 1101"
  name: string;                  // e.g. "Programming Fundamentals"
  department_id: string;
  year_id: string;
  semester_id: string;
  credits: number;
  syllabus_overview?: string;
  created_at?: string;
}

export interface QuestionPaper {
  id: string;
  subject_id: string;
  exam_type_id: string;
  session_year: string;          // e.g. "2024-2025"
  file_key: string;              // R2 storage path
  file_name: string;
  file_type: 'application/pdf' | 'image/jpeg' | 'image/png' | 'image/webp';
  file_size: number;             // bytes
  file_data_url?: string;        // In-memory or blob URL for viewing
  visibility: number;            // 1 = public, 0 = hidden
  download_count: number;
  uploaded_by: string;
  uploaded_at: string;
  updated_at: string;
  has_solution?: boolean;        // Whether solution / marking notes are attached
  pages?: string[];              // Multi-page image data URLs (e.g. Page 1, Page 2)
  // Joined virtual fields
  subject_name?: string;
  course_code?: string;
  department_name?: string;
  department_code?: string;
  year_name?: string;
  semester_name?: string;
  exam_type_name?: string;
  exam_type_code?: string;
  badge_color?: string;
}

export interface AdminUser {
  id: string;
  username: string;
  display_name: string;
  role: 'super_admin' | 'admin';
  last_login?: string;
}

export interface FilterState {
  departmentId: string;
  yearId: string;
  semesterId: string;
  subjectId: string;
  examTypeId: string;
  sessionYear: string;
  searchQuery: string;
}

export interface AnalyticsSummary {
  totalPapers: number;
  totalSubjects: number;
  totalDownloads: number;
  hiddenPapers: number;
  downloadsByExamType: { exam: string; count: number; color: string }[];
  topDownloadedSubjects: { subject: string; code: string; downloads: number }[];
  recentUploads: QuestionPaper[];
}
