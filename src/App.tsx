import React, { useState, useRef, useEffect } from 'react';
import { ExternalLink, X, Download, Share2 } from 'lucide-react';
import { motion, AnimatePresence } from "motion/react";
import { useRegisterSW } from 'virtual:pwa-register/react';
import { QRCodeSVG } from 'qrcode.react';
import { PaymentForm } from './components/PaymentForm';
import { QRCodeDisplay } from './components/QRCodeDisplay';
import { Changelog } from './components/Changelog';
import { LanguageSelector } from './components/LanguageSelector';
import { handleDownload, handleShare } from './utils/qrGenerator';
import { translations } from './locales/translations';

export default function App() {
  const [showChangelog, setShowChangelog] = useState(false);
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('abhi-link-lang') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('abhi-link-lang', lang);
  }, [lang]);

  const t = translations[lang] || translations['en'];

  // PWA Update Logic
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      if (r) {
        setInterval(() => {
          r.update();
        }, 60 * 1000); // Check for updates every minute
      }
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  // Automatically update when a new version is available
  useEffect(() => {
    if (needRefresh) {
      updateServiceWorker(true);
    }
  }, [needRefresh, updateServiceWorker]);

  // Parse URL params for Payment Request mode
  const searchParams = new URLSearchParams(window.location.search);
  const requestUpiId = searchParams.get('upi');
  const requestPayeeName = searchParams.get('name');
  const requestAmount = searchParams.get('amount');
  const requestRemarks = searchParams.get('remarks');

  // State to control visibility of the payment request banner
  const [isPaymentRequestVisible, setIsPaymentRequestVisible] = useState(!!requestUpiId);
  const [isBannerSharing, setIsBannerSharing] = useState(false);
  const [isBannerDownloading, setIsBannerDownloading] = useState(false);

  const onBannerShareClick = async () => {
    setIsBannerSharing(true);
    try {
      await handleShare(requestQrRef, requestAmount || '', requestPayeeName || '', requestRemarks || '', requestUpiId || '', true);
    } finally {
      setIsBannerSharing(false);
    }
  };

  const onBannerDownloadClick = async () => {
    setIsBannerDownloading(true);
    try {
      await handleDownload(requestQrRef, requestAmount || '', requestPayeeName || '', requestRemarks || '');
    } finally {
      setIsBannerDownloading(false);
    }
  };

  // Form state (initially empty, decoupled from URL params)
  const [upiId, setUpiId] = useState('');
  const [touchedUpiId, setTouchedUpiId] = useState(false);
  const [payeeName, setPayeeName] = useState('');
  const [amount, setAmount] = useState('');
  const [remarks, setRemarks] = useState('');
  
  const [recentPayees, setRecentPayees] = useState<{upiId: string, payeeName: string}[]>(() => {
    try {
      const saved = localStorage.getItem('recentPayees');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const qrRef = useRef<SVGSVGElement>(null);
  const requestQrRef = useRef<SVGSVGElement>(null);
  const typewriterRef = useRef<number | null>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);

  // Validate UPI ID format (e.g., name@bank)
  const upiRegex = /^[\w.-]+@[\w.-]+$/;
  const isValidUpi = upiId === '' || upiRegex.test(upiId);
  const showUpiError = touchedUpiId && !isValidUpi && upiId.length > 0;

  const saveRecentPayee = () => {
    if (isValidUpi && upiId) {
      setRecentPayees(prev => {
        const existingIndex = prev.findIndex(p => p.upiId === upiId);
        let newPayees = [...prev];
        if (existingIndex >= 0) {
          newPayees[existingIndex] = { upiId, payeeName: payeeName || newPayees[existingIndex].payeeName };
          const [item] = newPayees.splice(existingIndex, 1);
          newPayees.unshift(item);
        } else {
          newPayees.unshift({ upiId, payeeName });
        }
        newPayees = newPayees.slice(0, 4); // Keep last 4
        localStorage.setItem('recentPayees', JSON.stringify(newPayees));
        return newPayees;
      });
    }
  };

  const handleSelectRecent = (payee: {upiId: string, payeeName: string}) => {
    if (typewriterRef.current) {
      window.clearInterval(typewriterRef.current);
    }

    setUpiId('');
    setPayeeName('');
    setTouchedUpiId(false);

    let upiIndex = 0;
    let nameIndex = 0;

    typewriterRef.current = window.setInterval(() => {
      let upiDone = false;
      let nameDone = false;

      if (upiIndex < payee.upiId.length) {
        setUpiId(payee.upiId.substring(0, upiIndex + 1));
        upiIndex++;
      } else {
        upiDone = true;
      }

      if (nameIndex < payee.payeeName.length) {
        setPayeeName(payee.payeeName.substring(0, nameIndex + 1));
        nameIndex++;
      } else {
        nameDone = true;
      }

      if (upiDone && nameDone) {
        if (typewriterRef.current) window.clearInterval(typewriterRef.current);
        // Focus amount field after animation completes
        setTimeout(() => {
          amountInputRef.current?.focus();
        }, 50);
      }
    }, 30);
  };

  const handleUpiIdChange = (val: string) => {
    if (typewriterRef.current) window.clearInterval(typewriterRef.current);
    setUpiId(val);
  };

  const handlePayeeNameChange = (val: string) => {
    if (typewriterRef.current) window.clearInterval(typewriterRef.current);
    setPayeeName(val);
  };

  const handleRemoveRecent = (upiIdToRemove: string) => {
    setRecentPayees(prev => {
      const newPayees = prev.filter(p => p.upiId !== upiIdToRemove);
      localStorage.setItem('recentPayees', JSON.stringify(newPayees));
      return newPayees;
    });
  };

  // Construct UPI URL
  // Format: upi://pay?pa=UPI_ID&pn=PAYEE_NAME&am=AMOUNT&cu=INR&tn=REMARKS&tr=TRANSACTION_REF
  const generateUpiUrl = () => {
    if (!upiId) return '';
    
    const cleanUpiId = upiId.trim();
    const cleanName = payeeName.trim();
    const cleanAmount = amount.replace(/,/g, '').trim();
    const cleanRemarks = remarks.trim();
    const trId = "ABHI" + Date.now();

    // Note: We replace %40 with @ in the 'pa' parameter to comply with NPCI security framework
    // which may flag %40 as a security risk or invalid format in some apps.
    let link = `upi://pay?pa=${encodeURIComponent(cleanUpiId).replace(/%40/g, '@')}&pn=${encodeURIComponent(cleanName)}&cu=INR&tr=${trId}`;
    
    if (cleanAmount && !isNaN(Number(cleanAmount))) {
      link += `&am=${cleanAmount}`;
    }
    
    if (cleanRemarks) {
      link += `&tn=${encodeURIComponent(cleanRemarks)}`;
    }

    return link;
  };

  const upiUrl = generateUpiUrl();

  // Construct Request UPI URL (for the top banner)
  const generateRequestUpiUrl = () => {
    if (!requestUpiId) return '';
    
    // Clean the data (Crucial for GPay/PhonePe)
    const cleanUpiId = decodeURIComponent(requestUpiId).trim();
    const cleanName = requestPayeeName ? requestPayeeName.replace(/\+/g, ' ').trim() : '';
    const cleanAmount = requestAmount ? requestAmount.trim() : '';
    const cleanRemarks = requestRemarks ? requestRemarks.trim() : '';
    const trId = "ABHI" + Date.now();

    // Build the flawless UPI Intent Link
    let link = `upi://pay?pa=${encodeURIComponent(cleanUpiId).replace(/%40/g, '@')}&pn=${encodeURIComponent(cleanName)}&cu=INR&tr=${trId}`;
    
    if (cleanAmount) {
      link += `&am=${cleanAmount}`;
    }
    
    if (cleanRemarks) {
      link += `&tn=${encodeURIComponent(cleanRemarks)}`;
    }

    return link;
  };

  const requestUpiUrl = generateRequestUpiUrl();

  // Automatic redirect removed as per user request to prevent security blocks
  // useEffect(() => { ... }, []);

  return (
    <div className="min-h-screen bg-[#e6e1dc] py-12 px-4 sm:px-6 lg:px-8 font-sans relative select-none">
      {/* Dummy datalist to trick browsers into disabling autocomplete */}
      <datalist id="autocompleteOff"></datalist>
      
      {/* Top Right Actions */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-2 sm:gap-4 z-40">
        <LanguageSelector currentLang={lang} onLanguageChange={setLang} />
        <motion.a
          href="https://ledger69.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#2d2d2b] bg-white/50 hover:bg-white px-4 py-2.5 rounded-full border-2 border-[#d9d3ce] hover:border-[#2d2d2b] transition-all shadow-sm uppercase tracking-wide"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="hidden sm:inline">{t.tryLedger}</span>
          <span className="sm:hidden">Ledger69</span>
          <ExternalLink className="w-4 h-4" />
        </motion.a>
      </div>

      {/* Version Badge */}
      <motion.div 
        className="absolute top-4 left-4 sm:top-6 sm:left-6 select-none cursor-pointer z-40"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowChangelog(true)}
      >
        <div className="flex items-center gap-2 text-[10px] sm:text-xs font-black text-[#2d2d2b]/60 hover:text-[#2d2d2b] bg-white/30 hover:bg-white/50 px-3 py-1.5 rounded-full border border-[#d9d3ce]/50 uppercase tracking-widest backdrop-blur-sm transition-colors">
          <span>{t.version}</span>
        </div>
      </motion.div>

      <div className="max-w-3xl mx-auto mt-8 sm:mt-0">
        <div className="text-center mb-10">
          <h1 className="text-6xl md:text-8xl font-black text-[#2d2d2b] tracking-tighter font-display uppercase mb-4">ABHI LINK</h1>
          <p className="mt-3 text-[#2d2d2b]/70 max-w-xl mx-auto font-medium">
            {t.subtitle}
          </p>
        </div>

        <AnimatePresence mode="popLayout">
          {requestUpiId && isPaymentRequestVisible && (
            <motion.div 
              key="payment-request-banner"
              layout
              initial={{ opacity: 0, y: 20, height: 0, scale: 0.95, filter: "blur(0px)" }}
              animate={{ opacity: 1, y: 0, height: 'auto', scale: 1, filter: "blur(0px)" }}
              exit={{ 
                opacity: 0,
                scale: 1.1,
                filter: "blur(12px) grayscale(100%)",
                x: 60,
                y: -20,
                height: 0,
                marginBottom: 0,
                transition: { 
                  duration: 0.6,
                  ease: "easeInOut"
                }
              }}
              className="mb-8 bg-white p-8 rounded-3xl shadow-sm border border-[#d9d3ce] text-center relative overflow-hidden"
            >
              <button 
                onClick={() => setIsPaymentRequestVisible(false)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-[#faf9f8] transition-colors text-[#2d2d2b]/40 hover:text-[#2d2d2b]"
                aria-label="Close payment request"
              >
                <X className="w-5 h-5" />
              </button>

              <h2 className="text-2xl font-black text-[#2d2d2b] mb-2 uppercase tracking-tight">{t.paymentRequest}</h2>
              
              {(requestPayeeName || requestAmount) && (
                <div className="mb-6 bg-[#f5f5f0] rounded-2xl p-6 border border-[#d9d3ce]">
                  {requestPayeeName && (
                    <div className="mb-2">
                      <p className="text-xs font-bold text-[#2d2d2b]/50 uppercase tracking-wider">{t.payingTo}</p>
                      <p className="text-xl font-bold text-[#2d2d2b]">{requestPayeeName}</p>
                    </div>
                  )}
                  
                  {requestAmount && (
                    <div className={requestPayeeName ? "mt-4 pt-4 border-t border-[#d9d3ce]/50" : ""}>
                      <p className="text-xs font-bold text-[#2d2d2b]/50 uppercase tracking-wider">{t.amountLabel}</p>
                      <p className="text-4xl font-black text-[#2d2d2b] tracking-tight">
                        ₹{requestAmount}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* QR Code Section in Banner */}
              <div className="flex flex-col items-center justify-center mb-8">
                <div className="bg-white p-4 rounded-2xl border border-[#d9d3ce] shadow-sm mb-4">
                  <QRCodeSVG
                    value={requestUpiUrl}
                    size={180}
                    level="H"
                    includeMargin={false}
                    ref={requestQrRef}
                    className="w-full h-full"
                    imageSettings={{
                      src: "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='20' fill='%232d2d2b'/%3E%3Ctext x='50' y='50' font-family='Arial, sans-serif' font-weight='900' font-size='60' fill='%23e6e1dc' text-anchor='middle' dominant-baseline='central'%3EA%3C/text%3E%3C/svg%3E",
                      x: undefined,
                      y: undefined,
                      height: 40,
                      width: 40,
                      excavate: true,
                    }}
                  />
                </div>
                
                <div className="flex gap-3 w-full max-w-xs justify-center">
                  <motion.button
                    onClick={onBannerShareClick}
                    disabled={isBannerSharing}
                    className="relative overflow-hidden flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#f5f5f0] hover:bg-[#e6e1dc] text-[#2d2d2b] rounded-xl font-bold text-sm border border-[#d9d3ce] disabled:opacity-80 disabled:cursor-not-allowed"
                    whileHover={!isBannerSharing ? { scale: 1.05 } : {}}
                    whileTap={!isBannerSharing ? { scale: 0.95 } : {}}
                  >
                    {isBannerSharing ? (
                      <div className="flex items-center gap-2">
                        <div className="relative flex items-center justify-center w-4 h-4">
                          <motion.span 
                            className="absolute w-full h-full border-2 border-[#2d2d2b]/20 border-t-[#2d2d2b] rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          />
                          <motion.span 
                            className="absolute w-1 h-1 bg-[#2d2d2b] rounded-full"
                            animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                          />
                        </div>
                        <span className="relative z-10 font-black tracking-widest text-xs text-[#2d2d2b]">WAIT</span>
                      </div>
                    ) : (
                      <>
                        <Share2 className="w-4 h-4" />
                        {t.share}
                      </>
                    )}
                  </motion.button>
                  <motion.button
                    onClick={onBannerDownloadClick}
                    disabled={isBannerDownloading}
                    className="relative overflow-hidden flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#f5f5f0] hover:bg-[#e6e1dc] text-[#2d2d2b] rounded-xl font-bold text-sm border border-[#d9d3ce] disabled:opacity-80 disabled:cursor-not-allowed"
                    whileHover={!isBannerDownloading ? { scale: 1.05 } : {}}
                    whileTap={!isBannerDownloading ? { scale: 0.95 } : {}}
                  >
                    {isBannerDownloading ? (
                      <div className="flex items-center gap-2">
                        <div className="relative flex items-center justify-center w-4 h-4">
                          <motion.span 
                            className="absolute w-full h-full border-2 border-[#2d2d2b]/20 border-t-[#2d2d2b] rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          />
                          <motion.span 
                            className="absolute w-1 h-1 bg-[#2d2d2b] rounded-full"
                            animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                          />
                        </div>
                        <span className="relative z-10 font-black tracking-widest text-xs text-[#2d2d2b]">SAVING</span>
                      </div>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        {t.save}
                      </>
                    )}
                  </motion.button>
                </div>
              </div>

              <p className="text-[#2d2d2b]/70 mb-6 font-medium text-sm">
                {t.onlyNaviCred}
                <br/>
                <span className="text-xs opacity-80 mt-2 block">
                  {t.usingGpay}
                </span>
              </p>
              <motion.a 
                href={requestUpiUrl}
                className="relative inline-flex items-center justify-center w-full sm:w-auto bg-[#2d2d2b] text-white font-bold text-lg px-8 py-4 rounded-xl overflow-hidden shadow-lg group"
                whileHover={{ scale: 1.02, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <span className="relative z-10">{t.openInUpi}</span>
                <motion.div
                  className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                  initial={{ x: '-100%' }}
                  animate={{ x: '200%' }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 1.5, 
                    ease: "easeInOut", 
                    repeatDelay: 3 
                  }}
                />
              </motion.a>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div layout className="bg-white rounded-3xl shadow-sm border border-[#d9d3ce] overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">
            
            {/* Form Section */}
            <motion.div layout className="h-full">
              <PaymentForm 
                upiId={upiId}
                setUpiId={handleUpiIdChange}
                payeeName={payeeName}
                setPayeeName={handlePayeeNameChange}
                amount={amount}
                setAmount={setAmount}
                remarks={remarks}
                setRemarks={setRemarks}
                showUpiError={showUpiError}
                setTouchedUpiId={setTouchedUpiId}
                recentPayees={recentPayees}
                onSelectRecent={handleSelectRecent}
                onRemoveRecent={handleRemoveRecent}
                onSaveRecent={saveRecentPayee}
                amountInputRef={amountInputRef}
                t={t}
              />
            </motion.div>

            {/* QR Code Section */}
            <motion.div layout className="h-full">
              <QRCodeDisplay 
                upiId={upiId}
                isValidUpi={isValidUpi}
                upiUrl={upiUrl}
                amount={amount}
                payeeName={payeeName}
                remarks={remarks}
                qrRef={qrRef}
                onDownload={() => handleDownload(qrRef, amount, payeeName, remarks)}
                onShare={() => handleShare(qrRef, amount, payeeName, remarks, upiId)}
                t={t}
              />
            </motion.div>
            
          </div>
        </motion.div>
        
        <div className="mt-8 text-center text-sm font-bold text-[#2d2d2b]/50 uppercase tracking-wide">
          <p>{t.scanInstruction}</p>
          <p className="mt-2 text-sm normal-case text-[#2d2d2b]/70" style={{ fontFamily: '"Comic Sans MS", "Comic Sans", cursive', fontWeight: 'bold' }}>
            {t.developer}
          </p>
        </div>
      </div>

      <AnimatePresence>
        {showChangelog && <Changelog onClose={() => setShowChangelog(false)} t={t} />}
      </AnimatePresence>
    </div>
  );
}
