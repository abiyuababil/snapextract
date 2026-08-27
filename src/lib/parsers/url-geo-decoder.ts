import { UrlData, GeoData } from '../../types/extractor';

export function isUrlPayload(payload: string): boolean {
  const p = payload.trim();
  return /^https?:\/\//i.test(p) || /^www\.[a-z0-9-]+\.[a-z]{2,}/i.test(p);
}

export function decodeUrl(raw: string): UrlData {
  let target = raw.trim();
  if (!/^https?:\/\//i.test(target)) {
    target = 'https://' + target;
  }

  try {
    const parsed = new URL(target);
    return {
      url: target,
      protocol: parsed.protocol.replace(':', ''),
      domain: parsed.hostname,
      path: parsed.pathname + parsed.search,
      isSecure: parsed.protocol === 'https:',
      rawPayload: raw
    };
  } catch {
    return {
      url: target,
      protocol: 'http',
      domain: target,
      path: '',
      isSecure: false,
      rawPayload: raw
    };
  }
}

export function isGeoPayload(payload: string): boolean {
  const p = payload.trim().toLowerCase();
  return p.startsWith('geo:') || /^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?),\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/.test(p);
}

export function decodeGeo(raw: string): GeoData {
  let clean = raw.trim();
  if (clean.toLowerCase().startsWith('geo:')) {
    clean = clean.substring(4);
  }

  const queryIdx = clean.indexOf('?q=');
  let query: string | undefined;
  if (queryIdx !== -1) {
    query = decodeURIComponent(clean.substring(queryIdx + 3));
    clean = clean.substring(0, queryIdx);
  }

  const [latStr, lonStr] = clean.split(',');
  const lat = parseFloat(latStr) || 0;
  const lon = parseFloat(lonStr) || 0;

  const mapUrl = `https://www.google.com/maps?q=${lat},${lon}`;

  return {
    latitude: lat,
    longitude: lon,
    query,
    mapUrl,
    rawPayload: raw
  };
}
