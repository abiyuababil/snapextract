import { ExtractionResult, TableData, ReceiptData } from '../types/extractor';

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for non-secure contexts
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      textArea.remove();
      return successful;
    }
  } catch (err) {
    console.error('Failed to copy text:', err);
    return false;
  }
}

export function downloadFile(content: string, filename: string, mimeType: string = 'text/plain') {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportResultAsJson(result: ExtractionResult): void {
  const jsonStr = JSON.stringify(result, null, 2);
  const safeName = (result.title || 'snapextract').replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
  downloadFile(jsonStr, `${safeName}_${result.id.slice(0, 6)}.json`, 'application/json');
}

export function exportTableAsCsv(
  table: TableData,
  title: string = 'table_export',
  options?: { removeEmptyRows?: boolean; cleanBr?: boolean }
): void {
  let headers = table.headers || [];
  let rows = table.rows || [];

  if (options?.cleanBr ?? true) {
    headers = headers.map(h => h.replace(/<br\s*\/?>/gi, ' ').trim());
    rows = rows.map(row =>
      row.map(cell => String(cell ?? '').replace(/<br\s*\/?>/gi, '\n').trim())
    );
  }

  if (options?.removeEmptyRows ?? true) {
    rows = rows.filter(row =>
      row.some(cell => String(cell ?? '').replace(/<br\s*\/?>/gi, '').trim().length > 0)
    );
  }

  const allRows = [headers, ...rows];
  const csvContent = allRows
    .map(row =>
      row.map(cell => {
        const str = String(cell ?? '').replace(/"/g, '""');
        return `"${str}"`;
      }).join(',')
    )
    .join('\r\n');

  downloadFile(csvContent, `${title.replace(/\s+/g, '_')}.csv`, 'text/csv');
}

export function exportReceiptAsCsv(receipt: ReceiptData, title: string = 'receipt_export'): void {
  const headers = ['Item Name', 'Qty', 'Unit Price', 'Total Price'];
  const rows = receipt.items.map(item => [
    item.name,
    item.qty.toString(),
    item.unitPrice.toString(),
    item.totalPrice.toString()
  ]);

  rows.push([]);
  if (receipt.subtotal) rows.push(['Subtotal', '', '', receipt.subtotal.toString()]);
  if (receipt.tax) rows.push(['Tax (PPN)', '', '', receipt.tax.toString()]);
  if (receipt.discount) rows.push(['Discount', '', '', `-${receipt.discount}`]);
  if (receipt.serviceCharge) rows.push(['Service Charge', '', '', receipt.serviceCharge.toString()]);
  rows.push(['Grand Total', '', '', receipt.total.toString()]);

  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\r\n');

  downloadFile(csvContent, `${title.replace(/\s+/g, '_')}.csv`, 'text/csv');
}

export function exportVCardAsVcf(rawPayload: string, name: string = 'contact'): void {
  downloadFile(rawPayload, `${name.replace(/\s+/g, '_')}.vcf`, 'text/vcard');
}
