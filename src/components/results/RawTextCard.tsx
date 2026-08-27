import React from 'react';
import { CodeData, GeneralTextData } from '../../types/extractor';
import { Code, FileText, Copy, AlignLeft } from 'lucide-react';
import { copyToClipboard } from '../../lib/export-utils';
import { useToast } from '../ui/Toast';

export const RawTextCard: React.FC<{
  payload: { type: 'code'; data: CodeData } | { type: 'general'; data: GeneralTextData };
  rawText: string;
}> = ({ payload, rawText }) => {
  const { toast } = useToast();

  const handleCopy = async () => {
    const textToCopy = payload.type === 'code' ? payload.data.code : payload.data.fullText || rawText;
    const ok = await copyToClipboard(textToCopy);
    if (ok) toast('Text copied', 'success');
  };

  if (payload.type === 'code') {
    const lines = payload.data.code.split('\n');
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#121824] border border-[#1E2638]">
          <span className="text-xs font-mono font-medium text-gray-300">
            {payload.data.language || 'Snippet'} ({lines.length} lines)
          </span>

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-white hover:bg-gray-100 text-black font-medium text-xs transition-colors"
          >
            <Copy className="w-3 h-3" />
            <span>Copy</span>
          </button>
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
          Document Text ({payload.data.wordCount || rawText.split(/\s+/).length} words)
        </span>

        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-white hover:bg-gray-100 text-black font-medium text-xs transition-colors"
        >
          <Copy className="w-3 h-3" />
          <span>Copy</span>
        </button>
      </div>

      {payload.data.summary && (
        <div className="p-3 rounded-lg bg-[#121824] border border-[#1E2638] text-xs text-gray-300">
          <span className="font-semibold text-gray-200 block mb-1">Summary:</span>
          {payload.data.summary}
        </div>
      )}

      <div className="rounded-lg border border-[#1E2638] bg-[#090D14] p-3.5 max-h-72 overflow-y-auto">
        <p className="text-xs text-gray-300 whitespace-pre-wrap leading-relaxed">
          {payload.data.fullText || rawText}
        </p>
      </div>
    </div>
  );
};
