import { Department, AcademicYear, Semester, ExamType, Subject, QuestionPaper } from '../types';

export const SEED_DEPARTMENTS: Department[] = [
  {
    id: 'dept-cse',
    name: 'Computer Science & Engineering',
    code: 'CSE',
    description: 'Department of Computer Science and Engineering - Undergraduate Archive',
  },
];

export const SEED_YEARS: AcademicYear[] = [
  { id: 'year-1', name: '1st Year', order_index: 1 },
  { id: 'year-2', name: '2nd Year', order_index: 2 },
  { id: 'year-3', name: '3rd Year', order_index: 3 },
  { id: 'year-4', name: '4th Year', order_index: 4 },
];

export const SEED_SEMESTERS: Semester[] = [
  { id: 'sem-1', name: '1st Semester', order_index: 1 },
  { id: 'sem-2', name: '2nd Semester', order_index: 2 },
];

export const SEED_EXAM_TYPES: ExamType[] = [
  { id: 'exam-mid', name: 'Midterm Exam', code: 'Midterm', color_badge: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30', order_index: 1 },
  { id: 'exam-final', name: 'Semester Final Exam', code: 'Final', color_badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30', order_index: 2 },
];

// Clean empty subjects & papers - 100% user defined
export const SEED_SUBJECTS: Subject[] = [];
export const SEED_PAPERS: QuestionPaper[] = [];
export const SEED_QUESTION_PAPERS: QuestionPaper[] = [];
