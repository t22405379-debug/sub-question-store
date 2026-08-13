import React, { useState, useEffect } from 'react';
import {
  Download,
  CheckCircle2,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { QuestionPaper } from '../../types';
import { Dialog } from './Dialog';
import { formatBytes } from '../../services/imageOptimizer';

interface DownloadProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  paper: QuestionPaper | null;
}

export const DownloadProgressModal: React.FC<DownloadProgressModalProps> = ({
  isOpen,
  onClose,
  paper,
}) => {
  const [progress, setProgress] = useState(0);
  const [downloadSpeed, setDownloadSpeed] = useState('18.4 MB/s');
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (!isOpen || !paper) {
      setProgress(0);
      setIsCompleted(false);
      return;
    }

    let current = 0;
    const interval = setInterval(() => {
      current += Math.floor(Math.random() * 25) + 15;
      if (current >= 100) {
        current = 100;
        setProgress(100);
        setIsCompleted(true);
        clearInterval(interval);
      } else {
        setProgress(current);
        setDownloadSpeed(`${(Math.random() * 8 + 14).toFixed(1)} MB/s`);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isOpen, paper]);

  if (!paper) return null;

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Downloading Paper" maxWidth="sm">
      <div className="space-y-5 py-1 text-center">
        {/* Animated Icon Header */}
        <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
          <div className={`absolute inset-0 rounded-2xl ${isCompleted ? 'bg-emerald-500/20' : 'bg-indigo-500/20'} animate-ping opacity-60`} />
          <div
            className={`w-16 h-16 rounded-2xl ${
              isCompleted
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                : 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
            } flex items-center justify-center relative z-10 transition-colors duration-300`}
          >
            {isCompleted ? (
              <CheckCircle2 className="w-8 h-8 animate-scale-in" />
            ) : (
              <Download className="w-8 h-8 animate-bounce" />
            )}
          </div>
        </div>

        {/* Paper Details */}
        <div>
          <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
            {paper.course_code}
          </span>
          <h4 className="text-sm font-bold text-white mt-1.5">{paper.subject_name}</h4>
          <p className="text-xs text-slate-400">
            {paper.exam_type_name} • Session {paper.session_year}
          </p>
        </div>

        {/* Progress Bar Container */}
        <div className="space-y-2 bg-slate-950/80 p-4 rounded-2xl border border-slate-800 text-left">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-slate-400">
              {isCompleted ? 'Transfer Complete' : `Downloading ${formatBytes(paper.file_size)}...`}
            </span>
            <span className="font-bold text-indigo-400">{progress}%</span>
          </div>

          <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-700/60 p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-150 ${
                isCompleted
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-md shadow-emerald-500/40'
                  : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 shadow-md shadow-indigo-500/40'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono pt-1">
            <span className="flex items-center gap-1 text-emerald-400">
              <Zap className="w-3 h-3" />
              <span>Speed: {downloadSpeed}</span>
            </span>
            <span className="flex items-center gap-1 text-slate-400">
              <ShieldCheck className="w-3 h-3 text-indigo-400" />
              <span>Verified Document</span>
            </span>
          </div>
        </div>

        {/* Footer Info */}
        <p className="text-[11px] text-slate-400">
          {isCompleted
            ? '✅ File downloaded and saved to your device!'
            : 'Transferring official question paper...'}
        </p>

        {isCompleted && (
          <button
            onClick={onClose}
            className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors"
          >
            Done
          </button>
        )}
      </div>
    </Dialog>
  );
};
