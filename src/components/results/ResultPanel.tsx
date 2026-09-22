import React, { useState } from 'react';
import { ExtractionResult } from '../../types/extractor';
import { QrisCard } from './QrisCard';
import { WifiCard } from './WifiCard';
import { BankingCard } from './BankingCard';
import { ReceiptCard } from './ReceiptCard';
import { TableCard } from './TableCard';
import { VCardCard } from './VCardCard';
import { UrlCard, GeoCard, BarcodeCard } from './UrlGeoCard';
import { RawTextCard } from './RawTextCard';
import {
  Download,
  Copy,
  RefreshCw,
  Sparkles,
  Check,
  RotateCcw,
  Eraser,
  Code2,
} from 'lucide-react';
import { exportResultAsJson, copyToClipboard } from '../../lib/export-utils';
import { useToast } from '../ui/Toast';

interface ResultPanelProps {
  result: ExtractionResult;
  onReset: () => void;
  onEnhanceWithAi?: () => void;
  isEnhancing?: boolean;
}

type TabType = 'smart' | 'raw' | 'json';

export const ResultPanel: React.FC<ResultPanelProps> = ({
  result,
  onReset,
  onEnhanceWithAi,
  isEnhancing = false,
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('smart');
  const [prevResultId, setPrevResultId] = useState(result.id);

  // Editable Raw Text
  const [editableRaw, setEditableRaw] = useState(result.rawText || '');
  const [isCopiedRaw, setIsCopiedRaw] = useState(false);

  // Editable JSON
  const [editableJson, setEditableJson] = useState(() =>
    JSON.stringify(result, null, 2)
  );
  const [isCopiedJson, setIsCopiedJson] = useState(false);

  // Sync state if result changes
  if (prevResultId !== result.id) {
    setPrevResultId(result.id);
    setEditableRaw(result.rawText || '');
    setEditableJson(JSON.stringify(result, null, 2));
  }

  // Validate JSON
  let isJsonValid = true;
  let jsonErrorMsg = '';
  try {
    JSON.parse(editableJson);
  } catch (err: any) {
    isJsonValid = false;
    jsonErrorMsg = err.message || 'Invalid syntax';
  }

  const handleExportJson = () => {
    try {
      const parsed = JSON.parse(editableJson);
      exportResultAsJson(parsed);
      toast('JSON file downloaded', 'success');
    } catch {
      exportResultAsJson(result);
      toast('JSON file downloaded', 'success');
    }
  };

  const handleCopyRaw = async () => {
    const ok = await copyToClipboard(editableRaw);
    if (ok) {
      setIsCopiedRaw(true);
      toast('Text copied to clipboard', 'success');
      setTimeout(() => setIsCopiedRaw(false), 1500);
    }
  };

  const handleCleanRawBr = () => {
    const brRegex = /<br\s*\/?>/gi;
    const matches = editableRaw.match(brRegex);
    if (matches && matches.length > 0) {
      const cleaned = editableRaw.replace(brRegex, '\n').replace(/\n{3,}/g, '\n\n');
      setEditableRaw(cleaned);
      toast(`Cleaned ${matches.length} <br> tag${matches.length > 1 ? 's' : ''}`, 'success');
    } else {
      toast('No <br> tags found', 'info');
    }
  };

  const handleRemoveRawEmptyLines = () => {
    const lines = editableRaw.split(/\r?\n/);
    const nonEmpty = lines.filter((l) => l.trim().length > 0);
    const removed = lines.length - nonEmpty.length;
    if (removed > 0) {
      setEditableRaw(nonEmpty.join('\n'));
      toast(`Removed ${removed} empty line${removed > 1 ? 's' : ''}`, 'success');
    } else {
      toast('No empty lines found', 'info');
    }
  };

  const handleResetRaw = () => {
    setEditableRaw(result.rawText || '');
    toast('Restored original raw text', 'info');
  };

  const handleCopyJson = async () => {
    const ok = await copyToClipboard(editableJson);
    if (ok) {
      setIsCopiedJson(true);
      toast('JSON copied to clipboard', 'success');
      setTimeout(() => setIsCopiedJson(false), 1500);
    }
  };

  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(editableJson);
      setEditableJson(JSON.stringify(parsed, null, 2));
      toast('JSON formatted', 'success');
    } catch {
      toast('Cannot format invalid JSON', 'error');
    }
  };

  const handleResetJson = () => {
    setEditableJson(JSON.stringify(result, null, 2));
    toast('Restored original JSON', 'info');
  };

  const renderSmartCard = () => {
    const p = result.payload;
    switch (p.type) {
      case 'qris':
        return <QrisCard data={p.data} />;
      case 'wifi':
        return <WifiCard data={p.data} />;
      case 'banking':
        return <BankingCard data={p.data} />;
      case 'receipt':
        return <ReceiptCard data={p.data} />;
      case 'table':
        return <TableCard data={p.data} />;
      case 'vcard':
        return <VCardCard data={p.data} />;
      case 'url':
        return <UrlCard data={p.data} />;
      case 'geo':
        return <GeoCard data={p.data} />;
      case 'barcode':
        return <BarcodeCard data={p.data} />;
      case 'code':
      case 'general':
      default:
        return <RawTextCard payload={p as any} rawText={editableRaw} />;
    }
  };

  const isLocalEngine = result.engine === 'local-ocr';
  const isAiEngine = result.engine === 'gemini-vision' || result.engine === 'groq-vision';

  const rawLines = editableRaw ? editableRaw.split(/\r?\n/) : [];
  const rawEmptyLineCount = rawLines.filter((l) => l.trim().length === 0).length;

  return (
    <div className="flex flex-col h-full bg-[#0E131F] border border-[#1E2638] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-3.5 bg-[#090D14] border-b border-[#1E2638] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-semibold text-xs text-white truncate">
            {result.title}
          </span>
          <span className="text-[10px] font-mono text-gray-500 shrink-0">
            ({result.contentType})
          </span>
          {isAiEngine && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-500/30 flex items-center gap-1 shrink-0">
              <Sparkles className="w-2.5 h-2.5" />
              <span>AI Vision</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {isLocalEngine && onEnhanceWithAi && (
            <button
              type="button"
              onClick={onEnhanceWithAi}
              disabled={isEnhancing}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-950/60 hover:bg-indigo-900/80 text-[11px] font-medium text-indigo-300 border border-indigo-500/30 transition-colors shadow-xs"
              title="Enhance with Gemini / Groq Vision AI"
            >
              <Sparkles className="w-3 h-3 text-indigo-400" />
              <span>{isEnhancing ? 'Enhancing...' : 'Enhance with AI'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleExportJson}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#161D2C] hover:bg-[#1E2638] text-[11px] text-gray-300 border border-[#242F44] transition-colors"
          >
            <Download className="w-3 h-3 text-gray-400" />
            <span>JSON</span>
          </button>

          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-white hover:bg-gray-100 text-[11px] font-medium text-black transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            <span>New</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#1E2638] bg-[#0B0F17] px-3 pt-1 gap-1 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('smart')}
          className={`px-3 py-1.5 rounded-t font-medium transition-colors ${
            activeTab === 'smart'
              ? 'bg-[#0E131F] text-white border-b-2 border-emerald-400'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          Structured
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('raw')}
          className={`px-3 py-1.5 rounded-t font-medium transition-colors ${
            activeTab === 'raw'
              ? 'bg-[#0E131F] text-white border-b-2 border-emerald-400'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          Raw Text
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('json')}
          className={`px-3 py-1.5 rounded-t font-medium transition-colors ${
            activeTab === 'json'
              ? 'bg-[#0E131F] text-white border-b-2 border-emerald-400'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          JSON
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 p-4 overflow-y-auto max-h-[560px]">
        {activeTab === 'smart' && renderSmartCard()}

        {/* Editable Raw Text Tab */}
        {activeTab === 'raw' && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-[#121824] border border-[#1E2638]">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-medium text-gray-300">
                  {rawLines.length} lines, {editableRaw.trim() ? editableRaw.trim().split(/\s+/).length : 0} words
                </span>
                {rawEmptyLineCount > 0 && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    {rawEmptyLineCount} blank
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={handleRemoveRawEmptyLines}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors border ${
                    rawEmptyLineCount > 0
                      ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/40'
                      : 'bg-[#161D2C] hover:bg-[#1E2638] text-gray-300 border-[#242F44]'
                  }`}
                  title="Delete empty lines"
                >
                  <Eraser className="w-3 h-3 text-amber-400" />
                  <span>Remove Empty Lines</span>
                </button>

                <button
                  type="button"
                  onClick={handleCleanRawBr}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-[#161D2C] hover:bg-[#1E2638] text-gray-300 text-xs border border-[#242F44] transition-colors"
                  title="Clean <br> tags"
                >
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                  <span>Clean &lt;br&gt;</span>
                </button>

                {editableRaw !== result.rawText && (
                  <button
                    type="button"
                    onClick={handleResetRaw}
                    className="flex items-center gap-1 px-2 py-1 rounded bg-[#161D2C] hover:bg-[#1E2638] text-gray-300 text-xs border border-[#242F44] transition-colors"
                    title="Reset to original text"
                  >
                    <RotateCcw className="w-3 h-3 text-gray-400" />
                    <span>Reset</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleCopyRaw}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-white hover:bg-gray-100 text-black font-medium text-xs transition-colors ml-1"
                >
                  {isCopiedRaw ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{isCopiedRaw ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div className="rounded-lg border border-[#1E2638] bg-[#070A10] p-3">
              <textarea
                rows={Math.max(8, Math.min(22, rawLines.length + 1))}
                value={editableRaw}
                onChange={(e) => setEditableRaw(e.target.value)}
                className="w-full bg-transparent text-xs font-mono text-gray-200 leading-relaxed focus:outline-none resize-none"
                placeholder="Type or edit raw text here..."
              />
            </div>
            <div className="text-[11px] text-gray-500 px-1">
              <span>💡 You can directly type, add, or delete lines above. All edits are preserved for copying and exporting.</span>
            </div>
          </div>
        )}

        {/* Editable JSON Tab */}
        {activeTab === 'json' && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-[#121824] border border-[#1E2638]">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-xs font-mono text-gray-300">
                  <Code2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>JSON Payload</span>
                </div>
                {isJsonValid ? (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Valid JSON
                  </span>
                ) : (
                  <span
                    className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20"
                    title={jsonErrorMsg}
                  >
                    Syntax Error
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={handleFormatJson}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-[#161D2C] hover:bg-[#1E2638] text-gray-300 text-xs border border-[#242F44] transition-colors"
                  title="Beautify and format JSON"
                >
                  <Sparkles className="w-3 h-3 text-indigo-400" />
                  <span>Format</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetJson}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-[#161D2C] hover:bg-[#1E2638] text-gray-300 text-xs border border-[#242F44] transition-colors"
                  title="Reset to original JSON"
                >
                  <RotateCcw className="w-3 h-3 text-gray-400" />
                  <span>Reset</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyJson}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-white hover:bg-gray-100 text-black font-medium text-xs transition-colors ml-1"
                >
                  {isCopiedJson ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{isCopiedJson ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div className="rounded-lg border border-[#1E2638] bg-[#070A10] p-3">
              <textarea
                rows={16}
                value={editableJson}
                onChange={(e) => setEditableJson(e.target.value)}
                className="w-full bg-transparent text-xs font-mono text-gray-200 leading-relaxed focus:outline-none resize-none"
                placeholder="Edit JSON data..."
                spellCheck={false}
              />
            </div>
            <div className="text-[11px] text-gray-500 px-1">
              <span>💡 You can directly modify, add, or delete keys and values in the JSON structure.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
