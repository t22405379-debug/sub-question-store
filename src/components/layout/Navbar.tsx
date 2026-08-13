import React, { useState } from 'react';
import {
  Search,
  Bookmark,
  ChevronDown,
} from 'lucide-react';
import { usePapers } from '../../context/PaperContext';
import { Button } from '../ui/Button';

interface NavbarProps {
  activeTab: 'explorer' | 'admin' | 'bookmarks';
  setActiveTab: (tab: 'explorer' | 'admin' | 'bookmarks') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const {
    departments,
    selectedDepartmentId,
    setSelectedDepartmentId,
    activeDepartment,
    bookmarks,
    onlyBookmarked,
    setOnlyBookmarked,
    setIsSearchModalOpen,
    resetFilters,
  } = usePapers();

  const [isDeptDropdownOpen, setIsDeptDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-xl shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Logo & Identity (100% Universal & Clean) */}
          <div className="flex items-center gap-3">
            <div
              onClick={() => {
                resetFilters();
                setOnlyBookmarked(false);
                setActiveTab('explorer');
              }}
              className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group"
            >
              {/* Universal Academic Shield Crest */}
              <div className="relative">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-cyan-500 p-0.5 shadow-lg shadow-indigo-600/20 group-hover:scale-105 transition-transform">
                  <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center p-1.5 overflow-hidden">
                    <img src="/favicon.svg" alt="Academic Crest" className="w-full h-full object-contain" />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm sm:text-base font-black tracking-tight text-white group-hover:text-indigo-200 transition-colors">
                    Question Archive
                  </span>
                  <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                    {activeDepartment ? activeDepartment.code : 'Official'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                  {activeDepartment ? activeDepartment.name : 'Academic Question-Paper Repository'}
                </p>
              </div>
            </div>

            {/* Department Dropdown Switcher (if multiple exist) */}
            {departments.length > 1 && (
              <div className="relative ml-2 hidden md:block">
                <button
                  onClick={() => setIsDeptDropdownOpen(!isDeptDropdownOpen)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs font-semibold text-slate-200 hover:border-slate-600 transition-all"
                >
                  <span className="text-indigo-400 font-bold">{activeDepartment?.code || 'All'}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {isDeptDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsDeptDropdownOpen(false)} />
                    <div className="absolute top-full left-0 mt-2 w-64 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-20 space-y-1">
                      <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                        Select Category / Department
                      </div>
                      {departments.map((dept) => (
                        <button
                          key={dept.id}
                          onClick={() => {
                            setSelectedDepartmentId(dept.id);
                            setIsDeptDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                            selectedDepartmentId === dept.id
                              ? 'bg-indigo-500/15 text-indigo-300 font-bold border border-indigo-500/30'
                              : 'text-slate-300 hover:bg-slate-800/80'
                          }`}
                        >
                          <span className="truncate">{dept.name}</span>
                          <span className="font-mono text-[10px] text-slate-500 ml-2">{dept.code}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Center: Search Trigger (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-md mx-6">
            <button
              onClick={() => setIsSearchModalOpen(true)}
              className="w-full flex items-center justify-between px-4 py-2 rounded-2xl bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-400 transition-all shadow-inner group"
            >
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-indigo-400 group-hover:text-indigo-300 transition-colors" />
                <span className="group-hover:text-slate-300">Search courses, codes, exams, years...</span>
              </div>
              <kbd className="px-2 py-0.5 bg-slate-800 border border-slate-700 rounded-md text-[10px] font-mono text-slate-400">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Right Action Controls: STRICTLY STUDENTS ONLY */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Spotlight Search (Mobile) */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSearchModalOpen(true)}
              className="md:hidden text-slate-400 hover:text-white"
              title="Search"
            >
              <Search className="w-5 h-5" />
            </Button>

            {/* Bookmarked / Saved Papers Toggle */}
            <Button
              variant={onlyBookmarked ? 'primary' : 'outline'}
              size="sm"
              onClick={() => {
                setOnlyBookmarked(!onlyBookmarked);
                setActiveTab('explorer');
              }}
              className={`relative text-xs ${
                onlyBookmarked ? 'bg-amber-600 hover:bg-amber-500 text-white border-amber-500 shadow-md' : 'text-slate-300'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 mr-1.5 ${onlyBookmarked ? 'fill-current' : ''}`} />
              <span>Saved</span>
              {bookmarks.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 text-[10px] font-extrabold">
                  {bookmarks.length}
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
