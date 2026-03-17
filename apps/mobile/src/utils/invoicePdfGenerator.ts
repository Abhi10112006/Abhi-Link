import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';

export type BusinessType = 'shop' | 'freelancer' | 'tuition' | 'custom';

export interface InvoiceItem {
  id: string;
  name: string;
  /** Raw user input — always stored as a string from TextInput, parsed to number at calculation boundaries. */
  quantity: string;
  /** Raw user input — always stored as a string from TextInput, parsed to number at calculation boundaries. */
  price: string;
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
  remarks?: string;
  businessType: BusinessType;
  dueDate?: string;
  month?: string;
  projectTitle?: string;
}

const generateInvoiceHtml = (data: InvoiceData): string => {
  const now = new Date();
  const dateStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

  const itemRows = data.items
    .filter((i) => i.name)
    .map(
      (item, idx) => `
      <tr style="background:${idx % 2 === 0 ? '#fff' : '#f9fafb'}">
        <td style="padding:8px 12px;font-size:13px;">${item.name}</td>
        <td style="padding:8px 12px;font-size:13px;text-align:center;">${item.quantity} ${item.unit || ''}</td>
        <td style="padding:8px 12px;font-size:13px;text-align:right;">₹${Number(item.price).toFixed(2)}</td>
        <td style="padding:8px 12px;font-size:13px;text-align:right;font-weight:bold;">₹${(Number(item.quantity) * Number(item.price)).toFixed(2)}</td>
      </tr>`,
    )
    .join('');

  const upiUrl = data.upiId
    ? `upi://pay?pa=${encodeURIComponent(data.upiId)}&pn=${encodeURIComponent(data.payeeName)}&cu=INR&am=${data.totalAmount.toFixed(2)}&tr=${data.invoiceNumber}`
    : '';

  const businessLabel =
    data.businessType === 'tuition'
      ? 'Tuition Centre'
      : data.businessType === 'freelancer'
      ? 'Freelancer'
      : data.businessType === 'custom'
      ? 'Business'
      : 'Shop';

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<style>
  body { font-family: Arial, sans-serif; margin: 0; padding: 32px; color: #1a1a1a; background: #fff; }
  h1 { font-size: 28px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; margin: 0; color: #2d2d2b; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
  .badge { font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; color: #6b7280; }
  .divider { border: none; border-top: 1px solid #e5e7eb; margin: 16px 0; }
  .meta { display: flex; justify-content: space-between; margin-bottom: 24px; font-size: 13px; }
  .meta-col p { margin: 4px 0; }
  .meta-col .label { font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; }
  .meta-col .value { font-weight: bold; color: #2d2d2b; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  thead tr { background: #f9fafb; }
  thead th { padding: 8px 12px; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #4b5563; text-align: left; border-bottom: 1px solid #e5e7eb; }
  thead th:not(:first-child) { text-align: right; }
  tbody tr { border-bottom: 1px solid #f3f4f6; }
  .total-row { background: #2d2d2b; color: #e6e1dc; }
  .total-row td { padding: 10px 12px; font-size: 14px; font-weight: bold; }
  .remarks { font-style: italic; font-size: 12px; color: #4b5563; margin-top: 8px; }
  .footer { margin-top: 32px; font-size: 10px; color: #9ca3af; text-align: center; text-transform: uppercase; letter-spacing: 1px; }
  .upi-section { margin-top: 24px; padding: 16px; background: #f9fafb; border-radius: 12px; border: 1px solid #e5e7eb; text-align: center; }
  .upi-id { font-size: 16px; font-weight: bold; color: #2d2d2b; font-family: monospace; }
</style>
</head>
<body>
<div class="header">
  <div>
    <h1>ABHI LINK</h1>
    <div class="badge">${businessLabel} · Invoice</div>
  </div>
  <div style="text-align:right">
    <div style="font-size:22px;font-weight:900;color:#2d2d2b;">INVOICE</div>
    <div style="font-size:12px;color:#6b7280;">Powered by Abhi Link</div>
  </div>
</div>
<hr class="divider"/>
<div class="meta">
  <div class="meta-col">
    <p class="label">From</p>
    <p class="value">${data.businessName || 'Business'}</p>
    ${data.classesName ? `<p style="font-size:12px;color:#6b7280;">${data.classesName}</p>` : ''}
    ${data.upiId ? `<p style="font-size:12px;font-family:monospace;color:#4b5563;">${data.upiId}</p>` : ''}
  </div>
  <div class="meta-col" style="text-align:right">
    <p class="label">Invoice #</p>
    <p class="value">${data.invoiceNumber}</p>
    <p class="label" style="margin-top:8px">Date</p>
    <p class="value">${dateStr}</p>
    ${data.dueDate ? `<p class="label" style="margin-top:8px">Due Date</p><p class="value">${data.dueDate}</p>` : ''}
    ${data.month ? `<p class="label" style="margin-top:8px">Month</p><p class="value">${data.month}</p>` : ''}
  </div>
</div>
${data.customerName ? `<div style="margin-bottom:16px"><span style="font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;color:#6b7280;">Bill To: </span><span style="font-weight:bold;color:#2d2d2b;">${data.customerName}</span></div>` : ''}
${data.projectTitle ? `<div style="margin-bottom:16px"><span style="font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;color:#6b7280;">Project: </span><span style="font-weight:bold;color:#2d2d2b;">${data.projectTitle}</span></div>` : ''}
<table>
  <thead>
    <tr>
      <th>Item</th>
      <th style="text-align:center">Qty</th>
      <th style="text-align:right">Rate</th>
      <th style="text-align:right">Amount</th>
    </tr>
  </thead>
  <tbody>
    ${itemRows}
    <tr class="total-row">
      <td colspan="3" style="text-align:right;letter-spacing:1px;text-transform:uppercase;">Total</td>
      <td style="text-align:right;">₹${data.totalAmount.toFixed(2)}</td>
    </tr>
  </tbody>
</table>
${data.remarks ? `<div class="remarks">"${data.remarks}"</div>` : ''}
${data.upiId ? `
<div class="upi-section">
  <div style="font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;color:#6b7280;margin-bottom:8px;">Pay via UPI</div>
  <div class="upi-id">${data.upiId}</div>
  ${data.totalAmount > 0 ? `<div style="font-size:20px;font-weight:900;color:#2d2d2b;margin-top:8px;">₹${data.totalAmount.toFixed(2)}</div>` : ''}
  ${upiUrl ? `<div style="font-size:10px;color:#9ca3af;margin-top:4px;word-break:break-all;">${upiUrl}</div>` : ''}
</div>
` : ''}
<div class="footer">
  Generated by ABHI LINK · abhi-link.vercel.app<br/>
  This is a computer generated invoice
</div>
</body>
</html>`;
};

export const downloadInvoicePdf = async (data: InvoiceData): Promise<void> => {
  try {
    const html = generateInvoiceHtml(data);
    const { uri } = await Print.printToFileAsync({ html });
    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Invoice ${data.invoiceNumber}`,
        UTI: 'com.adobe.pdf',
      });
    } else {
      Alert.alert('Saved', 'Invoice saved to temporary storage.');
    }
  } catch (err: any) {
    if (err?.message !== 'User canceled') {
      console.error('Error generating invoice PDF:', err);
      Alert.alert('Error', 'Could not generate the invoice. Please try again.');
    }
  }
};

export const shareInvoicePdf = async (data: InvoiceData): Promise<void> => {
  await downloadInvoicePdf(data);
};
