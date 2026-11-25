/**
 * Compresses an image File or Data URL to a lightweight, readable JPEG data URL (~50-120KB)
 * so it fits safely in browser storage without exceeding quotas.
 */
export async function compressImage(
  input: File | Blob | string,
  maxWidth = 1024,
  maxHeight = 1024,
  quality = 0.72
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      let { width, height } = img;

      // Scale down proportionally if larger than max bounds
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas 2D context unavailable'));
        return;
      }

      // Draw with white background (useful for transparent PNGs)
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      // Export as compressed JPEG
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedDataUrl);
    };

    img.onerror = () => {
      reject(new Error('Failed to load image for compression'));
    };

    if (typeof input === 'string') {
      img.src = input;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(input);
    }
  });
}

/**
 * Creates an elegant SVG mock invoice document as a sample preview data URL
 */
export function generateSampleInvoiceSvg(productName: string, amount: string, invoiceNum: string, date: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800">
    <rect width="600" height="800" fill="#FAFAFA" />
    <rect x="20" y="20" width="560" height="760" rx="8" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="2" />
    
    <!-- Header -->
    <rect x="40" y="40" width="520" height="70" rx="4" fill="#0B132B" />
    <text x="60" y="82" font-family="sans-serif" font-size="20" font-weight="bold" fill="#FFFFFF">TAX INVOICE / CASH MEMO</text>
    <text x="60" y="98" font-family="sans-serif" font-size="11" fill="#93C5FD">RETAIL ELECTRONICS &amp; APPLIANCES LTD (GSTIN: 29AABCU9603R1ZX)</text>
    
    <!-- Meta details -->
    <text x="60" y="150" font-family="sans-serif" font-size="12" fill="#64748B">Invoice No:</text>
    <text x="140" y="150" font-family="monospace" font-size="13" font-weight="bold" fill="#0F172A">${invoiceNum}</text>
    
    <text x="360" y="150" font-family="sans-serif" font-size="12" fill="#64748B">Date:</text>
    <text x="410" y="150" font-family="sans-serif" font-size="13" font-weight="bold" fill="#0F172A">${date}</text>
    
    <line x1="40" y1="180" x2="560" y2="180" stroke="#E2E8F0" stroke-width="1.5" />
    
    <!-- Item Table Header -->
    <rect x="40" y="200" width="520" height="32" fill="#F1F5F9" />
    <text x="60" y="221" font-family="sans-serif" font-size="11" font-weight="bold" fill="#334155">DESCRIPTION</text>
    <text x="440" y="221" font-family="sans-serif" font-size="11" font-weight="bold" fill="#334155" text-anchor="end">TOTAL (INR)</text>
    
    <!-- Item Row -->
    <text x="60" y="260" font-family="sans-serif" font-size="13" font-weight="bold" fill="#0F172A">${productName.slice(0, 36)}</text>
    <text x="60" y="280" font-family="sans-serif" font-size="11" fill="#64748B">HSN: 8418 · Qty: 1 Unit · 18% GST Included</text>
    <text x="540" y="265" font-family="sans-serif" font-size="14" font-weight="bold" fill="#0F172A" text-anchor="end">${amount}</text>
    
    <line x1="40" y1="310" x2="560" y2="310" stroke="#E2E8F0" stroke-width="1" />
    
    <!-- Total Section -->
    <text x="380" y="350" font-family="sans-serif" font-size="12" fill="#64748B">Net Total:</text>
    <text x="540" y="350" font-family="sans-serif" font-size="16" font-weight="bold" fill="#1D4ED8" text-anchor="end">${amount}</text>
    
    <!-- Stamp -->
    <rect x="60" y="620" width="160" height="60" rx="4" fill="none" stroke="#22C55E" stroke-width="2" stroke-dasharray="4 2" />
    <text x="140" y="645" font-family="sans-serif" font-size="12" font-weight="bold" fill="#16A34A" text-anchor="middle">VERIFIED PAID</text>
    <text x="140" y="665" font-family="sans-serif" font-size="10" fill="#16A34A" text-anchor="middle">OFFICIAL STAMP</text>
    
    <text x="300" y="740" font-family="sans-serif" font-size="10" fill="#94A3B8" text-anchor="middle">Digital copy verified &amp; stored in HomeVault India</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
