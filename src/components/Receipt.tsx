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
  <svg viewBox="0 0 512 512" className="w-6 h-6">
    <path fill="#000000" d="M256 0C114.6 0 0 114.6 0 256s114.6 256 256 256 256-114.6 256-256S397.4 0 256 0zm127.3 194.7l-144 144c-4.6 4.6-10.7 7-16.9 7s-12.3-2.4-16.9-7l-80-80c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l63.1 63.1 127.1-127.1c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9z" />
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
    <div ref={ref} className="w-[595px] bg-[#ffffff] relative overflow-hidden text-[#1a1a1a] font-sans flex flex-col" style={{ minHeight: '842px' }}>
      <div className="h-2 bg-[#2d2d2b] w-full"></div>

      <div className="px-10 py-6 flex justify-between items-start">
        <div className="flex items-center gap-3">
          <ALogo />
          <div className="flex flex-col -mt-1">
            <span className="font-bold text-xl tracking-tight text-[#2d2d2b]">ABHI LINK</span>
            <span className="text-[10px] text-[#6b7280] uppercase tracking-wider">Premium Payments</span>
          </div>
        </div>
        <div className="text-right">
          <h1 className="text-3xl font-bold text-[#2d2d2b] tracking-wide uppercase">{getTrans('paymentReceipt')}</h1>
          <p className="text-xs text-[#6b7280] mt-1 tracking-widest uppercase">{getTrans('generatedVia')}</p>
        </div>
      </div>

      <div className="mx-10 border-b border-[#e5e7eb]"></div>

      <div className="relative z-10 px-10 py-6 flex-grow mt-8">
        <div className="mb-6 text-center bg-[#f9fafb] py-6 rounded-xl border border-[#f3f4f6]">
          <p className="text-sm text-[#6b7280] uppercase tracking-widest mb-1">{getTrans('amount')}</p>
          <div className="text-5xl font-bold text-[#2d2d2b] tracking-tight">
            ₹{data.amount}
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

        <div className="mt-24 pt-4 border-t border-[#e5e7eb]">
          <div className="flex items-center gap-2 mb-2">
            <WavyVerifiedBadge />
            <p className="font-bold text-[#2d2d2b] text-sm tracking-wide uppercase leading-none -mt-0.5">{getTrans('paymentVerified')}</p>
          </div>
          <p className="text-xs text-[#4b5563] font-medium">
            {data.isReceiver ? getTrans('verifiedByReceiver') : getTrans('verifiedBySender')}
          </p>
        </div>
      </div>
      
      <div className="px-10 pb-[1cm] pt-8 border-t border-[#e5e7eb]">
        <div className="flex justify-between items-end">
          <div className="max-w-[70%]">
            <p className="text-[10px] text-[#9ca3af] uppercase tracking-wide leading-relaxed">
              {getTrans('computerGenerated')}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-[#9ca3af] font-bold uppercase tracking-wide">
              {getTrans('simplifyPayments')}
            </p>
          </div>
        </div>
      </div>
      
      <div className="h-2 bg-[#2d2d2b] w-full"></div>
    </div>
  );
});

Receipt.displayName = 'Receipt';
