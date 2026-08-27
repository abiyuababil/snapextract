import jsQR from 'jsqr';
import { MultiFormatReader, RGBLuminanceSource, BinaryBitmap, HybridBinarizer } from '@zxing/library';

export interface DecodedCode {
  text: string;
  format: 'QR_CODE' | 'EAN_13' | 'EAN_8' | 'CODE_128' | 'CODE_39' | 'UPC_A' | 'UPC_E' | 'DATA_MATRIX' | 'UNKNOWN';
  location?: {
    topLeft: { x: number; y: number };
    topRight: { x: number; y: number };
    bottomRight: { x: number; y: number };
    bottomLeft: { x: number; y: number };
  };
}

/**
 * Scans an HTML Image or Canvas for QR codes and 1D/2D Barcodes
 */
export async function scanCodeFromImage(imageElement: HTMLImageElement | HTMLCanvasElement): Promise<DecodedCode | null> {
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null;

  if (imageElement instanceof HTMLCanvasElement) {
    canvas = imageElement;
    ctx = canvas.getContext('2d', { willReadFrequently: true });
  } else {
    canvas = document.createElement('canvas');
    canvas.width = imageElement.naturalWidth || imageElement.width;
    canvas.height = imageElement.naturalHeight || imageElement.height;
    ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (ctx) {
      ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height);
    }
  }

  if (!ctx || canvas.width === 0 || canvas.height === 0) {
    return null;
  }

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  // 1. First Pass: jsQR (Fastest for standard QR codes)
  try {
    const qrResult = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'attemptBoth',
    });

    if (qrResult && qrResult.data) {
      return {
        text: qrResult.data,
        format: 'QR_CODE',
        location: qrResult.location ? {
          topLeft: qrResult.location.topLeftCorner,
          topRight: qrResult.location.topRightCorner,
          bottomRight: qrResult.location.bottomRightCorner,
          bottomLeft: qrResult.location.bottomLeftCorner,
        } : undefined
      };
    }
  } catch (err) {
    console.warn('jsQR scan failed, falling back to ZXing:', err);
  }

  // 2. Second Pass: ZXing Multi-format reader (Handles 1D Barcodes & damaged QR codes)
  try {
    const luminanceSource = new RGBLuminanceSource(
      new Uint8ClampedArray(imageData.data.buffer),
      imageData.width,
      imageData.height
    );
    const binaryBitmap = new BinaryBitmap(new HybridBinarizer(luminanceSource));
    const reader = new MultiFormatReader();
    const result = reader.decode(binaryBitmap);

    if (result && result.getText()) {
      return {
        text: result.getText(),
        format: (result.getBarcodeFormat()?.toString() as any) || 'QR_CODE',
      };
    }
  } catch (err) {
    // No barcode found
  }

  return null;
}

