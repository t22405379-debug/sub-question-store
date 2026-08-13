import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Minimize2,
  Bookmark,
  FileText,
  ShieldCheck,
  QrCode,
  CheckCircle2,
  NotebookPen,
  Printer,
  ChevronLeft,
  ChevronRight,
  Layers,
  FileDown,
} from 'lucide-react';
import { usePapers } from '../../context/PaperContext';
import { studyTrackerService } from '../../services/studyTracker';
import { exportPaperToPdf } from '../../services/pdfExporter';
import { Button } from '../ui/Button';
import { formatBytes } from '../../services/imageOptimizer';
import { QRCodeModal } from '../ui/QRCodeModal';
import { DownloadProgressModal } from '../ui/DownloadProgressModal';
import { showToast } from '../ui/Toast';

export const PaperViewerModal: React.FC = () => {
  const {
    activeViewingPaper: paper,
    closeViewer,
    openViewer,
    papers,
    bookmarks,
    toggleBookmark,
    recordDownload,
  } = usePapers();

  const [activePageIndex, setActivePageIndex] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Practiced Tracker, Personal Notes & Modals
  const [isPracticed, setIsPracticed] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [showNotesDrawer, setShowNotesDrawer] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);

  // Calculate pages
  const paperPages = React.useMemo(() => {
    if (!paper) return [];
    if (paper.pages && paper.pages.length > 0) return paper.pages;
    if (paper.file_data_url) return [paper.file_data_url];
    return [];
  }, [paper]);

  const totalPages = paperPages.length;
  const currentImageSrc = paperPages[activePageIndex] || paper?.file_data_url;

  // Find sibling papers in the same subject for navigation
  const subjectPapers = React.useMemo(() => {
    if (!paper) return [];
    return papers.filter((p) => p.subject_id === paper.subject_id);
  }, [paper, papers]);

  const currentPaperIndex = subjectPapers.findIndex((p) => p.id === paper?.id);
  const hasPrevPaper = currentPaperIndex > 0;
  const hasNextPaper = currentPaperIndex !== -1 && currentPaperIndex < subjectPapers.length - 1;

  const handlePrev = () => {
    if (activePageIndex > 0) {
      setActivePageIndex((p) => p - 1);
    } else if (hasPrevPaper) {
      openViewer(subjectPapers[currentPaperIndex - 1]);
      setActivePageIndex(0);
    }
  };

  const handleNext = () => {
    if (activePageIndex < totalPages - 1) {
      setActivePageIndex((p) => p + 1);
    } else if (hasNextPaper) {
      openViewer(subjectPapers[currentPaperIndex + 1]);
      setActivePageIndex(0);
    }
  };

  useEffect(() => {
    if (paper) {
      setActivePageIndex(0);
      setZoom(1);
      setRotation(0);
      setIsFullscreen(false);
      setIsPracticed(studyTrackerService.isPracticed(paper.id));
      setNoteText(studyTrackerService.getNote(paper.id));
      setShowNotesDrawer(false);
      setShowProgressModal(false);
    }
  }, [paper?.id]);

  // Keyboard Shortcuts (Arrow Left/Right, R, D, P, Zoom, Esc)
  useEffect(() => {
    if (!paper) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['TEXTAREA', 'INPUT'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === 'Escape') {
        closeViewer();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'r' || e.key === 'R') {
        setRotation((r) => (r + 90) % 360);
      } else if (e.key === '+' || e.key === '=') {
        setZoom((z) => Math.min(z + 0.25, 4.0));
      } else if (e.key === '-' || e.key === '_') {
        setZoom((z) => Math.max(z - 0.25, 0.4));
      } else if (e.key === 'd' || e.key === 'D') {
        handleDownload();
      } else if (e.key === 'p' || e.key === 'P') {
        handlePrintPaper();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [paper?.id, activePageIndex, totalPages, hasPrevPaper, hasNextPaper]);

  if (!paper) return null;

  const isBookmarked = bookmarks.includes(paper.id);

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.25, 4.0));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.4));
  const handleRotate = () => setRotation((r) => (r + 90) % 360);

  const handleDownload = () => {
    recordDownload(paper.id);
    setShowProgressModal(true);

    const link = document.createElement('a');
    link.href = currentImageSrc || '#';
    link.download = `${paper.course_code}_${paper.exam_type_name}_Page${activePageIndex + 1}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Download Started', `${paper.file_name} fast download started.`);
  };

  const handleExportPdf = async () => {
    try {
      setIsExportingPdf(true);
      recordDownload(paper.id);
      await exportPaperToPdf(paper);
      showToast('PDF Exported', `${paper.course_code} multi-page PDF booklet generated.`);
    } catch (err: any) {
      showToast('PDF Export Failed', err.message || 'Error creating PDF', 'error');
    } finally {
      setIsExportingPdf(false);
    }
  };

  // 1-Click Multi-Page Clean A4 Print
  const handlePrintPaper = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const pagesHtml = paperPages
      .map(
        (src, idx) => `
        <div style="page-break-after: always; padding: 10px; text-align: center;">
          <div class="header">
            <span>${paper.course_code}: ${paper.subject_name}</span>
            <span>Page ${idx + 1} of ${paperPages.length} • ${paper.exam_type_name} (${paper.session_year})</span>
          </div>
          <img src="${src}" style="max-width: 100%; max-height: 88vh; object-fit: contain;" />
        </div>
      `
      )
      .join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${paper.course_code} - ${paper.exam_type_name} (${paper.session_year})</title>
          <style>
            @page { size: A4 portrait; margin: 8mm; }
            body { font-family: sans-serif; background: #fff; color: #000; margin: 0; padding: 0; }
            .header { border-bottom: 2px solid #333; padding-bottom: 6px; margin-bottom: 12px; display: flex; justify-content: space-between; font-size: 13px; font-weight: bold; }
          </style>
        </head>
        <body>
          ${pagesHtml}
          <script>
            window.onload = function() {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleTogglePracticed = () => {
    const updated = studyTrackerService.togglePracticed(paper.id);
    setIsPracticed(updated);
    showToast(
      updated ? 'Marked as Practiced ✅' : 'Unmarked Practiced',
      `${paper.course_code} ${paper.exam_type_name}`
    );
  };

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    studyTrackerService.saveNote(paper.id, noteText);
    showToast('Note Saved', 'Your study note is stored securely on your device.');
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-slate-950/90 backdrop-blur-md transition-opacity animate-fade-in"
          onClick={closeViewer}
        />

        {/* Main Container */}
        <div
          className={`relative z-10 w-full ${
            isFullscreen ? 'h-[98vh] max-w-[98vw]' : 'h-[92vh] max-w-6xl'
          } bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up`}
        >
          {/* Top Viewer Control Bar */}
          <div className="flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3 border-b border-slate-800 bg-slate-950/80">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-500/15 px-2 py-0.5 rounded border border-indigo-500/30 shrink-0">
                {paper.course_code}
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-100 truncate">{paper.subject_name}</h3>
                  {paper.has_solution && (
                    <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                      ✓ Solution Included
                    </span>
                  )}
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">
                  {paper.exam_type_name} • Session {paper.session_year}
                  {totalPages > 1 && ` • Page ${activePageIndex + 1} of ${totalPages}`}
                </p>
              </div>
            </div>

            {/* Action Toolbar */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Multi-Page Navigation Slider */}
              {totalPages > 1 ? (
                <div className="flex items-center bg-indigo-950/60 border border-indigo-500/40 rounded-xl p-0.5">
                  <button
                    disabled={activePageIndex === 0}
                    onClick={() => setActivePageIndex((p) => p - 1)}
                    className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Previous Page (← Key)"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-[11px] font-mono font-bold text-indigo-300 px-2 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5" />
                    <span>{activePageIndex + 1}/{totalPages}</span>
                  </span>
                  <button
                    disabled={activePageIndex === totalPages - 1}
                    onClick={() => setActivePageIndex((p) => p + 1)}
                    className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Next Page (→ Key)"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              ) : subjectPapers.length > 1 ? (
                <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5">
                  <button
                    disabled={!hasPrevPaper}
                    onClick={handlePrev}
                    className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Previous Paper (← Key)"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-[10px] font-mono text-slate-400 px-1">
                    {currentPaperIndex + 1}/{subjectPapers.length}
                  </span>
                  <button
                    disabled={!hasNextPaper}
                    onClick={handleNext}
                    className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Next Paper (→ Key)"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              ) : null}

              {/* Zoom & Rotate controls */}
              <div className="hidden sm:flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5 gap-0.5">
                <button
                  onClick={handleZoomOut}
                  className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg transition-colors"
                  title="Zoom Out (-)"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-mono text-slate-400 px-1 min-w-[2.5rem] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={handleZoomIn}
                  className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg transition-colors"
                  title="Zoom In (+)"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleRotate}
                  className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg transition-colors"
                  title="Rotate 90° (R)"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* 1-Click Print Button */}
              <Button
                variant="outline"
                size="icon"
                onClick={handlePrintPaper}
                title="Print All Pages (P / Ctrl+P)"
                className="text-slate-300"
              >
                <Printer className="w-4 h-4" />
              </Button>

              {/* Practiced Toggle */}
              <Button
                variant={isPracticed ? 'primary' : 'outline'}
                size="sm"
                onClick={handleTogglePracticed}
                className={`text-xs px-2.5 py-1.5 hidden sm:inline-flex ${
                  isPracticed ? 'bg-emerald-600 hover:bg-emerald-500 border-emerald-500 text-white' : ''
                }`}
                title="Mark paper as solved"
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                <span>{isPracticed ? 'Practiced' : 'Mark Solved'}</span>
              </Button>

              {/* Notes Drawer Toggle */}
              <Button
                variant={showNotesDrawer ? 'primary' : 'outline'}
                size="icon"
                onClick={() => setShowNotesDrawer(!showNotesDrawer)}
                title="Personal Study Notes"
                className="text-slate-300"
              >
                <NotebookPen className="w-4 h-4" />
              </Button>

              {/* QR Code Share */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowQRModal(true)}
                title="QR Code Share"
                className="text-slate-300"
              >
                <QrCode className="w-4 h-4" />
              </Button>

              {/* Bookmark Button */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => toggleBookmark(paper.id)}
                title={isBookmarked ? 'Remove saved' : 'Save Paper'}
                className="text-slate-300"
              >
                <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-amber-400 text-amber-400' : ''}`} />
              </Button>

              {/* Fullscreen Toggle */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsFullscreen(!isFullscreen)}
                title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                className="text-slate-300 hidden md:inline-flex"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>

              {/* Download Button */}
              <Button
                variant="primary"
                size="sm"
                onClick={handleDownload}
                className="text-xs px-3 py-1.5 shadow-md bg-indigo-600 hover:bg-indigo-500 border-indigo-500 text-white"
              >
                <Download className="w-3.5 h-3.5 mr-1" />
                <span className="hidden sm:inline">Download</span>
              </Button>

              {/* Close Modal */}
              <Button
                variant="ghost"
                size="icon"
                onClick={closeViewer}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden relative">
            {/* Document Canvas Viewer */}
            <div className="flex-1 bg-slate-950/95 relative overflow-auto flex flex-col items-center justify-center p-3 sm:p-6 touch-pan-x touch-pan-y">
              <div
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transformOrigin: 'center center',
                  transition: 'transform 0.2s ease-out',
                }}
                className="max-w-full max-h-full flex items-center justify-center shadow-2xl rounded-lg select-none"
              >
                {currentImageSrc ? (
                  <img
                    src={currentImageSrc}
                    alt={`${paper.file_name} - Page ${activePageIndex + 1}`}
                    className="max-w-full max-h-[68vh] object-contain rounded-md select-none bg-white shadow-2xl"
                    draggable={false}
                  />
                ) : (
                  <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl text-center max-w-sm">
                    <FileText className="w-12 h-12 mx-auto text-indigo-400 mb-3" />
                    <h4 className="text-sm font-semibold text-slate-100">{paper.file_name}</h4>
                    <p className="text-xs text-slate-400 mt-1 mb-4">
                      PDF Document ({formatBytes(paper.file_size)})
                    </p>
                    <Button variant="primary" size="sm" onClick={handleDownload}>
                      <Download className="w-3.5 h-3.5 mr-1.5" />
                      Download to View
                    </Button>
                  </div>
                )}
              </div>

              {/* Multi-Page Quick Thumbnail Pill Strip at Bottom */}
              {totalPages > 1 && (
                <div className="mt-3 flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 p-1.5 rounded-2xl backdrop-blur-md shadow-xl z-20">
                  {paperPages.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActivePageIndex(idx)}
                      className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all ${
                        activePageIndex === idx
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/40 scale-105'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      Page {idx + 1}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Side: Specifications OR Personal Study Notes Drawer */}
            <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-slate-800 bg-slate-900/95 p-4 sm:p-5 overflow-y-auto space-y-4">
              {showNotesDrawer ? (
                /* Personal Study Notes Panel */
                <div className="space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                      <NotebookPen className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Personal Study Notes</span>
                    </h4>
                    <button
                      onClick={() => setShowNotesDrawer(false)}
                      className="text-slate-500 hover:text-slate-300 text-xs"
                    >
                      Close
                    </button>
                  </div>
                  <form onSubmit={handleSaveNote} className="space-y-3">
                    <textarea
                      rows={8}
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="Write private notes on key questions, tricks, formulas, or tricky sub-questions to review before the exam..."
                      className="w-full bg-slate-950/90 text-slate-200 placeholder-slate-500 text-xs rounded-xl border border-slate-700/80 p-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 leading-relaxed"
                    />
                    <Button type="submit" variant="primary" size="sm" className="w-full text-xs">
                      Save Notes Locally
                    </Button>
                  </form>
                </div>
              ) : (
                /* Standard Specs Panel */
                <>
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                      Paper Specifications
                    </h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-slate-800/80">
                        <span className="text-slate-400">Department / Domain</span>
                        <span className="font-semibold text-indigo-300">{paper.department_code || 'General'}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-800/80">
                        <span className="text-slate-400">Placement</span>
                        <span className="font-semibold text-slate-200">
                          {paper.year_name} • {paper.semester_name}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-800/80">
                        <span className="text-slate-400">Course Code</span>
                        <span className="font-mono font-bold text-indigo-400">{paper.course_code}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-800/80">
                        <span className="text-slate-400">Exam Type</span>
                        <span className={`px-2 py-0.5 rounded-md border text-[10px] font-semibold ${paper.badge_color}`}>
                          {paper.exam_type_name}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-800/80">
                        <span className="text-slate-400">Total Pages</span>
                        <span className="font-semibold text-indigo-400 font-mono">
                          {totalPages} {totalPages === 1 ? 'Page' : 'Pages'}
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-800/80">
                        <span className="text-slate-400">Session Year</span>
                        <span className="font-semibold text-slate-200">{paper.session_year}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-800/80">
                        <span className="text-slate-400">File Size</span>
                        <span className="text-slate-200 font-mono">{formatBytes(paper.file_size)}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-800/80">
                        <span className="text-slate-400">Downloads</span>
                        <span className="font-semibold text-emerald-400 font-mono">
                          {paper.download_count} times
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Trust & Verified Stamp */}
                  <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-3 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Verified Question Bank</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Original examination document verified by academic moderators.
                    </p>
                  </div>

                  {/* Quick Actions */}
                  <div className="space-y-2 pt-1">
                    <Button
                      variant="primary"
                      size="md"
                      onClick={handleDownload}
                      className="w-full text-xs shadow-lg shadow-indigo-600/30 bg-indigo-600 hover:bg-indigo-500 border-indigo-500"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Page {activePageIndex + 1}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportPdf}
                      isLoading={isExportingPdf}
                      className="w-full text-xs text-indigo-300 border-indigo-500/40 hover:bg-indigo-500/10"
                    >
                      <FileDown className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
                      Export Merged PDF Booklet
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrintPaper}
                      className="w-full text-xs text-slate-300"
                    >
                      <Printer className="w-3.5 h-3.5 mr-1.5" />
                      Print All {totalPages} Page(s)
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowQRModal(true)}
                      className="w-full text-xs text-slate-300"
                    >
                      <QrCode className="w-3.5 h-3.5 mr-1.5" />
                      Generate QR Code
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Sharing Dialog */}
      <QRCodeModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        title={`${paper.course_code} — ${paper.exam_type_name}`}
        subtitle={`${paper.subject_name} (${paper.session_year})`}
        url={`${window.location.origin}/#${paper.id}`}
      />

      {/* Live Fast Download Progress Stream Dialog */}
      <DownloadProgressModal
        isOpen={showProgressModal}
        onClose={() => setShowProgressModal(false)}
        paper={paper}
      />
    </>
  );
};
