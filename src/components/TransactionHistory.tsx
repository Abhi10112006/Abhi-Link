import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'motion/react';
import { X, History, IndianRupee, Trash2, ArrowDownLeft, ArrowUpRight, AlertTriangle } from 'lucide-react';
import { PremiumBackground } from './PremiumBackground';
import { hapticMedium, hapticLight, hapticWarning } from '../utils/haptics';

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
  isCurrentMonth: boolean;
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
  const today = new Date();
  const currentKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  // Oldest-to-newest so index 0 = oldest, last index = newest (current)
  const sortedEntries = [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    return sortedEntries.map(([key, txs]) => {
    const [year, month] = key.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    const label = date.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
    
    // Future-proof: Formats as "Mar '26" so multiple years don't confuse the user
    const shortLabel = `${date.toLocaleString('en-IN', { month: 'short' })} '${date.getFullYear().toString().slice(-2)}`;
    
    return { key, label, shortLabel, transactions: txs, isCurrentMonth: key === currentKey };
  });
}

// ─── TODO: Remove mock data ────────────────────────────────────────────────
// Temporary multi-month fixture so the month-paging animations can be tested
// end-to-end before real transaction data fills enough months.
// Delete the MOCK_TRANSACTIONS constant and the allTransactions merge below.
const MOCK_TRANSACTIONS: Transaction[] = [
  // ── March 2026 ───────────────────────────────────────────────────────────
  { id: 'mock-1',  payeeName: 'Rahul Sharma',   payeeUpiId: 'rahul@oksbi',         amount: '2500', remarks: 'Rent share',        date: '18/03/2026', time: '10:22', isReceiver: false },
  { id: 'mock-2',  payeeName: 'Priya Singh',    payeeUpiId: 'priya.s@paytm',       amount: '800',  remarks: 'Dinner',            date: '15/03/2026', time: '21:14', isReceiver: true  },
  { id: 'mock-3',  payeeName: '',               payeeUpiId: 'grofers@ybl',          amount: '1240', remarks: 'Groceries',         date: '12/03/2026', time: '09:08', isReceiver: false },
  { id: 'mock-4',  payeeName: 'Amit Kumar',     payeeUpiId: 'amit.k@upi',          amount: '3000', remarks: 'Freelance payment', date: '05/03/2026', time: '14:30', isReceiver: true  },
  { id: 'mock-5',  payeeName: 'Swiggy',         payeeUpiId: 'swiggy@icici',        amount: '340',  remarks: '',                  date: '02/03/2026', time: '20:05', isReceiver: false },
    // ── Extra Scroll-Testing Data for March 2026 (No ID Collisions) ─────────
  { id: 'mock-101', payeeName: 'Starbucks',      payeeUpiId: 'starbucks@paytm',     amount: '350',  remarks: 'Morning Coffee',    date: '30/03/2026', time: '08:15', isReceiver: false },
  { id: 'mock-102', payeeName: 'Blinkit',        payeeUpiId: 'blinkit@upi',         amount: '890',  remarks: 'Groceries',         date: '29/03/2026', time: '19:45', isReceiver: false },
  { id: 'mock-103', payeeName: 'Karan Singh',    payeeUpiId: 'karan.s@okicici',     amount: '5000', remarks: 'Lent money',        date: '28/03/2026', time: '14:20', isReceiver: false },
  { id: 'mock-104', payeeName: 'Uber',           payeeUpiId: 'uber@axisbank',       amount: '450',  remarks: 'Cab to office',     date: '27/03/2026', time: '09:10', isReceiver: false },
  { id: 'mock-105', payeeName: 'Jio Prepaid',    payeeUpiId: 'jio@upi',             amount: '749',  remarks: 'Mobile recharge',   date: '26/03/2026', time: '11:03', isReceiver: false },
  { id: 'mock-106', payeeName: 'Ravi Kumar',     payeeUpiId: 'ravi.k@sbi',          amount: '1200', remarks: 'Split bill',        date: '25/03/2026', time: '22:30', isReceiver: true  },
  { id: 'mock-107', payeeName: 'Netflix',        payeeUpiId: 'netflix@upi',         amount: '649',  remarks: 'Subscription',      date: '24/03/2026', time: '06:00', isReceiver: false },
  { id: 'mock-108', payeeName: 'Sneha Patel',    payeeUpiId: 'sneha.p@ybl',         amount: '8500', remarks: 'Freelance design',  date: '23/03/2026', time: '16:45', isReceiver: true  },
  { id: 'mock-109', payeeName: 'Zepto',          payeeUpiId: 'zepto@icici',         amount: '320',  remarks: 'Snacks',            date: '22/03/2026', time: '20:15', isReceiver: false },
  { id: 'mock-110', payeeName: 'Gym Membership', payeeUpiId: 'fitpro@hdfc',         amount: '1500', remarks: 'Monthly fee',       date: '21/03/2026', time: '07:30', isReceiver: false },
  { id: 'mock-111', payeeName: 'MakeMyTrip',     payeeUpiId: 'mmt@upi',             amount: '4200', remarks: 'Flight booking',    date: '20/03/2026', time: '13:20', isReceiver: false },
  { id: 'mock-112', payeeName: 'Aditi Sharma',   payeeUpiId: 'aditi.s@paytm',       amount: '2000', remarks: 'Gift contribution', date: '19/03/2026', time: '18:10', isReceiver: true  },
  { id: 'mock-113', payeeName: 'BookMyShow',     payeeUpiId: 'bms@axis',            amount: '880',  remarks: 'Movie tickets',     date: '17/03/2026', time: '15:05', isReceiver: false },
  { id: 'mock-114', payeeName: 'IRCTC',          payeeUpiId: 'irctc@sbi',           amount: '1150', remarks: 'Train tickets',     date: '16/03/2026', time: '10:45', isReceiver: false },
  { id: 'mock-115', payeeName: 'Local Pharmacy', payeeUpiId: 'medplus@ybl',         amount: '450',  remarks: 'Medicines',         date: '14/03/2026', time: '19:20', isReceiver: false },
  // ────────────────────────────────────────────────────────────────────────
  
  
  // ── February 2026 ────────────────────────────────────────────────────────
  { id: 'mock-6',  payeeName: 'Neha Gupta',     payeeUpiId: 'neha.g@okicici',      amount: '1500', remarks: 'Movie + dinner',    date: '24/02/2026', time: '18:45', isReceiver: true  },
  { id: 'mock-7',  payeeName: 'Airtel',         payeeUpiId: 'airtel@upi',          amount: '499',  remarks: 'Postpaid bill',     date: '18/02/2026', time: '11:03', isReceiver: false },
  { id: 'mock-8',  payeeName: 'Suresh Patel',   payeeUpiId: 'suresh.p@ybl',        amount: '4200', remarks: 'Project advance',   date: '10/02/2026', time: '09:30', isReceiver: true  },
  { id: 'mock-9',  payeeName: 'Amazon Pay',     payeeUpiId: 'amazon@apl',          amount: '2199', remarks: 'Headphones',        date: '03/02/2026', time: '16:22', isReceiver: false },
  // ── January 2026 ─────────────────────────────────────────────────────────
  { id: 'mock-10', payeeName: 'Deepika Rao',    payeeUpiId: 'deepika.r@oksbi',     amount: '1000', remarks: 'Gift',              date: '28/01/2026', time: '12:00', isReceiver: true  },
  { id: 'mock-11', payeeName: 'Zomato',         payeeUpiId: 'zomato@hdfcbank',     amount: '620',  remarks: 'Lunch order',       date: '20/01/2026', time: '13:17', isReceiver: false },
  { id: 'mock-12', payeeName: 'Vikram Nair',    payeeUpiId: 'vikram.n@paytm',      amount: '8000', remarks: 'Consulting fee',    date: '14/01/2026', time: '10:00', isReceiver: true  },
  { id: 'mock-13', payeeName: 'BSNL Fiber',     payeeUpiId: 'bsnl@upi',            amount: '699',  remarks: 'Internet bill',     date: '07/01/2026', time: '15:45', isReceiver: false },
  { id: 'mock-14', payeeName: 'Kavya Menon',    payeeUpiId: 'kavya.m@upi',         amount: '2200', remarks: 'Rent contribution', date: '01/01/2026', time: '11:30', isReceiver: false },
  // ── December 2025 ────────────────────────────────────────────────────────
  { id: 'mock-15', payeeName: 'Ananya Joshi',   payeeUpiId: 'ananya.j@okaxis',     amount: '5500', remarks: 'Year-end bonus',    date: '25/12/2025', time: '09:00', isReceiver: true  },
  { id: 'mock-16', payeeName: 'Flipkart',       payeeUpiId: 'flipkart@axisbank',   amount: '3499', remarks: 'Big Billion sale',  date: '15/12/2025', time: '14:18', isReceiver: false },
  { id: 'mock-17', payeeName: 'Rohan Desai',    payeeUpiId: 'rohan.d@oksbi',       amount: '1750', remarks: 'Shared trip costs', date: '08/12/2025', time: '20:30', isReceiver: true  },
];
// ─── End mock data ─────────────────────────────────────────────────────────

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

