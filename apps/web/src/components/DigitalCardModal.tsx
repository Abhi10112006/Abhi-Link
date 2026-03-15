import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';
import { X, Fingerprint, Share2, ShieldAlert, Check, Copy, Briefcase, Store, GraduationCap, PenTool, User, ChevronDown, Maximize, Edit3, Eye, EyeOff, Loader2, Wifi } from 'lucide-react';
import QRCodeStyling from 'qr-code-styling';
import { toPng } from 'html-to-image';
import { PremiumBackground } from './PremiumBackground';

interface DigitalCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  t: Record<string, string>;
}

type BusinessType = 'shop' | 'freelancer' | 'tuition' | 'custom';

const modalContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 }
  },
  exit: { opacity: 0, transition: { duration: 0.4, ease: "easeInOut" } }
};

const modalItem = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { 
    opacity: 1, 
    scale: 1, 
    transition: { type: "spring", stiffness: 300, damping: 25 } 
  },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
};

export const DigitalCardModal = React.forwardRef<HTMLDivElement, DigitalCardModalProps>(({ isOpen, onClose, t }, ref) => {
  const [step, setStep] = useState<'setup' | 'pocket' | 'revealed'>('setup');
  const [name, setName] = useState('');
  const [upi, setUpi] = useState('');
  const [businessType, setBusinessType] = useState<BusinessType>('shop');
  const [customBusinessName, setCustomBusinessName] = useState('');
  const [isStealthMode, setIsStealthMode] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [showAmountModal, setShowAmountModal] = useState(false);
  const [shareAmount, setShareAmount] = useState('');
  
  const qrRef = useRef<HTMLDivElement>(null);
  const qrCode = useRef<QRCodeStyling | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const exportWrapperRef = useRef<HTMLDivElement>(null);

  // 3D Tilt Effect
  const cardX = useMotionValue(0);
  const cardY = useMotionValue(0);
  const rotateX = useTransform(cardY, [-200, 200], [5, -5]);
  const rotateY = useTransform(cardX, [-200, 200], [-5, 5]);
  const glareX = useTransform(cardX, [-200, 200], [100, -100]);
  const glareY = useTransform(cardY, [-200, 200], [100, -100]);

  // Pull Interaction & Foil Glare
  const cardDragY = useMotionValue(250);
  const foilPos = useTransform(cardDragY, [-40, 180], ['0% 0%', '100% 100%']);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good Morning';
    if (hour === 12) return 'Good Noon';
    if (hour > 12 && hour < 17) return 'Good Afternoon';
    if (hour >= 17 && hour < 21) return 'Good Evening';
    return 'Good Night';
  };

  useEffect(() => {
    if (isOpen) {
      const savedName = localStorage.getItem('my_card_name');
      const savedUpi = localStorage.getItem('my_card_upi');
      const savedType = localStorage.getItem('my_card_business_type') as BusinessType;
      const savedCustomName = localStorage.getItem('my_card_custom_business_name');
      
      if (savedName && savedUpi) {
        setName(savedName);
        setUpi(savedUpi);
        if (savedType) setBusinessType(savedType);
        if (savedCustomName) setCustomBusinessName(savedCustomName);
        setStep('pocket');
      } else {
        setStep('setup');
      }
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    if (step === 'revealed' && upi && qrRef.current) {
      const timer = setTimeout(() => {
        let upiUrl = `upi://pay?pa=${encodeURIComponent(upi)}&pn=${encodeURIComponent(name)}&cu=INR`;
        if (shareAmount) {
          upiUrl += `&am=${encodeURIComponent(shareAmount)}`;
        }
        
        if (!qrCode.current) {
          qrCode.current = new QRCodeStyling({
            width: 180,
            height: 180,
            data: upiUrl,
            margin: 0,
            type: "svg",
            qrOptions: { typeNumber: 0, mode: "Byte", errorCorrectionLevel: "Q" },
            imageOptions: { hideBackgroundDots: true, imageSize: 0.4, margin: 0 },
            dotsOptions: { type: "rounded", color: "#e8c382" },
            backgroundOptions: { color: "rgba(0,0,0,0)" },
            cornersSquareOptions: { type: "extra-rounded", color: "#e8c382" },
            cornersDotOptions: { type: "dot", color: "#e8c382" },
          });
        } else {
          qrCode.current.update({ 
            data: upiUrl,
            dotsOptions: { type: "rounded", color: "#e8c382" },
            backgroundOptions: { color: "rgba(0,0,0,0)" },
            cornersSquareOptions: { type: "extra-rounded", color: "#e8c382" },
            cornersDotOptions: { type: "dot", color: "#e8c382" },
          });
        }
        
        if (qrRef.current) {
          qrRef.current.innerHTML = '';
          qrCode.current.append(qrRef.current);
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [step, upi, name, shareAmount]);

  const handleSaveSetup = () => {
    if (name && upi.includes('@')) {
      localStorage.setItem('my_card_name', name);
      localStorage.setItem('my_card_upi', upi);
      localStorage.setItem('my_card_business_type', businessType);
      localStorage.setItem('my_card_custom_business_name', customBusinessName);
      setStep('pocket');
    }
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    cardX.set(event.clientX - centerX);
    cardY.set(event.clientY - centerY);
  };

  const handleMouseLeave = () => {
    cardX.set(0);
    cardY.set(0);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(upi);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareCard = async () => {
    if (!exportWrapperRef.current || !cardRef.current) return;
    setIsSharing(true);
    
    try {
      // Temporarily reset 3D transforms for a clean capture
      const currentX = cardX.get();
      const currentY = cardY.get();
      cardX.set(0);
      cardY.set(0);
      
      // Wait a tiny bit for transforms to apply
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const width = cardRef.current.offsetWidth;
      const height = cardRef.current.offsetHeight;
      const padding = 160;

      const dataUrl = await toPng(exportWrapperRef.current, {
        quality: 1.0,
        pixelRatio: 4,
        width: width + padding * 2,
        height: height + padding * 2,
        style: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'radial-gradient(circle at 50% 30%, #2a2420 0%, #0a0806 100%)',
          margin: '0',
          padding: '0',
          position: 'relative',
        },
        onclone: (clonedDoc, clonedNode) => {
          // Add noise overlay to the background
          const noise = clonedDoc.createElement('div');
          noise.style.position = 'absolute';
          noise.style.inset = '0';
          noise.style.opacity = '0.04';
          noise.style.mixBlendMode = 'overlay';
          noise.style.pointerEvents = 'none';
          noise.style.backgroundImage = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`;
          clonedNode.insertBefore(noise, clonedNode.firstChild);

          // Find the card inside the cloned wrapper and apply 3D transforms
          const cardClone = clonedNode.querySelector('[data-card-element="true"]') as HTMLElement;
          if (cardClone) {
            cardClone.style.transform = 'perspective(1000px) rotateX(15deg) rotateY(-15deg) scale(1)';
            cardClone.style.boxShadow = '-30px 40px 60px rgba(0,0,0,0.8), -15px 20px 30px rgba(0,0,0,0.5)';
            cardClone.style.margin = '0';
          }
        }
      });
      
      // Restore transforms
      cardX.set(currentX);
      cardY.set(currentY);

      if (navigator.share) {
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], `${name.replace(/\s+/g, '_')}_UPI_Card.png`, { type: 'image/png' });
        
        await navigator.share({
          title: `${name}'s UPI Premium Card`,
          text: `Pay me securely via UPI.`,
          files: [file],
        });
      } else {
        // Fallback for desktop/unsupported browsers: download the image
        const link = document.createElement('a');
        link.download = `${name.replace(/\s+/g, '_')}_UPI_Card.png`;
        link.href = dataUrl;
        link.click();
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Error sharing card:', err);
      }
      // Fallback to text share if image share fails
      if (navigator.share && err.name !== 'AbortError') {
        try {
          await navigator.share({
            title: `${name}'s Digital Identity`,
            text: `Pay me securely via UPI: ${upi}`,
          });
        } catch (e: any) {
          if (e.name !== 'AbortError') {
            console.error(e);
          }
        }
      } else if (err.name !== 'AbortError') {
        copyToClipboard();
      }
    } finally {
      setIsSharing(false);
      setShowAmountModal(false);
    }
  };

  const getBusinessIcon = () => {
    switch (businessType) {
      case 'shop': return <Store className="w-5 h-5" />;
      case 'freelancer': return <PenTool className="w-5 h-5" />;
      case 'tuition': return <GraduationCap className="w-5 h-5" />;
      default: return <Briefcase className="w-5 h-5" />;
    }
  };

  return (
    <motion.div
      ref={ref}
      variants={modalContainer}
      initial="hidden"
      animate="show"
      exit="exit"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#e6e1dc]/90 backdrop-blur-md overflow-hidden font-sans"
    >
        <PremiumBackground />

        {/* Close Button */}
        <AnimatePresence>
          {step === 'pocket' && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
              transition={{ duration: 0.4, delay: 0.8 }}
              onClick={onClose}
              className="absolute top-6 right-6 z-50 p-3 rounded-full bg-white/50 text-gray-900 hover:bg-white transition-colors border border-gray-200 shadow-sm"
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ 
                scale: 0.92, 
                filter: "brightness(0.9)",
                transition: { duration: 0.1 } 
              }}
            >
              <X className="w-6 h-6" />
            </motion.button>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {/* Setup Step */}
          {step === 'setup' && (
            <motion.div
              key="setup-step"
              variants={modalItem}
              initial="hidden"
              animate="show"
              exit="exit"
              className="w-full max-w-md p-8 rounded-3xl bg-[#f5f2ed] border border-[#d4c5b9] shadow-2xl relative z-10"
            >
            <div className="flex items-center gap-3 mb-8 text-[#8b7355]">
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M16.0724 4.02447C15.1063 3.04182 13.7429 2.5 12.152 2.5C10.5611 2.5 9.19773 3.04182 8.23167 4.02447C7.26636 5.00636 6.73644 6.38891 6.73644 8C6.73644 10.169 7.68081 11.567 8.8496 12.4062C9.07675 12.5692 9.3115 12.7107 9.54832 12.8327C8.24215 13.1916 7.18158 13.8173 6.31809 14.5934C4.95272 15.8205 4.10647 17.3993 3.53633 18.813C3.43305 19.0691 3.55693 19.3604 3.81304 19.4637C4.06914 19.567 4.36047 19.4431 4.46375 19.187C5.00642 17.8414 5.78146 16.4202 6.98653 15.3371C8.1795 14.265 9.82009 13.5 12.152 13.5C14.332 13.5 15.9058 14.1685 17.074 15.1279C18.252 16.0953 19.0453 17.3816 19.6137 18.6532C19.9929 19.5016 19.3274 20.5 18.2827 20.5H6.74488C6.46874 20.5 6.24488 20.7239 6.24488 21C6.24488 21.2761 6.46874 21.5 6.74488 21.5H18.2827C19.9348 21.5 21.2479 19.8588 20.5267 18.2452C19.9232 16.8952 19.0504 15.4569 17.7087 14.3551C16.9123 13.7011 15.9603 13.1737 14.8203 12.8507C15.43 12.5136 15.9312 12.0662 16.33 11.5591C17.1929 10.462 17.5676 9.10016 17.5676 8C17.5676 6.38891 17.0377 5.00636 16.0724 4.02447ZM15.3593 4.72553C16.1144 5.49364 16.5676 6.61109 16.5676 8C16.5676 8.89984 16.2541 10.038 15.544 10.9409C14.8475 11.8265 13.7607 12.5 12.152 12.5C11.5014 12.5 10.3789 12.2731 9.43284 11.5938C8.51251 10.933 7.73644 9.83102 7.73644 8C7.73644 6.61109 8.18963 5.49364 8.94477 4.72553C9.69916 3.95818 10.7935 3.5 12.152 3.5C13.5105 3.5 14.6049 3.95818 15.3593 4.72553Z" fill="currentColor"/>
              </svg>
              <h2 className="text-2xl font-bold uppercase tracking-widest">Setup Identity</h2>
            </div>
            <motion.div layout className="space-y-6">
              <motion.div layout>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Legal Name</label>
                <input
                  type="search"
                  id="legal-name-input-nope"
                  name="legal-name-input-nope"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border border-[#d4c5b9]/50 rounded-xl px-4 py-3 text-gray-900 focus:bg-white focus:border-[#8b7355] focus:ring-2 focus:ring-[#8b7355]/20 outline-none transition-all duration-300 font-medium focus:-translate-y-0.5 focus:shadow-md"
                  placeholder="John Doe"
                  autoComplete="nope-legal-name"
                  aria-autocomplete="none"
                  autoCorrect="off"
                  spellCheck="false"
                  data-lpignore="true"
                  data-form-type="other"
                />
              </motion.div>
              <motion.div layout>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Primary UPI ID</label>
                <input
                  type="search"
                  id="upi-id-input-nope"
                  name="upi-id-input-nope"
                  value={upi}
                  onChange={(e) => setUpi(e.target.value)}
                  className="w-full bg-white border border-[#d4c5b9]/50 rounded-xl px-4 py-3 text-gray-900 focus:bg-white focus:border-[#8b7355] focus:ring-2 focus:ring-[#8b7355]/20 outline-none transition-all duration-300 font-medium focus:-translate-y-0.5 focus:shadow-md"
                  placeholder="name@bank"
                  autoComplete="nope-upi-id"
                  aria-autocomplete="none"
                  autoCorrect="off"
                  spellCheck="false"
                  data-lpignore="true"
                  data-form-type="other"
                />
              </motion.div>
              <motion.div layout>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Profile Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {(['shop', 'freelancer', 'tuition', 'custom'] as BusinessType[]).map((type) => (
                    <motion.button
                      key={type}
                      onClick={() => setBusinessType(type)}
                      whileHover={{ scale: 1.02, y: -2, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
                      whileTap={{ scale: 0.92, y: 0, filter: "brightness(0.9)" }}
                      className={`py-3 px-4 rounded-xl border text-sm font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                        businessType === type 
                          ? 'bg-[#8b7355] text-white border-[#8b7355] shadow-md' 
                          : 'bg-white/80 text-gray-600 border-[#d4c5b9]/50 hover:border-[#d4c5b9] hover:bg-white'
                      }`}
                    >
                      {type === 'shop' && <Store className="w-4 h-4" />}
                      {type === 'freelancer' && <PenTool className="w-4 h-4" />}
                      {type === 'tuition' && <GraduationCap className="w-4 h-4" />}
                      {type === 'custom' && <Briefcase className="w-4 h-4" />}
                      <span className="truncate">{t[type] || type}</span>
                    </motion.button>
                  ))}
                </div>
                
                <AnimatePresence initial={false}>
                  {businessType === 'custom' && (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, height: 0, marginTop: 0, overflow: "hidden" }}
                      animate={{ opacity: 1, height: 'auto', marginTop: 16, transitionEnd: { overflow: "visible" } }}
                      exit={{ opacity: 0, height: 0, marginTop: 0, overflow: "hidden" }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <div className="p-1">
                        <input
                          type="search"
                          id="custom-business-name-nope"
                          name="custom-business-name-nope"
                          placeholder="Enter Custom Business Name"
                          value={customBusinessName}
                          onChange={(e) => setCustomBusinessName(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:bg-white focus:border-[#8b7355] focus:ring-2 focus:ring-[#8b7355]/20 outline-none transition-all duration-300 font-medium focus:-translate-y-0.5 focus:shadow-md"
                          autoComplete="nope-custom-business"
                          aria-autocomplete="none"
                          autoCorrect="off"
                          spellCheck="false"
                          data-lpignore="true"
                          data-form-type="other"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
              <motion.button
                layout
                onClick={handleSaveSetup}
                disabled={!name || !upi.includes('@')}
                className="w-full py-4 mt-4 rounded-xl bg-[#8b7355] text-white font-bold uppercase tracking-widest disabled:opacity-50 hover:bg-[#705c44] transition-all shadow-lg"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.92, filter: "brightness(0.9)" }}
              >
                Save & Continue
              </motion.button>
            </motion.div>
          </motion.div>
        )}

        {/* Pocket & Card Reveal Step */}
        {(step === 'pocket' || step === 'revealed') && (
          <motion.div 
            key="pocket-step"
            variants={modalItem}
            initial="hidden"
            animate="show"
            exit="exit"
            className="relative w-full max-w-sm h-full flex flex-col items-center justify-center"
          >
            
            {/* Top Bar (Aadhaar Style) */}
            <motion.div 
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="absolute top-6 w-full px-6 flex items-center justify-between z-30"
            >
              <AnimatePresence>
                {step === 'pocket' && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                    transition={{ duration: 0.4, delay: 0.6 }}
                    className="flex items-center gap-3 bg-white/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/50 shadow-sm cursor-pointer hover:bg-white transition-colors" 
                    onClick={() => setStep('setup')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="w-8 h-8 rounded-full bg-[#f5f2ed] border border-[#d4c5b9] flex items-center justify-center text-[#8b7355]">
                      <User className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-gray-800 text-sm truncate max-w-[120px]">{name}</span>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Pocket Back Flap */}
            <motion.div 
              initial={{ y: 500, opacity: 0 }}
              animate={{ 
                y: step === 'revealed' ? '120vh' : 0,
                opacity: step === 'revealed' ? 0 : 1 
              }}
              transition={{ type: "spring", bounce: 0, duration: 0.7 }}
              className="absolute top-[50%] mt-[-100px] w-full h-[1200px] bg-gradient-to-b from-[#d4c5b9] to-[#e6e1dc] rounded-t-[2.5rem] z-0 border-t border-[#cbbca0] overflow-hidden"
              style={{ pointerEvents: step === 'revealed' ? 'none' : 'auto', willChange: 'transform' }}
            >
              <div className="absolute inset-0 shadow-[inset_0_40px_40px_rgba(0,0,0,0.6),inset_0_10px_10px_rgba(0,0,0,0.8)] rounded-t-[2.5rem]" />
            </motion.div>

            {/* The Sleeve Front Flap */}
            <motion.div 
              initial={{ y: 500, opacity: 0 }}
              animate={{ 
                y: step === 'revealed' ? '120vh' : 0,
                opacity: step === 'revealed' ? 0 : 1 
              }}
              transition={{ type: "spring", bounce: 0, duration: 0.7 }}
              className="absolute top-[50%] mt-[-100px] w-full h-[1200px] z-20 flex justify-center pointer-events-none"
              style={{ 
                // Drop shadow falls upwards onto the card to simulate hollow depth
                filter: 'drop-shadow(0 -10px 20px rgba(0,0,0,0.4)) drop-shadow(0 10px 20px rgba(0,0,0,0.2))',
                willChange: 'transform'
              }}
            >
              <div 
                className="absolute inset-0 bg-gradient-to-b from-[#fdfbf7] to-[#f2ebe1] rounded-t-[2.5rem] overflow-hidden"
                style={{ 
                  maskImage: 'radial-gradient(circle at 50% 0px, transparent 30px, black 31px)',
                  WebkitMaskImage: 'radial-gradient(circle at 50% 0px, transparent 30px, black 31px)'
                }}
              >
                {/* Paper Texture */}
                <div className="absolute inset-0 opacity-[0.2] mix-blend-multiply" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>
                
                {/* Inner side shadows for 3D volume */}
                <div className="absolute inset-0 shadow-[inset_15px_0_30px_rgba(0,0,0,0.04),inset_-15px_0_30px_rgba(0,0,0,0.04)] rounded-t-[2.5rem]" />

                {/* Perimeter Stitching */}
                <div className="absolute inset-3 pointer-events-none z-10" style={{ maskImage: 'radial-gradient(circle at 50% -12px, transparent 41px, black 42px)', WebkitMaskImage: 'radial-gradient(circle at 50% -12px, transparent 41px, black 42px)' }}>
                  <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <filter id="thread-shadow">
                        <feDropShadow dx="0" dy="0" stdDeviation="1" floodColor="#000" floodOpacity="0.6"/>
                      </filter>
                    </defs>
                    <rect width="100%" height="100%" rx="32" fill="none" stroke="#e8dcc8" strokeWidth="2" strokeDasharray="6 6" strokeLinecap="round" filter="url(#thread-shadow)" />
                  </svg>
                </div>
                {/* Notch Stitch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[84px] h-[84px] pointer-events-none z-10" style={{ clipPath: 'inset(50% 0 0 0)' }}>
                  <svg className="w-full h-full" viewBox="0 0 84 84" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="42" cy="42" r="41" fill="none" stroke="#e8dcc8" strokeWidth="2" strokeDasharray="6 6" strokeLinecap="round" filter="url(#thread-shadow)" />
                  </svg>
                </div>

                {/* Stitched Tiger */}
                <div className="absolute top-[310px] left-1/2 -translate-x-1/2 flex flex-col items-center z-20 opacity-100">
                  <svg className="w-32 h-32 stitched-tiger" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
                    <g>
                      <path d="M104.365,252.937c0.89-7.979,5.322-11.527,3.548-32.806c-1.774-21.287-15.958-19.506-13.301-8.87
		c2.665,10.636-5.322,50.538-5.322,71.824c0,21.279,15.965,31.04,36.362,27.492c20.396-3.547,31.923-15.965,20.396-15.965
		C107.913,301.708,101.813,275.915,104.365,252.937z"/>
                      <path d="M511.671,257.964c-10.644-13.006-31.47-35.206-40.196-54.395c-5.911-12.999-7.972-13.965-24.857-47.684
		c-1.608-3.208-7.179-15.701-0.861-22.653c44.34-48.772,20.011-121.592,0.891-123.253c-56.75-2.665-73.599,27.484-93.112,44.332
		c-19.506,15.965-56.75,1.774-97.535,1.774c-40.792,0-78.037,14.191-97.542-1.774C138.952,37.463,122.104,7.314,65.354,9.979
		c-19.12,1.66-43.45,74.481,0.884,123.253c6.326,6.952,0.754,19.445-0.854,22.653c-16.893,33.719-18.946,34.686-24.857,47.684
		c-8.726,19.188-29.56,41.389-40.196,54.395c-3.774,4.605,26.005,17.731,26.005,17.731S2.693,317.077,6.241,341.904
		c15.957-3.548,24.827-7.096,24.827-7.096s0.294,47.299,11.821,61.483c10.643-5.91,27.197-15.377,27.197-15.377
		s-4.733,16.562,2.363,44.929c20.094-10.635,29.56-11.821,29.56-11.821s8.568,42.567,23.642,49.655
		c9.752-7.088,27.19-9.451,27.19-9.451s3.691,2.341,10.009,4.892c5.881,9.549,15.173,21.317,34.323,30.784
		c0.574,0.287,51.587,13.074,58.524,11.156c0,0,23.054,6.371,58.524-11.156c18.94-9.361,28.239-20.97,34.128-30.467
		c6.816-2.672,10.802-5.208,10.802-5.208s17.445,2.363,27.198,9.451c15.075-7.088,23.642-49.655,23.642-49.655
		s9.458,1.186,29.56,11.821c7.096-28.367,2.363-44.929,2.363-44.929s16.554,9.466,27.189,15.377
		c11.534-14.184,11.829-61.483,11.829-61.483s8.862,3.548,24.827,7.096c3.548-24.827-20.102-66.209-20.102-66.209
		S515.437,262.569,511.671,257.964z M442.208,36.58c21.264,13.814,15.966,59.407-3.547,81.57c-6.206,7.096-17.732,6.212-22.163,0.89
		c-4.439-5.314-39.449-35.568-38.128-44.34C381.027,56.969,424.477,25.046,442.208,36.58z M69.785,36.58
		c17.739-11.534,61.189,20.389,63.846,38.12c1.314,8.772-33.696,39.026-38.128,44.34c-4.438,5.322-15.965,6.206-22.17-0.89
		C53.827,95.987,48.521,50.394,69.785,36.58z M255.698,467.225c0,0-22.751,15.595-58.056-1.721
		c17.332-0.468,37.833-6.598,58.063-25.763h0.589c20.018,18.969,40.301,25.159,57.512,25.748
		C278.472,482.836,255.698,467.225,255.698,467.225z M443.982,341.61c-11.262,37.992-67.386-16.849-83.351-18.623
		c-0.883,27.492,20.396,26.601,30.149,42.559c9.753,15.965-31.032,54.983-38.128,61.189c-7.096,6.204-23.053,13.889-39.902,13.889
		s-42.468-9.678-42.468-17.732c0-3.933,0.558-11.979,1.14-19.204c18.245-4.581,36.369-19.12,47.631-29.673
		c7.066-6.62,7.142-31.84,7.142-31.84l-9.014-57.354c0,0-5.321-16.75,15.445-19.309c36.354-4.484,48.401-23.416,48.401-23.416
		s23.921-28.473-9.036-28.473c-32.957,0-78.143,4.929-76.09,24.291c3.178,29.998,3.095,30.014,9.851,108.881h-25.356h-48.794H206.24
		c6.756-78.867,6.681-78.882,9.859-108.881c2.045-19.362-43.133-24.291-76.097-24.291c-32.958,0-9.028,28.473-9.028,28.473
		s12.04,18.932,48.393,23.416c20.767,2.558,15.445,19.309,15.445,19.309l-9.006,57.354c0,0,0.076,25.22,7.134,31.84
		c11.262,10.552,29.387,25.092,47.639,29.673c0.574,7.224,1.132,15.271,1.132,19.204c0,8.054-25.612,17.732-42.461,17.732
		c-16.848,0-32.813-7.685-39.902-13.889c-7.096-6.206-47.888-45.224-38.135-61.189c9.76-15.958,31.04-15.068,30.149-42.559
		c-15.958,1.774-72.081,56.614-83.351,18.623C55.3,298.756,59.149,196.187,97.277,154.511c26.752-29.251,46.56-57.165,89.382-71.228
		c1.532-0.393,3.827-1.05,7.005-2c1.404-0.431,2.756-0.816,4.069-1.193c7.367-1.834,15.361-3.307,24.11-4.364
		c17.18-0.392,15.376,9.406,15.376,12.637c0,4.438-3.147,6.559-17.573,10.281c-47.888,10.643-73.598,41.682-79.811,54.983
		c-7.202,15.429,3.306,22.752,13.95,7.677c10.635-15.075,32.421-31.228,50.107-38.045c18.366-7.088,24.404-9.186,33.326-7.088
		c2.59,0.619,7.345,4.922,7.345,10.236c0,5.321-6.559,8.666-12.591,12.591c-26.503,13.648-31.84,28.812-33.614,34.134
		c-1.774,5.314,5.405,11.066,8.945,5.752c13.12-23.876,38.943-30.586,38.943-25.258c0,5.314,0,26.602,0,36.354
		c0,9.752,0.883,21.279,9.753,21.279c8.862,0,9.752-11.527,9.752-21.279c0-9.753,0-31.04,0-36.354
		c0-5.329,25.816,1.382,38.936,25.258c3.548,5.314,10.719-0.438,8.946-5.752c-1.774-5.322-7.104-20.487-33.607-34.134
		c-6.031-3.925-12.598-7.27-12.598-12.591c0-5.314,4.755-9.617,7.352-10.236c8.915-2.098,14.954,0,33.319,7.088
		c17.686,6.817,39.472,22.97,50.115,38.045c10.636,15.074,21.152,7.752,13.942-7.677c-6.205-13.301-31.922-44.34-79.803-54.983
		c-14.425-3.722-17.573-5.843-17.573-10.281c0-3.231-1.804-13.029,15.376-12.637c8.749,1.057,16.736,2.529,24.103,4.364
		c1.313,0.377,2.672,0.762,4.069,1.193c3.178,0.951,5.473,1.608,7.012,2c42.816,14.063,62.623,41.977,89.383,71.228
		C452.852,196.187,456.694,298.756,443.982,341.61z"/>
                      <path d="M404.08,220.131c-1.774,21.279,2.665,24.827,3.548,32.806c2.552,22.978-3.548,48.772-41.676,41.676
		c-11.526,0,0,12.418,20.396,15.965c20.396,3.548,36.354-6.212,36.354-27.492c0-21.287-7.979-61.188-5.322-71.824
		C420.046,200.625,405.854,198.844,404.08,220.131z"/>
                    </g>
                  </svg>
                </div>

                {/* Pocket Content (Logo & Greeting) */}
                <div className="absolute inset-0 flex flex-col items-center pt-20 px-6 z-30 pointer-events-none">
                  <div className="font-bold tracking-[0.2em] text-lg uppercase text-[#8b7355] mb-4">
                    ABHI LINK
                  </div>
                  <div className="text-center mt-4">
                    <div className="text-base text-[#8b7355] opacity-80 font-medium tracking-wide uppercase">
                      {getGreeting()}
                    </div>
                    <div className="font-bold text-3xl text-[#4a3018] tracking-wide truncate max-w-[240px] mt-[30px] leading-tight">
                      <div>{name.split(' ')[0]}</div>
                      {name.split(' ').slice(1).join(' ') && <div>{name.split(' ').slice(1).join(' ')}</div>}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Export Wrapper */}
            <div ref={exportWrapperRef} className="absolute inset-0 pointer-events-none z-10 flex justify-center items-center">
              {/* The Card */}
              <motion.div
                ref={cardRef}
                data-card-element="true"
                drag={step === 'pocket' ? "y" : false}
                dragConstraints={{ top: -250, bottom: 0 }}
                dragElastic={0.2}
                onDragEnd={(e, info) => {
                  if (info.offset.y < -150 || info.velocity.y < -500) {
                    setStep('revealed');
                  }
                }}
                onClick={() => {
                  if (step === 'revealed') {
                    setStep('pocket');
                    setIsStealthMode(true);
                  }
                }}
                initial={{ y: 500, opacity: 0 }}
                animate={{ 
                  // Card peeks out above the sleeve by 40px (Sleeve top is at -100px from center, card top is at -240px + 100px = -140px)
                  y: step === 'pocket' ? 100 : -40, 
                  opacity: 1,
                  scale: step === 'revealed' ? 1.05 : 0.95
                }}
                transition={{ type: "spring", bounce: 0, duration: 0.7 }}
                style={{ y: cardDragY, rotateX, rotateY, willChange: 'transform' }}
                onMouseMove={step === 'revealed' ? handleMouseMove : undefined}
                onMouseLeave={step === 'revealed' ? handleMouseLeave : undefined}
                className={`relative w-[300px] h-[480px] rounded-[1.5rem] transform-style-3d shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),inset_0_-1px_1px_rgba(0,0,0,0.6),0_25px_50px_rgba(0,0,0,0.6)] overflow-hidden pointer-events-auto ${step === 'revealed' ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'}`}
              >
              {/* Card Background Pattern */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#4a3018] via-[#7a5230] to-[#2a1a0a]" />
              
              {/* Card Texture */}
              <div 
                className="absolute inset-0 opacity-50 mix-blend-overlay pointer-events-none"
                style={{ 
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
                }}
              />

              {/* Tiger Watermark */}
              <div className="absolute -right-20 -bottom-20 pointer-events-none mix-blend-overlay">
                <div className="w-96 h-96 opacity-15 text-[#0a0500]">
                  <svg viewBox="0 0 512 512" fill="none" stroke="currentColor" strokeWidth="1" xmlns="http://www.w3.org/2000/svg">
                    <g>
                      <path d="M443.982,341.61c-11.262,37.992-67.386-16.849-83.351-18.623c-0.883,27.492,20.396,26.601,30.149,42.559c9.753,15.965-31.032,54.983-38.128,61.189c-7.096,6.204-23.053,13.889-39.902,13.889s-42.468-9.678-42.468-17.732c0-3.933,0.558-11.979,1.14-19.204c18.245-4.581,36.369-19.12,47.631-29.673c7.066-6.62,7.142-31.84,7.142-31.84l-9.014-57.354c0,0-5.321-16.75,15.445-19.309c36.354-4.484,48.401-23.416,48.401-23.416s23.921-28.473-9.036-28.473c-32.957,0-78.143,4.929-76.09,24.291c3.178,29.998,3.095,30.014,9.851,108.881h-25.356h-48.794H206.24c6.756-78.867,6.681-78.882,9.859-108.881c2.045-19.362-43.133-24.291-76.097-24.291c-32.958,0-9.028,28.473-9.028,28.473s12.04,18.932,48.393,23.416c20.767,2.558,15.445,19.309,15.445,19.309l-9.006,57.354c0,0,0.076,25.22,7.134,31.84c11.262,10.552,29.387,25.092,47.639,29.673c0.574,7.224,1.132,15.271,1.132,19.204c0,8.054-25.612,17.732-42.461,17.732c-16.848,0-32.813-7.685-39.902-13.889c-7.096-6.206-47.888-45.224-38.135-61.189c9.76-15.958,31.04-15.068,30.149-42.559c-15.958,1.774-72.081,56.614-83.351,18.623C55.3,298.756,59.149,196.187,97.277,154.511c26.752-29.251,46.56-57.165,89.382-71.228c1.532-0.393,3.827-1.05,7.005-2c1.404-0.431,2.756-0.816,4.069-1.193c7.367-1.834,15.361-3.307,24.11-4.364c17.18-0.392,15.376,9.406,15.376,12.637c0,4.438-3.147,6.559-17.573,10.281c-47.888,10.643-73.598,41.682-79.811,54.983c-7.202,15.429,3.306,22.752,13.95,7.677c10.635-15.075,32.421-31.228,50.107-38.045c18.366-7.088,24.404-9.186,33.326-7.088c2.59,0.619,7.345,4.922,7.345,10.236c0,5.321-6.559,8.666-12.591,12.591c-26.503,13.648-31.84,28.812-33.614,34.134c-1.774,5.314,5.405,11.066,8.945,5.752c13.12-23.876,38.943-30.586,38.943-25.258c0,5.314,0,26.602,0,36.354c0,9.752,0.883,21.279,9.753,21.279c8.862,0,9.752-11.527,9.752-21.279c0-9.753,0-31.04,0-36.354c0-5.329,25.816,1.382,38.936,25.258c3.548,5.314,10.719-0.438,8.946-5.752c-1.774-5.322-7.104-20.487-33.607-34.134c-6.031-3.925-12.598-7.27-12.598-12.591c0-5.314,4.755-9.617,7.352-10.236c8.915-2.098,14.954,0,33.319,7.088c17.686,6.817,39.472,22.97,50.115,38.045c10.636,15.074,21.152,7.752,13.942-7.677c-6.205-13.301-31.922-44.34-79.803-54.983c-14.425-3.722-17.573-5.843-17.573-10.281c0-3.231-1.804-13.029,15.376-12.637c8.749,1.057,16.736,2.529,24.103,4.364c1.313,0.377,2.672,0.762,4.069,1.193c3.178,0.951,5.473,1.608,7.012,2c42.816,14.063,62.623,41.977,89.383,71.228C452.852,196.187,456.694,298.756,443.982,341.61z"/>
                      <path d="M404.08,220.131c-1.774,21.279,2.665,24.827,3.548,32.806c2.552,22.978-3.548,48.772-41.676,41.676c-11.526,0,0,12.418,20.396,15.965c20.396,3.548,36.354-6.212,36.354-27.492c0-21.287-7.979-61.188-5.322-71.824C420.046,200.625,405.854,198.844,404.08,220.131z"/>
                    </g>
                  </svg>
                </div>
              </div>
              
              {/* Holographic Glare */}
              <motion.div
                className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-40"
                style={{
                  background: 'radial-gradient(circle at center, rgba(255, 255, 255, 0.8) 0%, transparent 60%)',
                  x: glareX,
                  y: glareY,
                }}
              />

              {/* Metal Glare Overlay */}
              <div 
                className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-50" 
                style={{ background: 'linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.4) 25%, rgba(255,255,255,0.8) 28%, transparent 32%)' }} 
              />

              {/* Foil Glare (Animated on pull) */}
              <motion.div
                className={`absolute inset-0 pointer-events-none ${isSharing ? 'opacity-30' : 'mix-blend-color-dodge opacity-60'}`}
                style={{
                  backgroundImage: 'linear-gradient(115deg, transparent 20%, rgba(255,215,150,0.3) 45%, rgba(255,255,255,0.7) 50%, rgba(255,215,150,0.3) 55%, transparent 80%)',
                  backgroundSize: '200% 200%',
                  backgroundPosition: isSharing ? '100% 100%' : foilPos,
                }}
              />

              {/* Card Content */}
              <div className="p-6 h-full flex flex-col relative z-10 text-[#fdfbf7]">
                {/* Top Section (Visible when in pocket) */}
                <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <div className="font-bold text-2xl tracking-wide text-[#e8c382] drop-shadow-md">
                      {name}
                    </div>
                    {!(businessType === 'custom' && !customBusinessName.trim()) && (
                      <div className="text-sm text-[#e8c382]/80 uppercase tracking-wider mt-1">
                        {businessType === 'custom' ? customBusinessName : businessType}
                      </div>
                    )}
                  </div>
                </div>

                {/* UPI ID */}
                <div className="flex items-center justify-between mt-4 w-full gap-2">
                  <div 
                    className="font-mono font-medium tracking-widest text-[#e8c382] drop-shadow-md whitespace-nowrap"
                    style={{ fontSize: (upi.length > 35 ? '0.625rem' : upi.length > 28 ? '0.75rem' : upi.length > 22 ? '0.875rem' : upi.length > 16 ? '1rem' : '1.125rem') }}
                  >
                    {isStealthMode ? '•'.repeat(upi.length) : upi}
                  </div>
                  
                  {/* Reveal Button (Eye Icon) */}
                  {!isSharing && step === 'revealed' && (
                    <motion.button 
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent card stow
                        setIsStealthMode(!isStealthMode);
                      }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 transition-opacity hover:opacity-70 flex-shrink-0 relative -top-[2px]"
                    >
                      {isStealthMode ? <Eye className="w-4 h-4 text-[#e8c382]" /> : <EyeOff className="w-4 h-4 text-[#e8c382]" />}
                    </motion.button>
                  )}
                </div>

                {/* QR Code Area */}
                <div className="flex-1 flex flex-col items-center justify-center relative mt-4">
                  <div className="relative group w-full flex justify-center">
                    <div 
                      className="w-48 h-48 bg-transparent flex items-center justify-center p-2"
                    >
                      <div ref={qrRef} className="w-full h-full flex items-center justify-center" />
                    </div>
                  </div>
                  {shareAmount && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 font-bold text-2xl text-[#e8c382] tracking-wider drop-shadow-md"
                    >
                      ₹{shareAmount}
                    </motion.div>
                  )}
                </div>

                {/* Footer Details */}
                <div className="mt-8 mb-2 flex justify-between items-end">
                  <div className="flex flex-col gap-0.5">
                    <div className="font-bold tracking-widest text-xs uppercase text-[#e8c382]">ABHI LINK</div>
                    <div className="font-bold tracking-widest text-[8px] uppercase text-[#e8c382]/50">UPI PREMIUM CARD</div>
                  </div>
                  <Wifi className="w-6 h-6 text-[#e8c382] rotate-90 opacity-80 mb-[5px]" />
                </div>
              </div>
            </motion.div>
            </div>

            {/* Hint Arrow for Pocket */}
            {step === 'pocket' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="absolute top-[50%] mt-[-170px] text-[#8b7355] font-bold text-xl pointer-events-none z-10"
              >
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  ↑
                </motion.div>
              </motion.div>
            )}

            {/* Share Button */}
            {step === 'revealed' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute bottom-10 z-30 w-full px-6 flex justify-center"
              >
                <button
                  onClick={() => setShowAmountModal(true)}
                  disabled={isSharing}
                  className="w-full max-w-[280px] py-4 rounded-xl bg-gradient-to-r from-[#e8c382] via-[#f3dca3] to-[#e8c382] text-[#1a0f05] font-bold uppercase tracking-widest disabled:opacity-50 shadow-[0_0_15px_rgba(232,195,130,0.3)] flex items-center justify-center gap-2 relative overflow-hidden active:scale-95 transition-transform"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_2.5s_infinite]" />
                  {isSharing ? (
                    <div className="flex items-center gap-3">
                      <div className="relative w-6 h-6 flex items-center justify-center">
                        <motion.div
                          className="absolute inset-0 border-2 border-[#1a0f05] rounded-full"
                          animate={{ scale: [1, 1.5], opacity: [1, 0] }}
                          transition={{ duration: 1, repeat: Infinity, ease: "easeOut" }}
                        />
                        <motion.div
                          className="absolute inset-0 border-2 border-[#1a0f05] rounded-full"
                          animate={{ scale: [1, 1.2], opacity: [0.5, 0] }}
                          transition={{ duration: 1, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
                        />
                        <div className="w-2 h-2 bg-[#1a0f05] rounded-full relative z-10" />
                      </div>
                      <motion.span 
                        initial={{ opacity: 0.5 }}
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="relative z-10"
                      >
                        Crafting Card...
                      </motion.span>
                    </div>
                  ) : (
                    <>
                      <Share2 className="w-5 h-5 relative z-10" />
                      <span className="relative z-10">Share Card</span>
                    </>
                  )}
                </button>
              </motion.div>
            )}

          </motion.div>
        )}
        </AnimatePresence>

        {/* Amount Input Modal */}
        <AnimatePresence>
          {showAmountModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-[#f5f2ed] border border-[#d4c5b9] rounded-3xl p-6 w-full max-w-sm shadow-2xl relative"
              >
                <motion.button
                  onClick={() => setShowAmountModal(false)}
                  whileHover={{ scale: 1.1, rotate: 90, backgroundColor: "#f3f4f6" }}
                  whileTap={{ scale: 0.92 }}
                  className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 transition-colors z-10"
                >
                  <X className="w-4 h-4" />
                </motion.button>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Share with Amount</h3>
                <p className="text-gray-500 text-sm mb-6">Enter an amount to request, or skip to share without an amount.</p>
                
                <div className="relative mb-6">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-lg">₹</span>
                  <input
                    type="search"
                    inputMode="decimal"
                    pattern="[0-9]*"
                    value={shareAmount}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9.]/g, '');
                      setShareAmount(val);
                    }}
                    placeholder="0.00"
                    autoComplete="new-password"
                    aria-autocomplete="none"
                    autoCorrect="off"
                    spellCheck="false"
                    name="amount"
                    data-lpignore="true"
                    data-form-type="other"
                    className="w-full bg-white border border-[#d4c5b9]/50 rounded-xl pl-10 pr-4 py-4 text-gray-900 text-lg font-bold focus:bg-white focus:border-[#e8c382] focus:ring-2 focus:ring-[#e8c382]/20 outline-none transition-all"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShareAmount('');
                      setShowAmountModal(false);
                      // Small delay to allow modal to close before capturing
                      setTimeout(shareCard, 300);
                    }}
                    className="flex-1 py-3 rounded-xl bg-white border border-[#d4c5b9]/50 text-[#8b7355] font-bold transition-colors active:scale-95"
                  >
                    Skip
                  </button>
                  <button
                    onClick={() => {
                      setShowAmountModal(false);
                      // Small delay to allow modal to close before capturing
                      setTimeout(shareCard, 300);
                    }}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#e8c382] to-[#f3dca3] text-[#1a0f05] font-bold shadow-lg relative overflow-hidden flex items-center justify-center active:scale-95 transition-transform"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_2.5s_infinite]" />
                    {isSharing ? (
                      <div className="flex items-center gap-2">
                        <div className="relative w-4 h-4 flex items-center justify-center">
                          <motion.div
                            className="absolute inset-0 border-2 border-[#1a0f05] rounded-full"
                            animate={{ scale: [1, 1.5], opacity: [1, 0] }}
                            transition={{ duration: 1, repeat: Infinity, ease: "easeOut" }}
                          />
                          <div className="w-1 h-1 bg-[#1a0f05] rounded-full relative z-10" />
                        </div>
                        <span className="text-sm">Processing...</span>
                      </div>
                    ) : (
                      <span className="relative z-10">Share</span>
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
  );
});

DigitalCardModal.displayName = 'DigitalCardModal';

