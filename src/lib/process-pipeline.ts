import { ExtractionResult, AppSettings, ExtractedPayload, ContentType, EngineType } from '../types/extractor';
import { scanCodeFromImage } from './qr-scanner';
import { isQrisPayload, decodeQris } from './parsers/qris-decoder';
import { isWifiPayload, decodeWifi } from './parsers/wifi-decoder';
import { isVCardPayload, decodeVCard } from './parsers/vcard-decoder';
import { isUrlPayload, decodeUrl, isGeoPayload, decodeGeo } from './parsers/url-geo-decoder';
import { isBankingScreenshot, parseBankingText, isReceiptText, parseReceiptText } from './parsers/banking-patterns';
import { runLocalOCR, OCRProgress } from './local-ocr';
import { callGeminiVision, callGroqVision } from './vision-ai';
import { db } from './storage';

/**
 * Creates an image thumbnail data URL for fast rendering
 */
export async function createThumbnail(img: HTMLImageElement, maxSize: number = 320): Promise<string> {
  const canvas = document.createElement('canvas');
  let width = img.naturalWidth || img.width;
  let height = img.naturalHeight || img.height;

  if (width > height) {
    if (width > maxSize) {
      height = Math.round((height * maxSize) / width);
      width = maxSize;
    }
  } else {
    if (height > maxSize) {
      width = Math.round((width * maxSize) / height);
      height = maxSize;
    }
  }

  canvas.width = Math.max(width, 1);
  canvas.height = Math.max(height, 1);
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.85);
  }
  return '';
}

/**
 * Loads an image from DataUrl, Blob, or URL into an HTMLImageElement
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error('Failed to load image: ' + e));
    img.src = src;
  });
}

/**
 * Converts File to Base64 Data URL
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Main Extraction Pipeline
 */
