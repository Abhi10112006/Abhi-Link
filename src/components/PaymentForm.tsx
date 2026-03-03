import React, { useState, useRef, useEffect } from 'react';
import { IndianRupee, MessageSquare, User, Info, Eraser } from 'lucide-react';
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
}) => {
  // Autofill prevention state
  const [randomUpiId] = useState(() => `edit_${Math.random().toString(36).slice(2, 9)}`);
  const [randomPayeeId] = useState(() => `edit_${Math.random().toString(36).slice(2, 9)}`);
  const [randomAmountId] = useState(() => `edit_${Math.random().toString(36).slice(2, 9)}`);
  const [randomRemarksId] = useState(() => `edit_${Math.random().toString(36).slice(2, 9)}`);

  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const autocompleteRef = useRef<HTMLDivElement>(null);
  const handleTypewriterRef = useRef<number | null>(null);

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
    <div className="p-8 border-b md:border-b-0 md:border-r border-[#d9d3ce]">
      <motion.h2 
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        className="text-lg font-bold text-[#2d2d2b] mb-6 uppercase tracking-wide"
      >
        Payment Details
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
            <p className="text-[11px] font-bold text-[#2d2d2b]/50 uppercase tracking-widest mb-3">
              {recentPayees.length > 1 ? 'Recent Users' : 'Recent User'}
            </p>
            <div className="grid grid-cols-2 gap-2 w-full">
              {recentPayees.map((payee) => (
                <motion.div 
                  key={payee.upiId}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex-1 min-w-0 inline-flex items-center justify-between bg-white border-2 border-[#d9d3ce] rounded-full pl-3 pr-1 py-1.5 hover:border-[#2d2d2b] transition-colors cursor-pointer group shadow-sm"
                  onClick={() => onSelectRecent(payee)}
                >
                  <div className="flex flex-col mr-2 overflow-hidden">
                    {payee.payeeName && <span className="text-xs font-bold text-[#2d2d2b] leading-tight truncate">{payee.payeeName}</span>}
                    <span className={`text-[10px] font-medium leading-tight truncate ${payee.payeeName ? 'text-[#2d2d2b]/60' : 'text-[#2d2d2b]'}`}>{payee.upiId}</span>
                  </div>
                  <button 
                    className="flex-shrink-0 text-[#2d2d2b]/30 hover:text-red-500 transition-colors p-1.5 rounded-full hover:bg-red-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveRecent(payee.upiId);
                    }}
                    aria-label="Remove recent payee"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        <motion.div variants={itemVariants} className={showAutocomplete ? "relative z-50" : "relative z-10"}>
          <label htmlFor={randomUpiId} className="block text-sm font-bold text-[#2d2d2b] mb-1.5 uppercase tracking-wide">
            UPI ID (VPA) <span className="text-red-500">*</span>
          </label>
          <motion.div 
            className="relative"
            animate={{ scale: focusedField === randomUpiId ? 1.02 : 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            ref={autocompleteRef}
          >
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className={`h-5 w-5 transition-colors duration-300 ${focusedField === randomUpiId ? 'text-[#2d2d2b]' : 'text-[#2d2d2b]/40'}`} />
            </div>
            <input
              type="search"
              id={randomUpiId}
              name={randomUpiId}
              autoComplete={`nope-${randomUpiId}`}
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              data-lpignore="true"
              data-form-type="other"
              list="autocompleteOff"
              className={`block w-full pl-10 pr-3 py-3 border-2 rounded-xl outline-none sm:text-sm transition-all duration-300 bg-[#faf9f8] text-[#2d2d2b] font-medium placeholder:text-[#2d2d2b]/40 ${
                showUpiError
                  ? 'border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
                  : 'border-[#d9d3ce] focus:border-[#2d2d2b] focus:ring-4 focus:ring-[#2d2d2b]/10 shadow-sm hover:shadow-md'
              }`}
              placeholder="e.g. john@okhdfcbank"
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
              {showAutocomplete && getFilteredHandles().length > 0 && (
                <motion.div
                  variants={dropdownVariants}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                  className="absolute z-10 w-full mt-2 bg-white border-2 border-[#d9d3ce] rounded-xl shadow-xl overflow-hidden"
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
                        <button
                          type="button"
                          className="w-full text-left px-4 py-2.5 text-sm font-medium text-[#2d2d2b] hover:bg-[#faf9f8] hover:text-blue-600 transition-all rounded-lg flex items-center gap-1 group"
                          onMouseDown={(e) => {
                            e.preventDefault(); // Prevents input from losing focus
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
          <div className="flex items-start gap-1.5 mt-2 px-1">
            <Info className="w-3.5 h-3.5 text-[#2d2d2b]/40 mt-0.5 flex-shrink-0" />
            <p className="text-xs font-medium text-[#2d2d2b]/50 leading-tight">
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
                Please enter a valid UPI ID
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div variants={itemVariants}>
          <label htmlFor={randomPayeeId} className="block text-sm font-bold text-[#2d2d2b] mb-1.5 uppercase tracking-wide">
            Receiver Name
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
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              data-lpignore="true"
              data-form-type="other"
              list="autocompleteOff"
              className="block w-full px-3 py-3 border-2 border-[#d9d3ce] rounded-xl outline-none focus:border-[#2d2d2b] focus:ring-4 focus:ring-[#2d2d2b]/10 sm:text-sm transition-all duration-300 bg-[#faf9f8] text-[#2d2d2b] font-medium placeholder:text-[#2d2d2b]/40 shadow-sm hover:shadow-md"
              placeholder="e.g. John Doe"
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
            Amount (₹)
          </label>
          <motion.div 
            className="relative"
            animate={{ scale: focusedField === randomAmountId ? 1.02 : 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <IndianRupee className={`h-5 w-5 transition-colors duration-300 ${focusedField === randomAmountId ? 'text-[#2d2d2b]' : 'text-[#2d2d2b]/40'}`} />
            </div>
            <input
              type="search"
              inputMode="decimal"
              id={randomAmountId}
              name={randomAmountId}
              min="1"
              step="any"
              autoComplete={`nope-${randomAmountId}`}
              data-lpignore="true"
              data-form-type="other"
              list="autocompleteOff"
              className="block w-full pl-10 pr-3 py-3 border-2 border-[#d9d3ce] rounded-xl outline-none focus:border-[#2d2d2b] focus:ring-4 focus:ring-[#2d2d2b]/10 sm:text-sm transition-all duration-300 bg-[#faf9f8] text-[#2d2d2b] font-medium placeholder:text-[#2d2d2b]/40 shadow-sm hover:shadow-md"
              placeholder="0.00"
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
          <p className="text-xs font-medium text-[#2d2d2b]/50 mt-2 px-1">
            Enter amount in Indian Rupees (₹)
          </p>
        </motion.div>

        <motion.div variants={itemVariants}>
          <label htmlFor={randomRemarksId} className="block text-sm font-bold text-[#2d2d2b] mb-1.5 uppercase tracking-wide">
            Remarks / Note
          </label>
          <motion.div 
            className="relative"
            animate={{ scale: focusedField === randomRemarksId ? 1.02 : 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MessageSquare className={`h-5 w-5 transition-colors duration-300 ${focusedField === randomRemarksId ? 'text-[#2d2d2b]' : 'text-[#2d2d2b]/40'}`} />
            </div>
            <input
              type="search"
              id={randomRemarksId}
              name={randomRemarksId}
              maxLength={30}
              autoComplete={`nope-${randomRemarksId}`}
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              data-lpignore="true"
              data-form-type="other"
              list="autocompleteOff"
              className="block w-full pl-10 pr-3 py-3 border-2 border-[#d9d3ce] rounded-xl outline-none focus:border-[#2d2d2b] focus:ring-4 focus:ring-[#2d2d2b]/10 sm:text-sm transition-all duration-300 bg-[#faf9f8] text-[#2d2d2b] font-medium placeholder:text-[#2d2d2b]/40 shadow-sm hover:shadow-md"
              placeholder="e.g. Rent"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              onFocus={() => setFocusedField(randomRemarksId)}
              onBlur={() => setFocusedField(null)}
            />
          </motion.div>
          <div className="flex justify-between items-center mt-2 px-1">
            <p className="text-xs font-medium text-[#2d2d2b]/50">
              Optional note for the receiver
            </p>
            <p className={`text-xs font-bold transition-colors ${remarks.length >= 30 ? 'text-red-500' : 'text-[#2d2d2b]/40'}`}>
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
