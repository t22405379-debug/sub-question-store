import React, { useState, useEffect } from 'react';
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
  ChevronDown,
  ChevronUp,
  Settings2,
} from 'lucide-react';
import { QuestionPaper } from '../../types';
import { Button } from '../ui/Button';
import { MarkdownRenderer } from '../ui/MarkdownRenderer';
import { showToast } from '../ui/Toast';

interface AITutorModalProps {
  isOpen: boolean;
  onClose: () => void;
  paper: QuestionPaper | null;
  imageSrc?: string;
}

type ModelCategory = 'all' | 'vision' | 'math' | 'code' | 'general';

interface AIModelOption {
  id: string;
  name: string;
  badge: string;
  category: 'vision' | 'math' | 'code' | 'general';
  size: string;
  icon: React.ReactNode;
  description: string;
}

const ALL_FREE_MODELS: AIModelOption[] = [
  // Vision Models
  {
    id: '@cf/moondream/moondream3.1-9B-A2B',
    name: 'Moondream 3.1 Vision',
    badge: 'OCR & Handwriting',
    category: 'vision',
    size: '9B MoE',
    icon: <Eye className="w-4 h-4 text-emerald-400" />,
    description: 'Reads handwritten exams, circuit diagrams, and graphs directly from scans',
  },
  {
    id: '@cf/meta/llama-3.2-11b-vision-instruct',
    name: 'Llama 3.2 Vision',
    badge: 'Visual Reasoning',
    category: 'vision',
    size: '11B',
    icon: <Camera className="w-4 h-4 text-cyan-400" />,
    description: 'Meta 11B Vision model for fine visual recognition & problem solving',
  },
  {
    id: '@cf/meta/llama-4-scout-17b-16e-instruct',
    name: 'Llama 4 Scout',
    badge: 'Multimodal MoE',
    category: 'vision',
    size: '17B MoE',
    icon: <Layers className="w-4 h-4 text-indigo-400" />,
    description: '17B parameter mixture-of-experts multimodal architecture',
  },

  // Math & Deep Reasoning Models
  {
    id: '@cf/deepseek-ai/deepseek-r1-distill-qwen-32b',
    name: 'DeepSeek R1',
    badge: 'Math Proofs',
    category: 'math',
    size: '32B',
    icon: <Brain className="w-4 h-4 text-purple-400" />,
    description: 'Deep step-by-step mathematical reasoning, proofs, and calculus',
  },
  {
    id: '@cf/qwen/qwq-32b',
    name: 'Qwen QwQ',
    badge: 'Circuits & Physics',
    category: 'math',
    size: '32B',
    icon: <Layers className="w-4 h-4 text-blue-400" />,
    description: 'Specialized in circuit analysis, thermodynamics, and analytical equations',
  },
  {
    id: '@cf/openai/gpt-oss-120b',
    name: 'OpenAI GPT-OSS',
    badge: 'Massive MoE',
    category: 'math',
    size: '120B',
    icon: <Sparkles className="w-4 h-4 text-rose-400" />,
    description: 'Massive 120B open-weight reasoning and logic model',
  },

  // Code Masters
  {
    id: '@cf/qwen/qwen2.5-coder-32b-instruct',
    name: 'Qwen 2.5 Coder',
    badge: '#1 Code Master',
    category: 'code',
    size: '32B',
    icon: <Code2 className="w-4 h-4 text-teal-400" />,
    description: 'Top-tier code generation for C, C++, Java, Python, and DSA algorithms',
  },
  {
    id: '@cf/mistralai/mistral-small-3.1-24b-instruct',
    name: 'Mistral Small 3.1',
    badge: 'Logic & Code',
    category: 'code',
    size: '24B',
    icon: <Terminal className="w-4 h-4 text-emerald-400" />,
    description: 'State-of-the-art coding and logic reasoning by Mistral AI',
  },
  {
    id: '@cf/mistral/mistral-7b-instruct-v0.2',
    name: 'Mistral 7B Code',
    badge: 'Fast Code',
    category: 'code',
    size: '7B',
    icon: <Binary className="w-4 h-4 text-cyan-400" />,
    description: 'Lightweight and fast code solver for programming exams',
  },

  // Flagship University Tutors
  {
    id: '@cf/meta/llama-3.3-70b-instruct',
    name: 'Meta Llama 3.3',
    badge: 'Flagship Tutor',
    category: 'general',
    size: '70B',
    icon: <Cpu className="w-4 h-4 text-indigo-400" />,
    description: 'Flagship 70B parameter general university professor across all topics',
  },
  {
    id: '@cf/google/gemma-4-26b-a4b-it',
    name: 'Google Gemma 4',
    badge: 'Gemini-Core',
    category: 'general',
    size: '26B',
    icon: <BookOpen className="w-4 h-4 text-amber-300" />,
    description: 'Google intelligence built from Gemini 3 core architecture',
  },
  {
    id: '@cf/meta/llama-3.1-8b-instruct',
    name: 'Llama 3.1 Fast',
    badge: 'Lightning Fast',
    category: 'general',
    size: '8B',
    icon: <Flame className="w-4 h-4 text-rose-400" />,
    description: 'Ultra-fast low-latency answers and key formula flashcards',
  },
];