export async function processImagePipeline(
  imageDataUrl: string,
  settings: AppSettings,
  fileName?: string,
  fileSize?: number,
  onProgress?: (progress: OCRProgress) => void
): Promise<ExtractionResult> {
  const id = 'snap_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
  const timestamp = Date.now();

  const img = await loadImage(imageDataUrl);
  const imageThumbnail = await createThumbnail(img, 360);

  if (onProgress) onProgress({ status: 'Scanning QR & Barcode...', progress: 0.1 });

  // 1. FAST PASS: QR Code & Barcode Detection
  const decodedCode = await scanCodeFromImage(img);

  if (decodedCode && decodedCode.text) {
    const raw = decodedCode.text;
    let payload: ExtractedPayload;
    let contentType: ContentType;
    let title: string;

    if (isQrisPayload(raw)) {
      const qrisData = decodeQris(raw);
      payload = { type: 'qris', data: qrisData };
      contentType = 'qris';
      title = `QRIS: ${qrisData.merchantName}`;
    } else if (isWifiPayload(raw)) {
      const wifiData = decodeWifi(raw);
      payload = { type: 'wifi', data: wifiData };
      contentType = 'wifi';
      title = `Wi-Fi: ${wifiData.ssid}`;
    } else if (isVCardPayload(raw)) {
      const vcardData = decodeVCard(raw);
      payload = { type: 'vcard', data: vcardData };
      contentType = 'vcard';
      title = `Contact: ${vcardData.fullName}`;
    } else if (isGeoPayload(raw)) {
      const geoData = decodeGeo(raw);
      payload = { type: 'geo', data: geoData };
      contentType = 'geo';
      title = `Location: ${geoData.latitude}, ${geoData.longitude}`;
    } else if (isUrlPayload(raw)) {
      const urlData = decodeUrl(raw);
      payload = { type: 'url', data: urlData };
      contentType = 'url';
      title = `Link: ${urlData.domain}`;
    } else if (decodedCode.format !== 'QR_CODE') {
      payload = {
        type: 'barcode',
        data: { format: decodedCode.format, text: raw, rawPayload: raw }
      };
      contentType = 'barcode';
      title = `Barcode (${decodedCode.format}): ${raw.slice(0, 16)}`;
    } else {
      payload = {
        type: 'general',
        data: { fullText: raw, wordCount: raw.split(/\s+/).length, lineCount: raw.split('\n').length }
      };
      contentType = 'general';
      title = `QR Text: ${raw.slice(0, 24)}`;
    }

    const result: ExtractionResult = {
      id,
      timestamp,
      title,
      sourceType: decodedCode.format === 'QR_CODE' ? 'qr' : 'barcode',
      contentType,
      engine: 'local-qr',
      imageThumbnail,
      fullImageDataUrl: imageDataUrl,
      fileName,
      fileSize,
      payload,
      rawText: raw,
    };

    // Save to local IndexedDB
    await db.history.put(result);
    return result;
  }

  // 2. SECOND PASS: 95% Local-First Offline OCR
  let payload: ExtractedPayload;
  let contentType: ContentType;
  let rawText = '';
  let engineType: EngineType = 'local-ocr';

  // Run Local OCR Engine
  const ocr = await runLocalOCR(img, onProgress);
  rawText = ocr.text;
  payload = classifyLocalOCR(rawText, ocr.words);
  contentType = payload.type;

  // 3. THIRD PASS: Intelligent AI Escalation
  // If local OCR confidence is low, text is nearly empty, or structure is ambiguous
  const trimmed = rawText.trim();
  const isConfidenceLow = ocr.confidence > 0 && ocr.confidence < 45;
  const isBarelyAnyText = trimmed.length < 15;
  const isAmbiguousGeneral = contentType === 'general' && trimmed.length > 25 && (trimmed.includes('?') || trimmed.split('\n').length < 2);

  const needsAiEscalation = isConfidenceLow || isBarelyAnyText || isAmbiguousGeneral;
  const hasAiKey = Boolean(settings.geminiApiKey || settings.groqApiKey);

  if (needsAiEscalation && hasAiKey) {
    if (onProgress) onProgress({ status: 'Local OCR uncertain, escalating to AI Vision...', progress: 0.88 });

    try {
      if (settings.geminiApiKey) {
        const aiResult = await callGeminiVision(imageDataUrl, settings.geminiApiKey);
        payload = aiResult.payload;
        contentType = payload.type;
        rawText = aiResult.rawText || rawText;
        engineType = 'gemini-vision';
      } else if (settings.groqApiKey) {
        const aiResult = await callGroqVision(imageDataUrl, settings.groqApiKey, settings.groqModel);
        payload = aiResult.payload;
        contentType = payload.type;
        rawText = aiResult.rawText || rawText;
        engineType = 'groq-vision';
      }
    } catch (err) {
      console.warn('Auto AI escalation failed, preserving local OCR result:', err);
    }
  }

  // Generate appropriate title
  let title = 'Text Extraction';
  if (contentType === 'banking' && payload.type === 'banking') {
    const amountStr = payload.data.amount ? ` Rp ${payload.data.amount.toLocaleString('id-ID')}` : '';
    title = `Transfer ${payload.data.bankName}${amountStr}`;
  } else if (contentType === 'receipt' && payload.type === 'receipt') {
    const totalStr = payload.data.total ? ` Rp ${payload.data.total.toLocaleString('id-ID')}` : '';
    title = `Receipt: ${payload.data.storeName}${totalStr}`;
  } else if (contentType === 'table') {
    title = 'Extracted Data Table';
  } else if (contentType === 'code') {
    title = 'Source Code Snippet';
  } else {
    title = fileName || `Screenshot (${rawText.slice(0, 20)}...)`;
  }

  const result: ExtractionResult = {
    id,
    timestamp,
    title,
    sourceType: 'screenshot',
    contentType,
    engine: engineType,
    imageThumbnail,
    fullImageDataUrl: imageDataUrl,
    fileName,
    fileSize,
    payload,
    rawText,
  };

  await db.history.put(result);
  return result;
}

