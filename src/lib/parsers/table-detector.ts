import { TableData } from '../../types/extractor';
import { OCRWord } from '../local-ocr';

/**
 * Reconstructs a 2D structured table from OCR word bounding boxes
 */
export function reconstructTableFromWords(words?: OCRWord[]): TableData | null {
  if (!words || words.length < 4) return null;

  const validWords = words.filter((w) => w.text && w.text.trim().length > 0);
  if (validWords.length < 4) return null;

  // 1. Group words into rows based on Y-axis centers
  const sortedByY = [...validWords].sort((a, b) => {
    const yA = (a.y0 + a.y1) / 2;
    const yB = (b.y0 + b.y1) / 2;
    return yA - yB;
  });

  const rows: OCRWord[][] = [];
  for (const word of sortedByY) {
    const yCenter = (word.y0 + word.y1) / 2;
    const height = Math.max(10, word.y1 - word.y0);
    const tolerance = Math.max(8, height * 0.55);

    let matchedRow = false;
    for (const row of rows) {
      const rowYCenter =
        row.reduce((sum, w) => sum + (w.y0 + w.y1) / 2, 0) / row.length;
      if (Math.abs(yCenter - rowYCenter) <= tolerance) {
        row.push(word);
        matchedRow = true;
        break;
      }
    }
    if (!matchedRow) {
      rows.push([word]);
    }
  }

  // Filter rows with at least 1 word and sort top-to-bottom
  rows.sort((a, b) => {
    const yA = a.reduce((sum, w) => sum + (w.y0 + w.y1) / 2, 0) / a.length;
    const yB = b.reduce((sum, w) => sum + (w.y0 + w.y1) / 2, 0) / b.length;
    return yA - yB;
  });

  // Sort words left-to-right within each row
  for (const row of rows) {
    row.sort((a, b) => a.x0 - b.x0);
  }

  if (rows.length < 2) return null;

  // Check if at least 2 rows have multiple distinct word clusters
  const multiWordRows = rows.filter((r) => r.length >= 2);
  if (multiWordRows.length < 1 && rows.length < 3) return null;

  // 2. Determine column boundaries (X ranges) across all rows
  const colCandidates: { minX: number; maxX: number; count: number }[] = [];
  const colMergeGap = 35; // px

  for (const row of rows) {
    for (const w of row) {
      let merged = false;
      for (const col of colCandidates) {
        if (
          (w.x0 >= col.minX - 15 && w.x0 <= col.maxX + 15) ||
          Math.abs(w.x0 - col.minX) <= colMergeGap
        ) {
          col.minX = Math.min(col.minX, w.x0);
          col.maxX = Math.max(col.maxX, w.x1);
          col.count++;
          merged = true;
          break;
        }
      }
      if (!merged) {
        colCandidates.push({ minX: w.x0, maxX: w.x1, count: 1 });
      }
    }
  }

  // Sort columns left-to-right
  colCandidates.sort((a, b) => a.minX - b.minX);

  // Merge overlapping or adjacent column ranges
  const columns: { minX: number; maxX: number }[] = [];
  for (const col of colCandidates) {
    // Filter single-occurrence outliers if we have many rows
    if (rows.length >= 4 && col.count < 2) continue;

    if (columns.length === 0) {
      columns.push({ minX: col.minX, maxX: col.maxX });
    } else {
      const prev = columns[columns.length - 1];
      if (col.minX - prev.maxX < 25) {
        prev.maxX = Math.max(prev.maxX, col.maxX);
      } else {
        columns.push({ minX: col.minX, maxX: col.maxX });
      }
    }
  }

  if (columns.length < 2) return null;

  // 3. Construct the 2D Grid
  const matrix: string[][] = [];
  for (const row of rows) {
    const cells = new Array(columns.length).fill('');

    for (const word of row) {
      // Find matching column
      let bestIdx = 0;
      let minDistance = Infinity;

      for (let c = 0; c < columns.length; c++) {
        const col = columns[c];
        if (word.x0 >= col.minX - 15 && word.x0 <= col.maxX + 15) {
          bestIdx = c;
          minDistance = 0;
          break;
        }
        const dist = Math.min(
          Math.abs(word.x0 - col.minX),
          Math.abs(word.x1 - col.maxX)
        );
        if (dist < minDistance) {
          minDistance = dist;
          bestIdx = c;
        }
      }

      if (cells[bestIdx]) {
        cells[bestIdx] += ' ' + word.text.trim();
      } else {
        cells[bestIdx] = word.text.trim();
      }
    }

    if (cells.some((c) => c.trim().length > 0)) {
      matrix.push(cells);
    }
  }

  if (matrix.length < 2) return null;

  const headers = matrix[0].map((h, i) => h.trim() || `Col ${i + 1}`);
  const dataRows = matrix.slice(1);

  return {
    headers,
    rows: dataRows,
    rawText: matrix.map((r) => r.join('\t')).join('\n'),
  };
}

/**
 * Reconstructs a table from raw text with delimiters (tabs, pipes, multi-space)
 */
export function parseTableFromText(text: string): TableData | null {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) return null;

  // Check if tab-delimited
  const hasTabs = lines.filter((l) => l.includes('\t')).length >= 2;
  if (hasTabs) {
    const rows = lines.map((l) => l.split('\t').map((c) => c.trim()));
    const colCount = Math.max(...rows.map((r) => r.length));
    if (colCount >= 2) {
      const normalizedRows = rows.map((r) => {
        while (r.length < colCount) r.push('');
        return r;
      });
      return {
        headers: normalizedRows[0].map((h, i) => h || `Col ${i + 1}`),
        rows: normalizedRows.slice(1),
        rawText: text,
      };
    }
  }

  // Check if pipe-delimited (Markdown / ASCII table)
  const hasPipes = lines.filter((l) => l.includes('|')).length >= 2;
  if (hasPipes) {
    const cleanLines = lines.filter((l) => !/^[|\s\-:+]+$/.test(l));
    const rows = cleanLines.map((l) =>
      l
        .split('|')
        .map((c) => c.trim())
        .filter((c, idx, arr) => (idx === 0 || idx === arr.length - 1 ? c !== '' : true))
    );
    const colCount = Math.max(...rows.map((r) => r.length));
    if (colCount >= 2) {
      const normalizedRows = rows.map((r) => {
        while (r.length < colCount) r.push('');
        return r;
      });
      return {
        headers: normalizedRows[0].map((h, i) => h || `Col ${i + 1}`),
        rows: normalizedRows.slice(1),
        rawText: text,
      };
    }
  }

  // Check if multi-space column separated (e.g. 2 or more spaces between column items)
  const multiSpaceLines = lines.filter((l) => /\S\s{2,}\S/.test(l));
  if (multiSpaceLines.length >= 2 && multiSpaceLines.length >= lines.length * 0.5) {
    const rows = lines.map((l) => l.split(/\s{2,}/).map((c) => c.trim()));
    const colCount = Math.max(...rows.map((r) => r.length));
    if (colCount >= 2) {
      const normalizedRows = rows.map((r) => {
        while (r.length < colCount) r.push('');
        return r;
      });
      return {
        headers: normalizedRows[0].map((h, i) => h || `Col ${i + 1}`),
        rows: normalizedRows.slice(1),
        rawText: text,
      };
    }
  }

  return null;
}
