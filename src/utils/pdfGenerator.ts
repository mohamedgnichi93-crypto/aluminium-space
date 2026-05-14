import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Order } from '../store/ordersStore';
import { ALL_COLORS } from '../data/colors';
import { formatPrice as formatPriceUtil, formatPriceDT } from './formatPrice';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const COLORS = {
  blue: [26, 93, 168] as [number, number, number],
  darkNavy: [13, 27, 42] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  lightGray: [245, 247, 250] as [number, number, number],
  medGray: [156, 163, 175] as [number, number, number],
  darkGray: [55, 65, 81] as [number, number, number],
  black: [0, 0, 0] as [number, number, number],
  red: [220, 38, 38] as [number, number, number],
  green: [34, 197, 94] as [number, number, number],
};

const MARGIN = { left: 14, right: 14, top: 14, bottom: 20 };
const PAGE_W = 210;
const PAGE_H = 297;
const CONTENT_W = PAGE_W - MARGIN.left - MARGIN.right; // 182mm

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function resolveAssetUrl(path: string): string {
  if (path.startsWith('http')) return path;
  
  // Vite exposes BASE_URL (defaults to "/")
  const base = import.meta.env.BASE_URL || '/';
  const absoluteBase = base.startsWith('http') ? base : `${window.location.origin}${base}`;
  
  const cleanBase = absoluteBase.endsWith('/') ? absoluteBase.slice(0, -1) : absoluteBase;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
}

function formatDT(millimes: number): string {
  return formatPriceUtil(millimes / 1000);
}

function formatDTWithUnit(millimes: number): string {
  return `${formatDT(millimes)}\u00A0DT`;
}

function todayFR(): string {
  return new Date().toLocaleDateString('fr-TN', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
}

// ─── SECTION BUILDERS ─────────────────────────────────────────────────────────

function drawHeader(doc: jsPDF, orderId?: string): void {
  // Blue top accent bar
  doc.setFillColor(...COLORS.blue);
  doc.rect(0, 0, PAGE_W, 3, 'F');

  // Logo area (left) — enlarged, no text below
  try {
    const logoUrl = resolveAssetUrl('/logo-aluminium-space.png');
    doc.addImage(logoUrl, 'PNG', MARGIN.left, 6, 38, 28);
  } catch {
    // Logo fallback: text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...COLORS.darkNavy);
    doc.text('ALUMINIUM SPACE', MARGIN.left, 22);
  }

  // DEVIS OFFICIEL title (right)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...COLORS.blue);
  doc.text('DEVIS', PAGE_W - MARGIN.right, 18, { align: 'right' });

  // Date + Validité (right)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...COLORS.darkGray);
  doc.text(`Date : ${todayFR()}`, PAGE_W - MARGIN.right, 25, { align: 'right' });
  doc.text('Validité : 10 jours', PAGE_W - MARGIN.right, 30, { align: 'right' });
  if (orderId) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...COLORS.blue);
    doc.text(`Code de suivi : #${orderId}`, PAGE_W - MARGIN.right, 35, { align: 'right' });
  }

  // Horizontal separator
  doc.setDrawColor(...COLORS.blue);
  doc.setLineWidth(0.6);
  doc.line(MARGIN.left, 36, PAGE_W - MARGIN.right, 36);
}

