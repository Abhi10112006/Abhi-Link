import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, History, IndianRupee, Trash2, AlertTriangle } from 'lucide-react';

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

  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <motion.div
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden border border-gray-200"
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-[#2d2d2b]" />
            <h2 className="text-lg font-black text-[#2d2d2b] uppercase tracking-tight">
              {t.transactionHistory || 'Transaction History'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {transactions.length > 0 && (
              <motion.button
                onClick={() => setShowClearAllConfirm(true)}
                className="flex items-center gap-1.5 text-xs font-bold text-[#2d2d2b] hover:text-[#2d2d2b] bg-[#f0ece8] hover:bg-[#d9d3ce] px-3 py-1.5 rounded-full transition-colors border border-[#d9d3ce] hover:border-[#2d2d2b]"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Trash2 className="w-3 h-3" />
                {t.clearAll || 'Clear All'}
              </motion.button>
            )}
            <motion.button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-900"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-[#d9d3ce] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
          {transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-[#2d2d2b]/30">
              <History className="w-12 h-12 mb-3" />
              <p className="text-sm font-bold uppercase tracking-wide">
                {t.noTransactions || 'No transactions yet'}
              </p>
              <p className="text-xs mt-1 font-medium">
                {t.transactionsAppearHere || 'Your receipts will appear here'}
              </p>
            </div>
          ) : (
            <AnimatePresence>
              <div className="space-y-2">
                {transactions.map((tx, index) => (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className="bg-[#faf9f8] border border-[#d9d3ce] rounded-2xl p-4 hover:border-[#2d2d2b]/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${tx.isReceiver ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                            {tx.isReceiver ? (t.txReceived || 'Received') : (t.txPaid || 'Paid')}
                          </span>
                        </div>
                        <p className="text-sm font-black text-[#2d2d2b] truncate">
                          {tx.payeeName || tx.payeeUpiId}
                        </p>
                        {tx.payeeName && (
                          <p className="text-xs text-[#2d2d2b]/50 font-medium truncate">{tx.payeeUpiId}</p>
                        )}
                        {tx.remarks && (
                          <p className="text-xs text-[#2d2d2b]/60 italic mt-0.5 truncate">"{tx.remarks}"</p>
                        )}
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="text-right flex-shrink-0">
                        {tx.amount ? (
                          <div className="flex items-center gap-0.5 justify-end">
                            <IndianRupee className="w-4 h-4 text-[#2d2d2b] font-black" />
                            <span className="text-base font-black text-[#2d2d2b]">{tx.amount}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-[#2d2d2b]/40 font-medium">No amount</span>
                        )}
                        <p className="text-[10px] text-[#2d2d2b]/40 font-medium mt-0.5">{tx.date}</p>
                        <p className="text-[10px] text-[#2d2d2b]/40 font-medium">{tx.time}</p>
                        </div>
                        <motion.button
                          onClick={() => setPendingDeleteId(tx.id)}
                          className="p-1.5 rounded-full text-[#2d2d2b]/30 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0 mt-0.5"
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
        </div>
        {/* Clear All confirmation overlay */}
        <AnimatePresence>
          {showClearAllConfirm && (
            <motion.div
              className="absolute inset-0 z-10 flex items-end justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div
                className="absolute inset-0 bg-[#faf9f8]/80 backdrop-blur-[2px]"
                onClick={() => setShowClearAllConfirm(false)}
              />
              <motion.div
                className="relative w-full bg-white rounded-3xl border border-[#d9d3ce] shadow-2xl p-6 flex flex-col gap-4"
                initial={{ y: 40, opacity: 0, scale: 0.97 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 40, opacity: 0, scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 340, damping: 28 }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Icon */}
                <div className="flex justify-center">
                  <div className="w-12 h-12 rounded-full bg-[#f0ece8] flex items-center justify-center border border-[#d9d3ce]">
                    <AlertTriangle className="w-5 h-5 text-[#2d2d2b]" />
                  </div>
                </div>
                {/* Title & description */}
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
                {/* Actions */}
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
              className="absolute inset-0 z-10 flex items-end justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div
                className="absolute inset-0 bg-[#faf9f8]/80 backdrop-blur-[2px]"
                onClick={() => setPendingDeleteId(null)}
              />
              <motion.div
                className="relative w-full bg-white rounded-3xl border border-[#d9d3ce] shadow-2xl p-6 flex flex-col gap-4"
                initial={{ y: 40, opacity: 0, scale: 0.97 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 40, opacity: 0, scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 340, damping: 28 }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Icon */}
                <div className="flex justify-center">
                  <div className="w-12 h-12 rounded-full bg-[#f0ece8] flex items-center justify-center border border-[#d9d3ce]">
                    <AlertTriangle className="w-5 h-5 text-[#2d2d2b]" />
                  </div>
                </div>
                {/* Title & description */}
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
                {/* Actions */}
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
    </motion.div>
  );
};
