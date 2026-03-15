import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCodeStyling, { DotType, CornerSquareType, CornerDotType } from 'qr-code-styling';

export type BusinessType = 'shop' | 'freelancer' | 'tuition' | 'custom';

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
  classesName?: string; // For Tuition
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
}

const generateQrCodeImage = async (data: InvoiceData): Promise<string | null> => {
  if (!data.upiId) return null;

  // Generate UPI URL
  const cleanUpiId = data.upiId.trim();
  const cleanName = data.payeeName.trim();
  const trId = data.invoiceNumber;
  let upiUrl = `upi://pay?pa=${encodeURIComponent(cleanUpiId).replace(/%40/g, '@')}&pn=${encodeURIComponent(cleanName)}&cu=INR&tr=${trId}`;
  if (data.totalAmount > 0) upiUrl += `&am=${data.totalAmount.toFixed(2)}`;

  const { dotType = 'dots', cornerSquareType = 'extra-rounded', cornerDotType = 'dot' } = data.qrStyle || {};

  const qrOptions = {
    width: 200,
    height: 200,
    data: upiUrl,
    margin: 0,
    type: "svg" as const,
    qrOptions: {
      typeNumber: 0 as const,
      mode: "Byte" as const,
      errorCorrectionLevel: "H" as const
    },
    imageOptions: {
      hideBackgroundDots: true,
      imageSize: 0.4,
      margin: 0
    },
    dotsOptions: {
      type: dotType,
      color: "#2d2d2b"
    },
    cornersSquareOptions: {
      type: cornerSquareType,
      color: "#2d2d2b"
    },
    cornersDotOptions: {
      type: cornerDotType,
      color: "#2d2d2b"
    },
    image: `data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='20' fill='%232d2d2b'/%3E%3Ctext x='50' y='50' font-family='Arial, sans-serif' font-weight='900' font-size='60' fill='%23e6e1dc' text-anchor='middle' dominant-baseline='central'%3E${encodeURIComponent(data.qrCenterText || 'A')}%3C/text%3E%3C/svg%3E`
  };

  const qrCode = new QRCodeStyling(qrOptions);
  
  try {
    // Get the raw image data as a Blob
    const blob = await qrCode.getRawData('png');
    if (!blob) return null;

    // Ensure it's a Blob (browser environment)
    if (!(blob instanceof Blob)) return null;

    // Convert Blob to Base64 Data URL
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error generating QR code image:', error);
    return null;
  }
};

