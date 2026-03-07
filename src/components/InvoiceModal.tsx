import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'motion/react';
import { X, Plus, Trash2, Download, Share2, Briefcase, GraduationCap, ShoppingBag, User, IndianRupee, MessageSquare, Info, Eraser, Clipboard, Check, ChevronDown, Loader2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { BusinessType, InvoiceData, downloadInvoicePdf, shareInvoicePdf } from '../utils/invoicePdfGenerator';
import { LanguageSelector } from './LanguageSelector';

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
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ onClose, t, lang, onLanguageChange }) => {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const [businessType, setBusinessType] = useState<BusinessType>('shop');
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${Date.now().toString().slice(-6)}`);
  const [businessName, setBusinessName] = useState('');
  const [classesName, setClassesName] = useState(''); // For Tuition
  const [customerName, setCustomerName] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([{ id: '1', name: '', quantity: '', price: '', unit: 'Unit' }]);
  const [upiId, setUpiId] = useState('');
  const [payeeName, setPayeeName] = useState('');
  const [qrCenterText, setQrCenterText] = useState('A');
  const [remarks, setRemarks] = useState('');
  
  // New Fields
  const [dueDate, setDueDate] = useState('');
  const [month, setMonth] = useState('');
  const [projectTitle, setProjectTitle] = useState('');

  // Premium Features State
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
  const qrRef = useRef<SVGSVGElement>(null);

  const totalAmount = items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.price)), 0);

  // Load Recent Payees and Custom Remarks
  useEffect(() => {
    const saved = localStorage.getItem('recent_payees');
    if (saved) {
      try {
        setRecentPayees(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse recent payees', e);
      }
    }

    const savedRemarks = localStorage.getItem('custom_remarks');
    if (savedRemarks) {
      try {
        setCustomRemarks(JSON.parse(savedRemarks));
      } catch (e) {
        console.error('Failed to parse custom remarks', e);
      }
    }
  }, []);

  const handleSaveCustomRemark = () => {
    if (remarks && !customRemarks.includes(remarks) && !PRE_WRITTEN_REMARKS.includes(remarks)) {
      const updated = [remarks, ...customRemarks].slice(0, 5); // Keep top 5
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

  // Helper to extract UPI IDs
  const extractUpiIds = (text: string): string[] => {
    const regex = /[a-zA-Z0-9.\-_]+@[a-zA-Z]+/g;
    const matches = text.match(regex);
    if (!matches) return [];
    return Array.from(new Set(matches.filter(id => !id.includes(' '))));
  };

  // Smart Clipboard Check
  useEffect(() => {
    const checkClipboard = async () => {
      try {
        if (navigator.permissions && navigator.permissions.query) {
          // @ts-ignore
          const permission = await navigator.permissions.query({ name: 'clipboard-read' });
          if (permission.state === 'granted') {
             const text = await navigator.clipboard.readText();
             const ids = extractUpiIds(text || '');
             if (ids.length > 0) {
               setDetectedClipboardUpi(ids[0]);
             } else {
               setDetectedClipboardUpi(null);
             }
          }
        }
      } catch (err) {
        // Silently fail
      }
    };

    window.addEventListener('focus', checkClipboard);
    checkClipboard();
    return () => window.removeEventListener('focus', checkClipboard);
  }, []);

  // Click Outside Autocomplete
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target as Node)) {
        setShowAutocomplete(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Toast Auto-hide
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  // UPI Logic
  const handleUpiChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (handleTypewriterRef.current) window.clearInterval(handleTypewriterRef.current);
    const val = e.target.value;
    setUpiId(val);
    setTouchedUpiId(false);
    setShowUpiError(false);
    
    if (val.includes('@')) {
      const parts = val.split('@');
      if (parts.length === 2 && parts[1].length >= 0) {
        setShowAutocomplete(true);
      } else {
        setShowAutocomplete(false);
      }
    } else {
      setShowAutocomplete(false);
    }
  };

  const selectHandle = (handle: string) => {
    if (handleTypewriterRef.current) window.clearInterval(handleTypewriterRef.current);

    const prefix = upiId.split('@')[0];
    setUpiId(prefix + handle);
    setShowAutocomplete(false);
    setTouchedUpiId(true);
    setShowUpiError(false);
  };

  const getFilteredHandles = () => {
    if (!upiId.includes('@')) return COMMON_UPI_HANDLES.slice(0, 5);
    const searchPart = upiId.split('@')[1].toLowerCase();
    if (!searchPart) return COMMON_UPI_HANDLES.slice(0, 5);
    return COMMON_UPI_HANDLES.filter(h => h.toLowerCase().startsWith('@' + searchPart)).slice(0, 5);
  };

  const handleClear = () => {
    if (handleTypewriterRef.current) window.clearInterval(handleTypewriterRef.current);
    
    let iterations = Math.max(businessName.length, customerName.length, upiId.length, payeeName.length, remarks.length, classesName.length);
    
    // Reset items immediately
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
      if (iterations <= 0) {
        if (handleTypewriterRef.current) window.clearInterval(handleTypewriterRef.current);
      }
    }, 10);
  };

  const handleSaveRecent = () => {
    if (upiId && upiId.includes('@') && !showUpiError) {
      const newPayee = { upiId, payeeName };
      const existing = recentPayees.filter(p => p.upiId !== upiId);
      const updated = [newPayee, ...existing].slice(0, 4); // Keep top 4
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

  // Reset fields when business type changes
  const handleBusinessTypeChange = (type: BusinessType) => {
    setBusinessType(type);
    if (type === 'tuition') {
        setQrCenterText('T');
    } else if (type === 'freelancer') {
        setQrCenterText('F');
    } else {
        setQrCenterText('A');
    }
  };

  const handleAddItem = () => {
    setItems([...items, { id: Date.now().toString(), name: '', quantity: '', price: '', unit: 'Unit' }]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const handleItemChange = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setItems(items.map(item => {
      if (item.id === id) {
        // Allow empty string for quantity and price
        if ((field === 'quantity' || field === 'price') && value === '') {
            return { ...item, [field]: '' };
        }
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const generateUpiUrl = () => {
    if (!upiId) return '';
    const cleanUpiId = upiId.trim();
    const cleanName = payeeName.trim();
    const trId = invoiceNumber;
    let link = `upi://pay?pa=${encodeURIComponent(cleanUpiId).replace(/%40/g, '@')}&pn=${encodeURIComponent(cleanName)}&cu=INR&tr=${trId}`;
    if (totalAmount > 0) link += `&am=${totalAmount.toFixed(2)}`;
    return link;
  };

  const upiUrl = generateUpiUrl();

  const getQrDataUrl = async (): Promise<string | null> => {
    if (!qrRef.current) return null;
    const svgData = new XMLSerializer().serializeToString(qrRef.current);
    const svgUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width || 200;
        canvas.height = img.height || 200;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } else {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = svgUrl;
    });
  };

  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Autofill prevention state
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

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setIsScrolled(e.currentTarget.scrollTop > 50);
  };

  const getInvoiceData = async (): Promise<InvoiceData> => {
    const qrDataUrl = await getQrDataUrl();
    return {
      invoiceNumber,
      businessName,
      classesName,
      customerName,
      items: items.map(item => ({
        ...item,
        quantity: Number(item.quantity) || 0,
        price: Number(item.price) || 0
      })),
      totalAmount,
      upiId,
      payeeName,
      qrCenterText,
      qrDataUrl,
      remarks,
      businessType,
      dueDate,
      month,
      projectTitle
    };
  };



  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      // Minimum loading time of 1.5s for better UX
      const minLoadTime = new Promise(resolve => setTimeout(resolve, 1500));
      const [data] = await Promise.all([
        getInvoiceData(),
        minLoadTime
      ]);
      await downloadInvoicePdf(data);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    setIsSharing(true);
    try {
      // Minimum loading time of 1.5s for better UX
      const minLoadTime = new Promise(resolve => setTimeout(resolve, 1500));
      const [data] = await Promise.all([
        getInvoiceData(),
        minLoadTime
      ]);
      await shareInvoicePdf(data);
    } catch (error) {
      console.error('Error sharing PDF:', error);
    } finally {
      setIsSharing(false);
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, transition: { duration: 0.3 } }
  };

  const itemAnim = {
    hidden: { opacity: 0, y: 40, scale: 0.95 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 25 } }
  };

  // Helper to get labels based on type
  const getLabels = () => {
    switch (businessType) {
      case 'tuition':
        return {
          businessName: t.teacherName,
          customerName: t.studentName,
          itemName: t.subject,
          itemQty: t.months,
          itemPrice: t.feePerMo,
          productsTitle: t.subjectsFees
        };
      case 'freelancer':
        return {
          businessName: t.freelancerName,
          customerName: t.clientName,
          itemName: t.serviceTask,
          itemQty: t.hours,
          itemPrice: t.ratePerHr,
          productsTitle: t.servicesTasks
        };
      case 'custom':
        return {
          businessName: t.businessEntityName,
          customerName: t.billedTo,
          itemName: t.description,
          itemQty: t.qty,
          itemPrice: t.price,
          productsTitle: t.items
        };
      default: // shop
        return {
          businessName: t.shopName,
          customerName: t.customerName,
          itemName: t.itemName,
          itemQty: t.qty,
          itemPrice: t.price,
          productsTitle: t.products
        };
    }
  };

  const labels = getLabels();

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#e6e1dc] overflow-hidden"
      initial="hidden"
      animate="show"
      exit="exit"
      variants={container}
    >
      <motion.div 
        variants={itemAnim} 
        onScroll={handleScroll}
        className="w-full h-full bg-[#e6e1dc] overflow-y-auto relative flex flex-col"
      >
        {/* Close Button - Scrolls with content */}
        <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-50">
          <motion.button 
            onClick={onClose}
            className="p-3 rounded-full bg-white/50 hover:bg-white text-gray-900 shadow-sm border border-gray-200 backdrop-blur-sm transition-all"
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </motion.button>
        </div>

        {/* Language Selector */}
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50">
          <LanguageSelector currentLang={lang} onLanguageChange={onLanguageChange} />
        </div>

        {/* Main Content Container */}
        <div className="w-full max-w-3xl mx-auto px-6 sm:px-12 pb-32 pt-20 sm:pt-24">
          <LayoutGroup>
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-5xl md:text-7xl font-semibold text-gray-900 tracking-tighter font-sans uppercase mb-4 whitespace-nowrap">
              {t.invoiceGenerator}
            </h2>
          </div>

          <motion.form 
            layout 
            className="flex flex-col"
            autoComplete="new-password" 
            role="presentation" 
            onSubmit={(e) => e.preventDefault()}
          >
            {/* Honeypot inputs to trick password managers and browser autofill */}
            <input type="text" name="fakeusernameremembered" style={{ display: 'none' }} tabIndex={-1} aria-hidden="true" />
            <input type="password" name="fakepasswordremembered" style={{ display: 'none' }} tabIndex={-1} aria-hidden="true" />
            
            {/* Business Type Selection */}
            <motion.div layout className="bg-white p-4 rounded-2xl border border-gray-200 mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">{t.selectBusinessType}</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { id: 'shop', label: t.shop, icon: ShoppingBag },
                        { id: 'tuition', label: t.tuition, icon: GraduationCap },
                        { id: 'freelancer', label: t.freelancer, icon: Briefcase },
                        { id: 'custom', label: t.custom, icon: User },
                    ].map((type) => (
                        <motion.button
                            layout
                            key={type.id}
                            onClick={() => handleBusinessTypeChange(type.id as BusinessType)}
                            whileHover={{ scale: 1.02, y: -2, boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)" }}
                            whileTap={{ scale: 0.98, y: 0, boxShadow: "none" }}
                            className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all shadow-sm ${
                                businessType === type.id 
                                ? 'bg-gray-100 border-gray-900 text-gray-900' 
                                : 'bg-white border-gray-200 text-gray-900 hover:border-gray-900/50'
                            }`}
                        >
                            <type.icon className="w-5 h-5" />
                            <span className="text-xs font-bold uppercase">{type.label}</span>
                        </motion.button>
                    ))}
                </div>
            </motion.div>

            {/* Business Name & Details */}
            <motion.div layout className="flex flex-col mb-6">
              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">{labels.businessName}</label>
                <motion.div
                  animate={{ scale: focusedField === 'businessName' ? 1.02 : 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  <input
                    type="search"
                    id={randomBusinessNameId}
                    name={randomBusinessNameId}
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    onFocus={() => setFocusedField('businessName')}
                    onBlur={() => setFocusedField(null)}
                    placeholder={businessType === 'tuition' ? 'Prof. Sharma' : 'My Awesome Business'}
                    autoComplete={`nope-${randomBusinessNameId}`}
                    aria-autocomplete="none"
                    spellCheck={false}
                    autoCorrect="off"
                    autoCapitalize="words"
                    data-lpignore="true"
                    data-form-type="other"
                    className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 focus:border-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-900/10 font-bold text-gray-900 text-lg transition-all shadow-sm hover:shadow-md"
                  />
                </motion.div>
              </div>

              <AnimatePresence>
              {businessType === 'tuition' && (
                <motion.div
                  key="tuition-classes"
                  initial={{ opacity: 0, height: 0, scale: 0.95, marginBottom: 0, overflow: 'hidden' }}
                  animate={{ opacity: 1, height: 'auto', scale: 1, marginBottom: 16, overflow: 'visible' }}
                  exit={{ opacity: 0, height: 0, scale: 0.95, marginBottom: 0, overflow: 'hidden' }}
                  transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                >
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">{t.classesName}</label>
                  <motion.div
                    animate={{ scale: focusedField === 'classesName' ? 1.02 : 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  >
                    <input
                      type="search"
                      id={randomClassesNameId}
                      name={randomClassesNameId}
                      value={classesName}
                      onChange={(e) => setClassesName(e.target.value)}
                      onFocus={() => setFocusedField('classesName')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Sharma Physics Classes"
                      autoComplete={`nope-${randomClassesNameId}`}
                      aria-autocomplete="none"
                      spellCheck={false}
                      autoCorrect="off"
                      data-lpignore="true"
                      data-form-type="other"
                      className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 focus:border-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-900/10 font-bold text-gray-900 text-lg transition-all shadow-sm hover:shadow-md"
                    />
                  </motion.div>
                </motion.div>
              )}
              </AnimatePresence>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                      {businessType === 'tuition' ? t.receiptNumber : t.invoiceNumber}
                  </label>
                  <motion.div
                    animate={{ scale: focusedField === 'invoiceNumber' ? 1.02 : 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  >
                    <input
                      type="search"
                      id={randomInvoiceNumberId}
                      name={randomInvoiceNumberId}
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      onFocus={() => setFocusedField('invoiceNumber')}
                      onBlur={() => setFocusedField(null)}
                      autoComplete={`nope-${randomInvoiceNumberId}`}
                      aria-autocomplete="none"
                      spellCheck={false}
                      autoCorrect="off"
                      data-lpignore="true"
                      data-form-type="other"
                      className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 focus:border-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-900/10 font-bold text-gray-900 transition-all shadow-sm hover:shadow-md"
                    />
                  </motion.div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">{labels.customerName}</label>
                  <motion.div
                    animate={{ scale: focusedField === 'customerName' ? 1.02 : 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  >
                    <input
                      type="search"
                      id={randomCustomerNameId}
                      name={randomCustomerNameId}
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      onFocus={() => setFocusedField('customerName')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="John Doe"
                      autoComplete={`nope-${randomCustomerNameId}`}
                      aria-autocomplete="none"
                      spellCheck={false}
                      autoCorrect="off"
                      data-lpignore="true"
                      data-form-type="other"
                      className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 focus:border-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-900/10 font-bold text-gray-900 transition-all shadow-sm hover:shadow-md"
                    />
                  </motion.div>
                </div>
              </div>
            </motion.div>

            {/* Dynamic Fields based on Type */}
            <AnimatePresence>
            {businessType === 'tuition' && (
                <motion.div
                  key="tuition-month"
                  initial={{ opacity: 0, height: 0, scale: 0.95, marginBottom: 0, overflow: 'hidden' }}
                  animate={{ opacity: 1, height: 'auto', scale: 1, marginBottom: 24, overflow: 'visible' }}
                  exit={{ opacity: 0, height: 0, scale: 0.95, marginBottom: 0, overflow: 'hidden' }}
                  transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                >
                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">{t.monthYear}</label>
                    <motion.div
                      animate={{ scale: focusedField === 'month' ? 1.02 : 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    >
                      <input
                          type="search"
                          id={randomMonthId}
                          name={randomMonthId}
                          value={month}
                          onChange={(e) => setMonth(e.target.value)}
                          onFocus={() => setFocusedField('month')}
                          onBlur={() => setFocusedField(null)}
                          placeholder="Month Year"
                          autoComplete={`nope-${randomMonthId}`}
                          aria-autocomplete="none"
                          spellCheck={false}
                          autoCorrect="off"
                          data-lpignore="true"
                          data-form-type="other"
                          className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 focus:border-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-900/10 font-bold text-gray-900 transition-all shadow-sm hover:shadow-md"
                      />
                    </motion.div>
                </motion.div>
            )}

            {businessType === 'freelancer' && (
                <motion.div 
                  key="freelancer-fields"
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                  initial={{ opacity: 0, height: 0, scale: 0.95, marginBottom: 0, overflow: 'hidden' }}
                  animate={{ opacity: 1, height: 'auto', scale: 1, marginBottom: 24, overflow: 'visible' }}
                  exit={{ opacity: 0, height: 0, scale: 0.95, marginBottom: 0, overflow: 'hidden' }}
                  transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                >
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">{t.projectName}</label>
                        <motion.div
                          animate={{ scale: focusedField === 'projectTitle' ? 1.02 : 1 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        >
                          <input
                              type="search"
                              id={randomProjectTitleId}
                              name={randomProjectTitleId}
                              value={projectTitle}
                              onChange={(e) => setProjectTitle(e.target.value)}
                              onFocus={() => setFocusedField('projectTitle')}
                              onBlur={() => setFocusedField(null)}
                              placeholder="Website Redesign"
                              autoComplete={`nope-${randomProjectTitleId}`}
                              aria-autocomplete="none"
                              spellCheck={false}
                              autoCorrect="off"
                              data-lpignore="true"
                              data-form-type="other"
                              className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 focus:border-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-900/10 font-bold text-gray-900 transition-all shadow-sm hover:shadow-md"
                          />
                        </motion.div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">{t.dueDate}</label>
                        <motion.div
                          animate={{ scale: focusedField === 'dueDate' ? 1.02 : 1 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        >
                          <input
                              type="search"
                              id={randomDueDateId}
                              name={randomDueDateId}
                              value={dueDate}
                              onChange={(e) => setDueDate(e.target.value)}
                              onFocus={() => setFocusedField('dueDate')}
                              onBlur={() => setFocusedField(null)}
                              autoComplete={`nope-${randomDueDateId}`}
                              aria-autocomplete="none"
                              data-lpignore="true"
                              data-form-type="other"
                              className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 focus:border-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-900/10 font-bold text-gray-900 transition-all shadow-sm hover:shadow-md"
                          />
                        </motion.div>
                    </div>
                </motion.div>
            )}
            </AnimatePresence>

            {/* UPI & Payee Section - Premium Style */}
            <motion.div layout className="flex flex-col pt-4 border-t border-gray-200 mb-6">
              <AnimatePresence>
              {recentPayees.length > 0 && (
                <motion.div 
                  layout 
                  initial={{ opacity: 0, height: 0, marginBottom: 0, overflow: 'hidden' }} 
                  animate={{ opacity: 1, height: 'auto', marginBottom: 24, overflow: 'visible' }} 
                  exit={{ opacity: 0, height: 0, marginBottom: 0, overflow: 'hidden' }}
                  transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                >
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">
                    {recentPayees.length === 1 ? 'Recent User' : 'Recent Users'}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                    <AnimatePresence>
                    {recentPayees.map((payee) => (
                      <motion.div 
                        layout
                        initial={{ opacity: 0, scale: 0.8, height: 0 }}
                        animate={{ opacity: 1, scale: 1, height: 'auto' }}
                        exit={{ opacity: 0, scale: 0.8, height: 0 }}
                        key={payee.upiId}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex-1 min-w-0 inline-flex items-center justify-between bg-white border border-gray-200 rounded-full pl-3 pr-1 py-1.5 hover:border-gray-900 transition-colors cursor-pointer group shadow-sm overflow-hidden"
                        onClick={() => onSelectRecent(payee)}
                      >
                        <div className="flex flex-col mr-2 overflow-hidden">
                          {payee.payeeName && <span className="text-xs font-bold text-gray-900 leading-tight truncate">{payee.payeeName}</span>}
                          <span className={`text-[10px] font-medium leading-tight truncate ${payee.payeeName ? 'text-gray-600' : 'text-gray-900'}`}>{payee.upiId}</span>
                        </div>
                        <button 
                          className="flex-shrink-0 text-gray-300 hover:text-red-500 transition-colors p-1.5 rounded-full hover:bg-red-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveRecent(payee.upiId);
                          }}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </motion.div>
                    ))}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
              </AnimatePresence>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className={showAutocomplete ? "relative z-50" : "relative z-10"}>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">UPI ID</label>
                  <motion.div 
                    className="relative"
                    animate={{ scale: focusedField === 'upiId' ? 1.02 : 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    ref={autocompleteRef}
                  >
                    <input
                      type="search"
                      id={randomUpiId}
                      name={randomUpiId}
                      value={upiId}
                      onChange={handleUpiChange}
                      onFocus={() => setFocusedField('upiId')}
                      onBlur={() => {
                        setFocusedField(null);
                        setTouchedUpiId(true);
                        handleSaveRecent();
                      }}
                      placeholder="name@upi"
                      autoComplete="new-password"
                      aria-autocomplete="none"
                      spellCheck={false}
                      autoCorrect="off"
                      autoCapitalize="off"
                      data-lpignore="true"
                      data-form-type="other"
                      className={`w-full px-4 py-3 rounded-xl bg-white border outline-none font-bold text-gray-900 transition-all shadow-sm hover:shadow-md ${
                        showUpiError
                          ? 'border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
                          : 'border-gray-200 focus:border-gray-900 focus:ring-4 focus:ring-gray-900/10'
                      }`}
                    />
                    
                    {/* Clipboard Paste Button */}
                    <AnimatePresence>
                      {!upiId && (
                        <motion.button
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          type="button"
                          onClick={async () => {
                            try {
                              const text = await navigator.clipboard.readText();
                              const ids = extractUpiIds(text || '');
                              if (ids.length === 1) {
                                setUpiId(ids[0]);
                                setDetectedClipboardUpi(null);
                              } else if (ids.length > 1) {
                                setMultipleUpiOptions(ids);
                                setShowToast(true);
                              } else {
                                setShowToast(true);
                              }
                            } catch (err) {
                              // Fallback
                            }
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

                    {/* Autocomplete Dropdown */}
                    <AnimatePresence>
                      {showAutocomplete && getFilteredHandles().length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -5, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -5, scale: 0.98 }}
                          className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden"
                        >
                          <ul className="max-h-56 overflow-y-auto py-2 px-1">
                            {getFilteredHandles().map((handle, index) => (
                              <motion.li 
                                key={handle}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.03 }}
                              >
                                <button
                                  type="button"
                                  className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-900 hover:bg-gray-50 hover:text-gray-900 transition-all rounded-lg flex items-center gap-1 group"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    selectHandle(handle);
                                  }}
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

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Receiver's Name</label>
                  <motion.div
                    animate={{ scale: focusedField === 'payeeName' ? 1.02 : 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  >
                    <input
                      type="search"
                      id={randomPayeeNameId}
                      name={randomPayeeNameId}
                      value={payeeName}
                      onChange={(e) => setPayeeName(e.target.value)}
                      onFocus={() => setFocusedField('payeeName')}
                      onBlur={() => {
                        setFocusedField(null);
                        handleSaveRecent();
                      }}
                      placeholder="Receiver's Name"
                      autoComplete={`nope-${randomPayeeNameId}`}
                      aria-autocomplete="none"
                      spellCheck={false}
                      autoCorrect="off"
                      data-lpignore="true"
                      data-form-type="other"
                      className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 focus:border-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-900/10 font-bold text-gray-900 transition-all shadow-sm hover:shadow-md"
                    />
                  </motion.div>
                </div>
              </div>
            </motion.div>

            <motion.div layout className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">{t.qrCenterText} (Max 2 chars)</label>
              <input
                type="search"
                id={randomQrTextId}
                name={randomQrTextId}
                maxLength={2}
                value={qrCenterText}
                onChange={(e) => setQrCenterText(e.target.value)}
                placeholder="A"
                autoComplete={`nope-${randomQrTextId}`}
                aria-autocomplete="none"
                spellCheck={false}
                autoCorrect="off"
                autoCapitalize="off"
                data-lpignore="true"
                data-form-type="other"
                className="w-24 px-4 py-3 rounded-xl bg-white border border-gray-200 focus:border-gray-900 focus:outline-none font-bold text-gray-900 text-center transition-colors"
              />
            </motion.div>

            {/* Remarks */}
            <motion.div layout className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Remarks</label>
              <motion.div
                animate={{ scale: focusedField === 'remarks' ? 1.02 : 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              >
                <textarea
                  id={randomRemarksId}
                  name={randomRemarksId}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  onFocus={() => setFocusedField('remarks')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Thank you for your business!"
                  rows={2}
                  autoComplete={`nope-${randomRemarksId}`}
                  spellCheck={false}
                  autoCorrect="off"
                  data-lpignore="true"
                  data-form-type="other"
                  className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 focus:border-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-900/10 font-bold text-gray-900 transition-all shadow-sm hover:shadow-md resize-none"
                />
              </motion.div>

              {/* Clear Fields Button */}
              <AnimatePresence>
                {(businessName || customerName || items.some(i => i.name || Number(i.quantity) > 0 || Number(i.price) > 0) || upiId || payeeName || remarks || classesName) && (
                  <motion.div
                    layout
                    initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
                    animate={{ opacity: 1, height: 'auto', overflow: 'visible' }}
                    exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                    transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
                  >
                    <div className="flex justify-between items-center mt-4">
                      <motion.button
                        type="button"
                        onClick={handleSaveCustomRemark}
                        disabled={!remarks || allRemarksClips.includes(remarks)}
                        className="flex items-center gap-2 text-xs font-bold text-gray-900 uppercase tracking-wider bg-gray-50 hover:bg-gray-50 px-4 py-2 rounded-xl transition-colors border border-gray-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Plus className="w-4 h-4" />
                        Save Clip
                      </motion.button>

                      <motion.button
                        type="button"
                        onClick={handleClear}
                        className="flex items-center gap-2 text-xs font-bold text-gray-900 uppercase tracking-wider bg-gray-50 hover:bg-gray-50 px-4 py-2 rounded-xl transition-colors border border-gray-200 shadow-sm"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Eraser className="w-4 h-4" />
                        {t.clearFields}
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Remarks Clips */}
              <motion.div layout className="flex flex-wrap gap-2 mt-4 relative z-0">
                <AnimatePresence mode='popLayout'>
                {allRemarksClips.map((clip, idx) => {
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
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        onClick={() => setRemarks(clip)}
                        className={`text-xs font-medium text-gray-900 bg-white border border-gray-200 hover:border-gray-900 hover:bg-gray-50 py-1.5 rounded-full transition-colors shadow-sm flex items-center ${isCustom ? 'pl-3 pr-8' : 'px-3'}`}
                      >
                        {clip.length > 30 ? clip.substring(0, 30) + '...' : clip}
                      </motion.button>
                      {isCustom && (
                        <motion.button
                          layout
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          type="button"
                          onClick={(e) => handleRemoveCustomRemark(clip, e)}
                          className="absolute right-1 w-6 h-6 flex items-center justify-center rounded-full text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors"
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
            </motion.div>

            {/* Items Section */}
            <motion.div layout className="mt-8 space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-xl font-bold text-gray-900 uppercase tracking-wide">{labels.productsTitle}</label>
                <motion.button
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98, y: 1 }}
                  onClick={handleAddItem}
                  className="text-sm font-bold text-gray-900 bg-white px-3 py-2 rounded-lg border border-gray-200 hover:border-gray-900 transition-colors flex items-center gap-2 shadow-sm hover:shadow-md"
                >
                  <Plus className="w-4 h-4" /> {t.addItem}
                </motion.button>
              </div>
              
              <div className="flex flex-col">
                <AnimatePresence>
                  {items.map((item, index) => (
                    <motion.div
                      layout
                      key={item.id}
                      initial={{ opacity: 0, height: 0, scale: 0.95, marginBottom: 0, overflow: 'hidden' }}
                      animate={{ opacity: 1, height: 'auto', scale: 1, marginBottom: 12, overflow: 'visible' }}
                      exit={{ opacity: 0, height: 0, scale: 0.95, marginBottom: 0, overflow: 'hidden' }}
                      transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                    >
                      <div className="grid grid-cols-12 gap-3 items-start bg-gray-50 p-3 rounded-xl border border-gray-200">
                        <div className="col-span-12 sm:col-span-5">
                        <motion.div
                          animate={{ scale: focusedField === `${randomItemNamePrefix}_${item.id}` ? 1.02 : 1 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        >
                        <input
                          type="search"
                          id={`${randomItemNamePrefix}_${item.id}`}
                          name={`${randomItemNamePrefix}_${item.id}`}
                          value={item.name}
                          onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                          onFocus={() => setFocusedField(`${randomItemNamePrefix}_${item.id}`)}
                          onBlur={() => setFocusedField(null)}
                          placeholder={labels.itemName}
                          autoComplete={`nope-${randomItemNamePrefix}_${item.id}`}
                          aria-autocomplete="none"
                          spellCheck={false}
                          autoCorrect="off"
                          autoCapitalize="off"
                          data-lpignore="true"
                          data-form-type="other"
                          className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 focus:border-gray-900 focus:outline-none font-medium text-gray-900 text-sm transition-all shadow-sm"
                        />
                        </motion.div>
                      </div>
                      <div className="col-span-4 sm:col-span-2">
                        <motion.div
                          animate={{ scale: focusedField === `${randomItemQtyPrefix}_${item.id}` ? 1.02 : 1 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        >
                        <input
                          type="search"
                          inputMode="decimal"
                          pattern="[0-9]*"
                          id={`${randomItemQtyPrefix}_${item.id}`}
                          name={`${randomItemQtyPrefix}_${item.id}`}
                          value={item.quantity}
                          onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)}
                          onFocus={() => setFocusedField(`${randomItemQtyPrefix}_${item.id}`)}
                          onBlur={() => setFocusedField(null)}
                          placeholder={labels.itemQty}
                          autoComplete={`nope-${randomItemQtyPrefix}_${item.id}`}
                          aria-autocomplete="none"
                          spellCheck={false}
                          autoCorrect="off"
                          autoCapitalize="off"
                          data-lpignore="true"
                          data-form-type="other"
                          className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 focus:border-gray-900 focus:outline-none font-medium text-gray-900 text-sm transition-all shadow-sm"
                        />
                        </motion.div>
                      </div>
                      
                      {/* Unit Selector for Shop */}
                      {businessType === 'shop' && (
                        <div className="col-span-4 sm:col-span-2">
                          <select
                            id={`${randomItemUnitPrefix}_${item.id}`}
                            name={`${randomItemUnitPrefix}_${item.id}`}
                            value={item.unit || 'Unit'}
                            onChange={(e) => handleItemChange(item.id, 'unit', e.target.value)}
                            autoComplete={`nope-${randomItemUnitPrefix}_${item.id}`}
                            data-lpignore="true"
                            data-form-type="other"
                            className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 focus:border-gray-900 focus:outline-none font-medium text-gray-900 text-sm appearance-none transition-all shadow-sm"
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

                      <div className={businessType === 'shop' ? "col-span-3 sm:col-span-2" : "col-span-7 sm:col-span-4"}>
                        <motion.div
                          animate={{ scale: focusedField === `${randomItemPricePrefix}_${item.id}` ? 1.02 : 1 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        >
                        <input
                          type="search"
                          inputMode="decimal"
                          pattern="[0-9]*"
                          id={`${randomItemPricePrefix}_${item.id}`}
                          name={`${randomItemPricePrefix}_${item.id}`}
                          value={item.price}
                          onChange={(e) => handleItemChange(item.id, 'price', e.target.value)}
                          onFocus={() => setFocusedField(`${randomItemPricePrefix}_${item.id}`)}
                          onBlur={() => setFocusedField(null)}
                          placeholder={labels.itemPrice}
                          autoComplete={`nope-${randomItemPricePrefix}_${item.id}`}
                          aria-autocomplete="none"
                          spellCheck={false}
                          autoCorrect="off"
                          autoCapitalize="off"
                          data-lpignore="true"
                          data-form-type="other"
                          className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 focus:border-gray-900 focus:outline-none font-medium text-gray-900 text-sm transition-all shadow-sm"
                        />
                        </motion.div>
                      </div>
                      <div className="col-span-1 flex justify-center pt-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-gray-400 hover:text-gray-900 transition-colors p-1 rounded-full hover:bg-gray-100"
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
            </motion.div>

            {/* Summary & Actions - Moved to Bottom of Form */}
            <motion.div layout className="mt-12 pt-8 border-t-2 border-gray-200">
                <div className="bg-[#2d2d2b] text-white p-6 sm:p-8 rounded-3xl shadow-xl">
                    <h3 className="text-xl font-bold uppercase tracking-wide mb-6 text-white/80">Summary</h3>
                    
                    <div className="bg-white/10 rounded-2xl p-6 backdrop-blur-sm border border-white/10 mb-8 flex justify-between items-center">
                        <div className="text-sm text-white/60 uppercase tracking-wider">{t.totalAmount}</div>
                        <div className="text-3xl md:text-4xl font-semibold tracking-tight">₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    </div>

                    {upiId && (
                        <div className="flex flex-col items-center bg-white p-6 rounded-2xl mb-8">
                            <div className="text-[#2d2d2b] font-bold mb-4 uppercase tracking-wide text-sm">{t.scanToPay}</div>
                            <div className="hidden">
                                <QRCodeSVG
                                    id="hidden-qr-code"
                                    value={upiUrl}
                                    size={200}
                                    level="H"
                                    includeMargin={false}
                                    ref={qrRef}
                                    fgColor="#2d2d2b"
                                    imageSettings={{
                                        src: `data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='20' fill='%232d2d2b'/%3E%3Ctext x='50' y='50' font-family='Arial, sans-serif' font-weight='900' font-size='60' fill='%23e6e1dc' text-anchor='middle' dominant-baseline='central'%3E${encodeURIComponent(qrCenterText || 'A')}%3C/text%3E%3C/svg%3E`,
                                        x: undefined,
                                        y: undefined,
                                        height: 48,
                                        width: 48,
                                        excavate: true,
                                    }}
                                />
                            </div>
                            <QRCodeSVG
                                value={upiUrl}
                                size={180}
                                level="H"
                                includeMargin={false}
                                fgColor="#2d2d2b"
                                imageSettings={{
                                    src: `data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='20' fill='%232d2d2b'/%3E%3Ctext x='50' y='50' font-family='Arial, sans-serif' font-weight='900' font-size='60' fill='%23e6e1dc' text-anchor='middle' dominant-baseline='central'%3E${encodeURIComponent(qrCenterText || 'A')}%3C/text%3E%3C/svg%3E`,
                                    x: undefined,
                                    y: undefined,
                                    height: 48,
                                    width: 48,
                                    excavate: true,
                                }}
                            />
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-4">
                        <motion.button
                            onClick={handleDownload}
                            disabled={isDownloading}
                            className="relative flex-1 flex items-center justify-center gap-2 bg-white text-[#2d2d2b] px-6 py-4 rounded-xl font-bold uppercase tracking-wide shadow-lg hover:bg-gray-50 transition-colors overflow-hidden group disabled:opacity-90 disabled:cursor-not-allowed"
                            whileHover={!isDownloading ? { 
                                scale: 1.02, 
                                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.2), 0 4px 6px -2px rgba(0, 0, 0, 0.1)",
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
                                            className="absolute w-full h-full border border-[#2d2d2b]/20 border-t-[#2d2d2b] rounded-full"
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                        />
                                        <motion.span 
                                            className="absolute w-1.5 h-1.5 bg-[#2d2d2b] rounded-full"
                                            animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.5, 1, 0.5] }}
                                            transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                                        />
                                    </div>
                                    <span className="relative z-10 font-semibold tracking-widest text-sm text-[#2d2d2b]">SAVING</span>
                                    <motion.div
                                        className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-[#2d2d2b]/5 to-transparent -skew-x-12"
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
                                        {t.downloadInvoice}
                                    </span>
                                    <motion.div
                                        className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-[#2d2d2b]/5 to-transparent -skew-x-12"
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
                            onClick={handleShare}
                            disabled={isSharing}
                            className="relative flex-1 flex items-center justify-center gap-2 bg-transparent border border-white text-white px-6 py-4 rounded-xl font-bold uppercase tracking-wide hover:bg-white/10 transition-colors overflow-hidden disabled:opacity-80 disabled:cursor-not-allowed"
                            whileHover={!isSharing ? { 
                                scale: 1.02, 
                                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.2), 0 4px 6px -2px rgba(0, 0, 0, 0.1)",
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
                                            className="absolute w-full h-full border border-white/20 border-t-white rounded-full"
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                        />
                                        <motion.span 
                                            className="absolute w-1.5 h-1.5 bg-white rounded-full"
                                            animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.5, 1, 0.5] }}
                                            transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                                        />
                                    </div>
                                    <span className="relative z-10 font-semibold tracking-widest text-sm text-white">PROCESSING</span>
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
                                    <Share2 className="w-5 h-5" />
                                    <span className="relative z-10">{t.shareInvoice}</span>
                                </>
                            )}
                        </motion.button>
                    </div>
                </div>
            </motion.div>

          </motion.form>
          </LayoutGroup>
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
                  {multipleUpiOptions.length > 0 
                    ? `${multipleUpiOptions.length} UPI IDs found` 
                    : 'No UPI ID found'}
                </span>
                {multipleUpiOptions.length > 0 && (
                  <span className="text-xs text-gray-400">Select one below</span>
                )}
              </div>
              <button onClick={() => setShowToast(false)} className="ml-2 p-1 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Multiple UPI Selection Modal/List */}
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
                     onClick={() => {
                       setUpiId(id);
                       setShowToast(false);
                       setMultipleUpiOptions([]);
                     }}
                     className="text-left px-3 py-2 rounded-lg hover:bg-gray-50 text-sm font-medium text-[#2d2d2b] transition-colors border border-transparent hover:border-gray-200"
                   >
                     {id}
                   </button>
                 ))}
               </div>
             </motion.div>
          )}
        </AnimatePresence>

        </div>
      </motion.div>
    </motion.div>
  );
};
