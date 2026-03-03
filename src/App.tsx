import React, { useState, useRef, useEffect } from 'react';
import { ExternalLink } from 'lucide-react';
import { motion } from "motion/react";
import { PaymentForm } from './components/PaymentForm';
import { QRCodeDisplay } from './components/QRCodeDisplay';
import { handleDownload, handleShare } from './utils/qrGenerator';

export default function App() {
  const [upiId, setUpiId] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('upi') || '';
  });
  const [touchedUpiId, setTouchedUpiId] = useState(false);
  const [payeeName, setPayeeName] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('name') || '';
  });
  const [amount, setAmount] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const urlAmount = params.get('amount');
    if (!urlAmount) return '';
    
    let val = urlAmount.replace(/[^0-9.]/g, '');
    const parts = val.split('.');
    if (parts.length > 2) val = parts[0] + '.' + parts.slice(1).join('');
    if (parts.length === 2 && parts[1].length > 2) val = parts[0] + '.' + parts[1].substring(0, 2);
    if (val) {
      const splitVal = val.split('.');
      let intPart = splitVal[0].replace(/^0+(?=\d)/, '');
      if (intPart) intPart = new Intl.NumberFormat('en-IN').format(BigInt(intPart));
      else if (val.startsWith('.')) intPart = '0';
      val = splitVal.length > 1 ? intPart + '.' + splitVal[1] : intPart;
    }
    return val;
  });
  const [remarks, setRemarks] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('remarks') || '';
  });
  
  const [recentPayees, setRecentPayees] = useState<{upiId: string, payeeName: string}[]>(() => {
    try {
      const saved = localStorage.getItem('recentPayees');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const qrRef = useRef<SVGSVGElement>(null);
  const typewriterRef = useRef<number | null>(null);

  // Validate UPI ID format (e.g., name@bank)
  const upiRegex = /^[\w.-]+@[\w.-]+$/;
  const isValidUpi = upiId === '' || upiRegex.test(upiId);
  const showUpiError = touchedUpiId && !isValidUpi && upiId.length > 0;

  const saveRecentPayee = () => {
    if (isValidUpi && upiId) {
      setRecentPayees(prev => {
        const existingIndex = prev.findIndex(p => p.upiId === upiId);
        let newPayees = [...prev];
        if (existingIndex >= 0) {
          newPayees[existingIndex] = { upiId, payeeName: payeeName || newPayees[existingIndex].payeeName };
          const [item] = newPayees.splice(existingIndex, 1);
          newPayees.unshift(item);
        } else {
          newPayees.unshift({ upiId, payeeName });
        }
        newPayees = newPayees.slice(0, 4); // Keep last 4
        localStorage.setItem('recentPayees', JSON.stringify(newPayees));
        return newPayees;
      });
    }
  };

  const handleSelectRecent = (payee: {upiId: string, payeeName: string}) => {
    if (typewriterRef.current) {
      window.clearInterval(typewriterRef.current);
    }

    setUpiId('');
    setPayeeName('');
    setTouchedUpiId(false);

    let upiIndex = 0;
    let nameIndex = 0;

    typewriterRef.current = window.setInterval(() => {
      let upiDone = false;
      let nameDone = false;

      if (upiIndex < payee.upiId.length) {
        setUpiId(payee.upiId.substring(0, upiIndex + 1));
        upiIndex++;
      } else {
        upiDone = true;
      }

      if (nameIndex < payee.payeeName.length) {
        setPayeeName(payee.payeeName.substring(0, nameIndex + 1));
        nameIndex++;
      } else {
        nameDone = true;
      }

      if (upiDone && nameDone) {
        if (typewriterRef.current) window.clearInterval(typewriterRef.current);
      }
    }, 30);
  };

  const handleUpiIdChange = (val: string) => {
    if (typewriterRef.current) window.clearInterval(typewriterRef.current);
    setUpiId(val);
  };

  const handlePayeeNameChange = (val: string) => {
    if (typewriterRef.current) window.clearInterval(typewriterRef.current);
    setPayeeName(val);
  };

  const handleRemoveRecent = (upiIdToRemove: string) => {
    setRecentPayees(prev => {
      const newPayees = prev.filter(p => p.upiId !== upiIdToRemove);
      localStorage.setItem('recentPayees', JSON.stringify(newPayees));
      return newPayees;
    });
  };

  // Construct UPI URL
  // Format: upi://pay?pa=UPI_ID&pn=PAYEE_NAME&am=AMOUNT&cu=INR&tn=REMARKS
  const generateUpiUrl = () => {
    if (!upiId) return '';
    
    const params = new URLSearchParams();
    params.append('pa', upiId);
    if (payeeName) params.append('pn', payeeName);
    if (amount) params.append('am', amount.replace(/,/g, ''));
    params.append('cu', 'INR');
    if (remarks) params.append('tn', remarks);

    return `upi://pay?${params.toString()}`;
  };

  const upiUrl = generateUpiUrl();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlUpi = params.get('upi');
    if (urlUpi) {
      const urlName = params.get('name');
      const urlAmount = params.get('amount');
      const urlRemarks = params.get('remarks');
      
      const upiParams = new URLSearchParams();
      upiParams.append('pa', urlUpi);
      if (urlName) upiParams.append('pn', urlName);
      if (urlAmount) upiParams.append('am', urlAmount.replace(/,/g, ''));
      upiParams.append('cu', 'INR');
      if (urlRemarks) upiParams.append('tn', urlRemarks);

      const intentUrl = `upi://pay?${upiParams.toString()}`;
      
      // Attempt to auto-open the UPI app
      window.location.replace(intentUrl);
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#e6e1dc] py-12 px-4 sm:px-6 lg:px-8 font-sans relative select-none">
      {/* Dummy datalist to trick browsers into disabling autocomplete */}
      <datalist id="autocompleteOff"></datalist>
      
      {/* Developer's Other App Link */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <a
          href="https://ledger69.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#2d2d2b] bg-white/50 hover:bg-white px-4 py-2.5 rounded-full border-2 border-[#d9d3ce] hover:border-[#2d2d2b] transition-all shadow-sm uppercase tracking-wide"
        >
          <span>Try Ledger69</span>
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      <div className="max-w-3xl mx-auto mt-8 sm:mt-0">
        <div className="text-center mb-10">
          <h1 className="text-6xl md:text-8xl font-black text-[#2d2d2b] tracking-tighter font-display uppercase mb-4">ABHI LINK</h1>
          <p className="mt-3 text-[#2d2d2b]/70 max-w-xl mx-auto font-medium">
            Create a personalized UPI payment QR code with a pre-filled amount and custom remarks.
          </p>
        </div>

        {new URLSearchParams(window.location.search).get('upi') && (
          <div className="mb-8 bg-white p-8 rounded-3xl shadow-sm border border-[#d9d3ce] text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-black text-[#2d2d2b] mb-2 uppercase tracking-tight">Payment Request</h2>
            
            {(new URLSearchParams(window.location.search).get('name') || new URLSearchParams(window.location.search).get('amount')) && (
              <div className="mb-6 bg-[#f5f5f0] rounded-2xl p-6 border border-[#d9d3ce]">
                {new URLSearchParams(window.location.search).get('name') && (
                  <div className="mb-2">
                    <p className="text-xs font-bold text-[#2d2d2b]/50 uppercase tracking-wider">Request from</p>
                    <p className="text-xl font-bold text-[#2d2d2b]">{new URLSearchParams(window.location.search).get('name')}</p>
                  </div>
                )}
                
                {new URLSearchParams(window.location.search).get('amount') && (
                  <div className={new URLSearchParams(window.location.search).get('name') ? "mt-4 pt-4 border-t border-[#d9d3ce]/50" : ""}>
                    <p className="text-xs font-bold text-[#2d2d2b]/50 uppercase tracking-wider">Amount</p>
                    <p className="text-4xl font-black text-[#2d2d2b] tracking-tight">
                      ₹{new URLSearchParams(window.location.search).get('amount')}
                    </p>
                  </div>
                )}
              </div>
            )}

            <p className="text-[#2d2d2b]/70 mb-6 font-medium">If your UPI app didn't open automatically, click the button below to pay.</p>
            <motion.a 
              href={upiUrl}
              className="relative inline-flex items-center justify-center w-full sm:w-auto bg-[#2d2d2b] text-white font-bold text-lg px-8 py-4 rounded-xl overflow-hidden shadow-lg group"
              whileHover={{ scale: 1.02, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <span className="relative z-10">Pay Now with UPI App</span>
              <motion.div
                className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                initial={{ x: '-100%' }}
                animate={{ x: '200%' }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 1.5, 
                  ease: "easeInOut", 
                  repeatDelay: 3 
                }}
              />
            </motion.a>
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-sm border border-[#d9d3ce] overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">
            
            {/* Form Section */}
            <PaymentForm 
              upiId={upiId}
              setUpiId={handleUpiIdChange}
              payeeName={payeeName}
              setPayeeName={handlePayeeNameChange}
              amount={amount}
              setAmount={setAmount}
              remarks={remarks}
              setRemarks={setRemarks}
              showUpiError={showUpiError}
              setTouchedUpiId={setTouchedUpiId}
              recentPayees={recentPayees}
              onSelectRecent={handleSelectRecent}
              onRemoveRecent={handleRemoveRecent}
              onSaveRecent={saveRecentPayee}
            />

            {/* QR Code Section */}
            <QRCodeDisplay 
              upiId={upiId}
              isValidUpi={isValidUpi}
              upiUrl={upiUrl}
              amount={amount}
              payeeName={payeeName}
              remarks={remarks}
              qrRef={qrRef}
              onDownload={() => handleDownload(qrRef, amount, payeeName, remarks)}
              onShare={() => handleShare(qrRef, amount, payeeName, remarks, upiId)}
            />
            
          </div>
        </div>
        
        <div className="mt-8 text-center text-sm font-bold text-[#2d2d2b]/50 uppercase tracking-wide">
          <p>Scan this QR code with any UPI app</p>
          <p className="mt-2 text-sm normal-case text-[#2d2d2b]/70" style={{ fontFamily: '"Comic Sans MS", "Comic Sans", cursive', fontWeight: 'bold' }}>
            Developer: Abhinav Yaduvanshi
          </p>
        </div>
      </div>
    </div>
  );
}
