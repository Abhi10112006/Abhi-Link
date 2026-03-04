import React, { forwardRef } from 'react';
import { translations } from '../locales/translations';
import { CheckCircle2 } from 'lucide-react';

interface ReceiptProps {
  data: {
    payeeName: string;
    payeeUpiId: string;
    amount: string;
    remarks: string;
    senderName: string;
    date: string;
    isReceiver: boolean;
  } | null;
  lang: string;
}

// 'A' Logo SVG
const ALogo = () => (
  <svg viewBox="0 0 100 100" className="w-10 h-10">
    <rect width="100" height="100" rx="20" fill="#2d2d2b" />
    <text x="50" y="50" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="60" fill="#e6e1dc" textAnchor="middle" dominantBaseline="central">A</text>
  </svg>
);

// Correct Wavy Verified Badge SVG
const WavyVerifiedBadge = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6">
    <polygon fill="#1a1a1a" points="12,0 13.85,2.68 16.59,0.91 17.28,4.10 20.49,3.51 19.90,6.72 23.09,7.41 21.32,10.15 24,12 21.32,13.85 23.09,16.59 19.90,17.28 20.49,20.49 17.28,19.90 16.59,23.09 13.85,21.32 12,24 10.15,21.32 7.41,23.09 6.72,19.90 3.51,20.49 4.10,17.28 0.91,16.59 2.68,13.85 0,12 2.68,10.15 0.91,7.41 4.10,6.72 3.51,3.51 6.72,4.10 7.41,0.91 10.15,2.68" />
    <path fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" d="M7 12.5 L10.5 16 L17 8" />
  </svg>
);

export const Receipt = forwardRef<HTMLDivElement, ReceiptProps>(({ data, lang }, ref) => {
  if (!data) return null;

  const t = translations[lang] || translations['en'];
  const tEn = translations['en'];

  const getTrans = (key: string) => {
    return t[key] || tEn[key] || key;
  };

  return (
    <div ref={ref} className="w-[595px] h-[842px] bg-[#ffffff] relative overflow-hidden text-[#1a1a1a] flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="h-2 bg-[#2d2d2b] w-full shrink-0"></div>

      <div className="px-10 py-6 flex justify-between items-start shrink-0">
        <div className="flex items-center gap-3">
          <ALogo />
          <div className="flex flex-col -mt-1">
            <span className="font-bold text-xl tracking-tight text-[#2d2d2b]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>ABHI LINK</span>
            <span className="text-[10px] text-[#6b7280] uppercase tracking-wider font-medium">Premium Payments</span>
          </div>
        </div>
        <div className="text-right">
          <h1 className="text-3xl font-bold text-[#2d2d2b] tracking-wide uppercase" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{getTrans('paymentReceipt')}</h1>
          <p className="text-xs text-[#6b7280] mt-1 tracking-widest uppercase font-medium">{getTrans('generatedVia')}</p>
        </div>
      </div>

      <div className="mx-10 border-b border-[#e5e7eb] shrink-0"></div>

      <div className="relative z-10 px-10 py-6 flex-grow mt-8 pb-32">
        <div className="mb-6 text-center bg-[#f9fafb] py-6 rounded-xl border border-[#f3f4f6]">
          <p className="text-sm text-[#6b7280] uppercase tracking-widest mb-1 font-medium">{getTrans('amount')}</p>
          <div className="text-5xl font-bold text-[#2d2d2b] tracking-tight flex items-center justify-center gap-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            <span>₹{data.amount}</span>
            <div className="scale-[2.2] origin-left translate-y-[17px]">
              <WavyVerifiedBadge />
            </div>
          </div>
        </div>

        <div className="border border-[#e5e7eb] rounded-xl overflow-hidden shadow-sm">
          <div className="grid grid-cols-[200px_1fr] bg-[#f9fafb] border-b border-[#e5e7eb]">
            <div className="p-3 font-bold text-xs text-[#4b5563] uppercase tracking-wider border-r border-[#e5e7eb]">
              {getTrans('parameter')}
            </div>
            <div className="p-3 font-bold text-xs text-[#4b5563] uppercase tracking-wider">
              {getTrans('details')}
            </div>
          </div>

          {[
            { label: 'sender', value: data.senderName },
            { label: 'receiver', value: data.payeeName },
            { label: 'receiverUpiId', value: data.payeeUpiId },
            { label: 'date', value: data.date },
            { label: 'note', value: data.remarks || '-' },
          ].map((item, index) => (
            <div key={item.label} className={`grid grid-cols-[200px_1fr] border-b border-[#e5e7eb] last:border-b-0 ${index % 2 === 0 ? 'bg-[#ffffff]' : 'bg-[#f9fafb]'}`}>
              <div className="p-3 font-medium text-xs text-[#6b7280] uppercase tracking-wide border-r border-[#e5e7eb] flex items-center">
                {getTrans(item.label)}
              </div>
              <div className="p-3 font-mono font-medium text-sm text-[#111827] flex items-center break-all">
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 w-full bg-[#ffffff]">
        <div className="border-t border-[#e5e7eb] px-10 py-3">
          <div className="flex items-center mb-1">
            <p className="font-bold text-[#2d2d2b] text-[17px] tracking-wide uppercase leading-none">{getTrans('paymentVerified')}</p>
          </div>
          <p className="text-[13px] text-[#4b5563] font-medium">
            {data.isReceiver ? getTrans('verifiedByReceiver') : getTrans('verifiedBySender')}
          </p>
          {!data.isReceiver && (
            <p className="text-xs text-[#6b7280] mt-1 italic">
              {getTrans('checkBankingApp')}
            </p>
          )}
        </div>

        <div className="px-10 pb-8 pt-3 border-t border-[#e5e7eb]">
          <div className="flex justify-between items-end">
            <div className="max-w-[70%]">
              <p className="text-[10px] text-[#9ca3af] uppercase tracking-wide leading-relaxed">
                {getTrans('computerGenerated')}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-[#9ca3af] font-bold uppercase tracking-wide">
                <a href="https://abhi-link.vercel.app/" target="_blank" rel="noopener noreferrer" className="text-[#2563eb] underline">ABHI LINK</a> - SIMPLIFY YOUR UPI PAYMENTS
              </p>
            </div>
          </div>
        </div>
        
        <div className="h-2 bg-[#2d2d2b] w-full shrink-0"></div>
      </div>
    </div>
  );
});

Receipt.displayName = 'Receipt';
