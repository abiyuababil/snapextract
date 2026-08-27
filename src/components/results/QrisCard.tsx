import React from 'react';
import { QrisData } from '../../types/extractor';
import { Copy } from 'lucide-react';
import { copyToClipboard } from '../../lib/export-utils';
import { useToast } from '../ui/Toast';

interface QrisCardProps {
  data: QrisData;
}

export const QrisCard: React.FC<QrisCardProps> = ({ data }) => {
  const { toast } = useToast();

  const handleCopy = async (val: string, label: string) => {
    const ok = await copyToClipboard(val);
    if (ok) toast(`${label} copied`, 'success');
  };

  return (
    <div className="space-y-3">
      {/* Merchant Header */}
      <div className="p-3.5 rounded-lg bg-[#121824] border border-[#1E2638] flex items-center justify-between">
        <div>
          <span className="text-[11px] text-gray-400">QRIS Merchant</span>
          <div className="text-lg font-bold text-white mt-0.5">
            {data.merchantName}
          </div>
          {data.merchantCity && (
            <p className="text-[11px] text-gray-400 mt-0.5">
              {data.merchantCity} {data.postalCode && `(${data.postalCode})`}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => handleCopy(data.merchantName, 'Merchant Name')}
          className="p-1.5 rounded bg-[#1A2234] hover:bg-[#242F44] text-gray-300 text-xs transition-colors"
          title="Copy Name"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Amount if dynamic */}
      {data.amount !== undefined && data.amount > 0 && (
        <div className="p-3 rounded-lg bg-[#090D14] border border-[#1E2638] flex items-center justify-between">
          <div>
            <span className="text-[11px] text-gray-400">Billed Amount</span>
            <div className="text-lg font-bold font-mono text-white mt-0.5">
              Rp {data.amount.toLocaleString('id-ID')}
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleCopy(data.amount!.toString(), 'Amount')}
            className="p-1.5 rounded bg-[#1A2234] hover:bg-[#242F44] text-gray-300 text-xs transition-colors"
            title="Copy Amount"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Details Table */}
      <div className="rounded-lg border border-[#1E2638] bg-[#090D14] divide-y divide-[#1A2234] text-xs">
        {data.nmid && (
          <div className="p-2.5 flex items-center justify-between">
            <span className="text-gray-400">NMID</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-gray-200">{data.nmid}</span>
              <button
                type="button"
                onClick={() => handleCopy(data.nmid!, 'NMID')}
                className="text-gray-500 hover:text-white p-0.5"
              >
                <Copy className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        <div className="p-2.5 flex items-center justify-between">
          <span className="text-gray-400">QR Type</span>
          <span className="text-gray-200">{data.amount ? 'Dynamic (Preset Amount)' : 'Static'}</span>
        </div>

        <div className="p-2.5 flex items-center justify-between">
          <span className="text-gray-400">Currency</span>
          <span className="font-mono text-gray-200">{data.currency || 'IDR'}</span>
        </div>

        {data.crc && (
          <div className="p-2.5 flex items-center justify-between">
            <span className="text-gray-400">Checksum CRC16</span>
            <span className={`font-mono ${data.isValidCrc ? 'text-emerald-400' : 'text-gray-400'}`}>
              {data.crc} {data.isValidCrc && '✓'}
            </span>
          </div>
        )}
      </div>

      {/* Payload */}
      <div className="p-2.5 rounded-lg bg-[#090D14] border border-[#1E2638] flex items-center justify-between gap-2">
        <span className="font-mono text-[11px] text-gray-400 truncate">
          {data.rawPayload}
        </span>
        <button
          type="button"
          onClick={() => handleCopy(data.rawPayload, 'QRIS Payload')}
          className="text-gray-400 hover:text-white shrink-0 p-1"
          title="Copy Raw Payload"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

