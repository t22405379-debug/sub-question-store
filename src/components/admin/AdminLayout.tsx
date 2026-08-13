import React, { useState } from 'react';
import {
  LayoutDashboard,
  FileText,
  BookOpen,
  BarChart3,
  LogOut,
  KeyRound,
  Shield,
  Layers,
  ArrowLeft,
  ScrollText,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AdminLogin } from './AdminLogin';
import { AdminDashboard } from './AdminDashboard';
import { PaperManager } from './PaperManager';
import { SubjectManager } from './SubjectManager';
import { HierarchyManager } from './HierarchyManager';
import { AnalyticsView } from './AnalyticsView';
import { AuditLogView } from './AuditLogView';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { showToast } from '../ui/Toast';

interface AdminLayoutProps {
  onExitAdmin?: () => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ onExitAdmin }) => {
  const { isAuthenticated, user, logout, changePassword } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'papers' | 'subjects' | 'taxonomy' | 'analytics' | 'audit'>('dashboard');

  // Password Change Modal State
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passError, setPassError] = useState<string | null>(null);
  const [isChanging, setIsChanging] = useState(false);

  if (!isAuthenticated) {
    return <AdminLogin />;
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass !== confirmPass) {
      setPassError('New passwords do not match.');
      return;
    }
    if (newPass.length < 6) {
      setPassError('Password must be at least 6 characters.');
      return;
    }

    setIsChanging(true);
    setPassError(null);

    const res = await changePassword(oldPass, newPass);
    setIsChanging(false);

    if (res.success) {
      showToast('Password Updated', 'Your admin password was changed securely.');
      setIsPassModalOpen(false);
      setOldPass('');
      setNewPass('');
      setConfirmPass('');
    } else {
      setPassError(res.error || 'Failed to update password');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Admin Subheader & Tab Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          {onExitAdmin && (
            <button
              onClick={onExitAdmin}
              className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5 text-xs font-semibold"
              title="Exit to Student Explorer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Student View</span>
            </button>
          )}

          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white tracking-tight">
                Admin Control Center
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                Super Admin
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Logged in as <strong className="text-slate-200">{user?.display_name || user?.username}</strong>
            </p>
          </div>
        </div>

        {/* Tab Navigation Pill Bar */}
        <div className="flex items-center gap-1.5 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 self-start md:self-auto overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              activeTab === 'dashboard'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('papers')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              activeTab === 'papers'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Question Papers</span>
          </button>

          <button
            onClick={() => setActiveTab('subjects')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              activeTab === 'subjects'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Subjects</span>
          </button>

          <button
            onClick={() => setActiveTab('taxonomy')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              activeTab === 'taxonomy'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Years &amp; Terms</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              activeTab === 'analytics'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Analytics &amp; R2</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              activeTab === 'audit'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ScrollText className="w-3.5 h-3.5" />
            <span>Audit Trail</span>
          </button>

          <div className="h-5 w-[1px] bg-slate-800 mx-1 shrink-0" />

          {/* Change Password */}
          <button
            onClick={() => setIsPassModalOpen(true)}
            className="p-2 text-slate-400 hover:text-indigo-300 rounded-xl hover:bg-slate-800 transition-colors"
            title="Change Admin Password"
          >
            <KeyRound className="w-4 h-4" />
          </button>

          {/* Logout */}
          <button
            onClick={logout}
            className="p-2 text-slate-400 hover:text-rose-400 rounded-xl hover:bg-slate-800 transition-colors"
            title="Logout Session"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'dashboard' && <AdminDashboard onNavigateTab={(tab: any) => setActiveTab(tab)} />}
      {activeTab === 'papers' && <PaperManager />}
      {activeTab === 'subjects' && <SubjectManager />}
      {activeTab === 'taxonomy' && <HierarchyManager />}
      {activeTab === 'analytics' && <AnalyticsView />}
      {activeTab === 'audit' && <AuditLogView />}

      {/* Password Change Dialog */}
      <Dialog
        isOpen={isPassModalOpen}
        onClose={() => setIsPassModalOpen(false)}
        title="Change Admin Password"
        description="Update your password credentials securely with PBKDF2/SHA-256 salt"
        maxWidth="md"
      >
        <form onSubmit={handleChangePassword} className="space-y-4">
          {passError && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
              {passError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Current Password
            </label>
            <Input
              type="password"
              value={oldPass}
              onChange={(e) => setOldPass(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              New Password
            </label>
            <Input
              type="password"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              placeholder="Minimum 6 characters"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Confirm New Password
            </label>
            <Input
              type="password"
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
              placeholder="Re-type new password"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsPassModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isChanging}>
              Update Password
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
