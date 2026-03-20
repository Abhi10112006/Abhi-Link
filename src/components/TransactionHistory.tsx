import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'motion/react';
import { X, History, IndianRupee, Trash2, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { PremiumBackground } from './PremiumBackground';
import { hapticMedium, hapticLight, hapticWarning, hapticScroll } from '../utils/haptics';

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
  onClearAll?: () => void;
  onDeleteTransaction: (id: string) => void;
  t: Record<string, string>;
}

interface MonthGroup {
  key: string;
  label: string;
  shortLabel: string;
  transactions: Transaction[];
}

// Parse DD/MM/YYYY → month group key YYYY-MM
function groupTransactionsByMonth(transactions: Transaction[]): MonthGroup[] {
  const groups = new Map<string, Transaction[]>();
  for (const tx of transactions) {
    const parts = tx.date.split('/');
    if (parts.length === 3 && /^\d+$/.test(parts[1]) && /^\d+$/.test(parts[2])) {
      const monthKey = `${parts[2]}-${parts[1].padStart(2, '0')}`;
      if (!groups.has(monthKey)) groups.set(monthKey, []);
      groups.get(monthKey)!.push(tx);
    }
  }
  const sortedEntries = [...groups.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  return sortedEntries.map(([key, txs]) => {
    const [year, month] = key.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    const label = date.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
    const shortLabel = date.toLocaleString('en-IN', { month: 'short' });
    return { key, label, shortLabel, transactions: txs };
  });
}

// Animated count-up number
const AnimatedNumber: React.FC<{ value: number }> = ({ value }) => {
  const mv = useMotionValue(0);
  const [display, setDisplay] = useState('0');
  useEffect(() => {
    const controls = animate(mv, value, { duration: 0.9, ease: [0.16, 1, 0.3, 1] });
    const unsub = mv.on('change', v => {
      setDisplay(Math.round(v).toLocaleString('en-IN'));
    });
    return () => { controls.stop(); unsub(); };
  }, [value, mv]);
  return <span>{display}</span>;
};

// Monthly summary card shown at the top of each month page
const MonthlySummaryCard: React.FC<{ month: MonthGroup; direction: number }> = ({ month, direction }) => {
  const totalSent = month.transactions
    .filter(tx => !tx.isReceiver && tx.amount)
    .reduce((sum, tx) => sum + parseFloat(tx.amount || '0'), 0);
  const totalReceived = month.transactions
    .filter(tx => tx.isReceiver && tx.amount)
    .reduce((sum, tx) => sum + parseFloat(tx.amount || '0'), 0);
  const sentCount = month.transactions.filter(tx => !tx.isReceiver).length;
  const receivedCount = month.transactions.filter(tx => tx.isReceiver).length;

  return (
    <motion.div
      key={month.key + '-summary'}
      initial={{ opacity: 0, x: direction * 40, scale: 0.97 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: -direction * 40, scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 300, damping: 26 }}
      className="w-full rounded-3xl overflow-hidden mb-4 relative"
      style={{ background: 'linear-gradient(135deg, #2d2d2b 0%, #1a1a18 100%)' }}
    >
      {/* Sacred geometry overlay */}
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg stroke='%23e6e1dc' stroke-width='0.8' fill='none'%3E%3Ccircle cx='40' cy='40' r='28'/%3E%3Ccircle cx='40' cy='40' r='18'/%3E%3Cpath d='M40 12 L40 68 M12 40 L68 40'/%3E%3Cpath d='M20 20 L60 60 M20 60 L60 20'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '80px 80px',
        }}
      />
      <div className="relative z-10 p-5">
        {/* Month label */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[#e6e1dc]/50 text-[10px] font-bold uppercase tracking-[0.2em] mb-0.5">
              Monthly Summary
            </p>
            <h2 className="text-[#e6e1dc] text-xl font-black tracking-tight leading-none">
              {month.label}
            </h2>
          </div>
          <div className="bg-[#e6e1dc]/10 border border-[#e6e1dc]/20 rounded-2xl px-3 py-1.5 text-right">
            <p className="text-[#e6e1dc] text-lg font-black leading-none">
              <AnimatedNumber value={month.transactions.length} />
            </p>
            <p className="text-[#e6e1dc]/50 text-[9px] font-bold uppercase tracking-widest mt-0.5">
              {month.transactions.length === 1 ? 'Transaction' : 'Transactions'}
            </p>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Sent */}
          <div className="bg-[#e6e1dc]/[0.08] border border-[#e6e1dc]/10 rounded-2xl p-3.5">
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-5 h-5 rounded-full bg-[#e6e1dc]/10 flex items-center justify-center">
                <ArrowUpRight className="w-3 h-3 text-[#e6e1dc]/60" />
              </div>
              <span className="text-[#e6e1dc]/60 text-[10px] font-bold uppercase tracking-widest">Sent</span>
            </div>
            <div className="flex items-start gap-0.5">
              <IndianRupee className="w-3.5 h-3.5 text-[#e6e1dc] mt-0.5 flex-shrink-0" />
              <span className="text-[#e6e1dc] text-lg font-black leading-none">
                <AnimatedNumber value={totalSent} />
              </span>
            </div>
            <p className="text-[#e6e1dc]/40 text-[10px] font-medium mt-1">
              {sentCount} {sentCount === 1 ? 'payment' : 'payments'}
            </p>
          </div>

          {/* Received */}
          <div className="bg-[#e6e1dc]/[0.08] border border-[#e6e1dc]/10 rounded-2xl p-3.5">
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-5 h-5 rounded-full bg-[#e6e1dc]/10 flex items-center justify-center">
                <ArrowDownLeft className="w-3 h-3 text-[#e6e1dc]/60" />
              </div>
              <span className="text-[#e6e1dc]/60 text-[10px] font-bold uppercase tracking-widest">Received</span>
            </div>
            <div className="flex items-start gap-0.5">
              <IndianRupee className="w-3.5 h-3.5 text-[#e6e1dc] mt-0.5 flex-shrink-0" />
              <span className="text-[#e6e1dc] text-lg font-black leading-none">
                <AnimatedNumber value={totalReceived} />
              </span>
            </div>
            <p className="text-[#e6e1dc]/40 text-[10px] font-medium mt-1">
              {receivedCount} {receivedCount === 1 ? 'receipt' : 'receipts'}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Swipeable card sub-component — uses motion drag for swipe-to-delete
const DRAG_CONSTRAINT = -240;
const DELETE_THRESHOLD = -220;

const SwipeableCard: React.FC<{
  tx: Transaction;
  index: number;
  onDelete: (id: string) => void;
}> = ({ tx, index, onDelete }) => {
  const x = useMotionValue(0);
  const deleteOpacity = useTransform(x, [DRAG_CONSTRAINT, -100, 0], [1, 0.5, 0]);
  const deleteIconScale = useTransform(x, [DELETE_THRESHOLD, -100, 0], [1, 0.7, 0.5]);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: { offset: { x: number } }) => {
    if (info.offset.x < DELETE_THRESHOLD) {
      hapticWarning();
      onDelete(tx.id);
    } else {
      animate(x, 0, { type: 'spring', stiffness: 400, damping: 30 });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ delay: index * 0.035, type: 'spring', stiffness: 260, damping: 22 }}
      className="relative overflow-hidden rounded-2xl"
    >
      {/* Delete background */}
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

      {/* Draggable card */}
      <motion.div
        drag="x"
        dragConstraints={{ left: DRAG_CONSTRAINT, right: 0 }}
        dragElastic={{ left: 0.08, right: 0 }}
        onDragEnd={handleDragEnd}
        style={{ x }}
        className="bg-white/70 backdrop-blur-md border border-gray-200/80 rounded-2xl p-3.5 shadow-sm cursor-grab active:cursor-grabbing touch-pan-y"
      >
        <div className="flex items-center gap-3">
          {/* Direction icon */}
          <div className="flex-shrink-0">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center ${tx.isReceiver ? 'bg-[#f0ece8] border border-[#d9d3ce]' : 'bg-[#2d2d2b]'}`}>
              {tx.isReceiver
                ? <ArrowDownLeft className="w-4 h-4 text-[#2d2d2b]" />
                : <ArrowUpRight className="w-4 h-4 text-[#e6e1dc]" />}
            </div>
          </div>

          {/* Name + UPI + remarks */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-[#2d2d2b] truncate leading-tight">
              {tx.payeeName || tx.payeeUpiId}
            </p>
            {tx.payeeName && (
              <p className="text-[10px] text-gray-400 font-medium truncate leading-tight">{tx.payeeUpiId}</p>
            )}
            {tx.remarks && (
              <p className="text-[10px] text-gray-400 italic truncate leading-tight">"{tx.remarks}"</p>
            )}
          </div>

          {/* Amount + time */}
          <div className="flex-shrink-0 text-right">
            {tx.amount ? (
              <div className="flex items-center justify-end gap-0.5">
                <IndianRupee className="w-3.5 h-3.5 text-[#2d2d2b]" />
                <span className="text-sm font-black text-[#2d2d2b]">{tx.amount}</span>
              </div>
            ) : (
              <span className="text-xs text-gray-400 font-medium">—</span>
            )}
            <p className="text-[10px] text-gray-400 font-medium mt-0.5">{tx.time}</p>
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
  onDeleteTransaction,
  t,
}) => {
  const [activeMonthIndex, setActiveMonthIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState(1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const swipeStartX = useRef<number | null>(null);
  const swipeStartY = useRef<number | null>(null);

  const monthGroups = groupTransactionsByMonth(transactions);

  // Reset to first month when transactions change
  useEffect(() => {
    setActiveMonthIndex(0);
  }, [transactions.length]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Scroll haptics
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

  const goToMonth = (index: number) => {
    if (index === activeMonthIndex) return;
    hapticLight();
    setSlideDirection(index > activeMonthIndex ? 1 : -1);
    setActiveMonthIndex(index);
    if (scrollRef.current) scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const SWIPE_THRESHOLD = 60;

  const handleSwipeStart = (e: React.TouchEvent) => {
    swipeStartX.current = e.touches[0].clientX;
    swipeStartY.current = e.touches[0].clientY;
  };

  const handleSwipeEnd = (e: React.TouchEvent) => {
    if (swipeStartX.current === null || swipeStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - swipeStartX.current;
    const dy = e.changedTouches[0].clientY - swipeStartY.current;
    swipeStartX.current = null;
    swipeStartY.current = null;
    if (Math.abs(dx) < SWIPE_THRESHOLD) return;
    if (Math.abs(dy) > Math.abs(dx)) return;
    if (dx < 0 && activeMonthIndex < monthGroups.length - 1) {
      goToMonth(activeMonthIndex + 1);
    } else if (dx > 0 && activeMonthIndex > 0) {
      goToMonth(activeMonthIndex - 1);
    }
  };

  const currentMonth = monthGroups[activeMonthIndex];

  return (
    <motion.div
      ref={scrollRef}
      className="fixed inset-0 z-50 flex flex-col items-center justify-start text-gray-900 overflow-y-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.25 } }}
      transition={{ duration: 0.2 }}
    >
      <PremiumBackground />

      {/* Sticky header */}
      <div className="sticky top-0 left-0 right-0 z-50 w-full bg-[#e6e1dc]/80 backdrop-blur-xl border-b border-[#d9d3ce]/60">
        {/* Title row */}
        <div className="w-full flex items-center px-4 sm:px-6 h-14 sm:h-16 relative">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            className="absolute left-1/2 -translate-x-1/2 text-2xl sm:text-3xl font-black tracking-tighter leading-none bg-clip-text text-transparent bg-gradient-to-b from-[#2d2d2b] to-[#8b7355] flex items-center gap-2 whitespace-nowrap"
          >
            <History className="w-6 h-6 sm:w-7 sm:h-7 text-[#8b7355] flex-shrink-0" />
            History
          </motion.h1>
          <motion.button
            onClick={() => { hapticMedium(); onClose(); }}
            className="ml-auto w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-full border border-[#d9d3ce] bg-white/50 hover:bg-white text-[#2d2d2b] shadow-sm backdrop-blur-sm transition-all group focus:outline-none focus-visible:outline-none"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22, delay: 0.05 }}
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
          >
            <X className="w-4 h-4 text-[#2d2d2b]/60 group-hover:text-[#2d2d2b] transition-colors" />
          </motion.button>
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-2xl px-4 sm:px-6 flex flex-col pt-4 pb-12">

        {transactions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22, delay: 0.1 }}
            className="flex flex-col items-center justify-center py-24 text-[#2d2d2b]/40"
          >
            <History className="w-14 h-14 mb-4 text-[#8b7355]/40" />
            <p className="text-sm font-black uppercase tracking-widest text-[#2d2d2b]/50">
              {t.noTransactions || 'No transactions yet'}
            </p>
            <p className="text-xs mt-2 font-medium text-[#2d2d2b]/30">
              {t.transactionsAppearHere || 'Your receipts will appear here'}
            </p>
          </motion.div>
        ) : (
          <>
            {/* Month summary + transaction list (animated per month) */}
            <div
              onTouchStart={handleSwipeStart}
              onTouchEnd={handleSwipeEnd}
            >
            <AnimatePresence mode="wait" custom={slideDirection}>
              {currentMonth && (
                <motion.div
                  key={currentMonth.key}
                  custom={slideDirection}
                  initial={{ opacity: 0, x: slideDirection * 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -slideDirection * 50 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                >
                  {/* Monthly summary card */}
                  <MonthlySummaryCard month={currentMonth} direction={slideDirection} />

                  {/* Transaction list */}
                  <AnimatePresence>
                    <div className="space-y-2">
                      {currentMonth.transactions.map((tx, index) => (
                        <SwipeableCard
                          key={tx.id}
                          tx={tx}
                          index={index}
                          onDelete={onDeleteTransaction}
                        />
                      ))}
                    </div>
                  </AnimatePresence>

                  {/* Page indicator dots */}
                  {monthGroups.length > 1 && (
                    <div className="flex items-center justify-center gap-1.5 mt-6">
                      {monthGroups.map((_, i) => (
                        <motion.button
                          key={i}
                          onClick={() => goToMonth(i)}
                          className="rounded-full focus:outline-none"
                          style={{ background: i === activeMonthIndex ? '#2d2d2b' : 'rgba(45,45,43,0.2)', height: 6 }}
                          animate={{ width: i === activeMonthIndex ? 20 : 6 }}
                          whileTap={{ scale: 0.8 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                        />
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};
