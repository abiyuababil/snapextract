import { BankingData, ReceiptData, ReceiptItem } from '../../types/extractor';

/**
 * Normalizes Indonesian currency string to number
 * Examples: "Rp 150.000,00", "Rp1.500.000", "150,000", "IDR 50.000" -> 150000
 */
export function parseCurrency(text: string): number {
  if (!text) return 0;
  // Remove Rp, IDR, currency symbols, and spaces
  let cleaned = text.replace(/^(Rp|IDR|IDR\.)\s*/i, '').trim();
  
  // Format with dot thousand and comma decimal (e.g. 1.250.000,00 or 150.000)
  if (/\d+\.\d{3}(,\d{2})?/.test(cleaned) || (cleaned.includes('.') && !cleaned.includes(','))) {
    // If it has multiple dots (1.500.000), replace dots with empty string
    if ((cleaned.match(/\./g) || []).length > 1 || (cleaned.includes('.') && cleaned.indexOf('.') === cleaned.length - 4)) {
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    }
  } else if (cleaned.includes(',') && cleaned.includes('.')) {
    // Standard US format (1,500.00)
    cleaned = cleaned.replace(/,/g, '');
  } else if (cleaned.includes(',')) {
    // 50,000 or 50,00
    if (cleaned.length - cleaned.lastIndexOf(',') === 3) {
      cleaned = cleaned.replace(',', '');
    } else {
      cleaned = cleaned.replace(',', '.');
    }
  } else if (cleaned.includes('.')) {
    // Indonesian dot as thousand separator e.g. 50.000
    if (cleaned.length - cleaned.lastIndexOf('.') === 4) {
      cleaned = cleaned.replace(/\./g, '');
    }
  }

  const num = parseFloat(cleaned.replace(/[^0-9.-]/g, ''));
  return isNaN(num) ? 0 : num;
}

/**
 * Detects if text looks like an Indonesian m-banking / e-wallet transaction screenshot
 */
export function isBankingScreenshot(text: string): boolean {
  const t = text.toUpperCase();
  const bankKeywords = [
    'BCA', 'LIVIN', 'MANDIRI', 'BRIMO', 'BRI', 'BNI', 'SEABANK', 'JAGO', 
    'BSI', 'GOPAY', 'DANA', 'OVO', 'SHOPEEPAY', 'LINKAJA', 'PERMATA', 'CIMB',
    'BERHASIL', 'TRANSAKSI BERHASIL', 'TRANSFER BERHASIL', 'PAYMENT SUCCESS',
    'NO. REFERENSI', 'NO REFERENSI', 'NO. TRANSAKSI', 'REKENING TUJUAN', 'JUMLAH TRANSFER', 'TOTAL TRANSAKSI'
  ];

  let matches = 0;
  for (const kw of bankKeywords) {
    if (t.includes(kw)) matches++;
  }
  return matches >= 2;
}

/**
 * Detects bank/e-wallet name from text
 */
export function detectBankName(text: string): string {
  const t = text.toUpperCase();
  if (t.includes('MYBCA') || t.includes('BCA MOBILE') || t.includes('KLIKBCA') || t.includes('BCA')) return 'BCA';
  if (t.includes('LIVIN') || t.includes('MANDIRI')) return 'Bank Mandiri (Livin\')';
  if (t.includes('BRIMO') || t.includes('BANK BRI') || t.includes('BRI')) return 'Bank BRI';
  if (t.includes('BNI MOBILE') || t.includes('BANK BNI') || t.includes('BNI')) return 'Bank BNI';
  if (t.includes('SEABANK') || t.includes('SEA BANK')) return 'SeaBank';
  if (t.includes('BANK JAGO') || t.includes('JAGO')) return 'Bank Jago';
  if (t.includes('BSI') || t.includes('BANK SYARIAH INDONESIA')) return 'Bank BSI';
  if (t.includes('GOPAY') || t.includes('GOJEK')) return 'GoPay';
  if (t.includes('DANA')) return 'DANA';
  if (t.includes('OVO')) return 'OVO';
  if (t.includes('SHOPEEPAY') || t.includes('SHOPEE')) return 'ShopeePay';
  if (t.includes('LINKAJA')) return 'LinkAja';
  if (t.includes('CIMB') || t.includes('OCTO')) return 'CIMB Niaga';
  if (t.includes('PERMATA')) return 'Bank Permata';
  if (t.includes('JENIUS') || t.includes('BTPN')) return 'Jenius (BTPN)';
  return 'Bank / E-Wallet';
}

