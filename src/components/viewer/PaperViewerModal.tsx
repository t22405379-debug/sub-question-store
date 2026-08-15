import React, { useState, useEffect, useRef } from 'react';
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
  Sparkles,
  Bot,
} from 'lucide-react';
import { usePapers } from '../../context/PaperContext';
import { studyTrackerService } from '../../services/studyTracker';
import { exportPaperToPdf } from '../../services/pdfExporter';
import { Button } from '../ui/Button';
import { formatBytes } from '../../services/imageOptimizer';
import { QRCodeModal } from '../ui/QRCodeModal';
import { DownloadProgressModal } from '../ui/DownloadProgressModal';
import { AITutorModal } from './AITutorModal';
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
  const [showAIModal, setShowAIModal] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);

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

  const handleZoomIn = () => setZoom((z) => Math.min(Number((z + 0.25).toFixed(2)), 5.0));
  const handleZoomOut = () => setZoom((z) => Math.max(Number((z - 0.25).toFixed(2)), 0.4));
  const handleResetZoom = () => setZoom(1.0);
  const handleRotate = () => setRotation((r) => (r + 90) % 360);

  // 100% Reliable Print Engine (Zero Pop-Up Blockers)
  const handlePrintPaper = () => {
    if (!paper) return;

    // Remove any previously created print frames
    const oldFrame = document.getElementById('paper-print-frame');
    if (oldFrame) oldFrame.remove();

    const iframe = document.createElement('iframe');
    iframe.id = 'paper-print-frame';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';

    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    const pagesHtml = paperPages
      .map(
        (src, idx) => `
        <div class="print-page">
          <div class="print-header">
            <span class="course-title">${paper.course_code}: ${paper.subject_name || 'Question Paper'}</span>
            <span class="exam-meta">${paper.exam_type_name || 'Exam'} (${paper.session_year}) • Page ${idx + 1} of ${paperPages.length}</span>
          </div>
          <div class="img-box">
            <img src="${src}" alt="Page ${idx + 1}" />
          </div>
        </div>
      `
      )
      .join('');

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${paper.course_code} - ${paper.exam_type_name || 'Exam'} (${paper.session_year})</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 8mm;
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              background: #ffffff;
              color: #111827;
            }
            .print-page {
              page-break-after: always;
              height: 100vh;
              display: flex;
              flex-direction: column;
              padding: 4mm;
            }
            .print-page:last-child {
              page-break-after: avoid;
            }
            .print-header {
              border-bottom: 2px solid #1e293b;
              padding-bottom: 6px;
              margin-bottom: 10px;
              display: flex;
              justify-content: space-between;
              font-size: 13px;
              font-weight: 700;
              color: #0f172a;
            }
            .course-title {
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .exam-meta {
              color: #475569;
            }
            .img-box {
              flex: 1;
              display: flex;
              align-items: center;
              justify-content: center;
              overflow: hidden;
            }
            img {
              max-width: 100%;
              max-height: 90vh;
              object-fit: contain;
            }
          </style>
        </head>
        <body>
          ${pagesHtml}
        </body>
      </html>
    `);
    doc.close();

    // Ensure all images are fully loaded before calling window.print
    const images = doc.querySelectorAll('img');
    let loaded = 0;
    const total = images.length;

    const doPrint = () => {
      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (e) {
          console.error('Print trigger error:', e);
        }
      }, 300);
    };

    if (total === 0) {
      doPrint();
    } else {
      images.forEach((img) => {
        if (img.complete) {
          loaded++;
          if (loaded === total) doPrint();
        } else {
          img.onload = () => {
            loaded++;
            if (loaded === total) doPrint();
          };
          img.onerror = () => {
            loaded++;
            if (loaded === total) doPrint();
          };
        }
      });
    }
  };

  // Keyboard Shortcuts (Ctrl+Plus / Ctrl+Minus / Ctrl+0 / +, -, 0, Arrow Left/Right, R, D, P, Esc)
  useEffect(() => {
    if (!paper) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['TEXTAREA', 'INPUT'].includes((e.target as HTMLElement)?.tagName)) return;

      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      // Zoom In: '+' or '=' with or without Ctrl
      if (e.key === '=' || e.key === '+') {
        e.preventDefault();
        handleZoomIn();
      }
      // Zoom Out: '-' or '_' with or without Ctrl
      else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        handleZoomOut();
      }
      // Reset Zoom: '0' with or without Ctrl
      else if (e.key === '0') {
        e.preventDefault();
        handleResetZoom();
      }
      // Print: 'p' or 'P' with or without Ctrl
      else if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        handlePrintPaper();
      }
      // Download: 'd' or 'D' with or without Ctrl
      else if (e.key === 'd' || e.key === 'D') {
        if (!isCtrlOrCmd) {
          handleDownload();
        }
      }
      // Rotate: 'r' or 'R'
      else if ((e.key === 'r' || e.key === 'R') && !isCtrlOrCmd) {
        e.preventDefault();
        handleRotate();
      }
      // Navigation: Arrow Left / Right
      else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      }
      // Close: Escape
      else if (e.key === 'Escape') {
        e.preventDefault();
        closeViewer();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [paper?.id, activePageIndex, totalPages, hasPrevPaper, hasNextPaper, paperPages]);

  // Ctrl + Mouse Wheel (or Pinch-to-zoom) Support on Image Canvas
  useEffect(() => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        if (e.deltaY < 0) {
          // Scrolling up -> Zoom in
          setZoom((z) => Math.min(Number((z + 0.15).toFixed(2)), 5.0));
        } else {
          // Scrolling down -> Zoom out
          setZoom((z) => Math.max(Number((z - 0.15).toFixed(2)), 0.4));
        }
      }
    };

    canvasEl.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvasEl.removeEventListener('wheel', handleWheel);
  }, []);

  if (!paper) return null;

  const isBookmarked = bookmarks.includes(paper.id);

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
          <div className="flex items-center justify-between px-3 sm:px-6 py-2 sm:py-3 border-b border-slate-800 bg-slate-950/90 gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-500/15 px-2 py-0.5 rounded border border-indigo-500/30 shrink-0">
                {paper.course_code}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-100 truncate">{paper.subject_name}</h3>
                  {paper.has_solution && (
                    <span className="hidden sm:inline-flex px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold shrink-0">
                      ✓ Solution
                    </span>
                  )}
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">
                  {paper.exam_type_name} • {paper.session_year}
                </p>
              </div>
            </div>

            {/* Action Toolbar */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {/* Multi-Page Navigation Slider */}
              {totalPages > 1 ? (
                <div className="flex items-center bg-indigo-950/70 border border-indigo-500/40 rounded-xl p-0.5 shadow-sm">
                  <button
                    disabled={activePageIndex === 0}
                    onClick={() => setActivePageIndex((p) => p - 1)}
                    className="p-1 sm:p-1.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Previous Page (← Key)"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                  <span className="text-[10px] sm:text-[11px] font-mono font-bold text-indigo-300 px-1.5 sm:px-2 flex items-center gap-0.5 sm:gap-1">
                    <Layers className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <span>
                      {activePageIndex + 1}/{totalPages}
                    </span>
                  </span>
                  <button
                    disabled={activePageIndex === totalPages - 1}
                    onClick={() => setActivePageIndex((p) => p + 1)}
                    className="p-1 sm:p-1.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Next Page (→ Key)"
                  >
                    <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                </div>
              ) : subjectPapers.length > 1 ? (
                <div className="hidden sm:flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5">
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

              {/* Desktop Zoom & Rotate controls */}
              <div className="hidden md:flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5 gap-0.5">
                <button
                  onClick={handleZoomOut}
                  className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg transition-colors"
                  title="Zoom Out (Ctrl + Minus or -)"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleResetZoom}
                  className="text-[11px] font-mono text-slate-400 hover:text-indigo-300 px-1.5 py-1 min-w-[2.8rem] text-center rounded transition-colors"
                  title="Click to reset zoom (Ctrl + 0)"
                >
                  {Math.round(zoom * 100)}%
                </button>
                <button
                  onClick={handleZoomIn}
                  className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg transition-colors"
                  title="Zoom In (Ctrl + Plus or +)"
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

              {/* Desktop-only Clean Print Button */}
              <Button
                variant="outline"
                size="icon"
                onClick={handlePrintPaper}
                title="Print All Pages (P / Ctrl+P)"
                className="text-slate-300 hover:text-indigo-300 hover:border-indigo-500/50 hidden md:inline-flex"
              >
                <Printer className="w-4 h-4" />
              </Button>

              {/* Desktop AI Tutor button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAIModal(true)}
                className="text-xs px-2.5 py-1.5 text-amber-300 border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 font-bold hidden sm:inline-flex shadow-sm"
                title="Ask Cloudflare AI for step-by-step solution"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-400" />
                <span>AI Tutor</span>
              </Button>

              {/* Bookmark Button */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => toggleBookmark(paper.id)}
                title={isBookmarked ? 'Remove saved' : 'Save Paper'}
                className="text-slate-300 h-8 w-8 sm:h-9 sm:w-9"
              >
                <Bookmark className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isBookmarked ? 'fill-amber-400 text-amber-400' : ''}`} />
              </Button>

              {/* Download Button on desktop */}
              <Button
                variant="primary"
                size="sm"
                onClick={handleDownload}
                className="text-xs px-2.5 sm:px-3 py-1.5 shadow-md bg-indigo-600 hover:bg-indigo-500 border-indigo-500 text-white font-bold hidden sm:inline-flex"
              >
                <Download className="w-3.5 h-3.5 mr-1" />
                <span>Download</span>
              </Button>

              {/* Close Modal */}
              <Button
                variant="ghost"
                size="icon"
                onClick={closeViewer}
                className="text-slate-400 hover:text-white h-8 w-8 sm:h-9 sm:w-9"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden relative">
            {/* Document Canvas Viewer */}
            <div
              ref={canvasRef}
              className="flex-1 bg-slate-950/95 relative overflow-auto flex flex-col items-center justify-center p-3 sm:p-6 touch-pan-x touch-pan-y"
            >
              <div
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transformOrigin: 'center center',
                  transition: 'transform 0.15s ease-out',
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
                   {/* Floating Side Nav Arrows for Mobile & Touch */}
              {totalPages > 1 && (
                <>
                  <button
                    disabled={activePageIndex === 0}
                    onClick={() => setActivePageIndex((p) => p - 1)}
                    className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-2 sm:p-2.5 rounded-full bg-slate-900/85 hover:bg-indigo-600 border border-slate-700/80 text-white disabled:opacity-0 disabled:pointer-events-none transition-all shadow-2xl backdrop-blur-md z-30"
                    title="Previous Page"
                  >
                    <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <button
                    disabled={activePageIndex === totalPages - 1}
                    onClick={() => setActivePageIndex((p) => p + 1)}
                    className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2 sm:p-2.5 rounded-full bg-slate-900/85 hover:bg-indigo-600 border border-slate-700/80 text-white disabled:opacity-0 disabled:pointer-events-none transition-all shadow-2xl backdrop-blur-md z-30"
                    title="Next Page"
                  >
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </>
              )}

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
                      placeholder="Write private notes on key questions, formulas, or tricky sub-questions to review before the exam..."
                      className="w-full bg-slate-950/90 text-slate-200 placeholder-slate-500 text-xs rounded-xl border border-slate-700/80 p-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 leading-relaxed"
                    />
                    <Button type="submit" variant="primary" size="sm" className="w-full text-xs">
                      Save Note
                    </Button>
                  </form>
                </div>
              ) : (
                <>
                  {/* Paper Specifications */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Paper Specifications
                    </h4>
                    <div className="divide-y divide-slate-800/80 text-xs space-y-2">
                      <div className="flex justify-between py-1.5">
                        <span className="text-slate-400">Department / Domain</span>
                        <span className="text-slate-200 font-medium">{paper.department_name || 'General'}</span>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span className="text-slate-400">Placement</span>
                        <span className="text-slate-200 font-medium">
                          {paper.year_name || 'General'} • {paper.semester_name || 'Semester'}
                        </span>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span className="text-slate-400">Course Code</span>
                        <span className="font-mono text-indigo-400 font-bold">{paper.course_code}</span>
                      </div>
                      <div className="flex justify-between py-1.5 items-center">
                        <span className="text-slate-400">Exam Type</span>
                        <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${paper.badge_color || 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'}`}>
                          {paper.exam_type_name}
                        </span>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span className="text-slate-400">Total Pages</span>
                        <span className="text-indigo-300 font-bold font-mono">{totalPages} Page{totalPages > 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span className="text-slate-400">Session Year</span>
                        <span className="text-slate-200 font-mono">{paper.session_year}</span>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span className="text-slate-400">File Size</span>
                        <span className="text-slate-200 font-mono">{formatBytes(paper.file_size)}</span>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span className="text-slate-400">Downloads</span>
                        <span className="text-emerald-400 font-mono font-medium">
                          {paper.download_count || 0} times
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

                  {/* Quick Action Tools */}
                  <div className="space-y-2 pt-1">
                    {/* Primary Actions Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Button
                        variant="primary"
                        size="md"
                        onClick={handleDownload}
                        className="w-full text-xs font-bold shadow-lg shadow-indigo-600/30 bg-indigo-600 hover:bg-indigo-500 border-indigo-500 py-2.5 flex items-center justify-center"
                      >
                        <Download className="w-4 h-4 mr-1.5" />
                        Download {totalPages > 1 ? `Page ${activePageIndex + 1}` : 'Paper'}
                      </Button>

                      <Button
                        variant="outline"
                        size="md"
                        onClick={() => setShowAIModal(true)}
                        className="w-full text-xs text-amber-300 border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 font-bold py-2.5 flex items-center justify-center"
                      >
                        <Sparkles className="w-4 h-4 mr-1.5 text-amber-400" />
                        Ask AI Tutor
                      </Button>
                    </div>

                    {/* Secondary 2x2 Grid for Mobile & Desktop */}
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleExportPdf}
                        isLoading={isExportingPdf}
                        className="text-xs text-indigo-300 border-slate-700/80 bg-slate-900/60 hover:bg-indigo-500/10 py-2 flex items-center justify-center"
                      >
                        <FileDown className="w-3.5 h-3.5 mr-1 text-indigo-400" />
                        Merged PDF
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePrintPaper}
                        className="text-xs text-emerald-300 border-slate-700/80 bg-slate-900/60 hover:bg-slate-800 py-2 flex items-center justify-center"
                      >
                        <Printer className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                        Clean Print
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowQRModal(true)}
                        className="text-xs text-slate-300 border-slate-700/80 bg-slate-900/60 hover:bg-slate-800 py-2 flex items-center justify-center"
                      >
                        <QrCode className="w-3.5 h-3.5 mr-1 text-cyan-400" />
                        QR Code
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowNotesDrawer(true)}
                        className="text-xs text-slate-300 border-slate-700/80 bg-slate-900/60 hover:bg-slate-800 py-2 flex items-center justify-center"
                      >
                        <NotebookPen className="w-3.5 h-3.5 mr-1 text-violet-400" />
                        Study Notes
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Real Cloudflare AI Tutor Dialog */}
      <AITutorModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        paper={paper}
        imageSrc={currentImageSrc || undefined}
      />

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
