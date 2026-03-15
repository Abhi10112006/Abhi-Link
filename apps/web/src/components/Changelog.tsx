import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';
import { PremiumBackground } from './PremiumBackground';

interface ChangelogProps {
  onClose: () => void;
  t: Record<string, string>;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 }
  },
  exit: { opacity: 0, transition: { duration: 0.4, ease: "easeInOut" } }
};

const item = {
  hidden: { opacity: 0, y: 40, filter: "blur(10px)" },
  show: { 
    opacity: 1, 
    y: 0, 
    filter: "blur(0px)",
    transition: { type: "spring", stiffness: 200, damping: 20 } 
  }
};

export const Changelog: React.FC<ChangelogProps> = ({ onClose, t }) => {
  useEffect(() => {
    // Disable scrolling on the body when the changelog is open
    document.body.style.overflow = 'hidden';
    return () => {
      // Re-enable scrolling when the changelog is closed
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center text-gray-900 overflow-hidden"
      initial="hidden"
      animate="show"
      exit="exit"
      variants={container}
      onClick={onClose}
    >
      <PremiumBackground />

      <motion.button 
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-6 right-6 sm:top-10 sm:right-10 p-4 rounded-full border border-gray-200 bg-white/50 hover:bg-white transition-colors z-50 group shadow-sm"
        whileHover={{ scale: 1.1, rotate: 90 }}
        whileTap={{ scale: 0.9 }}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1, transition: { delay: 1 } }}
      >
        <X className="w-6 h-6 text-gray-500 group-hover:text-gray-900 transition-colors" />
      </motion.button>

      <div 
        className="relative z-10 max-w-3xl w-full px-6 flex flex-col items-center text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <motion.div variants={item} className="mb-6">
          <span className="px-5 py-2 rounded-full border border-gray-200 bg-white/50 text-[10px] sm:text-xs font-bold tracking-[0.3em] uppercase text-gray-500 backdrop-blur-md">
            ABHI LINK
          </span>
        </motion.div>
        
        <motion.h1 
          variants={item} 
          className="text-8xl sm:text-[12rem] font-black tracking-tighter leading-none mb-2 bg-clip-text text-transparent bg-gradient-to-b from-gray-900 to-gray-500"
        >
          v1.0
        </motion.h1>
        
        <motion.p 
          variants={item} 
          className="text-lg sm:text-2xl font-medium text-gray-400 mb-8 font-mono tracking-widest uppercase"
        >
          March 14, 2026
        </motion.p>

        <motion.div 
          variants={item} 
          className="w-full max-w-md h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent mb-8" 
        />

        <motion.div variants={item} className="flex flex-col gap-8 items-center w-full">
          <h2 className="text-xs sm:text-sm font-bold tracking-[0.4em] uppercase text-gray-400">What's New</h2>
          
          <div className="flex flex-col gap-6 w-full">
            {[
              "Introduced 'My Digital Card' with premium animations.",
              "Added interactive Premium Background across the app.",
              "Centralized Business Type selection to the Digital Wallet.",
              "Added Transaction History support."
            ].map((text, i) => (
              <motion.div 
                key={i}
                className="text-2xl sm:text-4xl font-bold tracking-tight text-gray-500 cursor-default"
                whileHover={{ 
                  scale: 1.05, 
                  color: "#111827",
                  textShadow: "0px 0px 20px rgba(0,0,0,0.1)"
                }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                {text}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};
