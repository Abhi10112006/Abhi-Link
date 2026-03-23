import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Trash2, Download, Share2, Briefcase, GraduationCap, ShoppingBag, User, IndianRupee, MessageSquare, Info, Eraser, Clipboard, Check, ChevronDown, Loader2, Palette, ChevronLeft } from 'lucide-react';
import QRCodeStyling, { DotType, CornerSquareType, CornerDotType } from 'qr-code-styling';
import { BusinessType, InvoiceData, downloadInvoicePdf, shareInvoicePdf } from '../utils/invoicePdfGenerator';
import { LanguageSelector } from './LanguageSelector';
import { PremiumBackground } from './PremiumBackground';
import { hapticLight, hapticMedium, hapticHeavy, hapticWarning, hapticSuccess } from '../utils/haptics';

interface InvoiceItem {
  id: string;
  name: string;
  quantity: number | string;
  price: number | string;
  unit?: string;
}

const COMMON_UPI_HANDLES = [
  '@ybl', '@paytm', '@okicici', '@okhdfcbank', '@oksbi',
  '@okaxis', '@apl', '@ibl', '@axl', '@icici', '@sbi',
  '@hdfcbank', '@kotak', '@axisbank', '@yesbank', '@idfcbank',
  '@waaxis', '@wahdfcbank', '@waicici', '@wasbi',
  '@upi', '@freecharge', '@mobikwik', '@slice', '@cred',
  '@fampay', '@amazonpay', '@airtel', '@airtelpaymentsbank',
  '@bajaj', '@payzapp', '@wealth', '@jupiter', '@fi', '@niyo',
  '@dbs', '@rbl', '@federal', '@indus', '@hsbc', '@citi',
  '@barodapay', '@pnb', '@cnrb', '@boi', '@unionbank',
  '@indianbank', '@uco', '@centralbank', '@mahabank', '@idbi',
  '@kbl', '@southindianbank', '@equitas', '@au'
];

interface InvoiceModalProps {
  onClose: () => void;
  t: Record<string, string>;
  lang: string;
  onLanguageChange: (lang: string) => void;
  dotType: DotType;
  cornerSquareType: CornerSquareType;
  cornerDotType: CornerDotType;
}

