import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  FileText,
  Image as ImageIcon,
  AlertCircle,
  Calendar,
  ClipboardPaste,
  Sparkles,
  Plus,
  Trash2,
  Layers,
} from 'lucide-react';
import { QuestionPaper } from '../../types';
import { usePapers } from '../../context/PaperContext';
import { storageService } from '../../services/storage';
import { validateFileMagicBytes } from '../../services/security';
import { optimizeImageFile, enhanceImageContrast, formatBytes } from '../../services/imageOptimizer';
import { auditLogService } from '../../services/auditLog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Switch } from '../ui/Switch';
import { Dialog } from '../ui/Dialog';
import { showToast } from '../ui/Toast';
import { showSuccessAlert } from '../../services/alert';

export interface PaperUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  editPaper?: QuestionPaper | null;
  onSuccess: () => void;
}

interface PageItem {
  id: string;
  name: string;
  dataUrl: string;
  fileType: 'application/pdf' | 'image/jpeg' | 'image/png' | 'image/webp';
  size: number;
}

export const PaperUploadModal: React.FC<PaperUploadModalProps> = ({
  isOpen,
  onClose,
  editPaper,
  onSuccess,
}) => {
  const { subjects, examTypes, refreshData } = usePapers();

  // Form State
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedExamTypeId, setSelectedExamTypeId] = useState('');
  const [sessionYear, setSessionYear] = useState('2024-2025');
  const [visibility, setVisibility] = useState(true);
  const [hasSolution, setHasSolution] = useState(false);
  const [autoEnhance, setAutoEnhance] = useState(false);

  // Multi-Page State
  const [pages, setPages] = useState<PageItem[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Populate data when editing
  useEffect(() => {
    if (editPaper) {
      setSelectedSubjectId(editPaper.subject_id);
      setSelectedExamTypeId(editPaper.exam_type_id);
      setSessionYear(editPaper.session_year);
      setVisibility(editPaper.visibility === 1);
      setHasSolution(Boolean(editPaper.has_solution));

      // Build pages
      if (editPaper.pages && editPaper.pages.length > 0) {
        setPages(
          editPaper.pages.map((url, idx) => ({
            id: `p-${idx}`,
            name: `${editPaper.file_name} (Page ${idx + 1})`,
            dataUrl: url,
            fileType: editPaper.file_type,
            size: Math.round(editPaper.file_size / editPaper.pages!.length),
          }))
        );
      } else if (editPaper.file_data_url) {
        setPages([
          {
            id: 'p-0',
            name: editPaper.file_name,
            dataUrl: editPaper.file_data_url,
            fileType: editPaper.file_type,
            size: editPaper.file_size,
          },
        ]);
      } else {
        setPages([]);
      }
    } else {
      if (subjects.length > 0) setSelectedSubjectId(subjects[0].id);
      if (examTypes.length > 0) setSelectedExamTypeId(examTypes[0].id);
      setSessionYear('2024-2025');
      setVisibility(true);
      setHasSolution(false);
      setPages([]);
    }
    setError(null);
  }, [editPaper, isOpen, subjects, examTypes]);

  // Support direct Clipboard Paste (Ctrl+V) for multiple sequential pages
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      if (!isOpen) return;
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1 || items[i].type === 'application/pdf') {
          const pastedFile = items[i].getAsFile();
          if (pastedFile) {
            e.preventDefault();
            await handleFileProcess([pastedFile]);
            showToast('Page Attached', `Pasted Page #${pages.length + 1} from clipboard.`);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen, pages.length, autoEnhance]);

  const handleFileProcess = async (selectedFiles: FileList | File[]) => {
    setError(null);
    setIsCompressing(true);

    try {
      const newPageItems: PageItem[] = [];

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const validation = await validateFileMagicBytes(file);
        if (!validation.valid) {
          setError(validation.error || 'Invalid file format. Please upload PDF or images (JPEG, PNG, WebP).');
          setIsCompressing(false);
          return;
        }

        const optimized = await optimizeImageFile(file);
        let finalDataUrl = optimized.dataUrl;

        if (autoEnhance && optimized.mimeType !== 'application/pdf') {
          finalDataUrl = await enhanceImageContrast(optimized.dataUrl);
        }

        newPageItems.push({
          id: `p-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
          name: file.name,
          dataUrl: finalDataUrl,
          fileType: optimized.mimeType as any,
          size: optimized.optimizedSize,
        });
      }

      setPages((prev) => [...prev, ...newPageItems]);
      showToast(
        newPageItems.length > 1 ? 'Pages Attached' : 'Page Attached',
        `Attached ${newPageItems.length} scan(s). Total: ${pages.length + newPageItems.length} page(s).`
      );
    } catch (err: any) {
      setError(err?.message || 'Error processing files.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleRemovePage = (index: number) => {
    setPages((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubjectId || !selectedExamTypeId || !sessionYear.trim()) {
      setError('Please fill in all required metadata fields.');
      return;
    }

    if (pages.length === 0) {
      setError('Please upload or paste at least 1 question paper page.');
      return;
    }

    setIsSaving(true);
    try {
      const targetSubj = subjects.find((s) => s.id === selectedSubjectId);
      const totalSize = pages.reduce((acc, p) => acc + p.size, 0);
      const primaryPage = pages[0];
      const pageUrls = pages.map((p) => p.dataUrl);

      if (editPaper) {
        storageService.updatePaper(editPaper.id, {
          subject_id: selectedSubjectId,
          exam_type_id: selectedExamTypeId,
          session_year: sessionYear.trim(),
          visibility: visibility ? 1 : 0,
          has_solution: hasSolution,
          file_name: editPaper.file_name,
          file_type: primaryPage.fileType,
          file_size: totalSize,
          file_data_url: primaryPage.dataUrl,
          pages: pageUrls,
        });
        auditLogService.log(
          'Update Paper',
          `Updated ${targetSubj?.code || 'Paper'} (${sessionYear}) - ${pages.length} page(s)`,
          'info'
        );
        showSuccessAlert('Paper Updated', `Question paper updated with ${pages.length} page(s).`);
      } else {
        storageService.addPaper({
          subject_id: selectedSubjectId,
          exam_type_id: selectedExamTypeId,
          session_year: sessionYear.trim(),
          file_name: `${targetSubj?.code || 'CSE'}_${sessionYear}_Paper.jpg`,
          file_type: primaryPage.fileType,
          file_size: totalSize,
          file_data_url: primaryPage.dataUrl,
          pages: pageUrls,
          has_solution: hasSolution,
          visibility: visibility ? 1 : 0,
        });
        auditLogService.log(
          'Upload Paper',
          `Uploaded ${targetSubj?.code || 'Paper'} (${sessionYear}) - ${pages.length} page(s)`,
          'info'
        );
        showSuccessAlert(
          'Paper Uploaded',
          `Added ${targetSubj?.code || 'paper'} with ${pages.length} page(s) to archive.`
        );
      }

      refreshData();
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save question paper');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={editPaper ? 'Edit Question Paper' : 'Upload Question Paper (Multi-Page Supported)'}
      description="Upload 1, 2, 3 or more pages for this exam paper. All pages will be bundled together."
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. Multi-Page Dropzone & Direct Paste */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>Exam Paper Pages ({pages.length} Attached)</span>
            </label>
            <span className="text-[11px] text-indigo-400 font-semibold flex items-center gap-1">
              <ClipboardPaste className="w-3.5 h-3.5" />
              <span>Paste Ctrl+V for Page 1, 2, 3</span>
            </span>
          </div>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                handleFileProcess(e.dataTransfer.files);
              }
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
              pages.length > 0
                ? 'border-indigo-500/60 bg-indigo-500/5'
                : 'border-slate-700/80 hover:border-indigo-500/50 bg-slate-950/40 hover:bg-slate-900/60'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,image/jpeg,image/png,image/webp"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFileProcess(e.target.files);
                }
              }}
              className="hidden"
            />

            {isCompressing ? (
              <div className="py-4 space-y-2">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-indigo-300 font-semibold">Optimizing and attaching scan pages...</p>
              </div>
            ) : pages.length > 0 ? (
              <div className="space-y-3">
                {/* Thumbnail Strip Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 text-left">
                  {pages.map((p, idx) => (
                    <div
                      key={p.id}
                      onClick={(e) => e.stopPropagation()}
                      className="relative group rounded-xl bg-slate-900 border border-slate-700 overflow-hidden shadow-lg p-1.5"
                    >
                      <div className="relative aspect-[3/4] rounded-lg bg-slate-950 flex items-center justify-center overflow-hidden">
                        {p.fileType === 'application/pdf' ? (
                          <FileText className="w-8 h-8 text-rose-400" />
                        ) : (
                          <img
                            src={p.dataUrl}
                            alt={`Page ${idx + 1}`}
                            className="w-full h-full object-cover rounded"
                          />
                        )}
                        <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-slate-950/80 text-indigo-300 font-mono font-bold text-[10px] border border-slate-700">
                          Page {idx + 1}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-1.5 px-1">
                        <span className="text-[10px] text-slate-400 font-mono">
                          {formatBytes(p.size)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemovePage(idx)}
                          className="text-slate-400 hover:text-rose-400 transition-colors p-1"
                          title="Remove Page"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Add More Pages Box */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="aspect-[3/4] rounded-xl border-2 border-dashed border-slate-700 hover:border-indigo-500 flex flex-col items-center justify-center p-3 text-center cursor-pointer hover:bg-slate-900/60 transition-all text-slate-400 hover:text-indigo-300"
                  >
                    <Plus className="w-6 h-6 mb-1" />
                    <span className="text-[11px] font-bold">+ Add Page</span>
                    <span className="text-[9px] text-slate-500">or Ctrl+V</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 text-center">
                  Total {pages.length} page(s) attached • Combined size: {formatBytes(pages.reduce((a, b) => a + b.size, 0))}
                </p>
              </div>
            ) : (
              <div className="space-y-2 py-2">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="text-xs text-slate-300">
                  <span className="font-bold text-indigo-400">Click to select files</span> (select 2–3 pages together), or press <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-200 font-mono">Ctrl+V</kbd>
                </div>
                <p className="text-[11px] text-slate-500">
                  You can upload multiple page scans for a single question paper
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 2. Enhancements & Solution Toggle */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
            <input
              type="checkbox"
              checked={autoEnhance}
              onChange={(e) => setAutoEnhance(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500"
            />
            <div className="text-xs">
              <span className="font-bold text-slate-200 block flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Auto-Enhance Contrast
              </span>
              <span className="text-[10px] text-slate-400">Boost text sharpness on camera scans</span>
            </div>
          </label>

          <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
            <input
              type="checkbox"
              checked={hasSolution}
              onChange={(e) => setHasSolution(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-emerald-600 focus:ring-emerald-500"
            />
            <div className="text-xs">
              <span className="font-bold text-slate-200 block">
                Includes Solution / Notes
              </span>
              <span className="text-[10px] text-slate-400">Attaches verified solution badge</span>
            </div>
          </label>
        </div>

        {/* 3. Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Select
              label="Subject / Course"
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              required
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.code} — {s.name}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Select
              label="Exam Type"
              value={selectedExamTypeId}
              onChange={(e) => setSelectedExamTypeId(e.target.value)}
              required
            >
              {examTypes.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} ({e.code})
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Academic Session Year
            </label>
            <Input
              icon={<Calendar className="w-4 h-4" />}
              type="text"
              value={sessionYear}
              onChange={(e) => setSessionYear(e.target.value)}
              placeholder="e.g. 2024-2025"
              required
            />
          </div>
        </div>

        {/* 4. Visibility Toggle */}
        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-200 block">
              Public Visibility
            </span>
            <span className="text-[11px] text-slate-400 block">
              {visibility
                ? 'Visible to all students in public search and directory'
                : 'Hidden (only visible to admin staff)'}
            </span>
          </div>
          <Switch checked={visibility} onChange={setVisibility} />
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <Button type="button" variant="outline" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSaving}
            className="shadow-lg shadow-indigo-600/25"
          >
            {editPaper ? 'Save Changes' : `Upload ${pages.length > 0 ? `${pages.length} Page(s)` : 'Paper'}`}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
