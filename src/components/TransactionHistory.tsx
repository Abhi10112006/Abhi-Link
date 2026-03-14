import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, History, IndianRupee, Trash2, AlertTriangle, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { PremiumBackground } from './PremiumBackground';

export interface Transaction {
  id: string;
  payeeName: string;
  payeeUpiId: string;
  amount: string;
  remarks: string;
  date: string;
  time: string;
  isReceiver: boolean;
}

interface TransactionHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  onClearAll: () => void;
  onDeleteTransaction: (id: string) => void;
  t: Record<string, string>;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.15 }
  },
  exit: { opacity: 0, transition: { duration: 0.35, ease: 'easeInOut' } }
};

const item = {
  hidden: { opacity: 0, y: 40, filter: 'blur(10px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { type: 'spring', stiffness: 200, damping: 20 }
  }
};

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  isOpen,
  onClose,
  transactions,
  onClearAll,
  onDeleteTransaction,
  t,
}) => {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Close confirmations if modal closes
  useEffect(() => {
    if (!isOpen) {
      setPendingDeleteId(null);
      setShowClearAllConfirm(false);
    }
  }, [isOpen]);

  const pendingTx = pendingDeleteId
    ? transactions.find(tx => tx.id === pendingDeleteId)
    : null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-start text-gray-900 overflow-y-auto"
      initial="hidden"
      animate="show"
      exit="exit"
      variants={container}
    >
      <PremiumBackground />

      {/* Top bar: title is absolutely centered; X button sits on the right */}
      <div className="sticky top-0 left-0 right-0 z-50 w-full h-16 sm:h-20 flex items-center px-6 sm:px-10 relative">
        {/* Title: absolutely centered relative to the full bar width */}
        <motion.h1
          className="absolute left-1/2 -translate-x-1/2 text-4xl sm:text-6xl font-black tracking-tighter leading-none bg-clip-text text-transparent bg-gradient-to-b from-gray-900 to-gray-500 flex items-center gap-3 whitespace-nowrap"
          variants={item}
        >
          <History className="w-9 h-9 sm:w-12 sm:h-12 text-gray-700 flex-shrink-0" />
          History
        </motion.h1>
        {/* Close button: pushed to the right by ml-auto */}
        <motion.button
          onClick={onClose}
          variants={item}
          className="ml-auto w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full border border-gray-200 bg-white/50 hover:bg-white text-gray-900 shadow-sm backdrop-blur-sm transition-all group focus:outline-none focus-visible:outline-none"
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
        >
          <X className="w-5 h-5 text-gray-500 group-hover:text-gray-900 transition-colors" />
        </motion.button>
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-2xl px-4 sm:px-6 flex flex-col mt-6 sm:mt-10 pb-12">

        {/* Actions row */}
        {transactions.length > 0 && (
          <motion.div variants={item} className="flex justify-end mb-4 flex-shrink-0">
            <motion.button
              onClick={() => setShowClearAllConfirm(true)}
              className="flex items-center gap-1.5 text-xs font-bold text-[#2d2d2b] bg-white/60 hover:bg-white px-4 py-2 rounded-full transition-colors border border-gray-200 backdrop-blur-md shadow-sm"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Trash2 className="w-3 h-3" />
              {t.clearAll || 'Clear All'}
            </motion.button>
          </motion.div>
        )}

        {/* Transaction list */}
        <motion.div
          variants={item}
          className="w-full"
        >
          {transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-400">
              <History className="w-14 h-14 mb-4" />
              <p className="text-sm font-bold uppercase tracking-widest">
                {t.noTransactions || 'No transactions yet'}
              </p>
              <p className="text-xs mt-2 font-medium text-gray-400">
                {t.transactionsAppearHere || 'Your receipts will appear here'}
              </p>
            </div>
          ) : (
            <AnimatePresence>
              <div className="space-y-2 pb-6">
                {transactions.map((tx, index) => (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ delay: index * 0.04, type: 'spring', stiffness: 260, damping: 22 }}
                    whileHover={{ y: -2, scale: 1.012, transition: { type: 'spring', stiffness: 400, damping: 25 } }}
                    whileTap={{ y: 0, scale: 0.985, transition: { type: 'spring', stiffness: 400, damping: 30 } }}
                    className="bg-white/70 backdrop-blur-md border border-gray-200 rounded-2xl p-4 shadow-sm"
                    style={{ willChange: 'transform' }}
                  >
                    {/* Row 1: direction badge (left) + amount (right) */}
                    <div className="flex items-center justify-between mb-2.5">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${tx.isReceiver ? 'bg-[#f0ece8] text-[#2d2d2b] border-[#d9d3ce]' : 'bg-[#2d2d2b] text-[#e6e1dc] border-[#2d2d2b]'}`}>
                        {tx.isReceiver
                          ? <ArrowDownLeft className="w-2.5 h-2.5 flex-shrink-0" />
                          : <ArrowUpRight className="w-2.5 h-2.5 flex-shrink-0" />}
                        {tx.isReceiver ? (t.txReceived || 'Received') : (t.txPaid || 'Paid')}
                      </span>
                      {tx.amount ? (
                        <div className="flex items-center gap-0.5">
                          <IndianRupee className="w-4 h-4 text-gray-900" />
                          <span className="text-base font-black text-gray-900">{tx.amount}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 font-medium" aria-label="No amount specified">—</span>
                      )}
                    </div>

                    {/* Row 2: payee name (left) + date (right) */}
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-sm font-black text-gray-900 truncate flex-1 min-w-0">
                        {tx.payeeName || tx.payeeUpiId}
                      </p>
                      <p className="text-[10px] text-gray-400 font-medium flex-shrink-0 whitespace-nowrap">
                        {tx.date}
                      </p>
                    </div>

                    {/* Row 3: UPI / remarks (left) + time + delete (right) */}
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <div className="flex-1 min-w-0">
                        {tx.payeeName && (
                          <p className="text-xs text-gray-400 font-medium truncate">{tx.payeeUpiId}</p>
                        )}
                        {tx.remarks && (
                          <p className="text-xs text-gray-400 italic truncate">"{tx.remarks}"</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <p className="text-[10px] text-gray-400 font-medium whitespace-nowrap">{tx.time}</p>
                        <motion.button
                          onClick={(e) => { e.stopPropagation(); setPendingDeleteId(tx.id); }}
                          className="p-1.5 rounded-full text-gray-300 hover:text-[#2d2d2b] hover:bg-[#e6e1dc] transition-colors"
                          whileHover={{ scale: 1.15 }}
                          whileTap={{ scale: 0.88 }}
                          title="Delete transaction"
                          aria-label={`Delete transaction for ${tx.payeeName || tx.payeeUpiId}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          )}
        </motion.div>
      </div>

      {/* Clear All confirmation overlay */}
      <AnimatePresence>
        {showClearAllConfirm && (
          <motion.div
            className="fixed inset-0 z-60 flex items-end justify-center p-4 sm:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-black/30"
              onClick={() => setShowClearAllConfirm(false)}
            />
            <motion.div
              className="relative w-full max-w-sm bg-white rounded-3xl border border-gray-200 shadow-2xl p-6 flex flex-col gap-4"
              initial={{ y: 40, opacity: 0, scale: 0.97 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 40, opacity: 0, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 340, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-center">
                <div className="w-12 h-12 rounded-full bg-[#f0ece8] flex items-center justify-center border border-[#d9d3ce]">
                  <AlertTriangle className="w-5 h-5 text-[#2d2d2b]" />
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-base font-black text-[#2d2d2b] uppercase tracking-tight mb-1">
                  Clear All Transactions?
                </h3>
                <p className="text-xs text-[#2d2d2b]/60 font-medium leading-relaxed">
                  This will permanently delete all{' '}
                  <span className="font-black text-[#2d2d2b]">{transactions.length}</span>{' '}
                  {transactions.length === 1 ? 'transaction' : 'transactions'} from your history. This action cannot be undone.
                </p>
              </div>
              <div className="flex gap-2">
                <motion.button
                  onClick={() => setShowClearAllConfirm(false)}
                  className="flex-1 py-2.5 rounded-2xl text-sm font-bold text-[#2d2d2b] bg-[#f0ece8] hover:bg-[#d9d3ce] border border-[#d9d3ce] hover:border-[#2d2d2b] transition-colors uppercase tracking-wide"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={() => {
                    onClearAll();
                    setShowClearAllConfirm(false);
                  }}
                  className="flex-1 py-2.5 rounded-2xl text-sm font-bold text-[#e6e1dc] bg-[#2d2d2b] hover:bg-[#1a1a18] border border-[#2d2d2b] transition-colors uppercase tracking-wide flex items-center justify-center gap-1.5"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear All
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Per-transaction delete confirmation overlay */}
      <AnimatePresence>
        {pendingDeleteId && pendingTx && (
          <motion.div
            className="fixed inset-0 z-60 flex items-end justify-center p-4 sm:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-black/30"
              onClick={() => setPendingDeleteId(null)}
            />
            <motion.div
              className="relative w-full max-w-sm bg-white rounded-3xl border border-gray-200 shadow-2xl p-6 flex flex-col gap-4"
              initial={{ y: 40, opacity: 0, scale: 0.97 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 40, opacity: 0, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 340, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-center">
                <div className="w-12 h-12 rounded-full bg-[#f0ece8] flex items-center justify-center border border-[#d9d3ce]">
                  <AlertTriangle className="w-5 h-5 text-[#2d2d2b]" />
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-base font-black text-[#2d2d2b] uppercase tracking-tight mb-1">
                  Delete Transaction?
                </h3>
                <p className="text-xs text-[#2d2d2b]/60 font-medium leading-relaxed">
                  This will permanently remove the transaction for{' '}
                  <span className="font-black text-[#2d2d2b]">
                    {pendingTx.payeeName || pendingTx.payeeUpiId}
                  </span>
                  {pendingTx.amount ? ` (₹${pendingTx.amount})` : ''}.
                </p>
              </div>
              <div className="flex gap-2">
                <motion.button
                  onClick={() => setPendingDeleteId(null)}
                  className="flex-1 py-2.5 rounded-2xl text-sm font-bold text-[#2d2d2b] bg-[#f0ece8] hover:bg-[#d9d3ce] border border-[#d9d3ce] hover:border-[#2d2d2b] transition-colors uppercase tracking-wide"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={() => {
                    onDeleteTransaction(pendingDeleteId);
                    setPendingDeleteId(null);
                  }}
                  className="flex-1 py-2.5 rounded-2xl text-sm font-bold text-[#e6e1dc] bg-[#2d2d2b] hover:bg-[#1a1a18] border border-[#2d2d2b] transition-colors uppercase tracking-wide flex items-center justify-center gap-1.5"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
