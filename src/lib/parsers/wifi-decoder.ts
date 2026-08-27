import { WifiData } from '../../types/extractor';

/**
 * Checks if a string is in Wi-Fi QR format (WIFI:...)
 */
export function isWifiPayload(payload: string): boolean {
  return payload.trim().toUpperCase().startsWith('WIFI:');
}

/**
 * Decodes standard Wi-Fi QR string format:
 * WIFI:S:<SSID>;T:<WPA|WEP|nopass>;P:<PASSWORD>;H:<true|false>;;
 */
export function decodeWifi(raw: string): WifiData {
  let clean = raw.trim();
  if (clean.toUpperCase().startsWith('WIFI:')) {
    clean = clean.substring(5);
  }

  let ssid = '';
  let password = '';
  let encryption = 'WPA';
  let isHidden = false;

  // Split tokens safely respecting escaped semicolons
  const tokens = clean.split(/(?<!\\);/);

  for (const token of tokens) {
    if (!token) continue;
    const colonIdx = token.indexOf(':');
    if (colonIdx === -1) continue;

    const key = token.substring(0, colonIdx).toUpperCase();
    const val = token.substring(colonIdx + 1).replace(/\\([;,:\\])/g, '$1');

    if (key === 'S') {
      ssid = val;
    } else if (key === 'P') {
      password = val;
    } else if (key === 'T') {
      encryption = val || 'nopass';
    } else if (key === 'H') {
      isHidden = val.toLowerCase() === 'true';
    }
  }

  return {
    ssid: ssid || 'Unknown Network',
    password: password || undefined,
    encryption: encryption || 'WPA',
    isHidden,
    rawPayload: raw
  };
}
