export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  level: 'info' | 'warning' | 'danger';
  user: string;
}

const STORAGE_KEY = 'cse_admin_audit_logs_v1';

class AuditLogService {
  public getLogs(): AuditLogEntry[] {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  }

  public log(action: string, details: string, level: 'info' | 'warning' | 'danger' = 'info', user = 'admin'): AuditLogEntry {
    const entry: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      action,
      details,
      level,
      user,
    };

    const logs = [entry, ...this.getLogs()].slice(0, 100); // keep last 100 events
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
    return entry;
  }

  public clearLogs(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  }
}

export const auditLogService = new AuditLogService();
