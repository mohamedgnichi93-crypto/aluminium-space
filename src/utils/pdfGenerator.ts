import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import type { Order } from '../store/ordersStore';
import { ALL_COLORS } from '../data/colors';
import { formatPrice as formatPriceUtil, formatPriceDT } from './formatPrice';
import { supabase } from '../lib/supabase';
import { BUSINESS } from '../config/businessConfig';

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
const IMAGE_MAP: Record<string, string> = {
  'colibri-50': '/images/colibri-50.png',
  'sidney-50': '/images/sidney-50.png',
  'sidney-50-ac': '/images/sidney-50-ac.png',
  elba: '/images/elba.png',
  plisse31: '/images/plisse31.png',
};
// TODO: Create /images/pdf/ with compressed product PNGs under 200KB each.

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

const formatMDTShort = (v: number) =>
  (v / 1000).toLocaleString('fr-FR', { minimumFractionDigits: 3, maximumFractionDigits: 3 });

function todayFR(): string {
  return new Date().toLocaleDateString('fr-TN', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
}

// ─── SECTION BUILDERS ─────────────────────────────────────────────────────────

function drawHeader(doc: jsPDF, orderId?: string, title = 'DEVIS', separatorOffset = 0): number {
  // Blue top accent bar
  doc.setFillColor(...COLORS.blue);
  doc.rect(0, 0, PAGE_W, 3, 'F');

  // ── LEFT: Aluminium Space logo (small icon + brand text next to it) ─────────
  try {
    const aluUrl = resolveAssetUrl('/logo-aluminium-space-new.png');
    // logo-aluminium-space-new.png is the new square 1024x1024 icon.
    // We render it at 18x18mm at X=14, Y=5 to match the height of Grifo Flex logo.
    doc.addImage(aluUrl, 'PNG', MARGIN.left, 5, 18, 18);
  } catch {
    // Silent fallback
  }

  // Brand text next to the icon (shifted to X=35 to prevent overlap with the 18mm wide logo)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(26, 46, 74); // #1a2e4a
  doc.text('ALUMINIUM SPACE', 35, 13);

  // Subtitle with flags around it: TN flag (left) + "Menuiserie Aluminium" + IT flag (right)
  try {
    const tnFlagUrl = resolveAssetUrl('/images/flag-tn.png');
    const itFlagUrl = resolveAssetUrl('/images/flag-it.png');
    const textY = 18;
    const flagY = 15.6; // Y=15.6 aligns the top of the 2.8mm flags inline with the text (baseline Y=18)
    const flagH = 2.8;
    const flagW = 4;
    const startX = 35; // Shifted to X=35 to prevent overlap with the logo

    // 1. TN flag FIRST (left)
    doc.addImage(tnFlagUrl, 'PNG', startX, flagY, flagW, flagH);

    // 2. Text in the middle
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text('Menuiserie Aluminium', startX + flagW + 1.5, textY);

    // 3. IT flag LAST (right after text)
    const textWidth = doc.getTextWidth('Menuiserie Aluminium');
    doc.addImage(itFlagUrl, 'PNG', startX + flagW + 1.5 + textWidth + 1.5, flagY, flagW, flagH);
  } catch {
    // Fallback: text only
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text('Menuiserie Aluminium', 35, 18);
  }

  // ── RIGHT: Grifo Flex logo (larger for clarity) ─────────────────────────────
  try {
    const grifoUrl = resolveAssetUrl('/images/grifo-flex-logo.png');
    // Grifo Flex logo enlarged to 45x22mm for better clarity in PDF
    doc.addImage(grifoUrl, 'PNG', 155, 3, 45, 22);
  } catch {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.blue);
    doc.text('GRIFO FLEX TUNISIE', 158, 13);
  }

  // ── CENTER: Title (below both logos, shifted down slightly) ─────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...COLORS.blue);
  doc.text(title, PAGE_W / 2, 30, { align: 'center' });

  // ── Header Sub-Content (Centered below Title) ──────────────────────────────
  let sepY = 50 + separatorOffset;

  if (title === 'BON DE COMMANDE') {
    const infoY = 33;
    const centerX = PAGE_W / 2;

    // Line 1 — Address
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(60, 60, 60);
    doc.text(
      `${BUSINESS.address}, ${BUSINESS.city}`,
      centerX, infoY, { align: 'center' }
    );

    // Line 2 — Phones
    doc.text(
      `${BUSINESS.phone1}  |  ${BUSINESS.phone2}`,
      centerX, infoY + 5, { align: 'center' }
    );

    // Line 3 — Email + Date (same line)
    doc.text(
      `${BUSINESS.email}  |  Date : ${todayFR()}`,
      centerX, infoY + 10, { align: 'center' }
    );

    sepY = infoY + 14; // Y = 47
  } else {
    // ── Date + Validité + Code (LEFT-aligned below title) ─────────────────────
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.darkGray);
    doc.text(`Date : ${todayFR()}`, MARGIN.left, 36, { align: 'left' });
    if (title === 'DEVIS') {
      doc.text('Validité : 10 jours', MARGIN.left, 41, { align: 'left' });
    }
    if (orderId) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...COLORS.blue);
      const codeY = title === 'DEVIS' ? 46 : 41;
      doc.text(`Code de suivi : ${orderId}`, MARGIN.left, codeY, { align: 'left' });
    }
  }

  // ── Horizontal separator ────────────────────────────────────────────────────
  doc.setDrawColor(...COLORS.blue);
  doc.setLineWidth(0.6);
  doc.line(MARGIN.left, sepY, PAGE_W - MARGIN.right, sepY);

  return sepY;
}

