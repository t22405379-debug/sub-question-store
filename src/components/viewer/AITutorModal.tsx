import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Bot,
  Send,
  Copy,
  Check,
  Zap,
  Cpu,
  Brain,
  Binary,
  Flame,
  Eye,
  Camera,
  Layers,
  BookOpen,
  Terminal,
  Code2,
} from 'lucide-react';
import { QuestionPaper } from '../../types';
import { Button } from '../ui/Button';
import { showToast } from '../ui/Toast';

interface AITutorModalProps {
  isOpen: boolean;
  onClose: () => void;
  paper: QuestionPaper | null;
  imageSrc?: string;
}

interface AIModelOption {
  id: string;
  name: string;
  badge: string;
  category: 'smart' | 'vision' | 'math' | 'code' | 'general';
  icon: React.ReactNode;
  description: string;
}

const ALL_FREE_MODELS: AIModelOption[] = [
  {
    id: 'auto',
    name: 'Smart Auto-Route',
    badge: 'Recommended',
    category: 'smart',
    icon: <Sparkles className="w-3.5 h-3.5 text-amber-400" />,
    description: 'Auto-detects whether you need Vision, Math, Code, or Theory',
  },
  // Vision Models
  {
    id: '@cf/moondream/moondream3.1-9B-A2B',
    name: 'Moondream 3.1 Vision',
    badge: 'OCR & Diagrams',
    category: 'vision',
    icon: <Eye className="w-3.5 h-3.5 text-emerald-400" />,
    description: 'Reads handwritten exams, circuit diagrams, and graphs directly from scans',
  },
  {
    id: '@cf/meta/llama-3.2-11b-vision-instruct',
    name: 'Llama 3.2 Vision (11B)',
    badge: 'Visual Reasoning',
    category: 'vision',
    icon: <Camera className="w-3.5 h-3.5 text-cyan-400" />,
    description: 'Meta 11B Vision model for fine visual recognition & problem solving',
  },
  {
    id: '@cf/meta/llama-4-scout-17b-16e-instruct',
    name: 'Llama 4 Scout (17B MoE)',
    badge: 'Multimodal MoE',
    category: 'vision',
    icon: <Layers className="w-3.5 h-3.5 text-indigo-400" />,
    description: '17B parameter mixture-of-experts multimodal architecture',
  },
  // Math & Deep Reasoning Models
  {
    id: '@cf/deepseek-ai/deepseek-r1-distill-qwen-32b',
    name: 'DeepSeek R1 (32B)',
    badge: 'Math Proofs',
    category: 'math',
    icon: <Brain className="w-3.5 h-3.5 text-purple-400" />,
    description: 'Deep step-by-step mathematical reasoning, proofs, and calculus',
  },
  {
    id: '@cf/qwen/qwq-32b',
    name: 'Qwen QwQ (32B)',
    badge: 'Circuits & Physics',
    category: 'math',
    icon: <Layers className="w-3.5 h-3.5 text-blue-400" />,
    description: 'Specialized in circuit analysis, thermodynamics, and analytical equations',
  },
  {
    id: '@cf/openai/gpt-oss-120b',
    name: 'OpenAI GPT-OSS (120B)',
    badge: '120B MoE Giant',
    category: 'math',
    icon: <Sparkles className="w-3.5 h-3.5 text-rose-400" />,
    description: 'Massive 120B open-weight reasoning and logic model',
  },
  // Code Masters
  {
    id: '@cf/qwen/qwen2.5-coder-32b-instruct',
    name: 'Qwen 2.5 Coder (32B)',
    badge: '#1 Code Master',
    category: 'code',
    icon: <Code2 className="w-3.5 h-3.5 text-teal-400" />,
    description: 'Top-tier code generation for C, C++, Java, Python, and DSA algorithms',
  },
  {
    id: '@cf/mistralai/mistral-small-3.1-24b-instruct',
    name: 'Mistral Small 3.1 (24B)',
    badge: 'Algorithms',
    category: 'code',
    icon: <Terminal className="w-3.5 h-3.5 text-emerald-400" />,
    description: 'State-of-the-art coding and logic reasoning by Mistral AI',
  },
  {
    id: '@cf/mistral/mistral-7b-instruct-v0.2',
    name: 'Mistral 7B Code',
    badge: 'Fast Code',
    category: 'code',
    icon: <Binary className="w-3.5 h-3.5 text-cyan-400" />,
    description: 'Lightweight and fast code solver for programming exams',
  },
  // Flagship University Tutors
  {
    id: '@cf/meta/llama-3.3-70b-instruct',
    name: 'Meta Llama 3.3 (70B)',
    badge: 'Flagship Tutor',
    category: 'general',
    icon: <Cpu className="w-3.5 h-3.5 text-indigo-400" />,
    description: 'Flagship 70B parameter general university professor across all topics',
  },
  {
    id: '@cf/google/gemma-4-26b-a4b-it',
    name: 'Google Gemma 4 (26B)',
    badge: 'Gemini-Core',
    category: 'general',
    icon: <BookOpen className="w-3.5 h-3.5 text-amber-300" />,
    description: 'Google intelligence built from Gemini 3 core architectures',
  },
  {
    id: '@cf/meta/llama-3.1-8b-instruct',
    name: 'Llama 3.1 (8B Fast)',
    badge: 'Lightning Fast',
    category: 'general',
    icon: <Flame className="w-3.5 h-3.5 text-rose-400" />,
    description: 'Ultra-fast low-latency answers and key formula flashcards',
  },
];

