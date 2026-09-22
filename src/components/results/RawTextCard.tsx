import React, { useState } from 'react';
import { CodeData, GeneralTextData } from '../../types/extractor';
import {
  Copy,
  Eraser,
  Sparkles,
  Check,
  Plus,
  Trash2,
  List,
  AlignLeft,
} from 'lucide-react';
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
  const [viewMode, setViewMode] = useState<'text' | 'lines'>('text');

  if (prevPropsText !== textFromProps) {
    setPrevPropsText(textFromProps);
    setCurrentText(textFromProps);
  }

  // Split lines
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

  const handleAddLine = () => {
    setCurrentText((prev) => (prev ? `${prev}\nNew line` : 'New line'));
    toast('Added new line', 'info');
  };

  const handleLineChange = (index: number, newContent: string) => {
    const updated = [...lines];
    updated[index] = newContent;
    setCurrentText(updated.join('\n'));
  };

  const handleDeleteLine = (index: number) => {
    const updated = lines.filter((_, i) => i !== index);
    setCurrentText(updated.join('\n'));
    toast(`Deleted line ${index + 1}`, 'info');
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
          <textarea
            rows={Math.max(6, Math.min(18, codeLines.length))}
            value={currentText}
            onChange={(e) => setCurrentText(e.target.value)}
            className="w-full bg-transparent font-mono text-xs text-gray-200 leading-relaxed focus:outline-none resize-none"
            spellCheck={false}
          />
        </div>
      </div>
    );
  }

  // General text
  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="space-y-2 p-2.5 rounded-lg bg-[#121824] border border-[#1E2638]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-300">
              Document Text ({currentText ? currentText.trim().split(/\s+/).length : 0} words, {lines.length} lines)
            </span>
            {emptyLineCount > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                {emptyLineCount} empty row{emptyLineCount > 1 ? 's' : ''}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {/* View Mode Toggle */}
            <div className="flex rounded bg-[#090D14] border border-[#1E2638] p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('text')}
                className={`flex items-center gap-1 px-2 py-0.5 rounded transition-colors ${
                  viewMode === 'text' ? 'bg-[#1E2638] text-white font-medium' : 'text-gray-400 hover:text-gray-200'
                }`}
                title="Continuous text view"
              >
                <AlignLeft className="w-3 h-3" />
                <span>Text</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('lines')}
                className={`flex items-center gap-1 px-2 py-0.5 rounded transition-colors ${
                  viewMode === 'lines' ? 'bg-[#1E2638] text-white font-medium' : 'text-gray-400 hover:text-gray-200'
                }`}
                title="Line by line editor"
              >
                <List className="w-3 h-3" />
                <span>Lines</span>
              </button>
            </div>

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

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-1.5 pt-2 border-t border-[#1E2638]/70 text-xs">
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
              title="Delete all blank / empty lines"
            >
              <Eraser className="w-3 h-3 text-amber-400" />
              <span>Remove Empty Rows</span>
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
          </div>

          <div className="flex items-center gap-1.5">
            {/* Add Line Button */}
            <button
              type="button"
              onClick={handleAddLine}
              className="flex items-center gap-1 px-2 py-1 rounded bg-[#161D2C] hover:bg-[#1E2638] text-gray-300 text-xs border border-[#242F44] transition-colors"
              title="Append a new line"
            >
              <Plus className="w-3 h-3 text-emerald-400" />
              <span>Add Line</span>
            </button>
          </div>
        </div>
      </div>

      {payload.data.summary && (
        <div className="p-3 rounded-lg bg-[#121824] border border-[#1E2638] text-xs text-gray-300">
          <span className="font-semibold text-gray-200 block mb-1">Summary:</span>
          {payload.data.summary}
        </div>
      )}

      {/* Main Content Area */}
      {viewMode === 'text' ? (
        <div className="rounded-lg border border-[#1E2638] bg-[#090D14] p-3 max-h-80 overflow-y-auto">
          <textarea
            rows={Math.max(6, Math.min(22, lines.length + 1))}
            value={currentText}
            onChange={(e) => setCurrentText(e.target.value)}
            className="w-full bg-transparent text-xs text-gray-200 leading-relaxed font-sans focus:outline-none resize-none"
            placeholder="Type or edit document text here..."
          />
        </div>
      ) : (
        /* Line by line editor */
        <div className="rounded-lg border border-[#1E2638] bg-[#090D14] max-h-80 overflow-y-auto divide-y divide-[#1A2234]">
          {lines.map((line, idx) => {
            const isLineBlank = line.trim().length === 0;
            return (
              <div
                key={idx}
                className={`p-1.5 px-2.5 flex items-center gap-2 group transition-colors ${
                  isLineBlank ? 'bg-amber-950/20' : 'hover:bg-[#121824]'
                }`}
              >
                <span className="w-7 text-right font-mono text-[11px] text-gray-500 select-none shrink-0">
                  {idx + 1}
                </span>
                <input
                  type="text"
                  value={line}
                  onChange={(e) => handleLineChange(idx, e.target.value)}
                  placeholder={isLineBlank ? '(empty row)' : ''}
                  className="flex-1 bg-transparent text-xs text-gray-200 focus:bg-[#1E2638] focus:outline-none rounded px-1.5 py-0.5"
                />
                <button
                  type="button"
                  onClick={() => handleDeleteLine(idx)}
                  className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 p-1 transition-opacity shrink-0"
                  title="Delete this line"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
          {lines.length === 0 && (
            <div className="p-4 text-center text-gray-500 text-xs">
              No lines. Click &quot;Add Line&quot; to add one.
            </div>
          )}
        </div>
      )}

      {/* Footer Helper */}
      <div className="flex items-center justify-between text-[11px] text-gray-500 px-1">
        <span>💡 Switch to &quot;Lines&quot; to delete individual rows, or edit directly in &quot;Text&quot; mode.</span>
      </div>
    </div>
  );
};
