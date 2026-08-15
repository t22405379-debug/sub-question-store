import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  Department,
  AcademicYear,
  Semester,
  ExamType,
  Subject,
  QuestionPaper,
  AnalyticsSummary,
} from '../types';
import { storageService } from '../services/storage';

interface PaperContextType {
  departments: Department[];
  years: AcademicYear[];
  semesters: Semester[];
  examTypes: ExamType[];
  subjects: Subject[];
  papers: QuestionPaper[];
  bookmarks: string[];

  // Filter State
  selectedDepartmentId: string;
  selectedYearId: string;
  selectedSemesterId: string;
  selectedSubjectId: string;
  selectedExamTypeId: string;
  selectedSession: string;
  searchQuery: string;
  onlyBookmarked: boolean;

  // Setters
  setSelectedDepartmentId: (id: string) => void;
  setSelectedYearId: (id: string) => void;
  setSelectedSemesterId: (id: string) => void;
  setSelectedSubjectId: (id: string) => void;
  setSelectedExamTypeId: (id: string) => void;
  setSelectedSession: (s: string) => void;
  setSearchQuery: (q: string) => void;
  setOnlyBookmarked: (b: boolean) => void;
  resetFilters: () => void;

  // Modal / Viewer State
  activeViewingPaper: QuestionPaper | null;
  openViewer: (paper: QuestionPaper) => void;
  closeViewer: () => void;

  // Search Modal state
  isSearchModalOpen: boolean;
  setIsSearchModalOpen: (open: boolean) => void;

  // Actions
  toggleBookmark: (paperId: string) => void;
  recordDownload: (paperId: string) => void;
  refreshData: () => void;
  getAnalytics: () => AnalyticsSummary;

  // Dynamic Taxonomy CRUD
  addYear: (name: string) => void;
  updateYear: (id: string, updates: Partial<AcademicYear>) => void;
  deleteYear: (id: string) => void;

  addSemester: (name: string) => void;
  updateSemester: (id: string, updates: Partial<Semester>) => void;
  deleteSemester: (id: string) => void;

  addExamType: (name: string, code: string, color?: string) => void;
  updateExamType: (id: string, updates: Partial<ExamType>) => void;
  deleteExamType: (id: string) => void;

  addDepartment: (dept: Omit<Department, 'id'>) => void;
  updateDepartment: (id: string, updates: Partial<Department>) => void;
  deleteDepartment: (id: string) => void;

  // Filtered results
  filteredPapers: QuestionPaper[];
  filteredSubjects: Subject[];
  availableSessions: string[];
  activeDepartment: Department | undefined;
}

const PaperContext = createContext<PaperContextType | undefined>(undefined);

