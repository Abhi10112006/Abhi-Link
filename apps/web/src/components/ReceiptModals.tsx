import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, ArrowRight } from 'lucide-react';

interface ReceiptConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isReceiver: boolean;
  t: Record<string, string>;
}

export const ReceiptConfirmationModal: React.FC<ReceiptConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isReceiver,
  t,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
        >
          <div className="p-6">
            <h3 className="text-xl font-bold text-[#2d2d2b] mb-2">
              {t.moneyArrivedTitle}
            </h3>
            <p className="text-[#2d2d2b]/70 mb-6">
              {t.checkBankMessage}
            </p>
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className="flex-1 px-4 py-3 rounded-xl font-bold text-[#2d2d2b] bg-[#f5f5f0] hover:bg-[#e6e1dc] transition-colors"
              >
                {t.waitCheck}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onConfirm}
                className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-[#2d2d2b] hover:bg-black transition-colors flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5" />
                {t.yesGenerate}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

interface PaymentCompletedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  t: Record<string, string>;
}

export const PaymentCompletedModal: React.FC<PaymentCompletedModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  t,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
        >
          <div className="p-6">
            <h3 className="text-xl font-bold text-[#2d2d2b] mb-2">
              {t.paymentCompletedTitle}
            </h3>
            <p className="text-[#2d2d2b]/70 mb-6">
              {t.paymentCompletedMessage}
            </p>
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className="flex-1 px-4 py-3 rounded-xl font-bold text-[#2d2d2b] bg-[#f5f5f0] hover:bg-[#e6e1dc] transition-colors"
              >
                {t.notYet}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onConfirm}
                className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-[#2d2d2b] hover:bg-black transition-colors flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5" />
                {t.yesItsDone}
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

interface SenderNameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
  t: Record<string, string>;
  isLoading?: boolean;
}

export const SenderNameModal: React.FC<SenderNameModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  t,
  isLoading = false,
}) => {
  const [name, setName] = React.useState('');
  const [inputId] = React.useState(() => `sender_${Math.random().toString(36).slice(2, 9)}`);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && !isLoading) {
      onSubmit(name);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
        >
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-[#2d2d2b]">
                {t.senderNameTitle}
              </h3>
              <button onClick={onClose} className="text-[#2d2d2b]/50 hover:text-[#2d2d2b]">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label className="block text-sm font-bold text-[#2d2d2b]/70 mb-2 uppercase tracking-wide">
                  {t.enterSenderNameLabel}
                </label>
                <input
                  type="search"
                  id={inputId}
                  name={inputId}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#f5f5f0] border-2 border-[#d9d3ce] focus:border-[#2d2d2b] focus:outline-none font-bold text-[#2d2d2b] placeholder-[#2d2d2b]/30 transition-colors"
                  placeholder={t.senderNamePlaceholder}
                  autoFocus
                  disabled={isLoading}
                  autoComplete={`nope-${inputId}`}
                  aria-autocomplete="none"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  data-lpignore="true"
                  data-form-type="other"
                />
              </div>
              <motion.button
                whileHover={!isLoading ? { scale: 1.02 } : {}}
                whileTap={!isLoading ? { scale: 0.98 } : {}}
                type="submit"
                disabled={!name.trim() || isLoading}
                className="w-full px-4 py-3 rounded-xl font-bold text-white bg-[#2d2d2b] hover:bg-black transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center gap-3">
                    <div className="relative flex items-center justify-center w-5 h-5">
                      <motion.span 
                        className="absolute w-full h-full border-2 border-white/20 border-t-white rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                      <motion.span 
                        className="absolute w-1.5 h-1.5 bg-white rounded-full"
                        animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                      />
                    </div>
                    <span className="font-black tracking-widest text-sm text-white">GENERATING</span>
                  </div>
                ) : (
                  t.generateAndShare
                )}
              </motion.button>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
