import React, { useState } from 'react';
import { Copy, Check, Terminal, Code2 } from 'lucide-react';
import { showToast } from './Toast';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  if (!content) return null;

  // Split content into code blocks vs standard text blocks
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-3.5 text-xs text-slate-200 leading-relaxed font-sans">
      {parts.map((part, index) => {
        if (part.startsWith('```')) {
          // Extract language and code
          const firstLineEnd = part.indexOf('\n');
          const lang = part.slice(3, firstLineEnd).trim() || 'code';
          const code = part.slice(firstLineEnd + 1, part.length - 3).trim();

          return <CodeBlock key={index} code={code} language={lang} />;
        }

        // Regular Markdown Section
        return <TextBlock key={index} text={part} />;
      })}
    </div>
  );
};

interface CodeBlockProps {
  code: string;
  language: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code, language }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    showToast('Code Copied', 'Source code copied to clipboard.');
    setTimeout(() => setCopied(false), 2000);
  };

  // Syntax highlighting for common C, C++, Python, Java keywords
  const highlightSyntax = (rawCode: string) => {
    const lines = rawCode.split('\n');
    return lines.map((line, lineIdx) => {
      // Highlight comments
      if (line.trim().startsWith('//') || line.trim().startsWith('#') && !line.includes('<')) {
        return (
          <div key={lineIdx} className="table-row">
            <span className="table-cell pr-4 text-right text-slate-600 select-none font-mono text-[11px]">
              {lineIdx + 1}
            </span>
            <span className="table-cell text-slate-500 italic font-mono">{line}</span>
          </div>
        );
      }

      // Token replacement for keywords, types, strings
      const parts = line.split(/(".*?"|'.*?'|\b(?:int|float|double|char|void|bool|if|else|while|for|do|return|break|continue|switch|case|default|struct|typedef|include|printf|scanf|cout|cin|std)\b)/g);

      return (
        <div key={lineIdx} className="table-row hover:bg-slate-900/40">
          <span className="table-cell pr-4 text-right text-slate-600 select-none font-mono text-[11px] w-8">
            {lineIdx + 1}
          </span>
          <span className="table-cell font-mono text-slate-200">
            {parts.map((token, tIdx) => {
              if (token.startsWith('"') || token.startsWith("'")) {
                return (
                  <span key={tIdx} className="text-emerald-300">
                    {token}
                  </span>
                );
              }
              if (/^(int|float|double|char|void|bool|struct|typedef)$/.test(token)) {
                return (
                  <span key={tIdx} className="text-cyan-400 font-bold">
                    {token}
                  </span>
                );
              }
              if (/^(if|else|while|for|do|return|break|continue|switch|case|default)$/.test(token)) {
                return (
                  <span key={tIdx} className="text-purple-400 font-bold">
                    {token}
                  </span>
                );
              }
              if (/^(include|printf|scanf|cout|cin|std)$/.test(token)) {
                return (
                  <span key={tIdx} className="text-amber-300 font-semibold">
                    {token}
                  </span>
                );
              }
              return <span key={tIdx}>{token}</span>;
            })}
          </span>
        </div>
      );
    });
  };

  return (
    <div className="my-3 rounded-2xl border border-slate-700/80 bg-slate-950 overflow-hidden shadow-2xl">
      {/* Top Code Header Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900/90 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 mr-2">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-300">
            <Terminal className="w-3.5 h-3.5 text-indigo-400" />
            <span className="uppercase">{language}</span>
          </div>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 transition-colors"
          title="Copy Code"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-300">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Code</span>
            </>
          )}
        </button>
      </div>

      {/* Code Area */}
      <div className="p-4 overflow-x-auto font-mono text-[12px] leading-relaxed select-text table w-full">
        {highlightSyntax(code)}
      </div>
    </div>
  );
};

interface TextBlockProps {
  text: string;
}

const TextBlock: React.FC<TextBlockProps> = ({ text }) => {
  const lines = text.split('\n');

  return (
    <div className="space-y-2">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return null;

        // Header 3
        if (trimmed.startsWith('### ')) {
          return (
            <h3 key={idx} className="text-sm font-extrabold text-white mt-4 mb-2 flex items-center gap-1.5">
              <span className="text-indigo-400">#</span>
              <span>{formatInlineMarkdown(trimmed.slice(4))}</span>
            </h3>
          );
        }

        // Header 4
        if (trimmed.startsWith('#### ')) {
          return (
            <h4 key={idx} className="text-xs font-bold text-indigo-300 uppercase tracking-wider mt-3 mb-1.5">
              {formatInlineMarkdown(trimmed.slice(5))}
            </h4>
          );
        }

        // Blockquote
        if (trimmed.startsWith('> ')) {
          return (
            <div
              key={idx}
              className="border-l-2 border-indigo-500 bg-indigo-950/20 px-3 py-2 rounded-r-xl text-indigo-200 text-xs italic my-2"
            >
              {formatInlineMarkdown(trimmed.slice(2))}
            </div>
          );
        }

        // Unordered Bullet Point
        if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
          return (
            <div key={idx} className="flex items-start gap-2 ml-2 my-1">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
              <span className="text-slate-300">{formatInlineMarkdown(trimmed.slice(2))}</span>
            </div>
          );
        }

        // Numbered List
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (numMatch) {
          return (
            <div key={idx} className="flex items-start gap-2 ml-2 my-1">
              <span className="font-mono font-bold text-indigo-400 shrink-0 text-xs">
                {numMatch[1]}.
              </span>
              <span className="text-slate-300">{formatInlineMarkdown(numMatch[2])}</span>
            </div>
          );
        }

        // Horizontal Divider
        if (trimmed === '---' || trimmed === '***') {
          return <hr key={idx} className="border-slate-800 my-3" />;
        }

        // Regular Paragraph
        return (
          <p key={idx} className="text-slate-300 leading-relaxed">
            {formatInlineMarkdown(trimmed)}
          </p>
        );
      })}
    </div>
  );
};

// Format bold **text**, inline `code`, and math $x$
function formatInlineMarkdown(text: string): React.ReactNode {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`|\$.*?\$)/g);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-bold text-white">
          {part.slice(2, part.length - 2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={index}
          className="font-mono text-[11px] bg-slate-800/80 text-cyan-300 px-1.5 py-0.5 rounded border border-slate-700/60"
        >
          {part.slice(1, part.length - 1)}
        </code>
      );
    }
    if (part.startsWith('$') && part.endsWith('$')) {
      return (
        <span key={index} className="font-mono text-purple-300 font-semibold px-1">
          {part.slice(1, part.length - 1)}
        </span>
      );
    }
    return part;
  });
}