/**
 * Extracts structured banking transaction data from text
 */
export function parseBankingText(text: string): BankingData {
  const bankName = detectBankName(text);
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  let amount = 0;
  let adminFee = 0;
  let totalAmount = 0;
  let referenceNumber = '';
  let recipientName = '';
  let recipientAccount = '';
  let recipientBank = '';
  let senderName = '';
  let senderAccount = '';
  let date = '';
  let time = '';
  let status: 'SUCCESS' | 'PENDING' | 'FAILED' | 'UNKNOWN' = 'UNKNOWN';
  let transactionType: 'transfer' | 'payment' | 'topup' | 'receive' | 'qris' | 'unknown' = 'transfer';

  // Status detection
  const upper = text.toUpperCase();
  if (upper.includes('BERHASIL') || upper.includes('SUCCESS') || upper.includes('TRANSAKSI BERHASIL') || upper.includes('BERHASIL DITRANSFER')) {
    status = 'SUCCESS';
  } else if (upper.includes('PENDING') || upper.includes('MENUNGGU') || upper.includes('DIPROSES')) {
    status = 'PENDING';
  } else if (upper.includes('GAGAL') || upper.includes('FAILED') || upper.includes('DITOLAK')) {
    status = 'FAILED';
  }

  // Transaction type
  if (upper.includes('QRIS') || upper.includes('PEMBAYARAN QR')) {
    transactionType = 'qris';
  } else if (upper.includes('TOP UP') || upper.includes('TOP-UP') || upper.includes('ISI SALDO')) {
    transactionType = 'topup';
  } else if (upper.includes('PEMBAYARAN') || upper.includes('BILL PAYMENT') || upper.includes('TAGIHAN')) {
    transactionType = 'payment';
  } else if (upper.includes('TRANSFER MASUK') || upper.includes('DITERIMA DARI')) {
    transactionType = 'receive';
  }

  // Regex extractors
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lUpper = line.toUpperCase();

    // Amount matchers (Rp 100.000 / Nominal / Jumlah Transfer)
    if (lUpper.includes('JUMLAH') || lUpper.includes('NOMINAL') || lUpper.includes('TOTAL TRANSFER') || lUpper.includes('AMOUNT') || lUpper.includes('TRANSFER AMOUNT')) {
      const match = line.match(/(?:Rp|IDR)?\s*([0-9.,]+)/i);
      if (match && match[1]) {
        const val = parseCurrency(match[1]);
        if (val > 0) amount = val;
      } else if (i + 1 < lines.length) {
        // Next line might contain the amount
        const nextMatch = lines[i + 1].match(/(?:Rp|IDR)?\s*([0-9.,]+)/i);
        if (nextMatch && nextMatch[1]) {
          const val = parseCurrency(nextMatch[1]);
          if (val > 0) amount = val;
        }
      }
    }

    // Direct standalone big currency match (e.g. "Rp 150.000" or "-Rp 25.000")
    if (amount === 0) {
      const directMatch = line.match(/^[+-]?(?:Rp|IDR)\s*([0-9.,]{4,})/i);
      if (directMatch && directMatch[1]) {
        amount = parseCurrency(directMatch[1]);
      }
    }

    // Admin fee matchers (Biaya Admin / Admin Fee)
    if (lUpper.includes('ADMIN') || lUpper.includes('BIAYA TRANSFER') || lUpper.includes('FEE')) {
      if (lUpper.includes('GRATIS') || lUpper.includes('FREE') || lUpper.includes('RP 0') || lUpper.includes('RP0')) {
        adminFee = 0;
      } else {
        const match = line.match(/(?:Rp|IDR)?\s*([0-9.,]+)/i);
        if (match && match[1]) {
          adminFee = parseCurrency(match[1]);
        }
      }
    }

    // Total Amount matcher
    if (lUpper.includes('TOTAL PEMBAYARAN') || lUpper.includes('TOTAL TRANSAKSI') || lUpper.includes('TOTAL DEBIT')) {
      const match = line.match(/(?:Rp|IDR)?\s*([0-9.,]+)/i);
      if (match && match[1]) {
        totalAmount = parseCurrency(match[1]);
      }
    }

    // Reference Number
    if (lUpper.includes('REFERENSI') || lUpper.includes('REF NO') || lUpper.includes('NO. TRANSAKSI') || lUpper.includes('TRANSACTION ID') || lUpper.includes('REFERENCE')) {
      const match = line.match(/(?:No\.?\s*(?:Referensi|Transaksi|Ref)|Reference\s*No\.?)[\s:]*([A-Za-z0-9\-_]+)/i);
      if (match && match[1] && match[1].length > 4) {
        referenceNumber = match[1];
      } else if (i + 1 < lines.length && /^[A-Za-z0-9\-_]{6,}$/.test(lines[i + 1])) {
        referenceNumber = lines[i + 1];
      }
    }

    // Recipient matcher (Penerima / Transfer Ke / Rekening Tujuan)
    if (lUpper.includes('PENERIMA') || lUpper.includes('KE REKENING') || lUpper.includes('TRANSFER KE') || lUpper.includes('TUJUAN') || lUpper.includes('TO:')) {
      const colonIdx = line.indexOf(':');
      if (colonIdx !== -1 && colonIdx < line.length - 2) {
        recipientName = line.substring(colonIdx + 1).trim();
      } else if (i + 1 < lines.length) {
        recipientName = lines[i + 1];
      }
    }

    // Sender matcher (Pengirim / Dari Rekening / Sumber Dana)
    if (lUpper.includes('PENGIRIM') || lUpper.includes('DARI REKENING') || lUpper.includes('SUMBER DANA') || lUpper.includes('FROM:')) {
      const colonIdx = line.indexOf(':');
      if (colonIdx !== -1 && colonIdx < line.length - 2) {
        senderName = line.substring(colonIdx + 1).trim();
      } else if (i + 1 < lines.length) {
        senderName = lines[i + 1];
      }
    }

    // Date & Time matcher (e.g. 27 Agu 2026 14:30:15 or 27/08/2026)
    const dateMatch = line.match(/(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|Mei|May|Jun|Jul|Agu|Aug|Sep|Okt|Oct|Nov|Des|Dec)[a-z]*\s+\d{4}|\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i);
    if (dateMatch && !date) {
      date = dateMatch[1];
    }
    const timeMatch = line.match(/(\d{1,2}:\d{2}(?::\d{2})?\s*(?:WIB|WITA|WIT|AM|PM)?)/i);
    if (timeMatch && !time) {
      time = timeMatch[1];
    }
  }

  // Calculate total amount if not explicitly detected
  if (totalAmount === 0) {
    totalAmount = amount + adminFee;
  }

  return {
    bankName,
    transactionType,
    senderName: senderName || undefined,
    senderAccount: senderAccount || undefined,
    recipientName: recipientName || undefined,
    recipientAccount: recipientAccount || undefined,
    recipientBank: recipientBank || undefined,
    amount,
    adminFee,
    totalAmount,
    referenceNumber: referenceNumber || undefined,
    date: date || undefined,
    time: time || undefined,
    status,
    rawText: text
  };
}

