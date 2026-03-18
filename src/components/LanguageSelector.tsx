import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Globe, Check } from 'lucide-react';
import { languages } from '../locales/translations';
import { hapticLight, hapticMedium, hapticScroll } from '../utils/haptics';

interface LanguageSelectorProps {
  currentLang: string;
  onLanguageChange: (langCode: string) => void;
  /** Which edge of the trigger button the dropdown anchors to. Default 'right'. */
  alignMenu?: 'left' | 'right';
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ currentLang, onLanguageChange, alignMenu = 'right' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll haptic for the language list
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    let lastScrollY = el.scrollTop;
    const SCROLL_THRESHOLD = 30;
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

  const currentLanguage = languages.find(l => l.code === currentLang) || languages[0];

  return (
    <div className="relative z-50" ref={dropdownRef}>
      <motion.button
        onClick={() => { hapticMedium(); setIsOpen(!isOpen); }}
        className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#2d2d2b] bg-white/50 hover:bg-white px-4 py-2.5 rounded-full border-2 border-[#d9d3ce] hover:border-[#2d2d2b] transition-all shadow-sm uppercase tracking-wide"
        whileHover={{ 
          scale: 1.02, 
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
          transition: { duration: 0.2 }
        }}
        whileTap={{ 
          scale: 0.9,
          transition: { type: "spring", stiffness: 400, damping: 10 }
        }}
      >
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <Globe className="w-4 h-4" />
        </motion.div>
        <span className="hidden sm:inline">{currentLanguage.nativeName}</span>
        <span className="sm:hidden">{currentLanguage.code.toUpperCase()}</span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`absolute ${alignMenu === 'left' ? 'left-0' : 'right-0'} mt-2 w-48 bg-white rounded-2xl shadow-xl border border-[#d9d3ce] overflow-hidden`}
          >
            <div ref={listRef} className="max-h-64 overflow-y-auto py-2 scrollbar-thin scrollbar-thumb-[#d9d3ce] scrollbar-track-transparent">
              {languages.map((lang) => (
                <motion.button
                  key={lang.code}
                  onClick={() => {
                    hapticLight();
                    onLanguageChange(lang.code);
                    setIsOpen(false);
                  }}
                  whileHover={{ backgroundColor: '#f5f5f0' }}
                  whileTap={{ scale: 0.95, backgroundColor: '#e6e1dc' }}
                  className={`w-full text-left px-4 py-3 flex items-center justify-between transition-colors ${
                    currentLang === lang.code ? 'bg-[#f5f5f0]' : ''
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-[#2d2d2b]">{lang.nativeName}</span>
                    <span className="text-xs font-medium text-[#2d2d2b]/60">{lang.name}</span>
                  </div>
                  {currentLang === lang.code && (
                    <Check className="w-4 h-4 text-[#2d2d2b]" />
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
