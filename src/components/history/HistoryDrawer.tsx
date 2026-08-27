import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../lib/storage';
import { ExtractionResult } from '../../types/extractor';
import { X, Trash2, Search } from 'lucide-react';
import { useToast } from '../ui/Toast';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectResult: (result: ExtractionResult) => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  onSelectResult,
}) => {
  const { toast } = useToast();
  const [search, setSearch] = useState('');

  const historyItems = useLiveQuery(
    () => db.history.orderBy('timestamp').reverse().toArray(),
    []
  );

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await db.history.delete(id);
    toast('History item deleted', 'info');
  };

  const handleClearAll = async () => {
    if (window.confirm('Clear all local scan history?')) {
      await db.history.clear();
      toast('History cleared', 'info');
    }
  };

  const filtered = (historyItems || []).filter((item) =>
    item.title.toLowerCase().includes(search.toLowerCase()) ||
    item.contentType.toLowerCase().includes(search.toLowerCase()) ||
    item.rawText.toLowerCase().includes(search.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-sm bg-[#0E131F] border-l border-[#1E2638] h-full flex flex-col shadow-2xl text-xs">
        {/* Header */}
        <div className="flex items-center justify-between p-3.5 border-b border-[#1E2638] bg-[#090D14]">
          <span className="font-semibold text-white text-sm">Scan History</span>

          <div className="flex items-center gap-1">
            {(historyItems?.length || 0) > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="text-[11px] text-gray-500 hover:text-rose-400 px-2 py-1 transition-colors"
                title="Clear All"
              >
                Clear All
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white p-1 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-2.5 border-b border-[#1E2638] bg-[#0B0F17]">
          <div className="relative">
            <Search className="w-3 h-3 text-gray-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search history..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1.5 bg-[#121824] border border-[#1E2638] rounded-md text-xs text-white placeholder-gray-500 focus:outline-none focus:border-gray-500"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-gray-500 text-xs">
              <p>No history records found.</p>
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  onSelectResult(item);
                  onClose();
                }}
                className="p-2.5 rounded-lg bg-[#090D14] hover:bg-[#141C2B] border border-[#1E2638] hover:border-gray-600 cursor-pointer transition-colors flex items-center justify-between gap-2.5 group"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-gray-500 mb-0.5">
                    <span>{item.contentType}</span>
                    <span>•</span>
                    <span>
                      {new Date(item.timestamp).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <p className="font-medium text-gray-200 truncate">
                    {item.title}
                  </p>

                  <p className="text-[11px] text-gray-500 truncate mt-0.5 font-mono">
                    {item.rawText.replace(/\s+/g, ' ').slice(0, 40)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={(e) => handleDelete(item.id, e)}
                  className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-rose-400 p-1 transition-opacity shrink-0"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

