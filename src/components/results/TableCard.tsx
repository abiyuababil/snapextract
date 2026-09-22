import React, { useState } from 'react';
import { TableData } from '../../types/extractor';
import {
  Download,
  Copy,
  Search,
  Check,
  FileSpreadsheet,
  Trash2,
  Plus,
  Eraser,
  Sparkles,
} from 'lucide-react';
import { exportTableAsCsv, copyToClipboard } from '../../lib/export-utils';
import { useToast } from '../ui/Toast';

interface TableCardProps {
  data: TableData;
}

export const TableCard: React.FC<TableCardProps> = ({ data }) => {
  const { toast } = useToast();
  const [prevData, setPrevData] = useState(data);
  const [headers, setHeaders] = useState<string[]>(data.headers || []);
  const [rows, setRows] = useState<string[][]>(data.rows || []);
  const [search, setSearch] = useState('');
  const [copiedCell, setCopiedCell] = useState<{ r: number; c: number } | null>(null);

  // Sync state if underlying data changes without causing cascading render
  if (prevData !== data) {
    setPrevData(data);
    setHeaders(data.headers || []);
    setRows(data.rows || []);
  }

  // Helper to check if a row is completely empty
  const isRowEmpty = (row: string[]): boolean => {
    if (!row || row.length === 0) return true;
    return row.every((cell) => {
      if (!cell) return true;
      const stripped = cell.replace(/<br\s*\/?>/gi, '').replace(/&nbsp;/gi, ' ').trim();
      return stripped.length === 0;
    });
  };

  // Detect empty rows count
  const emptyRowCount = rows.filter(isRowEmpty).length;

  // Detect <br> tags count
  const countBrTags = (hList: string[], rList: string[][]): number => {
    const brRegex = /<br\s*\/?>/gi;
    let count = 0;
    for (const h of hList) {
      const m = h.match(brRegex);
      if (m) count += m.length;
    }
    for (const r of rList) {
      for (const c of r) {
        const m = c.match(brRegex);
        if (m) count += m.length;
      }
    }
    return count;
  };
  const brCount = countBrTags(headers, rows);

  // Clean empty rows
  const handleRemoveEmptyRows = () => {
    const cleaned = rows.filter((r) => !isRowEmpty(r));
    const removedCount = rows.length - cleaned.length;
    if (removedCount > 0) {
      setRows(cleaned);
      toast(`Removed ${removedCount} empty row${removedCount > 1 ? 's' : ''}`, 'success');
    } else {
      toast('No empty rows found', 'info');
    }
  };

  // Clean <br> tags in headers and cells
  const handleCleanBrTags = () => {
    const brRegex = /<br\s*\/?>/gi;
    let cleanedCount = 0;

    const newHeaders = headers.map((h) => {
      const m = h.match(brRegex);
      if (m) cleanedCount += m.length;
      return h.replace(brRegex, ' ').replace(/\s+/g, ' ').trim();
    });

    const newRows = rows.map((row) =>
      row.map((cell) => {
        const m = cell.match(brRegex);
        if (m) cleanedCount += m.length;
        return cell
          .replace(/<br\s*\/?>/gi, '\n')
          .replace(/\n{3,}/g, '\n\n')
          .trim();
      })
    );

    if (cleanedCount > 0) {
      setHeaders(newHeaders);
      setRows(newRows);
      toast(`Cleaned ${cleanedCount} <br> tag${cleanedCount > 1 ? 's' : ''}`, 'success');
    } else {
      toast('No <br> tags found', 'info');
    }
  };

  // Clean both empty rows and <br> tags
  const handleCleanAll = () => {
    const brRegex = /<br\s*\/?>/gi;
    let cleanedCount = 0;

    const newHeaders = headers.map((h) => {
      const m = h.match(brRegex);
      if (m) cleanedCount += m.length;
      return h.replace(brRegex, ' ').replace(/\s+/g, ' ').trim();
    });

    const newRows = rows
      .map((row) =>
        row.map((cell) => {
          const m = cell.match(brRegex);
          if (m) cleanedCount += m.length;
          return cell
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
        })
      )
      .filter((r) => !isRowEmpty(r));

    const removedRows = rows.length - newRows.length;
    setHeaders(newHeaders);
    setRows(newRows);

    if (removedRows > 0 || cleanedCount > 0) {
      toast(
        `Table cleaned: removed ${removedRows} empty row(s), cleaned ${cleanedCount} <br> tag(s)`,
        'success'
      );
    } else {
      toast('Table is already clean', 'info');
    }
  };

  const handleDeleteRow = (index: number) => {
    setRows(rows.filter((_, i) => i !== index));
    toast(`Row ${index + 1} deleted`, 'info');
  };

  const handleAddRow = () => {
    setRows([...rows, new Array(headers.length).fill('')]);
    toast('Added new row', 'info');
  };

  const handleExportCsv = () => {
    exportTableAsCsv({ headers, rows, rawText: data.rawText }, 'extracted_table');
    toast('CSV file downloaded', 'success');
  };

  const handleCopyExcelTsv = async () => {
    const tsvContent = [
      headers.join('\t'),
      ...rows.map((r) =>
        r
          .map((cell) =>
            cell.includes('\n') ? `"${cell.replace(/"/g, '""')}"` : cell
          )
          .join('\t')
      ),
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
      <div className="space-y-2 p-2.5 rounded-lg bg-[#121824] border border-[#1E2638]">
        <div className="flex flex-wrap items-center justify-between gap-2">
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

        {/* Cleaning & Editing Actions */}
        <div className="flex flex-wrap items-center justify-between gap-1.5 pt-2 border-t border-[#1E2638]/70 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Remove Empty Rows Button */}
            <button
              type="button"
              onClick={handleRemoveEmptyRows}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors border ${
                emptyRowCount > 0
                  ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : 'bg-[#161D2C] hover:bg-[#1E2638] text-gray-300 border-[#242F44]'
              }`}
              title="Delete all rows that contain no text"
            >
              <Eraser className="w-3 h-3 text-amber-400" />
              <span>Remove Empty Rows</span>
              {emptyRowCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-[10px] font-mono text-amber-300">
                  {emptyRowCount}
                </span>
              )}
            </button>

            {/* Clean <br> Tags Button */}
            <button
              type="button"
              onClick={handleCleanBrTags}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors border ${
                brCount > 0
                  ? 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                  : 'bg-[#161D2C] hover:bg-[#1E2638] text-gray-300 border-[#242F44]'
              }`}
              title="Clean all <br> or <br/> tags from headers and cells into line breaks"
            >
              <Sparkles className="w-3 h-3 text-indigo-400" />
              <span>Clean &lt;br&gt;</span>
              {brCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-[10px] font-mono text-indigo-300">
                  {brCount}
                </span>
              )}
            </button>

            {/* Clean All Button */}
            <button
              type="button"
              onClick={handleCleanAll}
              className="flex items-center gap-1 px-2 py-1 rounded bg-[#161D2C] hover:bg-[#1E2638] text-gray-300 text-xs border border-[#242F44] transition-colors"
              title="Remove empty rows and clean <br> tags in one click"
            >
              <span>Clean All</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Add Row Button */}
            <button
              type="button"
              onClick={handleAddRow}
              className="flex items-center gap-1 px-2 py-1 rounded bg-[#161D2C] hover:bg-[#1E2638] text-gray-300 text-xs border border-[#242F44] transition-colors"
              title="Add a new row to the table"
            >
              <Plus className="w-3 h-3 text-emerald-400" />
              <span>Add Row</span>
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Spreadsheet Viewport */}
      <div className="rounded-lg border border-[#1E2638] overflow-x-auto max-h-80 bg-[#090D14] shadow-inner">
        <table className="w-full text-xs text-left border-collapse select-text">
          <thead>
            <tr className="bg-[#121824] border-b border-[#1E2638] text-gray-300 font-medium sticky top-0 z-10">
              <th className="py-2 px-2.5 w-14 text-center text-gray-500 border-r border-[#1E2638]">
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
            {filteredRows.map((row, rIdx) => {
              const isEmpty = isRowEmpty(row);
              return (
                <tr
                  key={rIdx}
                  className={`group/row transition-colors ${
                    isEmpty ? 'bg-amber-950/20 hover:bg-amber-950/30' : 'hover:bg-[#101622]'
                  }`}
                >
                  <td className="py-1.5 px-2 text-center text-gray-500 font-mono text-[11px] border-r border-[#1E2638] relative">
                    <div className="flex items-center justify-center gap-1">
                      <span>{rIdx + 1}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyRow(row, rIdx)}
                        className="opacity-0 group-hover/row:opacity-100 text-gray-400 hover:text-white transition-opacity"
                        title="Copy row for Excel"
                      >
                        <Copy className="w-2.5 h-2.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteRow(rIdx)}
                        className="opacity-0 group-hover/row:opacity-100 text-red-400 hover:text-red-300 transition-opacity"
                        title="Delete this row"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
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
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Helper Footer */}
      <div className="flex items-center justify-between text-[11px] text-gray-500 px-1">
        <span>
          💡 Hover any cell to copy individually, or click &quot;Copy for Excel&quot; to paste all into spreadsheet.
        </span>
        {emptyRowCount > 0 && (
          <span className="text-amber-400 font-medium">
            {emptyRowCount} empty row{emptyRowCount > 1 ? 's' : ''} detected
          </span>
        )}
      </div>
    </div>
  );
};
