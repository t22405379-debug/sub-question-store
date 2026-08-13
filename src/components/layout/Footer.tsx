import React from 'react';
import { BookOpen } from 'lucide-react';
import { usePapers } from '../../context/PaperContext';

export const Footer: React.FC = () => {
  const { activeDepartment } = usePapers();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-slate-800/80 bg-slate-950/80 py-6 mt-12 text-slate-500 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        {/* Left Branding */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-600/15 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <BookOpen className="w-3 h-3" />
          </div>
          <span className="font-semibold text-slate-400">
            {activeDepartment ? `${activeDepartment.name} Archive` : 'Academic Question-Paper Archive'}
          </span>
        </div>

        {/* Right Copyright */}
        <div className="text-[11px] text-slate-500">
          <p>© {currentYear} Academic Examination Archive. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
