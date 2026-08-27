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
import { Download, Copy, RefreshCw, Sparkles } from 'lucide-react';
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

  const handleExportJson = () => {
    exportResultAsJson(result);
    toast('JSON file downloaded', 'success');
  };

  const handleCopyRaw = async () => {
    const ok = await copyToClipboard(result.rawText);
    if (ok) toast('Text copied', 'success');
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
        return <RawTextCard payload={p as any} rawText={result.rawText} />;
    }
  };

  const isLocalEngine = result.engine === 'local-ocr';
  const isAiEngine = result.engine === 'gemini-vision' || result.engine === 'groq-vision';

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

        {activeTab === 'raw' && (
          <div className="space-y-2">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleCopyRaw}
                className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-white"
              >
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </button>
            </div>
            <div className="p-3 rounded-lg bg-[#070A10] border border-[#1E2638] text-xs font-mono text-gray-300 whitespace-pre-wrap leading-relaxed">
              {result.rawText || 'No text detected.'}
            </div>
          </div>
        )}

        {activeTab === 'json' && (
          <div className="space-y-2">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => copyToClipboard(JSON.stringify(result, null, 2))}
                className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-white"
              >
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </button>
            </div>
            <div className="p-3 rounded-lg bg-[#070A10] border border-[#1E2638] text-xs font-mono text-gray-300 overflow-x-auto">
              <pre>{JSON.stringify(result, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

