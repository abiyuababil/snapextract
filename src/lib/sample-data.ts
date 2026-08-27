// Sample data and canvas generators for instant test

export interface SamplePreset {
  id: string;
  name: string;
  category: 'QRIS' | 'Wi-Fi' | 'Banking' | 'Receipt' | 'Table' | 'vCard';
  description: string;
  icon: string;
  generateDataUrl: () => Promise<string>;
}

/**
 * Helper to draw a text receipt/banking card on a canvas and export as data URL
 */
function createTextCanvas(
  width: number,
  height: number,
  bgColor: string,
  drawFn: (ctx: CanvasRenderingContext2D, width: number, height: number) => void
): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);
  drawFn(ctx, width, height);
  return canvas.toDataURL('image/png');
}

/**
 * Creates QR code canvas using quick matrix renderer
 */
async function generateQrDataUrl(text: string): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 400;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, 400, 400);

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.drawImage(img, 20, 20, 360, 360);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => {
      ctx.fillStyle = '#000000';
      ctx.fillRect(40, 40, 80, 80);
      ctx.clearRect(60, 60, 40, 40);
      ctx.fillRect(70, 70, 20, 20);

      ctx.fillRect(280, 40, 80, 80);
      ctx.clearRect(300, 60, 40, 40);
      ctx.fillRect(310, 70, 20, 20);

      ctx.fillRect(40, 280, 80, 80);
      ctx.clearRect(60, 300, 40, 40);
      ctx.fillRect(70, 310, 20, 20);

      ctx.fillStyle = '#111827';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(text.slice(0, 30), 200, 380);
      resolve(canvas.toDataURL('image/png'));
    };
    img.src = `https://api.qrserver.com/v1/create-qr-code/?size=360x360&data=${encodeURIComponent(text)}`;
  });
}

