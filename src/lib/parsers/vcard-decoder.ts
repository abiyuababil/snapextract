import { VCardData } from '../../types/extractor';

export function isVCardPayload(payload: string): boolean {
  const upper = payload.trim().toUpperCase();
  return upper.includes('BEGIN:VCARD') || upper.startsWith('MECARD:');
}

export function decodeVCard(raw: string): VCardData {
  const trimmed = raw.trim();

  // Check MECARD format (MECARD:N:Name;TEL:123;EMAIL:abc@def.com;;)
  if (trimmed.toUpperCase().startsWith('MECARD:')) {
    let fullName = '';
    const phones: string[] = [];
    const emails: string[] = [];
    let address = '';
    let url = '';

    const body = trimmed.substring(7);
    const parts = body.split(/(?<!\\);/);

    for (const part of parts) {
      if (!part) continue;
      const idx = part.indexOf(':');
      if (idx === -1) continue;
      const key = part.substring(0, idx).toUpperCase();
      const val = part.substring(idx + 1).replace(/\\([;,:\\])/g, '$1');

      if (key === 'N') fullName = val.replace(/,/g, ' ');
      else if (key === 'TEL') phones.push(val);
      else if (key === 'EMAIL') emails.push(val);
      else if (key === 'ADR') address = val;
      else if (key === 'URL') url = val;
    }

    return {
      fullName: fullName || 'Contact',
      phones,
      emails,
      address: address || undefined,
      url: url || undefined,
      rawPayload: raw
    };
  }

  // Standard vCard (2.1 / 3.0 / 4.0)
  const lines = trimmed.split(/\r?\n/);
  let fullName = '';
  let organization = '';
  let title = '';
  const phones: string[] = [];
  const emails: string[] = [];
  let address = '';
  let url = '';

  for (const line of lines) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;

    const meta = line.substring(0, colonIdx).toUpperCase();
    const value = line.substring(colonIdx + 1).trim();

    if (meta.startsWith('FN')) {
      fullName = value;
    } else if (meta.startsWith('N') && !fullName) {
      fullName = value.split(';').filter(Boolean).join(' ');
    } else if (meta.startsWith('ORG')) {
      organization = value.replace(/;/g, ' ');
    } else if (meta.startsWith('TITLE')) {
      title = value;
    } else if (meta.startsWith('TEL')) {
      phones.push(value);
    } else if (meta.startsWith('EMAIL')) {
      emails.push(value);
    } else if (meta.startsWith('ADR')) {
      address = value.split(';').filter(Boolean).join(', ');
    } else if (meta.startsWith('URL')) {
      url = value;
    }
  }

  return {
    fullName: fullName || 'Contact Name',
    organization: organization || undefined,
    title: title || undefined,
    phones,
    emails,
    address: address || undefined,
    url: url || undefined,
    rawPayload: raw
  };
}
