import Dexie, { Table } from 'dexie';
import { ExtractionResult, AppSettings } from '../types/extractor';

export class SnapExtractDB extends Dexie {
  history!: Table<ExtractionResult, string>;

  constructor() {
    super('SnapExtractDB');
    this.version(1).stores({
      history: 'id, timestamp, contentType, sourceType, title'
    });
  }
}

export const db = new SnapExtractDB();

const SETTINGS_KEY = 'snapextract_settings_v1';

export const DEFAULT_SETTINGS: AppSettings = {
  ocrEngine: 'local',
  geminiApiKey: '',
  groqApiKey: '',
  groqModel: 'llama-3.2-11b-vision-preview',
  autoRedactSensitives: false,
  copyFeedback: true,
  historyLimit: 50,
};

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings:', err);
  }
}
