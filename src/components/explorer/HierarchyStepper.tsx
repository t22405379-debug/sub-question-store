import React from 'react';
import {
  Layers,
  Calendar,
  BookOpen,
  ArrowRight,
  ArrowLeft,
  FolderOpen,
  Tag,
  Building,
} from 'lucide-react';
import { usePapers } from '../../context/PaperContext';
import { downloadPapersAsZip } from '../../services/zipExporter';
import { PaperCard } from './PaperCard';

interface HierarchyStepperProps {
  onOpenUploadForSubject?: (subjId: string) => void;
  onNavigateToAdmin?: () => void;
}

export const HierarchyStepper: React.FC<HierarchyStepperProps> = () => {
  const {
    departments,
    years,
    semesters,
    subjects,
    papers,
    examTypes,
    selectedDepartmentId,
    selectedYearId,
    selectedSemesterId,
    selectedSubjectId,
    selectedExamTypeId,
    setSelectedDepartmentId,
    setSelectedYearId,
    setSelectedSemesterId,
    setSelectedSubjectId,
    setSelectedExamTypeId,
  } = usePapers();

  // Current selections
  const currentDept = departments.find((d) => d.id === selectedDepartmentId) || departments[0];
  const currentYear = years.find((y) => y.id === selectedYearId);
  const currentSemester = semesters.find((s) => s.id === selectedSemesterId);
  const currentSubject = subjects.find((s) => s.id === selectedSubjectId);

  // Helper counts
  const getSubjectsForYear = (yearId: string) =>
    subjects.filter((s) => (!selectedDepartmentId || s.department_id === selectedDepartmentId) && s.year_id === yearId);

  const getPapersForYear = (yearId: string) => {
    const subjIds = getSubjectsForYear(yearId).map((s) => s.id);
    return papers.filter((p) => subjIds.includes(p.subject_id));
  };

  const getSubjectsForSem = (yearId: string, semId: string) =>
    subjects.filter(
      (s) =>
        (!selectedDepartmentId || s.department_id === selectedDepartmentId) &&
        s.year_id === yearId &&
        s.semester_id === semId
    );

  const getPapersForSem = (yearId: string, semId: string) => {
    const subjIds = getSubjectsForSem(yearId, semId).map((s) => s.id);
    return papers.filter((p) => subjIds.includes(p.subject_id));
  };

  const getPapersForSubject = (subjId: string) =>
    papers.filter((p) => p.subject_id === subjId);

  // --------------------------------------------------------------------------
  // STEP 4: Inside a Specific Subject -> Show Question Papers by Exam Type
  // --------------------------------------------------------------------------
  if (currentSubject && currentYear && currentSemester) {
    const subjectPapers = getPapersForSubject(currentSubject.id);
    const filteredByExam = selectedExamTypeId
      ? subjectPapers.filter((p) => p.exam_type_id === selectedExamTypeId)
      : subjectPapers;

    return (
      <div className="space-y-6 animate-fade-in">
        {/* Navigation Step Header */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedSubjectId('')}
              className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5 text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Courses</span>
            </button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                  {currentSubject.code}
                </span>
                <span className="text-xs text-slate-400 font-semibold">
                  {currentYear.name} • {currentSemester.name}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white mt-1">
                {currentSubject.name}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-400 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
              {subjectPapers.length} {subjectPapers.length === 1 ? 'Paper' : 'Papers'} in Archive
            </span>
            {subjectPapers.length > 0 && (
              <button
                onClick={() => {
                  downloadPapersAsZip(
                    filteredByExam.length > 0 ? filteredByExam : subjectPapers,
                    `${currentSubject.code}_Study_Pack.zip`
                  );
                }}
                className="text-xs font-bold text-indigo-300 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
                title="Download all question papers in this subject as a ZIP file"
              >
                <FolderOpen className="w-3.5 h-3.5 text-indigo-400" />
                <span>Download Study Pack (ZIP)</span>
              </button>
            )}
          </div>
        </div>

        {/* Exam Type Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap bg-slate-900/60 p-2 rounded-2xl border border-slate-800">
          <span className="text-xs font-semibold text-slate-400 px-2 flex items-center gap-1">
            <Tag className="w-3.5 h-3.5 text-indigo-400" />
            Filter Exam:
          </span>
          <button
            onClick={() => setSelectedExamTypeId('')}
            className={`text-xs px-3 py-1.5 rounded-xl font-semibold transition-all ${
              !selectedExamTypeId
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Exams ({subjectPapers.length})
          </button>
          {examTypes.map((e) => {
            const count = subjectPapers.filter((p) => p.exam_type_id === e.id).length;
            const isSelected = selectedExamTypeId === e.id;
            return (
              <button
                key={e.id}
                onClick={() => setSelectedExamTypeId(isSelected ? '' : e.id)}
                className={`text-xs px-3 py-1.5 rounded-xl font-semibold transition-all border ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                    : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                {e.name} ({count})
              </button>
            );
          })}
        </div>

        {/* Papers Grid */}
        {filteredByExam.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredByExam.map((paper) => (
              <PaperCard key={paper.id} paper={paper} viewMode="grid" />
            ))}
          </div>
        ) : (
          <div className="glass-panel rounded-2xl p-12 text-center space-y-4 border border-slate-800">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto">
              <FolderOpen className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">No question papers uploaded for {currentSubject.code} yet</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                You haven't uploaded any question paper files to this course yet. Go to the Admin Portal to upload midterms, class tests, or finals.
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // STEP 3: Inside a Specific Year & Semester -> Show Subject / Course List
  // --------------------------------------------------------------------------
  if (currentYear && currentSemester) {
    const semSubjects = getSubjectsForSem(currentYear.id, currentSemester.id);

    return (
      <div className="space-y-6 animate-fade-in">
        {/* Navigation Step Header */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedSemesterId('')}
              className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5 text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Semesters</span>
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                  {currentYear.name}
                </span>
                <span className="text-xs text-slate-500">•</span>
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                  {currentSemester.name}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white mt-0.5">
                Select a Course / Subject
              </h2>
            </div>
          </div>

          <span className="text-xs font-semibold text-slate-400 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 self-start md:self-auto">
            {semSubjects.length} {semSubjects.length === 1 ? 'Course' : 'Courses'} in this Semester
          </span>
        </div>

        {/* Subjects Grid */}
        {semSubjects.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {semSubjects.map((subj) => {
              const count = getPapersForSubject(subj.id).length;
              return (
                <div
                  key={subj.id}
                  onClick={() => setSelectedSubjectId(subj.id)}
                  className="glass-card rounded-2xl p-5 cursor-pointer hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/10 transition-all group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-mono text-xs font-bold text-indigo-300 bg-indigo-500/15 px-2.5 py-1 rounded-lg border border-indigo-500/30">
                        {subj.code}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-400 font-mono">
                        {subj.credits} Credits
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-slate-100 group-hover:text-indigo-200 transition-colors leading-snug mb-2">
                      {subj.name}
                    </h4>

                    {subj.syllabus_overview && (
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
                        {subj.syllabus_overview}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-400">
                      {count} {count === 1 ? 'Paper' : 'Papers'} Archived
                    </span>
                    <span className="text-xs text-indigo-400 font-semibold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      <span>View Papers</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="glass-panel rounded-2xl p-12 text-center space-y-4 border border-slate-800">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto">
              <BookOpen className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                No subjects added to {currentYear.name} • {currentSemester.name} yet
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                You haven't added any subjects under this semester yet. Use the Admin Portal to add course codes and syllabus topics.
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // STEP 2: Inside a Specific Year -> Show Semesters (1st Semester, 2nd Semester)
  // --------------------------------------------------------------------------
  if (currentYear) {
    const yearSubjects = getSubjectsForYear(currentYear.id);
    const yearPapers = getPapersForYear(currentYear.id);

    return (
      <div className="space-y-6 animate-fade-in">
        {/* Navigation Step Header */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedYearId('')}
              className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5 text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Years</span>
            </button>
            <div>
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                {currentDept?.name || 'Department'}
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-white mt-0.5">
                {currentYear.name} — Select Semester
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>📚 {yearSubjects.length} Courses</span>
            <span>•</span>
            <span>📝 {yearPapers.length} Papers</span>
          </div>
        </div>

        {/* Semesters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {semesters.map((sem) => {
            const semSubjs = getSubjectsForSem(currentYear.id, sem.id);
            const semPapers = getPapersForSem(currentYear.id, sem.id);

            return (
              <div
                key={sem.id}
                onClick={() => setSelectedSemesterId(sem.id)}
                className="glass-card rounded-3xl p-6 sm:p-8 cursor-pointer hover:border-cyan-500/60 hover:shadow-2xl hover:shadow-cyan-500/10 transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white group-hover:text-cyan-200 transition-colors">
                    {sem.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    {currentYear.name} Curriculum &amp; Assessment Archive
                  </p>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-slate-300 block">
                      {semSubjs.length} {semSubjs.length === 1 ? 'Course' : 'Courses'}
                    </span>
                    <span className="text-[11px] text-emerald-400 block font-mono">
                      {semPapers.length} {semPapers.length === 1 ? 'Paper' : 'Papers'} available
                    </span>
                  </div>

                  <span className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center group-hover:bg-cyan-600 group-hover:text-white transition-colors">
                    <ArrowRight className="w-5 h-5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // STEP 1: Top Level -> Show Academic Years (1st Year, 2nd Year, 3rd Year, 4th Year...)
  // --------------------------------------------------------------------------
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Level Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
            <Layers className="w-3.5 h-3.5" />
            <span>Academic Hierarchy</span>
          </span>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Select Academic Year
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Click on your year to drill down into semesters, courses, and question papers
          </p>
        </div>

        {departments.length > 1 && (
          <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-xl border border-slate-800 self-start sm:self-auto">
            <Building className="w-3.5 h-3.5 text-emerald-400 ml-1.5" />
            <select
              value={selectedDepartmentId}
              onChange={(e) => setSelectedDepartmentId(e.target.value)}
              className="bg-transparent text-xs text-slate-200 font-semibold focus:outline-none cursor-pointer pr-2"
            >
              {departments.map((d) => (
                <option key={d.id} value={d.id} className="bg-slate-900">
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Big Years Cards Grid */}
      {years.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {years.map((year, idx) => {
            const yearSubjs = getSubjectsForYear(year.id);
            const yearPapers = getPapersForYear(year.id);

            const gradients = [
              'from-indigo-600/20 to-blue-600/5 hover:border-indigo-500/60',
              'from-cyan-600/20 to-teal-600/5 hover:border-cyan-500/60',
              'from-purple-600/20 to-indigo-600/5 hover:border-purple-500/60',
              'from-amber-600/20 to-orange-600/5 hover:border-amber-500/60',
            ];
            const colorClass = gradients[idx % gradients.length];

            return (
              <div
                key={year.id}
                onClick={() => setSelectedYearId(year.id)}
                className={`glass-card bg-gradient-to-b ${colorClass} rounded-3xl p-6 cursor-pointer hover:-translate-y-1.5 hover:shadow-2xl transition-all duration-300 group flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="w-10 h-10 rounded-2xl bg-slate-950/80 border border-slate-700/80 font-mono text-sm font-bold text-white flex items-center justify-center">
                      0{idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-slate-400 bg-slate-950/60 px-2.5 py-1 rounded-full border border-slate-800">
                      {semesters.length} Semesters
                    </span>
                  </div>

                  <h3 className="text-xl font-extrabold text-white group-hover:text-indigo-200 transition-colors mb-1">
                    {year.name}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Undergraduate Curriculum
                  </p>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">
                      {yearSubjs.length} Courses
                    </span>
                    <span className="text-[11px] text-emerald-400 font-mono block">
                      {yearPapers.length} Papers
                    </span>
                  </div>

                  <span className="w-9 h-9 rounded-xl bg-slate-900 text-slate-300 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center transition-colors shadow-md">
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-panel rounded-2xl p-12 text-center space-y-4 border border-slate-800">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto">
            <Layers className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">No Academic Years configured</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              Add your academic years in the Admin Portal to start organizing courses.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
