import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Bot,
  Send,
  Copy,
  Check,
  BookOpen,
  HelpCircle,
  Code,
  Zap,
} from 'lucide-react';
import { QuestionPaper } from '../../types';
import { Button } from '../ui/Button';
import { showToast } from '../ui/Toast';

interface AITutorModalProps {
  isOpen: boolean;
  onClose: () => void;
  paper: QuestionPaper | null;
}

export const AITutorModal: React.FC<AITutorModalProps> = ({ isOpen, onClose, paper }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !paper) return null;

  const handleAskAI = async (customQuestion?: string) => {
    const queryText = (customQuestion || prompt).trim();
    if (!queryText) return;

    setLoading(true);
    setAnswer(null);

    try {
      const res = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: queryText,
          courseCode: paper.course_code,
          subjectName: paper.subject_name,
          examType: paper.exam_type_name,
          sessionYear: paper.session_year,
        }),
      });

      const data = await res.json();
      if (data.answer) {
        setAnswer(data.answer);
      } else {
        setAnswer('Unable to generate an explanation at this moment. Please try again.');
      }
    } catch {
      setAnswer('Connection to AI service failed. Please check your network connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!answer) return;
    navigator.clipboard.writeText(answer);
    setCopied(true);
    showToast('Copied', 'Solution explanation copied to clipboard.');
    setTimeout(() => setCopied(false), 2000);
  };

  const quickPrompts = [
    { label: 'Solve Question 1', text: 'Provide a complete step-by-step solution for Question 1 with formulas and calculations.' },
    { label: 'Explain Core Theory', text: 'Explain the main theoretical concepts and theorems covered in this exam paper.' },
    { label: 'Code / Algorithmic Breakdown', text: 'Provide pseudocode, time complexity, and clean code solution for the programming problem in this paper.' },
    { label: 'Exam Traps & Tips', text: 'What are the common mistakes students make in this exam and how to avoid losing marks?' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-hidden">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md animate-fade-in" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20 shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-indigo-400">
                <Bot className="w-5 h-5" />
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-white truncate">AI Academic Tutor</h3>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  Cloudflare AI
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate">
                {paper.course_code}: {paper.subject_name} ({paper.exam_type_name} {paper.session_year})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Quick Smart Starters */}
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Quick Problem Solver Prompts:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {quickPrompts.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setPrompt(q.text);
                    handleAskAI(q.text);
                  }}
                  className="text-left text-xs bg-slate-950/80 hover:bg-indigo-950/50 border border-slate-800 hover:border-indigo-500/50 p-2.5 rounded-xl transition-all text-slate-300 hover:text-white flex items-center gap-2 group shadow-sm"
                >
                  <Zap className="w-3.5 h-3.5 text-indigo-400 group-hover:text-amber-400 transition-colors shrink-0" />
                  <span className="truncate">{q.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Prompt Input Form */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Ask Specific Question or Formula:
            </label>
            <div className="relative">
              <textarea
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. How to find the output voltage in Question 2(b)? Or write the C program for the loop problem..."
                className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl p-3.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none leading-relaxed"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    handleAskAI();
                  }
                }}
              />
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleAskAI()}
                isLoading={loading}
                disabled={!prompt.trim() || loading}
                className="absolute right-2.5 bottom-3.5 text-xs px-3 py-1.5 shadow-md bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
              >
                <Send className="w-3.5 h-3.5 mr-1" />
                Ask AI
              </Button>
            </div>
          </div>

          {/* AI Response Output Area */}
          {loading && (
            <div className="p-6 rounded-2xl bg-slate-950/80 border border-indigo-500/30 text-center space-y-3 animate-pulse">
              <div className="w-8 h-8 rounded-xl bg-indigo-600/30 text-indigo-400 flex items-center justify-center mx-auto">
                <Sparkles className="w-5 h-5 animate-spin" />
              </div>
              <p className="text-xs text-indigo-300 font-semibold">
                Analyzing university question syllabus and generating step-by-step solution...
              </p>
            </div>
          )}

          {answer && !loading && (
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-indigo-500/30 space-y-3 animate-fade-in shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>AI Academic Solution</span>
                </div>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-white bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap font-sans space-y-2 max-h-72 overflow-y-auto pr-1">
                {answer}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-[11px] text-slate-400">
          <span>Powered by Cloudflare Workers AI</span>
          <button onClick={onClose} className="hover:text-white font-semibold">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
