import React, { useState, useRef, useEffect } from 'react';
import { ExternalLink } from 'lucide-react';
import { PaymentForm } from './components/PaymentForm';
import { QRCodeDisplay } from './components/QRCodeDisplay';
import { handleDownload, handleShare } from './utils/qrGenerator';

export default function App() {
  const [upiId, setUpiId] = useState(() => localStorage.getItem('savedUpiId') || '');
  const [touchedUpiId, setTouchedUpiId] = useState(false);
  const [payeeName, setPayeeName] = useState(() => localStorage.getItem('savedPayeeName') || '');
  const [amount, setAmount] = useState('');
  const [remarks, setRemarks] = useState('');
  const [saveDetails, setSaveDetails] = useState(() => localStorage.getItem('saveDetails') === 'true');
  const qrRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (saveDetails) {
      localStorage.setItem('savedUpiId', upiId);
      localStorage.setItem('savedPayeeName', payeeName);
      localStorage.setItem('saveDetails', 'true');
    } else {
      localStorage.removeItem('savedUpiId');
      localStorage.removeItem('savedPayeeName');
      localStorage.setItem('saveDetails', 'false');
    }
  }, [upiId, payeeName, saveDetails]);

  // Validate UPI ID format (e.g., name@bank)
  const upiRegex = /^[\w.-]+@[\w.-]+$/;
  const isValidUpi = upiId === '' || upiRegex.test(upiId);
  const showUpiError = touchedUpiId && !isValidUpi && upiId.length > 0;

  // Construct UPI URL
  // Format: upi://pay?pa=UPI_ID&pn=PAYEE_NAME&am=AMOUNT&cu=INR&tn=REMARKS
  const generateUpiUrl = () => {
    if (!upiId) return '';
    
    const params = new URLSearchParams();
    params.append('pa', upiId);
    if (payeeName) params.append('pn', payeeName);
    if (amount) params.append('am', amount);
    params.append('cu', 'INR');
    if (remarks) params.append('tn', remarks);

    return `upi://pay?${params.toString()}`;
  };

  const upiUrl = generateUpiUrl();

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

        <div className="bg-white rounded-3xl shadow-sm border border-[#d9d3ce] overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">
            
            {/* Form Section */}
            <PaymentForm 
              upiId={upiId}
              setUpiId={setUpiId}
              payeeName={payeeName}
              setPayeeName={setPayeeName}
              amount={amount}
              setAmount={setAmount}
              remarks={remarks}
              setRemarks={setRemarks}
              saveDetails={saveDetails}
              setSaveDetails={setSaveDetails}
              showUpiError={showUpiError}
              setTouchedUpiId={setTouchedUpiId}
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
              onShare={() => handleShare(qrRef, amount, payeeName, remarks)}
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
