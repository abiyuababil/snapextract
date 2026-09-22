import React, { useState } from 'react';
import { CodeData, GeneralTextData } from '../../types/extractor';
import { Copy, Sparkles } from 'lucide-react';
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

  if (prevPropsText !== textFromProps) {
    setPrevPropsText(textFromProps);
    setCurrentText(textFromProps);
  }

  const handleCopy = async () => {
    const ok = await copyToClipboard(currentText);
    if (ok) toast('Text copied', 'success');
  };

  const handleCleanText = () => {
    const brRegex = /<br\s*\/?>/gi;
    const hasBr = brRegex.test(currentText);

    // Replace <br> with newlines, remove carriage returns, and collapse multiple blank lines
    let cleaned = currentText.replace(brRegex, '\n').replace(/\r\n/g, '\n');
    // Remove lines that are only whitespace
    const lines = cleaned.split('\n');
    const filteredLines = lines.filter((l) => l.trim().length > 0);
    cleaned = filteredLines.join('\n');

    setCurrentText(cleaned);
    toast(hasBr ? 'Cleaned <br> tags & blank lines' : 'Removed empty lines', 'success');
  };

  if (payload.type === 'code') {
    const lines = currentText.split('\n');
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#121824] border border-[#1E2638]">
          <span className="text-xs font-mono font-medium text-gray-300">
            {payload.data.language || 'Snippet'} ({lines.length} lines)
          </span>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleCleanText}
              className="flex items-center gap-1 px-2 py-1 rounded bg-[#161D2C] hover:bg-[#1E2638] text-gray-300 text-xs border border-[#242F44] transition-colors"
              title="Remove empty lines and clean <br> tags"
            >
              <Sparkles className="w-3 h-3 text-indigo-400" />
              <span>Clean Lines</span>
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-white hover:bg-gray-100 text-black font-medium text-xs transition-colors"
            >
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-[#1E2638] bg-[#090D14] overflow-x-auto max-h-72 p-3 font-mono text-xs text-gray-200">
          <pre className="leading-relaxed">
            {lines.map((line, idx) => (
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
      <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#121824] border border-[#1E2638]">
        <span className="text-xs font-medium text-gray-300">
          Document Text ({currentText ? currentText.trim().split(/\s+/).length : 0} words)
        </span>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleCleanText}
            className="flex items-center gap-1 px-2 py-1 rounded bg-[#161D2C] hover:bg-[#1E2638] text-gray-300 text-xs border border-[#242F44] transition-colors"
            title="Clean <br> tags and remove empty rows"
          >
            <Sparkles className="w-3 h-3 text-indigo-400" />
            <span>Clean &lt;br&gt; & Empty Lines</span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-white hover:bg-gray-100 text-black font-medium text-xs transition-colors"
          >
            <Copy className="w-3 h-3" />
            <span>Copy</span>
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
        <p className="text-xs text-gray-300 whitespace-pre-wrap leading-relaxed">
          {currentText || 'No text detected.'}
        </p>
      </div>
    </div>
  );
};
