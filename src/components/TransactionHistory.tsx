import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'motion/react';
import { X, History, IndianRupee, Trash2, AlertTriangle, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { PremiumBackground } from './PremiumBackground';
import { hapticMedium, hapticHeavy, hapticWarning, hapticScroll } from '../utils/haptics';

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

// Swipeable card sub-component — uses motion drag for swipe-to-delete
const DRAG_CONSTRAINT = -240; // max drag distance in px
const DELETE_THRESHOLD = -220; // must swipe nearly to the end to confirm delete

const SwipeableCard: React.FC<{
  tx: Transaction;
  index: number;
  onDelete: (id: string) => void;
}> = ({ tx, index, onDelete }) => {
  const x = useMotionValue(0);
  // Reveal the premium delete background only as the card nears the full swipe end
  const deleteOpacity = useTransform(x, [DRAG_CONSTRAINT, -100, 0], [1, 0.5, 0]);
  const deleteIconScale = useTransform(x, [DELETE_THRESHOLD, -100, 0], [1, 0.7, 0.5]);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: { offset: { x: number } }) => {
    if (info.offset.x < DELETE_THRESHOLD) {
      // Swiped to the end — delete immediately, no confirmation needed
      hapticWarning();
      onDelete(tx.id);
    } else {
      // Not far enough — spring back to original position
      animate(x, 0, { type: 'spring', stiffness: 400, damping: 30 });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ delay: index * 0.04, type: 'spring', stiffness: 260, damping: 22 }}
      className="relative overflow-hidden rounded-2xl"
    >
      {/* Delete background revealed on swipe */}
      <motion.div
        style={{ opacity: deleteOpacity }}
        className="absolute inset-0 bg-[#2d2d2b] flex items-center justify-end pr-5 rounded-2xl pointer-events-none"
        aria-hidden={true}
      >
        <motion.div style={{ scale: deleteIconScale }} className="flex items-center gap-2">
          <Trash2 className="w-4 h-4 text-[#e6e1dc]" />
          <span className="text-[#e6e1dc] font-bold text-xs uppercase tracking-widest">Delete</span>
        </motion.div>
      </motion.div>

      {/* The draggable card itself */}
      <motion.div
        drag="x"
        dragConstraints={{ left: DRAG_CONSTRAINT, right: 0 }}
        dragElastic={{ left: 0.08, right: 0 }}
        onDragEnd={handleDragEnd}
        style={{ x }}
        className="bg-white/70 backdrop-blur-md border border-gray-200 rounded-2xl p-4 shadow-sm cursor-grab active:cursor-grabbing touch-pan-y"
      >
        {/* Strict 3-column flexbox layout */}
        <div className="flex items-center gap-3">
          {/* Column 1: Direction indicator */}
          <div className="flex-shrink-0">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center ${tx.isReceiver ? 'bg-[#f0ece8] border border-[#d9d3ce]' : 'bg-[#2d2d2b]'}`}>
              {tx.isReceiver
                ? <ArrowDownLeft className="w-4 h-4 text-[#2d2d2b]" />
                : <ArrowUpRight className="w-4 h-4 text-[#e6e1dc]" />}
            </div>
          </div>

          {/* Column 2: Payee name, UPI ID, remarks */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-gray-900 truncate">
              {tx.payeeName || tx.payeeUpiId}
            </p>
            {tx.payeeName && (
              <p className="text-xs text-gray-400 font-medium truncate">{tx.payeeUpiId}</p>
            )}
            {tx.remarks && (
              <p className="text-xs text-gray-400 italic truncate">"{tx.remarks}"</p>
            )}
          </div>

          {/* Column 3: Amount, date, time — all right-aligned */}
          <div className="flex-shrink-0 text-right">
            {tx.amount ? (
              <div className="flex items-center justify-end gap-0.5">
                <IndianRupee className="w-3.5 h-3.5 text-gray-900" />
                <span className="text-sm font-black text-gray-900">{tx.amount}</span>
              </div>
            ) : (
              <span className="text-xs text-gray-400 font-medium">—</span>
            )}
            <p className="text-[10px] text-gray-400 font-medium mt-0.5">{tx.date}</p>
            <p className="text-[10px] text-gray-400 font-medium">{tx.time}</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  isOpen,
  onClose,
  transactions,
  onClearAll,
  onDeleteTransaction,
  t,
}) => {
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Close confirmation if modal closes
  useEffect(() => {
    if (!isOpen) {
      setShowClearAllConfirm(false);
    }
  }, [isOpen]);

  // Scroll haptic feedback
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let lastScrollY = el.scrollTop;
    const SCROLL_THRESHOLD = 40;
    const onScroll = () => {
      const delta = Math.abs(el.scrollTop - lastScrollY);
      if (delta >= SCROLL_THRESHOLD) {
        hapticScroll();
        lastScrollY = el.scrollTop;
      }
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  });

  return (
    <motion.div
      ref={scrollRef}
      className="fixed inset-0 z-50 flex flex-col items-center justify-start text-gray-900 overflow-y-auto"
      initial="hidden"
      animate="show"
      exit="exit"
      variants={container}
    >
      <PremiumBackground />

      {/* Top bar: title + close button animate together as one unit */}
      <motion.div
        variants={item}
        className="sticky top-0 left-0 right-0 z-50 w-full h-16 sm:h-20 flex items-center px-6 sm:px-10 relative"
      >
        {/* Title: absolutely centered relative to the full bar width */}
        <h1 className="absolute left-1/2 -translate-x-1/2 text-4xl sm:text-6xl font-black tracking-tighter leading-none bg-clip-text text-transparent bg-gradient-to-b from-gray-900 to-gray-500 flex items-center gap-3 whitespace-nowrap">
          <History className="w-9 h-9 sm:w-12 sm:h-12 text-gray-700 flex-shrink-0" />
          History
        </h1>
        {/* Close button: pushed to the right */}
        <motion.button
          onClick={() => { hapticMedium(); onClose(); }}
          className="ml-auto w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 flex items-center justify-center rounded-full border border-gray-200 bg-white/50 hover:bg-white text-gray-900 shadow-sm backdrop-blur-sm transition-all group focus:outline-none focus-visible:outline-none"
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
        >
          <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500 group-hover:text-gray-900 transition-colors" />
        </motion.button>
      </motion.div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-2xl px-4 sm:px-6 flex flex-col mt-6 sm:mt-10 pb-12">

        {/* Actions row */}
        {transactions.length > 0 && (
          <motion.div variants={item} className="flex justify-end mb-4 flex-shrink-0">
            <motion.button
              onClick={() => { hapticMedium(); setShowClearAllConfirm(true); }}
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
        <motion.div variants={item} className="w-full">
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
                  <SwipeableCard
                    key={tx.id}
                    tx={tx}
                    index={index}
                    onDelete={onDeleteTransaction}
                  />
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
              onClick={() => { hapticMedium(); setShowClearAllConfirm(false); }}
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
                  onClick={() => { hapticMedium(); setShowClearAllConfirm(false); }} hover:bg-[#d9d3ce] border border-[#d9d3ce] hover:border-[#2d2d2b] transition-colors uppercase tracking-wide"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={() => {
                    hapticWarning();
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
    </motion.div>
  );
};
