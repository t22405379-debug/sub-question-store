import React from 'react';
import {
  BarChart3,
  Download,
  HardDrive,
  TrendingUp,
  FileSpreadsheet,
  CheckCircle2,
  PieChart,
} from 'lucide-react';
import { usePapers } from '../../context/PaperContext';
import { formatBytes } from '../../services/imageOptimizer';
import { Button } from '../ui/Button';
import { showToast } from '../ui/Toast';

export const AnalyticsView: React.FC = () => {
  const { getAnalytics, papers } = usePapers();
  const stats = getAnalytics();

  // Calculate total storage consumed
  const totalBytesUsed = papers.reduce((sum, p) => sum + (p.file_size || 0), 0);
  const r2FreeLimitBytes = 10 * 1024 * 1024 * 1024; // 10 GB
  const percentR2Used = ((totalBytesUsed / r2FreeLimitBytes) * 100).toFixed(2);

  // Export Analytics to CSV
  const handleExportCSV = () => {
    const headers = ['Course Code', 'Subject Name', 'Exam Type', 'Session Year', 'File Name', 'File Size (Bytes)', 'Download Count', 'Uploaded At'];
    const rows = papers.map((p) => [
      `"${p.course_code || ''}"`,
      `"${p.subject_name || ''}"`,
      `"${p.exam_type_name || ''}"`,
      `"${p.session_year || ''}"`,
      `"${p.file_name || ''}"`,
      p.file_size,
      p.download_count,
      `"${p.uploaded_at || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `cse_question_papers_analytics_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Export Completed', 'Analytics CSV downloaded.');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">Analytics &amp; Usage Statistics</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Download volumes, Cloudflare R2 storage consumption, and student interest metrics
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExportCSV} className="text-xs">
          <FileSpreadsheet className="w-4 h-4 mr-1.5 text-emerald-400" />
          Export Report (CSV)
        </Button>
      </div>

      {/* Cloudflare R2 Storage Free Tier Meter */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-100">Cloudflare R2 Bucket Storage</h3>
          </div>
          <span className="text-xs font-mono text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">
            100% Free Tier ($0.00 / mo)
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 rounded-full transition-all duration-500"
            style={{ width: `${Math.max(parseFloat(percentR2Used), 2)}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Used: <strong className="text-slate-200">{formatBytes(totalBytesUsed)}</strong> ({percentR2Used}% of 10 GB free quota)</span>
          <span>Free Remaining: <strong className="text-slate-200">{formatBytes(r2FreeLimitBytes - totalBytesUsed)}</strong></span>
        </div>
      </div>

      {/* Grid of breakdowns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Exam Type Breakdown */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2">
            <PieChart className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-100">Downloads by Exam Type</h3>
          </div>
          <div className="space-y-2.5">
            {stats.downloadsByExamType.map((item) => (
              <div key={item.exam} className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/60">
                <span className="font-semibold text-slate-300">{item.exam}</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-indigo-400 font-bold">{item.count} downloads</span>
                  <span className={`w-2.5 h-2.5 rounded-full border ${item.color}`} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top 5 Most Downloaded Courses */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-100">Top 5 Most Demanded Courses</h3>
          </div>
          <div className="space-y-2.5">
            {stats.topDownloadedSubjects.map((s, idx) => (
              <div key={s.code} className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/60">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                    #{idx + 1}
                  </span>
                  <div className="min-w-0">
                    <span className="font-mono font-bold text-indigo-400 block">{s.code}</span>
                    <span className="text-slate-300 truncate block">{s.subject}</span>
                  </div>
                </div>
                <span className="font-mono font-bold text-emerald-400 shrink-0 ml-2">
                  {s.downloads} dl
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
