import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { PaperProvider } from './context/PaperContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { ExplorerView } from './components/explorer/ExplorerView';
import { AdminLayout } from './components/admin/AdminLayout';
import { SearchModal } from './components/explorer/SearchModal';
import { PaperViewerModal } from './components/viewer/PaperViewerModal';
import { ToastContainer } from './components/ui/Toast';

export function AppContent() {
  const [activeTab, setActiveTab] = useState<'explorer' | 'admin' | 'bookmarks'>('explorer');

  // Check URL parameter: /admin?admin=true, ?admin=true, or #admin
  useEffect(() => {
    const checkAdminQuery = () => {
      const searchParams = new URLSearchParams(window.location.search);
      const isParamAdmin = searchParams.get('admin') === 'true' || searchParams.get('admin') === '1';
      const isPathAdmin = window.location.pathname.includes('/admin') || window.location.hash.includes('admin');

      if (isParamAdmin || isPathAdmin) {
        setActiveTab('admin');
      } else {
        setActiveTab('explorer');
      }
    };

    checkAdminQuery();
    window.addEventListener('popstate', checkAdminQuery);
    return () => window.removeEventListener('popstate', checkAdminQuery);
  }, []);

  const handleExitAdmin = () => {
    // Clear URL search and hash
    window.history.replaceState({}, document.title, window.location.pathname);
    setActiveTab('explorer');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white pb-20 md:pb-0">
      {/* Top Navigation: STRICTLY STUDENT ONLY */}
      {activeTab !== 'admin' && (
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      )}

      {/* Main View Area */}
      <main className="flex-1">
        {activeTab === 'admin' ? (
          <AdminLayout onExitAdmin={handleExitAdmin} />
        ) : (
          <ExplorerView />
        )}
      </main>

      {/* Global Modals & Notifications */}
      <SearchModal />
      <PaperViewerModal />
      <ToastContainer />

      {/* Mobile Bottom Navigation Bar (Students Only) */}
      {activeTab !== 'admin' && (
        <MobileBottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      )}

      {/* Bottom Footer */}
      <Footer />
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <PaperProvider>
        <AppContent />
      </PaperProvider>
    </AuthProvider>
  );
}

export default App;
