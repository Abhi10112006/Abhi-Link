import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';

interface ChangelogProps {
  onClose: () => void;
}

export const Changelog: React.FC<ChangelogProps> = ({ onClose }) => {
  useEffect(() => {
    // Disable scrolling on the body when the changelog is open
    document.body.style.overflow = 'hidden';
    return () => {
      // Re-enable scrolling when the changelog is closed
      document.body.style.overflow = 'unset';
    };
  }, []);

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

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#050505] text-[#f5f5f0] overflow-hidden"
      initial="hidden"
      animate="show"
      exit="exit"
      variants={container}
    >
      {/* Atmospheric Background Gradients */}
      <motion.div 
        className="absolute top-1/4 left-1/4 w-[40rem] h-[40rem] bg-[#2d2d2b] rounded-full mix-blend-screen filter blur-[120px] opacity-40 pointer-events-none"
        animate={{ 
          scale: [1, 1.2, 1],
          x: [0, 100, 0],
          y: [0, -50, 0]
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div 
        className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-[#d9d3ce] rounded-full mix-blend-screen filter blur-[100px] opacity-10 pointer-events-none"
        animate={{ 
          scale: [1, 1.5, 1],
          x: [0, -80, 0],
          y: [0, 80, 0]
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.button 
        onClick={onClose}
        className="absolute top-6 right-6 sm:top-10 sm:right-10 p-4 rounded-full border border-white/10 hover:bg-white/10 transition-colors z-10 group"
        whileHover={{ scale: 1.1, rotate: 90 }}
        whileTap={{ scale: 0.9 }}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1, transition: { delay: 1 } }}
      >
        <X className="w-6 h-6 text-white/70 group-hover:text-white transition-colors" />
      </motion.button>

      <div className="relative z-10 max-w-3xl w-full px-6 flex flex-col items-center text-center">
        <motion.div variants={item} className="mb-6">
          <span className="px-5 py-2 rounded-full border border-white/10 bg-white/5 text-[10px] sm:text-xs font-bold tracking-[0.3em] uppercase text-white/50 backdrop-blur-md">
            ABHI LINK
          </span>
        </motion.div>
        
        <motion.h1 
          variants={item} 
          className="text-8xl sm:text-[12rem] font-black tracking-tighter leading-none mb-2 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/30"
        >
          v0.18
        </motion.h1>
        
        <motion.p 
          variants={item} 
          className="text-lg sm:text-2xl font-medium text-white/30 mb-16 font-mono tracking-widest uppercase"
        >
          March 3, 2026
        </motion.p>

        <motion.div 
          variants={item} 
          className="w-full max-w-md h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-16" 
        />

        <motion.div variants={item} className="flex flex-col gap-8 items-center w-full">
          <h2 className="text-xs sm:text-sm font-bold tracking-[0.4em] uppercase text-white/30">What's New</h2>
          
          <div className="flex flex-col gap-6 w-full">
            {[
              "Premium Loading States.",
              "TinyURL Integration.",
              "Image-Only Banner Sharing."
            ].map((text, i) => (
              <motion.div 
                key={i}
                className="text-2xl sm:text-4xl font-bold tracking-tight text-white/60 cursor-default"
                whileHover={{ 
                  scale: 1.05, 
                  color: "#ffffff",
                  textShadow: "0px 0px 20px rgba(255,255,255,0.3)"
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