export const SAMPLE_PRESETS: SamplePreset[] = [
  {
    id: 'sample-qris',
    name: 'QRIS Dynamic Merchant',
    category: 'QRIS',
    description: 'Dynamic QRIS Merchant for Kopi Kenangan Rp 38,000',
    icon: 'QrCode',
    generateDataUrl: () => {
      const qrisString = '00020101021226590014ID.LINKAJA.WWW01189360091100212345670208123456780303UMI51440014ID.DANA.WWW01189360091100212345670208123456780303UMI5204581253033605405380005802ID5913KOPI KENANGAN6007JAKARTA61051219062070703A01630489A1';
      return generateQrDataUrl(qrisString);
    }
  },
  {
    id: 'sample-wifi',
    name: 'Cafe Wi-Fi QR',
    category: 'Wi-Fi',
    description: 'Wi-Fi SSID: KopiLokal_5G, Password: kopienakbanget',
    icon: 'Wifi',
    generateDataUrl: () => {
      const wifiString = 'WIFI:S:KopiLokal_5G;T:WPA;P:kopienakbanget;H:false;;';
      return generateQrDataUrl(wifiString);
    }
  },
  {
    id: 'sample-bca',
    name: 'BCA Transfer Proof',
    category: 'Banking',
    description: 'BCA Mobile transfer receipt Rp 250,000 (Success)',
    icon: 'Landmark',
    generateDataUrl: async () => {
      return createTextCanvas(540, 780, '#0a3a78', (ctx, w) => {
        // Header
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('m-Transfer BCA', w / 2, 50);

        // Status Card
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.roundRect(24, 80, w - 48, 660, 16);
        ctx.fill();

        // Check icon circle
        ctx.fillStyle = '#10B981';
        ctx.beginPath();
        ctx.arc(w / 2, 140, 32, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 28px sans-serif';
        ctx.fillText('✓', w / 2, 150);

        // Status text
        ctx.fillStyle = '#0F172A';
        ctx.font = 'bold 20px sans-serif';
        ctx.fillText('TRANSFER SUCCESS', w / 2, 205);

        ctx.fillStyle = '#64748B';
        ctx.font = '14px sans-serif';
        ctx.fillText('27 Aug 2026, 14:35:22 WIB', w / 2, 230);

        // Amount Box
        ctx.fillStyle = '#F1F5F9';
        ctx.beginPath();
        ctx.roundRect(48, 255, w - 96, 75, 12);
        ctx.fill();

        ctx.fillStyle = '#0F172A';
        ctx.font = 'bold 30px monospace';
        ctx.fillText('Rp 250.000', w / 2, 305);

        // Key Value Rows
        const drawRow = (label: string, value: string, y: number, isBold: boolean = false) => {
          ctx.textAlign = 'left';
          ctx.fillStyle = '#64748B';
          ctx.font = '14px sans-serif';
          ctx.fillText(label, 48, y);

          ctx.textAlign = 'right';
          ctx.fillStyle = '#0F172A';
          ctx.font = isBold ? 'bold 15px sans-serif' : '15px sans-serif';
          ctx.fillText(value, w - 48, y);

          ctx.strokeStyle = '#E2E8F0';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(48, y + 15);
          ctx.lineTo(w - 48, y + 15);
          ctx.stroke();
        };

        drawRow('Reference No.', '202608271435229871', 370);
        drawRow('Source Account', 'BCA - 1234567890 (AHMAD)', 420);
        drawRow('Recipient Name', 'BUDI SETIAWAN', 470, true);
        drawRow('Recipient Bank', 'BANK MANDIRI', 520);
        drawRow('Destination Acc.', '1400012345678', 570);
        drawRow('Admin Fee', 'Rp 2.500 (BI-FAST)', 620);
        drawRow('Total Transaction', 'Rp 252.500', 670, true);
      });
    }
  },
  {
    id: 'sample-receipt',
    name: 'Shopping Receipt',
    category: 'Receipt',
    description: 'Itemized retail receipt with VAT & discounts',
    icon: 'Receipt',
    generateDataUrl: async () => {
      return createTextCanvas(480, 720, '#FAF9F6', (ctx, w) => {
        ctx.fillStyle = '#1E293B';
        ctx.textAlign = 'center';
        ctx.font = 'bold 22px monospace';
        ctx.fillText('INDOMARET POINT', w / 2, 45);

        ctx.font = '13px monospace';
        ctx.fillStyle = '#64748B';
        ctx.fillText('JL. SUDIRMAN KAV. 45 JAKARTA', w / 2, 70);
        ctx.fillText('CASHIER: SITI | 27/08/2026 11:20', w / 2, 90);

        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = '#CBD5E1';
        ctx.beginPath();
        ctx.moveTo(30, 110);
        ctx.lineTo(w - 30, 110);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.textAlign = 'left';
        ctx.font = '14px monospace';
        ctx.fillStyle = '#0F172A';

        const drawItem = (name: string, qty: number, price: number, total: number, y: number) => {
          ctx.textAlign = 'left';
          ctx.fillText(name, 30, y);
          ctx.textAlign = 'right';
          ctx.fillText(`${qty} x ${price.toLocaleString('id-ID')} = ${total.toLocaleString('id-ID')}`, w - 30, y + 20);
        };

        drawItem('ULTRA MILK CHOCOLATE 250ML', 2, 6500, 13000, 145);
        drawItem('INDOMIE FRIED NOODLES', 5, 3100, 15500, 195);
        drawItem('SILVERQUEEN CASHEW 58G', 1, 16500, 16500, 245);
        drawItem('POCARI SWEAT CAN 330ML', 2, 7800, 15600, 295);
        drawItem('TOAST BREAD WHITE SARI', 1, 14000, 14000, 345);

        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(30, 400);
        ctx.lineTo(w - 30, 400);
        ctx.stroke();
        ctx.setLineDash([]);

        const drawTotalRow = (label: string, val: string, y: number, isBold: boolean = false) => {
          ctx.textAlign = 'left';
          ctx.font = isBold ? 'bold 16px monospace' : '14px monospace';
          ctx.fillText(label, 30, y);
          ctx.textAlign = 'right';
          ctx.fillText(val, w - 30, y);
        };

        drawTotalRow('SUBTOTAL', 'Rp 74.600', 435);
        drawTotalRow('MEMBER DISCOUNT', '-Rp 4.600', 465);
        drawTotalRow('VAT (11%)', 'Rp 7.700', 495);
        drawTotalRow('FINAL TOTAL', 'Rp 77.700', 540, true);
        drawTotalRow('PAID (QRIS)', 'Rp 77.700', 575);
        drawTotalRow('CHANGE', 'Rp 0', 605);

        ctx.textAlign = 'center';
        ctx.font = 'italic 13px monospace';
        ctx.fillStyle = '#64748B';
        ctx.fillText('THANK YOU FOR SHOPPING', w / 2, 670);
      });
    }
  },
  {
    id: 'sample-table',
    name: 'Sales Report Table',
    category: 'Table',
    description: 'Spreadsheet table screenshot with 5 columns and 5 rows',
    icon: 'Table',
    generateDataUrl: async () => {
      return createTextCanvas(600, 400, '#FFFFFF', (ctx, w) => {
        ctx.fillStyle = '#0F172A';
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('Sales Summary Report Q3 2026', 30, 40);

        ctx.fillStyle = '#1E293B';
        ctx.fillRect(30, 60, w - 60, 40);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText('ID', 45, 85);
        ctx.fillText('Product', 120, 85);
        ctx.fillText('Category', 280, 85);
        ctx.fillText('Qty Sold', 410, 85);
        ctx.fillText('Revenue', 490, 85);

        const rows = [
          ['PRD-01', 'Arabica Coffee Beans 250g', 'Beverage', '142', 'Rp 12.070.000'],
          ['PRD-02', 'Organic Green Tea', 'Beverage', '98', 'Rp 4.410.000'],
          ['PRD-03', 'Almond Croissant', 'Bakery', '215', 'Rp 6.450.000'],
          ['PRD-04', 'Stainless Tumbler 500ml', 'Merchandise', '64', 'Rp 9.600.000'],
          ['PRD-05', 'Drip Coffee Pack (5x)', 'Beverage', '180', 'Rp 8.100.000'],
        ];

        rows.forEach((row, idx) => {
          const y = 100 + (idx * 50);
          ctx.fillStyle = idx % 2 === 0 ? '#F8FAFC' : '#FFFFFF';
          ctx.fillRect(30, y, w - 60, 50);

          ctx.strokeStyle = '#E2E8F0';
          ctx.strokeRect(30, y, w - 60, 50);

          ctx.fillStyle = '#0F172A';
          ctx.font = '14px sans-serif';
          ctx.fillText(row[0], 45, y + 30);
          ctx.fillText(row[1], 120, y + 30);
          ctx.fillText(row[2], 280, y + 30);
          ctx.fillText(row[3], 410, y + 30);
          ctx.fillText(row[4], 490, y + 30);
        });
      });
    }
  }
];
