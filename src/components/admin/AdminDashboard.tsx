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
} from 'lucide-react';
import { usePapers } from '../../context/PaperContext';
import { storageService } from '../../services/storage';
import { Button } from '../ui/Button';
import { PaperUploadModal } from './PaperUploadModal';
import { BatchUploadModal } from './BatchUploadModal';
import { showToast } from '../ui/Toast';
import { showConfirmAlert, showSuccessAlert, showErrorAlert } from '../../services/alert';

interface AdminDashboardProps {
  onNavigateTab: (tab: 'papers' | 'subjects' | 'taxonomy' | 'analytics') => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigateTab }) => {
  const { getAnalytics, refreshData, openViewer, departments, years, semesters, examTypes, subjects, papers } = usePapers();
  const stats = getAnalytics();

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
                      'Live D1 Database Synced!',
                      'All question papers and subjects were pushed to Cloudflare D1 SQL database. Your phone and all student devices will now show all live papers!'
                    );
                  } else {
                    showErrorAlert('Sync Failed', json.error || 'Server error');
                  }
                } catch (e: any) {
                  showErrorAlert('Sync Error', e?.message || 'Failed to connect to Cloudflare D1');
                }
              }}
              title="Push all local courses and papers to live Cloudflare D1 SQL database"
              className="text-xs font-bold text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/10"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-400" />
              Push to Live D1 Database
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

      {/* Recent Uploads Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
            Recent Uploads
          </h3>
          {stats.recentUploads.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigateTab('papers')}
              className="text-xs text-indigo-400 hover:text-indigo-300"
            >
              View All Papers →
            </Button>
          )}
        </div>

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
                {stats.recentUploads.length > 0 ? (
                  stats.recentUploads.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3.5 font-mono font-bold text-indigo-400">
                        {p.course_code}
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-slate-200 truncate max-w-xs">
                        {p.subject_name}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${p.badge_color}`}>
                          {p.exam_type_name}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-400">{p.session_year}</td>
                      <td className="px-5 py-3.5 font-mono font-semibold text-emerald-400">
                        {p.download_count}
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
                      No question papers uploaded yet. Click &ldquo;Upload Paper&rdquo; or &ldquo;Batch Multi-Upload&rdquo; to add your question papers.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
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
