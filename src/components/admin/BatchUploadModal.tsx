import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  Trash2,
  ClipboardPaste,
} from 'lucide-react';
import { usePapers } from '../../context/PaperContext';
import { storageService } from '../../services/storage';
import { validateFileMagicBytes } from '../../services/security';
import { optimizeImageFile, formatBytes } from '../../services/imageOptimizer';
import { Button } from '../ui/Button';
import { Dialog } from '../ui/Dialog';
import { showToast } from '../ui/Toast';

interface BatchItem {
  id: string;
  file: File;
  dataUrl: string;
  fileType: 'application/pdf' | 'image/jpeg' | 'image/png' | 'image/webp';
  fileSize: number;
  subjectId: string;
  examTypeId: string;
  sessionYear: string;
  status: 'ready' | 'processing' | 'done' | 'error';
  errorMsg?: string;
}

interface BatchUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const BatchUploadModal: React.FC<BatchUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { subjects, examTypes, refreshData } = usePapers();
  const availableSubjects = subjects.length > 0 ? subjects : storageService.getSubjects();
  const availableExamTypes = examTypes.length > 0 ? examTypes : storageService.getExamTypes();

  const [items, setItems] = useState<BatchItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-refresh taxonomy on modal open
  useEffect(() => {
    if (isOpen) {
      refreshData();
    }
  }, [isOpen, refreshData]);

  // Clipboard Paste Support (Ctrl+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!isOpen) return;
      const clipboardItems = e.clipboardData?.items;
      if (!clipboardItems) return;

      const pastedFiles: File[] = [];
      for (let i = 0; i < clipboardItems.length; i++) {
        if (clipboardItems[i].type.indexOf('image') !== -1 || clipboardItems[i].type === 'application/pdf') {
          const f = clipboardItems[i].getAsFile();
          if (f) pastedFiles.push(f);
        }
      }
      if (pastedFiles.length > 0) {
        e.preventDefault();
        handleFiles(pastedFiles);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen, subjects, examTypes]);

  // Smart Auto-Parser function
  const parseFilenameMetadata = (filename: string) => {
    const clean = filename.toLowerCase();

    // 1. Detect Subject
    let matchedSubjId = subjects[0]?.id || '';
    for (const subj of subjects) {
      const codeClean = subj.code.toLowerCase().replace(/\s+/g, '');
      const numCode = subj.code.replace(/[^0-9]/g, '');
      if (clean.includes(codeClean) || (numCode && clean.includes(numCode))) {
        matchedSubjId = subj.id;
        break;
      }
    }

    // 2. Detect Exam Type
    let matchedExamId = examTypes[0]?.id || '';
    if (clean.includes('mid')) {
      const found = examTypes.find((e) => e.code.toLowerCase().includes('mid') || e.name.toLowerCase().includes('mid'));
      if (found) matchedExamId = found.id;
    } else if (clean.includes('final')) {
      const found = examTypes.find((e) => e.code.toLowerCase().includes('fin') || e.name.toLowerCase().includes('fin'));
      if (found) matchedExamId = found.id;
    } else if (clean.includes('ct') || clean.includes('quiz') || clean.includes('test')) {
      const found = examTypes.find((e) => e.code.toLowerCase().includes('ct') || e.name.toLowerCase().includes('test'));
      if (found) matchedExamId = found.id;
    } else if (clean.includes('lab') || clean.includes('prac')) {
      const found = examTypes.find((e) => e.code.toLowerCase().includes('lab') || e.name.toLowerCase().includes('lab'));
      if (found) matchedExamId = found.id;
    }

    // 3. Detect Session Year
    let detectedSession = '2024-2025';
    const yearMatch = clean.match(/(20\d{2})[-_]?(20\d{2})?/);
    if (yearMatch) {
      if (yearMatch[2]) {
        detectedSession = `${yearMatch[1]}-${yearMatch[2]}`;
      } else {
        const y = parseInt(yearMatch[1]);
        detectedSession = `${y}-${y + 1}`;
      }
    }

    return { subjectId: matchedSubjId, examTypeId: matchedExamId, sessionYear: detectedSession };
  };

  const handleFiles = async (fileList: FileList | File[]) => {
    setIsProcessing(true);
    const newItems: BatchItem[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const f = fileList[i];
      try {
        const val = await validateFileMagicBytes(f);
        if (!val.valid) continue;

        const opt = await optimizeImageFile(f);
        const meta = parseFilenameMetadata(f.name);

        newItems.push({
          id: `${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
          file: f,
          dataUrl: opt.dataUrl,
          fileType: opt.mimeType as any,
          fileSize: opt.optimizedSize,
          subjectId: meta.subjectId,
          examTypeId: meta.examTypeId,
          sessionYear: meta.sessionYear,
          status: 'ready',
        });
      } catch (err: any) {
        console.error('Error processing batch file', f.name, err);
      }
    }

    setItems((prev) => [...prev, ...newItems]);
    setIsProcessing(false);
    showToast('Files Processed', `${newItems.length} files added to batch queue.`);
  };

  const handleItemChange = (id: string, field: keyof BatchItem, value: any) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleUploadAll = async () => {
    if (items.length === 0) return;
    setIsProcessing(true);

    let count = 0;
    for (const item of items) {
      try {
        storageService.addPaper({
          subject_id: item.subjectId,
          exam_type_id: item.examTypeId,
          session_year: item.sessionYear,
          file_name: item.file.name,
          file_type: item.fileType,
          file_size: item.fileSize,
          file_data_url: item.dataUrl,
          visibility: 1,
        });
        count++;
      } catch (e) {
        console.error(e);
      }
    }

    refreshData();
    setIsProcessing(false);
    onSuccess();
    onClose();
    setItems([]);
    showToast('Batch Upload Success', `Successfully added ${count} question papers to archive!`);
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Smart Multi-File Batch Uploader"
      description="Upload 10-20 papers at once (Drag, Drop, Browse, or Ctrl+V Paste)"
      maxWidth="4xl"
    >
      <div className="space-y-5">
        {/* Dropzone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
          }}
          className="border-2 border-dashed border-indigo-500/40 hover:border-indigo-500/80 bg-indigo-500/5 hover:bg-indigo-500/10 rounded-2xl p-6 text-center cursor-pointer transition-all"
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,image/jpeg,image/png,image/webp"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
            className="hidden"
          />
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-2">
            <Upload className="w-6 h-6" />
          </div>
          <p className="text-xs font-bold text-white">Click, drag &amp; drop, or press <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-200 font-mono">Ctrl+V</kbd> to paste</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Auto-detects course code, exam type &amp; year from file names (e.g. <code>CSE1101_Mid_2025.pdf</code>)
          </p>
        </div>

        {/* Batch Table */}
        {items.length > 0 && (
          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden max-h-80 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider sticky top-0">
                <tr>
                  <th className="px-4 py-3">File</th>
                  <th className="px-4 py-3">Detected Course</th>
                  <th className="px-4 py-3">Exam Type</th>
                  <th className="px-4 py-3">Session</th>
                  <th className="px-4 py-3 text-right">Remove</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 max-w-[180px]">
                        <span className="truncate font-semibold text-slate-200 block text-xs">
                          {item.file.name}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono shrink-0">
                          {formatBytes(item.fileSize)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={item.subjectId}
                        onChange={(e) => handleItemChange(item.id, 'subjectId', e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-indigo-300 font-mono max-w-[160px]"
                      >
                        {availableSubjects.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.code} ({s.name})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={item.examTypeId}
                        onChange={(e) => handleItemChange(item.id, 'examTypeId', e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200"
                      >
                        {availableExamTypes.map((e) => (
                          <option key={e.id} value={e.id}>
                            {e.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={item.sessionYear}
                        onChange={(e) => handleItemChange(item.id, 'sessionYear', e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200 w-24 font-mono"
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-slate-500 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <span className="text-xs text-slate-400 font-semibold">
            {items.length} {items.length === 1 ? 'file' : 'files'} in upload batch queue
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={items.length === 0}
              isLoading={isProcessing}
              onClick={handleUploadAll}
            >
              Upload All ({items.length})
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
};
