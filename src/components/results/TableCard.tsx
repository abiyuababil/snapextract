import React, { useState } from 'react';
import { TableData } from '../../types/extractor';
import { Table, Download, Copy, Search, Check, FileSpreadsheet } from 'lucide-react';
import { exportTableAsCsv, copyToClipboard } from '../../lib/export-utils';
import { useToast } from '../ui/Toast';

interface TableCardProps {
  data: TableData;
}

export const TableCard: React.FC<TableCardProps> = ({ data }) => {
  const { toast } = useToast();
  const [headers, setHeaders] = useState<string[]>(data.headers || []);
  const [rows, setRows] = useState<string[][]>(data.rows || []);
  const [search, setSearch] = useState('');
  const [copiedCell, setCopiedCell] = useState<{ r: number; c: number } | null>(null);

  const handleExportCsv = () => {
    exportTableAsCsv({ headers, rows, rawText: data.rawText }, 'extracted_table');
    toast('CSV file downloaded', 'success');
  };

  const handleCopyExcelTsv = async () => {
    const tsvContent = [
      headers.join('\t'),
      ...rows.map((r) => r.join('\t')),
    ].join('\n');

    const ok = await copyToClipboard(tsvContent);
    if (ok) toast('Table copied for Excel / Sheets! Paste with Ctrl+V', 'success');
  };

  const handleCopyCell = async (val: string, rIdx: number, cIdx: number) => {
    if (!val) return;
    const ok = await copyToClipboard(val);
    if (ok) {
      setCopiedCell({ r: rIdx, c: cIdx });
      toast(`Copied: "${val.slice(0, 30)}${val.length > 30 ? '...' : ''}"`, 'success');
      setTimeout(() => setCopiedCell(null), 1500);
    }
  };

  const handleCopyRow = async (row: string[], rIdx: number) => {
    const ok = await copyToClipboard(row.join('\t'));
    if (ok) toast(`Row ${rIdx + 1} copied for Excel`, 'success');
  };

  const handleCopyColumn = async (cIdx: number) => {
    const colValues = [headers[cIdx] || '', ...rows.map((r) => r[cIdx] || '')];
    const ok = await copyToClipboard(colValues.join('\n'));
    if (ok) toast(`Column "${headers[cIdx] || cIdx + 1}" copied`, 'success');
  };

  const handleCellChange = (rowIndex: number, colIndex: number, val: string) => {
    const next = [...rows];
    next[rowIndex] = [...next[rowIndex]];
    next[rowIndex][colIndex] = val;
    setRows(next);
  };

  const handleHeaderChange = (colIndex: number, val: string) => {
    const next = [...headers];
    next[colIndex] = val;
    setHeaders(next);
  };

  const filteredRows = rows.filter((r) =>
    r.some((cell) => cell.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-3">
      {/* Table Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-[#121824] border border-[#1E2638]">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <FileSpreadsheet className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-semibold text-white truncate">
            Spreadsheet ({rows.length} rows, {headers.length} cols)
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="relative">
            <Search className="w-3 h-3 text-gray-500 absolute left-2.5 top-2" />
            <input
              type="text"
              placeholder="Search table..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-7 pr-2.5 py-1 bg-[#090D14] border border-[#1E2638] rounded text-xs text-white placeholder-gray-500 focus:outline-none focus:border-gray-500 w-28 sm:w-36"
            />
          </div>

          {/* Copy Table for Excel */}
          <button
            type="button"
            onClick={handleCopyExcelTsv}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#161D2C] hover:bg-[#1E2638] text-gray-200 text-xs border border-[#242F44] transition-colors"
            title="Copy entire table to paste directly into Excel or Google Sheets (Ctrl+V)"
          >
            <Copy className="w-3 h-3 text-gray-400" />
            <span>Copy for Excel</span>
          </button>

          {/* Export CSV */}
          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-white hover:bg-gray-100 text-black font-medium text-xs transition-colors"
            title="Download CSV"
          >
            <Download className="w-3 h-3" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Interactive Spreadsheet Viewport */}
      <div className="rounded-lg border border-[#1E2638] overflow-x-auto max-h-80 bg-[#090D14] shadow-inner">
        <table className="w-full text-xs text-left border-collapse select-text">
          <thead>
            <tr className="bg-[#121824] border-b border-[#1E2638] text-gray-300 font-medium sticky top-0 z-10">
              <th className="py-2 px-2.5 w-10 text-center text-gray-500 border-r border-[#1E2638]">
                #
              </th>
              {headers.map((h, i) => (
                <th
                  key={i}
                  className="py-2 px-2.5 border-r border-[#1E2638] last:border-0 min-w-[130px] group relative"
                >
                  <div className="flex items-center justify-between gap-1">
                    <input
                      type="text"
                      value={h}
                      onChange={(e) => handleHeaderChange(i, e.target.value)}
                      placeholder={`Col ${i + 1}`}
                      className="bg-transparent font-semibold text-gray-200 focus:bg-[#1E2638] focus:outline-none rounded px-1 py-0.5 w-full text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopyColumn(i)}
                      className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white p-0.5 transition-opacity"
                      title="Copy column"
                    >
                      <Copy className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1E2638]">
            {filteredRows.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-[#101622] group/row transition-colors">
                <td className="py-1.5 px-2 text-center text-gray-500 font-mono text-[11px] border-r border-[#1E2638] relative">
                  <div className="flex items-center justify-center gap-0.5">
                    <span>{rIdx + 1}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyRow(row, rIdx)}
                      className="opacity-0 group-hover/row:opacity-100 text-gray-400 hover:text-white transition-opacity ml-1"
                      title="Copy row for Excel"
                    >
                      <Copy className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </td>
                {row.map((cell, cIdx) => {
                  const isCopied = copiedCell?.r === rIdx && copiedCell?.c === cIdx;
                  return (
                    <td
                      key={cIdx}
                      className="py-1 px-2 border-r border-[#1E2638] last:border-0 relative group/cell hover:bg-[#161F30]"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <textarea
                          rows={cell.includes('\n') ? Math.min(3, cell.split('\n').length) : 1}
                          value={cell}
                          onChange={(e) => handleCellChange(rIdx, cIdx, e.target.value)}
                          className="w-full bg-transparent text-gray-200 px-1 py-0.5 rounded focus:bg-[#1E2638] focus:outline-none font-mono text-xs resize-none leading-normal"
                        />
                        {cell.trim() && (
                          <button
                            type="button"
                            onClick={() => handleCopyCell(cell, rIdx, cIdx)}
                            className="opacity-0 group-hover/cell:opacity-100 text-gray-400 hover:text-white p-0.5 transition-opacity shrink-0"
                            title="Click to copy cell value"
                          >
                            {isCopied ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Helper Footer */}
      <div className="flex items-center justify-between text-[11px] text-gray-500 px-1">
        <span>💡 Hover any cell to copy individually, or click "Copy for Excel" to paste all into spreadsheet.</span>
      </div>
    </div>
  );
};
