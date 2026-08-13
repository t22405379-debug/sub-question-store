import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  X,
  FileText,
  Image as ImageIcon,
  ArrowRight,
  BookOpen,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { usePapers } from '../../context/PaperContext';
import { QuestionPaper } from '../../types';

export const SearchModal: React.FC = () => {
  const {
    isSearchModalOpen,
    setIsSearchModalOpen,
    papers,
    openViewer,
    setSelectedSubjectId,
  } = usePapers();
  const [localQuery, setLocalQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchModalOpen) {
      setLocalQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isSearchModalOpen]);

  if (!isSearchModalOpen) return null;

  const results = localQuery.trim()
    ? papers.filter((p) => {
        const q = localQuery.toLowerCase();
        return (
          (p.course_code || '').toLowerCase().includes(q) ||
          (p.subject_name || '').toLowerCase().includes(q) ||
          (p.exam_type_name || '').toLowerCase().includes(q) ||
          (p.session_year || '').toLowerCase().includes(q) ||
          (p.file_name || '').toLowerCase().includes(q)
        );
      })
    : [];

  const handleSelectPaper = (paper: QuestionPaper) => {
    setIsSearchModalOpen(false);
    openViewer(paper);
  };

  const handleQuickTag = (tag: string) => {
    setLocalQuery(tag);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/85 backdrop-blur-md transition-opacity animate-fade-in"
        onClick={() => setIsSearchModalOpen(false)}
      />

      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-700/90 shadow-2xl shadow-black/90 overflow-hidden transform animate-slide-up">
        {/* Search Input Box */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-800 gap-3">
          <Search className="w-5 h-5 text-indigo-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            placeholder="Search by course code (e.g. CSE 1101), subject, or exam type..."
            className="w-full bg-transparent text-slate-100 placeholder-slate-500 text-sm sm:text-base focus:outline-none"
          />
          {localQuery && (
            <button
              onClick={() => setLocalQuery('')}
              className="text-slate-400 hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700 font-mono">
            ESC
          </kbd>
        </div>

        {/* Quick Suggested Tags */}
        <div className="px-4 py-2.5 bg-slate-950/50 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-slate-500 text-[11px] shrink-0 font-medium">Quick Filters:</span>
          {['CSE 1101', 'CSE 1201', 'CSE 2101', 'Midterm', 'Final', '2024-2025'].map((tag) => (
            <button
              key={tag}
              onClick={() => handleQuickTag(tag)}
              className="px-2 py-0.5 rounded-md bg-slate-800/80 hover:bg-indigo-600/30 hover:text-indigo-200 text-slate-400 border border-slate-700/60 transition-colors shrink-0"
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-3 divide-y divide-slate-800/60">
          {localQuery.trim() === '' ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              <BookOpen className="w-8 h-8 mx-auto text-slate-600 mb-2" />
              <p className="font-medium text-slate-300">Type any course code, subject name, or exam to start</p>
              <p className="text-slate-500 mt-1">Instant search indexing all 4 years of CSE question archives</p>
            </div>
          ) : results.length > 0 ? (
            results.map((paper) => {
              const isPdf = paper.file_type === 'application/pdf';
              return (
                <div
                  key={paper.id}
                  onClick={() => handleSelectPaper(paper)}
                  className="p-3 rounded-xl hover:bg-slate-800/80 cursor-pointer flex items-center justify-between gap-3 group transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
                        isPdf
                          ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                          : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                      }`}
                    >
                      {isPdf ? <FileText className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-mono text-xs font-bold text-indigo-400">
                          {paper.course_code}
                        </span>
                        <span className="text-[10px] px-2 py-0.2 rounded-full border border-slate-700 text-slate-300 bg-slate-800">
                          {paper.exam_type_name}
                        </span>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5 text-slate-500" />
                          {paper.session_year}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-slate-200 truncate group-hover:text-white">
                        {paper.subject_name}
                      </p>
                    </div>
                  </div>

                  <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs">
              <p className="font-medium text-slate-300">No question papers matching &ldquo;{localQuery}&rdquo;</p>
              <p className="text-slate-500 mt-1">Try searching by course code like CSE 1101 or exam like Midterm</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