// Silky iOS Bezier slide variants
const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? '100%' : '-100%',
    opacity: 0,
  }),
};

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ onClose, t, lang, onLanguageChange, dotType, cornerSquareType, cornerDotType }) => {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Step navigation
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(0);

  const nextStep = () => {
    setDirection(1);
    setStep((prev) => Math.min(prev + 1, 3));
  };

  const prevStep = () => {
    setDirection(-1);
    setStep((prev) => Math.max(prev - 1, 1));
  };

  // Form state
  const [businessType, setBusinessType] = useState<BusinessType>(() => {
    return (localStorage.getItem('my_card_business_type') as BusinessType) || 'shop';
  });
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${Date.now().toString().slice(-6)}`);
  const [businessName, setBusinessName] = useState(() => {
    return localStorage.getItem('my_card_name') || '';
  });
  const [classesName, setClassesName] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([{ id: '1', name: '', quantity: '', price: '', unit: 'Unit' }]);
  const [upiId, setUpiId] = useState(() => {
    return localStorage.getItem('my_card_upi') || '';
  });
  const [payeeName, setPayeeName] = useState(() => {
    return localStorage.getItem('my_card_name') || '';
  });
  const [qrCenterText, setQrCenterText] = useState('A');

  const qrCode = useRef<QRCodeStyling | null>(null);
  const visibleQrRef = useRef<HTMLDivElement | null>(null);

  const [remarks, setRemarks] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [month, setMonth] = useState('');
  const [projectTitle, setProjectTitle] = useState('');

  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [detectedClipboardUpi, setDetectedClipboardUpi] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [multipleUpiOptions, setMultipleUpiOptions] = useState<string[]>([]);
  const [showUpiError, setShowUpiError] = useState(false);
  const [touchedUpiId, setTouchedUpiId] = useState(false);
  const [recentPayees, setRecentPayees] = useState<{upiId: string, payeeName: string}[]>([]);
  const [customRemarks, setCustomRemarks] = useState<string[]>([]);

  const PRE_WRITTEN_REMARKS = [
    "Thank you for your business!",
    "Payment is due within 15 days."
  ];

  const allRemarksClips = Array.from(new Set([...customRemarks, ...PRE_WRITTEN_REMARKS]));

  const autocompleteRef = useRef<HTMLDivElement>(null);
  const handleTypewriterRef = useRef<number | null>(null);

  const totalAmount = items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.price)), 0);

  // Autofill prevention IDs
  const [randomBusinessNameId] = useState(() => `edit_${Math.random().toString(36).slice(2, 9)}`);
  const [randomClassesNameId] = useState(() => `edit_${Math.random().toString(36).slice(2, 9)}`);
  const [randomInvoiceNumberId] = useState(() => `edit_${Math.random().toString(36).slice(2, 9)}`);
  const [randomCustomerNameId] = useState(() => `edit_${Math.random().toString(36).slice(2, 9)}`);
  const [randomMonthId] = useState(() => `edit_${Math.random().toString(36).slice(2, 9)}`);
  const [randomProjectTitleId] = useState(() => `edit_${Math.random().toString(36).slice(2, 9)}`);
  const [randomDueDateId] = useState(() => `edit_${Math.random().toString(36).slice(2, 9)}`);
  const [randomUpiId] = useState(() => `edit_${Math.random().toString(36).slice(2, 9)}`);
  const [randomPayeeNameId] = useState(() => `edit_${Math.random().toString(36).slice(2, 9)}`);
  const [randomQrTextId] = useState(() => `edit_${Math.random().toString(36).slice(2, 9)}`);
  const [randomRemarksId] = useState(() => `edit_${Math.random().toString(36).slice(2, 9)}`);
  const [randomItemNamePrefix] = useState(() => `edit_${Math.random().toString(36).slice(2, 9)}`);
  const [randomItemQtyPrefix] = useState(() => `edit_${Math.random().toString(36).slice(2, 9)}`);
  const [randomItemPricePrefix] = useState(() => `edit_${Math.random().toString(36).slice(2, 9)}`);
  const [randomItemUnitPrefix] = useState(() => `edit_${Math.random().toString(36).slice(2, 9)}`);

  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  // Effects
  useEffect(() => {
    const saved = localStorage.getItem('recent_payees');
    if (saved) {
      try { setRecentPayees(JSON.parse(saved)); } catch (e) { console.error('Failed to parse recent payees', e); }
    }
    const savedRemarks = localStorage.getItem('custom_remarks');
    if (savedRemarks) {
      try { setCustomRemarks(JSON.parse(savedRemarks)); } catch (e) { console.error('Failed to parse custom remarks', e); }
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target as Node)) {
        setShowAutocomplete(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  useEffect(() => {
    const checkClipboard = async () => {
      try {
        if (navigator.permissions && navigator.permissions.query) {
          // @ts-ignore
          const permission = await navigator.permissions.query({ name: 'clipboard-read' });
          if (permission.state === 'granted') {
            const text = await navigator.clipboard.readText();
            const ids = extractUpiIds(text || '');
            setDetectedClipboardUpi(ids.length > 0 ? ids[0] : null);
          }
        }
      } catch (err) { /* Silently fail */ }
    };
    window.addEventListener('focus', checkClipboard);
    checkClipboard();
    return () => window.removeEventListener('focus', checkClipboard);
  }, []);

  // UPI URL — declared before QR effects so it is available in their deps
  function generateUpiUrl() {
    if (!upiId) return '';
    const cleanUpiId = upiId.trim();
    const cleanName = payeeName.trim();
    const trId = invoiceNumber;
    let link = `upi://pay?pa=${encodeURIComponent(cleanUpiId).replace(/%40/g, '@')}&pn=${encodeURIComponent(cleanName)}&cu=INR&tr=${trId}`;
    if (totalAmount > 0) link += `&am=${totalAmount.toFixed(2)}`;
    return link;
  }

  const upiUrl = generateUpiUrl();

  // QR generation
  useEffect(() => {
    if (!upiUrl) return;
    const timer = setTimeout(() => {
      const qrOptions = {
        width: 180, height: 180,
        data: upiUrl,
        margin: 0,
        type: "svg" as const,
        qrOptions: { typeNumber: 0 as const, mode: "Byte" as const, errorCorrectionLevel: "H" as const },
        imageOptions: { hideBackgroundDots: true, imageSize: 0.4, margin: 0 },
        dotsOptions: { type: dotType, color: "#2d2d2b" },
        cornersSquareOptions: { type: cornerSquareType, color: "#2d2d2b" },
        cornersDotOptions: { type: cornerDotType, color: "#2d2d2b" },
        image: `data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='20' fill='%232d2d2b'/%3E%3Ctext x='50' y='50' font-family='Arial, sans-serif' font-weight='900' font-size='60' fill='%23e6e1dc' text-anchor='middle' dominant-baseline='central'%3E${encodeURIComponent(qrCenterText || 'A')}%3C/text%3E%3C/svg%3E`
      };
      if (!qrCode.current) {
        qrCode.current = new QRCodeStyling(qrOptions);
      } else {
        qrCode.current.update(qrOptions);
      }
      if (visibleQrRef.current) {
        visibleQrRef.current.innerHTML = '';
        qrCode.current.append(visibleQrRef.current);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [upiUrl, dotType, cornerSquareType, cornerDotType, qrCenterText]);

  // Re-attach QR code when Step 3 mounts
  useEffect(() => {
    if (step !== 3 || !qrCode.current) return;
    const timer = setTimeout(() => {
      if (visibleQrRef.current) {
        visibleQrRef.current.innerHTML = '';
        qrCode.current!.append(visibleQrRef.current);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [step]);

  // Helpers
  const extractUpiIds = (text: string): string[] => {
    const regex = /[a-zA-Z0-9.\-_]+@[a-zA-Z]+/g;
    const matches = text.match(regex);
    if (!matches) return [];
    return Array.from(new Set(matches.filter(id => !id.includes(' '))));
  };

  const getFilteredHandles = () => {
    if (!upiId.includes('@')) return COMMON_UPI_HANDLES.slice(0, 5);
    const searchPart = upiId.split('@')[1].toLowerCase();
    if (!searchPart) return COMMON_UPI_HANDLES.slice(0, 5);
    return COMMON_UPI_HANDLES.filter(h => h.toLowerCase().startsWith('@' + searchPart)).slice(0, 5);
  };

  const getLabels = () => {
    switch (businessType) {
      case 'tuition':
        return { businessName: t.teacherName, customerName: t.studentName, itemName: t.subject, itemQty: t.months, itemPrice: t.feePerMo, productsTitle: t.subjectsFees };
      case 'freelancer':
        return { businessName: t.freelancerName, customerName: t.clientName, itemName: t.serviceTask, itemQty: t.hours, itemPrice: t.ratePerHr, productsTitle: t.servicesTasks };
      case 'custom':
        return { businessName: t.businessEntityName, customerName: t.billedTo, itemName: t.description, itemQty: t.qty, itemPrice: t.price, productsTitle: t.items };
      default:
        return { businessName: t.shopName, customerName: t.customerName, itemName: t.itemName, itemQty: t.qty, itemPrice: t.price, productsTitle: t.products };
    }
  };

  const labels = getLabels();

  // Handlers
  const handleSaveCustomRemark = () => {
    if (remarks && !customRemarks.includes(remarks) && !PRE_WRITTEN_REMARKS.includes(remarks)) {
      const updated = [remarks, ...customRemarks].slice(0, 5);
      setCustomRemarks(updated);
      localStorage.setItem('custom_remarks', JSON.stringify(updated));
    }
  };

  const handleRemoveCustomRemark = (remarkToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = customRemarks.filter(r => r !== remarkToRemove);
    setCustomRemarks(updated);
    localStorage.setItem('custom_remarks', JSON.stringify(updated));
  };

  const handleUpiChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (handleTypewriterRef.current) window.clearInterval(handleTypewriterRef.current);
    const val = e.target.value;
    setUpiId(val);
    setTouchedUpiId(false);
    setShowUpiError(false);
    if (val.includes('@')) {
      const parts = val.split('@');
      if (parts.length === 2 && parts[1].length >= 0) setShowAutocomplete(true);
      else setShowAutocomplete(false);
    } else {
      setShowAutocomplete(false);
    }
  };

  const selectHandle = (handle: string) => {
    if (handleTypewriterRef.current) window.clearInterval(handleTypewriterRef.current);
    setUpiId(upiId.split('@')[0] + handle);
    setShowAutocomplete(false);
    setTouchedUpiId(true);
    setShowUpiError(false);
  };

  const handleClear = () => {
    if (handleTypewriterRef.current) window.clearInterval(handleTypewriterRef.current);
    let iterations = Math.max(businessName.length, customerName.length, upiId.length, payeeName.length, remarks.length, classesName.length);
    setItems([{ id: Date.now().toString(), name: '', quantity: '', price: '', unit: 'Unit' }]);
    if (iterations === 0) return;
    handleTypewriterRef.current = window.setInterval(() => {
      setBusinessName(prev => prev.length > 0 ? prev.slice(0, -1) : prev);
      setCustomerName(prev => prev.length > 0 ? prev.slice(0, -1) : prev);
      setUpiId(prev => prev.length > 0 ? prev.slice(0, -1) : prev);
      setPayeeName(prev => prev.length > 0 ? prev.slice(0, -1) : prev);
      setRemarks(prev => prev.length > 0 ? prev.slice(0, -1) : prev);
      setClassesName(prev => prev.length > 0 ? prev.slice(0, -1) : prev);
      iterations--;
      if (iterations <= 0 && handleTypewriterRef.current) window.clearInterval(handleTypewriterRef.current);
    }, 10);
  };

  const handleSaveRecent = () => {
    if (upiId && upiId.includes('@') && !showUpiError) {
      const newPayee = { upiId, payeeName };
      const existing = recentPayees.filter(p => p.upiId !== upiId);
      const updated = [newPayee, ...existing].slice(0, 4);
      setRecentPayees(updated);
      localStorage.setItem('recent_payees', JSON.stringify(updated));
    }
  };

  const handleRemoveRecent = (id: string) => {
    const updated = recentPayees.filter(p => p.upiId !== id);
    setRecentPayees(updated);
    localStorage.setItem('recent_payees', JSON.stringify(updated));
  };

  const onSelectRecent = (payee: {upiId: string, payeeName: string}) => {
    if (handleTypewriterRef.current) window.clearInterval(handleTypewriterRef.current);
    setUpiId(payee.upiId);
    setPayeeName(payee.payeeName);
    setTouchedUpiId(true);
    setShowUpiError(false);
  };

  const handleBusinessTypeChange = (type: BusinessType) => {
    setBusinessType(type);
    if (type === 'tuition') setQrCenterText('T');
    else if (type === 'freelancer') setQrCenterText('F');
    else setQrCenterText('A');
  };

  const handleAddItem = () => {
    setItems([...items, { id: Date.now().toString(), name: '', quantity: '', price: '', unit: 'Unit' }]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length > 1) setItems(items.filter(item => item.id !== id));
  };

  const handleItemChange = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setItems(items.map(item => {
      if (item.id === id) {
        if ((field === 'quantity' || field === 'price') && value === '') return { ...item, [field]: '' };
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const getInvoiceData = async (): Promise<InvoiceData> => {
    return {
      invoiceNumber, businessName, classesName, customerName,
      items: items.map(item => ({ ...item, quantity: Number(item.quantity) || 0, price: Number(item.price) || 0 })),
      totalAmount, upiId, payeeName, qrCenterText, qrDataUrl: null,
      qrStyle: { dotType, cornerSquareType, cornerDotType },
      remarks, businessType, dueDate, month, projectTitle
    };
  };

  const handleDownload = async () => {
    hapticMedium();
    setIsDownloading(true);
    try {
      const minLoadTime = new Promise(resolve => setTimeout(resolve, 1500));
      const [data] = await Promise.all([getInvoiceData(), minLoadTime]);
      await downloadInvoicePdf(data);
      hapticSuccess();
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    hapticMedium();
    setIsSharing(true);
    try {
      const minLoadTime = new Promise(resolve => setTimeout(resolve, 1500));
      const [data] = await Promise.all([getInvoiceData(), minLoadTime]);
      await shareInvoicePdf(data);
      hapticSuccess();
    } catch (error) {
      console.error('Error sharing PDF:', error);
    } finally {
      setIsSharing(false);
    }
  };

  // Motion variants
  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, transition: { duration: 0.3 } }
  };

  const cardAnim = {
    hidden: { opacity: 0, y: 60, scale: 0.97 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 260, damping: 28 } }
  };

  // Shared style shorthands
  const inputCls = "w-full px-4 py-3 rounded-xl bg-white border border-gray-200 focus:border-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-900/10 font-bold text-gray-900 transition-all shadow-sm";
  const inputSmCls = "w-full px-3 py-2.5 rounded-xl bg-white border border-gray-200 focus:border-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-900/10 font-bold text-gray-900 text-sm transition-all shadow-sm";
  const labelCls = "block text-[10px] font-black text-gray-500 mb-1.5 uppercase tracking-widest";

  // Re-usable Next button (steps 1 & 2)
  const NextButton = ({ label = 'Next \u2192' }: { label?: string }) => (
    <motion.button
      type="button"
      onClick={() => { hapticLight(); nextStep(); }}
      className="w-full bg-[#2d2d2b] text-[#e6e1dc] py-4 rounded-2xl font-bold uppercase tracking-widest text-sm shadow-lg mt-2"
      whileHover={{ scale: 1.02, boxShadow: '0 12px 28px -6px rgba(0,0,0,0.35)' }}
      whileTap={{ scale: 0.97 }}
    >
      {label}
    </motion.button>
  );

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center overflow-hidden"
      initial="hidden"
      animate="show"
      exit="exit"
      variants={container}
    >
      <PremiumBackground />

      {/* Modal Card */}
      <motion.div
        variants={cardAnim}
        className="relative w-full sm:max-w-[440px] bg-[#f5f5f0] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden"
        style={{ height: '92dvh', maxHeight: '92dvh' }}
      >
        {/* iOS Drag Handle — makes the 8dvh top gap look intentional as a native bottom sheet */}
        <div className="flex justify-center pt-2.5 pb-1 shrink-0 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-[#2d2d2b]/20" />
        </div>

        {/* Honeypot inputs */}
        <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px' }}>
          <input type="text" name="fakeusernameremembered" tabIndex={-1} />
          <input type="password" name="fakepasswordremembered" tabIndex={-1} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-[#d9d3ce]/60 shrink-0 bg-[#f5f5f0]">
          {/* Back / Close */}
          <motion.button
            onClick={() => { hapticMedium(); step === 1 ? onClose() : prevStep(); }}
            className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 bg-white/60 hover:bg-white text-gray-700 shadow-sm transition-all"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label={step === 1 ? 'Close' : 'Back'}
          >
            <AnimatePresence mode="wait" initial={false}>
              {step === 1 ? (
                <motion.span key="close"
                  initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.7 }}
                  transition={{ duration: 0.15 }}
                >
                  <X className="w-4 h-4" />
                </motion.span>
              ) : (
                <motion.span key="back"
                  initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.7 }}
                  transition={{ duration: 0.15 }}
                >
                  <ChevronLeft className="w-5 h-5" />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Step dots */}
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <motion.div
                key={s}
                className="h-2 rounded-full"
                animate={{
                  width: s === step ? 24 : 8,
                  backgroundColor: s <= step ? '#2d2d2b' : '#d9d3ce',
                  opacity: s < step ? 0.35 : 1,
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              />
            ))}
          </div>

          {/* Language selector */}
          <LanguageSelector currentLang={lang} onLanguageChange={onLanguageChange} alignMenu="right" />
        </div>

        {/* Slide area */}
        <div className="relative flex-1 overflow-hidden">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'tween', ease: [0.25, 1, 0.5, 1], duration: 0.38 }}
              className="absolute inset-0 overflow-y-auto"
            >

              {/* STEP 1 — The Details */}
              {step === 1 && (
                <div className="p-5 pb-10 flex flex-col gap-5">

                  <div>
                    <p className={labelCls} style={{ marginBottom: 2 }}>Step 1 of 3</p>
                    <h2 className="text-2xl font-bold text-[#2d2d2b] tracking-tight">{t.invoiceGenerator}</h2>
                  </div>

                  {/* Business Type Selector */}
                  <div>
                    <label className={labelCls}>{t.businessType || 'Business Type'}</label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { type: 'shop' as BusinessType, icon: <ShoppingBag className="w-4 h-4" />, label: t.shop || 'Shop' },
                        { type: 'tuition' as BusinessType, icon: <GraduationCap className="w-4 h-4" />, label: t.tuition || 'Tuition' },
                        { type: 'freelancer' as BusinessType, icon: <Briefcase className="w-4 h-4" />, label: t.freelancer || 'Freelancer' },
                        { type: 'custom' as BusinessType, icon: <User className="w-4 h-4" />, label: t.custom || 'Custom' },
                      ].map(({ type, icon, label }) => (
                        <motion.button
                          key={type}
                          type="button"
                          onClick={() => { hapticLight(); handleBusinessTypeChange(type); }}
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.94 }}
                          className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all text-[11px] font-bold ${
                            businessType === type
                              ? 'bg-[#2d2d2b] border-[#2d2d2b] text-white shadow-md'
                              : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'
                          }`}
                        >
                          {icon}
                          <span className="truncate w-full text-center leading-none">{label}</span>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Business Name */}
                  <div>
                    <label className={labelCls}>{labels.businessName}</label>
                    <motion.div animate={{ scale: focusedField === 'businessName' ? 1.02 : 1 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
                      <input
                        type="search" id={randomBusinessNameId} name={randomBusinessNameId}
                        value={businessName} onChange={(e) => setBusinessName(e.target.value)}
                        onFocus={() => setFocusedField('businessName')} onBlur={() => setFocusedField(null)}
                        placeholder={businessType === 'tuition' ? 'Prof. Sharma' : 'My Awesome Business'}
                        autoComplete={`nope-${randomBusinessNameId}`} aria-autocomplete="none"
                        spellCheck={false} autoCorrect="off" autoCapitalize="words"
                        data-lpignore="true" data-form-type="other"
                        className={inputCls}
                      />
                    </motion.div>
                  </div>

                  {/* Tuition: Classes Name */}
                  <AnimatePresence>
                    {businessType === 'tuition' && (
                      <motion.div key="tuition-classes"
                        initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
                        animate={{ opacity: 1, height: 'auto', overflow: 'visible' }}
                        exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                        transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                      >
                        <label className={labelCls}>{t.classesName}</label>
                        <motion.div animate={{ scale: focusedField === 'classesName' ? 1.02 : 1 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
                          <input
                            type="search" id={randomClassesNameId} name={randomClassesNameId}
                            value={classesName} onChange={(e) => setClassesName(e.target.value)}
                            onFocus={() => setFocusedField('classesName')} onBlur={() => setFocusedField(null)}
                            placeholder="Sharma Physics Classes"
                            autoComplete={`nope-${randomClassesNameId}`} aria-autocomplete="none"
                            spellCheck={false} autoCorrect="off"
                            data-lpignore="true" data-form-type="other"
                            className={inputCls}
                          />
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Invoice # + Customer Name */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>{businessType === 'tuition' ? t.receiptNumber : t.invoiceNumber}</label>
                      <motion.div animate={{ scale: focusedField === 'invoiceNumber' ? 1.02 : 1 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
                        <input
                          type="search" id={randomInvoiceNumberId} name={randomInvoiceNumberId}
                          value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)}
                          onFocus={() => setFocusedField('invoiceNumber')} onBlur={() => setFocusedField(null)}
                          autoComplete={`nope-${randomInvoiceNumberId}`} aria-autocomplete="none"
                          spellCheck={false} autoCorrect="off"
                          data-lpignore="true" data-form-type="other"
                          className={inputSmCls}
                        />
                      </motion.div>
                    </div>
                    <div>
                      <label className={labelCls}>{labels.customerName}</label>
                      <motion.div animate={{ scale: focusedField === 'customerName' ? 1.02 : 1 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
                        <input
                          type="search" id={randomCustomerNameId} name={randomCustomerNameId}
                          value={customerName} onChange={(e) => setCustomerName(e.target.value)}
                          onFocus={() => setFocusedField('customerName')} onBlur={() => setFocusedField(null)}
                          placeholder="John Doe"
                          autoComplete={`nope-${randomCustomerNameId}`} aria-autocomplete="none"
                          spellCheck={false} autoCorrect="off"
                          data-lpignore="true" data-form-type="other"
                          className={inputSmCls}
                        />
                      </motion.div>
                    </div>
                  </div>

                  {/* Freelancer: Project Title + Due Date */}
                  <AnimatePresence>
                    {businessType === 'freelancer' && (
                      <motion.div key="freelancer-fields"
                        className="grid grid-cols-2 gap-3"
                        initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
                        animate={{ opacity: 1, height: 'auto', overflow: 'visible' }}
                        exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                        transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                      >
                        <div>
                          <label className={labelCls}>{t.projectName}</label>
                          <motion.div animate={{ scale: focusedField === 'projectTitle' ? 1.02 : 1 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
                            <input
                              type="search" id={randomProjectTitleId} name={randomProjectTitleId}
                              value={projectTitle} onChange={(e) => setProjectTitle(e.target.value)}
                              onFocus={() => setFocusedField('projectTitle')} onBlur={() => setFocusedField(null)}
                              placeholder="Website Redesign"
                              autoComplete={`nope-${randomProjectTitleId}`} aria-autocomplete="none"
                              spellCheck={false} autoCorrect="off"
                              data-lpignore="true" data-form-type="other"
                              className={inputSmCls}
                            />
                          </motion.div>
                        </div>
                        <div>
                          <label className={labelCls}>{t.dueDate}</label>
                          <motion.div animate={{ scale: focusedField === 'dueDate' ? 1.02 : 1 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
                            <input
                              type="search" id={randomDueDateId} name={randomDueDateId}
                              value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                              onFocus={() => setFocusedField('dueDate')} onBlur={() => setFocusedField(null)}
                              autoComplete={`nope-${randomDueDateId}`} aria-autocomplete="none"
                              data-lpignore="true" data-form-type="other"
                              className={inputSmCls}
                            />
                          </motion.div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Tuition: Month */}
                  <AnimatePresence>
                    {businessType === 'tuition' && (
                      <motion.div key="tuition-month"
                        initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
                        animate={{ opacity: 1, height: 'auto', overflow: 'visible' }}
                        exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                        transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                      >
                        <label className={labelCls}>{t.month || 'Month'}</label>
                        <motion.div animate={{ scale: focusedField === 'month' ? 1.02 : 1 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
                          <input
                            type="search" id={randomMonthId} name={randomMonthId}
                            value={month} onChange={(e) => setMonth(e.target.value)}
                            onFocus={() => setFocusedField('month')} onBlur={() => setFocusedField(null)}
                            placeholder="e.g. January 2025"
                            autoComplete={`nope-${randomMonthId}`} aria-autocomplete="none"
                            data-lpignore="true" data-form-type="other"
                            className={inputCls}
                          />
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <NextButton label={t.next || 'Next \u2192'} />
                </div>
              )}

              {/* STEP 2 — The Items */}
              {step === 2 && (
                <div className="p-5 pb-10 flex flex-col gap-5">

                  <div>
                    <p className={labelCls} style={{ marginBottom: 2 }}>Step 2 of 3</p>
                    <h2 className="text-2xl font-bold text-[#2d2d2b] tracking-tight">{t.invoiceItems || 'The Items'}</h2>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-xs font-black text-gray-500 uppercase tracking-widest">{labels.productsTitle}</label>
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.04, y: -1 }}
                        whileTap={{ scale: 0.97, y: 1 }}
                        onClick={() => { hapticMedium(); handleAddItem(); }}
                        className="text-xs font-bold text-gray-900 bg-white px-3 py-2 rounded-xl border border-gray-200 hover:border-gray-900 transition-colors flex items-center gap-1.5 shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" /> {t.addItem}
                      </motion.button>
                    </div>

                    <div className="flex flex-col gap-3">
                      <AnimatePresence>
                        {items.map((item) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, height: 0, scale: 0.95, overflow: 'hidden' }}
                            animate={{ opacity: 1, height: 'auto', scale: 1, overflow: 'visible' }}
                            exit={{ opacity: 0, height: 0, scale: 0.95, overflow: 'hidden' }}
                            transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                          >
                            <div className="grid grid-cols-12 gap-2 items-start bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                              <div className="col-span-12 sm:col-span-5">
                                <motion.div animate={{ scale: focusedField === `${randomItemNamePrefix}_${item.id}` ? 1.02 : 1 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
                                  <input
                                    type="search" id={`${randomItemNamePrefix}_${item.id}`} name={`${randomItemNamePrefix}_${item.id}`}
                                    value={item.name} onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                                    onFocus={() => setFocusedField(`${randomItemNamePrefix}_${item.id}`)} onBlur={() => setFocusedField(null)}
                                    placeholder={labels.itemName}
                                    autoComplete={`nope-${randomItemNamePrefix}_${item.id}`} aria-autocomplete="none"
                                    spellCheck={false} autoCorrect="off" autoCapitalize="off"
                                    data-lpignore="true" data-form-type="other"
                                    className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 focus:border-gray-900 focus:outline-none font-medium text-gray-900 text-sm transition-all"
                                  />
                                </motion.div>
                              </div>
                              <div className="col-span-4 sm:col-span-2">
                                <motion.div animate={{ scale: focusedField === `${randomItemQtyPrefix}_${item.id}` ? 1.02 : 1 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
                                  <input
                                    type="search" inputMode="decimal" pattern="[0-9]*"
                                    id={`${randomItemQtyPrefix}_${item.id}`} name={`${randomItemQtyPrefix}_${item.id}`}
                                    value={item.quantity} onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                                    onFocus={() => setFocusedField(`${randomItemQtyPrefix}_${item.id}`)} onBlur={() => setFocusedField(null)}
                                    placeholder={labels.itemQty}
                                    autoComplete={`nope-${randomItemQtyPrefix}_${item.id}`} aria-autocomplete="none"
                                    spellCheck={false} autoCorrect="off" autoCapitalize="off"
                                    data-lpignore="true" data-form-type="other"
                                    className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 focus:border-gray-900 focus:outline-none font-medium text-gray-900 text-sm transition-all"
                                  />
                                </motion.div>
                              </div>
                              {businessType === 'shop' && (
                                <div className="col-span-4 sm:col-span-2">
                                  <select
                                    id={`${randomItemUnitPrefix}_${item.id}`} name={`${randomItemUnitPrefix}_${item.id}`}
                                    value={item.unit || 'Unit'} onChange={(e) => handleItemChange(item.id, 'unit', e.target.value)}
                                    autoComplete={`nope-${randomItemUnitPrefix}_${item.id}`}
                                    data-lpignore="true" data-form-type="other"
                                    className="w-full px-2 py-2 rounded-lg bg-gray-50 border border-gray-200 focus:border-gray-900 focus:outline-none font-medium text-gray-900 text-sm appearance-none transition-all"
                                  >
                                    <option value="Unit">Unit</option>
                                    <option value="Kg">Kg</option>
                                    <option value="g">g</option>
                                    <option value="L">L</option>
                                    <option value="ml">ml</option>
                                    <option value="m">m</option>
                                    <option value="pcs">pcs</option>
                                    <option value="box">box</option>
                                  </select>
                                </div>
                              )}
                              <div className={businessType === 'shop' ? 'col-span-3 sm:col-span-2' : 'col-span-7 sm:col-span-4'}>
                                <motion.div animate={{ scale: focusedField === `${randomItemPricePrefix}_${item.id}` ? 1.02 : 1 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
                                  <input
                                    type="search" inputMode="decimal" pattern="[0-9]*"
                                    id={`${randomItemPricePrefix}_${item.id}`} name={`${randomItemPricePrefix}_${item.id}`}
                                    value={item.price} onChange={(e) => handleItemChange(item.id, 'price', e.target.value)}
                                    onFocus={() => setFocusedField(`${randomItemPricePrefix}_${item.id}`)} onBlur={() => setFocusedField(null)}
                                    placeholder={labels.itemPrice}
                                    autoComplete={`nope-${randomItemPricePrefix}_${item.id}`} aria-autocomplete="none"
                                    spellCheck={false} autoCorrect="off" autoCapitalize="off"
                                    data-lpignore="true" data-form-type="other"
                                    className="w-full px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 focus:border-gray-900 focus:outline-none font-medium text-gray-900 text-sm transition-all"
                                  />
                                </motion.div>
                              </div>
                              <div className="col-span-1 flex justify-center pt-2">
                                <motion.button
                                  type="button"
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => { hapticWarning(); handleRemoveItem(item.id); }}
                                  className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50"
                                  disabled={items.length === 1}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </motion.button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Running total */}
                  <div className="bg-[#2d2d2b]/[0.06] rounded-2xl px-5 py-4 flex justify-between items-center">
                    <span className="text-xs font-black text-[#2d2d2b]/50 uppercase tracking-widest">{t.totalAmount}</span>
                    <span className="text-2xl font-semibold text-[#2d2d2b] tracking-tight">
                      &#8377;{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  <NextButton label={t.next || 'Next \u2192'} />
                </div>
              )}

              {/* STEP 3 — The Payment */}
              {step === 3 && (
                <div className="p-5 pb-10 flex flex-col gap-5">

                  <div>
                    <p className={labelCls} style={{ marginBottom: 2 }}>Step 3 of 3</p>
                    <h2 className="text-2xl font-bold text-[#2d2d2b] tracking-tight">{t.invoicePayment || 'The Payment'}</h2>
                  </div>

                  {/* Recent Payees */}
                  <AnimatePresence>
                    {recentPayees.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
                        animate={{ opacity: 1, height: 'auto', overflow: 'visible' }}
                        exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                      >
                        <p className={labelCls}>{recentPayees.length === 1 ? 'Recent User' : 'Recent Users'}</p>
                        <div className="grid grid-cols-2 gap-2">
                          {recentPayees.map((payee) => (
                            <motion.div
                              key={payee.upiId}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.95 }}
                              className="flex-1 min-w-0 inline-flex items-center justify-between bg-white border border-gray-200 rounded-full pl-3 pr-1 py-1.5 hover:border-gray-900 transition-colors cursor-pointer group shadow-sm"
                              onClick={() => { hapticLight(); onSelectRecent(payee); }}
                            >
                              <div className="flex flex-col mr-2 overflow-hidden">
                                {payee.payeeName && <span className="text-xs font-bold text-gray-900 leading-tight truncate">{payee.payeeName}</span>}
                                <span className={`text-[10px] font-medium leading-tight truncate ${payee.payeeName ? 'text-gray-600' : 'text-gray-900'}`}>{payee.upiId}</span>
                              </div>
                              <motion.button
                                className="flex-shrink-0 text-[#2d2d2b]/30 hover:text-[#2d2d2b] transition-colors p-1.5 rounded-full hover:bg-[#f5f5f0]"
                                onClick={(e) => { e.stopPropagation(); hapticWarning(); handleRemoveRecent(payee.upiId); }}
                                aria-label="Remove recent payee"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                              </motion.button>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* UPI ID */}
                  <div>
                    <label className={labelCls}>UPI ID</label>
                    <div className={showAutocomplete ? 'relative z-50' : 'relative'} ref={autocompleteRef}>
                      <motion.div
                        className="relative"
                        animate={{ scale: focusedField === 'upiId' ? 1.02 : 1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                      >
                        <input
                          type="search" id={randomUpiId} name={randomUpiId}
                          value={upiId} onChange={handleUpiChange}
                          onFocus={() => setFocusedField('upiId')}
                          onBlur={() => { setFocusedField(null); setTouchedUpiId(true); handleSaveRecent(); }}
                          placeholder="name@upi"
                          autoComplete="new-password" aria-autocomplete="none"
                          spellCheck={false} autoCorrect="off" autoCapitalize="off"
                          data-lpignore="true" data-form-type="other"
                          className={`${inputCls} ${showUpiError ? 'border-red-500 focus:border-red-500 focus:ring-red-500/10' : ''}`}
                        />
                        {/* Clipboard paste */}
                        <AnimatePresence>
                          {!upiId && (
                            <motion.button
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              type="button"
                              onClick={async () => {
                                hapticMedium();
                                try {
                                  const text = await navigator.clipboard.readText();
                                  const ids = extractUpiIds(text || '');
                                  if (ids.length === 1) { setUpiId(ids[0]); setDetectedClipboardUpi(null); }
                                  else if (ids.length > 1) { setMultipleUpiOptions(ids); setShowToast(true); }
                                  else { setShowToast(true); }
                                } catch (err) { /* Fallback */ }
                              }}
                              className={`absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer transition-all z-20 ${
                                detectedClipboardUpi
                                  ? 'text-gray-900 drop-shadow-[0_0_8px_rgba(45,45,43,0.4)] animate-pulse scale-110'
                                  : 'text-gray-400 hover:text-gray-900'
                              }`}
                            >
                              <Clipboard className={`h-5 w-5 ${detectedClipboardUpi ? 'stroke-[2.5px]' : ''}`} />
                            </motion.button>
                          )}
                        </AnimatePresence>
                        {/* Autocomplete dropdown */}
                        <AnimatePresence>
                          {showAutocomplete && getFilteredHandles().length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, y: -5, scale: 0.98 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -5, scale: 0.98 }}
                              className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden"
                            >
                              <ul className="max-h-48 overflow-y-auto py-2 px-1">
                                {getFilteredHandles().map((handle, index) => (
                                  <motion.li key={handle} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.03 }}>
                                    <button
                                      type="button"
                                      className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-900 hover:bg-gray-50 transition-all rounded-lg flex items-center gap-1 group"
                                      onMouseDown={(e) => { e.preventDefault(); selectHandle(handle); }}
                                    >
                                      <span className="opacity-40 group-hover:opacity-60 transition-opacity truncate max-w-[50%]">{upiId.split('@')[0]}</span>
                                      <span className="font-bold text-base">{handle}</span>
                                    </button>
                                  </motion.li>
                                ))}
                              </ul>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    </div>
                  </div>

                  {/* Receiver Name */}
                  <div>
                    <label className={labelCls}>Receiver's Name</label>
                    <motion.div animate={{ scale: focusedField === 'payeeName' ? 1.02 : 1 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
                      <input
                        type="search" id={randomPayeeNameId} name={randomPayeeNameId}
                        value={payeeName} onChange={(e) => setPayeeName(e.target.value)}
                        onFocus={() => setFocusedField('payeeName')}
                        onBlur={() => { setFocusedField(null); handleSaveRecent(); }}
                        placeholder="Receiver's Name"
                        autoComplete={`nope-${randomPayeeNameId}`} aria-autocomplete="none"
                        spellCheck={false} autoCorrect="off"
                        data-lpignore="true" data-form-type="other"
                        className={inputCls}
                      />
                    </motion.div>
                  </div>

                  {/* QR Center Text */}
                  <div>
                    <label className={labelCls}>{t.qrCenterText} (Max 2 chars)</label>
                    <input
                      type="search" id={randomQrTextId} name={randomQrTextId}
                      maxLength={2} value={qrCenterText} onChange={(e) => setQrCenterText(e.target.value)}
                      placeholder="A"
                      autoComplete={`nope-${randomQrTextId}`} aria-autocomplete="none"
                      spellCheck={false} autoCorrect="off" autoCapitalize="off"
                      data-lpignore="true" data-form-type="other"
                      className="w-24 px-4 py-3 rounded-xl bg-white border border-gray-200 focus:border-gray-900 focus:outline-none font-bold text-gray-900 text-center transition-colors"
                    />
                  </div>

                  {/* Remarks */}
                  <div>
                    <label className={labelCls}>Remarks</label>
                    <motion.div animate={{ scale: focusedField === 'remarks' ? 1.02 : 1 }} transition={{ type: 'spring', stiffness: 400, damping: 25 }}>
                      <textarea
                        id={randomRemarksId} name={randomRemarksId}
                        value={remarks} onChange={(e) => setRemarks(e.target.value)}
                        onFocus={() => setFocusedField('remarks')} onBlur={() => setFocusedField(null)}
                        placeholder="Thank you for your business!"
                        rows={2}
                        autoComplete={`nope-${randomRemarksId}`}
                        spellCheck={false} autoCorrect="off"
                        data-lpignore="true" data-form-type="other"
                        className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 focus:border-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-900/10 font-bold text-gray-900 transition-all shadow-sm resize-none"
                      />
                    </motion.div>

                    {/* Save Clip + Clear Fields */}
                    <AnimatePresence>
                      {(businessName || customerName || items.some(i => i.name || Number(i.quantity) > 0 || Number(i.price) > 0) || upiId || payeeName || remarks || classesName) && (
                        <motion.div
                          initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
                          animate={{ opacity: 1, height: 'auto', overflow: 'hidden' }}
                          exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                          transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
                        >
                          <div className="flex justify-between items-center pt-3">
                            <motion.button
                              type="button"
                              onClick={() => { hapticLight(); handleSaveCustomRemark(); }}
                              disabled={!remarks || allRemarksClips.includes(remarks)}
                              className="flex items-center gap-2 text-xs font-bold text-gray-900 uppercase tracking-wider bg-gray-50 px-4 py-2 rounded-xl transition-colors border border-gray-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            >
                              <Plus className="w-4 h-4" /> Save Clip
                            </motion.button>
                            <motion.button
                              type="button"
                              onClick={() => { hapticMedium(); handleClear(); }}
                              className="flex items-center gap-2 text-xs font-bold text-gray-900 uppercase tracking-wider bg-gray-50 px-4 py-2 rounded-xl transition-colors border border-gray-200 shadow-sm"
                              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            >
                              <Eraser className="w-4 h-4" /> {t.clearFields}
                            </motion.button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Remarks Clips */}
                    <motion.div className="flex flex-wrap gap-2 mt-3 relative z-0">
                      <AnimatePresence mode="popLayout">
                        {allRemarksClips.map((clip) => {
                          const isCustom = customRemarks.includes(clip);
                          return (
                            <motion.div
                              layout
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              key={clip}
                              className="relative group flex items-center"
                            >
                              <motion.button
                                layout
                                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                type="button"
                                onClick={() => { hapticLight(); setRemarks(clip); }}
                                className={`text-xs font-medium text-gray-900 bg-white border border-gray-200 hover:border-gray-900 hover:bg-gray-50 py-1.5 rounded-full transition-colors shadow-sm flex items-center ${isCustom ? 'pl-3 pr-8' : 'px-3'}`}
                              >
                                {clip.length > 30 ? clip.substring(0, 30) + '...' : clip}
                              </motion.button>
                              {isCustom && (
                                <motion.button
                                  layout
                                  whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                  type="button"
                                  onClick={(e) => { hapticWarning(); handleRemoveCustomRemark(clip, e); }}
                                  className="absolute right-1 w-6 h-6 flex items-center justify-center rounded-full text-[#2d2d2b]/40 hover:text-[#2d2d2b] hover:bg-[#f5f5f0] transition-colors"
                                  title="Remove clip"
                                >
                                  <X className="w-3 h-3" />
                                </motion.button>
                              )}
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </motion.div>
                  </div>

                  {/* Summary + QR + Actions */}
                  <div className="bg-[#2d2d2b] text-white p-5 rounded-2xl shadow-xl">
                    <div className="bg-white/10 rounded-xl px-5 py-3 flex justify-between items-center mb-5">
                      <div className="text-xs text-white/60 uppercase tracking-widest">{t.totalAmount}</div>
                      <div className="text-2xl font-semibold tracking-tight">
                        &#8377;{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>

                    {upiId && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 28, delay: 0.05 }}
                        className="mb-5 flex flex-col items-center"
                      >
                        <div className="bg-[#f5f5f0] border border-[#d9d3ce]/60 rounded-2xl px-6 pt-5 pb-5 flex flex-col items-center gap-3 w-full">
                          <span className="text-[10px] font-black text-[#2d2d2b]/40 uppercase tracking-widest">Scan to Pay</span>
                          <div ref={visibleQrRef} className="rounded-xl" />
                          <div className="w-full h-px bg-[#d9d3ce]" />
                          <div className="flex flex-col items-center gap-0.5">
                            {payeeName && <span className="text-sm font-bold text-[#2d2d2b] tracking-tight">{payeeName}</span>}
                            <span className="text-xs font-medium text-[#2d2d2b]/50 tracking-wide">{upiId}</span>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3">
                      <motion.button
                        onClick={handleDownload}
                        disabled={isDownloading}
                        className="relative flex-1 flex items-center justify-center gap-2 bg-white text-[#2d2d2b] px-5 py-4 rounded-xl font-bold uppercase tracking-wide shadow-lg hover:bg-gray-50 transition-colors overflow-hidden group disabled:opacity-90 disabled:cursor-not-allowed"
                        whileHover={!isDownloading ? { scale: 1.02, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)' } : {}}
                        whileTap={!isDownloading ? { scale: 0.95 } : {}}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0, transition: { type: 'spring', stiffness: 400, damping: 17 } }}
                      >
                        {isDownloading ? (
                          <div className="flex items-center gap-3">
                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                              <Loader2 className="w-5 h-5 text-[#2d2d2b]" />
                            </motion.div>
                            <span className="relative z-10 font-semibold tracking-widest text-sm text-[#2d2d2b]">SAVING</span>
                            <motion.div
                              className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-[#2d2d2b]/5 to-transparent -skew-x-12"
                              initial={{ x: '-100%' }} animate={{ x: '200%' }}
                              transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                            />
                          </div>
                        ) : (
                          <>
                            <span className="relative z-10 flex items-center gap-2">
                              <Download className="w-5 h-5" />
                              {t.downloadInvoice}
                            </span>
                            <motion.div
                              className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-[#2d2d2b]/5 to-transparent -skew-x-12"
                              initial={{ x: '-100%' }} animate={{ x: '200%' }}
                              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut', repeatDelay: 4 }}
                            />
                          </>
                        )}
                      </motion.button>

                      <motion.button
                        onClick={handleShare}
                        disabled={isSharing}
                        className="relative flex-1 flex items-center justify-center gap-2 bg-transparent border border-white text-white px-5 py-4 rounded-xl font-bold uppercase tracking-wide hover:bg-white/10 transition-colors overflow-hidden disabled:opacity-80 disabled:cursor-not-allowed"
                        whileHover={!isSharing ? { scale: 1.02, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)' } : {}}
                        whileTap={!isSharing ? { scale: 0.95 } : {}}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0, transition: { type: 'spring', stiffness: 400, damping: 17, delay: 0.1 } }}
                      >
                        {isSharing ? (
                          <div className="flex items-center gap-3">
                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                              <Loader2 className="w-5 h-5 text-white" />
                            </motion.div>
                            <span className="relative z-10 font-semibold tracking-widest text-sm text-white">PROCESSING</span>
                            <motion.div
                              className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12"
                              initial={{ x: '-100%' }} animate={{ x: '200%' }}
                              transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                            />
                          </div>
                        ) : (
                          <>
                            <Share2 className="w-5 h-5" />
                            <span className="relative z-10">{t.shareInvoice}</span>
                          </>
                        )}
                      </motion.button>
                    </div>
                  </div>

                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className="fixed bottom-10 left-1/2 bg-[#2d2d2b] text-white px-6 py-3 rounded-full shadow-xl z-[100] flex items-center gap-3 whitespace-nowrap"
          >
            <Info className="w-5 h-5 text-yellow-400" />
            <div className="flex flex-col">
              <span className="font-bold text-sm">
                {multipleUpiOptions.length > 0 ? `${multipleUpiOptions.length} UPI IDs found` : 'No UPI ID found'}
              </span>
              {multipleUpiOptions.length > 0 && <span className="text-xs text-gray-400">Select one below</span>}
            </div>
            <button onClick={() => { hapticMedium(); setShowToast(false); }} className="ml-2 p-1 hover:bg-white/10 rounded-full transition-colors">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Multiple UPI Selection */}
      <AnimatePresence>
        {showToast && multipleUpiOptions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: '-50%' }}
            animate={{ opacity: 1, scale: 1, x: '-50%' }}
            exit={{ opacity: 0, scale: 0.9, x: '-50%' }}
            className="fixed bottom-24 left-1/2 bg-white border border-gray-200 rounded-2xl shadow-2xl z-[100] p-4 w-64"
          >
            <h4 className="text-sm font-bold text-[#2d2d2b] mb-2 uppercase tracking-wide">Select UPI ID</h4>
            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
              {multipleUpiOptions.map((id) => (
                <button
                  key={id}
                  onClick={() => { hapticLight(); setUpiId(id); setShowToast(false); setMultipleUpiOptions([]); }}
                  className="text-left px-3 py-2 rounded-lg hover:bg-gray-50 text-sm font-medium text-[#2d2d2b] transition-colors border border-transparent hover:border-gray-200"
                >
                  {id}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
