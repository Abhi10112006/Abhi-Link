import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, QrCode, Share2 } from 'lucide-react';

interface QRCodeDisplayProps {
  upiId: string;
  isValidUpi: boolean;
  upiUrl: string;
  amount: string;
  payeeName: string;
  remarks: string;
  qrRef: React.RefObject<SVGSVGElement>;
  onDownload: () => void;
  onShare: () => void;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  upiId,
  isValidUpi,
  upiUrl,
  amount,
  payeeName,
  remarks,
  qrRef,
  onDownload,
  onShare,
}) => {
  return (
    <div className="p-8 bg-[#faf9f8] flex flex-col items-center justify-center">
      {upiId && isValidUpi ? (
        <div className="flex flex-col items-center w-full">
          <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300 border-2 border-[#d9d3ce] mb-6">
            <QRCodeSVG
              id="upi-qr-code"
              value={upiUrl}
              size={200}
              level="H"
              includeMargin={false}
              ref={qrRef}
              fgColor="#2d2d2b"
              imageSettings={{
                src: "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='20' fill='%232d2d2b'/%3E%3Ctext x='50' y='50' font-family='Arial, sans-serif' font-weight='900' font-size='60' fill='%23e6e1dc' text-anchor='middle' dominant-baseline='central'%3EA%3C/text%3E%3C/svg%3E",
                x: undefined,
                y: undefined,
                height: 48,
                width: 48,
                excavate: true,
              }}
            />
          </div>
          
          <div className="text-center mb-6 w-full">
            {amount && (
              <div className="text-3xl font-black text-[#2d2d2b] mb-1">
                ₹{amount}
              </div>
            )}
            {payeeName && (
              <div className="text-sm font-bold text-[#2d2d2b] uppercase tracking-wide">
                Paying to: {payeeName}
              </div>
            )}
            {remarks && (
              <div className="text-xs text-[#2d2d2b]/70 mt-1 italic font-medium">
                "{remarks}"
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <button
              onClick={onDownload}
              className="flex-1 flex items-center justify-center gap-2 bg-[#2d2d2b] hover:bg-black text-[#e6e1dc] px-6 py-4 rounded-xl font-bold uppercase tracking-wide transition-colors shadow-sm"
            >
              <Download className="w-5 h-5" />
              Download
            </button>
            <button
              onClick={onShare}
              className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-[#faf9f8] text-[#2d2d2b] border-2 border-[#2d2d2b] px-6 py-4 rounded-xl font-bold uppercase tracking-wide transition-colors shadow-sm"
            >
              <Share2 className="w-5 h-5" />
              Share
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center flex flex-col items-center justify-center h-full text-[#2d2d2b]/30">
          <QrCode className="w-16 h-16 mb-4" />
          <p className="text-sm font-bold uppercase tracking-wide">
            {upiId && !isValidUpi 
              ? "Enter a valid UPI ID to generate your custom QR code."
              : "Enter a UPI ID to generate your custom QR code."}
          </p>
        </div>
      )}
    </div>
  );
};
