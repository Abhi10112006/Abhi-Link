import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCodeStyling, { DotType, CornerSquareType, CornerDotType } from 'qr-code-styling';

export type BusinessType = 'shop' | 'freelancer' | 'tuition' | 'custom';
export type InvoiceTheme = 'retail' | 'service' | 'minimal';

export interface CustomField {
  id: string;
  label: string;
  value: string;
}

export interface InvoiceItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  unit?: string;
}

export interface InvoiceData {
  invoiceNumber: string;
  customerName: string;
  businessName: string;
  classesName?: string;
  items: InvoiceItem[];
  totalAmount: number;
  upiId: string;
  payeeName: string;
  qrCenterText: string;
  qrDataUrl?: string | null;
  qrStyle?: {
    dotType: DotType;
    cornerSquareType: CornerSquareType;
    cornerDotType: CornerDotType;
  };
  remarks?: string;
  businessType: BusinessType;
  dueDate?: string;
  month?: string;
  projectTitle?: string;
  theme?: InvoiceTheme;
  customFields?: CustomField[];
}

// ─── Shared helpers ────────────────────────────────────────────────────────────

const PRIMARY:   [number, number, number] = [20, 20, 20];
const SECONDARY: [number, number, number] = [100, 100, 100];
const LIGHT_GRAY:[number, number, number] = [245, 245, 245];
const BORDER:    [number, number, number] = [220, 220, 220];
const MARGIN = 20;

/** Returns the primary display name for the invoicing entity (all-caps ready). */
const getDisplayBusinessName = (data: InvoiceData): string => {
  if (data.businessType === 'tuition' && data.classesName) return data.classesName;
  return data.businessName || data.payeeName || 'Business';
};