function drawFromTo(doc: jsPDF, order: Order): number {
  const startY = 41;
  const colW = CONTENT_W / 2 - 3;

  // DE block
  doc.setFillColor(...COLORS.lightGray);
  doc.roundedRect(MARGIN.left, startY, colW, 38, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.blue);
  doc.text('DE :', MARGIN.left + 4, startY + 6);

  doc.setTextColor(...COLORS.darkNavy);
  doc.setFontSize(9);
  doc.text('Aluminium Space', MARGIN.left + 4, startY + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.darkGray);
  const deLines = [
    '125 lot Laaroussi, Mghira',
    'Tunis, Tunisie',
    'Tél : (+216) 53 186 611',
    'Email : contact@aluminiumspace.com',
  ];
  deLines.forEach((line, i) => {
    doc.text(line, MARGIN.left + 4, startY + 18 + i * 5);
  });

  // À block
  const col2X = MARGIN.left + colW + 6;
  doc.setFillColor(...COLORS.lightGray);
  doc.roundedRect(col2X, startY, colW, 38, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.blue);
  doc.text('À :', col2X + 4, startY + 6);

  doc.setTextColor(...COLORS.darkNavy);
  doc.setFontSize(9);
  doc.text(order.clientInfo?.fullName || 'Client', col2X + 4, startY + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.darkGray);
  const clientLines = [
    order.clientInfo?.address || '',
    order.clientInfo?.phone ? `Tél : ${order.clientInfo.phone}` : '',
    order.clientInfo?.email ? `Email : ${order.clientInfo.email}` : '',
  ].filter(Boolean);
  clientLines.forEach((line, i) => {
    doc.text(line, col2X + 4, startY + 18 + i * 5);
  });

  return startY + 38 + 6; // return Y after this section
}

async function getBase64Image(url: string): Promise<string> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch { return ''; }
}

