import React from 'react';
import { ReceiptData } from '../../types/extractor';
import { Download, Copy } from 'lucide-react';
import { exportReceiptAsCsv, copyToClipboard } from '../../lib/export-utils';
import { useToast } from '../ui/Toast';

interface ReceiptCardProps {
  data: ReceiptData;
}

export const ReceiptCard: React.FC<ReceiptCardProps> = ({ data }) => {
  const { toast } = useToast();

  const handleCopyTotal = async () => {
    const ok = await copyToClipboard(data.total.toString());
    if (ok) toast('Total copied', 'success');
  };

  const handleExportCsv = () => {
    exportReceiptAsCsv(data, data.storeName || 'receipt');
    toast('CSV file downloaded', 'success');
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="p-3.5 rounded-lg bg-[#121824] border border-[#1E2638] flex items-center justify-between">
        <div>
          <span className="text-[11px] text-gray-400">Store / Merchant</span>
          <div className="text-base font-bold text-white mt-0.5">
            {data.storeName}
          </div>
          {(data.date || data.time) && (
            <p className="text-[11px] font-mono text-gray-400 mt-0.5">
              {data.date} {data.time}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#1A2234] hover:bg-[#242F44] text-[11px] text-gray-300 border border-[#242F44] transition-colors"
        >
          <Download className="w-3 h-3" />
          <span>CSV</span>
        </button>
      </div>

      {/* Item List */}
      {data.items && data.items.length > 0 ? (
        <div className="rounded-lg border border-[#1E2638] bg-[#090D14] divide-y divide-[#1A2234] text-xs">
          {data.items.map((item, idx) => (
            <div key={idx} className="p-2.5 flex items-center justify-between">
              <div>
                <p className="text-gray-200 font-medium">{item.name}</p>
                <p className="text-[11px] text-gray-500 font-mono">
                  {item.qty} x Rp {item.unitPrice.toLocaleString('id-ID')}
                </p>
              </div>
              <span className="font-mono text-gray-200">
                Rp {item.totalPrice.toLocaleString('id-ID')}
              </span>
            </div>
          ))}
        </div>
      ) : null}

      {/* Totals */}
      <div className="rounded-lg border border-[#1E2638] bg-[#090D14] divide-y divide-[#1A2234] text-xs">
        {data.subtotal !== undefined && (
          <div className="p-2.5 flex justify-between text-gray-400">
            <span>Subtotal</span>
            <span className="font-mono text-gray-200">Rp {data.subtotal.toLocaleString('id-ID')}</span>
          </div>
        )}

        {data.tax !== undefined && data.tax > 0 && (
          <div className="p-2.5 flex justify-between text-gray-400">
            <span>Tax (VAT)</span>
            <span className="font-mono text-gray-200">Rp {data.tax.toLocaleString('id-ID')}</span>
          </div>
        )}

        {data.discount !== undefined && data.discount > 0 && (
          <div className="p-2.5 flex justify-between text-emerald-400">
            <span>Discount</span>
            <span className="font-mono">-Rp {data.discount.toLocaleString('id-ID')}</span>
          </div>
        )}

        <div className="p-3 flex items-center justify-between bg-[#121824]">
          <div>
            <span className="text-[11px] text-gray-400">Total Amount:</span>
            <div className="text-lg font-bold font-mono text-white mt-0.5">
              Rp {data.total.toLocaleString('id-ID')}
            </div>
          </div>

          <button
            type="button"
            onClick={handleCopyTotal}
            className="p-1.5 rounded bg-[#1A2234] hover:bg-[#242F44] text-gray-300 text-xs transition-colors"
            title="Copy Total"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

