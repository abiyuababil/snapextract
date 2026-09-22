import React, { useState } from 'react';
import { CodeData, GeneralTextData } from '../../types/extractor';
import { Copy, Eraser, Sparkles, Check } from 'lucide-react';
import { copyToClipboard } from '../../lib/export-utils';
import { useToast } from '../ui/Toast';

export const RawTextCard: React.FC<{
  payload: { type: 'code'; data: CodeData } | { type: 'general'; data: GeneralTextData };
  rawText: string;
}> = ({ payload, rawText }) => {
  const { toast } = useToast();

  const textFromProps =
    payload.type === 'code' ? payload.data.code : payload.data.fullText || rawText;

  const [prevPropsText, setPrevPropsText] = useState(textFromProps);
  const [currentText, setCurrentText] = useState(textFromProps);
  const [isCopied, setIsCopied] = useState(false);

  if (prevPropsText !== textFromProps) {
    setPrevPropsText(textFromProps);
    setCurrentText(textFromProps);
  }

  // Count empty lines and <br> tags
  const lines = currentText ? currentText.split(/\r?\n/) : [];
  const emptyLineCount = lines.filter((l) => l.trim().length === 0).length;
  const brMatches = currentText ? currentText.match(/<br\s*\/?>/gi) : null;
  const brCount = brMatches ? brMatches.length : 0;

  const handleCopy = async () => {
    const ok = await copyToClipboard(currentText);
    if (ok) {
      setIsCopied(true);
      toast('Text copied to clipboard', 'success');
      setTimeout(() => setIsCopied(false), 1500);
    }
  };

  const handleRemoveEmptyLines = () => {
    const allLines = currentText.split(/\r?\n/);
    const nonEmptyLines = allLines.filter((l) => l.trim().length > 0);
    const removedCount = allLines.length - nonEmptyLines.length;

    if (removedCount > 0) {
      setCurrentText(nonEmptyLines.join('\n'));
      toast(`Removed ${removedCount} empty line${removedCount > 1 ? 's' : ''}`, 'success');
    } else {
      toast('No empty lines found', 'info');
    }
  };

  const handleCleanBr = () => {
    const brRegex = /<br\s*\/?>/gi;
    const matches = currentText.match(brRegex);
    if (matches && matches.length > 0) {
      const cleaned = currentText.replace(brRegex, '\n').replace(/\n{3,}/g, '\n\n');
      setCurrentText(cleaned);
      toast(`Cleaned ${matches.length} <br> tag${matches.length > 1 ? 's' : ''}`, 'success');
    } else {
      toast('No <br> tags found', 'info');
    }
  };

  const handleCleanAll = () => {
    const brRegex = /<br\s*\/?>/gi;
    const cleaned = currentText.replace(brRegex, '\n');
    const filtered = cleaned
      .split(/\r?\n/)
      .filter((l) => l.trim().length > 0)
      .join('\n');

    setCurrentText(filtered);
    toast('Cleaned <br> tags & removed all empty lines', 'success');
  };

  if (payload.type === 'code') {
    const codeLines = currentText.split('\n');
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-[#121824] border border-[#1E2638]">
          <span className="text-xs font-mono font-medium text-gray-300">
            {payload.data.language || 'Snippet'} ({codeLines.length} lines)
          </span>

          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={handleRemoveEmptyLines}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors border ${
                emptyLineCount > 0
                  ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : 'bg-[#161D2C] hover:bg-[#1E2638] text-gray-300 border-[#242F44]'
              }`}
              title="Remove empty lines"
            >
              <Eraser className="w-3 h-3 text-amber-400" />
              <span>Remove Empty Lines</span>
              {emptyLineCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-[10px] font-mono text-amber-300">
                  {emptyLineCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-white hover:bg-gray-100 text-black font-medium text-xs transition-colors"
            >
              {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              <span>{isCopied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-[#1E2638] bg-[#090D14] overflow-x-auto max-h-72 p-3 font-mono text-xs text-gray-200">
          <pre className="leading-relaxed">
            {codeLines.map((line, idx) => (
              <div key={idx} className="table-row">
                <span className="table-cell pr-4 text-right select-none text-gray-600 w-8">
                  {idx + 1}
                </span>
                <span className="table-cell">{line || ' '}</span>
              </div>
            ))}
          </pre>
        </div>
      </div>
    );
  }

  // General text
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-[#121824] border border-[#1E2638]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-300">
            Document Text ({currentText ? currentText.trim().split(/\s+/).length : 0} words)
          </span>
          {emptyLineCount > 0 && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              {emptyLineCount} blank line{emptyLineCount > 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Remove Empty Lines Button */}
          <button
            type="button"
            onClick={handleRemoveEmptyLines}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors border ${
              emptyLineCount > 0
                ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/40'
                : 'bg-[#161D2C] hover:bg-[#1E2638] text-gray-300 border-[#242F44]'
            }`}
            title="Delete all empty/blank lines"
          >
            <Eraser className="w-3 h-3 text-amber-400" />
            <span>Remove Empty Lines</span>
            {emptyLineCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500/30 text-[10px] font-mono text-amber-200">
                {emptyLineCount}
              </span>
            )}
          </button>

          {/* Clean <br> Button */}
          <button
            type="button"
            onClick={handleCleanBr}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors border ${
              brCount > 0
                ? 'bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border-indigo-500/40'
                : 'bg-[#161D2C] hover:bg-[#1E2638] text-gray-300 border-[#242F44]'
            }`}
            title="Clean all <br> tags into line breaks"
          >
            <Sparkles className="w-3 h-3 text-indigo-400" />
            <span>Clean &lt;br&gt;</span>
            {brCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-indigo-500/30 text-[10px] font-mono text-indigo-200">
                {brCount}
              </span>
            )}
          </button>

          {/* Clean All Button */}
          {(emptyLineCount > 0 || brCount > 0) && (
            <button
              type="button"
              onClick={handleCleanAll}
              className="flex items-center gap-1 px-2 py-1 rounded bg-[#161D2C] hover:bg-[#1E2638] text-gray-300 text-xs border border-[#242F44] transition-colors"
              title="Remove blank lines and clean <br> tags at once"
            >
              <span>Clean All</span>
            </button>
          )}

          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-white hover:bg-gray-100 text-black font-medium text-xs transition-colors ml-1"
          >
            {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
            <span>{isCopied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {payload.data.summary && (
        <div className="p-3 rounded-lg bg-[#121824] border border-[#1E2638] text-xs text-gray-300">
          <span className="font-semibold text-gray-200 block mb-1">Summary:</span>
          {payload.data.summary}
        </div>
      )}

      <div className="rounded-lg border border-[#1E2638] bg-[#090D14] p-3.5 max-h-72 overflow-y-auto">
        <textarea
          rows={Math.max(4, Math.min(20, lines.length))}
          value={currentText}
          onChange={(e) => setCurrentText(e.target.value)}
          className="w-full bg-transparent text-xs text-gray-200 leading-relaxed font-sans focus:outline-none resize-none"
          placeholder="No text detected."
        />
      </div>
    </div>
  );
};
