import {
  Department,
  AcademicYear,
  Semester,
  ExamType,
  Subject,
  QuestionPaper,
  AnalyticsSummary,
} from '../types';
import {
  SEED_DEPARTMENTS,
  SEED_YEARS,
  SEED_SEMESTERS,
  SEED_EXAM_TYPES,
  SEED_SUBJECTS,
  SEED_QUESTION_PAPERS,
} from '../data/seedData';
import { sanitizeStorageKey } from './security';

const STORAGE_KEYS = {
  DEPARTMENTS: 'cse_archive_departments_v3',
  YEARS: 'cse_archive_years_v3',
  SEMESTERS: 'cse_archive_semesters_v3',
  EXAM_TYPES: 'cse_archive_exam_types_v3',
  SUBJECTS: 'cse_archive_subjects_v3',
  PAPERS: 'cse_archive_papers_v3',
  BOOKMARKS: 'cse_archive_bookmarks_v3',
  INITIALIZED: 'cse_archive_has_initialized_v3',
};

class StorageService {
  private departments: Department[] = [];
  private years: AcademicYear[] = [];
  private semesters: Semester[] = [];
  private examTypes: ExamType[] = [];
  private subjects: Subject[] = [];
  private papers: QuestionPaper[] = [];
  private initialized = false;

  constructor() {
    this.init();
  }