export const PaperProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [examTypes, setExamTypes] = useState<ExamType[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [papers, setPapers] = useState<QuestionPaper[]>([]);
  const [bookmarks, setBookmarks] = useState<string[]>([]);

  // Filter state
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('');
  const [selectedYearId, setSelectedYearId] = useState<string>('');
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedExamTypeId, setSelectedExamTypeId] = useState<string>('');
  const [selectedSession, setSelectedSession] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlyBookmarked, setOnlyBookmarked] = useState<boolean>(false);

  // Viewer state
  const [activeViewingPaper, setActiveViewingPaper] = useState<QuestionPaper | null>(null);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    // 1. Instant local cache load for zero UI delay
    const depts = storageService.getDepartments();
    setDepartments(depts);
    setYears(storageService.getYears());
    setSemesters(storageService.getSemesters());
    setExamTypes(storageService.getExamTypes());
    setSubjects(storageService.getSubjects());
    setPapers(storageService.getPapers(false));
    setBookmarks(storageService.getBookmarks());

    if (depts.length > 0) {
      setSelectedDepartmentId((prev) => (prev && depts.some((d) => d.id === prev) ? prev : depts[0].id));
    }

    // 2. Fetch live D1 database state (Cache-Busted with no-store)
    try {
      const res = await fetch('/api/sync', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
        },
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const { departments: liveDepts, years: liveYears, semesters: liveSems, examTypes: liveExams, subjects: liveSubs, papers: livePapers } = json.data;

          if (Array.isArray(liveDepts) && liveDepts.length > 0) {
            setDepartments(liveDepts);
            storageService.setDepartments(liveDepts);
          }
          if (Array.isArray(liveYears) && liveYears.length > 0) {
            setYears(liveYears);
            storageService.setYears(liveYears);
          }
          if (Array.isArray(liveSems) && liveSems.length > 0) {
            setSemesters(liveSems);
            storageService.setSemesters(liveSems);
          }
          if (Array.isArray(liveExams) && liveExams.length > 0) {
            setExamTypes(liveExams);
            storageService.setExamTypes(liveExams);
          }
          if (Array.isArray(liveSubs) && liveSubs.length > 0) {
            setSubjects(liveSubs);
            storageService.setSubjects(liveSubs);
          }
          if (Array.isArray(livePapers) && livePapers.length > 0) {
            setPapers(livePapers);
            storageService.setPapers(livePapers);
          }
        }
      }
    } catch (err) {
      console.warn('D1 live sync fallback to local storage:', err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Global keyboard shortcut: Ctrl+K or Cmd+K to open quick search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchModalOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsSearchModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const resetFilters = useCallback(() => {
    setSelectedYearId('');
    setSelectedSemesterId('');
    setSelectedSubjectId('');
    setSelectedExamTypeId('');
    setSelectedSession('');
    setSearchQuery('');
    setOnlyBookmarked(false);
  }, []);

  const openViewer = useCallback((paper: QuestionPaper) => {
    setActiveViewingPaper(paper);
  }, []);

  const closeViewer = useCallback(() => {
    setActiveViewingPaper(null);
  }, []);

  const toggleBookmark = useCallback((paperId: string) => {
    storageService.toggleBookmark(paperId);
    setBookmarks(storageService.getBookmarks());
  }, []);

  const recordDownload = useCallback((paperId: string) => {
    const newCount = storageService.incrementDownloadCount(paperId);
    setPapers((prev) =>
      prev.map((p) => (p.id === paperId ? { ...p, download_count: newCount } : p))
    );
  }, []);

  const refreshData = useCallback(() => {
    loadData();
  }, [loadData]);

  const getAnalytics = useCallback(() => {
    return storageService.getAnalyticsSummary();
  }, []);

  // Dynamic Taxonomy Actions
  const addYear = (name: string) => {
    storageService.addYear(name);
    refreshData();
  };
  const updateYear = (id: string, updates: Partial<AcademicYear>) => {
    storageService.updateYear(id, updates);
    refreshData();
  };
  const deleteYear = (id: string) => {
    storageService.deleteYear(id);
    refreshData();
  };

  const addSemester = (name: string) => {
    storageService.addSemester(name);
    refreshData();
  };
  const updateSemester = (id: string, updates: Partial<Semester>) => {
    storageService.updateSemester(id, updates);
    refreshData();
  };
  const deleteSemester = (id: string) => {
    storageService.deleteSemester(id);
    refreshData();
  };

  const addExamType = (name: string, code: string, color?: string) => {
    storageService.addExamType(name, code, color);
    refreshData();
  };
  const updateExamType = (id: string, updates: Partial<ExamType>) => {
    storageService.updateExamType(id, updates);
    refreshData();
  };
  const deleteExamType = (id: string) => {
    storageService.deleteExamType(id);
    refreshData();
  };

  const addDepartment = (dept: Omit<Department, 'id'>) => {
    storageService.addDepartment(dept);
    refreshData();
  };
  const updateDepartment = (id: string, updates: Partial<Department>) => {
    storageService.updateDepartment(id, updates);
    refreshData();
  };
  const deleteDepartment = (id: string) => {
    storageService.deleteDepartment(id);
    refreshData();
  };

  const activeDepartment = useMemo(() => {
    return departments.find((d) => d.id === selectedDepartmentId) || departments[0];
  }, [departments, selectedDepartmentId]);

  // Filtered Subjects based on department, year & semester selections
  const filteredSubjects = useMemo(() => {
    return subjects.filter((s) => {
      if (selectedDepartmentId && s.department_id && s.department_id !== selectedDepartmentId) return false;
      if (selectedYearId && s.year_id !== selectedYearId) return false;
      if (selectedSemesterId && s.semester_id !== selectedSemesterId) return false;
      return true;
    });
  }, [subjects, selectedDepartmentId, selectedYearId, selectedSemesterId]);

  // Extract all available session years from papers
  const availableSessions = useMemo(() => {
    const set = new Set<string>();
    papers.forEach((p) => {
      if (p.session_year) set.add(p.session_year);
    });
    return Array.from(set).sort().reverse();
  }, [papers]);

  // Main Filtered Papers list
  const filteredPapers = useMemo(() => {
    return papers.filter((p) => {
      if (onlyBookmarked && !bookmarks.includes(p.id)) return false;

      // Match subject
      const paperSubj = subjects.find((s) => s.id === p.subject_id);

      // Department filter
      if (selectedDepartmentId && paperSubj && paperSubj.department_id && paperSubj.department_id !== selectedDepartmentId) {
        return false;
      }

      // Direct Subject filter
      if (selectedSubjectId && p.subject_id !== selectedSubjectId) return false;

      // Exam type filter
      if (selectedExamTypeId && p.exam_type_id !== selectedExamTypeId) return false;

      // Session year filter
      if (selectedSession && p.session_year !== selectedSession) return false;

      // Year filter (if subject not directly selected)
      if (selectedYearId && !selectedSubjectId) {
        if (!paperSubj || paperSubj.year_id !== selectedYearId) return false;
      }

      // Semester filter (if subject not directly selected)
      if (selectedSemesterId && !selectedSubjectId) {
        if (!paperSubj || paperSubj.semester_id !== selectedSemesterId) return false;
      }

      // Search Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const code = (p.course_code || '').toLowerCase();
        const name = (p.subject_name || '').toLowerCase();
        const exam = (p.exam_type_name || '').toLowerCase();
        const session = (p.session_year || '').toLowerCase();
        const file = (p.file_name || '').toLowerCase();

        const match =
          code.includes(q) ||
          name.includes(q) ||
          exam.includes(q) ||
          session.includes(q) ||
          file.includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [
    papers,
    subjects,
    selectedDepartmentId,
    selectedYearId,
    selectedSemesterId,
    selectedSubjectId,
    selectedExamTypeId,
    selectedSession,
    searchQuery,
    onlyBookmarked,
    bookmarks,
  ]);

  return (
    <PaperContext.Provider
      value={{
        departments,
        years,
        semesters,
        examTypes,
        subjects,
        papers,
        bookmarks,
        selectedDepartmentId,
        selectedYearId,
        selectedSemesterId,
        selectedSubjectId,
        selectedExamTypeId,
        selectedSession,
        searchQuery,
        onlyBookmarked,
        setSelectedDepartmentId,
        setSelectedYearId,
        setSelectedSemesterId,
        setSelectedSubjectId,
        setSelectedExamTypeId,
        setSelectedSession,
        setSearchQuery,
        setOnlyBookmarked,
        resetFilters,
        activeViewingPaper,
        openViewer,
        closeViewer,
        isSearchModalOpen,
        setIsSearchModalOpen,
        toggleBookmark,
        recordDownload,
        refreshData,
        getAnalytics,
        addYear,
        updateYear,
        deleteYear,
        addSemester,
        updateSemester,
        deleteSemester,
        addExamType,
        updateExamType,
        deleteExamType,
        addDepartment,
        updateDepartment,
        deleteDepartment,
        filteredPapers,
        filteredSubjects,
        availableSessions,
        activeDepartment,
      }}
    >
      {children}
    </PaperContext.Provider>
  );
};

export const usePapers = () => {
  const ctx = useContext(PaperContext);
  if (!ctx) throw new Error('usePapers must be used within a PaperProvider');
  return ctx;
};
