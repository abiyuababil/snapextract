import React from 'react';
import { BankingData } from '../../types/extractor';
import { Copy } from 'lucide-react';
import { copyToClipboard } from '../../lib/export-utils';
import { useToast } from '../ui/Toast';

interface BankingCardProps {
  data: BankingData;
}

export const BankingCard: React.FC<BankingCardProps> = ({ data }) => {
  const { toast } = useToast();

  const handleCopy = async (val: string, label: string) => {
    const ok = await copyToClipboard(val);
    if (ok) toast(`${label} copied`, 'success');
  };

  return (
    <div className="space-y-3">
      {/* Amount & Status */}
      <div className="p-3.5 rounded-lg bg-[#121824] border border-[#1E2638] flex items-center justify-between">
        <div>
          <span className="text-[11px] text-gray-400">Total Transaction ({data.bankName})</span>
          <div className="text-xl font-bold font-mono text-white mt-0.5">
            Rp {data.totalAmount ? data.totalAmount.toLocaleString('id-ID') : data.amount.toLocaleString('id-ID')}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {data.status && (
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-[#1A2333] text-gray-300 border border-[#242F44]">
              {data.status}
            </span>
          )}
          <button
            type="button"
            onClick={() => handleCopy(data.amount.toString(), 'Amount')}
            className="p-1.5 rounded bg-[#1A2234] hover:bg-[#242F44] text-gray-300 text-xs transition-colors"
            title="Copy Amount"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Structured Key-Value Details */}
      <div className="rounded-lg border border-[#1E2638] bg-[#090D14] divide-y divide-[#1A2234] text-xs">
        {data.referenceNumber && (
          <div className="p-2.5 flex items-center justify-between">
            <span className="text-gray-400">Ref Number</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-gray-200">{data.referenceNumber}</span>
              <button
                type="button"
                onClick={() => handleCopy(data.referenceNumber!, 'Ref Number')}
                className="text-gray-500 hover:text-white p-0.5"
              >
                <Copy className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {data.recipientName && (
          <div className="p-2.5 flex items-center justify-between">
            <span className="text-gray-400">Recipient</span>
            <span className="font-medium text-gray-200">{data.recipientName}</span>
          </div>
        )}

        {data.recipientAccount && (
          <div className="p-2.5 flex items-center justify-between">
            <span className="text-gray-400">Destination Account</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-gray-200">{data.recipientAccount}</span>
              <button
                type="button"
                onClick={() => handleCopy(data.recipientAccount!, 'Account')}
                className="text-gray-500 hover:text-white p-0.5"
              >
                <Copy className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {data.senderName && (
          <div className="p-2.5 flex items-center justify-between">
            <span className="text-gray-400">Sender</span>
            <span className="text-gray-200">{data.senderName}</span>
          </div>
        )}

        {data.adminFee !== undefined && data.adminFee > 0 && (
          <div className="p-2.5 flex items-center justify-between">
            <span className="text-gray-400">Admin Fee</span>
            <span className="font-mono text-gray-200">Rp {data.adminFee.toLocaleString('id-ID')}</span>
          </div>
        )}

        {(data.date || data.time) && (
          <div className="p-2.5 flex items-center justify-between">
            <span className="text-gray-400">Transaction Time</span>
            <span className="font-mono text-gray-300">{data.date} {data.time}</span>
          </div>
        )}
      </div>
    </div>
  );
};