  private init() {
    if (this.initialized) return;

    // Check if initialized before
    const hasInit = localStorage.getItem(STORAGE_KEYS.INITIALIZED);

    if (!hasInit) {
      // Default: clean empty state with basic default structure
      this.departments = [
        {
          id: 'dept-cse',
          name: 'Computer Science & Engineering',
          code: 'CSE',
          description: 'Department of Computer Science & Engineering',
        },
      ];
      this.years = [
        { id: 'year-1', name: '1st Year', order_index: 1 },
        { id: 'year-2', name: '2nd Year', order_index: 2 },
        { id: 'year-3', name: '3rd Year', order_index: 3 },
        { id: 'year-4', name: '4th Year', order_index: 4 },
      ];
      this.semesters = [
        { id: 'sem-1', name: '1st Semester', order_index: 1 },
        { id: 'sem-2', name: '2nd Semester', order_index: 2 },
      ];
      this.examTypes = [
        { id: 'exam-mid', name: 'Midterm Exam', code: 'Midterm', color_badge: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30', order_index: 1 },
        { id: 'exam-final', name: 'Semester Final Exam', code: 'Final', color_badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30', order_index: 2 },
      ];
      // Clean empty subjects & papers by default - NOTHING phantom or unadded
      this.subjects = [];
      this.papers = [];

      this.saveAll();
      localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
    } else {
      // Load saved state
      try {
        this.departments = JSON.parse(localStorage.getItem(STORAGE_KEYS.DEPARTMENTS) || '[]');
        this.years = JSON.parse(localStorage.getItem(STORAGE_KEYS.YEARS) || '[]');
        this.semesters = JSON.parse(localStorage.getItem(STORAGE_KEYS.SEMESTERS) || '[]');
        const loadedExams = JSON.parse(localStorage.getItem(STORAGE_KEYS.EXAM_TYPES) || '[]');
        
        // Filter to keep only Midterm and Final if older exam types are present
        const allowedIds = ['exam-mid', 'exam-final'];
        const filteredExams = loadedExams.filter((e: any) => 
          allowedIds.includes(e.id) || 
          e.name.toLowerCase().includes('midterm') || 
          e.name.toLowerCase().includes('final')
        );

        this.examTypes = filteredExams.length > 0 ? filteredExams : [
          { id: 'exam-mid', name: 'Midterm Exam', code: 'Midterm', color_badge: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30', order_index: 1 },
          { id: 'exam-final', name: 'Semester Final Exam', code: 'Final', color_badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30', order_index: 2 },
        ];
        this.saveExamTypes();

        this.subjects = JSON.parse(localStorage.getItem(STORAGE_KEYS.SUBJECTS) || '[]');
        this.papers = JSON.parse(localStorage.getItem(STORAGE_KEYS.PAPERS) || '[]');
      } catch {
        this.departments = [];
        this.years = [];
        this.semesters = [];
        this.examTypes = [
          { id: 'exam-mid', name: 'Midterm Exam', code: 'Midterm', color_badge: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30', order_index: 1 },
          { id: 'exam-final', name: 'Semester Final Exam', code: 'Final', color_badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30', order_index: 2 },
        ];
        this.subjects = [];
        this.papers = [];
      }
    }

    this.initialized = true;
  }

  private saveAll() {
    this.saveDepartments();
    this.saveYears();
    this.saveSemesters();
    this.saveExamTypes();
    this.saveSubjects();
    this.savePapers();
  }

  private saveDepartments() {
    localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(this.departments));
  }

  private saveYears() {
    localStorage.setItem(STORAGE_KEYS.YEARS, JSON.stringify(this.years));
  }

  private saveSemesters() {
    localStorage.setItem(STORAGE_KEYS.SEMESTERS, JSON.stringify(this.semesters));
  }

  private saveExamTypes() {
    localStorage.setItem(STORAGE_KEYS.EXAM_TYPES, JSON.stringify(this.examTypes));
  }

  private saveSubjects() {
    localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(this.subjects));
  }

  private savePapers() {
    localStorage.setItem(STORAGE_KEYS.PAPERS, JSON.stringify(this.papers));
  }

  // ==========================================
  // 1. DEPARTMENTS CRUD (Dynamic)
  // ==========================================
  public getDepartments(): Department[] {
    return this.departments;
  }

  public addDepartment(dept: Omit<Department, 'id'>): Department {
    const newDept: Department = {
      ...dept,
      id: `dept-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    };
    this.departments.push(newDept);
    this.saveDepartments();
    return newDept;
  }

  public updateDepartment(id: string, updates: Partial<Department>): Department {
    const idx = this.departments.findIndex((d) => d.id === id);
    if (idx === -1) throw new Error('Department not found');
    this.departments[idx] = { ...this.departments[idx], ...updates };
    this.saveDepartments();
    return this.departments[idx];
  }

  public deleteDepartment(id: string): boolean {
    this.departments = this.departments.filter((d) => d.id !== id);
    this.subjects = this.subjects.filter((s) => s.department_id !== id);
    this.saveDepartments();
    this.saveSubjects();
    return true;
  }

  // ==========================================
  // 2. ACADEMIC YEARS CRUD (Dynamic)
  // ==========================================
  public getYears(): AcademicYear[] {
    return [...this.years].sort((a, b) => a.order_index - b.order_index);
  }

  public addYear(name: string, order_index?: number): AcademicYear {
    const nextOrder = order_index ?? (this.years.length > 0 ? Math.max(...this.years.map((y) => y.order_index)) + 1 : 1);
    const newYear: AcademicYear = {
      id: `year-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: name.trim(),
      order_index: nextOrder,
    };
    this.years.push(newYear);
    this.saveYears();
    return newYear;
  }

  public updateYear(id: string, updates: Partial<AcademicYear>): AcademicYear {
    const idx = this.years.findIndex((y) => y.id === id);
    if (idx === -1) throw new Error('Academic year not found');
    this.years[idx] = { ...this.years[idx], ...updates };
    this.saveYears();
    return this.years[idx];
  }

  public deleteYear(id: string): boolean {
    this.subjects = this.subjects.filter((s) => s.year_id !== id);
    this.saveSubjects();
    this.years = this.years.filter((y) => y.id !== id);
    this.saveYears();
    return true;
  }

  // ==========================================
  // 3. SEMESTERS CRUD (Dynamic)
  // ==========================================
  public getSemesters(): Semester[] {
    return [...this.semesters].sort((a, b) => a.order_index - b.order_index);
  }

  public addSemester(name: string, order_index?: number): Semester {
    const nextOrder = order_index ?? (this.semesters.length > 0 ? Math.max(...this.semesters.map((s) => s.order_index)) + 1 : 1);
    const newSemester: Semester = {
      id: `sem-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: name.trim(),
      order_index: nextOrder,
    };
    this.semesters.push(newSemester);
    this.saveSemesters();
    return newSemester;
  }

  public updateSemester(id: string, updates: Partial<Semester>): Semester {
    const idx = this.semesters.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error('Semester not found');
    this.semesters[idx] = { ...this.semesters[idx], ...updates };
    this.saveSemesters();
    return this.semesters[idx];
  }

  public deleteSemester(id: string): boolean {
    this.subjects = this.subjects.filter((s) => s.semester_id !== id);
    this.saveSubjects();
    this.semesters = this.semesters.filter((s) => s.id !== id);
    this.saveSemesters();
    return true;
  }

  // ==========================================
  // 4. EXAM TYPES CRUD (100% Dynamic from Database)
  // ==========================================
  public getExamTypes(): ExamType[] {
    return [...this.examTypes].sort((a, b) => a.order_index - b.order_index);
  }

  public addExamType(name: string, code: string, color_badge?: string): ExamType {
    const nextOrder = this.examTypes.length > 0 ? Math.max(...this.examTypes.map((e) => e.order_index)) + 1 : 1;
    const newExam: ExamType = {
      id: `exam-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: name.trim(),
      code: (code || name.slice(0, 4).toUpperCase()),
      color_badge: color_badge || 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
      order_index: nextOrder,
    };
    this.examTypes.push(newExam);
    this.saveExamTypes();
    return newExam;
  }

  public updateExamType(id: string, updates: Partial<ExamType>): ExamType {
    const idx = this.examTypes.findIndex((e) => e.id === id);
    if (idx === -1) throw new Error('Exam type not found');
    this.examTypes[idx] = { ...this.examTypes[idx], ...updates };
    this.saveExamTypes();
    return this.examTypes[idx];
  }

  public deleteExamType(id: string): boolean {
    this.papers = this.papers.filter((p) => p.exam_type_id !== id);
    this.savePapers();
    this.examTypes = this.examTypes.filter((e) => e.id !== id);
    this.saveExamTypes();
    return true;
  }

  // ==========================================
  // 5. SUBJECTS CRUD (Dynamic)
  // ==========================================
  public getSubjects(yearId?: string, semesterId?: string, departmentId?: string): Subject[] {
    let list = this.subjects;
    if (departmentId) list = list.filter((s) => s.department_id === departmentId);
    if (yearId) list = list.filter((s) => s.year_id === yearId);
    if (semesterId) list = list.filter((s) => s.semester_id === semesterId);
    return list;
  }

  public getSubjectById(id: string): Subject | undefined {
    return this.subjects.find((s) => s.id === id);
  }

  public addSubject(newSubject: Omit<Subject, 'id' | 'created_at'>): Subject {
    const id = `subj-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const subject: Subject = {
      ...newSubject,
      id,
      created_at: new Date().toISOString(),
    };
    this.subjects.unshift(subject);
    this.saveSubjects();
    return subject;
  }

  public updateSubject(id: string, updates: Partial<Subject>): Subject {
    const idx = this.subjects.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error('Subject not found');
    this.subjects[idx] = { ...this.subjects[idx], ...updates };
    this.saveSubjects();
    return this.subjects[idx];
  }

  public deleteSubject(id: string): boolean {
    this.papers = this.papers.filter((p) => p.subject_id !== id);
    this.savePapers();
    this.subjects = this.subjects.filter((s) => s.id !== id);
    this.saveSubjects();
    return true;
  }

  // ==========================================
  // 6. QUESTION PAPERS CRUD (Dynamic)
  // ==========================================
  public getPapers(isAdmin = false): QuestionPaper[] {
    const papers = isAdmin ? this.papers : this.papers.filter((p) => p.visibility === 1);
    return papers.map((p) => this.enrichPaper(p));
  }

  public getPaperById(id: string, isAdmin = false): QuestionPaper | undefined {
    const paper = this.papers.find((p) => p.id === id);
    if (!paper) return undefined;
    if (!isAdmin && paper.visibility !== 1) return undefined;
    return this.enrichPaper(paper);
  }

  public addPaper(paperData: {
    subject_id: string;
    exam_type_id: string;
    session_year: string;
    file_name: string;
    file_type: 'application/pdf' | 'image/jpeg' | 'image/png' | 'image/webp';
    file_size: number;
    file_data_url: string;
    visibility?: number;
    uploaded_by?: string;
    has_solution?: boolean;
    pages?: string[];
  }): QuestionPaper {
    const subject = this.getSubjectById(paperData.subject_id);
    const subjectCode = subject ? subject.code.toLowerCase().replace(/\s+/g, '') : 'misc';
    const file_key = sanitizeStorageKey(`papers/${subjectCode}`, paperData.file_name);

    const newPaper: QuestionPaper = {
      id: `paper-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      subject_id: paperData.subject_id,
      exam_type_id: paperData.exam_type_id,
      session_year: paperData.session_year,
      file_key,
      file_name: paperData.file_name,
      file_type: paperData.file_type,
      file_size: paperData.file_size,
      file_data_url: paperData.file_data_url,
      visibility: paperData.visibility ?? 1,
      has_solution: paperData.has_solution,
      pages: paperData.pages && paperData.pages.length > 0 ? paperData.pages : [paperData.file_data_url],
      download_count: 0,
      uploaded_by: paperData.uploaded_by || 'admin',
      uploaded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.papers.unshift(newPaper);
    this.savePapers();
    return this.enrichPaper(newPaper);
  }

  public updatePaper(id: string, updates: Partial<QuestionPaper>): QuestionPaper {
    const idx = this.papers.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error('Question paper not found');

    this.papers[idx] = {
      ...this.papers[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.savePapers();
    return this.enrichPaper(this.papers[idx]);
  }

  public togglePaperVisibility(id: string): QuestionPaper {
    const paper = this.papers.find((p) => p.id === id);
    if (!paper) throw new Error('Paper not found');
    paper.visibility = paper.visibility === 1 ? 0 : 1;
    paper.updated_at = new Date().toISOString();
    this.savePapers();
    return this.enrichPaper(paper);
  }

  public deletePaper(id: string): boolean {
    const initialLen = this.papers.length;
    this.papers = this.papers.filter((p) => p.id !== id);
    this.savePapers();
    return this.papers.length < initialLen;
  }

  public incrementDownloadCount(id: string): number {
    const paper = this.papers.find((p) => p.id === id);
    if (paper) {
      paper.download_count = (paper.download_count || 0) + 1;
      this.savePapers();
      return paper.download_count;
    }
    return 0;
  }

  // ==========================================
  // 7. BOOKMARKS
  // ==========================================
  public getBookmarks(): string[] {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.BOOKMARKS) || '[]');
    } catch {
      return [];
    }
  }

  public toggleBookmark(paperId: string): boolean {
    let bookmarks = this.getBookmarks();
    const isBookmarked = bookmarks.includes(paperId);
    if (isBookmarked) {
      bookmarks = bookmarks.filter((id) => id !== paperId);
    } else {
      bookmarks.push(paperId);
    }
    localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(bookmarks));
    return !isBookmarked;
  }

  // ==========================================
  // 8. ANALYTICS
  // ==========================================
  public getAnalyticsSummary(): AnalyticsSummary {
    const totalPapers = this.papers.length;
    const totalSubjects = this.subjects.length;
    const totalDownloads = this.papers.reduce((sum, p) => sum + (p.download_count || 0), 0);
    const hiddenPapers = this.papers.filter((p) => p.visibility === 0).length;

    const examMap = new Map<string, { count: number; name: string; color: string }>();
    this.examTypes.forEach((e) => {
      examMap.set(e.id, { count: 0, name: e.code, color: e.color_badge });
    });

    this.papers.forEach((p) => {
      const entry = examMap.get(p.exam_type_id);
      if (entry) {
        entry.count += p.download_count || 0;
      }
    });

    const downloadsByExamType = Array.from(examMap.values()).map((item) => ({
      exam: item.name,
      count: item.count,
      color: item.color,
    }));

    const subjectDownloads = new Map<string, number>();
    this.papers.forEach((p) => {
      const current = subjectDownloads.get(p.subject_id) || 0;
      subjectDownloads.set(p.subject_id, current + (p.download_count || 0));
    });

    const topDownloadedSubjects = Array.from(subjectDownloads.entries())
      .map(([subjId, count]) => {
        const s = this.getSubjectById(subjId);
        return {
          subject: s ? s.name : 'Unknown Subject',
          code: s ? s.code : 'N/A',
          downloads: count,
        };
      })
      .sort((a, b) => b.downloads - a.downloads)
      .slice(0, 5);

    const recentUploads = [...this.papers]
      .sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime())
      .slice(0, 5)
      .map((p) => this.enrichPaper(p));

    return {
      totalPapers,
      totalSubjects,
      totalDownloads,
      hiddenPapers,
      downloadsByExamType,
      topDownloadedSubjects,
      recentUploads,
    };
  }

  // ==========================================
  // 9. CLEAR ALL DATA & OPTIONAL SAMPLE SEED
  // ==========================================
  public clearAllData() {
    this.subjects = [];
    this.papers = [];
    this.saveSubjects();
    this.savePapers();
  }

  public loadSampleDataPack() {
    this.departments = [...SEED_DEPARTMENTS];
    this.years = [...SEED_YEARS];
    this.semesters = [...SEED_SEMESTERS];
    this.examTypes = [...SEED_EXAM_TYPES];
    this.subjects = [...SEED_SUBJECTS];
    this.papers = [...SEED_QUESTION_PAPERS];
    this.saveAll();
  }

  // Helper
  private enrichPaper(p: QuestionPaper): QuestionPaper {
    const subject = this.subjects.find((s) => s.id === p.subject_id);
    const examType = this.examTypes.find((e) => e.id === p.exam_type_id);
    const year = subject ? this.years.find((y) => y.id === subject.year_id) : undefined;
    const semester = subject ? this.semesters.find((s) => s.id === subject.semester_id) : undefined;
    const dept = subject ? this.departments.find((d) => d.id === subject.department_id) : undefined;

    return {
      ...p,
      subject_name: subject?.name || 'Unknown Subject',
      course_code: subject?.code || 'N/A',
      department_code: dept?.code || 'CSE',
      department_name: dept?.name || 'Computer Science & Engineering',
      year_name: year?.name || 'N/A',
      semester_name: semester?.name || 'N/A',
      exam_type_name: examType?.name || 'Exam',
      exam_type_code: examType?.code || 'Other',
      badge_color: examType?.color_badge || 'bg-slate-500/15 text-slate-300 border-slate-500/30',
    };
  }
}

export const storageService = new StorageService();