const addFooter = (doc: jsPDF, _pageNumber: number, _totalPages: number) => {
  const pageWidth  = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  doc.setDrawColor(BORDER[0], BORDER[1], BORDER[2]);
  doc.setLineWidth(0.2);
  doc.line(MARGIN, pageHeight - 20, pageWidth - MARGIN, pageHeight - 20);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
  const brandText = 'ABHI LINK';
  doc.text(brandText, MARGIN, pageHeight - 12);
  const brandWidth = doc.getTextWidth(brandText);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(SECONDARY[0], SECONDARY[1], SECONDARY[2]);
  doc.text('|', MARGIN + brandWidth + 2, pageHeight - 12);
  doc.text('PREMIUM INVOICING', MARGIN + brandWidth + 5, pageHeight - 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(37, 99, 235);
  doc.text('https://abhi-link.vercel.app/', pageWidth - MARGIN, pageHeight - 12, { align: 'right' });
  doc.link(pageWidth - MARGIN - 40, pageHeight - 16, 40, 6, { url: 'https://abhi-link.vercel.app/' });
};

const generateQrCodeImage = async (data: InvoiceData): Promise<string | null> => {
  if (!data.upiId) return null;
  const cleanUpiId = data.upiId.trim();
  const cleanName  = data.payeeName.trim();
  const trId = data.invoiceNumber;
  let upiUrl = `upi://pay?pa=${encodeURIComponent(cleanUpiId).replace(/%40/g, '@')}&pn=${encodeURIComponent(cleanName)}&cu=INR&tr=${trId}`;
  if (data.totalAmount > 0) upiUrl += `&am=${data.totalAmount.toFixed(2)}`;

  const { dotType = 'dots', cornerSquareType = 'extra-rounded', cornerDotType = 'dot' } = data.qrStyle || {};
  const qrCode = new QRCodeStyling({
    width: 200, height: 200,
    data: upiUrl,
    margin: 0,
    type: 'svg' as const,
    qrOptions: { typeNumber: 0 as const, mode: 'Byte' as const, errorCorrectionLevel: 'H' as const },
    imageOptions: { hideBackgroundDots: true, imageSize: 0.4, margin: 0 },
    dotsOptions: { type: dotType, color: '#2d2d2b' },
    cornersSquareOptions: { type: cornerSquareType, color: '#2d2d2b' },
    cornersDotOptions: { type: cornerDotType, color: '#2d2d2b' },
    image: `data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='20' fill='%232d2d2b'/%3E%3Ctext x='50' y='50' font-family='Arial, sans-serif' font-weight='900' font-size='60' fill='%23e6e1dc' text-anchor='middle' dominant-baseline='central'%3E${encodeURIComponent(data.qrCenterText || 'A')}%3C/text%3E%3C/svg%3E`
  });
  try {
    const blob = await qrCode.getRawData('png');
    if (!blob || !(blob instanceof Blob)) return null;
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

/**
 * Render a compact "FROM" issuer line (payee name + UPI ID) below the main
 * header separator.  Returns the updated Y cursor after the block.
 */
const renderIssuerRow = (doc: jsPDF, data: InvoiceData, y: number): number => {
  const fromName = data.payeeName || data.businessName || '';
  if (!fromName && !data.upiId) return y;

  // "FROM" label
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(SECONDARY[0], SECONDARY[1], SECONDARY[2]);
  doc.text('FROM', MARGIN, y);
  const labelW = doc.getTextWidth('FROM') + 4;

  // Payee / business name
  if (fromName) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
    doc.text(fromName, MARGIN + labelW, y);
  }

  // UPI ID on a second line under the name
  if (data.upiId) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(SECONDARY[0], SECONDARY[1], SECONDARY[2]);
    doc.text(`UPI  ${data.upiId}`, MARGIN + labelW, y + 6);
  }

  return y + (data.upiId ? 13 : 8);
};

/** Render custom fields below BILLED TO in a 2-column layout */
const renderCustomFields = (doc: jsPDF, fields: CustomField[], startY: number): number => {
  const filtered = fields.filter(f => f.label && f.value);
  if (filtered.length === 0) return startY;

  const pageWidth = doc.internal.pageSize.width;
  const colW = (pageWidth - 2 * MARGIN) / 2;
  const rows = Math.ceil(filtered.length / 2);
  const boxH = rows * 14 + 10;

  doc.setFillColor(LIGHT_GRAY[0], LIGHT_GRAY[1], LIGHT_GRAY[2]);
  doc.roundedRect(MARGIN, startY, pageWidth - 2 * MARGIN, boxH, 3, 3, 'F');

  let y = startY + 8;
  for (let i = 0; i < filtered.length; i += 2) {
    const f1 = filtered[i];
    const f2 = filtered[i + 1];

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(SECONDARY[0], SECONDARY[1], SECONDARY[2]);
    doc.text(f1.label.toUpperCase(), MARGIN + 5, y);
    if (f2) doc.text(f2.label.toUpperCase(), MARGIN + colW + 5, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
    doc.text(f1.value, MARGIN + 5, y + 5);
    if (f2) doc.text(f2.value, MARGIN + colW + 5, y + 5);

    y += 14;
  }
  return startY + boxH + 5;
};

// ─── Theme: RETAIL ─────────────────────────────────────────────────────────────

const renderRetailTheme = async (data: InvoiceData, qrDataUrl: string | null): Promise<jsPDF> => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth  = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  // Accent bar at top
  doc.setFillColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
  doc.rect(0, 0, pageWidth, 3, 'F');

  // Header — Business Name
  if (data.businessType === 'tuition' && data.classesName) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    doc.setTextColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
    doc.text(data.classesName.toUpperCase(), MARGIN, 33);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(SECONDARY[0], SECONDARY[1], SECONDARY[2]);
    doc.text(data.businessName || data.payeeName || 'Teacher Name', MARGIN, 41);
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    doc.setTextColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
    doc.text(getDisplayBusinessName(data).toUpperCase(), MARGIN, 33);
  }

  // Header — Document title (right)
  const docTitle = data.businessType === 'tuition' ? 'FEE RECEIPT' : 'INVOICE';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(210, 210, 210);
  doc.text(docTitle, pageWidth - MARGIN, 33, { align: 'right' });

  const noLabel = data.businessType === 'tuition' ? 'RECEIPT NO:' : 'INVOICE NO:';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(SECONDARY[0], SECONDARY[1], SECONDARY[2]);
  doc.text(`${noLabel} ${data.invoiceNumber}`, pageWidth - MARGIN, 41, { align: 'right' });

  // Separator
  doc.setDrawColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
  doc.setLineWidth(0.5);
  doc.line(MARGIN, 47, pageWidth - MARGIN, 47);

  // Issuer (FROM) row
  const issuerEndY = renderIssuerRow(doc, data, 52);
  if (issuerEndY > 52) {
    doc.setDrawColor(BORDER[0], BORDER[1], BORDER[2]);
    doc.setLineWidth(0.2);
    doc.line(MARGIN, issuerEndY + 1, pageWidth - MARGIN, issuerEndY + 1);
  }

  // BILLED TO + Meta
  let startY = issuerEndY > 52 ? issuerEndY + 9 : 62;
  const billedLabel = data.businessType === 'tuition' ? 'STUDENT' : data.businessType === 'freelancer' ? 'CLIENT' : 'BILLED TO';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(SECONDARY[0], SECONDARY[1], SECONDARY[2]);
  doc.text(billedLabel, MARGIN, startY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
  doc.text(data.customerName || 'Valued Customer', MARGIN, startY + 7);

  // Meta (right side)
  let metaX = pageWidth - MARGIN;
  if (data.projectTitle) {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(SECONDARY[0], SECONDARY[1], SECONDARY[2]);
    doc.text('PROJECT', metaX, startY, { align: 'right' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
    doc.text(data.projectTitle, metaX, startY + 7, { align: 'right' });
    metaX -= 42;
  }
  if (data.month) {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(SECONDARY[0], SECONDARY[1], SECONDARY[2]);
    doc.text('MONTH', metaX, startY, { align: 'right' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
    doc.text(data.month, metaX, startY + 7, { align: 'right' });
    metaX -= 32;
  }
  if (data.dueDate) {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(SECONDARY[0], SECONDARY[1], SECONDARY[2]);
    doc.text('DUE DATE', metaX, startY, { align: 'right' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
    doc.text(new Date(data.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }), metaX, startY + 7, { align: 'right' });
    metaX -= 32;
  }
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(SECONDARY[0], SECONDARY[1], SECONDARY[2]);
  doc.text('DATE', metaX, startY, { align: 'right' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
  doc.text(new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }), metaX, startY + 7, { align: 'right' });

  startY += 18;

  // Custom fields
  if (data.customFields && data.customFields.length > 0) {
    startY = renderCustomFields(doc, data.customFields, startY);
  }

  // Items Table
  const tableCols = [
    data.businessType === 'tuition' ? 'SUBJECT / DESCRIPTION' : data.businessType === 'freelancer' ? 'SERVICE / TASK' : 'DESCRIPTION',
    data.businessType === 'tuition' ? 'MONTHS' : data.businessType === 'freelancer' ? 'HOURS/QTY' : 'QTY',
    data.businessType === 'tuition' ? 'FEE/MO' : data.businessType === 'freelancer' ? 'RATE' : 'PRICE',
    'AMOUNT'
  ];
  const tableRows = data.items.map(item => {
    const qty   = Number(item.quantity) || 0;
    const price = Number(item.price) || 0;
    let qtyDisplay = qty.toString();
    if (item.unit && item.unit !== 'Unit') qtyDisplay += ` ${item.unit}`;
    return [
      item.name || 'Item',
      qtyDisplay,
      `Rs. ${price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      `Rs. ${(qty * price).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    ];
  });

  autoTable(doc, {
    startY,
    head: [tableCols],
    body: tableRows,
    theme: 'plain',
    headStyles: { fillColor: false, textColor: PRIMARY, fontStyle: 'bold', fontSize: 8, halign: 'left', cellPadding: 6, lineWidth: { top: 0.5, bottom: 0.5, left: 0.1, right: 0.1 }, lineColor: PRIMARY },
    bodyStyles: { textColor: PRIMARY, fontSize: 10, cellPadding: 6, lineWidth: { bottom: 0.1, left: 0.1, right: 0.1 }, lineColor: BORDER },
    alternateRowStyles: { fillColor: [249, 249, 249] },
    columnStyles: {
      0: { halign: 'left' },
      1: { halign: 'center', cellWidth: 25 },
      2: { halign: 'right', cellWidth: 35 },
      3: { halign: 'right', cellWidth: 35, fontStyle: 'bold' }
    },
    margin: { top: 47, right: MARGIN, bottom: 30, left: MARGIN },
    didDrawPage: (hookData) => {
      const pageCount = doc.getNumberOfPages();
      addFooter(doc, hookData.pageNumber, pageCount);
    }
  });

  // @ts-ignore
  let finalY: number = doc.lastAutoTable.finalY + 12;
  if (finalY + 65 > pageHeight - 30) { doc.addPage(); finalY = 20; addFooter(doc, doc.getNumberOfPages(), doc.getNumberOfPages()); }

  // Notes + QR (left)
  let leftY = finalY;
  if (data.remarks) {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(SECONDARY[0], SECONDARY[1], SECONDARY[2]);
    doc.text('NOTES', MARGIN, leftY);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
    const splitRemarks = doc.splitTextToSize(data.remarks, 100);
    doc.text(splitRemarks, MARGIN, leftY + 6);
    leftY += splitRemarks.length * 4 + 12;
  }
  if (qrDataUrl && data.upiId) {
    if (leftY + 50 > pageHeight - 30) { doc.addPage(); leftY = 20; addFooter(doc, doc.getNumberOfPages(), doc.getNumberOfPages()); }
    doc.setFillColor(LIGHT_GRAY[0], LIGHT_GRAY[1], LIGHT_GRAY[2]);
    doc.roundedRect(MARGIN, leftY, 110, 45, 3, 3, 'F');
    doc.addImage(qrDataUrl, 'PNG', MARGIN + 5, leftY + 5, 35, 35);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
    doc.text('SCAN TO PAY', MARGIN + 45, leftY + 15);
    if (data.payeeName) {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(SECONDARY[0], SECONDARY[1], SECONDARY[2]);
      doc.text('Payee: ', MARGIN + 45, leftY + 25);
      doc.setFont('helvetica', 'bold'); doc.setTextColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
      doc.text(data.payeeName, MARGIN + 58, leftY + 25);
    }
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(SECONDARY[0], SECONDARY[1], SECONDARY[2]);
    doc.text('UPI ID: ', MARGIN + 45, leftY + 33);
    doc.setFont('helvetica', 'bold'); doc.setTextColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
    doc.text(data.upiId, MARGIN + 58, leftY + 33);
  }

  // TOTAL — filled dark box (right)
  const totalBoxW = 72;
  const totalBoxH = 26;
  const totalBoxX = pageWidth - MARGIN - totalBoxW;
  doc.setFillColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
  doc.roundedRect(totalBoxX, finalY, totalBoxW, totalBoxH, 3, 3, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(255, 255, 255);
  doc.text('TOTAL AMOUNT', pageWidth - MARGIN - 5, finalY + 9, { align: 'right' });
  doc.setFont('helvetica', 'bold'); doc.setFontSize(17); doc.setTextColor(255, 255, 255);
  doc.text(`Rs. ${data.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - MARGIN - 5, finalY + 20, { align: 'right' });

  return doc;
};

// ─── Theme: SERVICE ────────────────────────────────────────────────────────────

const renderServiceTheme = async (data: InvoiceData, qrDataUrl: string | null): Promise<jsPDF> => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth  = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
  const bizName = getDisplayBusinessName(data).toUpperCase();
  doc.text(bizName, MARGIN, 30);
  if (data.projectTitle || (data.businessType === 'tuition' && data.businessName)) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(SECONDARY[0], SECONDARY[1], SECONDARY[2]);
    doc.text(data.projectTitle || data.businessName, MARGIN, 38);
  }

  // Document title right
  const docTitle = data.businessType === 'tuition' ? 'FEE RECEIPT' : 'INVOICE';
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(SECONDARY[0], SECONDARY[1], SECONDARY[2]);
  doc.text(docTitle, pageWidth - MARGIN, 30, { align: 'right' });
  const noLabel = data.businessType === 'tuition' ? 'RECEIPT NO:' : 'INVOICE NO:';
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
  doc.text(`${noLabel} ${data.invoiceNumber}`, pageWidth - MARGIN, 38, { align: 'right' });

  // Thin hairline separator
  doc.setDrawColor(BORDER[0], BORDER[1], BORDER[2]);
  doc.setLineWidth(0.4);
  doc.line(MARGIN, 44, pageWidth - MARGIN, 44);

  // Issuer (FROM) row
  const issuerEndYSvc = renderIssuerRow(doc, data, 49);
  if (issuerEndYSvc > 49) {
    doc.setDrawColor(BORDER[0], BORDER[1], BORDER[2]);
    doc.setLineWidth(0.15);
    doc.line(MARGIN, issuerEndYSvc + 1, pageWidth - MARGIN, issuerEndYSvc + 1);
  }

  // BILLED TO + Meta
  let startY = issuerEndYSvc > 49 ? issuerEndYSvc + 9 : 58;
  const billedLabel = data.businessType === 'tuition' ? 'STUDENT' : data.businessType === 'freelancer' ? 'CLIENT' : 'BILLED TO';
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(SECONDARY[0], SECONDARY[1], SECONDARY[2]);
  doc.text(billedLabel, MARGIN, startY);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.setTextColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
  doc.text(data.customerName || 'Valued Customer', MARGIN, startY + 7);

  let metaX = pageWidth - MARGIN;
  if (data.dueDate) {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(SECONDARY[0], SECONDARY[1], SECONDARY[2]);
    doc.text('DUE DATE', metaX, startY, { align: 'right' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
    doc.text(new Date(data.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }), metaX, startY + 7, { align: 'right' });
    metaX -= 32;
  }
  if (data.month) {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(SECONDARY[0], SECONDARY[1], SECONDARY[2]);
    doc.text('MONTH', metaX, startY, { align: 'right' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
    doc.text(data.month, metaX, startY + 7, { align: 'right' });
    metaX -= 32;
  }
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(SECONDARY[0], SECONDARY[1], SECONDARY[2]);
  doc.text('DATE', metaX, startY, { align: 'right' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
  doc.text(new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }), metaX, startY + 7, { align: 'right' });

  startY += 18;

  // Custom fields
  if (data.customFields && data.customFields.length > 0) {
    startY = renderCustomFields(doc, data.customFields, startY);
  }

  // Section header: Services / Items
  doc.setDrawColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
  doc.setLineWidth(0.4);
  doc.line(MARGIN, startY, pageWidth - MARGIN, startY);
  startY += 8;

  doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(SECONDARY[0], SECONDARY[1], SECONDARY[2]);
  const itemsHeader = data.businessType === 'tuition' ? 'SUBJECT / DESCRIPTION' : data.businessType === 'freelancer' ? 'SERVICE / DELIVERABLE' : 'ITEM';
  doc.text(itemsHeader, MARGIN, startY);
  doc.text('AMOUNT', pageWidth - MARGIN, startY, { align: 'right' });
  startY += 6;

  // Render each item manually
  let itemsY = startY;
  data.items.forEach((item) => {
    if (itemsY + 22 > pageHeight - 30) {
      doc.addPage();
      itemsY = 30;
      addFooter(doc, doc.getNumberOfPages(), doc.getNumberOfPages());
    }
    const qty   = Number(item.quantity) || 0;
    const price = Number(item.price) || 0;
    const lineAmount = qty * price;

    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
    doc.text(item.name || 'Service', MARGIN, itemsY);
    doc.text(`Rs. ${lineAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, pageWidth - MARGIN, itemsY, { align: 'right' });

    itemsY += 6;
    if (qty > 0 && price > 0) {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(SECONDARY[0], SECONDARY[1], SECONDARY[2]);
      const unitLabel = item.unit && item.unit !== 'Unit' ? ` ${item.unit}` : '';
      doc.text(`${qty}${unitLabel} × Rs. ${price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, MARGIN, itemsY);
      itemsY += 5;
    }

    doc.setDrawColor(BORDER[0], BORDER[1], BORDER[2]); doc.setLineWidth(0.15);
    doc.line(MARGIN, itemsY + 2, pageWidth - MARGIN, itemsY + 2);
    itemsY += 9;
  });

  if (itemsY + 60 > pageHeight - 30) { doc.addPage(); itemsY = 20; addFooter(doc, doc.getNumberOfPages(), doc.getNumberOfPages()); }

  // Total (right-aligned, clean)
  itemsY += 4;
  doc.setDrawColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]); doc.setLineWidth(0.4);
  doc.line(pageWidth - MARGIN - 70, itemsY, pageWidth - MARGIN, itemsY);
  itemsY += 6;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(SECONDARY[0], SECONDARY[1], SECONDARY[2]);
  doc.text('TOTAL', pageWidth - MARGIN, itemsY, { align: 'right' });
  itemsY += 7;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(19); doc.setTextColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
  doc.text(`Rs. ${data.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, pageWidth - MARGIN, itemsY, { align: 'right' });
  itemsY += 10;

  // Notes / Terms (if remarks)
  if (data.remarks) {
    if (itemsY + 30 > pageHeight - 30) { doc.addPage(); itemsY = 20; addFooter(doc, doc.getNumberOfPages(), doc.getNumberOfPages()); }
    const splitRemarks = doc.splitTextToSize(data.remarks, pageWidth - 2 * MARGIN - 12);
    const boxH = splitRemarks.length * 5 + 14;
    doc.setFillColor(250, 250, 248);
    doc.setDrawColor(BORDER[0], BORDER[1], BORDER[2]); doc.setLineWidth(0.3);
    doc.roundedRect(MARGIN, itemsY, pageWidth - 2 * MARGIN, boxH, 3, 3, 'FD');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(SECONDARY[0], SECONDARY[1], SECONDARY[2]);
    doc.text('NOTES & TERMS', MARGIN + 6, itemsY + 7);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
    doc.text(splitRemarks, MARGIN + 6, itemsY + 13);
    itemsY += boxH + 10;
  }

  // QR Code — centered
  if (qrDataUrl && data.upiId) {
    if (itemsY + 55 > pageHeight - 30) { doc.addPage(); itemsY = 20; addFooter(doc, doc.getNumberOfPages(), doc.getNumberOfPages()); }
    const qrBoxW = 90;
    const qrBoxX = (pageWidth - qrBoxW) / 2;
    doc.setFillColor(LIGHT_GRAY[0], LIGHT_GRAY[1], LIGHT_GRAY[2]);
    doc.roundedRect(qrBoxX, itemsY, qrBoxW, 52, 4, 4, 'F');

    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(SECONDARY[0], SECONDARY[1], SECONDARY[2]);
    doc.text('SCAN TO PAY', pageWidth / 2, itemsY + 8, { align: 'center' });
    doc.addImage(qrDataUrl, 'PNG', pageWidth / 2 - 17, itemsY + 11, 34, 34);

    if (data.payeeName || data.upiId) {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
      doc.text(data.payeeName || data.upiId, pageWidth / 2, itemsY + 49, { align: 'center' });
    }
    itemsY += 52;
  }

  addFooter(doc, 1, doc.getNumberOfPages());
  return doc;
};

// ─── Theme: MINIMAL ────────────────────────────────────────────────────────────

const renderMinimalTheme = async (data: InvoiceData, qrDataUrl: string | null): Promise<jsPDF> => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth  = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  // Business name — all caps, small
  const bizName = getDisplayBusinessName(data).toUpperCase();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
  doc.text(bizName, MARGIN, 28);

  let lastMinLeftY = 28;
  if (data.businessType === 'tuition' && data.businessName) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(SECONDARY[0], SECONDARY[1], SECONDARY[2]);
    doc.text(data.businessName, MARGIN, 34);
    lastMinLeftY = 34;
  }

  // Compact issuer line: payeeName (if distinct) · upiId
  const minFromParts: string[] = [];
  if (data.payeeName && data.payeeName !== data.businessName) minFromParts.push(data.payeeName);
  if (data.upiId) minFromParts.push(data.upiId);
  if (minFromParts.length > 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(SECONDARY[0], SECONDARY[1], SECONDARY[2]);
    doc.text(minFromParts.join('  ·  '), MARGIN, lastMinLeftY + 7);
    lastMinLeftY += 7;
  }

  // Doc title + number right
  const docTitle = data.businessType === 'tuition' ? 'FEE RECEIPT' : 'INVOICE';
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(SECONDARY[0], SECONDARY[1], SECONDARY[2]);
  doc.text(`${docTitle}  •  ${data.invoiceNumber}`, pageWidth - MARGIN, 28, { align: 'right' });
  doc.text(new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }), pageWidth - MARGIN, 35, { align: 'right' });

  // Hairline — positioned just below the lowest left-column text
  const hairlineYMin = Math.max(lastMinLeftY + 5, 40);
  doc.setDrawColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]); doc.setLineWidth(0.3);
  doc.line(MARGIN, hairlineYMin, pageWidth - MARGIN, hairlineYMin);

  // BILLED TO + date meta
  let startY = hairlineYMin + 12;
  const billedLabel = data.businessType === 'tuition' ? 'STUDENT' : data.businessType === 'freelancer' ? 'CLIENT' : 'BILLED TO';
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(SECONDARY[0], SECONDARY[1], SECONDARY[2]);
  doc.text(billedLabel, MARGIN, startY);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
  doc.text(data.customerName || 'Valued Customer', MARGIN, startY + 6);

  if (data.dueDate || data.month || data.projectTitle) {
    let mini = startY;
    if (data.projectTitle) {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(SECONDARY[0], SECONDARY[1], SECONDARY[2]);
      doc.text(data.projectTitle.toUpperCase(), pageWidth - MARGIN, mini, { align: 'right' });
      mini += 6;
    }
    if (data.month) {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(SECONDARY[0], SECONDARY[1], SECONDARY[2]);
      doc.text(data.month, pageWidth - MARGIN, mini, { align: 'right' });
      mini += 6;
    }
    if (data.dueDate) {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(SECONDARY[0], SECONDARY[1], SECONDARY[2]);
      doc.text(`Due: ${new Date(data.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`, pageWidth - MARGIN, mini, { align: 'right' });
    }
  }

  startY += 15;

  // Custom fields (inline style for minimal)
  if (data.customFields && data.customFields.length > 0) {
    const filtered = data.customFields.filter(f => f.label && f.value);
    filtered.forEach((field) => {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(SECONDARY[0], SECONDARY[1], SECONDARY[2]);
      doc.text(field.label.toUpperCase(), MARGIN, startY);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
      doc.text(field.value, MARGIN + 40, startY);
      startY += 7;
    });
    startY += 4;
  }

  // Hairline before items
  doc.setDrawColor(BORDER[0], BORDER[1], BORDER[2]); doc.setLineWidth(0.2);
  doc.line(MARGIN, startY, pageWidth - MARGIN, startY);
  startY += 8;

  // Items as dot-leader rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  data.items.forEach((item) => {
    if (startY + 12 > pageHeight - 30) {
      doc.addPage();
      startY = 30;
      addFooter(doc, doc.getNumberOfPages(), doc.getNumberOfPages());
    }
    const qty   = Number(item.quantity) || 0;
    const price = Number(item.price) || 0;
    const lineAmount = qty * price;
    const leftText  = (item.name || 'Item').substring(0, 48);
    const rightText = `Rs. ${lineAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

    const leftW  = doc.getTextWidth(leftText);
    const rightW = doc.getTextWidth(rightText);
    const gapL   = MARGIN + leftW + 2;
    const gapR   = pageWidth - MARGIN - rightW - 2;
    const dotSpaceW = gapR - gapL;
    const singleDotW = doc.getTextWidth('. ');
    const numDots = Math.max(0, Math.floor(dotSpaceW / singleDotW));

    doc.setTextColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
    doc.text(leftText, MARGIN, startY);
    if (numDots > 0) {
      doc.setTextColor(200, 200, 200);
      doc.text('. '.repeat(numDots), gapL, startY);
    }
    doc.setTextColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
    doc.text(rightText, pageWidth - MARGIN, startY, { align: 'right' });

    startY += 9;
  });

  // Hairline + Total
  doc.setDrawColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]); doc.setLineWidth(0.3);
  doc.line(MARGIN, startY, pageWidth - MARGIN, startY);
  startY += 7;

  doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
  doc.text('TOTAL', MARGIN, startY);
  doc.text(`Rs. ${data.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, pageWidth - MARGIN, startY, { align: 'right' });

  startY += 15;

  // Notes
  if (data.remarks) {
    if (startY + 20 > pageHeight - 30) { doc.addPage(); startY = 20; addFooter(doc, doc.getNumberOfPages(), doc.getNumberOfPages()); }
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(SECONDARY[0], SECONDARY[1], SECONDARY[2]);
    const splitR = doc.splitTextToSize(data.remarks, pageWidth - 2 * MARGIN);
    doc.text(splitR, MARGIN, startY);
    startY += splitR.length * 4 + 10;
  }

  // QR — small, bottom-right corner feel
  if (qrDataUrl && data.upiId) {
    if (startY + 38 > pageHeight - 30) { doc.addPage(); startY = 20; addFooter(doc, doc.getNumberOfPages(), doc.getNumberOfPages()); }
    doc.addImage(qrDataUrl, 'PNG', pageWidth - MARGIN - 30, startY, 30, 30);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(SECONDARY[0], SECONDARY[1], SECONDARY[2]);
    doc.text(data.upiId, pageWidth - MARGIN - 30, startY + 34, { maxWidth: 30 });
    if (data.payeeName) {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(PRIMARY[0], PRIMARY[1], PRIMARY[2]);
      doc.text(data.payeeName, MARGIN, startY + 15);
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(SECONDARY[0], SECONDARY[1], SECONDARY[2]);
      doc.text('Scan to pay', MARGIN, startY + 21);
    }
  }

  addFooter(doc, 1, doc.getNumberOfPages());
  return doc;
};

// ─── Public API ────────────────────────────────────────────────────────────────

export const generateInvoicePdf = async (data: InvoiceData): Promise<jsPDF> => {
  let qrDataUrl: string | null = data.qrDataUrl ?? null;
  if (!qrDataUrl && data.upiId) qrDataUrl = await generateQrCodeImage(data);

  const theme = data.theme ?? 'retail';
  if (theme === 'service')  return renderServiceTheme(data, qrDataUrl);
  if (theme === 'minimal')  return renderMinimalTheme(data, qrDataUrl);
  return renderRetailTheme(data, qrDataUrl);
};

export const downloadInvoicePdf = async (data: InvoiceData) => {
  const doc = await generateInvoicePdf(data);
  doc.save(`Invoice_${data.invoiceNumber}.pdf`);
};

export const shareInvoicePdf = async (data: InvoiceData) => {
  const doc = await generateInvoicePdf(data);
  const pdfBlob = doc.output('blob');
  const file = new File([pdfBlob], `Invoice_${data.invoiceNumber}.pdf`, { type: 'application/pdf' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: `Invoice ${data.invoiceNumber}`, text: `Here is your invoice for Rs. ${data.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` });
    } catch (error) {
      if ((error as Error).name !== 'AbortError' && (error as Error).message !== 'Share canceled') {
        console.error('Error sharing:', error);
      }
    }
  } else {
    await downloadInvoicePdf(data);
  }
};
