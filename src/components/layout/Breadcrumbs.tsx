import React from 'react';
import { ChevronRight, Home, BookOpen, Layers } from 'lucide-react';
import { usePapers } from '../../context/PaperContext';

export const Breadcrumbs: React.FC = () => {
  const {
    years,
    semesters,
    subjects,
    selectedYearId,
    selectedSemesterId,
    selectedSubjectId,
    activeDepartment,
    setSelectedSemesterId,
    setSelectedSubjectId,
    resetFilters,
  } = usePapers();

  const currentYear = years.find((y) => y.id === selectedYearId);
  const currentSemester = semesters.find((s) => s.id === selectedSemesterId);
  const currentSubject = subjects.find((s) => s.id === selectedSubjectId);

  return (
    <nav className="flex items-center flex-wrap gap-1.5 text-xs text-slate-400 py-3">
      {/* Root Department */}
      <button
        onClick={resetFilters}
        className="flex items-center gap-1.5 hover:text-indigo-300 transition-colors font-medium text-slate-300"
      >
        <Home className="w-3.5 h-3.5 text-indigo-400" />
        <span>{activeDepartment ? `${activeDepartment.code} Dept` : 'All Departments'}</span>
      </button>

      {/* Year */}
      {currentYear && (
        <>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
          <button
            onClick={() => {
              setSelectedSemesterId('');
              setSelectedSubjectId('');
            }}
            className={`flex items-center gap-1 hover:text-indigo-300 transition-colors ${
              !currentSemester ? 'text-indigo-400 font-semibold' : 'text-slate-300'
            }`}
          >
            <Layers className="w-3 h-3 text-slate-500" />
            <span>{currentYear.name}</span>
          </button>
        </>
      )}

      {/* Semester */}
      {currentSemester && (
        <>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
          <button
            onClick={() => setSelectedSubjectId('')}
            className={`hover:text-indigo-300 transition-colors ${
              !currentSubject ? 'text-indigo-400 font-semibold' : 'text-slate-300'
            }`}
          >
            <span>{currentSemester.name}</span>
          </button>
        </>
      )}

      {/* Subject & Course Code */}
      {currentSubject && (
        <>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
          <span className="flex items-center gap-1.5 text-indigo-300 font-semibold bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
            <BookOpen className="w-3 h-3 text-indigo-400" />
            <span>{currentSubject.code}: {currentSubject.name}</span>
          </span>
        </>
      )}
    </nav>
  );
};
