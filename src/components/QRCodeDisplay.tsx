import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, QrCode, Share2, Loader2 } from 'lucide-react';
import { motion } from "motion/react";

interface QRCodeDisplayProps {
  upiId: string;
  isValidUpi: boolean;
  upiUrl: string;
  amount: string;
  payeeName: string;
  remarks: string;
  qrRef: React.RefObject<SVGSVGElement>;
  onDownload: () => Promise<void>;
  onShare: () => Promise<void>;
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
  const [isSharing, setIsSharing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleShareClick = async () => {
    setIsSharing(true);
    try {
      await onShare();
    } finally {
      setIsSharing(false);
    }
  };

  const handleDownloadClick = async () => {
    setIsDownloading(true);
    try {
      await onDownload();
    } finally {
      setIsDownloading(false);
    }
  };

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
              onClick={handleDownloadClick}
              disabled={isDownloading}
              className="relative flex-1 flex items-center justify-center gap-2 bg-[#2d2d2b] text-[#e6e1dc] px-6 py-4 rounded-xl font-bold uppercase tracking-wide shadow-lg overflow-hidden group disabled:opacity-90 disabled:cursor-not-allowed"
              whileHover={!isDownloading ? { 
                scale: 1.02, 
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                transition: { duration: 0.2 }
              } : {}}
              whileTap={!isDownloading ? { 
                scale: 0.95,
                transition: { duration: 0.1 }
              } : {}}
              initial={{ opacity: 0, y: 10 }}
              animate={{ 
                opacity: 1, 
                y: 0,
                transition: { type: "spring", stiffness: 400, damping: 17 }
              }}
            >
              {isDownloading ? (
                <div className="flex items-center gap-3">
                  <div className="relative flex items-center justify-center w-5 h-5">
                    <motion.span 
                      className="absolute w-full h-full border-2 border-[#e6e1dc]/20 border-t-[#e6e1dc] rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    <motion.span 
                      className="absolute w-1.5 h-1.5 bg-[#e6e1dc] rounded-full"
                      animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                    />
                  </div>
                  <span className="relative z-10 font-black tracking-widest text-sm text-[#e6e1dc]">SAVING</span>
                  <motion.div
                    className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12"
                    initial={{ x: '-100%' }}
                    animate={{ x: '200%' }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 1.5, 
                      ease: "easeInOut"
                    }}
                  />
                </div>
              ) : (
                <>
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
                </>
              )}
            </motion.button>

            <motion.button
              onClick={handleShareClick}
              disabled={isSharing}
              className="relative flex-1 flex items-center justify-center gap-2 bg-white text-[#2d2d2b] border-2 border-[#2d2d2b] px-6 py-4 rounded-xl font-bold uppercase tracking-wide shadow-sm hover:bg-[#faf9f8] disabled:opacity-80 disabled:cursor-not-allowed overflow-hidden"
              whileHover={!isSharing ? { 
                scale: 1.02, 
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.01)",
                transition: { duration: 0.2 }
              } : {}}
              whileTap={!isSharing ? { 
                scale: 0.95,
                transition: { duration: 0.1 }
              } : {}}
              initial={{ opacity: 0, y: 10 }}
              animate={{ 
                opacity: 1, 
                y: 0,
                transition: { type: "spring", stiffness: 400, damping: 17, delay: 0.1 }
              }}
            >
              {isSharing ? (
                <div className="flex items-center gap-3">
                  <div className="relative flex items-center justify-center w-5 h-5">
                    <motion.span 
                      className="absolute w-full h-full border-2 border-[#2d2d2b]/20 border-t-[#2d2d2b] rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    <motion.span 
                      className="absolute w-1.5 h-1.5 bg-[#2d2d2b] rounded-full"
                      animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                    />
                  </div>
                  <span className="relative z-10 font-black tracking-widest text-sm text-[#2d2d2b]">PROCESSING</span>
                  <motion.div
                    className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-[#2d2d2b]/10 to-transparent -skew-x-12"
                    initial={{ x: '-100%' }}
                    animate={{ x: '200%' }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 1.5, 
                      ease: "easeInOut"
                    }}
                  />
                </div>
              ) : (
                <>
                  <Share2 className="w-5 h-5" />
                  <span className="relative z-10">Share</span>
                </>
              )}
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