async function drawItemsTable(doc: jsPDF, order: Order, startY: number): Promise<number> {
  // Column widths — must sum to 182mm
  // Desc(58) + Dims(30) + Qty(12) + PU(28) + Rem(26) + Net(28) = 182 ✅
  const COL_WIDTHS = [58, 30, 12, 28, 26, 28];

  const brutHTForPct = order.items.reduce((sum, it) => sum + it.unitPrice * (it.quantity || 1), 0);
  const remisePct = brutHTForPct > 0 ? Math.round((order.remise / brutHTForPct) * 100) : 0;

  const tableData = order.items.map(item => [
    item.productName +
    (item.openingType === 'fenetre' ? ' — Fenêtre' : item.openingType === 'porte' ? ' — Porte' : '') +
    (item.meshType ? '\nFilet ' + item.meshType.toUpperCase() : '') +
    (item.color ? '\nCouleur :    ' + item.color + ((item.colorSurchargePct ?? 0) > 0 ? ` (+${item.colorSurchargePct}%)` : '') : ''),
    `${item.width}\u00A0×\u00A0${item.height}\u00A0cm`,
    String(item.quantity || 1),
    formatDTWithUnit(item.unitPrice),
    formatDTWithUnit(item.unitPrice * (item.quantity || 1) * (remisePct / 100)),
    formatDTWithUnit(item.unitPrice * (item.quantity || 1) * (1 - remisePct / 100)),
  ]);

  const colibriImg = await getBase64Image(resolveAssetUrl('/images/colibri-50.png'));
  const sidneyImg = await getBase64Image(resolveAssetUrl('/images/sidney-50.png'));
  const sidneyAcImg = await getBase64Image(resolveAssetUrl('/images/sidney-50-ac.png'));
  const elbaImg = await getBase64Image(resolveAssetUrl('/images/elba.png'));
  const plisseImg = await getBase64Image(resolveAssetUrl('/images/plisse31.png'));

  autoTable(doc, {
    startY,
    head: [[
      'Description',
      'Dimensions',
      'Qté',
      'P.U\u00A0HT',
      `Remise\u00A0${remisePct}%`,
      'Net\u00A0HT',
    ]],
    body: tableData,
    margin: { left: MARGIN.left, right: MARGIN.right },
    tableWidth: CONTENT_W,
    styles: {
      fontSize: 8.5,
      cellPadding: { top: 4, bottom: 4, left: 3, right: 3 },
      overflow: 'linebreak',
      lineColor: [220, 220, 220],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: COLORS.blue,
      textColor: COLORS.white,
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'center',
      valign: 'middle',
    },
    bodyStyles: {
      textColor: COLORS.darkGray,
      valign: 'middle',
    },
    alternateRowStyles: {
      fillColor: COLORS.lightGray,
    },
    columnStyles: {
      0: { cellWidth: COL_WIDTHS[0], halign: 'left' },
      1: { cellWidth: COL_WIDTHS[1], halign: 'center' },
      2: { cellWidth: COL_WIDTHS[2], halign: 'center' },
      3: { cellWidth: COL_WIDTHS[3], halign: 'right' },
      4: { cellWidth: COL_WIDTHS[4], halign: 'right', textColor: COLORS.red },
      5: { cellWidth: COL_WIDTHS[5], halign: 'right', textColor: COLORS.blue, fontStyle: 'bold' },
    },
    didDrawCell: (data) => {
      if (data.section === 'body' && data.column.index === 0 && data.row.index >= 0) {
        const item = order.items[data.row.index];
        if (!item) return;

        // 1. Draw Color Circle (Independent of Image)
        if (item.color) {
          const colorObj = ALL_COLORS.find(c => c.name === item.color) ?? { name: 'Blanc', hex: '#FFFFFF' };
          if (colorObj) {
            doc.saveGraphicsState();

            // Use the cell's actual font size, not doc's potentially stale state
            const styles = data.cell.styles as any;
            const fontSize = styles.fontSize || 8.5;
            const lineHeightFactor = 1.15;
            const lineHeightMM = fontSize * lineHeightFactor * 0.3527;

            // Reliable padding lookup
            const paddingTop =
              styles.cellPadding?.top ??
              (typeof styles.cellPadding === 'number' ? styles.cellPadding : null) ??
              (typeof data.cell.padding === 'function' ? data.cell.padding('top') : null) ??
              4;
            const paddingBottom =
              styles.cellPadding?.bottom ??
              (typeof styles.cellPadding === 'number' ? styles.cellPadding : null) ??
              paddingTop;
            const paddingLeft =
              styles.cellPadding?.left ??
              (typeof styles.cellPadding === 'number' ? styles.cellPadding : null) ??
              3;

            const cellLines: string[] = data.cell.text || [];
            const colorLineIdx = cellLines.findIndex(l => l.toLowerCase().includes('couleur'));

            if (colorLineIdx !== -1) {
              // Account for valign:'middle' — autoTable centers the text block vertically
              const totalTextHeight = cellLines.length * lineHeightMM;
              const cellContentHeight = data.cell.height - paddingTop - paddingBottom;
              const vAlignOffset = Math.max(0, (cellContentHeight - totalTextHeight) / 2);

              // Actual Y where autoTable starts rendering text
              const textStartY = data.cell.y + paddingTop + vAlignOffset;

              // Circle Y = actual text start + skip N lines + center on current line
              const circleY = textStartY + (colorLineIdx * lineHeightMM) + (lineHeightMM * 0.5);

              // Set correct font size before measuring text width
              doc.setFontSize(fontSize);
              const fullLabelWidth = doc.getTextWidth('Couleur :    ');
              const circleRadius = 0.9;
              const circleX = data.cell.x + paddingLeft + fullLabelWidth - circleRadius - 1.0;

              doc.setFillColor(colorObj.hex);
              doc.circle(circleX, circleY, circleRadius, 'F');
              const isLight = colorObj.hex === '#F5F5F5' || colorObj.hex === '#FFFFFF' ||
                colorObj.hex?.toLowerCase() === '#fff' || colorObj.hex?.toLowerCase() === '#fafafa';
              doc.setDrawColor(isLight ? 100 : 180, isLight ? 100 : 180, isLight ? 100 : 180);
              doc.setLineWidth(0.2);
              doc.circle(circleX, circleY, circleRadius, 'S');
            }

            doc.restoreGraphicsState();
          }
        }

        // 2. Draw Product Image
        const imageMap: Record<string, string> = {
          'colibri-50': colibriImg,
          'sidney-50': sidneyImg,
          'sidney-50-ac': sidneyAcImg,
          'elba': elbaImg,
          'plisse31': plisseImg,
        };

        const imgPath = imageMap[item.productId];
        if (imgPath) {
          try {
            const imgSize = 18;
            const cellX = data.cell.x + data.cell.width - imgSize - 4; // 4mm from right
            const cellY = data.cell.y + (data.cell.height / 2) - (imgSize / 2);
            doc.addImage(imgPath, 'PNG', cellX, cellY, imgSize, imgSize);
          } catch (e) {
            // Image skip
          }
        }
      }
    },
    didParseCell(data) {
      // Style the sub-label line in description column
      if (data.column.index === 0 && data.row.section === 'body') {
        data.cell.styles.fontSize = 8.5;
        data.cell.styles.minCellHeight = 22;
        // Reserve space for the image (18mm + gap)
        data.cell.styles.cellPadding = { top: 4, bottom: 4, left: 3, right: 24 };
      }
    },
  });

  return (doc as any).lastAutoTable.finalY;
}

