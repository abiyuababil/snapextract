// TypeScript schemas for SnapExtract

export type EngineType = 'local-qr' | 'local-ocr' | 'gemini-vision' | 'groq-vision';

export type ContentType = 
  | 'qris'
  | 'wifi'
  | 'vcard'
  | 'url'
  | 'geo'
  | 'barcode'
  | 'banking'
  | 'receipt'
  | 'shipping'
  | 'table'
  | 'code'
  | 'general';

export interface QrisData {
  merchantName: string;
  merchantCity?: string;
  postalCode?: string;
  nmid?: string;
  amount?: number;
  feeType?: string;
  feeValue?: number;
  crc?: string;
  isValidCrc?: boolean;
  currency?: string;
  rawPayload: string;
}

export interface WifiData {
  ssid: string;
  password?: string;
  encryption: 'WPA' | 'WEP' | 'nopass' | 'WPA3' | string;
  isHidden?: boolean;
  rawPayload: string;
}

export interface VCardData {
  fullName: string;
  organization?: string;
  title?: string;
  phones: string[];
  emails: string[];
  address?: string;
  url?: string;
  rawPayload: string;
}

export interface UrlData {
  url: string;
  protocol: string;
  domain: string;
  path: string;
  isSecure: boolean;
  rawPayload: string;
}

export interface GeoData {
  latitude: number;
  longitude: number;
  query?: string;
  mapUrl: string;
  rawPayload: string;
}

export interface BarcodeData {
  format: string;
  text: string;
  rawPayload: string;
}

export interface BankingData {
  bankName: string;
  transactionType: 'transfer' | 'payment' | 'topup' | 'receive' | 'qris' | 'unknown';
  senderName?: string;
  senderAccount?: string;
  recipientName?: string;
  recipientAccount?: string;
  recipientBank?: string;
  amount: number;
  adminFee?: number;
  totalAmount: number;
  referenceNumber?: string;
  date?: string;
  time?: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED' | 'UNKNOWN';
  rawText: string;
}

export interface ReceiptItem {
  name: string;
  qty: number;
  unitPrice: number;
  totalPrice: number;
}

export interface ReceiptData {
  storeName: string;
  date?: string;
  time?: string;
  items: ReceiptItem[];
  subtotal?: number;
  tax?: number;
  discount?: number;
  serviceCharge?: number;
  total: number;
  paymentMethod?: string;
  rawText: string;
}

export interface ShippingData {
  courierName: string;
  trackingNumber: string;
  senderName?: string;
  receiverName?: string;
  destination?: string;
  status?: string;
  rawText: string;
}

export interface TableData {
  headers: string[];
  rows: string[][];
  rawText: string;
}

export interface CodeData {
  language: string;
  code: string;
  rawText: string;
}

export interface GeneralTextData {
  fullText: string;
  wordCount: number;
  lineCount: number;
  summary?: string;
  language?: string;
}

export type ExtractedPayload = 
  | { type: 'qris'; data: QrisData }
  | { type: 'wifi'; data: WifiData }
  | { type: 'vcard'; data: VCardData }
  | { type: 'url'; data: UrlData }
  | { type: 'geo'; data: GeoData }
  | { type: 'barcode'; data: BarcodeData }
  | { type: 'banking'; data: BankingData }
  | { type: 'receipt'; data: ReceiptData }
  | { type: 'shipping'; data: ShippingData }
  | { type: 'table'; data: TableData }
  | { type: 'code'; data: CodeData }
  | { type: 'general'; data: GeneralTextData };

export interface ExtractionResult {
  id: string;
  timestamp: number;
  title: string;
  sourceType: 'qr' | 'barcode' | 'screenshot' | 'document';
  contentType: ContentType;
  engine: EngineType;
  imageThumbnail: string;
  fullImageDataUrl?: string;
  fileName?: string;
  fileSize?: number;
  payload: ExtractedPayload;
  rawText: string;
}

export interface AppSettings {
  ocrEngine: 'local' | 'gemini' | 'groq';
  geminiApiKey: string;
  groqApiKey: string;
  groqModel: string;
  autoRedactSensitives: boolean;
  copyFeedback: boolean;
  historyLimit: number;
}