/**
 * Detects if text looks like a shopping/restaurant receipt
 */
export function isReceiptText(text: string): boolean {
  const upper = text.toUpperCase();
  const receiptKeywords = [
    'STRUK', 'RECEIPT', 'INDOMARET', 'ALFAMART', 'TOTAL', 'SUBTOTAL', 'KASIR', 'CASHIER',
    'PPN', 'PAJAK', 'TAX', 'CHANGE', 'KEMBALIAN', 'TUNAI', 'CASH', 'DEBIT', 'DISCOUNT', 'DISKON'
  ];

  let matches = 0;
  for (const kw of receiptKeywords) {
    if (upper.includes(kw)) matches++;
  }
  return matches >= 2;
}

/**
 * Extracts itemized shopping receipt from text
 */
export function parseReceiptText(text: string): ReceiptData {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const items: ReceiptItem[] = [];
  
  let storeName = lines[0] || 'Store / Merchant';
  let date = '';
  let time = '';
  let subtotal = 0;
  let tax = 0;
  let discount = 0;
  let serviceCharge = 0;
  let total = 0;
  let paymentMethod = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lUpper = line.toUpperCase();

    // Date/time detection
    const dateMatch = line.match(/(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{1,2}\s+(?:Jan|Feb|Mar|Apr|Mei|Jun|Jul|Agu|Sep|Okt|Nov|Des)[a-z]*\s+\d{4})/i);
    if (dateMatch && !date) date = dateMatch[1];

    const timeMatch = line.match(/(\d{1,2}:\d{2}(?::\d{2})?)/);
    if (timeMatch && !time) time = timeMatch[1];

    // Subtotal
    if (lUpper.includes('SUBTOTAL') || lUpper.includes('SUB TOTAL') || lUpper.includes('JUMLAH HARGA')) {
      const match = line.match(/(?:Rp|IDR)?\s*([0-9.,]+)/i);
      if (match) subtotal = parseCurrency(match[1]);
    }

    // Tax / PPN
    if (lUpper.includes('PPN') || lUpper.includes('PAJAK') || lUpper.includes('TAX')) {
      const match = line.match(/(?:Rp|IDR)?\s*([0-9.,]+)/i);
      if (match) tax = parseCurrency(match[1]);
    }

    // Discount
    if (lUpper.includes('DISKON') || lUpper.includes('DISCOUNT') || lUpper.includes('POTONGAN')) {
      const match = line.match(/(?:Rp|IDR)?\s*([0-9.,]+)/i);
      if (match) discount = parseCurrency(match[1]);
    }

    // Grand Total
    if (lUpper.includes('TOTAL') && !lUpper.includes('SUBTOTAL') && !lUpper.includes('SUB TOTAL')) {
      const match = line.match(/(?:Rp|IDR)?\s*([0-9.,]+)/i);
      if (match) {
        const val = parseCurrency(match[1]);
        if (val > 0) total = val;
      }
    }

    // Payment Method
    if (lUpper.includes('TUNAI') || lUpper.includes('CASH')) paymentMethod = 'Cash';
    else if (lUpper.includes('QRIS')) paymentMethod = 'QRIS';
    else if (lUpper.includes('DEBIT') || lUpper.includes('KARTU DEBIT')) paymentMethod = 'Debit Card';
    else if (lUpper.includes('CREDIT') || lUpper.includes('KARTU KREDIT')) paymentMethod = 'Credit Card';

    // Item line pattern: e.g. "KOPI SUSU  2  18.000  36.000" or "INDOMIE GORENG   1   3.500"
    const itemMatch = line.match(/^([A-Za-z0-9\s.,\-_&]+?)\s+(\d+)\s+[xX]?\s*([0-9.,]+)\s+([0-9.,]+)$/);
    if (itemMatch) {
      const name = itemMatch[1].trim();
      const qty = parseInt(itemMatch[2], 10) || 1;
      const unitPrice = parseCurrency(itemMatch[3]);
      const totalPrice = parseCurrency(itemMatch[4]);
      if (name && totalPrice > 0) {
        items.push({ name, qty, unitPrice, totalPrice });
      }
    }
  }

  // Fallback if total wasn't found but subtotal was
  if (total === 0) {
    if (items.length > 0) {
      total = items.reduce((acc, it) => acc + it.totalPrice, 0) + tax - discount + serviceCharge;
    } else if (subtotal > 0) {
      total = subtotal + tax - discount + serviceCharge;
    }
  }

  return {
    storeName,
    date: date || undefined,
    time: time || undefined,
    items,
    subtotal: subtotal || undefined,
    tax: tax || undefined,
    discount: discount || undefined,
    serviceCharge: serviceCharge || undefined,
    total,
    paymentMethod: paymentMethod || undefined,
    rawText: text
  };
}