function drawTotals(doc: jsPDF, order: Order, startY: number): number {
  const boxX = PAGE_W / 2;
  const boxW = PAGE_W - MARGIN.right - boxX;
  let y = startY + 6;

  const brutHT = order.items.reduce((sum, item) =>
    sum + (item.unitPrice * (item.quantity || 1)), 0
  );

  const remise = order.remise;
  // order.totalHT is already net of remise (saved by DevisWizard)
  const netHT = order.totalHT;
  
  // Use pre-calculated amounts if available, otherwise fallback to standard formula
  const fodecAmount = order.fodecAmount ?? (netHT * 0.01);
  const baseTVA = netHT + fodecAmount;
  const tvaAmount = order.tvaAmount ?? (baseTVA * 0.19);
  const timbre = order.timbre;
  const totalTTC = order.totalTTC;

  const remisePct = order.remisePercent ?? (brutHT > 0 ? Math.round((remise / brutHT) * 100) : 0);

  const totalSurcharge = order.items.reduce((sum, item) => sum + ((item.colorSurchargeAmount ?? 0) * (item.quantity || 1)), 0);
  const baseBrutHT = brutHT - totalSurcharge;

  const rows: [string, string, boolean, boolean][] = [
    ['Total brut HT :', formatDTWithUnit(baseBrutHT), false, false],
  ];

  if (totalSurcharge > 0) {
    rows.push(['Supplément couleur :', `+ ${formatDTWithUnit(totalSurcharge)}`, false, false]);
  }

  rows.push(
    [`Remise (${remisePct}%) :`, `- ${formatDTWithUnit(remise)}`, false, true],
    ['Total net HT :', formatDTWithUnit(netHT), true, false],
    ['FODEC (1%) :', formatDTWithUnit(fodecAmount), false, false],
    ['Base TVA :', formatDTWithUnit(baseTVA), false, false],
    ['TVA (19%) :', formatDTWithUnit(tvaAmount), false, false],
    ['Timbre fiscal :', formatDTWithUnit(timbre), false, false],
  );

  // Separator line
  doc.setDrawColor(...COLORS.lightGray as [number, number, number]);
  doc.setLineWidth(0.3);
  doc.line(boxX - 4, y - 2, PAGE_W - MARGIN.right, y - 2);

  rows.forEach(([label, value, isBold, isRed]) => {
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setFontSize(8.5);

    doc.setTextColor(...(isRed ? COLORS.red : COLORS.darkGray));
    doc.text(label, boxX, y, { align: 'left' });

    doc.setTextColor(...(isBold ? COLORS.darkNavy : isRed ? COLORS.red : COLORS.darkGray));
    doc.text(value, PAGE_W - MARGIN.right, y, { align: 'right' });

    // Separator after Total net HT
    if (isBold) {
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.2);
      doc.line(boxX - 4, y + 2, PAGE_W - MARGIN.right, y + 2);
    }

    y += 6.5;
  });

  // TOTAL TTC box
  y += 2;
  doc.setFillColor(...COLORS.blue);
  doc.roundedRect(boxX - 4, y - 5, boxW + 4, 11, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.white);
  doc.text('TOTAL TTC :', boxX, y + 2.5, { align: 'left' });
  doc.text(formatDTWithUnit(totalTTC), PAGE_W - MARGIN.right - 1, y + 2.5, { align: 'right' });

  // Reset text color to dark after blue box
  doc.setTextColor(55, 65, 81);
  doc.setFont('helvetica', 'normal');

  return y + 14;
}

