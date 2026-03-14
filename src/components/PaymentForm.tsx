import React, { useState, useRef, useEffect } from 'react';
import { IndianRupee, MessageSquare, User, Info, Eraser, Clipboard, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

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

const inr = new Intl.NumberFormat('en-IN');
const QUICK_AMOUNTS = [10, 20, 50, 100, 200, 500].map((v) => ({
  value: v,
  label: `₹${v}`,
}));

const CLIP_PRESS_DURATION_MS = 450;

const PRESET_SHADOW_DEFAULT = '0 4px 0 #b8b2ac, 0 6px 12px rgba(45,45,43,0.12)';
const PRESET_SHADOW_PRESSED  = '0 1px 0 #b8b2ac, 0 2px 4px rgba(45,45,43,0.08)';
const PRESET_SHADOW_LIFTED   = '0 7px 0 #b8b2ac, 0 10px 20px rgba(45,45,43,0.20)';
const PRESET_SHADOW_BOUNCE   = '0 6px 0 #b8b2ac, 0 8px 18px rgba(45,45,43,0.18)';

interface PaymentFormProps {
  upiId: string;
  setUpiId: (value: string) => void;
  payeeName: string;
  setPayeeName: (value: string) => void;
  amount: string;
  setAmount: (value: string) => void;
  remarks: string;
  setRemarks: (value: string) => void;
  showUpiError: boolean;
  setTouchedUpiId: (value: boolean) => void;
  recentPayees: {upiId: string, payeeName: string}[];
  onSelectRecent: (payee: {upiId: string, payeeName: string}) => void;
  onRemoveRecent: (upiId: string) => void;
  onSaveRecent?: () => void;
  amountInputRef?: React.RefObject<HTMLInputElement>;
  t: Record<string, string>;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({
  upiId,
  setUpiId,
  payeeName,
  setPayeeName,
  amount,
  setAmount,
  remarks,
  setRemarks,
  showUpiError,
  setTouchedUpiId,
  recentPayees,
  onSelectRecent,
  onRemoveRecent,
  onSaveRecent,
  amountInputRef,
  t,
}) => {
  // Autofill prevention state
  const [randomUpiId] = useState(() => `edit_${Math.random().toString(36).slice(2, 9)}`);
  const [randomPayeeId] = useState(() => `edit_${Math.random().toString(36).slice(2, 9)}`);
  const [randomAmountId] = useState(() => `edit_${Math.random().toString(36).slice(2, 9)}`);
  const [randomRemarksId] = useState(() => `edit_${Math.random().toString(36).slice(2, 9)}`);

  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [detectedClipboardUpi, setDetectedClipboardUpi] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [multipleUpiOptions, setMultipleUpiOptions] = useState<string[]>([]);
  const [pressedClip, setPressedClip] = useState<number | null>(null);
  const autocompleteRef = useRef<HTMLDivElement>(null);
  const handleTypewriterRef = useRef<number | null>(null);
  const pressedClipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up the pressed-clip timer on unmount
  useEffect(() => {
    return () => {
      if (pressedClipTimerRef.current !== null) clearTimeout(pressedClipTimerRef.current);
    };
  }, []);

  // Helper to extract all potential UPI IDs from text
  const extractUpiIds = (text: string): string[] => {
    // Regex to find strings that look like UPI IDs (e.g., name@bank)
    // Matches alphanumeric, dots, hyphens, underscores before @, and alphabetic after @
    const regex = /[a-zA-Z0-9.\-_]+@[a-zA-Z]+/g;
    const matches = text.match(regex);
    if (!matches) return [];
    
    // Filter out duplicates and invalid ones (containing spaces)
    const uniqueIds = Array.from(new Set(matches.filter(id => !id.includes(' '))));
    return uniqueIds;
  };

  // Smart Clipboard Check (The "Premium Touch")
  useEffect(() => {
    const checkClipboard = async () => {
      try {
        // Check if browser supports permission query
        if (navigator.permissions && navigator.permissions.query) {
          // @ts-ignore - 'clipboard-read' is not yet in standard TS types
          const permission = await navigator.permissions.query({ name: 'clipboard-read' });
          
          if (permission.state === 'granted') {
             const text = await navigator.clipboard.readText();
             const ids = extractUpiIds(text || '');
             if (ids.length > 0) {
               // Just store the first one for the "pulse" effect, or maybe a flag
               setDetectedClipboardUpi(ids[0]);
             } else {
               setDetectedClipboardUpi(null);
             }
          }
        }
      } catch (err) {
        // Silently fail - privacy first
      }
    };

    window.addEventListener('focus', checkClipboard);
    // Also check once on mount
    checkClipboard();

    return () => window.removeEventListener('focus', checkClipboard);
  }, []);

  useEffect(() => {
    if (showToast) {
      // Only auto-hide if it's the "No valid UPI" message, not the selection list
      if (multipleUpiOptions.length === 0) {
        const timer = setTimeout(() => setShowToast(false), 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [showToast, multipleUpiOptions]);

  useEffect(() => {
    return () => {
      if (handleTypewriterRef.current) window.clearInterval(handleTypewriterRef.current);
    };
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

  const handleUpiChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (handleTypewriterRef.current) window.clearInterval(handleTypewriterRef.current);
    const val = e.target.value;
    setUpiId(val);
    setTouchedUpiId(false);
    
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
    const fullTarget = prefix + handle;
    let currentLength = prefix.length + 1; // Start right after the '@'
    
    setUpiId(prefix + '@');
    setShowAutocomplete(false);
    
    handleTypewriterRef.current = window.setInterval(() => {
      if (currentLength < fullTarget.length) {
        currentLength++;
        setUpiId(fullTarget.substring(0, currentLength));
      } else {
        if (handleTypewriterRef.current) window.clearInterval(handleTypewriterRef.current);
        setTouchedUpiId(true);
      }
    }, 40); // 40ms per letter for typewriter effect
  };

  const getFilteredHandles = () => {
    if (!upiId.includes('@')) return COMMON_UPI_HANDLES.slice(0, 5);
    const searchPart = upiId.split('@')[1].toLowerCase();
    if (!searchPart) return COMMON_UPI_HANDLES.slice(0, 5);
    return COMMON_UPI_HANDLES.filter(h => h.toLowerCase().startsWith('@' + searchPart)).slice(0, 5);
  };

  const dropdownVariants = {
    hidden: { opacity: 0, y: -5, scale: 0.98, transformOrigin: "top" },
    show: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { 
        type: "spring", stiffness: 500, damping: 30
      } 
    },
    exit: { opacity: 0, y: -5, scale: 0.98, transition: { duration: 0.15 } }
  };

  const dropdownItemVariants = {
    hidden: { opacity: 0, x: -10 },
    show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 400, damping: 24 } }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  const handleClear = () => {
    if (handleTypewriterRef.current) window.clearInterval(handleTypewriterRef.current);
    
    let iterations = Math.max(amount.length, remarks.length);
    if (iterations === 0) return;

    handleTypewriterRef.current = window.setInterval(() => {
      setAmount(prev => prev.length > 0 ? prev.slice(0, -1) : prev);
      setRemarks(prev => prev.length > 0 ? prev.slice(0, -1) : prev);
      
      iterations--;
      if (iterations <= 0) {
        if (handleTypewriterRef.current) window.clearInterval(handleTypewriterRef.current);
      }
    }, 20);
  };

  return (
    <div className="p-8 border-b md:border-b-0 md:border-r border-gray-200">
      <motion.h2 
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        className="text-lg font-bold text-[#2d2d2b] mb-6 uppercase tracking-wide"
      >
        {t.paymentDetails}
      </motion.h2>
      
      <motion.form 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-5" 
        autoComplete="new-password" 
        role="presentation" 
        onSubmit={(e) => e.preventDefault()}
      >
        {/* Honeypot inputs to trick password managers and browser autofill */}
        <input type="text" name="fakeusernameremembered" style={{ display: 'none' }} tabIndex={-1} aria-hidden="true" />
        <input type="password" name="fakepasswordremembered" style={{ display: 'none' }} tabIndex={-1} aria-hidden="true" />
        
        {recentPayees.length > 0 && (
          <motion.div variants={itemVariants} className="mb-6">
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">
              {recentPayees.length > 1 ? t.recentUsers : t.recentUser}
            </p>
            <div className="grid grid-cols-2 gap-2 w-full">
              {recentPayees.map((payee) => (
                <motion.div 
                  key={payee.upiId}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex-1 min-w-0 inline-flex items-center justify-between bg-white border border-[#d9d3ce] rounded-full pl-3 pr-1 py-1.5 hover:border-[#2d2d2b] transition-colors cursor-pointer group shadow-sm"
                  onClick={() => onSelectRecent(payee)}
                >
                  <div className="flex flex-col mr-2 overflow-hidden">
                    {payee.payeeName && <span className="text-xs font-bold text-[#2d2d2b] leading-tight truncate">{payee.payeeName}</span>}
                    <span className={`text-[10px] font-medium leading-tight truncate ${payee.payeeName ? 'text-[#2d2d2b]/60' : 'text-[#2d2d2b]'}`}>{payee.upiId}</span>
                  </div>
                  <motion.button 
                    className="flex-shrink-0 text-gray-300 hover:text-red-500 transition-colors p-1.5 rounded-full hover:bg-red-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveRecent(payee.upiId);
                    }}
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

        <motion.div variants={itemVariants} className={showAutocomplete ? "relative z-50" : "relative z-10"}>
          <label htmlFor={randomUpiId} className="block text-sm font-bold text-[#2d2d2b] mb-1.5 uppercase tracking-wide">
            {t.upiIdLabel} <span className="text-[#2d2d2b]">*</span>
          </label>
          <motion.div 
            className="relative"
            animate={{ scale: focusedField === randomUpiId ? 1.02 : 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            ref={autocompleteRef}
          >
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className={`h-5 w-5 transition-colors duration-300 ${focusedField === randomUpiId ? 'text-gray-900' : 'text-gray-400'}`} />
            </div>
            <input
              type="search"
              id={randomUpiId}
              name={randomUpiId}
              autoComplete="new-password"
              aria-autocomplete="none"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              data-lpignore="true"
              data-form-type="other"
              className={`block w-full pl-10 pr-12 py-3 border rounded-xl outline-none sm:text-sm transition-all duration-300 bg-white text-[#2d2d2b] font-medium placeholder:text-[#2d2d2b]/40 ${
                showUpiError
                  ? 'border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
                  : 'border-[#d9d3ce] focus:border-[#2d2d2b] focus:ring-4 focus:ring-[#2d2d2b]/10 shadow-sm hover:shadow-md'
              }`}
              placeholder={t.upiIdPlaceholder}
              value={upiId}
              onChange={handleUpiChange}
              onFocus={() => {
                setFocusedField(randomUpiId);
                if (upiId.includes('@')) setShowAutocomplete(true);
              }}
              onBlur={() => {
                setFocusedField(null);
                setTouchedUpiId(true); // Validate when user clicks away
                if (onSaveRecent) onSaveRecent();
              }}
            />
            
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
                        // Single ID found - paste directly
                        setUpiId(ids[0]);
                        if (handleTypewriterRef.current) window.clearInterval(handleTypewriterRef.current);
                        const input = document.getElementById(randomUpiId);
                        if (input) input.focus();
                        setDetectedClipboardUpi(null);
                        setMultipleUpiOptions([]);
                        setShowToast(false);
                      } else if (ids.length > 1) {
                        // Multiple IDs found - show selection
                        setMultipleUpiOptions(ids);
                        setShowToast(true);
                      } else {
                        // No IDs found
                        setMultipleUpiOptions([]);
                        setShowToast(true);
                        const input = document.getElementById(randomUpiId);
                        if (input) input.focus();
                      }
                    } catch (err) {
                      console.error('Failed to read clipboard', err);
                      // Fallback: just focus the input so user can paste manually
                      const input = document.getElementById(randomUpiId);
                      if (input) input.focus();
                    }
                  }}
                  className={`absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer transition-all z-20 ${
                    detectedClipboardUpi 
                      ? 'text-gray-900 drop-shadow-[0_0_8px_rgba(45,45,43,0.4)] animate-pulse scale-110' 
                      : 'text-gray-400 hover:text-gray-900'
                  }`}
                  title={detectedClipboardUpi ? "Paste detected UPI ID" : "Paste from clipboard"}
                >
                  <Clipboard className={`h-5 w-5 ${detectedClipboardUpi ? 'stroke-[2.5px]' : ''}`} />
                </motion.button>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {showToast && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className={`absolute top-full mt-2 right-0 z-50 bg-gray-900 text-white text-xs font-medium rounded-lg shadow-xl overflow-hidden pointer-events-auto max-w-[250px] border border-white/5 ${multipleUpiOptions.length > 0 ? 'p-0' : 'px-3 py-2 flex items-center gap-2'}`}
                >
                  {multipleUpiOptions.length > 0 ? (
                    <div className="flex flex-col min-w-[200px]">
                      <div className="px-3 py-2 bg-gray-900 border-b border-white/10 flex items-center justify-between">
                        <span className="text-white/60 text-[10px] uppercase tracking-wider font-bold">Select UPI ID</span>
                        <motion.button 
                          onClick={() => {
                            setShowToast(false);
                            setMultipleUpiOptions([]);
                          }}
                          className="text-white/40 hover:text-white transition-colors"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <X className="h-3 w-3" />
                        </motion.button>
                      </div>
                      <div className="max-h-[200px] overflow-y-auto">
                        {multipleUpiOptions.map((id, index) => (
                          <motion.button
                            key={index}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.2, delay: index * 0.05 }}
                            type="button"
                            onClick={() => {
                              // Close menu first
                              setShowToast(false);
                              setMultipleUpiOptions([]);
                              setDetectedClipboardUpi(null);
                              
                              // Clear any existing interval
                              if (handleTypewriterRef.current) window.clearInterval(handleTypewriterRef.current);
                              
                              // Typewriter effect logic
                              let i = 0;
                              setUpiId('');
                              const input = document.getElementById(randomUpiId);
                              if (input) input.focus();
                              
                              handleTypewriterRef.current = window.setInterval(() => {
                                if (i < id.length) {
                                  // Use substring to ensure correct text even if state updates are batched/delayed
                                  setUpiId(id.substring(0, i + 1));
                                  i++;
                                } else {
                                  if (handleTypewriterRef.current) {
                                    window.clearInterval(handleTypewriterRef.current);
                                    handleTypewriterRef.current = null;
                                  }
                                }
                              }, 30); // Speed of typing
                            }}
                            className="w-full px-3 py-2.5 text-left hover:bg-white/10 transition-colors border-b border-white/5 last:border-0 flex items-center gap-2 group"
                          >
                            <div className="h-6 w-6 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 group-hover:bg-blue-500/30 transition-colors">
                              <User className="h-3 w-3 text-blue-400" />
                            </div>
                            <span className="truncate text-white/90 group-hover:text-white transition-colors">{id}</span>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <>
                      <Info className="h-3.5 w-3.5 text-red-400 shrink-0" />
                      <span>No valid UPI ID detected</span>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
            
            <AnimatePresence>
              {showAutocomplete && getFilteredHandles().length > 0 && (
                <motion.div
                  variants={dropdownVariants}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                  className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden"
                >
                  <ul className="max-h-56 overflow-y-auto py-2 px-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-[#d9d3ce] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
                    {getFilteredHandles().map((handle, index) => (
                      <motion.li 
                        key={handle} 
                        variants={dropdownItemVariants}
                        initial="hidden"
                        animate="show"
                        layout="position"
                        transition={{ delay: index * 0.03 }}
                      >
                        <motion.button
                          type="button"
                          className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-900 hover:bg-gray-50 hover:text-gray-900 transition-all rounded-lg flex items-center gap-1 group"
                          onMouseDown={(e) => {
                            e.preventDefault(); // Prevents input from losing focus
                            selectHandle(handle);
                          }}
                          whileHover={{ scale: 1.02, backgroundColor: "#f9fafb" }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <span className="opacity-40 group-hover:opacity-60 transition-opacity truncate max-w-[50%]">{upiId.split('@')[0]}</span>
                          <span className="font-bold text-base">{handle}</span>
                        </motion.button>
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          <div className="flex items-start gap-1.5 mt-2 px-1">
            <Info className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs font-medium text-gray-500 leading-tight">
              Format: username@bank (e.g. john@oksbi)
            </p>
          </div>
          <AnimatePresence>
            {showUpiError && (
              <motion.p 
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                className="text-xs font-bold text-red-500 uppercase tracking-wide overflow-hidden"
              >
                {t.invalidUpi}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div variants={itemVariants}>
          <label htmlFor={randomPayeeId} className="block text-sm font-bold text-[#2d2d2b] mb-1.5 uppercase tracking-wide">
            {t.nameLabel}
          </label>
          <motion.div
            animate={{ scale: focusedField === randomPayeeId ? 1.02 : 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            <input
              type="search"
              id={randomPayeeId}
              name={randomPayeeId}
              autoComplete={`nope-${randomPayeeId}`}
              aria-autocomplete="none"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              data-lpignore="true"
              data-form-type="other"
              className="block w-full px-3 py-3 border border-[#d9d3ce] rounded-xl outline-none focus:border-[#2d2d2b] focus:ring-4 focus:ring-[#2d2d2b]/10 sm:text-sm transition-all duration-300 bg-white text-[#2d2d2b] font-medium placeholder:text-[#2d2d2b]/40 shadow-sm hover:shadow-md"
              placeholder={t.namePlaceholder}
              value={payeeName}
              onChange={(e) => setPayeeName(e.target.value)}
              onFocus={() => setFocusedField(randomPayeeId)}
              onBlur={() => {
                setFocusedField(null);
                if (onSaveRecent) onSaveRecent();
              }}
            />
          </motion.div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <label htmlFor={randomAmountId} className="block text-sm font-bold text-[#2d2d2b] mb-1.5 uppercase tracking-wide">
            {t.amountLabel}
          </label>
          <motion.div 
            className="relative"
            animate={{ scale: focusedField === randomAmountId ? 1.02 : 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <IndianRupee className={`h-5 w-5 transition-colors duration-300 ${focusedField === randomAmountId ? 'text-gray-900' : 'text-gray-400'}`} />
            </div>
            <input
              type="search"
              inputMode="decimal"
              id={randomAmountId}
              name={randomAmountId}
              min="1"
              step="any"
              autoComplete={`nope-${randomAmountId}`}
              aria-autocomplete="none"
              data-lpignore="true"
              data-form-type="other"
              className="block w-full pl-10 pr-3 py-3 border border-[#d9d3ce] rounded-xl outline-none focus:border-[#2d2d2b] focus:ring-4 focus:ring-[#2d2d2b]/10 sm:text-sm transition-all duration-300 bg-white text-[#2d2d2b] font-medium placeholder:text-[#2d2d2b]/40 shadow-sm hover:shadow-md"
              placeholder={t.amountPlaceholder}
              value={amount}
              ref={amountInputRef}
              onChange={(e) => {
                let val = e.target.value.replace(/[^0-9.]/g, '');
                
                const parts = val.split('.');
                if (parts.length > 2) {
                  val = parts[0] + '.' + parts.slice(1).join('');
                }
                
                if (parts.length === 2 && parts[1].length > 2) {
                  val = parts[0] + '.' + parts[1].substring(0, 2);
                }

                if (val) {
                  const splitVal = val.split('.');
                  let intPart = splitVal[0];
                  intPart = intPart.replace(/^0+(?=\d)/, '');
                  
                  if (intPart) {
                    intPart = new Intl.NumberFormat('en-IN').format(BigInt(intPart));
                  } else if (val.startsWith('.')) {
                    intPart = '0';
                  }
                  
                  val = splitVal.length > 1 ? intPart + '.' + splitVal[1] : intPart;
                }
                
                setAmount(val);
              }}
              onFocus={() => setFocusedField(randomAmountId)}
              onBlur={() => setFocusedField(null)}
            />
          </motion.div>
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {QUICK_AMOUNTS.map(({ value, label }) => (
              <motion.button
                key={value}
                type="button"
                onClick={() => {
                  const current = parseFloat(amount.replace(/,/g, '')) || 0;
                  const next = current + value;
                  setAmount(inr.format(next));
                  if (pressedClipTimerRef.current !== null) clearTimeout(pressedClipTimerRef.current);
                  setPressedClip(value);
                  pressedClipTimerRef.current = setTimeout(() => setPressedClip(null), CLIP_PRESS_DURATION_MS);
                  (document.activeElement as HTMLElement)?.blur();
                }}
                className="text-xs font-bold px-2.5 py-1 rounded-lg border transition-colors bg-white text-[#2d2d2b] border-[#d9d3ce] hover:border-[#2d2d2b] select-none"
                style={{ boxShadow: PRESET_SHADOW_DEFAULT }}
                animate={
                  pressedClip === value
                    ? { scale: [1, 0.78, 1.12, 0.95, 1], rotate: [0, -5, 5, -2, 0], y: [0, 4, -3, 1, 0], boxShadow: [PRESET_SHADOW_DEFAULT, PRESET_SHADOW_PRESSED, PRESET_SHADOW_BOUNCE, PRESET_SHADOW_DEFAULT, PRESET_SHADOW_DEFAULT] }
                    : { scale: 1, rotate: 0, y: 0, boxShadow: PRESET_SHADOW_DEFAULT }
                }
                transition={
                  pressedClip === value
                    ? { duration: CLIP_PRESS_DURATION_MS / 1000, ease: 'easeInOut' }
                    : { type: 'spring', stiffness: 400, damping: 20 }
                }
                whileHover={{ scale: 1.12, y: -3, boxShadow: PRESET_SHADOW_LIFTED }}
                whileTap={{ scale: 0.82, y: 4, boxShadow: PRESET_SHADOW_PRESSED }}
              >
                {label}
              </motion.button>
            ))}
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <label htmlFor={randomRemarksId} className="block text-sm font-bold text-[#2d2d2b] mb-1.5 uppercase tracking-wide">
            {t.remarksLabel}
          </label>
          <motion.div 
            className="relative"
            animate={{ scale: focusedField === randomRemarksId ? 1.02 : 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MessageSquare className={`h-5 w-5 transition-colors duration-300 ${focusedField === randomRemarksId ? 'text-gray-900' : 'text-gray-400'}`} />
            </div>
            <input
              type="search"
              id={randomRemarksId}
              name={randomRemarksId}
              maxLength={30}
              autoComplete={`nope-${randomRemarksId}`}
              aria-autocomplete="none"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              data-lpignore="true"
              data-form-type="other"
              className="block w-full pl-10 pr-3 py-3 border border-[#d9d3ce] rounded-xl outline-none focus:border-[#2d2d2b] focus:ring-4 focus:ring-[#2d2d2b]/10 sm:text-sm transition-all duration-300 bg-white text-[#2d2d2b] font-medium placeholder:text-[#2d2d2b]/40 shadow-sm hover:shadow-md"
              placeholder={t.remarksPlaceholder}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              onFocus={() => setFocusedField(randomRemarksId)}
              onBlur={() => setFocusedField(null)}
            />
          </motion.div>
          <div className="flex justify-between items-center mt-2 px-1">
            <p className="text-xs font-medium text-gray-500">
              {t.remarksNote}
            </p>
            <p className={`text-xs font-bold transition-colors ${remarks.length >= 30 ? 'text-red-500' : 'text-gray-400'}`}>
              {remarks.length}/30
            </p>
          </div>
          
          <AnimatePresence>
            {(amount || remarks) && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
                className="flex justify-end overflow-hidden"
              >
                <motion.button
                  type="button"
                  onClick={handleClear}
                  className="flex items-center gap-2 text-xs font-bold text-[#2d2d2b] uppercase tracking-wider bg-[#f5f5f0] hover:bg-[#e6e1dc] px-4 py-2 rounded-xl transition-colors border border-[#d9d3ce] shadow-sm"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Eraser className="w-4 h-4" />
                  Clear Fields
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.form>
    </div>
  );
};