const PREFERRED_MODEL_KEY = 'cse_preferred_ai_model_v1';

export const AITutorModal: React.FC<AITutorModalProps> = ({
  isOpen,
  onClose,
  paper,
  imageSrc,
}) => {
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    return localStorage.getItem(PREFERRED_MODEL_KEY) || 'auto';
  });

  const [activeCategory, setActiveCategory] = useState<ModelCategory>('all');
  const [showModelDrawer, setShowModelDrawer] = useState(false);
  const [includeImage, setIncludeImage] = useState(true);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [modelUsedName, setModelUsedName] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    localStorage.setItem(PREFERRED_MODEL_KEY, selectedModel);
  }, [selectedModel]);

  if (!isOpen || !paper) return null;

  const currentSelectedModelInfo =
    selectedModel === 'auto'
      ? {
          name: 'Smart Auto-Route Engine',
          badge: 'Auto-Selects Best Model',
          size: 'Adaptive',
          icon: <Sparkles className="w-4 h-4 text-amber-400" />,
          description: 'Auto-detects whether you need Vision, Math, Code, or Theory',
        }
      : ALL_FREE_MODELS.find((m) => m.id === selectedModel) || ALL_FREE_MODELS[0];

  const filteredModels =
    activeCategory === 'all'
      ? ALL_FREE_MODELS
      : ALL_FREE_MODELS.filter((m) => m.category === activeCategory);

  const handleAskAI = async (customQuestion?: string) => {
    const queryText = (customQuestion || prompt).trim();
    if (!queryText && (!includeImage || !imageSrc)) return;

    setLoading(true);
    setAnswer(null);
    setModelUsedName(null);

    // Preload & compress image to Base64 JPEG data URL if needed
    let payloadImage = includeImage && imageSrc ? imageSrc : undefined;
    if (payloadImage && !payloadImage.startsWith('data:')) {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = payloadImage!;
        });
        const canvas = document.createElement('canvas');
        canvas.width = Math.min(img.width, 1024);
        canvas.height = Math.min(img.height, Math.round((img.height * canvas.width) / img.width));
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          payloadImage = canvas.toDataURL('image/jpeg', 0.85);
        }
      } catch (e) {
        console.warn('Canvas image encoding fallback:', e);
      }
    }

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
          image: payloadImage,
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
      label: 'Perfect & Fix This Code in C',
      text: 'Analyze the handwritten C code in this scan. Provide the complete, bug-free, and optimized C program with proper edge case handling (0 and negative numbers), comments, and trace table.',
    },
    {
      label: 'Trace Algorithm & Step-by-Step Table',
      text: 'Trace the algorithm in this paper with step-by-step variable values and dry run table.',
    },
    {
      label: 'Read Diagram / Formula & Solve',
      text: 'Analyze the circuit or mathematical problem in this scan and compute the step-by-step solution.',
    },
    {
      label: 'Common Exam Traps & Edge Cases',
      text: 'What are the common student mistakes in this specific question and how to get full marks?',
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
                  AI Academic Tutor &amp; Problem Solver
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  13 Free Cloudflare Models
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

        {/* Selected Model Showcase & Switcher Toggle Bar */}
        <div className="px-4 sm:px-5 py-2.5 bg-slate-950/95 border-b border-slate-800/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 shrink-0">
              Active Engine:
            </span>
            <div className="flex items-center gap-2 bg-slate-900 border border-indigo-500/40 px-3 py-1 rounded-xl truncate">
              {currentSelectedModelInfo.icon}
              <span className="text-xs font-bold text-slate-100 truncate">
                {currentSelectedModelInfo.name}
              </span>
              <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/15 px-1.5 py-0.2 rounded border border-indigo-500/30 hidden sm:inline-block">
                {currentSelectedModelInfo.size}
              </span>
            </div>
          </div>

          <button
            onClick={() => setShowModelDrawer(!showModelDrawer)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 transition-colors shrink-0"
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>{showModelDrawer ? 'Hide Models' : 'Choose Model (13)'}</span>
            {showModelDrawer ? <ChevronUp className="w-3.5 h-3.5 ml-0.5" /> : <ChevronDown className="w-3.5 h-3.5 ml-0.5" />}
          </button>
        </div>

        {/* Expandable Model Selection Drawer */}
        {showModelDrawer && (
          <div className="bg-slate-950 border-b border-slate-800 p-4 space-y-3 animate-fade-in">
            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {[
                { id: 'all', label: 'All Engines (13)' },
                { id: 'vision', label: '👁️ Vision & Scans (3)' },
                { id: 'math', label: '🧮 Math & Proofs (3)' },
                { id: 'code', label: '💻 Coding & DSA (3)' },
                { id: 'general', label: '🎓 University Tutors (3)' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id as ModelCategory)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold shrink-0 transition-colors ${
                    activeCategory === cat.id
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Models Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto pr-1">
              {/* Smart Auto Card */}
              {activeCategory === 'all' && (
                <button
                  onClick={() => {
                    setSelectedModel('auto');
                    setShowModelDrawer(false);
                  }}
                  className={`text-left p-2.5 rounded-xl border transition-all ${
                    selectedModel === 'auto'
                      ? 'bg-indigo-950/80 border-indigo-500 shadow-md shadow-indigo-500/20'
                      : 'bg-slate-900/80 hover:bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Smart Auto-Route</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/15 px-1.5 py-0.2 rounded">
                      Auto
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                    Auto-picks Vision, DeepSeek Math, or Qwen Coder based on prompt.
                  </p>
                </button>
              )}

              {filteredModels.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setSelectedModel(m.id);
                    setShowModelDrawer(false);
                  }}
                  className={`text-left p-2.5 rounded-xl border transition-all ${
                    selectedModel === m.id
                      ? 'bg-indigo-950/80 border-indigo-500 shadow-md shadow-indigo-500/20'
                      : 'bg-slate-900/80 hover:bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-100 truncate">
                      {m.icon}
                      <span className="truncate">{m.name}</span>
                    </div>
                    <span className="text-[10px] font-mono text-indigo-300 bg-indigo-500/15 px-1.5 py-0.2 rounded border border-indigo-500/20 shrink-0">
                      {m.size}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                    {m.description}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

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
                    Vision models (Moondream, Llama 3.2 Vision, Llama 4 Scout) will inspect handwriting and formulas directly.
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
                Solve with {currentSelectedModelInfo.name.split(' ')[0]}
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
                Running {currentSelectedModelInfo.name} on Cloudflare GPU network...
              </p>
            </div>
          )}

          {answer && !loading && (() => {
            let thinkContent: string | null = null;
            let mainContent = answer;

            if (answer.includes('<think>') && answer.includes('</think>')) {
              const parts = answer.split('</think>');
              thinkContent = parts[0].replace('<think>', '').trim();
              mainContent = parts.slice(1).join('</think>').trim();
            } else if (answer.startsWith('<think>')) {
              thinkContent = answer.replace('<think>', '').trim();
            }

            return (
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

                {/* Optional DeepSeek R1 Thought Process */}
                {thinkContent && (
                  <details className="bg-slate-900/60 border border-purple-500/30 rounded-xl p-3 text-xs text-purple-200 group">
                    <summary className="cursor-pointer font-bold text-purple-300 flex items-center gap-1.5 select-none">
                      <Brain className="w-3.5 h-3.5 text-purple-400" />
                      <span>DeepSeek Chain-of-Thought Reasoning</span>
                      <span className="text-[10px] text-purple-400/70 font-normal ml-auto group-open:hidden">
                        (Click to expand)
                      </span>
                    </summary>
                    <div className="mt-2.5 pt-2 border-t border-purple-500/20 text-slate-300 leading-relaxed whitespace-pre-wrap font-mono text-[11px]">
                      {thinkContent}
                    </div>
                  </details>
                )}

                {/* Main Solution Output with Rich Markdown & Code Blocks */}
                <div className="max-h-96 overflow-y-auto pr-1">
                  <MarkdownRenderer content={mainContent || answer} />
                </div>
              </div>
            );
          })()}
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
