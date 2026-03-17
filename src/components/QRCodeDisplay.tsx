import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Download, QrCode, Share2, Loader2, ReceiptText, Palette, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from "motion/react";
import QRCodeStyling, { DotType, CornerSquareType, CornerDotType } from 'qr-code-styling';
import { hapticLight, hapticMedium, hapticHeavy, hapticSuccess, hapticScroll } from '../utils/haptics';

interface QRCodeDisplayProps {
  upiId: string;
  isValidUpi: boolean;
  upiUrl: string;
  amount: string;
  payeeName: string;
  remarks: string;
  qrRef: React.RefObject<any>;
  dotType: DotType;
  setDotType: (type: DotType) => void;
  cornerSquareType: CornerSquareType;
  setCornerSquareType: (type: CornerSquareType) => void;
  cornerDotType: CornerDotType;
  setCornerDotType: (type: CornerDotType) => void;
  onDownload: () => Promise<void>;
  onShare: () => Promise<void>;
  onGenerateReceipt: () => Promise<void>;
  t: Record<string, string>;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  upiId,
  isValidUpi,
  upiUrl,
  amount,
  payeeName,
  remarks,
  qrRef,
  dotType,
  setDotType,
  cornerSquareType,
  setCornerSquareType,
  cornerDotType,
  setCornerDotType,
  onDownload,
  onShare,
  onGenerateReceipt,
  t,
}) => {
  const [isSharing, setIsSharing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [isCopyingLink, setIsCopyingLink] = useState(false);
  const [isSharingWhatsApp, setIsSharingWhatsApp] = useState(false);
  
  const [showStyles, setShowStyles] = useState(false);

  const qrCode = useRef<QRCodeStyling | null>(null);

  const handleScroll = useCallback(() => {
    hapticScroll();
  }, []);

  // Page-level scroll haptics for the QR display panel
  useEffect(() => {
    let lastScrollY = window.scrollY;
    const SCROLL_THRESHOLD = 40;
    const onScroll = () => {
      const delta = Math.abs(window.scrollY - lastScrollY);
      if (delta >= SCROLL_THRESHOLD) {
        handleScroll();
        lastScrollY = window.scrollY;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [handleScroll]);

  useEffect(() => {
    qrCode.current = new QRCodeStyling({
      width: 200,
      height: 200,
      data: upiUrl,
      margin: 0,
      type: "svg",
      qrOptions: {
        typeNumber: 0,
        mode: "Byte",
        errorCorrectionLevel: "H"
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
      image: "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='20' fill='%232d2d2b'/%3E%3Ctext x='50' y='50' font-family='Arial, sans-serif' font-weight='900' font-size='60' fill='%23e6e1dc' text-anchor='middle' dominant-baseline='central'%3EA%3C/text%3E%3C/svg%3E"
    });
    
    if (qrRef.current) {
      qrRef.current.innerHTML = '';
      qrCode.current.append(qrRef.current);
    }
  }, []);

  useEffect(() => {
    if (qrCode.current) {
      qrCode.current.update({
        data: upiUrl,
        dotsOptions: { type: dotType },
        cornersSquareOptions: { type: cornerSquareType },
        cornersDotOptions: { type: cornerDotType }
      });
      
      if (qrRef.current && qrRef.current.children.length === 0) {
        qrRef.current.innerHTML = '';
        qrCode.current.append(qrRef.current);
      }
    }
  }, [upiUrl, dotType, cornerSquareType, cornerDotType]);

  const handleShareClick = async () => {
    hapticMedium();
    setIsSharing(true);
    try {
      await onShare();
      hapticSuccess();
    } finally {
      setIsSharing(false);
    }
  };

  const handleDownloadClick = async () => {
    hapticMedium();
    setIsDownloading(true);
    try {
      await onDownload();
      hapticSuccess();
    } finally {
      setIsDownloading(false);
    }
  };

  const handleGenerateClick = async () => {
    hapticMedium();
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 100));
    try {
      await onGenerateReceipt();
    } catch (error) {
      console.error("Error in onGenerateReceipt:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const buildPaymentRequestUrl = () => {
    const base = 'https://abhi-link.vercel.app/';
    const rawAmount = amount.replace(/,/g, '');
    const params = new URLSearchParams();
    params.set('upi', upiId);
    if (payeeName) params.set('name', payeeName);
    if (rawAmount) params.set('amount', rawAmount);
    if (remarks) params.set('remarks', remarks);
    return { url: `${base}?${params.toString()}`, rawAmount };
  };

  const shortenUrl = async (url: string): Promise<string> => {
    try {
      const response = await fetch('/api/shorten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      if (response.ok) {
        const data = await response.json();
        return data.shortUrl || url;
      }
    } catch (error) {
      console.error('URL shortening failed, using original URL:', error);
    }
    return url;
  };

  const handleCopyLink = async () => {
    hapticMedium();
    setIsCopyingLink(true);
    try {
      const { url } = buildPaymentRequestUrl();
      const shortUrl = await shortenUrl(url);
      await navigator.clipboard.writeText(shortUrl);
      setLinkCopied(true);
      hapticSuccess();
      setTimeout(() => setLinkCopied(false), 2500);
    } catch {
      // Silently ignore clipboard errors (e.g. permission denied)
    } finally {
      setIsCopyingLink(false);
    }
  };

  const handleWhatsAppShare = async () => {
    hapticMedium();
    setIsSharingWhatsApp(true);
    try {
      const { url: link, rawAmount } = buildPaymentRequestUrl();
      const shortUrl = await shortenUrl(link);
      const text = payeeName
        ? `Pay ${payeeName}${rawAmount ? ` ₹${rawAmount}` : ''} via UPI: ${shortUrl}`
        : `Pay via UPI: ${shortUrl}`;
      const opened = window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
      if (!opened) {
        alert('Popup blocked. Please allow popups for this site to share via WhatsApp.');
      }
    } finally {
      setIsSharingWhatsApp(false);
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
          
          <div className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300 border-2 border-[#d9d3ce] mb-6" ref={qrRef} />
          
          <div className="w-full mb-2">
            <div className="flex justify-center mb-2">
              <motion.button
                onClick={() => { hapticLight(); setShowStyles(!showStyles); }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm transition-colors ${showStyles ? 'bg-[#2d2d2b] text-[#e6e1dc]' : 'bg-[#e6e1dc] text-[#2d2d2b] hover:bg-[#d9d3ce]'}`}
              >
                <Palette className="w-4 h-4" />
                Style
              </motion.button>
            </div>
            
            <AnimatePresence>
              {showStyles && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-white p-4 rounded-xl border-2 border-[#d9d3ce] shadow-sm space-y-4 mb-4">
                    <div>
                      <label className="block text-xs font-bold text-[#2d2d2b]/60 uppercase tracking-wider mb-2">Dots</label>
                      <div className="flex gap-2">
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => { hapticLight(); setDotType('square'); }} className={`p-2 rounded-lg border-2 transition-colors ${dotType === 'square' ? 'border-[#2d2d2b] bg-[#2d2d2b] text-white' : 'border-[#d9d3ce] hover:border-[#2d2d2b]/50 text-[#2d2d2b]'}`}>
                          <div className="w-6 h-6 grid grid-cols-2 gap-0.5"><div className="bg-current"/><div className="bg-current"/><div className="bg-current"/><div className="bg-current"/></div>
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => { hapticLight(); setDotType('rounded'); }} className={`p-2 rounded-lg border-2 transition-colors ${dotType === 'rounded' ? 'border-[#2d2d2b] bg-[#2d2d2b] text-white' : 'border-[#d9d3ce] hover:border-[#2d2d2b]/50 text-[#2d2d2b]'}`}>
                          <div className="w-6 h-6 grid grid-cols-2 gap-0.5"><div className="bg-current rounded-sm"/><div className="bg-current rounded-sm"/><div className="bg-current rounded-sm"/><div className="bg-current rounded-sm"/></div>
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => { hapticLight(); setDotType('dots'); }} className={`p-2 rounded-lg border-2 transition-colors ${dotType === 'dots' ? 'border-[#2d2d2b] bg-[#2d2d2b] text-white' : 'border-[#d9d3ce] hover:border-[#2d2d2b]/50 text-[#2d2d2b]'}`}>
                          <div className="w-6 h-6 grid grid-cols-2 gap-0.5"><div className="bg-current rounded-full"/><div className="bg-current rounded-full"/><div className="bg-current rounded-full"/><div className="bg-current rounded-full"/></div>
                        </motion.button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-bold text-[#2d2d2b]/60 uppercase tracking-wider mb-2">Marker border</label>
                      <div className="flex gap-2">
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => { hapticLight(); setCornerSquareType('square'); }} className={`p-2 rounded-lg border-2 transition-colors ${cornerSquareType === 'square' ? 'border-[#2d2d2b] bg-[#2d2d2b] text-white' : 'border-[#d9d3ce] hover:border-[#2d2d2b]/50 text-[#2d2d2b]'}`}>
                          <div className="w-6 h-6 border-4 border-current" />
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => { hapticLight(); setCornerSquareType('extra-rounded'); }} className={`p-2 rounded-lg border-2 transition-colors ${cornerSquareType === 'extra-rounded' ? 'border-[#2d2d2b] bg-[#2d2d2b] text-white' : 'border-[#d9d3ce] hover:border-[#2d2d2b]/50 text-[#2d2d2b]'}`}>
                          <div className="w-6 h-6 border-4 border-current rounded-lg" />
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => { hapticLight(); setCornerSquareType('dot'); }} className={`p-2 rounded-lg border-2 transition-colors ${cornerSquareType === 'dot' ? 'border-[#2d2d2b] bg-[#2d2d2b] text-white' : 'border-[#d9d3ce] hover:border-[#2d2d2b]/50 text-[#2d2d2b]'}`}>
                          <div className="w-6 h-6 border-4 border-current rounded-full" />
                        </motion.button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-bold text-[#2d2d2b]/60 uppercase tracking-wider mb-2">Marker center</label>
                      <div className="flex gap-2">
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => { hapticLight(); setCornerDotType('square'); }} className={`p-2 rounded-lg border-2 transition-colors ${cornerDotType === 'square' ? 'border-[#2d2d2b] bg-[#2d2d2b] text-white' : 'border-[#d9d3ce] hover:border-[#2d2d2b]/50 text-[#2d2d2b]'}`}>
                          <div className="w-6 h-6 flex items-center justify-center"><div className="w-3 h-3 bg-current" /></div>
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => { hapticLight(); setCornerDotType('dot'); }} className={`p-2 rounded-lg border-2 transition-colors ${cornerDotType === 'dot' ? 'border-[#2d2d2b] bg-[#2d2d2b] text-white' : 'border-[#d9d3ce] hover:border-[#2d2d2b]/50 text-[#2d2d2b]'}`}>
                          <div className="w-6 h-6 flex items-center justify-center"><div className="w-3 h-3 bg-current rounded-full" /></div>
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="text-center mb-2 w-full">
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

          <div className="flex flex-col gap-3 w-full">
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
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Loader2 className="w-5 h-5 text-[#2d2d2b]" />
                  </motion.div>
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
                  <span className="relative z-10">{t.share}</span>
                </>
              )}
            </motion.button>

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
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Loader2 className="w-5 h-5 text-[#e6e1dc]" />
                  </motion.div>
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
                    {t.download}
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
              onClick={handleGenerateClick}
              disabled={isGenerating}
              className="w-full flex items-center justify-center gap-2 bg-[#f5f5f0] text-[#2d2d2b] border-2 border-[#d9d3ce] px-6 py-4 rounded-xl font-bold uppercase tracking-wide shadow-sm hover:bg-[#e6e1dc] transition-all disabled:opacity-80 disabled:cursor-not-allowed overflow-hidden relative"
              whileHover={!isGenerating ? { scale: 1.02 } : {}}
              whileTap={!isGenerating ? { scale: 0.95 } : {}}
              initial={{ opacity: 0, y: 10 }}
              animate={{ 
                opacity: 1, 
                y: 0,
                transition: { type: "spring", stiffness: 400, damping: 17, delay: 0.2 }
              }}
            >
              {isGenerating ? (
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Loader2 className="w-5 h-5 text-[#2d2d2b]" />
                  </motion.div>
                  <span className="relative z-10 font-black tracking-widest text-sm text-[#2d2d2b]">GENERATING</span>
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
                  <ReceiptText className="w-5 h-5" />
                  {t.generateReceipt}
                </>
              )}
            </motion.button>

            <div className="flex gap-2 w-full">
              <motion.button
                onClick={handleCopyLink}
                disabled={isCopyingLink || linkCopied}
                title={t.copyLink || 'Copy payment link'}
                className="flex-1 flex items-center justify-center gap-2 bg-[#f5f5f0] text-[#2d2d2b] border-2 border-[#d9d3ce] px-4 py-3 rounded-xl font-bold text-sm uppercase tracking-wide shadow-sm hover:bg-[#e6e1dc] transition-all overflow-hidden relative disabled:opacity-80 disabled:cursor-not-allowed"
                whileHover={!isCopyingLink && !linkCopied ? { scale: 1.03 } : {}}
                whileTap={!isCopyingLink && !linkCopied ? { scale: 0.95 } : {}}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0, transition: { type: "spring", stiffness: 400, damping: 17, delay: 0.25 } }}
              >
                <AnimatePresence mode="wait">
                  {isCopyingLink ? (
                    <motion.span
                      key="shortening"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex items-center gap-2"
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Loader2 className="w-4 h-4" />
                      </motion.div>
                    </motion.span>
                  ) : linkCopied ? (
                    <motion.span
                      key="copied"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex items-center gap-2 text-[#2d2d2b]"
                    >
                      <Check className="w-4 h-4" />
                      {t.linkCopied || 'Copied!'}
                    </motion.span>
                  ) : (
                    <motion.span
                      key="copy"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex items-center gap-2"
                    >
                      <Copy className="w-4 h-4" />
                      {t.copyLink || 'Copy Link'}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>

              <motion.button
                onClick={handleWhatsAppShare}
                disabled={isSharingWhatsApp}
                title="Share on WhatsApp"
                className="flex-1 flex items-center justify-center gap-2 bg-[#2d2d2b] text-[#e6e1dc] border-2 border-[#2d2d2b] px-4 py-3 rounded-xl font-bold text-sm uppercase tracking-wide shadow-sm hover:bg-[#3d3d3b] hover:border-[#3d3d3b] transition-all overflow-hidden relative disabled:opacity-80 disabled:cursor-not-allowed"
                whileHover={!isSharingWhatsApp ? { scale: 1.03 } : {}}
                whileTap={!isSharingWhatsApp ? { scale: 0.95 } : {}}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0, transition: { type: "spring", stiffness: 400, damping: 17, delay: 0.3 } }}
              >
                <AnimatePresence mode="wait">
                  {isSharingWhatsApp ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Loader2 className="w-4 h-4" />
                      </motion.div>
                    </motion.div>
                  ) : (
                    <motion.span
                      key="whatsapp"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      {t.whatsapp || 'WhatsApp'}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center flex flex-col items-center justify-center h-full text-[#2d2d2b]/30">
          <QrCode className="w-16 h-16 mb-4" />
          <p className="text-sm font-bold uppercase tracking-wide">
            {upiId && !isValidUpi 
              ? t.invalidUpi
              : t.enterUpiId}
          </p>
        </div>
      )}
    </div>
  );
};