export const generateInvoicePdf = async (data: InvoiceData): Promise<jsPDF> => {
  // Generate QR Code if not provided but style is available or just always generate if upiId exists
  let qrDataUrl = data.qrDataUrl;
  if (!qrDataUrl && data.upiId) {
    qrDataUrl = await generateQrCodeImage(data);
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;

  // Colors
  const primaryColor: [number, number, number] = [20, 20, 20]; // #141414
  const secondaryColor: [number, number, number] = [100, 100, 100]; // #646464
  const lightGray: [number, number, number] = [245, 245, 245]; // #f5f5f5
  const borderColor: [number, number, number] = [220, 220, 220]; // #dcdcdc

  // Helper to add footer on every page
  const addFooter = (doc: jsPDF, pageNumber: number, totalPages: number) => {
    doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    doc.setLineWidth(0.2);
    doc.line(margin, pageHeight - 20, pageWidth - margin, pageHeight - 20);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    const brandText = 'ABHI LINK';
    doc.text(brandText, margin, pageHeight - 12);
    
    const brandWidth = doc.getTextWidth(brandText);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text('|', margin + brandWidth + 2, pageHeight - 12);
    doc.text('PREMIUM INVOICING', margin + brandWidth + 5, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(37, 99, 235); // #2563eb
    doc.text('https://abhi-link.vercel.app/', pageWidth - margin, pageHeight - 12, { align: 'right' });
    
    // Add link
    doc.link(pageWidth - margin - 40, pageHeight - 16, 40, 6, { url: 'https://abhi-link.vercel.app/' });
  };

  // Header
  if (data.businessType === 'tuition' && data.classesName) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(data.classesName.toUpperCase(), margin, 30);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    const teacherName = data.businessName || data.payeeName || 'Teacher Name';
    doc.text(teacherName, margin, 38);
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    const businessName = data.businessName || data.payeeName || 'Business Name';
    doc.text(businessName.toUpperCase(), margin, 30);
  }

  // Document Title
  let docTitle = 'INVOICE';
  if (data.businessType === 'tuition') docTitle = 'FEE RECEIPT';
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(200, 200, 200); // lighter gray for title
  doc.text(docTitle, pageWidth - margin, 30, { align: 'right' });

  // Invoice Number
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  const noLabel = data.businessType === 'tuition' ? 'RECEIPT NO:' : 'INVOICE NO:';
  doc.text(`${noLabel} ${data.invoiceNumber}`, pageWidth - margin, 38, { align: 'right' });

  // Separator Line
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(0.5);
  doc.line(margin, 45, pageWidth - margin, 45);

  // Billed To & Meta
  let startY = 60;
  
  let billedToLabel = 'BILLED TO';
  if (data.businessType === 'tuition') billedToLabel = 'STUDENT';
  if (data.businessType === 'freelancer') billedToLabel = 'CLIENT';

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text(billedToLabel, margin, startY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(data.customerName || 'Valued Customer', margin, startY + 6);

  // Meta Info (Right side)
  let metaX = pageWidth - margin;
  
  // Project Title
  if (data.projectTitle) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text('PROJECT', metaX, startY, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(data.projectTitle, metaX, startY + 6, { align: 'right' });
    metaX -= 40;
  }

  // Month
  if (data.month) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text('MONTH', metaX, startY, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(data.month, metaX, startY + 6, { align: 'right' });
    metaX -= 30;
  }

  // Due Date
  if (data.dueDate) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text('DUE DATE', metaX, startY, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(new Date(data.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }), metaX, startY + 6, { align: 'right' });
    metaX -= 30;
  }

  // Date
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text('DATE', metaX, startY, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }), metaX, startY + 6, { align: 'right' });

  startY += 20;

  // Table
  const tableCols = [
    data.businessType === 'tuition' ? 'SUBJECT / DESCRIPTION' : data.businessType === 'freelancer' ? 'SERVICE / TASK' : 'DESCRIPTION',
    data.businessType === 'tuition' ? 'MONTHS' : data.businessType === 'freelancer' ? 'HOURS/QTY' : 'QTY',
    data.businessType === 'tuition' ? 'FEE/MO' : data.businessType === 'freelancer' ? 'RATE' : 'PRICE',
    'AMOUNT'
  ];

  const tableRows = data.items.map(item => {
    const priceNum = Number(item.price) || 0;
    const qtyNum = Number(item.quantity) || 0;
    let qtyDisplay = qtyNum.toString();
    if (item.unit && item.unit !== 'Unit') {
      qtyDisplay += ` ${item.unit}`;
    }
    return [
      item.name || 'Item',
      qtyDisplay,
      `Rs. ${priceNum.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      `Rs. ${(qtyNum * priceNum).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    ];
  });

  autoTable(doc, {
    startY: startY,
    head: [tableCols],
    body: tableRows,
    theme: 'plain',
    headStyles: {
      fillColor: false,
      textColor: primaryColor,
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left',
      cellPadding: 6,
      lineWidth: { top: 0.5, bottom: 0.5, left: 0.1, right: 0.1 },
      lineColor: primaryColor
    },
    bodyStyles: {
      textColor: primaryColor,
      fontSize: 10,
      cellPadding: 6,
      lineWidth: { bottom: 0.1, left: 0.1, right: 0.1 },
      lineColor: borderColor
    },
    columnStyles: {
      0: { halign: 'left' },
      1: { halign: 'center', cellWidth: 25 },
      2: { halign: 'right', cellWidth: 35 },
      3: { halign: 'right', cellWidth: 35, fontStyle: 'bold' }
    },
    margin: { top: 45, right: margin, bottom: 30, left: margin },
    didDrawPage: (data) => {
      const pageCount = doc.getNumberOfPages();
      addFooter(doc, data.pageNumber, pageCount);
    }
  });

  // @ts-ignore
  let finalY = doc.lastAutoTable.finalY + 15;

  if (finalY + 60 > pageHeight - 30) {
    doc.addPage();
    finalY = 20;
    addFooter(doc, doc.getNumberOfPages(), doc.getNumberOfPages());
  }

  // Notes & QR Code (Left Side)
  let leftY = finalY;
  
  if (data.remarks) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text('NOTES', margin, leftY);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    const splitRemarks = doc.splitTextToSize(data.remarks, 100);
    doc.text(splitRemarks, margin, leftY + 6);
    
    const remarksHeight = (splitRemarks.length * 4) + 10;
    leftY += remarksHeight;
  }

  if (qrDataUrl && data.upiId) {
    if (leftY + 50 > pageHeight - 30) {
        doc.addPage();
        leftY = 20;
        addFooter(doc, doc.getNumberOfPages(), doc.getNumberOfPages());
    }

    doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.roundedRect(margin, leftY, 110, 45, 3, 3, 'F');

    doc.addImage(qrDataUrl, 'PNG', margin + 5, leftY + 5, 35, 35);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('SCAN TO PAY', margin + 45, leftY + 15);

    if (data.payeeName) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.text('Payee: ', margin + 45, leftY + 25);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(data.payeeName, margin + 58, leftY + 25);
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text('UPI ID: ', margin + 45, leftY + 33);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(data.upiId, margin + 58, leftY + 33);
  }

  // Total Amount (Right Side)
  const totalX = pageWidth - margin;

  doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
  doc.setLineWidth(0.5);
  doc.line(totalX - 60, finalY, totalX, finalY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text('TOTAL AMOUNT', totalX, finalY + 8, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(`Rs. ${data.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, totalX, finalY + 20, { align: 'right' });

  return doc;
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
      await navigator.share({
        files: [file],
        title: `Invoice ${data.invoiceNumber}`,
        text: `Here is your invoice for Rs. ${data.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      });
    } catch (error) {
      if ((error as Error).name !== 'AbortError' && (error as Error).message !== 'Share canceled') {
        console.error('Error sharing:', error);
      }
    }
  } else {
    // Fallback
    await downloadInvoicePdf(data);
  }
};
