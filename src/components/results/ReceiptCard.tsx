import React, { useState } from 'react';
import { ReceiptData, ReceiptItem } from '../../types/extractor';
import { Download, Copy, Trash2, Plus } from 'lucide-react';
import { exportReceiptAsCsv, copyToClipboard } from '../../lib/export-utils';
import { useToast } from '../ui/Toast';

interface ReceiptCardProps {
  data: ReceiptData;
}

export const ReceiptCard: React.FC<ReceiptCardProps> = ({ data }) => {
  const { toast } = useToast();
  const [prevData, setPrevData] = useState(data);
  const [storeName, setStoreName] = useState(data.storeName || 'Store');
  const [items, setItems] = useState<ReceiptItem[]>(data.items || []);

  // Sync state when data prop changes
  if (prevData !== data) {
    setPrevData(data);
    setStoreName(data.storeName || 'Store');
    setItems(data.items || []);
  }

  // Calculate totals dynamically from items
  const computedSubtotal = items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
  const total = data.total !== undefined && items.length === (data.items || []).length
    ? data.total
    : computedSubtotal + (data.tax || 0) + (data.serviceCharge || 0) - (data.discount || 0);

  const handleCopyTotal = async () => {
    const ok = await copyToClipboard(total.toString());
    if (ok) toast('Total copied', 'success');
  };

  const handleExportCsv = () => {
    exportReceiptAsCsv({ ...data, storeName, items, total }, storeName || 'receipt');
    toast('CSV file downloaded', 'success');
  };

  const handleItemChange = (index: number, field: keyof ReceiptItem, val: any) => {
    const next = [...items];
    const item = { ...next[index], [field]: val };
    if (field === 'qty' || field === 'unitPrice') {
      const q = field === 'qty' ? Number(val) || 0 : item.qty;
      const p = field === 'unitPrice' ? Number(val) || 0 : item.unitPrice;
      item.totalPrice = q * p;
    }
    next[index] = item;
    setItems(next);
  };

  const handleDeleteItem = (index: number) => {
    const removed = items[index];
    setItems(items.filter((_, i) => i !== index));
    toast(`Removed ${removed.name || 'item'}`, 'info');
  };

  const handleAddItem = () => {
    setItems([...items, { name: 'New Item', qty: 1, unitPrice: 10000, totalPrice: 10000 }]);
    toast('Added new receipt item', 'info');
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="p-3.5 rounded-lg bg-[#121824] border border-[#1E2638] flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <span className="text-[11px] text-gray-400">Store / Merchant</span>
          <input
            type="text"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            className="text-base font-bold text-white bg-transparent focus:bg-[#1E2638] focus:outline-none rounded px-1 py-0.5 w-full mt-0.5"
          />
          {(data.date || data.time) && (
            <p className="text-[11px] font-mono text-gray-400 mt-0.5 px-1">
              {data.date} {data.time}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleAddItem}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#1A2234] hover:bg-[#242F44] text-[11px] text-gray-300 border border-[#242F44] transition-colors"
            title="Add item"
          >
            <Plus className="w-3 h-3 text-emerald-400" />
            <span>Add Item</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#1A2234] hover:bg-[#242F44] text-[11px] text-gray-300 border border-[#242F44] transition-colors"
          >
            <Download className="w-3 h-3" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Item List */}
      <div className="rounded-lg border border-[#1E2638] bg-[#090D14] divide-y divide-[#1A2234] text-xs">
        {items.map((item, idx) => (
          <div key={idx} className="p-2.5 flex items-center justify-between gap-2 group hover:bg-[#121824] transition-colors">
            <div className="flex-1 min-w-0">
              <input
                type="text"
                value={item.name}
                onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                placeholder="Item name"
                className="text-gray-200 font-medium bg-transparent focus:bg-[#1E2638] focus:outline-none rounded px-1 py-0.5 w-full text-xs"
              />
              <div className="flex items-center gap-1.5 text-[11px] text-gray-500 font-mono mt-0.5 px-1">
                <span>Qty:</span>
                <input
                  type="number"
                  value={item.qty}
                  onChange={(e) => handleItemChange(idx, 'qty', e.target.value)}
                  className="w-12 bg-transparent text-gray-300 border-b border-[#242F44] focus:outline-none text-center"
                />
                <span>× Rp</span>
                <input
                  type="number"
                  value={item.unitPrice}
                  onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                  className="w-20 bg-transparent text-gray-300 border-b border-[#242F44] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="font-mono text-gray-200 text-xs">
                Rp {item.totalPrice.toLocaleString('id-ID')}
              </span>
              <button
                type="button"
                onClick={() => handleDeleteItem(idx)}
                className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 p-1 transition-opacity"
                title="Delete item"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <div className="p-4 text-center text-gray-500 text-xs">
            No items. Click &quot;Add Item&quot; to add one.
          </div>
        )}
      </div>

      {/* Totals */}
      <div className="rounded-lg border border-[#1E2638] bg-[#090D14] divide-y divide-[#1A2234] text-xs">
        <div className="p-2.5 flex justify-between text-gray-400">
          <span>Subtotal ({items.length} items)</span>
          <span className="font-mono text-gray-200">Rp {computedSubtotal.toLocaleString('id-ID')}</span>
        </div>

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
              Rp {total.toLocaleString('id-ID')}
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
