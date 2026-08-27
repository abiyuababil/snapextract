import { QrisData } from '../../types/extractor';

/**
 * Calculates CRC-16 (CCITT-FALSE: poly 0x1021, init 0xFFFF)
 */
export function calculateCrc16(str: string): string {
  let crc = 0xFFFF;
  for (let i = 0; i < str.length; i++) {
    crc ^= (str.charCodeAt(i) << 8);
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Parses raw TLV string into key-value tag map
 */
export function parseTLV(raw: string): Map<string, string> {
  const map = new Map<string, string>();
  let index = 0;
  
  while (index + 4 <= raw.length) {
    const tag = raw.substring(index, index + 2);
    const lengthStr = raw.substring(index + 2, index + 4);
    const length = parseInt(lengthStr, 10);
    
    if (isNaN(length) || index + 4 + length > raw.length) {
      break;
    }
    
    const value = raw.substring(index + 4, index + 4 + length);
    map.set(tag, value);
    index += 4 + length;
  }
  
  return map;
}

/**
 * Checks if a string has QRIS signature (Tag 00 = '01' and Tag 58 = 'ID')
 */
export function isQrisPayload(payload: string): boolean {
  if (!payload || payload.length < 20) return false;
  if (!payload.startsWith('000201')) return false;
  return payload.includes('5802ID') || payload.includes('5303360');
}

/**
 * Decodes QRIS EMVCo string
 */
export function decodeQris(raw: string): QrisData {
  const tags = parseTLV(raw);
  
  // Tag 59: Merchant Name
  const merchantName = tags.get('59') || 'Merchant QRIS';
  
  // Tag 60: Merchant City
  const merchantCity = tags.get('60');
  
  // Tag 61: Postal Code
  const postalCode = tags.get('61');
  
  // Tag 54: Transaction Amount (Dynamic QRIS)
  const amountStr = tags.get('54');
  const amount = amountStr ? parseFloat(amountStr) : undefined;
  
  // Tag 55 / 56 / 57: Convenience Fee
  let feeType: string | undefined;
  let feeValue: number | undefined;
  const tipIndicator = tags.get('55');
  if (tipIndicator === '01') {
    feeType = 'Fixed';
    const fixed = tags.get('56');
    if (fixed) feeValue = parseFloat(fixed);
  } else if (tipIndicator === '02') {
    feeType = 'Percentage';
    const pct = tags.get('57');
    if (pct) feeValue = parseFloat(pct);
  }
  
  // Extract NMID from Tag 26 to 51
  let nmid: string | undefined;
  for (let t = 26; t <= 51; t++) {
    const tagStr = t.toString().padStart(2, '0');
    const val = tags.get(tagStr);
    if (val) {
      // Sub-TLV check for NMID (commonly under tag 02 or subtag)
      if (val.includes('NMID') || val.includes('ID1')) {
        const sub = parseTLV(val);
        nmid = sub.get('02') || sub.get('01') || val;
        break;
      } else if (!nmid && val.length > 5) {
        const sub = parseTLV(val);
        nmid = sub.get('01') || sub.get('02') || val;
      }
    }
  }

  // Tag 53: Currency (360 is IDR)
  const currencyCode = tags.get('53');
  const currency = currencyCode === '360' ? 'IDR (Rp)' : currencyCode || 'IDR';

  // Tag 63: CRC Validation
  const crc = tags.get('63');
  let isValidCrc = false;
  if (crc && raw.includes('6304')) {
    const dataWithoutCrc = raw.substring(0, raw.lastIndexOf('6304') + 4);
    const calculated = calculateCrc16(dataWithoutCrc);
    isValidCrc = calculated === crc.toUpperCase();
  }

  return {
    merchantName,
    merchantCity,
    postalCode,
    nmid,
    amount,
    feeType,
    feeValue,
    crc,
    isValidCrc,
    currency,
    rawPayload: raw
  };
}