/**
 * On-demand AI enhancement function
 */
export async function enhanceResultWithAi(
  result: ExtractionResult,
  settings: AppSettings,
  onProgress?: (progress: OCRProgress) => void
): Promise<ExtractionResult> {
  const imageSource = result.fullImageDataUrl || result.imageThumbnail;
  if (!imageSource) throw new Error('No image source available to enhance.');

  let aiResult: { payload: ExtractedPayload; rawText: string };
  let engineType: EngineType = 'gemini-vision';

  if (settings.geminiApiKey) {
    if (onProgress) onProgress({ status: 'Enhancing with Google Gemini Vision...', progress: 0.5 });
    aiResult = await callGeminiVision(imageSource, settings.geminiApiKey);
    engineType = 'gemini-vision';
  } else if (settings.groqApiKey) {
    if (onProgress) onProgress({ status: 'Enhancing with Groq Vision...', progress: 0.5 });
    aiResult = await callGroqVision(imageSource, settings.groqApiKey, settings.groqModel);
    engineType = 'groq-vision';
  } else {
    throw new Error('Please configure a free Gemini or Groq API Key in Settings first.');
  }

  const updatedResult: ExtractionResult = {
    ...result,
    payload: aiResult.payload,
    contentType: aiResult.payload.type,
    rawText: aiResult.rawText || result.rawText,
    engine: engineType,
  };

  await db.history.put(updatedResult);
  return updatedResult;
}

import { reconstructTableFromWords, parseTableFromText } from './parsers/table-detector';
import { OCRWord } from './local-ocr';

/**
 * Classifies raw OCR text into domain payload using regex, heuristics, and 2D spatial word coordinates
 */
function classifyLocalOCR(text: string, words?: OCRWord[]): ExtractedPayload {
  const trimmed = text.trim();

  // 1. Spatial 2D table grid reconstruction (from word bounding boxes)
  const spatialTable = reconstructTableFromWords(words);
  if (spatialTable && spatialTable.headers.length >= 2 && spatialTable.rows.length >= 1) {
    return { type: 'table', data: spatialTable };
  }

  // 2. Delimited text table parsing (tabs, pipes, column spacing)
  const textTable = parseTableFromText(trimmed);
  if (textTable && textTable.headers.length >= 2 && textTable.rows.length >= 1) {
    return { type: 'table', data: textTable };
  }

  // 3. Banking transfer proof
  if (isBankingScreenshot(trimmed)) {
    return { type: 'banking', data: parseBankingText(trimmed) };
  }

  // 4. Itemized shopping receipt
  if (isReceiptText(trimmed)) {
    return { type: 'receipt', data: parseReceiptText(trimmed) };
  }

  // 5. Code snippet
  if (/^(import |export |const |let |var |function |class |def |public class |<\?php|SELECT |CREATE TABLE)/m.test(trimmed)) {
    let lang = 'javascript';
    if (trimmed.includes('def ') || trimmed.includes('import numpy') || trimmed.includes('print(')) lang = 'python';
    if (trimmed.includes('SELECT ') || trimmed.includes('FROM ') || trimmed.includes('WHERE ')) lang = 'sql';
    if (trimmed.includes('interface ') || trimmed.includes(': string') || trimmed.includes(': number')) lang = 'typescript';
    if (trimmed.includes('public class ') || trimmed.includes('System.out.println')) lang = 'java';
    return { type: 'code', data: { language: lang, code: trimmed, rawText: trimmed } };
  }

  // 6. General text fallback
  const lines = trimmed.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  return {
    type: 'general',
    data: {
      fullText: trimmed,
      wordCount: trimmed ? trimmed.split(/\s+/).length : 0,
      lineCount: lines.length,
    }
  };
}
