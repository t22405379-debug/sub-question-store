import React, { useState, useRef } from 'react';
import {
  FileText,
  BookOpen,
  Download,
  EyeOff,
  Upload,
  Sparkles,
  Trash2,
  FolderUp,
  HardDriveDownload,
  HardDriveUpload,
  Search,
  X,
} from 'lucide-react';
import { usePapers } from '../../context/PaperContext';
import { storageService } from '../../services/storage';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Pagination } from '../ui/Pagination';
import { PaperUploadModal } from './PaperUploadModal';
import { BatchUploadModal } from './BatchUploadModal';
import { showToast } from '../ui/Toast';
import { showConfirmAlert, showSuccessAlert, showErrorAlert } from '../../services/alert';

interface AdminDashboardProps {
  onNavigateTab: (tab: 'papers' | 'subjects' | 'taxonomy' | 'analytics') => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigateTab }) => {
  const { getAnalytics, refreshData, openViewer, departments, years, semesters, examTypes, subjects, papers } = usePapers();
  
  const totalPapers = papers.length;
  const totalSubjects = subjects.length;
  const totalDownloads = papers.reduce((sum, p) => sum + (p.download_count || 0), 0);
  const hiddenPapers = papers.filter((p) => p.visibility === 0).length;

  const [dashboardSearch, setDashboardSearch] = useState('');
  const [dashboardPage, setDashboardPage] = useState(1);
  const [dashboardPageSize, setDashboardPageSize] = useState(20);

  const sortedPapers = [...papers].sort((a, b) => new Date(b.uploaded_at || 0).getTime() - new Date(a.uploaded_at || 0).getTime());

  const filteredDashboardPapers = sortedPapers.filter((p) => {
    if (!dashboardSearch.trim()) return true;
    const q = dashboardSearch.toLowerCase();
    return (
      (p.course_code || '').toLowerCase().includes(q) ||
      (p.subject_name || '').toLowerCase().includes(q) ||
      (p.exam_type_name || '').toLowerCase().includes(q) ||
      (p.session_year || '').toLowerCase().includes(q)
    );
  });

  const paginatedDashboardPapers = filteredDashboardPapers.slice(
    (dashboardPage - 1) * dashboardPageSize,
    dashboardPage * dashboardPageSize
  );

  const stats = {
    totalPapers,
    totalSubjects,
    totalDownloads,
    hiddenPapers,
    recentUploads: sortedPapers.slice(0, 6),
  };

  const [isSingleUploadOpen, setIsSingleUploadOpen] = useState(false);
  const [isBatchUploadOpen, setIsBatchUploadOpen] = useState(false);
  const restoreFileInputRef = useRef<HTMLInputElement>(null);

  // Backup Archive Database to JSON
  const handleExportBackup = () => {
    const backupData = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      departments,
      years,
      semesters,
      examTypes,
      subjects,
      papers,
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `question_archive_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showSuccessAlert('Backup Downloaded', 'Full archive database has been exported to JSON.');
  };

  // Restore Archive Database from JSON
  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.subjects && data.papers) {
          const confirmed = await showConfirmAlert({
            title: 'Restore Database Backup?',
            text: `This will replace your current archive with ${data.papers.length} question papers and ${data.subjects.length} subjects from the backup file.`,
            icon: 'warning',
            confirmButtonText: 'Restore Backup',
          });

          if (!confirmed) return;

          localStorage.setItem('cse_archive_departments_v3', JSON.stringify(data.departments || []));
          localStorage.setItem('cse_archive_years_v3', JSON.stringify(data.years || []));
          localStorage.setItem('cse_archive_semesters_v3', JSON.stringify(data.semesters || []));
          localStorage.setItem('cse_archive_exam_types_v3', JSON.stringify(data.examTypes || []));
          localStorage.setItem('cse_archive_subjects_v3', JSON.stringify(data.subjects || []));
          localStorage.setItem('cse_archive_papers_v3', JSON.stringify(data.papers || []));
          refreshData();
          showSuccessAlert('Database Restored', `Restored ${data.papers.length} papers & ${data.subjects.length} subjects.`);
        } else {
          showErrorAlert('Invalid Backup File', 'The selected JSON file does not match the archive database structure.');
        }
      } catch (err) {
        showErrorAlert('Restore Failed', 'Could not parse JSON backup file.');
      }
    };
    reader.readAsText(file);
  };

  const handleClearAll = async () => {
    const confirmed = await showConfirmAlert({
      title: 'Clear Entire Database?',
      text: 'Are you sure you want to delete all courses and question papers to start with a 100% clean empty archive?',
      icon: 'warning',
      confirmButtonText: 'Yes, Clear All',
      isDestructive: true,
    });

    if (confirmed) {
      storageService.clearAllData();
      fetch('/api/admin/clear-all', { method: 'POST' }).catch((e) => console.warn('D1 clear archive note:', e));
      refreshData();
      showSuccessAlert('Database Cleared', 'All courses and papers have been wiped to a clean slate.');
    }
  };

  const handleLoadSample = async () => {
    const confirmed = await showConfirmAlert({
      title: 'Load Starter Pack?',
      text: 'Would you like to populate the database with curriculum courses and sample test papers for quick demonstration?',
      icon: 'question',
      confirmButtonText: 'Load Starter Pack',
    });

    if (confirmed) {
      storageService.loadSampleDataPack();
      refreshData();
      showSuccessAlert('Starter Pack Loaded', 'Sample curriculum and question papers are now active.');
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Banner / Welcome */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 relative overflow-hidden border border-slate-700/80">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1 block">
              Administrative Suite
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Admin Control Center
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
              Upload, organize, and manage question papers across all years and terms. Everything is 100% dynamic with zero hardcoding.
            </p>
          </div>

          {/* Quick Action Group */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsBatchUploadOpen(true)}
              className="text-xs font-semibold text-indigo-300 border-indigo-500/40 hover:bg-indigo-500/10"
            >
              <FolderUp className="w-4 h-4 mr-1.5 text-indigo-400" />
              Batch Multi-Upload
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsSingleUploadOpen(true)}
              className="shadow-xl shadow-indigo-600/30 text-xs font-bold"
            >
              <Upload className="w-4 h-4 mr-1.5" />
              Upload Paper
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportBackup}
              title="Download backup JSON"
              className="text-xs text-slate-300"
            >
              <HardDriveDownload className="w-3.5 h-3.5 mr-1 text-emerald-400" />
              Backup
            </Button>

            <input
              ref={restoreFileInputRef}
              type="file"
              accept=".json"
              onChange={handleRestoreFile}
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => restoreFileInputRef.current?.click()}
              title="Restore from JSON"
              className="text-xs text-slate-300"
            >
              <HardDriveUpload className="w-3.5 h-3.5 mr-1 text-cyan-400" />
              Restore
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  const res = await fetch('/api/sync', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      departments: storageService.getDepartments(),
                      years: storageService.getYears(),
                      semesters: storageService.getSemesters(),
                      examTypes: storageService.getExamTypes(),
                      subjects: storageService.getSubjects(),
                      papers: storageService.getPapers(true),
                    }),
                  });
                  const json = await res.json();
                  if (json.success) {
                    showSuccessAlert(
                      'Cloudflare Synced (D1 & R2)!',
                      `All question papers and course taxonomies have been pushed to Cloudflare D1 SQL database and ${json.r2UploadedCount !== undefined ? `${json.r2UploadedCount} image scan(s) uploaded to Cloudflare R2 bucket (sub-question-r2).` : 'R2 bucket.'}`
                    );
                    refreshData();
                  } else {
                    showErrorAlert('Sync Failed', json.error || 'Server error');
                  }
                } catch (e: any) {
                  showErrorAlert('Sync Error', e?.message || 'Failed to connect to Cloudflare');
                }
              }}
              title="Push all local courses, papers, and images to Cloudflare D1 database and R2 Bucket"
              className="text-xs font-bold text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/10"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-400" />
              Push to Cloudflare (D1 &amp; R2)
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAll}
              title="Clear all papers & subjects to start clean"
              className="text-xs text-rose-400 hover:text-rose-300 border-rose-500/30 hover:border-rose-500/50"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              Clear All
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleLoadSample}
              title="Load demo template pack"
              className="text-xs text-indigo-400 hover:text-indigo-300"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              Demo Data
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1 */}
        <div
          onClick={() => onNavigateTab('papers')}
          className="glass-card rounded-2xl p-5 cursor-pointer hover:border-indigo-500/40 transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Papers
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
            {stats.totalPapers}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Archived in R2 storage</p>
        </div>

        {/* Card 2 */}
        <div
          onClick={() => onNavigateTab('subjects')}
          className="glass-card rounded-2xl p-5 cursor-pointer hover:border-cyan-500/40 transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Courses
            </span>
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
            {stats.totalSubjects}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Active curriculum courses</p>
        </div>

        {/* Card 3 */}
        <div
          onClick={() => onNavigateTab('analytics')}
          className="glass-card rounded-2xl p-5 cursor-pointer hover:border-emerald-500/40 transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Downloads
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Download className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono">
            {stats.totalDownloads}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Zero egress fees ($0)</p>
        </div>

        {/* Card 4 */}
        <div
          onClick={() => onNavigateTab('papers')}
          className="glass-card rounded-2xl p-5 cursor-pointer hover:border-amber-500/40 transition-all group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Hidden / Drafts
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <EyeOff className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-200 font-mono">
            {stats.hiddenPapers}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Admin review mode</p>
        </div>
      </div>

      {/* Recent Uploads Section with Real-Time Search */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Recent Uploads &amp; Papers
            </h3>
            <p className="text-xs text-slate-400">Latest question papers uploaded to the archive</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigateTab('papers')}
              className="text-xs text-indigo-400 hover:text-indigo-300"
            >
              Full Question Paper Manager →
            </Button>
          </div>
        </div>

        {/* Real-time Search Box */}
        {papers.length > 0 && (
          <div className="relative">
            <Input
              icon={<Search className="w-4 h-4 text-indigo-400" />}
              placeholder="Search recent uploads by course code, title, or exam in real-time..."
              value={dashboardSearch}
              onChange={(e) => {
                setDashboardSearch(e.target.value);
                setDashboardPage(1);
              }}
              className="pr-8 text-xs"
            />
            {dashboardSearch && (
              <button
                onClick={() => setDashboardSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Course Code</th>
                  <th className="px-5 py-3.5">Subject</th>
                  <th className="px-5 py-3.5">Exam Type</th>
                  <th className="px-5 py-3.5">Session</th>
                  <th className="px-5 py-3.5">Downloads</th>
                  <th className="px-5 py-3.5 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {paginatedDashboardPapers.length > 0 ? (
                  paginatedDashboardPapers.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3.5 font-mono font-bold text-indigo-400">
                        {p.course_code}
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-slate-200 truncate max-w-xs">
                        {p.subject_name}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${p.badge_color || 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'}`}>
                          {p.exam_type_name}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-400 font-mono">{p.session_year}</td>
                      <td className="px-5 py-3.5 font-mono font-semibold text-emerald-400">
                        {p.download_count || 0}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => openViewer(p)}
                          className="text-xs px-2.5 py-1"
                        >
                          Preview
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-slate-500">
                      {dashboardSearch
                        ? `No question papers match "${dashboardSearch}".`
                        : 'No question papers uploaded yet. Click "Upload Paper" or "Batch Multi-Upload" to add your question papers.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* 20 Items Per Page Pagination */}
          {filteredDashboardPapers.length > dashboardPageSize && (
            <div className="p-3 bg-slate-950/50 border-t border-slate-800/80">
              <Pagination
                currentPage={dashboardPage}
                totalItems={filteredDashboardPapers.length}
                pageSize={dashboardPageSize}
                onPageChange={setDashboardPage}
                onPageSizeChange={(size) => {
                  setDashboardPageSize(size);
                  setDashboardPage(1);
                }}
                itemLabel="papers"
              />
            </div>
          )}
        </div>
      </div>

      {/* Single Upload Modal */}
      <PaperUploadModal
        isOpen={isSingleUploadOpen}
        onClose={() => setIsSingleUploadOpen(false)}
        onSuccess={refreshData}
      />

      {/* Batch Multi-Upload Modal */}
      <BatchUploadModal
        isOpen={isBatchUploadOpen}
        onClose={() => setIsBatchUploadOpen(false)}
        onSuccess={refreshData}
      />
    </div>
  );
};
