import { ExtractedPayload } from '../types/extractor';

export interface VisionAIParams {
  imageBase64: string; // Base64 data url or raw base64
  apiKey: string;
  provider: 'gemini' | 'groq';
  model?: string;
}

const VISION_SYSTEM_PROMPT = `You are an expert OCR & document intelligence engine. Analyze the provided image (which may be an Indonesian m-banking screenshot, shopping receipt, invoice, shipping tracking slip, data table, programming code, or general document).

Analyze and extract structured information. Output JSON ONLY adhering to ONE of the following formats:

FOR BANKING / E-WALLET PROOFS (BCA, Mandiri, BRI, BNI, Jago, Seabank, GoPay, DANA, OVO, ShopeePay, etc.):
{
  "type": "banking",
  "data": {
    "bankName": "string",
    "transactionType": "transfer" | "payment" | "topup" | "receive" | "qris" | "unknown",
    "senderName": "string or null",
    "senderAccount": "string or null",
    "recipientName": "string or null",
    "recipientAccount": "string or null",
    "recipientBank": "string or null",
    "amount": number,
    "adminFee": number,
    "totalAmount": number,
    "referenceNumber": "string or null",
    "date": "string (YYYY-MM-DD or readable)",
    "time": "string (HH:mm:ss)",
    "status": "SUCCESS" | "PENDING" | "FAILED" | "UNKNOWN"
  },
  "rawText": "full transcript of visible text"
}

FOR SHOPPING / RESTAURANT RECEIPTS / INVOICES:
{
  "type": "receipt",
  "data": {
    "storeName": "string",
    "date": "string or null",
    "time": "string or null",
    "items": [
      { "name": "string", "qty": number, "unitPrice": number, "totalPrice": number }
    ],
    "subtotal": number,
    "tax": number,
    "discount": number,
    "serviceCharge": number,
    "total": number,
    "paymentMethod": "string or null"
  },
  "rawText": "full transcript of visible text"
}

FOR TABULAR / SPREADSHEET / EXCEL / GOOGLE SHEETS / GRID / MULTI-COLUMN DATA:
(CRITICAL: If the image contains a spreadsheet, Excel rows/columns, table headers, or grid cells, ALWAYS return "type": "table" with all columns and rows intact. Do NOT dump it into general text! Do NOT output empty rows. Do NOT use HTML tags like <br> or <br/> inside table cells - use regular text or line breaks.)
{
  "type": "table",
  "data": {
    "headers": ["Col 1 Name", "Col 2 Name", "Col 3 Name", ...],
    "rows": [
      ["Row 1 Col 1", "Row 1 Col 2", "Row 1 Col 3", ...],
      ["Row 2 Col 1", "Row 2 Col 2", "Row 2 Col 3", ...]
    ]
  },
  "rawText": "TSV formatted rows and columns"
}

FOR PROGRAMMING CODE SCREENSHOTS:
{
  "type": "code",
  "data": {
    "language": "string (e.g. typescript, python, sql)",
    "code": "exact formatted code"
  },
  "rawText": "code text"
}

FOR GENERAL TEXT / OTHERS:
{
  "type": "general",
  "data": {
    "fullText": "exact text",
    "summary": "brief summary of document",
    "wordCount": number,
    "lineCount": number,
    "language": "Indonesian" | "English" | "Other"
  },
  "rawText": "full text"
}

OUTPUT VALID JSON ONLY. NO MARKDOWN TICKS, NO EXTRA COMMENTARY.`;

export async function callGeminiVision(imageBase64: string, apiKey: string, model: string = 'gemini-2.5-flash'): Promise<{ payload: ExtractedPayload; rawText: string }> {
  // Strip data URL header if present
  let cleanBase64 = imageBase64;
  let mimeType = 'image/jpeg';
  if (imageBase64.includes(',')) {
    const parts = imageBase64.split(',');
    cleanBase64 = parts[1];
    const mimeMatch = parts[0].match(/:(.*?);/);
    if (mimeMatch) mimeType = mimeMatch[1];
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [
            { text: VISION_SYSTEM_PROMPT },
            {
              inline_data: {
                mime_type: mimeType,
                data: cleanBase64,
              },
            },
          ],
        },
      ],
      generationConfig: {
        response_mime_type: 'application/json',
        temperature: 0.1,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`Google Gemini Error (${response.status}): ${err.error?.message || response.statusText}`);
  }

  const resJson = await response.json();
  const rawContent = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawContent) {
    throw new Error('Gemini did not return a valid response.');
  }

  const cleanJson = rawContent.replace(/```json\n?|\n?```/g, '').trim();
  const parsed = JSON.parse(cleanJson);

  return {
    payload: sanitizeVisionPayload(parsed),
    rawText: parsed.rawText || rawContent,
  };
}

export async function callGroqVision(imageBase64: string, apiKey: string, model: string = 'llama-3.2-11b-vision-preview'): Promise<{ payload: ExtractedPayload; rawText: string }> {
  let imageUrl = imageBase64;
  if (!imageBase64.startsWith('data:')) {
    imageUrl = `data:image/jpeg;base64,${imageBase64}`;
  }

  const endpoint = 'https://api.groq.com/openai/v1/chat/completions';

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model || 'llama-3.2-11b-vision-preview',
      messages: [
        { role: 'system', content: VISION_SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Extract and classify all structured data from this image.' },
            { type: 'image_url', image_url: { url: imageUrl } },
          ],
        },
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`Groq API Error (${response.status}): ${err.error?.message || response.statusText}`);
  }

  const resJson = await response.json();
  const rawContent = resJson.choices?.[0]?.message?.content;
  if (!rawContent) {
    throw new Error('Groq did not return a valid response.');
  }

  const parsed = JSON.parse(rawContent);

  return {
    payload: sanitizeVisionPayload(parsed),
    rawText: parsed.rawText || rawContent,
  };
}

/**
 * Sanitizes vision AI payload: cleans <br> tags from headers/cells and strips empty rows
 */
function sanitizeVisionPayload(parsed: any): ExtractedPayload {
  if (parsed.type === 'table' && parsed.data) {
    const rawHeaders = Array.isArray(parsed.data.headers) ? parsed.data.headers : [];
    const rawRows = Array.isArray(parsed.data.rows) ? parsed.data.rows : [];

    const headers = rawHeaders.map((h: any) =>
      String(h ?? '').replace(/<br\s*\/?>/gi, ' ').trim()
    );

    const rows = rawRows
      .map((row: any) =>
        (Array.isArray(row) ? row : []).map((cell: any) =>
          String(cell ?? '').replace(/<br\s*\/?>/gi, '\n').trim()
        )
      )
      .filter((row: string[]) =>
        row.some((cell: string) => cell.replace(/<br\s*\/?>/gi, '').trim().length > 0)
      );

    return {
      type: 'table',
      data: {
        headers,
        rows,
        rawText:
          parsed.data.rawText ||
          [headers.join('\t'), ...rows.map((r: string[]) => r.join('\t'))].join('\n'),
      },
    };
  }

  return {
    type: parsed.type || 'general',
    data: parsed.data || parsed,
  } as ExtractedPayload;
}

