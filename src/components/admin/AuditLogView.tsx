import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Clock,
  Download,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { auditLogService, AuditLogEntry } from '../../services/auditLog';
import { Button } from '../ui/Button';
import { showDeleteConfirmAlert, showSuccessAlert } from '../../services/alert';

export const AuditLogView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);

  useEffect(() => {
    setLogs(auditLogService.getLogs());
  }, []);

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
              {logs.length > 0 ? (
                logs.map((log) => (
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
                    <span>No security audit logs recorded yet. Administrative events will be logged here automatically.</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
