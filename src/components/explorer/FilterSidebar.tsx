import React from 'react';
import { Filter, Tag, Calendar, BookOpen, RotateCcw, Building } from 'lucide-react';
import { usePapers } from '../../context/PaperContext';

export const FilterSidebar: React.FC = () => {
  const {
    departments,
    examTypes,
    filteredSubjects,
    availableSessions,
    selectedDepartmentId,
    selectedSubjectId,
    selectedExamTypeId,
    selectedSession,
    setSelectedDepartmentId,
    setSelectedSubjectId,
    setSelectedExamTypeId,
    setSelectedSession,
    resetFilters,
  } = usePapers();

  const hasActiveFilters = Boolean(selectedSubjectId || selectedExamTypeId || selectedSession);

  return (
    <div className="glass-panel rounded-2xl p-5 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
            Refine Papers
          </h3>
        </div>
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* 1. Department Filter (if multiple exist) */}
      {departments.length > 1 && (
        <div>
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
            <Building className="w-3.5 h-3.5 text-emerald-400" />
            <span>Department</span>
          </label>
          <div className="flex flex-wrap gap-1.5">
            {departments.map((d) => {
              const isSelected = selectedDepartmentId === d.id;
              return (
                <button
                  key={d.id}
                  onClick={() => setSelectedDepartmentId(d.id)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-500 font-semibold'
                      : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  {d.code}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Exam Type Filter */}
      <div>
        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
          <Tag className="w-3.5 h-3.5 text-indigo-400" />
          <span>Exam Type</span>
        </label>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setSelectedExamTypeId('')}
            className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
              !selectedExamTypeId
                ? 'bg-indigo-600 text-white border-indigo-500 font-medium'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            All Exams
          </button>
          {examTypes.map((exam) => {
            const isSelected = selectedExamTypeId === exam.id;
            return (
              <button
                key={exam.id}
                onClick={() => setSelectedExamTypeId(isSelected ? '' : exam.id)}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-500 font-semibold shadow-sm'
                    : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                {exam.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Subjects Filter */}
      <div>
        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
          <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
          <span>Course / Subject</span>
        </label>
        <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
          <button
            onClick={() => setSelectedSubjectId('')}
            className={`w-full text-left text-xs px-3 py-2 rounded-xl transition-all ${
              !selectedSubjectId
                ? 'bg-cyan-950/40 text-cyan-200 font-semibold border border-cyan-500/40'
                : 'text-slate-400 hover:bg-slate-900/80 hover:text-slate-200'
            }`}
          >
            All Courses ({filteredSubjects.length})
          </button>
          {filteredSubjects.map((subj) => {
            const isSelected = selectedSubjectId === subj.id;
            return (
              <button
                key={subj.id}
                onClick={() => setSelectedSubjectId(isSelected ? '' : subj.id)}
                className={`w-full text-left text-xs px-3 py-2 rounded-xl transition-all ${
                  isSelected
                    ? 'bg-cyan-950/40 text-cyan-200 font-semibold border border-cyan-500/40'
                    : 'text-slate-300 hover:bg-slate-900/80 hover:text-slate-100'
                }`}
              >
                <span className="font-mono text-indigo-400 font-bold block">{subj.code}</span>
                <span className="truncate block text-slate-300">{subj.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Academic Session Filter */}
      {availableSessions.length > 0 && (
        <div>
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <span>Academic Session</span>
          </label>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setSelectedSession('')}
              className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                !selectedSession
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-semibold'
                  : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              All Years
            </button>
            {availableSessions.map((session) => {
              const isSelected = selectedSession === session;
              return (
                <button
                  key={session}
                  onClick={() => setSelectedSession(isSelected ? '' : session)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                    isSelected
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-semibold'
                      : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  {session}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
