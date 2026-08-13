import React from 'react';
import {
  FileText,
  Image as ImageIcon,
  Download,
  Eye,
  Bookmark,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import { QuestionPaper } from '../../types';
import { usePapers } from '../../context/PaperContext';
import { Button } from '../ui/Button';
import { formatBytes } from '../../services/imageOptimizer';
import { showToast } from '../ui/Toast';

export interface PaperCardProps {
  paper: QuestionPaper;
  viewMode?: 'grid' | 'list';
}

export const PaperCard: React.FC<PaperCardProps> = ({ paper, viewMode = 'grid' }) => {
  const { openViewer, bookmarks, toggleBookmark, recordDownload } = usePapers();
  const isBookmarked = bookmarks.includes(paper.id);

  const isPdf = paper.file_type === 'application/pdf';
  const pageCount = paper.pages && paper.pages.length > 0 ? paper.pages.length : 1;

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    recordDownload(paper.id);

    const link = document.createElement('a');
    link.href = paper.file_data_url || '#';
    link.download = paper.file_name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Download started', `${paper.file_name} is being downloaded.`);
  };

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleBookmark(paper.id);
    showToast(
      isBookmarked ? 'Removed from saved' : 'Saved paper',
      `${paper.course_code} ${paper.exam_type_name}`
    );
  };

  if (viewMode === 'list') {
    return (
      <div
        onClick={() => openViewer(paper)}
        className="glass-card rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:scale-[1.008] transition-all duration-200 group"
      >
        {/* Left info */}
        <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
              isPdf
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
            }`}
          >
            {isPdf ? <FileText className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                {paper.course_code}
              </span>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${paper.badge_color}`}
              >
                {paper.exam_type_name}
              </span>
              {pageCount > 1 && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                  <Layers className="w-3 h-3" />
                  <span>{pageCount} Pages</span>
                </span>
              )}
              {paper.has_solution && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  ✓ Solution Included
                </span>
              )}
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-500" />
                {paper.session_year}
              </span>
            </div>
            <h4 className="text-sm font-semibold text-slate-100 group-hover:text-indigo-300 transition-colors truncate">
              {paper.subject_name}
            </h4>
            <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
              <span>{paper.year_name} • {paper.semester_name}</span>
              <span>•</span>
              <span>{formatBytes(paper.file_size)}</span>
              <span>•</span>
              <span className="text-indigo-400">{paper.download_count} downloads</span>
            </div>
          </div>
        </div>

        {/* Right action buttons */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBookmark}
            title={isBookmarked ? 'Remove bookmark' : 'Bookmark paper'}
            className="text-slate-400 hover:text-amber-400"
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-amber-400 text-amber-400' : ''}`} />
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => openViewer(paper)}
            className="text-xs"
          >
            <Eye className="w-3.5 h-3.5 mr-1" />
            Preview
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleDownload}
            className="text-xs"
          >
            <Download className="w-3.5 h-3.5 mr-1" />
            Download
          </Button>
        </div>
      </div>
    );
  }

  // Grid Mode Card
  return (
    <div
      onClick={() => openViewer(paper)}
      className="glass-card rounded-2xl p-5 flex flex-col justify-between cursor-pointer hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-200 group relative overflow-hidden"
    >
      {/* Subtle background glow */}
      <div className="absolute -right-10 -top-10 w-28 h-28 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/15 transition-all" />

      {/* Top bar: Course Code, Exam Badge & Bookmark */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-mono text-xs font-bold text-indigo-300 bg-indigo-500/15 px-2.5 py-1 rounded-lg border border-indigo-500/30">
              {paper.course_code}
            </span>
            {pageCount > 1 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                <Layers className="w-3 h-3" />
                <span>{pageCount}P</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${paper.badge_color}`}
            >
              {paper.exam_type_code || paper.exam_type_name}
            </span>
            <button
              onClick={handleBookmark}
              className="p-1 text-slate-400 hover:text-amber-400 transition-colors"
              title={isBookmarked ? 'Remove saved' : 'Save for exam'}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-amber-400 text-amber-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Subject Title */}
        <h4 className="text-base font-bold text-slate-100 group-hover:text-indigo-200 transition-colors leading-snug line-clamp-2 mb-2">
          {paper.subject_name}
        </h4>

        {/* Metadata pills */}
        <div className="space-y-1 text-xs text-slate-400 mb-4">
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            <span>{paper.year_name} • {paper.semester_name}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-slate-400">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>Session: <strong className="text-slate-300">{paper.session_year}</strong></span>
            </span>
            {paper.has_solution && (
              <span className="text-[10px] font-bold text-emerald-400">
                ✓ Solution
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Preview Thumbnail Box */}
      <div className="relative w-full h-32 rounded-xl bg-slate-950/80 border border-slate-800/80 overflow-hidden mb-4 flex items-center justify-center group-hover:border-indigo-500/40 transition-colors">
        {paper.file_data_url ? (
          <img
            src={paper.file_data_url}
            alt={paper.file_name}
            className="w-full h-full object-cover object-top opacity-70 group-hover:opacity-100 transition-opacity"
            loading="lazy"
          />
        ) : (
          <div className="text-center text-slate-500">
            {isPdf ? <FileText className="w-8 h-8 mx-auto mb-1 text-rose-400/60" /> : <ImageIcon className="w-8 h-8 mx-auto mb-1 text-indigo-400/60" />}
            <span className="text-[11px] block">{paper.file_name}</span>
          </div>
        )}

        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 backdrop-blur-[2px] transition-all flex items-center justify-center gap-2">
          <span className="text-xs font-semibold text-white bg-indigo-600/90 px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5" />
            Click to View ({pageCount} {pageCount === 1 ? 'Page' : 'Pages'})
          </span>
        </div>
      </div>

      {/* Footer Info & Actions */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
        <div className="text-[11px] text-slate-400">
          <span>{formatBytes(paper.file_size)}</span>
          <span className="mx-1.5 text-slate-600">•</span>
          <span className="text-indigo-400 font-medium">{paper.download_count} dl</span>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleDownload}
            className="text-xs px-2.5 py-1.5"
          >
            <Download className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => openViewer(paper)}
            className="text-xs px-3 py-1.5"
          >
            Preview
          </Button>
        </div>
      </div>
    </div>
  );
};
