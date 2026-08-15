import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Clock,
  Download,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Info,
  Search,
  X,
} from 'lucide-react';
import { auditLogService, AuditLogEntry } from '../../services/auditLog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Pagination } from '../ui/Pagination';
import { showDeleteConfirmAlert, showSuccessAlert } from '../../services/alert';

export const AuditLogView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('all');

  // Pagination state (20 per page)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  useEffect(() => {
    setLogs(auditLogService.getLogs());
  }, []);

  // Reset page when filter or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterLevel]);

  const handleClearLogs = async () => {
    const confirmed = await showDeleteConfirmAlert(
      'Audit Trail Logs',
      'Are you sure you want to clear the entire security audit trail history?'
    );

    if (confirmed) {
      auditLogService.clearLogs();
      setLogs([]);
      showSuccessAlert('Logs Cleared', 'Audit log history wiped.');
    }
  };

  const handleExportCSV = () => {
    if (logs.length === 0) return;

    const headers = ['Timestamp,User,Action,Level,Details\n'];
    const rows = logs.map(
      (l) =>
        `"${l.timestamp}","${l.user}","${l.action}","${l.level}","${l.details.replace(/"/g, '""')}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + headers.concat(rows).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `admin_audit_trail_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered Logs
  const filteredLogs = logs.filter((log) => {
    if (filterLevel !== 'all' && log.level !== filterLevel) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        log.user.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const paginatedLogs = filteredLogs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight">Security &amp; Activity Audit Log</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Tamper-resistant activity logs tracking administrative events, file uploads, and permission modifications
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={logs.length === 0}
            className="text-xs text-slate-300"
          >
            <Download className="w-3.5 h-3.5 mr-1 text-emerald-400" />
            Export to CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearLogs}
            disabled={logs.length === 0}
            className="text-xs text-rose-400 border-rose-500/30 hover:border-rose-500/50"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            Clear Logs
          </Button>
        </div>
      </div>

      {/* Real-time Search & Filter Bar */}
      <div className="glass-panel rounded-2xl p-4 flex flex-col md:flex-row items-center gap-3">
        <div className="flex-1 w-full relative">
          <Input
            icon={<Search className="w-4 h-4 text-indigo-400" />}
            placeholder="Search audit trail by admin user, action, or details in real-time..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-8"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1"
              title="Clear Search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="all">All Severity Levels</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="danger">Danger</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Timestamp</th>
                <th className="px-5 py-3.5">Admin User</th>
                <th className="px-5 py-3.5">Event Action</th>
                <th className="px-5 py-3.5">Details</th>
                <th className="px-5 py-3.5 text-right">Severity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono">
              {paginatedLogs.length > 0 ? (
                paginatedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5 text-slate-400 font-normal">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-indigo-400">
                      {log.user}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-200">
                      {log.action}
                    </td>
                    <td className="px-5 py-3.5 text-slate-300 font-sans truncate max-w-sm">
                      {log.details}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          log.level === 'danger'
                            ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                            : log.level === 'warning'
                            ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                            : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                        }`}
                      >
                        {log.level}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-500 font-sans">
                    <ShieldAlert className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                    <span>No security audit logs match the active filter criteria.</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 20 Items Per Page Pagination */}
        {filteredLogs.length > 0 && (
          <div className="p-3 bg-slate-950/50 border-t border-slate-800/80">
            <Pagination
              currentPage={currentPage}
              totalItems={filteredLogs.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
              itemLabel="log events"
            />
          </div>
        )}
      </div>
    </div>
  );
};