// Dual-arc SVG ring: outer arc = received (gold), inner arc = sent (warm white)
// Both arcs animate in from zero on mount/remount.
const OUTER_R = 30;
const INNER_R = 21;
const RING_SW = 4.5;
const OUTER_CIRC = 2 * Math.PI * OUTER_R;
const INNER_CIRC = 2 * Math.PI * INNER_R;

const FlowRing: React.FC<{
  totalSent: number;
  totalReceived: number;
  totalTx: number;
}> = ({ totalSent, totalReceived, totalTx }) => {
  const SIZE = 76;
  const C = SIZE / 2; // 38

  const total = totalSent + totalReceived;
  const receivedPct = total > 0 ? totalReceived / total : 0;
  const sentPct = total > 0 ? totalSent / total : 0;

  const outerOffset = useMotionValue(OUTER_CIRC); // start fully hidden
  const innerOffset = useMotionValue(INNER_CIRC);

  useEffect(() => {
    animate(outerOffset, OUTER_CIRC * (1 - receivedPct), {
      duration: 1.2,
      ease: [0.16, 1, 0.3, 1],
    });
    animate(innerOffset, INNER_CIRC * (1 - sentPct), {
      duration: 1.0,
      ease: [0.16, 1, 0.3, 1],
      delay: 0.15,
    });
  }, [receivedPct, sentPct, outerOffset, innerOffset]);

  return (
    <svg
      width={SIZE}
      height={SIZE}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className="flex-shrink-0 overflow-visible"
      aria-hidden={true}
    >
      {/* Dim track rings */}
      <circle cx={C} cy={C} r={OUTER_R} fill="none" stroke="rgba(230,225,220,0.09)" strokeWidth={RING_SW} />
      <circle cx={C} cy={C} r={INNER_R} fill="none" stroke="rgba(230,225,220,0.09)" strokeWidth={RING_SW} />

      {/* Rotate from 12 o'clock */}
      <g transform={`rotate(-90, ${C}, ${C})`}>
        {/* Outer arc — Received (warm gold glow) */}
        <motion.circle
          cx={C} cy={C} r={OUTER_R}
          fill="none"
          stroke="#c9a96e"
          strokeWidth={RING_SW}
          strokeLinecap="round"
          strokeDasharray={OUTER_CIRC}
          style={{
            strokeDashoffset: outerOffset,
            filter: 'drop-shadow(0 0 5px rgba(201,169,110,0.85))',
          }}
        />
        {/* Inner arc — Sent (warm silver glow) */}
        <motion.circle
          cx={C} cy={C} r={INNER_R}
          fill="none"
          stroke="rgba(230,225,220,0.85)"
          strokeWidth={RING_SW}
          strokeLinecap="round"
          strokeDasharray={INNER_CIRC}
          style={{
            strokeDashoffset: innerOffset,
            filter: 'drop-shadow(0 0 4px rgba(230,225,220,0.65))',
          }}
        />
      </g>

      {/* Centre: transaction count */}
      <text
        x={C} y={C - 2}
        textAnchor="middle"
        dominantBaseline="middle"
        style={{ fill: '#e6e1dc', fontSize: '14px', fontWeight: 900 }}
      >
        {totalTx}
      </text>
      <text
        x={C} y={C + 11}
        textAnchor="middle"
        dominantBaseline="middle"
        style={{ fill: 'rgba(230,225,220,0.40)', fontSize: '7px', fontWeight: 700, letterSpacing: '0.12em' }}
      >
        TX
      </text>
    </svg>
  );
};

