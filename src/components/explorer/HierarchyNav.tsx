import React from 'react';
import { Layers, Calendar, Check, BookOpen, AlertCircle } from 'lucide-react';
import { usePapers } from '../../context/PaperContext';

export const HierarchyNav: React.FC = () => {
  const {
    years,
    semesters,
    subjects,
    papers,
    selectedDepartmentId,
    selectedYearId,
    selectedSemesterId,
    setSelectedYearId,
    setSelectedSemesterId,
    setSelectedSubjectId,
  } = usePapers();

  // Helper to count papers in a year (filtered by active department)
  const getPaperCountForYear = (yearId: string) => {
    const yearSubjIds = subjects
      .filter((s) => (!selectedDepartmentId || s.department_id === selectedDepartmentId) && s.year_id === yearId)
      .map((s) => s.id);
    return papers.filter((p) => yearSubjIds.includes(p.subject_id)).length;
  };

  // Helper to count papers in a semester (given current year and department)
  const getPaperCountForSemester = (semId: string) => {
    const semSubjIds = subjects
      .filter(
        (s) =>
          (!selectedDepartmentId || s.department_id === selectedDepartmentId) &&
          (!selectedYearId || s.year_id === selectedYearId) &&
          s.semester_id === semId
      )
      .map((s) => s.id);
    return papers.filter((p) => semSubjIds.includes(p.subject_id)).length;
  };

  if (years.length === 0 && semesters.length === 0) {
    return (
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-400">
        <AlertCircle className="w-4 h-4 mx-auto mb-1 text-slate-500" />
        <span>No academic years or semesters configured yet. You can add them in the Admin Portal.</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Dynamic Year Selector Tabs */}
      {years.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>Academic Year</span>
            </label>
            {selectedYearId && (
              <button
                onClick={() => {
                  setSelectedYearId('');
                  setSelectedSemesterId('');
                  setSelectedSubjectId('');
                }}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Clear Year
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {years.map((year) => {
              const isSelected = selectedYearId === year.id;
              const paperCount = getPaperCountForYear(year.id);

              return (
                <button
                  key={year.id}
                  onClick={() => {
                    if (isSelected) {
                      setSelectedYearId('');
                      setSelectedSemesterId('');
                      setSelectedSubjectId('');
                    } else {
                      setSelectedYearId(year.id);
                      setSelectedSubjectId('');
                    }
                  }}
                  className={`relative flex flex-col items-start p-3.5 rounded-xl border transition-all text-left group ${
                    isSelected
                      ? 'bg-indigo-600/20 border-indigo-500/80 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500'
                      : 'bg-slate-900/70 hover:bg-slate-800/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span
                      className={`text-sm font-bold transition-colors ${
                        isSelected ? 'text-white' : 'text-slate-200 group-hover:text-white'
                      }`}
                    >
                      {year.name}
                    </span>
                    {isSelected && (
                      <span className="w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center text-white">
                        <Check className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <BookOpen className="w-3 h-3 text-slate-500" />
                    <span>{paperCount} {paperCount === 1 ? 'Paper' : 'Papers'}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Dynamic Semester / Term Selector Tabs */}
      {semesters.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              <span>Semester / Term</span>
            </label>
            {selectedSemesterId && (
              <button
                onClick={() => {
                  setSelectedSemesterId('');
                  setSelectedSubjectId('');
                }}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                Clear Term
              </button>
            )}
          </div>

          <div className={`grid grid-cols-2 sm:grid-cols-${Math.min(semesters.length, 4)} gap-2.5`}>
            {semesters.map((sem) => {
              const isSelected = selectedSemesterId === sem.id;
              const paperCount = getPaperCountForSemester(sem.id);

              return (
                <button
                  key={sem.id}
                  onClick={() => {
                    if (isSelected) {
                      setSelectedSemesterId('');
                      setSelectedSubjectId('');
                    } else {
                      setSelectedSemesterId(sem.id);
                      setSelectedSubjectId('');
                    }
                  }}
                  className={`relative flex items-center justify-between p-3 rounded-xl border transition-all text-left ${
                    isSelected
                      ? 'bg-cyan-950/40 border-cyan-500/80 shadow-md shadow-cyan-500/10 ring-1 ring-cyan-500'
                      : 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <span
                      className={`text-sm font-semibold block ${
                        isSelected ? 'text-cyan-200' : 'text-slate-200'
                      }`}
                    >
                      {sem.name}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {paperCount} available
                    </span>
                  </div>
                  {isSelected && (
                    <span className="w-4 h-4 rounded-full bg-cyan-500 flex items-center justify-center text-slate-950">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