function drawConditions(doc: jsPDF, y: number): void {
  // Background box
  doc.setFillColor(245, 247, 250); // light gray — explicit RGB, not from COLORS
  doc.roundedRect(MARGIN.left, y, CONTENT_W, 26, 2, 2, 'F');

  // Border
  doc.setDrawColor(26, 93, 168); // blue border
  doc.setLineWidth(0.4);
  doc.roundedRect(MARGIN.left, y, CONTENT_W, 26, 2, 2, 'S');

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(13, 27, 42); // EXPLICIT dark navy — NOT white
  doc.text('Conditions générales :', MARGIN.left + 4, y + 6);

  // Condition lines
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(55, 65, 81); // EXPLICIT dark gray — NOT white

  const conditions = [
    '• Ce devis est valable 10 jours à compter de la date d\'émission.',
    '• Livraison et installation incluses dans toute la Tunisie.',
    '• Prix en hors taxes (HT) — TVA 19% et FODEC 1% inclus dans le total TTC.',
  ];

  conditions.forEach((line, i) => {
    doc.setTextColor(55, 65, 81); // reset on every line to be safe
    doc.text(line, MARGIN.left + 4, y + 12 + i * 4);
  });
}

function drawPageFooter(doc: jsPDF, pageNum: number, totalPages: number): void {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  doc.text(
    'Siège Social: LOT 125 LOTISSEMENT LAROUSSI 1EL MGHIRA - TUNIS CP: 2074 | Tél: 53 186 611 - Mobile: 57 099 070',
    PAGE_W / 2, PAGE_H - 16, { align: 'center' }
  );
  doc.text(
    'Matricule Fiscal: 1651250W/A/M/000 | Email: aluminium.space1@gmail.com | RIB: 11 05500 01215002788 56 - Agence: BOUMHEL',
    PAGE_W / 2, PAGE_H - 11, { align: 'center' }
  );

  doc.text(`Page ${pageNum} / ${totalPages}`, PAGE_W - MARGIN.right, PAGE_H - 11, { align: 'right' });

  // Blue accent bottom
  doc.setFillColor(...COLORS.blue);
  doc.rect(0, PAGE_H - 3, PAGE_W, 3, 'F');
}

// ─── MAIN EXPORT ──────────────────────────────────────────────────────────────
export async function generatePDF(order: Order): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Page 1 header
  drawHeader(doc, order.id);

  // From / To section
  const afterFromTo = drawFromTo(doc, order);

  // Items table
  const afterTable = await drawItemsTable(doc, order, afterFromTo);

  // Check if totals + conditions fit on current page
  const totalsHeight = 80; // approximate
  const conditionsHeight = 26;
  const remainingSpace = PAGE_H - MARGIN.bottom - afterTable;

  let afterTotals: number;
  if (remainingSpace < totalsHeight + conditionsHeight) {
    // Add new page
    doc.addPage();
    drawHeader(doc, order.id);
    afterTotals = drawTotals(doc, order, 42);
  } else {
    afterTotals = drawTotals(doc, order, afterTable);
  }

  // Conditions
  const condY = afterTotals + 4;
  const condFits = condY + conditionsHeight < PAGE_H - MARGIN.bottom - 14;
  if (!condFits) {
    doc.addPage();
    drawHeader(doc, order.id);
    drawConditions(doc, 42);
    drawPageFooter(doc, 3, 3);
  } else {
    drawConditions(doc, condY);
  }

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawPageFooter(doc, i, totalPages);
  }

  // Save
  const clientName = order.clientInfo?.fullName?.replace(/\s+/g, '_') || 'Client';
  doc.save(`Devis_AluminiumSpace_${clientName}_${todayFR().replace(/\//g, '-')}.pdf`);
}

// Keep backward compatibility
export { generatePDF as generateQuotePDF };
export { generatePDF as default };

export function formatPrice(dt: number): string {
  return formatPriceDT(dt);
}