export const AITutorModal: React.FC<AITutorModalProps> = ({
  isOpen,
  onClose,
  paper,
  imageSrc,
}) => {
  const [selectedModel, setSelectedModel] = useState('auto');
  const [includeImage, setIncludeImage] = useState(true);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [modelUsedName, setModelUsedName] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !paper) return null;

  const handleAskAI = async (customQuestion?: string) => {
    const queryText = (customQuestion || prompt).trim();
    if (!queryText && (!includeImage || !imageSrc)) return;

    setLoading(true);
    setAnswer(null);
    setModelUsedName(null);

    try {
      const res = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: queryText || 'Solve and explain the questions shown in this exam paper scan.',
          courseCode: paper.course_code,
          subjectName: paper.subject_name,
          examType: paper.exam_type_name,
          sessionYear: paper.session_year,
          model: selectedModel,
          image: includeImage && imageSrc ? imageSrc : undefined,
        }),
      });

      const data = await res.json();
      if (data.answer) {
        setAnswer(data.answer);
        setModelUsedName(data.modelDisplayName || data.model || 'Cloudflare Workers AI');
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
    {
      label: 'Solve Question 1 (With Formulas)',
      text: 'Provide a complete step-by-step mathematical/code solution for Question 1 with all intermediate formulas.',
    },
    {
      label: 'Read Diagram & Calculate Values',
      text: 'Analyze the circuit or diagram in this paper and compute the theoretical values step-by-step.',
    },
    {
      label: 'Algorithmic Code Breakdown',
      text: 'Provide clean, optimized C++/Java code and explain time complexity for the programming question.',
    },
    {
      label: 'Exam Traps & Scoring Tips',
      text: 'What are the most common student mistakes on these topics and how to achieve full marks in the exam?',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md animate-fade-in" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl flex flex-col max-h-[94vh] overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20 shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-indigo-400">
                <Bot className="w-5 h-5" />
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-bold text-white truncate">
                  Cloudflare Workers AI Catalog Suite
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  All 13 Models 100% Free
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

        {/* Model Switcher Tab Bar (All 13 Catalog Free Models) */}
        <div className="px-4 py-2 bg-slate-950/95 border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 shrink-0 mr-1">
            Engine:
          </span>
          {ALL_FREE_MODELS.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelectedModel(m.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 flex items-center gap-1.5 transition-all ${
                selectedModel === m.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold scale-105'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
              }`}
              title={m.description}
            >
              {m.icon}
              <span>{m.name}</span>
            </button>
          ))}
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Visual Paper Attachment Bar */}
          {imageSrc && (
            <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-950/90 border border-slate-800 gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={imageSrc}
                  alt="Paper Scan"
                  className="w-10 h-10 object-cover rounded-lg border border-slate-700 shrink-0"
                />
                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-200 block truncate">
                    Question Paper Scan Attached
                  </span>
                  <span className="text-[10px] text-slate-400 block truncate">
                    Vision AI models (Moondream, Llama 3.2 Vision, Llama 4 Scout) read handwriting and diagrams directly.
                  </span>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer shrink-0 bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700/80 transition-colors">
                <input
                  type="checkbox"
                  checked={includeImage}
                  onChange={(e) => setIncludeImage(e.target.checked)}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs font-semibold text-indigo-300">Scan Paper</span>
              </label>
            </div>
          )}

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
              Ask Specific Question, Equation, or Algorithm:
            </label>
            <div className="relative">
              <textarea
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. Solve Question 2(b) finding Thevenin voltage, or write the Dijkstra algorithm code in C++..."
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
                disabled={(!prompt.trim() && (!includeImage || !imageSrc)) || loading}
                className="absolute right-2.5 bottom-3.5 text-xs px-3 py-1.5 shadow-md bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
              >
                <Send className="w-3.5 h-3.5 mr-1" />
                Solve with AI
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
                Running {ALL_FREE_MODELS.find((m) => m.id === selectedModel)?.name || 'AI Engine'} on Cloudflare GPU network...
              </p>
            </div>
          )}

          {answer && !loading && (
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-indigo-500/30 space-y-3 animate-fade-in shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-indigo-300">Solution Breakdown</span>
                  {modelUsedName && (
                    <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[10px] font-mono text-cyan-300">
                      ⚡ {modelUsedName}
                    </span>
                  )}
                </div>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-white bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap font-sans space-y-2 max-h-80 overflow-y-auto pr-1">
                {answer}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5 truncate">
            <Cpu className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="truncate">
              OpenAI GPT-OSS (120B) • DeepSeek R1 • Qwen 2.5 Coder • Moondream Vision • Google Gemma 4
            </span>
          </span>
          <button onClick={onClose} className="hover:text-white font-semibold shrink-0 ml-2">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
