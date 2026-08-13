import React, { useState } from 'react';
import {
  LayoutGrid,
  List as ListIcon,
  ArrowUpDown,
  FileQuestion,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { usePapers } from '../../context/PaperContext';
import { PaperCard } from './PaperCard';
import { Button } from '../ui/Button';

export const PaperList: React.FC = () => {
  const { filteredPapers, searchQuery, resetFilters, bookmarks, onlyBookmarked } = usePapers();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'downloads' | 'newest' | 'code'>('downloads');

  const sortedPapers = [...filteredPapers].sort((a, b) => {
    if (sortBy === 'downloads') {
      return (b.download_count || 0) - (a.download_count || 0);
    }
    if (sortBy === 'newest') {
      return new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime();
    }
    if (sortBy === 'code') {
      return (a.course_code || '').localeCompare(b.course_code || '');
    }
    return 0;
  });

  return (
    <div className="space-y-4">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 border border-slate-800/80 p-3.5 rounded-2xl backdrop-blur-md">
        {/* Results count & status */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-100">
            {onlyBookmarked ? 'Saved Papers' : 'Question Papers'}
          </span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold font-mono">
            {sortedPapers.length} {sortedPapers.length === 1 ? 'result' : 'results'}
          </span>
          {searchQuery && (
            <span className="text-xs text-slate-400">
              for &ldquo;<strong className="text-slate-200">{searchQuery}</strong>&rdquo;
            </span>
          )}
        </div>

        {/* Right side: Sort by & View Mode Toggle */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-950/80 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="downloads">Most Downloaded</option>
              <option value="newest">Newest Uploaded</option>
              <option value="code">Course Code (A-Z)</option>
            </select>
          </div>

          <div className="flex items-center bg-slate-950/80 p-0.5 rounded-lg border border-slate-700/80">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'list' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="List View"
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Papers Grid / List */}
      {sortedPapers.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {sortedPapers.map((paper) => (
              <PaperCard key={paper.id} paper={paper} viewMode="grid" />
            ))}
          </div>
        ) : (
          <div className="space-y-2.5">
            {sortedPapers.map((paper) => (
              <PaperCard key={paper.id} paper={paper} viewMode="list" />
            ))}
          </div>
        )
      ) : (
        /* Empty State */
        <div className="glass-panel rounded-2xl p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
            <FileQuestion className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">No question papers found</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              {onlyBookmarked
                ? 'You haven’t saved any question papers yet. Browse and click the bookmark icon on any paper to save it here for fast revision.'
                : 'No archived papers match your active filter criteria. Try clearing filters or searching for another term.'}
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={resetFilters} className="text-xs">
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            Reset All Filters
          </Button>
        </div>
      )}
    </div>
  );
};
