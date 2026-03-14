import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, History, IndianRupee, Trash2, AlertTriangle } from 'lucide-react';
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
      className="fixed inset-0 z-50 flex flex-col items-center justify-start text-gray-900 overflow-hidden"
      initial="hidden"
      animate="show"
      exit="exit"
      variants={container}
    >
      <PremiumBackground />

      {/* Top bar: centered title + close button at the same vertical height */}
      <div className="absolute top-6 sm:top-10 left-0 right-0 z-50 h-14 flex items-center px-6 sm:px-10">
        {/* Left spacer matches close button width so title is truly centered */}
        <div className="w-14 flex-shrink-0" />
        <motion.h1
          className="flex-1 text-center text-base sm:text-lg font-black tracking-tight text-gray-900 uppercase flex items-center justify-center gap-2"
          variants={item}
        >
          <History className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 flex-shrink-0" />
          {t.transactionHistory || 'Transaction History'}
        </motion.h1>
        <motion.button
          onClick={onClose}
          className="w-14 h-14 flex-shrink-0 flex items-center justify-center rounded-full border border-gray-200 bg-white/50 hover:bg-white transition-colors group shadow-sm focus:outline-none focus-visible:outline-none"
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1, transition: { delay: 0.8 } }}
        >
          <X className="w-6 h-6 text-gray-500 group-hover:text-gray-900 transition-colors" />
        </motion.button>
      </div>

      {/* Main content — top padding clears the fixed header bar */}
      <div className="relative z-10 w-full max-w-2xl px-4 sm:px-6 flex flex-col h-full pt-24 sm:pt-28 pb-12">

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
          className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent"
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
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 12 }}
                    transition={{ delay: index * 0.04, type: 'spring', stiffness: 260, damping: 22 }}
                    className="bg-white/60 backdrop-blur-md border border-gray-200 rounded-2xl p-4 hover:bg-white/80 hover:border-gray-300 transition-colors shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${tx.isReceiver ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                            {tx.isReceiver ? (t.txReceived || 'Received') : (t.txPaid || 'Paid')}
                          </span>
                        </div>
                        <p className="text-sm font-black text-gray-900 truncate">
                          {tx.payeeName || tx.payeeUpiId}
                        </p>
                        {tx.payeeName && (
                          <p className="text-xs text-gray-400 font-medium truncate">{tx.payeeUpiId}</p>
                        )}
                        {tx.remarks && (
                          <p className="text-xs text-gray-500 italic mt-0.5 truncate">"{tx.remarks}"</p>
                        )}
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="text-right flex-shrink-0">
                          {tx.amount ? (
                            <div className="flex items-center gap-0.5 justify-end">
                              <IndianRupee className="w-4 h-4 text-gray-900 font-black" />
                              <span className="text-base font-black text-gray-900">{tx.amount}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 font-medium">No amount</span>
                          )}
                          <p className="text-[10px] text-gray-400 font-medium mt-0.5">{tx.date}</p>
                          <p className="text-[10px] text-gray-400 font-medium">{tx.time}</p>
                        </div>
                        <motion.button
                          onClick={() => setPendingDeleteId(tx.id)}
                          className="p-1.5 rounded-full text-gray-300 hover:text-[#2d2d2b] hover:bg-[#e6e1dc] transition-colors flex-shrink-0 mt-0.5"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
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
