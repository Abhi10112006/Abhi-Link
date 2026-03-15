import { translations } from '../locales/translations';

/**
 * Generates an HTML string for a payment receipt that can be rendered by expo-print.
 */
export interface ReceiptData {
  payeeName: string;
  payeeUpiId: string;
  amount: string;
  remarks: string;
  senderName: string;
  date: string;
  isReceiver: boolean;
}

export const generateReceiptHtml = (data: ReceiptData, lang: string): string => {
  const t = translations[lang] || translations['en'];
  const tEn = translations['en'];
  const gt = (key: string) => t[key] || tEn[key] || key;

  const rows = [
    { label: gt('sender'), value: data.senderName },
    { label: gt('receiver'), value: data.payeeName },
    { label: gt('receiverUpiId'), value: data.payeeUpiId },
    { label: gt('date'), value: data.date },
    { label: gt('note'), value: data.remarks || '-' },
  ];

  const rowsHtml = rows
    .map(
      (r, i) => `
    <tr style="background:${i % 2 === 0 ? '#fff' : '#f9fafb'}">
      <td style="padding:10px 14px;font-size:11px;font-weight:bold;text-transform:uppercase;letter-spacing:1px;color:#6b7280;border-right:1px solid #e5e7eb;width:180px;">${r.label}</td>
      <td style="padding:10px 14px;font-size:13px;font-weight:500;color:#111827;font-family:monospace;word-break:break-all;">${r.value}</td>
    </tr>`,
    )
    .join('');

  const verifiedMsg = data.isReceiver ? gt('verifiedByReceiver') : gt('verifiedBySender');
  const checkMsg = !data.isReceiver ? `<p style="font-size:11px;color:#6b7280;font-style:italic;margin:4px 0 0;">${gt('checkBankingApp')}</p>` : '';

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; background: #fff; color: #1a1a1a; width: 595px; }
  .top-bar { height: 8px; background: #2d2d2b; width: 100%; }
  .header { padding: 24px 40px; display: flex; justify-content: space-between; align-items: flex-start; }
  .logo-name { font-size: 20px; font-weight: 900; letter-spacing: 1px; color: #2d2d2b; }
  .logo-sub { font-size: 9px; color: #6b7280; text-transform: uppercase; letter-spacing: 2px; }
  .receipt-title { font-size: 28px; font-weight: 900; text-transform: uppercase; color: #2d2d2b; text-align: right; }
  .receipt-sub { font-size: 10px; color: #6b7280; text-align: right; text-transform: uppercase; letter-spacing: 2px; margin-top: 4px; }
  .divider { border: none; border-top: 1px solid #e5e7eb; margin: 0 40px; }
  .amount-box { margin: 32px 40px 24px; background: #f9fafb; padding: 24px; border-radius: 12px; text-align: center; border: 1px solid #f3f4f6; }
  .amount-label { font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #6b7280; margin-bottom: 8px; }
  .amount-value { font-size: 48px; font-weight: 900; color: #2d2d2b; }
  .table-wrap { margin: 0 40px 32px; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; }
  table { width: 100%; border-collapse: collapse; }
  .table-head { background: #f9fafb; }
  .table-head th { padding: 10px 14px; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #4b5563; text-align: left; border-bottom: 1px solid #e5e7eb; }
  tr:not(:last-child) td { border-bottom: 1px solid #e5e7eb; }
  .footer-section { margin: 0 40px 12px; padding-top: 16px; border-top: 1px solid #e5e7eb; }
  .verified-title { font-size: 16px; font-weight: 900; text-transform: uppercase; color: #2d2d2b; letter-spacing: 1px; }
  .verified-body { font-size: 13px; color: #4b5563; margin-top: 4px; }
  .legal { margin: 0 40px 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: flex-end; }
  .legal p { font-size: 9px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; }
  .bottom-bar { height: 8px; background: #2d2d2b; width: 100%; margin-top: 0; }
</style>
</head>
<body>
<div class="top-bar"></div>
<div class="header">
  <div>
    <div class="logo-name">ABHI LINK</div>
    <div class="logo-sub">Premium Payments</div>
  </div>
  <div>
    <div class="receipt-title">${gt('paymentReceipt')}</div>
    <div class="receipt-sub">${gt('generatedVia') || 'Generated via Abhi Link'}</div>
  </div>
</div>
<hr class="divider"/>
<div class="amount-box">
  <div class="amount-label">${gt('amount')}</div>
  <div class="amount-value">₹${data.amount}</div>
</div>
<div class="table-wrap">
  <table>
    <thead class="table-head">
      <tr>
        <th>${gt('parameter') || 'Parameter'}</th>
        <th>${gt('details') || 'Details'}</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>
</div>
<div class="footer-section">
  <div class="verified-title">${gt('paymentVerified') || 'Payment Verified'}</div>
  <div class="verified-body">${verifiedMsg}</div>
  ${checkMsg}
</div>
<div class="legal">
  <p>${gt('computerGenerated') || 'This is a computer generated receipt'}</p>
  <p>ABHI LINK – SIMPLIFY YOUR UPI PAYMENTS</p>
</div>
<div class="bottom-bar"></div>
</body>
</html>`;
};
