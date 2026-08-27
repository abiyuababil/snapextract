# SnapExtract ⚡ — Visual Data & QR Extractor

> **Instant, private, and 100% free visual lens for screenshots, receipts, spreadsheets, banking proofs, and QR codes.**

SnapExtract is a fast, client-side utility tool designed to convert unstructured images into actionable structured data. It runs **95%+ locally inside your browser** (zero server costs, zero quota limits, 100% private) with autonomous escalation to free-tier Vision AI (Google Gemini 2.5 Flash / Groq Vision) for ambiguous or complex documents.

---

## ✨ Core Capabilities

- ⚡ **95% Local-First Engine**:
  - Instant offline barcode & QR decoding (`jsQR` + `@zxing/library`).
  - Fast client-side OCR (`Tesseract.js`) with image pre-processing (contrast boost & grayscale).
  - 100% private: your sensitive receipts, banking transfers, and files never leave your device unless you choose cloud AI enhancement.
- 🤖 **Autonomous AI Escalation**:
  - Automatically escalates to free-tier Google Gemini 2.5 Flash or Groq Vision when OCR confidence is low, blurry, or ambiguous.
  - On-demand `"✨ Enhance with AI"` 1-click re-extraction.
- 📊 **Structured Data Extraction**:
  - **M-Banking & E-Wallet Proofs**: Total transaction, reference numbers, sender, recipient, destination account, fees, timestamps (BCA, Mandiri, BRI, BNI, Jago, SeaBank, GoPay, OVO, DANA, ShopeePay, etc.).
  - **Itemized Receipts**: Store name, items with quantity and unit prices, subtotal, discounts, VAT, and grand totals.
  - **Excel & Spreadsheet Tables**: 2D spatial grid reconstruction with per-cell copying, row/col copying, and direct `"Copy for Excel"` (TSV) integration.
  - **QRIS National Standard**: Merchant name, city, postal code, NMID, static/dynamic amount, and CRC16 checksum verification.
  - **Wi-Fi QR Codes**: Network SSID, password toggle, encryption type, and direct copy.
  - **vCard Contacts**: Full name, phone numbers, email addresses, organization, and 1-click `.vcf` download.
  - **Maps & URLs**: Coordinates with Google Maps redirection, secure HTTPS detection.
  - **Source Code**: Programming language detection with line-numbered viewer.
- 🎨 **Image Workbench**:
  - **Undo & Redo** (`Ctrl+Z` / `Ctrl+Y`): Multi-step redact and crop history.
  - **Hand Grab & Pan**: Smooth mouse dragging when zoomed in (`Spacebar + Drag`).
  - **Privacy Redactor**: Blackout and blur sensitive account numbers or balances before sharing.
  - **Crop Tool**: Focus on specific sub-regions for re-extraction.
- 💾 **Local Storage & Exports**:
  - Automatic persistent scan history via IndexedDB (`Dexie.js`).
  - 1-click export to **JSON**, **CSV**, **VCF**, or **Redacted PNG**.

---

## 🛠️ Tech Stack

- **Framework**: React 19 + TypeScript + Vite 8
- **Styling**: Tailwind CSS v4 (Pure utility, minimal dark aesthetic)
- **Local QR Engine**: `jsQR` + `@zxing/library`
- **Local OCR Engine**: `tesseract.js` (WebAssembly & Web Workers)
- **Local Database**: `dexie` (IndexedDB)
- **Cloud AI (Optional Free Tier)**: Google Gemini 2.5 Flash API / Groq Vision API
- **Icons**: `lucide-react`

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm / yarn / pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/abiyuababil/snapextract.git

# Navigate to project directory
cd snapextract

# Install dependencies
npm install

# Start local development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔑 Optional Free AI Setup

SnapExtract works **100% offline out-of-the-box**. If you want autonomous AI escalation for blurry or complex handwriting:
1. Get a free API key from [Google AI Studio](https://aistudio.google.com/app/apikey) (no credit card required).
2. Click **Settings** in the top navigation of SnapExtract and paste your key.
3. Your key is stored securely in your browser's local storage.

---

## 📄 License

MIT License © 2026 Abiyu Ababil.

