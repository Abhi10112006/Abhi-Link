import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, QrCode, Share2 } from 'lucide-react';
import { motion } from "motion/react";

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
    <div className="p-8 bg-[#faf9f8] flex flex-col items-center justify-center min-h-full">
      {upiId && isValidUpi ? (
        <div className="flex flex-col items-center w-full">
          {payeeName && (
            <div className="flex items-baseline justify-center gap-1.5 mb-4 w-full px-4">
              <div className="text-xl font-bold text-[#2d2d2b]/60 uppercase tracking-tight whitespace-nowrap">
                Paying To:
              </div>
              <div className="text-xl font-black text-[#2d2d2b] uppercase tracking-tight truncate">
                {payeeName}
              </div>
            </div>
          )}
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
            {remarks && (
              <div className="text-xs text-[#2d2d2b]/70 mt-1 italic font-medium">
                "{remarks}"
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <motion.button
              onClick={onDownload}
              className="relative flex-1 flex items-center justify-center gap-2 bg-[#2d2d2b] text-[#e6e1dc] px-6 py-4 rounded-xl font-bold uppercase tracking-wide shadow-lg overflow-hidden group"
              whileHover={{ scale: 1.02, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <span className="relative z-10 flex items-center gap-2">
                <Download className="w-5 h-5" />
                Download
              </span>
              <motion.div
                className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12"
                initial={{ x: '-100%' }}
                animate={{ x: '200%' }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 2, 
                  ease: "easeInOut", 
                  repeatDelay: 4 
                }}
              />
            </motion.button>

            <motion.button
              onClick={onShare}
              className="flex-1 flex items-center justify-center gap-2 bg-white text-[#2d2d2b] border-2 border-[#2d2d2b] px-6 py-4 rounded-xl font-bold uppercase tracking-wide shadow-sm hover:bg-[#faf9f8]"
              whileHover={{ scale: 1.02, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.01)" }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 17, delay: 0.1 }}
            >
              <Share2 className="w-5 h-5" />
              Share
            </motion.button>
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