function drawFromTo(doc: jsPDF, order: Order, startYOverride?: number): number {
  const startY = startYOverride ?? 56;
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
  doc.text(BUSINESS.name, MARGIN.left + 4, startY + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.darkGray);
  const deLines = [
    BUSINESS.address,
    BUSINESS.city,
    `Tel : ${BUSINESS.phone1}`,
    `Email : ${BUSINESS.email}`,
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

async function loadProductImageMap(): Promise<Record<string, string>> {
  const entries = await Promise.all(
    Object.entries(IMAGE_MAP).map(async ([productId, path]) => [
      productId,
      await getBase64Image(resolveAssetUrl(path)),
    ] as const)
  );
  return Object.fromEntries(entries);
}

function drawColorCircle(doc: jsPDF, colorName: string, cx: number, cy: number, radius = 3): void {
  const colorObj = ALL_COLORS.find(c => c.name === colorName) ?? { name: 'Blanc', hex: '#FFFFFF' };
  doc.setFillColor(colorObj.hex);
  const isLight = colorObj.hex === '#F5F5F5' || colorObj.hex === '#FFFFFF' ||
    colorObj.hex?.toLowerCase() === '#fff' || colorObj.hex?.toLowerCase() === '#fafafa';
  doc.setDrawColor(isLight ? 120 : 180, isLight ? 120 : 180, isLight ? 120 : 180);
  doc.setLineWidth(0.3);
  doc.circle(cx, cy, radius, 'FD');
}

async function drawItemsTable(doc: jsPDF, order: Order, startY: number): Promise<number> {
  // Column widths — must sum to 182mm (CONTENT_W)
  // Desc(44) + Dims(24) + Qty(9) + PU(22) + Remise(16) + PUNet(22) + Couleur(18) + Net(27) = 182 ✅
  const COL_WIDTHS = [44, 24, 9, 22, 16, 22, 18, 27];

  const remisePct = order.remisePercent ?? 0;


  const tableData = order.items.map(item => {
    const baseUnitPrice = Number(item.baseUnitPrice ?? item.unitPrice ?? 0);
    const colorSurchargeAmount = Number(item.colorSurchargeAmount ?? 0);
    // P.U Net = base unit price after remise (before color surcharge)
    const puNet = remisePct > 0 ? Math.round(baseUnitPrice * (1 - remisePct / 100)) : baseUnitPrice;
    const unitPriceWithColor = puNet + colorSurchargeAmount;
    const netHT = unitPriceWithColor * (item.quantity || 1);

    return [
      item.productName +
      (item.openingType === 'fenetre' ? ' — Fenêtre' : item.openingType === 'porte' ? ' — Porte' : '') +
      (item.meshType ? '\nFilet ' + item.meshType.toUpperCase() : '') +
      (item.color ? '\nCouleur :    ' + item.color + ((item.colorSurchargePct ?? 0) > 0 ? ` (+${item.colorSurchargePct}%)` : '') : ''),
      `${item.width}\u00A0×\u00A0${item.height}`,
      String(item.quantity || 1),
      formatDTWithUnit(baseUnitPrice),
      remisePct > 0 ? `-${remisePct}%` : '—',
      formatDTWithUnit(puNet),
      colorSurchargeAmount > 0
        ? `+${formatMDTShort(colorSurchargeAmount * (item.quantity || 1))}`
        : '—',
      formatDTWithUnit(netHT),
    ];
  });

  const imageMap = await loadProductImageMap();

  autoTable(doc, {
    startY,
    head: [[
      'Description',
      'Dimensions (cm)',
      'Qté',
      'P.U\u00A0HT',
      'Remise',
      'P.U\u00A0Net',
      'Suppl. couleur',
      'Net\u00A0HT',
    ]],
    body: tableData,
    margin: { left: MARGIN.left, right: MARGIN.right, bottom: 22 },
    tableWidth: CONTENT_W,
    styles: {
      fontSize: 7.5,
      cellPadding: { top: 4, bottom: 4, left: 2, right: 2 },
      overflow: 'linebreak',
      lineColor: [220, 220, 220],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: COLORS.blue,
      textColor: COLORS.white,
      fontStyle: 'bold',
      fontSize: 7.5,
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
      4: { cellWidth: COL_WIDTHS[4], halign: 'center' },
      5: { cellWidth: COL_WIDTHS[5], halign: 'right', textColor: COLORS.blue as any, fontStyle: 'bold' },
      6: { cellWidth: COL_WIDTHS[6] },
      7: { cellWidth: COL_WIDTHS[7], halign: 'right', textColor: COLORS.blue as any, fontStyle: 'bold' },
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
            const fontSize = styles.fontSize || 7.5;
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
        data.cell.styles.fontSize = 7.5;
        data.cell.styles.minCellHeight = 22;
        // Reserve space for the image (18mm + gap)
        data.cell.styles.cellPadding = { top: 4, bottom: 4, left: 2, right: 22 };
      }
      // Style the Remise column (index 4) in red
      if (data.column.index === 4 && data.row.section === 'body') {
        const val = data.cell.raw;
        if (typeof val === 'string' && val.startsWith('-')) {
          data.cell.styles.textColor = [220, 38, 38];
        } else {
          data.cell.styles.textColor = [150, 150, 150];
        }
        data.cell.styles.halign = 'center';
      }
      // Style the P.U Net column (index 5) in navy bold
      if (data.column.index === 5 && data.row.section === 'body') {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.textColor = [26, 93, 168];
        data.cell.styles.halign = 'right';
      }
      // Style the Couleur column dynamically (now index 6)
      if (data.column.index === 6 && data.row.section === 'body') {
        const val = data.cell.raw;
        if (typeof val === 'string' && val.startsWith('+')) {
          data.cell.styles.textColor = [220, 80, 20];
          data.cell.styles.halign = 'right';
        } else {
          data.cell.styles.textColor = [150, 150, 150];
          data.cell.styles.halign = 'center';
        }
        data.cell.styles.overflow = 'hidden';
        data.cell.styles.fontSize = 6.5;
        data.cell.styles.cellPadding = { top: 3, bottom: 3, left: 2, right: 2 };
        data.cell.styles.valign = 'middle';
        data.cell.styles.halign = 'center';
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
    ['Base HT (hors couleur) :', formatDTWithUnit(baseBrutHT), false, false],
  ];

  if (totalSurcharge > 0) {
    rows.push(['Supplément couleur :', `+ ${formatDTWithUnit(totalSurcharge)}`, false, false]);
  }

  rows.push(
    ['Total brut HT :', formatDTWithUnit(brutHT), true, false],
    [`Remise (${remisePct}%) :`, `- ${formatDTWithUnit(remise)}`, false, true],
    ['Total net HT :', formatDTWithUnit(netHT), true, false],
    [`FODEC (${order.fodec ?? 1}%) :`, formatDTWithUnit(fodecAmount), false, false],
    ['Base TVA :', formatDTWithUnit(baseTVA), false, false],
    [`TVA (${order.tva ?? 19}%) :`, formatDTWithUnit(tvaAmount), false, false],
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

// drawConditions removed — "Conditions générales" no longer shown on devis PDF

function drawPageFooter(doc: jsPDF, pageNum: number, totalPages: number): void {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  doc.text(
    `${BUSINESS.siretLabel} | Tél: ${BUSINESS.phone1} - Mobile: ${BUSINESS.phone2}`,
    PAGE_W / 2, PAGE_H - 16, { align: 'center' }
  );
  doc.text(
    `Matricule Fiscal: ${BUSINESS.matriculeFiscal} | Email: ${BUSINESS.emailAlt} | RIB: ${BUSINESS.rib} - Agence: ${BUSINESS.ribAgence}`,
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

  // Generate QR code pointing to Mon Espace Client with order tracking code
  const qrUrl = `https://aluminiumspace-moustiquaires.com/mon-espace?code=${order.id}`;
  let qrDataUrl: string | null = null;
  try {
    qrDataUrl = await QRCode.toDataURL(qrUrl, {
      errorCorrectionLevel: 'H',
      type: 'image/png' as const,
      quality: 1,
      margin: 3,
      width: 300,
      color: { dark: '#000000', light: '#ffffff' },
    });
  } catch {
    qrDataUrl = null;
  }

  // Page 1 header
  const sepY = drawHeader(doc, order.id, 'DEVIS', qrDataUrl ? 10 : 0);

  // Draw QR code on the RIGHT side, facing Date/Validité/Code on the LEFT
  if (qrDataUrl) {
    doc.addImage(qrDataUrl, 'PNG', 162, 28, 26, 26);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.darkGray);
    doc.text('Scanner pour suivre', 175, 57, { align: 'center' });
  }

  // From / To section
  const afterFromTo = drawFromTo(doc, order, sepY + 6);

  // Items table
  const afterTable = await drawItemsTable(doc, order, afterFromTo);

  // Check if totals fit on current page
  const totalsHeight = 80; // approximate
  const remainingSpace = PAGE_H - MARGIN.bottom - afterTable;

  let afterTotals: number;
  if (remainingSpace < totalsHeight) {
    // Add new page
    doc.addPage();
    drawHeader(doc, order.id);
    afterTotals = drawTotals(doc, order, 56);
  } else {
    afterTotals = drawTotals(doc, order, afterTable);
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

// ─── BON DE COMMANDE ──────────────────────────────────────────────────────────
export async function generateBonDeCommande(order: Order): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Header with "BON DE COMMANDE" title
  const sepY = drawHeader(doc, undefined, 'BON DE COMMANDE');

  const tableStartY = sepY + 4;

  // Pre-load product images once before autoTable because didDrawCell is sync.
  const imageMap = await loadProductImageMap();

  // Build designation string per item
  function buildDesignation(item: any): string {
    let name = item.productName ?? '';
    if (item.openingType === 'fenetre') name += ' — Fenêtre';
    else if (item.openingType === 'porte') name += ' — Porte';
    if (item.meshType) name += '\nToile : ' + item.meshType.toUpperCase();
    return name;
  }

  // Column widths: 28 + 67 + 35 + 35 + 17 = 182 = CONTENT_W
  const body = order.items.map((item: any) => [
    '',  // column 0: image (drawn in didDrawCell)
    buildDesignation(item),
    '',  // column 2: color (circle + name drawn in didDrawCell)
    `${item.width} ×\u00A0${item.height}`,
    String(item.quantity || 1),
  ]);

  autoTable(doc, {
    startY: tableStartY,
    head: [['Image', 'Désignation', 'Couleur', 'Dimensions (cm)', 'Qté']],
    body,
    margin: { left: MARGIN.left, right: MARGIN.right, bottom: 22 },
    tableWidth: CONTENT_W,
    styles: {
      overflow: 'linebreak',
      lineColor: [220, 220, 220],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: COLORS.blue,
      textColor: COLORS.white,
      fontStyle: 'bold',
      fontSize: 9.5,
      halign: 'center',
      valign: 'middle',
    },
    bodyStyles: {
      fontSize: 9,
      textColor: COLORS.darkGray,
      valign: 'middle',
      cellPadding: { top: 4, bottom: 4, left: 3, right: 3 },
    },
    alternateRowStyles: {
      fillColor: COLORS.lightGray,
    },
    columnStyles: {
      0: { cellWidth: 28, halign: 'center', valign: 'middle' },
      1: { cellWidth: 67, valign: 'middle' },
      2: { cellWidth: 35, halign: 'center', valign: 'middle' },
      3: { cellWidth: 35, halign: 'center', valign: 'middle' },
      4: { cellWidth: 17, halign: 'center', valign: 'middle' },
    },
    didParseCell(data) {
      if (data.section === 'body') {
        data.cell.styles.minCellHeight = 30;
      }
    },
    didDrawCell: (data) => {
      if (data.section !== 'body') return;
      const item = order.items[data.row.index];
      if (!item) return;

      // Column 0: Product image
      if (data.column.index === 0) {
        const imgData = imageMap[item.productId];
        if (imgData) {
          try {
            const imgSize = 22;
            const cx = data.cell.x + data.cell.width / 2;
            const cy = data.cell.y + data.cell.height / 2;
            doc.addImage(imgData, 'PNG', cx - imgSize / 2, cy - imgSize / 2, imgSize, imgSize);
          } catch { /* silent */ }
        }
      }

      // Column 2: Color circle + name
      if (data.column.index === 2) {
        const colorName = item.color ?? 'Blanc';

        const cx = data.cell.x + data.cell.width / 2;
        const cy = data.cell.y + data.cell.height / 2 - 4;

        drawColorCircle(doc, colorName, cx, cy);

        doc.setFontSize(7.5);
        doc.setTextColor(...COLORS.darkGray);
        doc.text(colorName, cx, cy + 7, { align: 'center' });
      }
    },
  });

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawPageFooter(doc, i, totalPages);
  }

  // Save
  doc.save(`BonDeCommande_AluminiumSpace.pdf`);
}

// ─── FACTURE HELPERS ──────────────────────────────────────────────────────────

async function getNextFactureNumber(): Promise<string> {
  const { data, error } = await supabase.rpc('get_next_facture_number');
  if (error) {
    console.error('Facture number RPC failed:', error);
    return Date.now().toString();
  }
  return String(data ?? Date.now());
}

// ─── NUMBER TO FRENCH WORDS ───────────────────────────────────────────────────

function numberToFrenchWords(n: number): string {
  const units = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf',
    'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
  const tens = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante', 'quatre-vingt', 'quatre-vingt'];

  function convertBelow100(num: number): string {
    if (num < 20) return units[num];
    const t = Math.floor(num / 10);
    const u = num % 10;
    if (t === 7 || t === 9) {
      // 70-79 → soixante-dix... / 90-99 → quatre-vingt-dix...
      return tens[t] + (u === 0 && t === 7 ? '-dix' : u === 1 && t === 7 ? ' et onze' : '-' + units[10 + u]);
    }
    if (t === 8 && u === 0) return 'quatre-vingts';
    if (u === 1 && (t === 2 || t === 3 || t === 4 || t === 5 || t === 6)) return tens[t] + ' et un';
    return tens[t] + (u ? '-' + units[u] : '');
  }

  function convertBelow1000(num: number): string {
    if (num < 100) return convertBelow100(num);
    const h = Math.floor(num / 100);
    const rest = num % 100;
    let result = '';
    if (h === 1) result = 'cent';
    else result = units[h] + ' cent';
    if (rest === 0 && h > 1) result += 's';
    else if (rest > 0) result += ' ' + convertBelow100(rest);
    return result;
  }

  function convert(num: number): string {
    if (num === 0) return 'zéro';
    if (num < 1000) return convertBelow1000(num);
    const thousands = Math.floor(num / 1000);
    const rest = num % 1000;
    let result = '';
    if (thousands === 1) result = 'mille';
    else result = convertBelow1000(thousands) + ' mille';
    if (rest > 0) result += ' ' + convertBelow1000(rest);
    return result;
  }

  // Split into dinars and millimes
  const dinars = Math.floor(n);
  const millimes = Math.round((n - dinars) * 1000);

  let result = convert(dinars) + ' dinar' + (dinars > 1 ? 's' : '');
  if (millimes > 0) {
    result += ' et ' + convert(millimes) + ' millime' + (millimes > 1 ? 's' : '');
  }
  return result;
}

// ─── FACTURE ──────────────────────────────────────────────────────────────────
export async function generateFacture(order: Order): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Header with "FACTURE" title
  const sepY = drawHeader(doc, order.id, 'FACTURE');

  // FACTURE N°
  const factureNum = await getNextFactureNumber();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.blue);
  doc.text(`FACTURE N° : ${factureNum}`, PAGE_W / 2, sepY + 6, { align: 'center' });

  // Client info (DE / À)
  const afterFromTo = drawFromTo(doc, order, sepY + 12);

  // Items table
  const afterTable = await drawItemsTable(doc, order, afterFromTo);

  // Check if totals fit on current page
  const totalsHeight = 80;
  const extraSectionHeight = 50; // montant + reglement + signature
  const remainingSpace = PAGE_H - MARGIN.bottom - afterTable;

  let afterTotals: number;
  if (remainingSpace < totalsHeight + extraSectionHeight) {
    doc.addPage();
    drawHeader(doc, order.id, 'FACTURE');
    afterTotals = drawTotals(doc, order, 56);
  } else {
    afterTotals = drawTotals(doc, order, afterTable);
  }

  // ── MONTANT EN LETTRES ──
  const ttcDT = order.totalTTC / 1000;
  const montantLettre = numberToFrenchWords(ttcDT);

  let lettresY = afterTotals + 8;

  // Check if montant + reglement + signature fit
  if (lettresY + 50 > PAGE_H - MARGIN.bottom - 14) {
    doc.addPage();
    drawHeader(doc, order.id, 'FACTURE');
    lettresY = 56;
  }

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(MARGIN.left, lettresY, CONTENT_W, 14, 2, 2, 'F');
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.2);
  doc.roundedRect(MARGIN.left, lettresY, CONTENT_W, 14, 2, 2, 'S');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(60, 60, 60);
  doc.text('MONTANT EN LETTRES :', MARGIN.left + 4, lettresY + 5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(montantLettre.toUpperCase(), MARGIN.left + 4, lettresY + 10, {
    maxWidth: CONTENT_W - 8,
  });

  // ── RÈGLEMENT ──
  const reglY = lettresY + 20;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.text('RÈGLEMENT :', MARGIN.left, reglY);
  doc.setFont('helvetica', 'normal');
  doc.text(`${formatDTWithUnit(order.totalTTC)}`, MARGIN.left + 30, reglY);

  // ── SIGNATURE / CACHE ──
  const sigLabelY = reglY + 8;
  const sigX = PAGE_W - MARGIN.right - 50;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.blue);
  doc.text('Signature & Cachet', sigX + 25, sigLabelY, { align: 'center' });

  try {
    const sigUrl = resolveAssetUrl('/images/signature-cache.png');
    const sigB64 = await getBase64Image(sigUrl);
    doc.addImage(sigB64, 'PNG', sigX, sigLabelY + 2, 50, 25);
  } catch {
    // Fallback: dotted line placeholder
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.3);
    doc.line(sigX, sigLabelY + 20, sigX + 50, sigLabelY + 20);
  }

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawPageFooter(doc, i, totalPages);
  }

  // Save
  doc.save(`FACTURE_AluminiumSpace_${order.id}.pdf`);
}

// Keep backward compatibility
export { generatePDF as generateQuotePDF };
export { generatePDF as default };

export function formatPrice(dt: number): string {
  return formatPriceDT(dt);
}