// Monthly summary card shown at the top of each month page
const MonthlySummaryCard: React.FC<{ month: MonthGroup }> = ({ month }) => {
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
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
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
          {/* Animated dual-arc ring: outer = received %, inner = sent % */}
          <FlowRing totalSent={totalSent} totalReceived={totalReceived} totalTx={month.transactions.length} />
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

// Swipeable card constants
const DRAG_CONSTRAINT = -240;
const DELETE_THRESHOLD = -220;

// Global flag to ensure the tutorial only plays ONCE per app load
let hasShownSwipeTutorial = false;

const SwipeableCard: React.FC<{
  tx: Transaction;
  index: number;
  onDeleteRequest: (tx: Transaction) => void;
}> = ({ tx, index, onDeleteRequest }) => {
  const x = useMotionValue(0);
  const deleteOpacity = useTransform(x, [DRAG_CONSTRAINT, -100, 0], [1, 0.5, 0]);
  const deleteIconScale = useTransform(x, [DELETE_THRESHOLD, -100, 0], [1, 0.7, 0.5]);

    const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: { offset: { x: number } }) => {
    // Always spring the card back to center
    animate(x, 0, { type: 'spring', stiffness: 400, damping: 30 });
    if (info.offset.x < DELETE_THRESHOLD) {
      hapticWarning();
      // Spring fully resets before modal appears (next microtask)
      onDeleteRequest(tx);
    }
  };

    // NEW: The "Tutorial Peek" Animation
  useEffect(() => {
    // We ONLY animate the very first card, and ONLY once per session so it isn't annoying
    if (index === 0 && !hasShownSwipeTutorial) {
      hasShownSwipeTutorial = true; // Instantly lock it so it never runs again
      
      // Wait 800ms for the modal to fully open and settle
      const timer = setTimeout(() => {
        // Slide left 45px to reveal the edge of the dark delete background
        animate(x, -45, { type: 'spring', stiffness: 300, damping: 20 });
        
        // Snap back to 0 after 400ms
        setTimeout(() => {
          animate(x, 0, { type: 'spring', stiffness: 400, damping: 30 });
        }, 400);
      }, 800);
      
      return () => clearTimeout(timer);
    }
  }, [index, x]);
  

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

// Shows all months as short-label pills. Active month has an animated sliding
// Premium horizontal timeline scrubber (Slice/CRED Style Scroll Wheel)
// Uses native CSS snap physics and mathematical center-detection to trigger haptics and page changes.
const MonthScrubber: React.FC<{
  months: MonthGroup[];
  activeIndex: number;
  onSelect: (index: number) => void;
}> = ({ months, activeIndex, onSelect }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [localActive, setLocalActive] = useState(activeIndex);
  
  // CRITICAL: We lock external updates while the user is actively touching the wheel
  // so the parent page doesn't forcefully yank the scrollbar away from their thumb.
    const isDraggingRef = useRef(false);
  const isFirstRender = useRef(true);
  
  // Holds our magnetic snap timer
  const scrollEndTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  

  // Sync external changes AND initial mount position back to the scroll wheel
  useEffect(() => {
    if (!isDraggingRef.current) {
      setLocalActive(activeIndex);
      const container = containerRef.current;
      const child = container?.children[activeIndex + 1] as HTMLElement;
      
      if (container && child) {
        const scrollLeft = child.offsetLeft - container.clientWidth / 2 + child.clientWidth / 2;
        
        container.scrollTo({ 
          left: scrollLeft, 
          // 'auto' teleports it instantly on mount so you don't see it spinning.
          // 'smooth' animates it when you actually swipe pages later.
          behavior: isFirstRender.current ? 'auto' : 'smooth' 
        });
        
        isFirstRender.current = false;
      }
    }
  }, [activeIndex]);


    const handleScroll = () => {
    const container = containerRef.current;
    if (!container) return;

    // Find the exact mathematical dead-center of the user's screen
    const center = container.scrollLeft + container.clientWidth / 2;
    let closestIndex = localActive;
    let minDistance = Infinity;

    // Loop through the buttons
    for (let i = 0; i < months.length; i++) {
      const child = container.children[i + 1] as HTMLElement;
      if (!child) continue;
      
      const childCenter = child.offsetLeft + child.clientWidth / 2;
      const distance = Math.abs(childCenter - center);
      
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = i;
      }
    }

    // Instantly update local wheel UI and trigger haptic when crossing a line
    if (closestIndex !== localActive) {
      hapticLight(); // Premium mechanical tick!
      setLocalActive(closestIndex); 
    }

    // CLEAR THE TIMER ON EVERY SINGLE FRAME OF SCROLLING
    if (scrollEndTimeoutRef.current) clearTimeout(scrollEndTimeoutRef.current);
    
    // SET A NEW TIMER: This only fires when the wheel COMPLETELY STOPS for 150ms
    scrollEndTimeoutRef.current = setTimeout(() => {
      // 1. Tell the heavy background page to swap smoothly
      onSelect(closestIndex);
      
      // 2. Programmatic Magnetic Snap: 
      // If the mobile browser got lazy and stopped "between" two months, physically force it to center.
      const child = container.children[closestIndex + 1] as HTMLElement;
      if (child) {
        const perfectScrollLeft = child.offsetLeft - container.clientWidth / 2 + child.clientWidth / 2;
        // If it is off-center by more than 2 pixels, snap it!
        if (Math.abs(container.scrollLeft - perfectScrollLeft) > 2) {
          container.scrollTo({ left: perfectScrollLeft, behavior: 'smooth' });
        }
      }
    }, 150);
  };
  
  

  return (
    <div className="relative select-none py-3">
      {/* Heavy fade masks to draw the user's eye exclusively to the center */}
      <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#e6e1dc] via-[#e6e1dc]/80 to-transparent z-20 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#e6e1dc] via-[#e6e1dc]/80 to-transparent z-20 pointer-events-none" />

      {/* The Center Targeting Reticle (A subtle glass pill locked in the center) */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[76px] h-[36px] bg-[#2d2d2b]/[0.04] border border-[#2d2d2b]/[0.08] rounded-full z-0 pointer-events-none shadow-[inset_0_1px_3px_rgba(0,0,0,0.03)]" />

      <div
        ref={containerRef}
        onScroll={handleScroll}
        onTouchStart={() => { isDraggingRef.current = true; }}
        onTouchEnd={() => { 
          // Small delay ensures the native momentum scroll completely finishes before unlocking
          setTimeout(() => { isDraggingRef.current = false; }, 800); 
        }}
        
        // snap-proximity allows for effortless free-gliding instead of aggressive snapping
        className="flex items-center overflow-x-auto snap-x snap-proximity relative z-10 py-3"
        
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
      >
        {/* Massive spacer perfectly calculated to push the first item to the center of the screen */}
        <div className="flex-shrink-0 w-[calc(50vw-36px)]" />

        {months.map((month, i) => {
          const isActive = i === localActive;
          return (
            <button
              key={month.key}
              onClick={() => {
                const container = containerRef.current;
                const child = container?.children[i + 1] as HTMLElement;
                if (container && child) {
                  const scrollLeft = child.offsetLeft - container.clientWidth / 2 + child.clientWidth / 2;
                  container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
                }
              }}
              // snap-center forces the wheel to lock this item into the exact middle when you let go
              className="snap-center relative flex-shrink-0 w-[72px] py-2 flex flex-col items-center justify-center focus:outline-none transition-all duration-300"
            >
              <span
                className={`relative z-10 text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${
                  isActive ? 'text-[#2d2d2b] scale-110' : 'text-[#2d2d2b]/30 scale-95'
                }`}
              >
                {month.shortLabel}
              </span>

              {month.isCurrentMonth && (
                <div className={`absolute top-0 right-2 flex h-2 w-2 transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-40'}`}>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#c9a96e] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#c9a96e] border border-[#e6e1dc]"></span>
                </div>
              )}
            </button>
          );
        })}

        {/* Massive spacer perfectly calculated to push the last item to the center of the screen */}
        <div className="flex-shrink-0 w-[calc(50vw-36px)]" />
      </div>
    </div>
  );
};


export const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  isOpen,
  onClose,
  transactions,
  onDeleteTransaction,
  t,
}) => {
    // 1. FAST PATH: Instantly grab ONLY the current calendar month for a 0ms render
  const fastInitialMonth = React.useMemo(() => {
    const today = new Date();
    const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    const currentMonthSuffix = `${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
    
    const allTxs = [...transactions, ...MOCK_TRANSACTIONS];
    // Lightning-fast string filter just to get today's month
    const currentTxs = allTxs.filter(tx => tx.date.endsWith(currentMonthSuffix));
    
    return [{
      key: currentMonthKey,
      label: today.toLocaleString('en-IN', { month: 'long', year: 'numeric' }),
      shortLabel: today.toLocaleString('en-IN', { month: 'short' }),
      transactions: currentTxs,
      isCurrentMonth: true
    }];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only runs once when the modal boots up

  // 2. Initialize state with ONLY the fast current month
  const [monthGroups, setMonthGroups] = useState<MonthGroup[]>(fastInitialMonth);
  const [activeMonthIndex, setActiveMonthIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState(1);
  const [pendingDeleteTx, setPendingDeleteTx] = useState<Transaction | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasLoadedHistory = useRef(false);

  // 3. BACKGROUND WORKER: Calculate the rest of the history while the modal is opening
  useEffect(() => {
    if (!hasLoadedHistory.current) {
      // Wait 350ms for the modal's slide-up animation to completely finish
      const timer = setTimeout(() => {
        const fullHistory = groupTransactionsByMonth([...transactions, ...MOCK_TRANSACTIONS]);
        if (fullHistory.length > 0) {
          setMonthGroups(fullHistory);
          // Silently shift the index to the end of the new array.
          // Because the active month key ("2026-03") remains exactly the same, 
          // Framer Motion will NOT trigger a swipe animation!
          setActiveMonthIndex(Math.max(0, fullHistory.length - 1));
        }
        hasLoadedHistory.current = true;
      }, 350);
      return () => clearTimeout(timer);
    } else {
      // If history is already loaded (e.g., user deletes a card), update instantly so there is no lag!
      const fullHistory = groupTransactionsByMonth([...transactions, ...MOCK_TRANSACTIONS]);
      setMonthGroups(fullHistory);
      setActiveMonthIndex(prev => Math.min(prev, Math.max(0, fullHistory.length - 1)));
    }
  }, [transactions]);
  

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const currentMonth = monthGroups[activeMonthIndex];

  const pageVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 0.95,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 0.95,
    }),
  };

  const handleMonthSwipe = (
    _: MouseEvent | TouchEvent | PointerEvent,
    info: { offset: { x: number }; velocity: { x: number } },
  ) => {
    const swipeThreshold = 50;
    const isSwipeLeft = info.offset.x < -swipeThreshold || info.velocity.x < -500;
    const isSwipeRight = info.offset.x > swipeThreshold || info.velocity.x > 500;

    if (isSwipeLeft && activeMonthIndex < monthGroups.length - 1) {
      hapticMedium();
      setSlideDirection(1);
      setActiveMonthIndex((prev) => prev + 1);
    } else if (isSwipeRight && activeMonthIndex > 0) {
      hapticMedium();
      setSlideDirection(-1);
      setActiveMonthIndex((prev) => prev - 1);
    }
  };

  const goToMonth = (index: number) => {
    if (index === activeMonthIndex) return;
    hapticLight();
    setSlideDirection(index > activeMonthIndex ? 1 : -1);
    setActiveMonthIndex(index);
  };

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
      <div className="relative z-10 w-full max-w-2xl px-4 sm:px-6 flex flex-col pt-4 pb-32">

        {monthGroups.length === 0 ? (
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
            {/* Overflow clip container so exiting pages don't bleed outside */}
            <div className="relative overflow-hidden">
              <AnimatePresence initial={false} custom={slideDirection} mode="popLayout">

                                       <motion.div
                  key={currentMonth?.key}
                  custom={slideDirection}
                  variants={pageVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  // Swapped stiff spring for a silky-smooth iOS Bezier glide
                  transition={{ type: 'tween', ease: [0.25, 1, 0.5, 1], duration: 0.4 }}
                  // 1. Always keep the gesture engine permanently attached
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={1}                 
                  onDragEnd={handleMonthSwipe}
                  onAnimationComplete={() => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
                  // 2. Prevent the mobile browser from fighting your thumb
                  className="w-full flex flex-col touch-pan-y"
                                  
                >
                                  
                  {currentMonth && (
                    <>
                      {/* Monthly summary card — key forces remount on month change so FlowRing re-animates */}
                      <MonthlySummaryCard key={currentMonth.key} month={currentMonth} />

                      {/* Transaction list */}
                      <div className="space-y-2">
                        {currentMonth.transactions.map((tx, index) => (
                          <SwipeableCard
                            key={tx.id}
                            tx={tx}
                            index={index}
                            onDeleteRequest={setPendingDeleteTx}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

          </>
        )}
      </div>

      {/* 1. STATIC BACKGROUND: Renders instantly with GPU acceleration to prevent blur lag */}
      <div className="fixed bottom-0 left-0 right-0 h-24 z-[54] pointer-events-none">
        <div
          className="absolute inset-0 backdrop-blur-md"
          style={{
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 80%)',
            maskImage: 'linear-gradient(to bottom, transparent 0%, black 80%)',
            background: 'linear-gradient(to bottom, transparent 0%, rgba(230,225,220,0.6) 100%)',
            transform: 'translateZ(0)', // Forces the phone's GPU to render the blur perfectly
          }}
        />
      </div>
      

      {/* 2. ANIMATED CONTENT: Only the pills fade and slide in */}
      <AnimatePresence>
        {monthGroups.length > 1 && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="fixed bottom-0 left-0 right-0 z-[55] pointer-events-none"
          >
            <div className="relative pointer-events-auto pb-safe-area-inset-bottom">
              <MonthScrubber
                months={monthGroups}
                activeIndex={activeMonthIndex}
                onSelect={goToMonth}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      

      {/* Per-transaction delete confirmation overlay */}
      <AnimatePresence>
        {pendingDeleteTx && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-end justify-center p-4 sm:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => { hapticMedium(); setPendingDeleteTx(null); }}
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
                  <span className="font-black text-[#2d2d2b]">
                    {pendingDeleteTx.payeeName || pendingDeleteTx.payeeUpiId}
                  </span>
                  {pendingDeleteTx.amount && (
                    <> · <span className="font-black text-[#2d2d2b]">₹{pendingDeleteTx.amount}</span></>
                  )}{' '}
                  will be permanently removed from your history.
                </p>
              </div>
              <div className="flex gap-2">
                <motion.button
                  onClick={() => { hapticMedium(); setPendingDeleteTx(null); }}
                  className="flex-1 py-2.5 rounded-2xl text-sm font-bold text-[#2d2d2b] bg-[#f0ece8] hover:bg-[#d9d3ce] border border-[#d9d3ce] hover:border-[#2d2d2b] transition-colors uppercase tracking-wide"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={() => {
                    hapticWarning();
                    onDeleteTransaction(pendingDeleteTx.id);
                    setPendingDeleteTx(null);
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
