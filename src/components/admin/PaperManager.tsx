import React, { useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Search,
  FileText,
  Image as ImageIcon,
  CheckSquare,
  Square,
  ShieldCheck,
} from 'lucide-react';
import { QuestionPaper } from '../../types';
import { usePapers } from '../../context/PaperContext';
import { storageService } from '../../services/storage';
import { formatBytes } from '../../services/imageOptimizer';
import { auditLogService } from '../../services/auditLog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { PaperUploadModal } from './PaperUploadModal';
import { showToast } from '../ui/Toast';
import { showDeleteConfirmAlert, showSuccessAlert, showConfirmAlert } from '../../services/alert';

export const PaperManager: React.FC = () => {
  const { examTypes, refreshData, openViewer } = usePapers();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterExam, setFilterExam] = useState('');
  const [filterVisibility, setFilterVisibility] = useState<string>('all');

  // Modal States
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [editingPaper, setEditingPaper] = useState<QuestionPaper | null>(null);

  // Bulk Multi-Select State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Toggle Visibility
  const handleToggleVisibility = (paper: QuestionPaper) => {
    storageService.togglePaperVisibility(paper.id);
    refreshData();
    auditLogService.log('Visibility Change', `Toggled ${paper.course_code} visibility to ${paper.visibility === 1 ? 'hidden' : 'public'}`, 'info');
    showToast(
      paper.visibility === 1 ? 'Paper Hidden' : 'Paper Visible',
      `${paper.course_code} ${paper.exam_type_name} is now ${
        paper.visibility === 1 ? 'hidden from public view' : 'live in student explorer'
      }`
    );
  };

  // Delete Single Paper with SweetAlert2
  const handleDeletePaper = async (paper: QuestionPaper) => {
    const confirmed = await showDeleteConfirmAlert(
      `Question Paper (${paper.course_code} - ${paper.exam_type_name})`,
      `Are you sure you want to permanently delete "${paper.file_name}"? This will remove its metadata and purge the file from storage.`
    );

    if (confirmed) {
      storageService.deletePaper(paper.id);
      auditLogService.log('Delete Paper', `Permanently deleted ${paper.course_code} (${paper.file_name})`, 'warning');
      refreshData();
      showSuccessAlert('Paper Deleted', `${paper.course_code} ${paper.exam_type_name} has been removed.`);
    }
  };

  // Bulk Actions Handlers
  const handleSelectAll = (filteredPapers: QuestionPaper[]) => {
    if (selectedIds.length === filteredPapers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredPapers.map((p) => p.id));
    }
  };

  const handleToggleSelectId = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBulkPublish = () => {
    selectedIds.forEach((id) => {
      storageService.updatePaper(id, { visibility: 1 });
    });
    auditLogService.log('Bulk Publish', `Made ${selectedIds.length} question papers public`, 'info');
    refreshData();
    setSelectedIds([]);
    showSuccessAlert('Bulk Published', `${selectedIds.length} papers are now live for students.`);
  };

  const handleBulkHide = () => {
    selectedIds.forEach((id) => {
      storageService.updatePaper(id, { visibility: 0 });
    });
    auditLogService.log('Bulk Hide', `Hidden ${selectedIds.length} question papers from public view`, 'info');
    refreshData();
    setSelectedIds([]);
    showSuccessAlert('Bulk Hidden', `${selectedIds.length} papers moved to hidden draft mode.`);
  };

  const handleBulkDelete = async () => {
    const confirmed = await showConfirmAlert({
      title: `Delete ${selectedIds.length} Selected Papers?`,
      text: `Are you sure you want to permanently remove all ${selectedIds.length} selected question papers? This action cannot be undone.`,
      icon: 'warning',
      confirmButtonText: 'Yes, Delete Selected',
      isDestructive: true,
    });

    if (confirmed) {
      selectedIds.forEach((id) => storageService.deletePaper(id));
      auditLogService.log('Bulk Delete', `Deleted ${selectedIds.length} question papers`, 'danger');
      refreshData();
      setSelectedIds([]);
      showSuccessAlert('Bulk Deleted', `${selectedIds.length} papers permanently removed.`);
    }
  };

  // Filtered Papers (admin sees both visible and hidden)
  const allPapers = storageService.getPapers(true);

  const displayedPapers = allPapers.filter((p) => {
    if (filterExam && p.exam_type_id !== filterExam) return false;
    if (filterVisibility === 'visible' && p.visibility !== 1) return false;
    if (filterVisibility === 'hidden' && p.visibility !== 0) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        (p.course_code || '').toLowerCase().includes(q) ||
        (p.subject_name || '').toLowerCase().includes(q) ||
        (p.file_name || '').toLowerCase().includes(q) ||
        (p.session_year || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">Question Paper Archive</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage question papers, replace uploaded scans, toggle visibility, and monitor downloads
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setEditingPaper(null);
            setIsUploadOpen(true);
          }}
          className="text-xs shadow-md"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Upload Question Paper
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel rounded-2xl p-4 flex flex-col md:flex-row items-center gap-3">
        <div className="flex-1 w-full">
          <Input
            icon={<Search className="w-4 h-4" />}
            placeholder="Search papers by course code, subject, or filename..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={filterExam}
            onChange={(e) => setFilterExam(e.target.value)}
            className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Exam Types</option>
            {examTypes.map((e) => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>

          <select
            value={filterVisibility}
            onChange={(e) => setFilterVisibility(e.target.value)}
            className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="visible">Public Only</option>
            <option value="hidden">Hidden / Draft Only</option>
          </select>
        </div>
      </div>

      {/* Bulk Action Sticky Bar (Appears when items are selected) */}
      {selectedIds.length > 0 && (
        <div className="rounded-2xl p-3.5 bg-indigo-950/80 border border-indigo-500/40 shadow-xl flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2 text-xs text-indigo-200 font-bold">
            <CheckSquare className="w-4 h-4 text-indigo-400" />
            <span>{selectedIds.length} {selectedIds.length === 1 ? 'paper' : 'papers'} selected</span>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleBulkPublish} className="text-xs text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/10">
              <Eye className="w-3.5 h-3.5 mr-1" />
              Make Public
            </Button>
            <Button variant="outline" size="sm" onClick={handleBulkHide} className="text-xs text-slate-300 border-slate-700 hover:bg-slate-800">
              <EyeOff className="w-3.5 h-3.5 mr-1" />
              Hide / Draft
            </Button>
            <Button variant="destructive" size="sm" onClick={handleBulkDelete} className="text-xs">
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              Delete Selected
            </Button>
          </div>
        </div>
      )}

      {/* Papers Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={displayedPapers.length > 0 && selectedIds.length === displayedPapers.length}
                    onChange={() => handleSelectAll(displayedPapers)}
                    className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500"
                  />
                </th>
                <th className="px-4 py-3.5">Course Code</th>
                <th className="px-4 py-3.5">Subject &amp; File</th>
                <th className="px-4 py-3.5">Exam &amp; Session</th>
                <th className="px-4 py-3.5">File Size</th>
                <th className="px-4 py-3.5">Downloads</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {displayedPapers.length > 0 ? (
                displayedPapers.map((paper) => {
                  const isPdf = paper.file_type === 'application/pdf';
                  const isVisible = paper.visibility === 1;
                  const isSelected = selectedIds.includes(paper.id);

                  return (
                    <tr
                      key={paper.id}
                      className={`hover:bg-slate-800/40 transition-colors ${isSelected ? 'bg-indigo-950/20' : ''}`}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectId(paper.id)}
                          className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-indigo-500"
                        />
                      </td>

                      {/* Code */}
                      <td className="px-4 py-4 font-mono font-bold text-indigo-400">
                        {paper.course_code}
                      </td>

                      {/* Subject & File */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                            {isPdf ? <FileText className="w-4 h-4 text-rose-400" /> : <ImageIcon className="w-4 h-4 text-indigo-400" />}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-slate-100 block truncate max-w-xs">
                                {paper.subject_name}
                              </span>
                              {paper.has_solution && (
                                <span className="px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-bold shrink-0">
                                  Solution
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-500 font-mono block truncate max-w-xs">
                              {paper.file_name}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Exam & Session */}
                      <td className="px-5 py-4">
                        <div className="space-y-0.5">
                          <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border ${paper.badge_color}`}>
                            {paper.exam_type_name}
                          </span>
                          <span className="text-[11px] text-slate-400 block">
                            Session {paper.session_year}
                          </span>
                        </div>
                      </td>

                      {/* File Size */}
                      <td className="px-5 py-4 font-mono text-slate-400">
                        {formatBytes(paper.file_size)}
                      </td>

                      {/* Downloads */}
                      <td className="px-5 py-4 font-mono font-semibold text-emerald-400">
                        {paper.download_count}
                      </td>

                      {/* Status / Visibility */}
                      <td className="px-5 py-4">
                        <button
                          onClick={() => handleToggleVisibility(paper)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                            isVisible
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25'
                              : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                          }`}
                        >
                          {isVisible ? <Eye className="w-3 h-3 text-emerald-400" /> : <EyeOff className="w-3 h-3 text-slate-500" />}
                          <span>{isVisible ? 'Public' : 'Hidden'}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openViewer(paper)}
                            title="Preview Paper"
                            className="text-slate-400 hover:text-indigo-400"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingPaper(paper);
                              setIsUploadOpen(true);
                            }}
                            title="Edit Paper / Replace File"
                            className="text-slate-400 hover:text-indigo-400"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeletePaper(paper)}
                            title="Delete Paper"
                            className="text-slate-400 hover:text-rose-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-500">
                    No question papers found matching the filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload & Edit Modal */}
      <PaperUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        editPaper={editingPaper}
        onSuccess={refreshData}
      />
    </div>
  );
};
