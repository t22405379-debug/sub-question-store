import React, { useState } from 'react';
import {
  Search,
  Building,
  FolderTree,
  Filter,
  GraduationCap,
} from 'lucide-react';
import { usePapers } from '../../context/PaperContext';
import { HierarchyStepper } from './HierarchyStepper';
import { FilterSidebar } from './FilterSidebar';
import { PaperList } from './PaperList';
import { Breadcrumbs } from '../layout/Breadcrumbs';
import { Button } from '../ui/Button';

export const ExplorerView: React.FC = () => {
  const {
    papers,
    subjects,
    departments,
    selectedDepartmentId,
    setSelectedDepartmentId,
    activeDepartment,
    setIsSearchModalOpen,
    onlyBookmarked,
  } = usePapers();

  // Mode: 'stepper' (Guided 1st Year -> 2nd Year -> Sem -> Subject -> Paper) vs 'filter' (Flat search & multi-filter)
  const [browseMode, setBrowseMode] = useState<'stepper' | 'filter'>('stepper');

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-6 sm:space-y-8">
      {/* Universal Hero Banner */}
      {!onlyBookmarked && (
        <div className="relative rounded-3xl p-6 sm:p-10 overflow-hidden border border-slate-800 bg-gradient-to-b from-slate-900/95 via-slate-900/70 to-slate-950/90 shadow-2xl">
          {/* Ambient Royal Indigo & Cyan Glows */}
          <div className="absolute -left-10 -top-10 w-80 h-80 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute right-0 bottom-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-4">
            {/* Category Tag */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-[11px] sm:text-xs font-bold">
              <GraduationCap className="w-4 h-4 text-indigo-400" />
              <span>{activeDepartment ? activeDepartment.name : 'Academic Question-Paper Archive'}</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
              Academic Examination <br />
              <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-cyan-300 bg-clip-text text-transparent">
                Question-Paper Archive
              </span>
            </h1>

            <p className="text-xs sm:text-sm md:text-base text-slate-300 leading-relaxed max-w-2xl">
              {activeDepartment?.description ||
                'Official question archive. Easily navigate step-by-step through Year, Semester, and Course Code to find, preview, and download examination papers.'}
            </p>

            {/* Department selection pills if multiple exist */}
            {departments.length > 1 && (
              <div className="flex items-center gap-2 flex-wrap pt-1">
                <span className="text-xs text-slate-400 font-bold flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-indigo-400" />
                  Category / Department:
                </span>
                {departments.map((dept) => (
                  <button
                    key={dept.id}
                    onClick={() => setSelectedDepartmentId(dept.id)}
                    className={`text-xs px-3 py-1.5 rounded-xl border transition-all ${
                      selectedDepartmentId === dept.id
                        ? 'bg-indigo-600 text-white border-indigo-500 font-bold shadow-md shadow-indigo-600/20'
                        : 'bg-slate-900/80 text-slate-400 border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    {dept.code} — {dept.name}
                  </button>
                ))}
              </div>
            )}

            {/* Controls / Search Trigger & Mode Switcher */}
            <div className="pt-2 flex flex-wrap items-center gap-2.5 sm:gap-3">
              <Button
                variant="primary"
                size="md"
                onClick={() => setIsSearchModalOpen(true)}
                className="shadow-xl shadow-indigo-600/25 bg-indigo-600 hover:bg-indigo-500 border-indigo-500 text-xs font-bold px-4 sm:px-5"
              >
                <Search className="w-4 h-4 mr-2" />
                Spotlight Search (Ctrl+K)
              </Button>

              {/* Browse Mode Selector */}
              <div className="flex items-center bg-slate-950/90 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setBrowseMode('stepper')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    browseMode === 'stepper'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FolderTree className="w-3.5 h-3.5" />
                  <span>Step-by-Step Directory</span>
                </button>
                <button
                  onClick={() => setBrowseMode('filter')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    browseMode === 'filter'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span>All Papers &amp; Filter</span>
                </button>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-400 px-2 py-1 hidden sm:flex">
                <span className="text-emerald-400 font-semibold font-mono">⚡ {papers.length} Uploaded Papers</span>
                <span>•</span>
                <span className="text-cyan-400 font-semibold font-mono">📚 {subjects.length} Courses</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Breadcrumb Path */}
      <Breadcrumbs />

      {/* Main Content Area */}
      {onlyBookmarked || browseMode === 'filter' ? (
        /* Flat Filter Mode / Bookmarks Mode */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          <div className="lg:col-span-1">
            <FilterSidebar />
          </div>
          <div className="lg:col-span-3">
            <PaperList />
          </div>
        </div>
      ) : (
        /* Guided Step-by-Step Stepper Mode (Default: Department -> Year -> Semester -> Subject -> Exam) */
        <HierarchyStepper />
      )}
    </div>
  );
};
