import React, { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, QrCode, IndianRupee, MessageSquare, User, Share2, ExternalLink } from 'lucide-react';

export default function App() {
  const [upiId, setUpiId] = useState('');
  const [payeeName, setPayeeName] = useState('');
  const [amount, setAmount] = useState('');
  const [remarks, setRemarks] = useState('');
  const qrRef = useRef<SVGSVGElement>(null);

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

  const generateCanvas = async (): Promise<HTMLCanvasElement | null> => {
    if (!qrRef.current) return null;
    
    // Wait for fonts to be ready to ensure they render on canvas
    await document.fonts.ready;

    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // 1. Draw Background
    ctx.fillStyle = '#e6e1dc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Draw Card
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0,0,0,0.05)';
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 20;
    ctx.beginPath();
    ctx.roundRect(100, 100, 880, 880, 40);
    ctx.fill();
    ctx.shadowColor = 'transparent'; // reset shadow

    // 3. Draw ABHI LINK Logo
    ctx.fillStyle = '#2d2d2b';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = '900 100px "Archivo Black", sans-serif';
    ctx.fillText('ABHI LINK', 540, 160);

    // 4. Draw QR Code
    const svgData = new XMLSerializer().serializeToString(qrRef.current);
    const img = new Image();
    
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    });

    const qrSize = 400;
    ctx.drawImage(img, 540 - qrSize / 2, 280, qrSize, qrSize);

    // 5. Draw Details
    let currentY = 710;
    
    if (amount) {
      ctx.font = '900 64px "Inter", sans-serif';
      ctx.fillText(`₹${amount}`, 540, currentY);
      currentY += 70;
    }

    if (payeeName) {
      ctx.font = 'bold 32px "Inter", sans-serif';
      ctx.fillText(`PAYING TO: ${payeeName.toUpperCase()}`, 540, currentY);
      currentY += 50;
    }

    if (remarks) {
      ctx.font = 'italic 500 24px "Inter", sans-serif';
      ctx.fillStyle = 'rgba(45, 45, 43, 0.7)';
      ctx.fillText(`"${remarks}"`, 540, currentY);
    }

    // 6. Draw Footer
    ctx.fillStyle = 'rgba(45, 45, 43, 0.4)';
    ctx.font = 'bold 24px "Inter", sans-serif';
    ctx.fillText('SCAN TO PAY WITH ANY UPI APP', 540, 900);

    // 7. Draw Developer Info
    ctx.fillStyle = 'rgba(45, 45, 43, 0.6)';
    ctx.font = 'bold 20px "Comic Sans MS", "Comic Sans", cursive';
    ctx.fillText('Developer: Abhinav Yaduvanshi', 540, 940);

    return canvas;
  };

  const handleDownload = async () => {
    const canvas = await generateCanvas();
    if (!canvas) return;
    
    const pngFile = canvas.toDataURL('image/png');
    const downloadLink = document.createElement('a');
    downloadLink.download = `abhi-link-qr-${amount ? amount + 'rs' : 'code'}.png`;
    downloadLink.href = pngFile;
    downloadLink.click();
  };

  const handleShare = async () => {
    const canvas = await generateCanvas();
    if (!canvas) return;

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], `abhi-link-qr.png`, { type: 'image/png' });
      
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: 'ABHI LINK Payment QR',
            text: 'Scan this QR code to pay.',
            files: [file],
          });
        } catch (error) {
          console.error('Error sharing:', error);
        }
      } else {
        alert('Sharing is not supported on this device/browser.');
      }
    }, 'image/png');
  };

  return (
    <div className="min-h-screen bg-[#e6e1dc] py-12 px-4 sm:px-6 lg:px-8 font-sans relative">
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
            <div className="p-8 border-b md:border-b-0 md:border-r border-[#d9d3ce]">
              <h2 className="text-lg font-bold text-[#2d2d2b] mb-6 uppercase tracking-wide">Payment Details</h2>
              
              <div className="space-y-5">
                <div>
                  <label htmlFor="upiId" className="block text-sm font-bold text-[#2d2d2b] mb-1.5 uppercase tracking-wide">
                    UPI ID (VPA) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-[#2d2d2b]/40" />
                    </div>
                    <input
                      type="text"
                      id="upiId"
                      className="block w-full pl-10 pr-3 py-3 border-2 border-[#d9d3ce] rounded-xl focus:ring-0 focus:border-[#2d2d2b] sm:text-sm transition-colors bg-[#faf9f8] text-[#2d2d2b] font-medium placeholder:text-[#2d2d2b]/40"
                      placeholder="e.g. john@okhdfcbank"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="payeeName" className="block text-sm font-bold text-[#2d2d2b] mb-1.5 uppercase tracking-wide">
                    Receiver Name
                  </label>
                  <input
                    type="text"
                    id="payeeName"
                    className="block w-full px-3 py-3 border-2 border-[#d9d3ce] rounded-xl focus:ring-0 focus:border-[#2d2d2b] sm:text-sm transition-colors bg-[#faf9f8] text-[#2d2d2b] font-medium placeholder:text-[#2d2d2b]/40"
                    placeholder="e.g. John Doe"
                    value={payeeName}
                    onChange={(e) => setPayeeName(e.target.value)}
                  />
                </div>

                <div>
                  <label htmlFor="amount" className="block text-sm font-bold text-[#2d2d2b] mb-1.5 uppercase tracking-wide">
                    Amount (₹)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <IndianRupee className="h-5 w-5 text-[#2d2d2b]/40" />
                    </div>
                    <input
                      type="number"
                      id="amount"
                      min="1"
                      step="any"
                      className="block w-full pl-10 pr-3 py-3 border-2 border-[#d9d3ce] rounded-xl focus:ring-0 focus:border-[#2d2d2b] sm:text-sm transition-colors bg-[#faf9f8] text-[#2d2d2b] font-medium placeholder:text-[#2d2d2b]/40"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="remarks" className="block text-sm font-bold text-[#2d2d2b] mb-1.5 uppercase tracking-wide">
                    Remarks / Note
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MessageSquare className="h-5 w-5 text-[#2d2d2b]/40" />
                    </div>
                    <input
                      type="text"
                      id="remarks"
                      maxLength={30}
                      className="block w-full pl-10 pr-3 py-3 border-2 border-[#d9d3ce] rounded-xl focus:ring-0 focus:border-[#2d2d2b] sm:text-sm transition-colors bg-[#faf9f8] text-[#2d2d2b] font-medium placeholder:text-[#2d2d2b]/40"
                      placeholder="e.g. Rent (Max 30 chars)"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* QR Code Section */}
            <div className="p-8 bg-[#faf9f8] flex flex-col items-center justify-center">
              {upiId ? (
                <div className="flex flex-col items-center w-full">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border-2 border-[#d9d3ce] mb-6">
                    <QRCodeSVG
                      id="upi-qr-code"
                      value={upiUrl}
                      size={200}
                      level="H"
                      includeMargin={false}
                      ref={qrRef}
                      fgColor="#2d2d2b"
                      imageSettings={{
                        src: "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='20' fill='%232d2d2b'/%3E%3Ctext x='50' y='50' font-family='Arial, sans-serif' font-weight='900' font-size='60' fill='%23e6e1dc' text-anchor='middle' dominant-baseline='central'%3EA%3C/text%3E%3C/svg%3E",
                        x: undefined,
                        y: undefined,
                        height: 48,
                        width: 48,
                        excavate: true,
                      }}
                    />
                  </div>
                  
                  <div className="text-center mb-6 w-full">
                    {amount && (
                      <div className="text-3xl font-black text-[#2d2d2b] mb-1">
                        ₹{amount}
                      </div>
                    )}
                    {payeeName && (
                      <div className="text-sm font-bold text-[#2d2d2b] uppercase tracking-wide">
                        Paying to: {payeeName}
                      </div>
                    )}
                    {remarks && (
                      <div className="text-xs text-[#2d2d2b]/70 mt-1 italic font-medium">
                        "{remarks}"
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 w-full">
                    <button
                      onClick={handleDownload}
                      className="flex-1 flex items-center justify-center gap-2 bg-[#2d2d2b] hover:bg-black text-[#e6e1dc] px-6 py-4 rounded-xl font-bold uppercase tracking-wide transition-colors shadow-sm"
                    >
                      <Download className="w-5 h-5" />
                      Download
                    </button>
                    <button
                      onClick={handleShare}
                      className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-[#faf9f8] text-[#2d2d2b] border-2 border-[#2d2d2b] px-6 py-4 rounded-xl font-bold uppercase tracking-wide transition-colors shadow-sm"
                    >
                      <Share2 className="w-5 h-5" />
                      Share
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center flex flex-col items-center justify-center h-full text-[#2d2d2b]/30">
                  <QrCode className="w-16 h-16 mb-4" />
                  <p className="text-sm font-bold uppercase tracking-wide">Enter a UPI ID to generate<br/>your custom QR code.</p>
                </div>
              )}
            </div>
            
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
