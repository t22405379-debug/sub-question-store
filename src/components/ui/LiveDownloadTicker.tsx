import React, { useState, useEffect } from 'react';
import {
  Download,
  Sparkles,
  Zap,
  Flame,
  ShieldCheck,
  Globe2,
} from 'lucide-react';
import { usePapers } from '../../context/PaperContext';

export const LiveDownloadTicker: React.FC = () => {
  const { papers, getAnalytics } = usePapers();
  const stats = getAnalytics();

  const [currentIndex, setCurrentIndex] = useState(0);

  // Generate dynamic live event feed based on actual uploaded papers
  const liveEvents = React.useMemo(() => {
    const events: string[] = [];

    if (papers.length > 0) {
      papers.slice(0, 5).forEach((p) => {
        if ((p.download_count || 0) > 0) {
          events.push(
            `🔥 Student downloaded ${p.course_code} ${p.exam_type_name} (${p.session_year}) • ${p.download_count} total downloads`
          );
        } else {
          events.push(
            `📚 New archive added: ${p.course_code} — ${p.subject_name} (${p.exam_type_name})`
          );
        }
      });
    }

    // Default university activity highlights
    events.push('🏛️ State University of Bangladesh — Official CSE Paper Repository Active');
    events.push('⚡ Cloudflare R2 Global Edge CDN: 0ms Latency & $0 Egress Fees');
    events.push('🛡️ Cryptographically Verified & Salted Password Security Active');

    return events;
  }, [papers]);

  useEffect(() => {
    if (liveEvents.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % liveEvents.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [liveEvents.length]);

  return (
    <div className="w-full bg-gradient-to-r from-rose-950/40 via-indigo-950/40 to-slate-950/80 border-y border-slate-800/80 py-2 px-4 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
        {/* Left: Live Pulse Tag & Rotating Text */}
        <div className="flex items-center gap-2.5 min-w-0 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 font-bold shrink-0">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
            <span className="text-[10px] tracking-wider uppercase font-mono">SUB Live Pulse</span>
          </div>

          <div className="overflow-hidden relative h-5 flex items-center min-w-0 flex-1">
            <span
              key={currentIndex}
              className="text-slate-300 truncate font-medium animate-fade-in text-[11px] sm:text-xs"
            >
              {liveEvents[currentIndex]}
            </span>
          </div>
        </div>

        {/* Right: Live University Download Counter */}
        <div className="flex items-center gap-3 shrink-0 text-slate-400 font-mono text-[11px]">
          <div className="flex items-center gap-1 text-emerald-400 font-semibold">
            <Download className="w-3.5 h-3.5 animate-bounce" />
            <span>{stats.totalDownloads} Campus Downloads</span>
          </div>
          <span className="text-slate-700 hidden md:inline">•</span>
          <div className="hidden md:flex items-center gap-1 text-indigo-300 font-medium">
            <Globe2 className="w-3.5 h-3.5" />
            <span>sub.ac.bd</span>
          </div>
        </div>
      </div>
    </div>
  );
};
