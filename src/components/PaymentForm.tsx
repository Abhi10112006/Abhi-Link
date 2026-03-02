import React, { useState } from 'react';
import { IndianRupee, MessageSquare, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PaymentFormProps {
  upiId: string;
  setUpiId: (value: string) => void;
  payeeName: string;
  setPayeeName: (value: string) => void;
  amount: string;
  setAmount: (value: string) => void;
  remarks: string;
  setRemarks: (value: string) => void;
  saveDetails: boolean;
  setSaveDetails: (value: boolean) => void;
  showUpiError: boolean;
  setTouchedUpiId: (value: boolean) => void;
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
  saveDetails,
  setSaveDetails,
  showUpiError,
  setTouchedUpiId,
}) => {
  // Autofill prevention state
  const [randomUpiId] = useState(() => `edit_${Math.random().toString(36).slice(2, 9)}`);
  const [randomPayeeId] = useState(() => `edit_${Math.random().toString(36).slice(2, 9)}`);
  const [randomAmountId] = useState(() => `edit_${Math.random().toString(36).slice(2, 9)}`);
  const [randomRemarksId] = useState(() => `edit_${Math.random().toString(36).slice(2, 9)}`);

  const [focusedField, setFocusedField] = useState<string | null>(null);

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
        
        <motion.div variants={itemVariants}>
          <label htmlFor={randomUpiId} className="block text-sm font-bold text-[#2d2d2b] mb-1.5 uppercase tracking-wide">
            UPI ID (VPA) <span className="text-red-500">*</span>
          </label>
          <motion.div 
            className="relative"
            animate={{ scale: focusedField === randomUpiId ? 1.02 : 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
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
              onChange={(e) => {
                setUpiId(e.target.value);
                setTouchedUpiId(false); // Reset touched state while typing
              }}
              onFocus={() => setFocusedField(randomUpiId)}
              onBlur={() => {
                setFocusedField(null);
                setTouchedUpiId(true); // Validate when user clicks away
              }}
            />
          </motion.div>
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
              onBlur={() => setFocusedField(null)}
            />
          </motion.div>
          
          <div className="flex items-center mt-4">
            <input
              type="checkbox"
              id="saveDetails"
              checked={saveDetails}
              onChange={(e) => setSaveDetails(e.target.checked)}
              className="h-4 w-4 text-[#2d2d2b] focus:ring-[#2d2d2b] border-2 border-[#d9d3ce] rounded transition-colors cursor-pointer"
            />
            <label htmlFor="saveDetails" className="ml-2 block text-xs font-bold text-[#2d2d2b]/70 uppercase tracking-wide cursor-pointer select-none">
              Save details for next time
            </label>
          </div>
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
              onChange={(e) => setAmount(e.target.value)}
              onFocus={() => setFocusedField(randomAmountId)}
              onBlur={() => setFocusedField(null)}
            />
          </motion.div>
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
              placeholder="e.g. Rent (Max 30 chars)"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              onFocus={() => setFocusedField(randomRemarksId)}
              onBlur={() => setFocusedField(null)}
            />
          </motion.div>
        </motion.div>
      </motion.form>
    </div>
  );
};
