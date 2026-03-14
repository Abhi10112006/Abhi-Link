import React, { useState, useRef, useEffect } from 'react';
import { ExternalLink, X, Download, Share2, ReceiptText, Loader2, Wallet, History } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { motion, AnimatePresence } from "motion/react";
import { useRegisterSW } from 'virtual:pwa-register/react';
import QRCodeStyling, { DotType, CornerSquareType, CornerDotType } from 'qr-code-styling';
import { PaymentForm } from './components/PaymentForm';
import { QRCodeDisplay } from './components/QRCodeDisplay';
import { Changelog } from './components/Changelog';
import { LanguageSelector } from './components/LanguageSelector';
import { handleDownload, handleShare } from './utils/qrGenerator';
import { translations } from './locales/translations';
import { ReceiptConfirmationModal, SenderNameModal, PaymentCompletedModal } from './components/ReceiptModals';
import { Receipt } from './components/Receipt';
import { InvoiceModal } from './components/InvoiceModal';
import { DigitalCardModal } from './components/DigitalCardModal';
import { PremiumBackground } from './components/PremiumBackground';
import { TransactionHistory, Transaction } from './components/TransactionHistory';

export default function App() {
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);
  const [showDigitalCard, setShowDigitalCard] = useState(false);
  const [showTransactionHistory, setShowTransactionHistory] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem('abhi-link-transactions');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
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


  // Receipt Generation State
  const [showReceiptConfirmation, setShowReceiptConfirmation] = useState(false);
  const [showPaymentCompletedModal, setShowPaymentCompletedModal] = useState(false);
  const [showSenderNameInput, setShowSenderNameInput] = useState(false);
  const [isGeneratingReceipt, setIsGeneratingReceipt] = useState(false);

  // QR Code Styling State
  const [dotType, setDotType] = useState<DotType>('square');
  const [cornerSquareType, setCornerSquareType] = useState<CornerSquareType>('square');
  const [cornerDotType, setCornerDotType] = useState<CornerDotType>('square');

  const [pendingReceiptData, setPendingReceiptData] = useState<{
    payee: string;
    upiId: string;
    amount: string;
    remarks: string;
    isReceiver: boolean;
  } | null>(null);
  
  const [receiptToPrint, setReceiptToPrint] = useState<{
    payeeName: string;
    payeeUpiId: string;
    amount: string;
    remarks: string;
    senderName: string;
    date: string;
    isReceiver: boolean;
  } | null>(null);
  const receiptRefEn = useRef<HTMLDivElement>(null);
  const receiptRefLang = useRef<HTMLDivElement>(null);


  const handleGenerateReceiptClick = (
    dataPayee: string,
    dataUpiId: string,
    dataAmount: string,
    dataRemarks: string,
    isReceiver: boolean = false
  ) => {
    setPendingReceiptData({
      payee: dataPayee,
      upiId: dataUpiId,
      amount: dataAmount,
      remarks: dataRemarks,
      isReceiver,
    });
    
    if (isReceiver) {
      setShowReceiptConfirmation(true);
    } else {
      setShowPaymentCompletedModal(true);
    }
  };

  const handleReceiptConfirmed = () => {
    setShowReceiptConfirmation(false);
    // Small delay to allow modal to close smoothly
    setTimeout(() => setShowSenderNameInput(true), 200);
  };

  const handlePaymentCompletedConfirmed = () => {
    setShowPaymentCompletedModal(false);
    // Small delay to allow modal to close smoothly
    setTimeout(() => setShowSenderNameInput(true), 200);
  };

  const handleSenderNameSubmit = async (senderName: string) => {
    setIsGeneratingReceipt(true);
    if (!pendingReceiptData) return;

    const { payee, upiId, amount, remarks, isReceiver } = pendingReceiptData;
    // Date in DD/MM/YYYY format
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const date = `${day}/${month}/${year}`;

    const data = {
      payeeName: payee,
      payeeUpiId: upiId,
      amount,
      remarks,
      senderName,
      date,
      isReceiver
    };

    // Record transaction in history
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const newTransaction: Transaction = {
      id: `tx-${Date.now()}`,
      payeeName: payee,
      payeeUpiId: upiId,
      amount: amount.replace(/,/g, ''),
      remarks,
      date,
      time: `${hours}:${minutes}`,
      isReceiver,
    };
    setTransactions(prev => {
      const updated = [newTransaction, ...prev].slice(0, 50);
      localStorage.setItem('abhi-link-transactions', JSON.stringify(updated));
      return updated;
    });

    setReceiptToPrint(data);

    // Wait for render
    setTimeout(async () => {
      try {
        const doc = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });

        // Generate English Page
        if (receiptRefEn.current) {
          const canvasEn = await html2canvas(receiptRefEn.current, {
            scale: 2, // Better quality
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
          });
          
          const imgDataEn = canvasEn.toDataURL('image/png');
          const imgWidth = 210;
          const imgHeight = (canvasEn.height * imgWidth) / canvasEn.width;
          
          doc.addImage(imgDataEn, 'PNG', 0, 0, imgWidth, imgHeight);
          
          // Add clickable link over "ABHI LINK" text
          // x: 100mm, y: 275mm, width: 100mm, height: 10mm
          doc.link(100, 275, 100, 10, { url: 'https://abhi-link.vercel.app/' });
        }

        // Generate Second Page if language is not English
        if (lang !== 'en' && receiptRefLang.current) {
          const canvasLang = await html2canvas(receiptRefLang.current, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
          });
          
          const imgDataLang = canvasLang.toDataURL('image/png');
          const imgWidth = 210;
          const imgHeight = (canvasLang.height * imgWidth) / canvasLang.width;
          
          doc.addPage();
          doc.addImage(imgDataLang, 'PNG', 0, 0, imgWidth, imgHeight);
          
          // Add clickable link over "ABHI LINK" text
          // x: 100mm, y: 275mm, width: 100mm, height: 10mm
          doc.link(100, 275, 100, 10, { url: 'https://abhi-link.vercel.app/' });
        }

        try {
          const blob = doc.output('blob');
          const file = new File([blob], "receipt.pdf", { type: "application/pdf" });

          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: 'Payment Receipt',
              text: `Receipt for payment to ${payee}`,
            });
          } else {
            doc.save('receipt.pdf');
          }
        } catch (error) {
          // If share is canceled or fails, we still want to save/download if it wasn't an abort
          if ((error as Error).name !== 'AbortError' && (error as Error).message !== 'Share canceled') {
            console.error("Error sharing receipt:", error);
            doc.save('receipt.pdf');
          }
          // Fall through to cleanup
        }
      } catch (err) {
        console.error("Error generating receipt:", err);
      }
      
      setReceiptToPrint(null);
      setPendingReceiptData(null);
      setIsGeneratingReceipt(false);
      setShowSenderNameInput(false);
    }, 500); // Small delay to ensure rendering
  };

  // ... existing render logic

  const handleClearTransactions = () => {
    setTransactions([]);
    localStorage.removeItem('abhi-link-transactions');
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions(prev => {
      const updated = prev.filter(tx => tx.id !== id);
      localStorage.setItem('abhi-link-transactions', JSON.stringify(updated));
      return updated;
    });
  };

  // Form state (initially empty, decoupled from URL params)
  const [upiId, setUpiId] = useState(() => localStorage.getItem('my_card_upi') || '');
  const [touchedUpiId, setTouchedUpiId] = useState(false);
  const [payeeName, setPayeeName] = useState(() => localStorage.getItem('my_card_name') || '');
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

  const qrRef = useRef<any>(null);
  const requestQrRef = useRef<any>(null);
  const typewriterRef = useRef<number | null>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);

  // Validate UPI ID format (e.g., name@bank)
  const upiRegex = /^[\w.-]+@[\w.-]+$/;
  const isValidUpi = upiId === '' || upiRegex.test(upiId);
  const showUpiError = touchedUpiId && !isValidUpi && upiId.length > 0;

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

  const requestQrCode = useRef<QRCodeStyling | null>(null);

  useEffect(() => {
    if (!requestUpiUrl) return;

    const timer = setTimeout(() => {
      const qrOptions = {
        width: 180,
        height: 180,
        data: requestUpiUrl,
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
        image: "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='20' fill='%232d2d2b'/%3E%3Ctext x='50' y='50' font-family='Arial, sans-serif' font-weight='900' font-size='60' fill='%23e6e1dc' text-anchor='middle' dominant-baseline='central'%3EA%3C/text%3E%3C/svg%3E"
      };

      if (!requestQrCode.current) {
        requestQrCode.current = new QRCodeStyling(qrOptions);
      } else {
        requestQrCode.current.update(qrOptions);
      }

      if (requestQrRef.current && requestQrRef.current.children.length === 0) {
        requestQrRef.current.innerHTML = '';
        requestQrCode.current.append(requestQrRef.current);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [requestUpiUrl, dotType, cornerSquareType, cornerDotType]);

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

  // Automatic redirect removed as per user request to prevent security blocks
  // useEffect(() => { ... }, []);

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 font-sans relative select-none">
      <PremiumBackground />
      {/* Dummy datalist to trick browsers into disabling autocomplete */}
      <datalist id="autocompleteOff"></datalist>

      {/* Modals */}
      <ReceiptConfirmationModal
        isOpen={showReceiptConfirmation}
        onClose={() => setShowReceiptConfirmation(false)}
        onConfirm={handleReceiptConfirmed}
        isReceiver={pendingReceiptData?.isReceiver || false}
        t={t}
      />
      <PaymentCompletedModal
        isOpen={showPaymentCompletedModal}
        onClose={() => setShowPaymentCompletedModal(false)}
        onConfirm={handlePaymentCompletedConfirmed}
        t={t}
      />
      <SenderNameModal
        isOpen={showSenderNameInput}
        onClose={() => setShowSenderNameInput(false)}
        onSubmit={handleSenderNameSubmit}
        isLoading={isGeneratingReceipt}
        t={t}
      />
      
      {/* Top Right Actions */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-2 sm:gap-4 z-40">
        <motion.button
          onClick={() => setShowDigitalCard(true)}
          className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#2d2d2b] bg-white/50 hover:bg-white px-4 py-2.5 rounded-full border-2 border-[#d9d3ce] hover:border-[#2d2d2b] transition-all shadow-sm uppercase tracking-wide"
          whileHover={{ 
            scale: 1.02, 
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
            transition: { duration: 0.2 }
          }}
          whileTap={{ 
            scale: 0.9,
            transition: { type: "spring", stiffness: 400, damping: 10 }
          }}
          title="My Digital Card"
        >
          <svg className="w-4 h-4 text-[#2d2d2b]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M16.0724 4.02447C15.1063 3.04182 13.7429 2.5 12.152 2.5C10.5611 2.5 9.19773 3.04182 8.23167 4.02447C7.26636 5.00636 6.73644 6.38891 6.73644 8C6.73644 10.169 7.68081 11.567 8.8496 12.4062C9.07675 12.5692 9.3115 12.7107 9.54832 12.8327C8.24215 13.1916 7.18158 13.8173 6.31809 14.5934C4.95272 15.8205 4.10647 17.3993 3.53633 18.813C3.43305 19.0691 3.55693 19.3604 3.81304 19.4637C4.06914 19.567 4.36047 19.4431 4.46375 19.187C5.00642 17.8414 5.78146 16.4202 6.98653 15.3371C8.1795 14.265 9.82009 13.5 12.152 13.5C14.332 13.5 15.9058 14.1685 17.074 15.1279C18.252 16.0953 19.0453 17.3816 19.6137 18.6532C19.9929 19.5016 19.3274 20.5 18.2827 20.5H6.74488C6.46874 20.5 6.24488 20.7239 6.24488 21C6.24488 21.2761 6.46874 21.5 6.74488 21.5H18.2827C19.9348 21.5 21.2479 19.8588 20.5267 18.2452C19.9232 16.8952 19.0504 15.4569 17.7087 14.3551C16.9123 13.7011 15.9603 13.1737 14.8203 12.8507C15.43 12.5136 15.9312 12.0662 16.33 11.5591C17.1929 10.462 17.5676 9.10016 17.5676 8C17.5676 6.38891 17.0377 5.00636 16.0724 4.02447ZM15.3593 4.72553C16.1144 5.49364 16.5676 6.61109 16.5676 8C16.5676 8.89984 16.2541 10.038 15.544 10.9409C14.8475 11.8265 13.7607 12.5 12.152 12.5C11.5014 12.5 10.3789 12.2731 9.43284 11.5938C8.51251 10.933 7.73644 9.83102 7.73644 8C7.73644 6.61109 8.18963 5.49364 8.94477 4.72553C9.69916 3.95818 10.7935 3.5 12.152 3.5C13.5105 3.5 14.6049 3.95818 15.3593 4.72553Z" fill="currentColor" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
          <span className="hidden sm:inline">{t.myCard}</span>
        </motion.button>
        <LanguageSelector currentLang={lang} onLanguageChange={setLang} />
        <motion.a
          href="https://ledger69.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#2d2d2b] bg-white/50 hover:bg-white px-4 py-2.5 rounded-full border-2 border-[#d9d3ce] hover:border-[#2d2d2b] transition-all shadow-sm uppercase tracking-wide"
          whileHover={{ 
            scale: 1.02, 
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
            transition: { duration: 0.2 }
          }}
          whileTap={{ 
            scale: 0.9,
            transition: { type: "spring", stiffness: 400, damping: 10 }
          }}
        >
          <span className="hidden sm:inline">{t.tryLedger}</span>
          <span className="sm:hidden">Ledger69</span>
          <ExternalLink className="w-4 h-4 text-[#2d2d2b]" />
        </motion.a>
      </div>

      {/* Version Badge */}
      <motion.div 
        className="absolute top-4 left-4 sm:top-6 sm:left-6 select-none cursor-pointer z-40"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowChangelog(true)}
      >
        <div className="flex items-center gap-2 text-[10px] sm:text-xs font-black text-gray-900/60 hover:text-gray-900 bg-white/30 hover:bg-white/50 px-3 py-1.5 rounded-full border border-gray-200/50 uppercase tracking-widest backdrop-blur-sm transition-colors">
          <span>{t.version}</span>
        </div>
      </motion.div>

      <div className="max-w-3xl mx-auto mt-8 sm:mt-0 relative z-10">
        <div className="text-center mb-10">
          <h1 className="text-6xl md:text-8xl font-black text-gray-900 tracking-tighter font-display uppercase mb-4">ABHI LINK</h1>
          <p className="mt-3 text-gray-900/70 max-w-xl mx-auto font-medium mb-6">
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
                  className="mb-8 bg-white p-8 rounded-3xl shadow-sm border border-gray-200 text-center relative overflow-hidden"
                >
                  <motion.button 
                    onClick={() => setIsPaymentRequestVisible(false)}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-50 transition-colors text-gray-900/40 hover:text-gray-900"
                    aria-label="Close payment request"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <X className="w-5 h-5" />
                  </motion.button>

                  <h2 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight">{t.paymentRequest}</h2>
                  
                  {(requestPayeeName || requestAmount) && (
                    <div className="mb-6 bg-gray-50 rounded-2xl p-6 border border-gray-200">
                      {requestPayeeName && (
                        <div className="mb-2">
                          <p className="text-xs font-bold text-gray-900/50 uppercase tracking-wider">{t.payingTo}</p>
                          <p className="text-xl font-bold text-gray-900">{requestPayeeName}</p>
                        </div>
                      )}
                      
                      {requestAmount && (
                        <div className={requestPayeeName ? "mt-4 pt-4 border-t border-gray-200/50" : ""}>
                          <p className="text-xs font-bold text-gray-900/50 uppercase tracking-wider">{t.amountLabel}</p>
                          <p className="text-4xl font-black text-gray-900 tracking-tight">
                            ₹{requestAmount}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* QR Code Section in Banner */}
                  <div className="flex flex-col items-center justify-center mb-8">
                    <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm mb-4">
                      <div ref={requestQrRef} className="w-[180px] h-[180px]" />
                    </div>
                    
                    <div className="flex flex-col gap-3 w-full max-w-xs justify-center">
                      <div className="flex gap-3 w-full">
                        <motion.button
                          onClick={onBannerShareClick}
                          disabled={isBannerSharing}
                          className="relative overflow-hidden flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 hover:bg-gray-100 text-gray-900 rounded-xl font-bold text-sm border border-gray-200 disabled:opacity-80 disabled:cursor-not-allowed"
                          whileHover={!isBannerSharing ? { scale: 1.05 } : {}}
                          whileTap={!isBannerSharing ? { scale: 0.95 } : {}}
                        >
                          {isBannerSharing ? (
                            <div className="flex items-center gap-2">
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              >
                                <Loader2 className="w-4 h-4 text-gray-900" />
                              </motion.div>
                              <span className="relative z-10 font-black tracking-widest text-xs text-gray-900">WAIT</span>
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
                          className="relative overflow-hidden flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-50 hover:bg-gray-100 text-gray-900 rounded-xl font-bold text-sm border border-gray-200 disabled:opacity-80 disabled:cursor-not-allowed"
                          whileHover={!isBannerDownloading ? { scale: 1.05 } : {}}
                          whileTap={!isBannerDownloading ? { scale: 0.95 } : {}}
                        >
                          {isBannerDownloading ? (
                            <div className="flex items-center gap-2">
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                              >
                                <Loader2 className="w-4 h-4 text-gray-900" />
                              </motion.div>
                              <span className="relative z-10 font-black tracking-widest text-xs text-gray-900">SAVING</span>
                            </div>
                          ) : (
                            <>
                              <Download className="w-4 h-4" />
                              {t.save}
                            </>
                          )}
                        </motion.button>
                      </div>
                      <motion.button
                        onClick={() => handleGenerateReceiptClick(requestPayeeName || '', requestUpiId || '', requestAmount || '', requestRemarks || '', false)}
                        className="w-full flex items-center justify-center gap-2 text-xs sm:text-sm font-bold text-gray-900 bg-white hover:bg-gray-50 px-4 py-3 rounded-xl border border-gray-200 hover:border-gray-900 transition-all shadow-sm uppercase tracking-wide"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {t.generateReceipt}
                      </motion.button>
                    </div>
                  </div>

                  <p className="text-gray-900/70 mb-6 font-medium text-sm">
                    {t.onlyNaviCred}
                    <br/>
                    <span className="text-xs opacity-80 mt-2 block">
                      {t.usingGpay}
                    </span>
                  </p>
                  <motion.a 
                    href={requestUpiUrl}
                    className="relative inline-flex items-center justify-center w-full sm:w-auto bg-gray-900 text-white font-bold text-lg px-8 py-4 rounded-xl overflow-hidden shadow-lg group"
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

            <div className="max-w-3xl mx-auto px-4 mb-4 flex justify-between gap-2">
              <motion.button
                onClick={() => setShowTransactionHistory(true)}
                className="relative flex items-center gap-2 text-xs sm:text-sm font-bold text-[#2d2d2b] bg-white/50 hover:bg-white px-4 py-2.5 rounded-full border-2 border-[#d9d3ce] hover:border-[#2d2d2b] transition-all shadow-sm uppercase tracking-wide"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title={t.transactionHistory || 'Transaction History'}
              >
                <History className="w-4 h-4 text-[#2d2d2b]" />
                <span className="hidden sm:inline">{t.history || 'History'}</span>
              </motion.button>
              <motion.button
                onClick={() => setShowInvoiceModal(true)}
                className="flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-900 bg-white/50 hover:bg-white px-4 py-2.5 rounded-full border border-gray-200 hover:border-gray-900 transition-all shadow-sm uppercase tracking-wide"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ReceiptText className="w-4 h-4" /> Create Invoice
              </motion.button>
            </div>

            <motion.div layout className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
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
                    dotType={dotType}
                    setDotType={setDotType}
                    cornerSquareType={cornerSquareType}
                    setCornerSquareType={setCornerSquareType}
                    cornerDotType={cornerDotType}
                    setCornerDotType={setCornerDotType}
                    onDownload={() => handleDownload(qrRef, amount, payeeName, remarks)}
                    onShare={() => handleShare(qrRef, amount, payeeName, remarks, upiId)}
                    onGenerateReceipt={async () => handleGenerateReceiptClick(payeeName, upiId, amount, remarks, true)}
                    t={t}
                  />
                </motion.div>
                
              </div>
            </motion.div>
            
            <div className="mt-8 text-center text-sm font-bold text-gray-900/50 uppercase tracking-wide">
              <p>{t.scanInstruction}</p>
              <p className="mt-2 text-sm normal-case text-gray-900/70" style={{ fontFamily: '"Comic Sans MS", "Comic Sans", cursive', fontWeight: 'bold' }}>
                {t.developer}
              </p>
            </div>
      </div>

      <AnimatePresence>
        {showChangelog && <Changelog key="changelog" onClose={() => setShowChangelog(false)} t={t} />}
        {showDigitalCard && <DigitalCardModal key="digital-card" isOpen={showDigitalCard} onClose={() => setShowDigitalCard(false)} t={t} />}
        {showInvoiceModal && (
          <InvoiceModal 
            key="invoice-modal"
            onClose={() => setShowInvoiceModal(false)} 
            t={t} 
            lang={lang}
            onLanguageChange={setLang}
            dotType={dotType}
            cornerSquareType={cornerSquareType}
            cornerDotType={cornerDotType}
          />
        )}
        {showTransactionHistory && (
          <TransactionHistory
            key="transaction-history"
            isOpen={showTransactionHistory}
            onClose={() => setShowTransactionHistory(false)}
            transactions={transactions}
            onClearAll={handleClearTransactions}
            onDeleteTransaction={handleDeleteTransaction}
            t={t}
          />
        )}
      </AnimatePresence>

      {/* Hidden Receipt Component for PDF Generation */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <Receipt ref={receiptRefEn} data={receiptToPrint} lang="en" />
        {lang !== 'en' && (
          <Receipt ref={receiptRefLang} data={receiptToPrint} lang={lang} />
        )}
      </div>
    </div>
  );
}
