import React from 'react';
import {
  FolderTree,
  Search,
  Bookmark,
} from 'lucide-react';
import { usePapers } from '../../context/PaperContext';

interface MobileBottomNavProps {
  activeTab: 'explorer' | 'admin' | 'bookmarks';
  setActiveTab: (tab: 'explorer' | 'admin' | 'bookmarks') => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ activeTab, setActiveTab }) => {
  const { bookmarks, onlyBookmarked, setOnlyBookmarked, setIsSearchModalOpen } = usePapers();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-slate-950/95 border-t border-slate-800 backdrop-blur-xl px-2 py-1.5 shadow-2xl safe-area-inset-bottom">
      <div className="grid grid-cols-3 gap-1">
        {/* Tab 1: Directory */}
        <button
          onClick={() => {
            setOnlyBookmarked(false);
            setActiveTab('explorer');
          }}
          className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-all ${
            activeTab === 'explorer' && !onlyBookmarked
              ? 'text-indigo-400 font-bold bg-indigo-500/10'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FolderTree className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Directory</span>
        </button>

        {/* Tab 2: Spotlight Search */}
        <button
          onClick={() => setIsSearchModalOpen(true)}
          className="flex flex-col items-center justify-center py-1.5 rounded-xl text-slate-400 hover:text-slate-200 transition-all"
        >
          <Search className="w-5 h-5 mb-0.5 text-slate-400" />
          <span className="text-[10px]">Search</span>
        </button>

        {/* Tab 3: Saved Papers */}
        <button
          onClick={() => {
            setOnlyBookmarked(true);
            setActiveTab('explorer');
          }}
          className={`relative flex flex-col items-center justify-center py-1.5 rounded-xl transition-all ${
            activeTab === 'explorer' && onlyBookmarked
              ? 'text-amber-400 font-bold bg-amber-500/10'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Bookmark className={`w-5 h-5 mb-0.5 ${onlyBookmarked ? 'fill-current' : ''}`} />
          <span className="text-[10px]">Saved</span>
          {bookmarks.length > 0 && (
            <span className="absolute top-1 right-8 w-4 h-4 rounded-full bg-amber-500 text-slate-950 font-extrabold text-[9px] flex items-center justify-center">
              {bookmarks.length}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};
