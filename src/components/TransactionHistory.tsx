import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'motion/react';
import { X, History, IndianRupee, Trash2, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownLeft, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';

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
  t: Record<string, string>;
}

// ─── Animated Counter ────────────────────────────────────────────────────────
const AnimatedNumber: React.FC<{ value: number; prefix?: string; decimals?: number }> = ({
  value,
  prefix = '',
  decimals = 0,
}) => {
  const motionVal = useMotionValue(0);
  const rounded = useTransform(motionVal, (v) =>
    `${prefix}${v.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
  );
  const [display, setDisplay] = useState(`${prefix}0`);

  useEffect(() => {
    const unsubscribe = rounded.on('change', setDisplay);
    const controls = animate(motionVal, value, {
      duration: 1.2,
      ease: [0.16, 1, 0.3, 1],
    });
    return () => {
      controls.stop();
      unsubscribe();
    };
  }, [value, motionVal, rounded]);

  return <span>{display}</span>;
};

// ─── Month helpers ────────────────────────────────────────────────────────────
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// date string is DD/MM/YYYY
const parseMonthKey = (dateStr: string): string => {
  const parts = dateStr.split('/');
  if (parts.length !== 3) return '00/0000';
  return `${parts[1]}/${parts[2]}`; // MM/YYYY
};

const monthKeyToLabel = (key: string): string => {
  const [mm, yyyy] = key.split('/');
  const idx = parseInt(mm, 10) - 1;
  return `${MONTH_NAMES[idx] ?? mm} ${yyyy}`;
};

const monthKeyToShortLabel = (key: string): string => {
  const [mm, yyyy] = key.split('/');
  const idx = parseInt(mm, 10) - 1;
  const short = MONTH_NAMES[idx]?.slice(0, 3) ?? mm;
  return `${short} '${yyyy.slice(2)}`;
};

// Sort keys: most recent month first
const sortMonthKeys = (keys: string[]): string[] =>
  [...keys].sort((a, b) => {
    const [am, ay] = a.split('/').map(Number);
    const [bm, by] = b.split('/').map(Number);
    if (ay !== by) return by - ay;
    return bm - am;
  });

interface MonthSummary {
  received: number;
  sent: number;
  net: number;
  count: number;
}

const computeSummary = (txs: Transaction[]): MonthSummary => {
  let received = 0;
  let sent = 0;
  for (const tx of txs) {
    const amt = parseFloat(tx.amount) || 0;
    if (tx.isReceiver) received += amt;
    else sent += amt;
  }
  return { received, sent, net: received - sent, count: txs.length };
};

// ─── Month Summary Card ───────────────────────────────────────────────────────
const MonthlySummaryCard: React.FC<{ summary: MonthSummary; monthLabel: string }> = ({
  summary,
  monthLabel,
}) => {
  const isPositive = summary.net >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      className="relative overflow-hidden rounded-3xl mx-4 mb-3"
      style={{
        background: 'linear-gradient(135deg, #1a1a18 0%, #2d2d2b 60%, #3d3d3a 100%)',
      }}
    >
      {/* Decorative glow rings */}
      <div
        className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #a8a09880 0%, transparent 70%)' }}
      />
      <div
        className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full opacity-15 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #6b8cff50 0%, transparent 70%)' }}
      />

      <div className="relative z-10 px-5 pt-5 pb-4">
        {/* Month label */}
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-1">
          Monthly Overview
        </p>
        <p className="text-xl font-black text-white leading-none mb-4">{monthLabel}</p>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Received */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/[0.07] backdrop-blur-sm rounded-2xl px-3.5 py-3 flex flex-col gap-1"
          >
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <ArrowDownLeft className="w-2.5 h-2.5 text-emerald-400" />
              </div>
              <span className="text-[9px] font-bold uppercase tracking-widest text-white/40">Received</span>
            </div>
            <div className="flex items-center gap-0.5">
              <IndianRupee className="w-3 h-3 text-emerald-400 flex-shrink-0" />
              <span className="text-base font-black text-emerald-400 leading-none">
                <AnimatedNumber value={summary.received} decimals={summary.received % 1 !== 0 ? 2 : 0} />
              </span>
            </div>
          </motion.div>

          {/* Sent */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white/[0.07] backdrop-blur-sm rounded-2xl px-3.5 py-3 flex flex-col gap-1"
          >
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full bg-rose-500/20 flex items-center justify-center">
                <ArrowUpRight className="w-2.5 h-2.5 text-rose-400" />
              </div>
              <span className="text-[9px] font-bold uppercase tracking-widest text-white/40">Sent</span>
            </div>
            <div className="flex items-center gap-0.5">
              <IndianRupee className="w-3 h-3 text-rose-400 flex-shrink-0" />
              <span className="text-base font-black text-rose-400 leading-none">
                <AnimatedNumber value={summary.sent} decimals={summary.sent % 1 !== 0 ? 2 : 0} />
              </span>
            </div>
          </motion.div>

          {/* Net */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/[0.07] backdrop-blur-sm rounded-2xl px-3.5 py-3 flex flex-col gap-1"
          >
            <div className="flex items-center gap-1.5">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${isPositive ? 'bg-sky-500/20' : 'bg-amber-500/20'}`}>
                {isPositive
                  ? <TrendingUp className="w-2.5 h-2.5 text-sky-400" />
                  : <TrendingDown className="w-2.5 h-2.5 text-amber-400" />}
              </div>
              <span className="text-[9px] font-bold uppercase tracking-widest text-white/40">Net</span>
            </div>
            <div className="flex items-center gap-0.5">
              <IndianRupee className={`w-3 h-3 flex-shrink-0 ${isPositive ? 'text-sky-400' : 'text-amber-400'}`} />
              <span className={`text-base font-black leading-none ${isPositive ? 'text-sky-400' : 'text-amber-400'}`}>
                <AnimatedNumber value={Math.abs(summary.net)} decimals={summary.net % 1 !== 0 ? 2 : 0} />
              </span>
            </div>
          </motion.div>

          {/* Count */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white/[0.07] backdrop-blur-sm rounded-2xl px-3.5 py-3 flex flex-col gap-1"
          >
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded-full bg-violet-500/20 flex items-center justify-center">
                <History className="w-2.5 h-2.5 text-violet-400" />
              </div>
              <span className="text-[9px] font-bold uppercase tracking-widest text-white/40">Transactions</span>
            </div>
            <span className="text-base font-black text-violet-400 leading-none">
              <AnimatedNumber value={summary.count} />
            </span>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

// ─── Transaction Card ─────────────────────────────────────────────────────────
const TransactionCard: React.FC<{ tx: Transaction; index: number; t: Record<string, string> }> = ({
  tx,
  index,
  t,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 14, filter: 'blur(4px)' }}
    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
    transition={{ delay: index * 0.05, type: 'spring', stiffness: 360, damping: 28 }}
    className="bg-white border border-[#ebe7e3] rounded-2xl px-4 py-3.5 shadow-sm"
  >
    <div className="flex items-center gap-3">
      {/* Icon */}
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
          tx.isReceiver ? 'bg-emerald-50' : 'bg-rose-50'
        }`}
      >
        {tx.isReceiver
          ? <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
          : <ArrowUpRight className="w-4 h-4 text-rose-500" />}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-black text-[#1a1a18] truncate leading-tight">
          {tx.payeeName || tx.payeeUpiId}
        </p>
        {tx.payeeName && (
          <p className="text-[10px] text-[#2d2d2b]/45 font-medium truncate">{tx.payeeUpiId}</p>
        )}
        {tx.remarks && (
          <p className="text-[10px] text-[#2d2d2b]/55 italic truncate">"{tx.remarks}"</p>
        )}
        <p className="text-[10px] text-[#2d2d2b]/35 font-medium mt-0.5">{tx.time}</p>
      </div>

      {/* Amount */}
      <div className="text-right flex-shrink-0">
        {tx.amount ? (
          <div className={`flex items-center gap-0.5 justify-end font-black text-sm ${tx.isReceiver ? 'text-emerald-600' : 'text-rose-600'}`}>
            <IndianRupee className="w-3.5 h-3.5" />
            <span>{tx.amount}</span>
          </div>
        ) : (
          <span className="text-xs text-[#2d2d2b]/30 font-medium">—</span>
        )}
        <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full mt-1 inline-block ${
          tx.isReceiver
            ? 'bg-emerald-50 text-emerald-600'
            : 'bg-rose-50 text-rose-600'
        }`}>
          {tx.isReceiver ? (t.txReceived || 'Received') : (t.txPaid || 'Paid')}
        </span>
      </div>
    </div>
  </motion.div>
);

// ─── Clear All Confirmation Dialog ───────────────────────────────────────────
const ClearAllDialog: React.FC<{
  count: number;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ count, onConfirm, onCancel }) => (
  <motion.div
    className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    onClick={onCancel}
  >
    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
    <motion.div
      className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 space-y-4"
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 340, damping: 28 }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex justify-center">
        <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center border border-rose-100">
          <AlertTriangle className="w-5 h-5 text-rose-500" />
        </div>
      </div>
      <div className="text-center">
        <h3 className="text-base font-black text-[#1a1a18] uppercase tracking-tight mb-1">
          Clear All Transactions?
        </h3>
        <p className="text-xs text-[#2d2d2b]/60 font-medium leading-relaxed">
          This will permanently delete all{' '}
          <span className="font-black text-[#1a1a18]">{count}</span>{' '}
          {count === 1 ? 'transaction' : 'transactions'}. This cannot be undone.
        </p>
      </div>
      <div className="flex gap-2">
        <motion.button
          onClick={onCancel}
          className="flex-1 py-3 rounded-2xl border border-[#d9d3ce] text-sm font-bold text-[#2d2d2b] bg-white hover:bg-[#f5f2ef] transition-colors"
          whileTap={{ scale: 0.97 }}
        >
          Cancel
        </motion.button>
        <motion.button
          onClick={onConfirm}
          className="flex-1 py-3 rounded-2xl bg-[#1a1a18] text-sm font-bold text-white hover:bg-[#2d2d2b] transition-colors"
          whileTap={{ scale: 0.97 }}
        >
          Clear All
        </motion.button>
      </div>
    </motion.div>
  </motion.div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
export const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  isOpen,
  onClose,
  transactions,
  onClearAll,
  t,
}) => {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);

  // Build month-grouped data
  const { monthKeys, groupedByMonth } = React.useMemo(() => {
    const map: Record<string, Transaction[]> = {};
    for (const tx of transactions) {
      const key = parseMonthKey(tx.date);
      if (!map[key]) map[key] = [];
      map[key].push(tx);
    }
    const keys = sortMonthKeys(Object.keys(map));
    return { monthKeys: keys, groupedByMonth: map };
  }, [transactions]);

  const [activeMonth, setActiveMonth] = useState<string>(() => monthKeys[0] ?? '');

  // When modal opens or month list changes, default to most-recent month
  useEffect(() => {
    if (monthKeys.length > 0) {
      setActiveMonth((prev) => (monthKeys.includes(prev) ? prev : monthKeys[0]));
    }
  }, [monthKeys]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) setShowClearConfirm(false);
  }, [isOpen]);

  const activeIndex = monthKeys.indexOf(activeMonth);
  const activeTxs: Transaction[] = activeMonth ? (groupedByMonth[activeMonth] ?? []) : [];
  const summary = React.useMemo(() => computeSummary(activeTxs), [activeTxs]);

  // Scroll active tab into view
  const scrollTabIntoView = useCallback((key: string) => {
    const container = tabsRef.current;
    if (!container) return;
    const btn = container.querySelector<HTMLElement>(`[data-month="${key}"]`);
    if (!btn) return;
    btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, []);

  const goToMonth = (key: string) => {
    setActiveMonth(key);
    scrollTabIntoView(key);
  };

  const goPrev = () => {
    const idx = monthKeys.indexOf(activeMonth);
    if (idx < monthKeys.length - 1) goToMonth(monthKeys[idx + 1]);
  };

  const isPrevDisabled = activeIndex >= monthKeys.length - 1;
  const isNextDisabled = activeIndex <= 0;

  const goNext = () => {
    const idx = monthKeys.indexOf(activeMonth);
    if (idx > 0) goToMonth(monthKeys[idx - 1]);
  };

  // Direction for slide animation
  const [slideDir, setSlideDir] = useState(0); // -1 = left, 1 = right
  const prevActiveMonth = useRef(activeMonth);
  useEffect(() => {
    const prev = prevActiveMonth.current;
    const prevIdx = monthKeys.indexOf(prev);
    const currIdx = monthKeys.indexOf(activeMonth);
    // Higher index = older month (because list is sorted newest-first)
    if (currIdx > prevIdx) setSlideDir(1); // going to older = slide left
    else setSlideDir(-1); // going to newer = slide right
    prevActiveMonth.current = activeMonth;
  }, [activeMonth, monthKeys]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop + modal */}
      <motion.div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

        {/* Sheet */}
        <motion.div
          className="relative bg-[#f5f2ef] w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col overflow-hidden"
          style={{ maxHeight: '92dvh' }}
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 60 }}
          transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
            <div className="w-10 h-1 rounded-full bg-[#2d2d2b]/20" />
          </div>

          {/* Header */}
          <div className="flex items-center px-5 pb-3 pt-1 flex-shrink-0">
            <div className="flex items-center gap-2 flex-1">
              <History className="w-4 h-4 text-[#2d2d2b]/50" />
              <h2 className="text-[13px] font-black text-[#2d2d2b]/60 uppercase tracking-[0.15em]">
                {t.transactionHistory || 'Transaction History'}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {transactions.length > 0 && (
                <motion.button
                  onClick={() => setShowClearConfirm(true)}
                  className="flex items-center gap-1 text-[10px] font-black text-[#2d2d2b]/50 hover:text-rose-500 uppercase tracking-widest transition-colors"
                  whileTap={{ scale: 0.93 }}
                >
                  <Trash2 className="w-3 h-3" />
                  {t.clearAll || 'Clear'}
                </motion.button>
              )}
              <motion.button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-[#2d2d2b]/10 hover:bg-[#2d2d2b]/20 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="w-4 h-4 text-[#2d2d2b]" />
              </motion.button>
            </div>
          </div>

          {transactions.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-20 text-[#2d2d2b]/30 px-6">
              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <History className="w-14 h-14 mb-4 mx-auto" />
              </motion.div>
              <p className="text-sm font-black uppercase tracking-wide text-center">
                {t.noTransactions || 'No transactions yet'}
              </p>
              <p className="text-xs mt-1.5 font-medium text-center leading-relaxed">
                {t.transactionsAppearHere || 'Your receipts will appear here'}
              </p>
            </div>
          ) : (
            <>
              {/* Month tabs */}
              <div className="flex items-center gap-1 px-4 mb-2 flex-shrink-0">
                {/* Prev (older) */}
                <motion.button
                  onClick={goPrev}
                  disabled={isPrevDisabled}
                  className="w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-full bg-white border border-[#d9d3ce] disabled:opacity-20 transition-opacity"
                  whileTap={!isPrevDisabled ? { scale: 0.88 } : {}}
                >
                  <ChevronLeft className="w-3.5 h-3.5 text-[#2d2d2b]" />
                </motion.button>

                {/* Scrollable tabs */}
                <div
                  ref={tabsRef}
                  className="flex gap-1.5 overflow-x-auto flex-1 py-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                >
                  {monthKeys.map((key) => {
                    const isActive = key === activeMonth;
                    return (
                      <motion.button
                        key={key}
                        data-month={key}
                        onClick={() => goToMonth(key)}
                        className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wide transition-all ${
                          isActive
                            ? 'bg-[#1a1a18] text-white shadow-sm'
                            : 'bg-white border border-[#d9d3ce] text-[#2d2d2b]/60 hover:border-[#2d2d2b]/40'
                        }`}
                        whileTap={{ scale: 0.94 }}
                        layout
                      >
                        {monthKeyToShortLabel(key)}
                      </motion.button>
                    );
                  })}
                </div>

                {/* Next (newer) */}
                <motion.button
                  onClick={goNext}
                  disabled={isNextDisabled}
                  className="w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-full bg-white border border-[#d9d3ce] disabled:opacity-20 transition-opacity"
                  whileTap={!isNextDisabled ? { scale: 0.88 } : {}}
                >
                  <ChevronRight className="w-3.5 h-3.5 text-[#2d2d2b]" />
                </motion.button>
              </div>

              {/* Paged content — slides when month changes */}
              <AnimatePresence mode="wait" custom={slideDir}>
                <motion.div
                  key={activeMonth}
                  custom={slideDir}
                  variants={{
                    enter: (dir: number) => ({ opacity: 0, x: dir * 40, filter: 'blur(6px)' }),
                    center: { opacity: 1, x: 0, filter: 'blur(0px)' },
                    exit: (dir: number) => ({ opacity: 0, x: dir * -30, filter: 'blur(4px)' }),
                  }}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ type: 'spring', stiffness: 380, damping: 34 }}
                  className="flex flex-col overflow-hidden"
                  style={{ maxHeight: 'calc(92dvh - 160px)' }}
                >
                  {/* Summary card */}
                  <MonthlySummaryCard
                    summary={summary}
                    monthLabel={monthKeyToLabel(activeMonth)}
                  />

                  {/* Transaction list */}
                  <div
                    className="flex-1 overflow-y-auto px-4 pb-6 space-y-2 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-[#d9d3ce] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent"
                  >
                    {activeTxs.map((tx, i) => (
                      <TransactionCard key={tx.id} tx={tx} index={i} t={t} />
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
            </>
          )}
        </motion.div>
      </motion.div>

      {/* Clear All Dialog */}
      <AnimatePresence>
        {showClearConfirm && (
          <ClearAllDialog
            count={transactions.length}
            onConfirm={() => { setShowClearConfirm(false); onClearAll(); onClose(); }}
            onCancel={() => setShowClearConfirm(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
};
