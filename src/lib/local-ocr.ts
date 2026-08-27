import { createWorker } from 'tesseract.js';

export interface OCRProgress {
  status: string;
  progress: number;
}

export interface OCRWord {
  text: string;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  confidence?: number;
}

export interface LocalOCRResult {
  text: string;
  confidence: number;
  words: OCRWord[];
}

/**
 * Pre-processes image canvas for higher OCR accuracy
 * (Grayscale + Adaptive Contrast Boost)
 */
export function preprocessCanvasForOCR(sourceCanvas: HTMLCanvasElement): HTMLCanvasElement {
  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = sourceCanvas.width;
  outputCanvas.height = sourceCanvas.height;
  const ctx = outputCanvas.getContext('2d', { willReadFrequently: true });
  
  if (!ctx) return sourceCanvas;
  
  ctx.drawImage(sourceCanvas, 0, 0);
  const imgData = ctx.getImageData(0, 0, outputCanvas.width, outputCanvas.height);
  const d = imgData.data;

  // Simple grayscale + contrast enhancement
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i];
    const g = d[i + 1];
    const b = d[i + 2];
    // Luminance
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    
    // Contrast stretch (factor 1.2)
    const factor = 1.2;
    const adjusted = Math.min(255, Math.max(0, (gray - 128) * factor + 128));

    d[i] = adjusted;
    d[i + 1] = adjusted;
    d[i + 2] = adjusted;
  }

  ctx.putImageData(imgData, 0, 0);
  return outputCanvas;
}

let workerInstance: any = null;

/**
 * Runs client-side offline OCR on an image/canvas
 */
export async function runLocalOCR(
  imageSource: HTMLImageElement | HTMLCanvasElement | string,
  onProgress?: (progress: OCRProgress) => void
): Promise<LocalOCRResult> {
  try {
    if (onProgress) onProgress({ status: 'Starting OCR Engine...', progress: 0.1 });

    if (!workerInstance) {
      if (onProgress) onProgress({ status: 'Loading language data...', progress: 0.2 });
      workerInstance = await createWorker('ind+eng', 1, {
        logger: (m: any) => {
          if (onProgress && m.status) {
            const p = m.progress || 0;
            if (m.status === 'recognizing text') {
              onProgress({ status: `Recognizing text (${Math.round(p * 100)}%)`, progress: 0.3 + p * 0.6 });
            } else {
              onProgress({ status: m.status, progress: 0.3 });
            }
          }
        },
      });
    }

    let inputSource = imageSource;
    if (imageSource instanceof HTMLImageElement) {
      const canvas = document.createElement('canvas');
      canvas.width = imageSource.naturalWidth;
      canvas.height = imageSource.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(imageSource, 0, 0);
        inputSource = preprocessCanvasForOCR(canvas);
      }
    } else if (imageSource instanceof HTMLCanvasElement) {
      inputSource = preprocessCanvasForOCR(imageSource);
    }

    if (onProgress) onProgress({ status: 'Analyzing text & layout...', progress: 0.85 });

    const ret = await workerInstance.recognize(inputSource);
    
    if (onProgress) onProgress({ status: 'Done', progress: 1 });

    const words: OCRWord[] = (ret.data?.words || []).map((w: any) => ({
      text: w.text || '',
      x0: w.bbox ? w.bbox.x0 : 0,
      y0: w.bbox ? w.bbox.y0 : 0,
      x1: w.bbox ? w.bbox.x1 : 0,
      y1: w.bbox ? w.bbox.y1 : 0,
      confidence: w.confidence || 0,
    }));

    return {
      text: ret.data.text || '',
      confidence: ret.data.confidence || 0,
      words,
    };
  } catch (err: any) {
    console.error('Local OCR Error:', err);
    throw new Error(`Failed to extract text locally: ${err.message || err}`);
  }
}
