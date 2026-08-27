import React from 'react';
import { UrlData, GeoData, BarcodeData } from '../../types/extractor';
import { ExternalLink, Globe, MapPin, Copy, Lock, AlertCircle, Barcode as BarcodeIcon } from 'lucide-react';
import { copyToClipboard } from '../../lib/export-utils';
import { useToast } from '../ui/Toast';

export const UrlCard: React.FC<{ data: UrlData }> = ({ data }) => {
  const { toast } = useToast();

  const handleCopy = async () => {
    const ok = await copyToClipboard(data.url);
    if (ok) toast('URL copied', 'success');
  };

  return (
    <div className="space-y-3">
      <div className="p-3.5 rounded-lg bg-[#121824] border border-[#1E2638] space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-gray-400">Web Link</span>
          <span className="text-[10px] font-mono text-gray-500">
            {data.isSecure ? 'HTTPS' : 'HTTP'}
          </span>
        </div>

        <div className="font-mono text-sm text-white break-all">{data.url}</div>

        <div className="flex items-center gap-2 pt-2 border-t border-[#1E2638]">
          <a
            href={data.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded bg-white hover:bg-gray-100 text-black font-medium text-xs transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open Link</span>
          </a>

          <button
            type="button"
            onClick={handleCopy}
            className="p-1.5 rounded bg-[#1A2234] hover:bg-[#242F44] text-gray-300 transition-colors"
            title="Copy URL"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export const GeoCard: React.FC<{ data: GeoData }> = ({ data }) => {
  const { toast } = useToast();

  const handleCopy = async () => {
    const ok = await copyToClipboard(`${data.latitude}, ${data.longitude}`);
    if (ok) toast('Coordinates copied', 'success');
  };

  return (
    <div className="space-y-3">
      <div className="p-3.5 rounded-lg bg-[#121824] border border-[#1E2638] space-y-2">
        <span className="text-[11px] text-gray-400">Map Coordinates</span>

        <div className="font-mono text-base font-bold text-white">
          {data.latitude}, {data.longitude}
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-[#1E2638]">
          <a
            href={data.mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded bg-white hover:bg-gray-100 text-black font-medium text-xs transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open in Maps</span>
          </a>

          <button
            type="button"
            onClick={handleCopy}
            className="p-1.5 rounded bg-[#1A2234] hover:bg-[#242F44] text-gray-300 transition-colors"
            title="Copy Coordinates"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export const BarcodeCard: React.FC<{ data: BarcodeData }> = ({ data }) => {
  const { toast } = useToast();

  const handleCopy = async () => {
    const ok = await copyToClipboard(data.text);
    if (ok) toast('Barcode copied', 'success');
  };

  return (
    <div className="space-y-3">
      <div className="p-3.5 rounded-lg bg-[#121824] border border-[#1E2638] space-y-2">
        <div className="flex items-center justify-between text-[11px] text-gray-400">
          <span>Barcode Value</span>
          <span className="font-mono">{data.format}</span>
        </div>

        <div className="p-2.5 rounded bg-[#090D14] border border-[#1E2638] flex items-center justify-between">
          <span className="font-mono text-base font-bold text-white tracking-widest">{data.text}</span>
          <button
            type="button"
            onClick={handleCopy}
            className="p-1 text-gray-400 hover:text-white transition-colors"
            title="Copy Barcode"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
