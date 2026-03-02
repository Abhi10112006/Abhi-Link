import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, QrCode, Share2, Palette } from 'lucide-react';

export type Theme = {
  id: string;
  name: string;
  containerBg: string;
  cardBg: string;
  qrFg: string;
  text: string;
  textMuted: string;
};

interface QRCodeDisplayProps {
  upiId: string;
  isValidUpi: boolean;
  upiUrl: string;
  amount: string;
  payeeName: string;
  remarks: string;
  qrRef: React.RefObject<SVGSVGElement>;
  onDownload: (theme: Theme) => void;
  onShare: (theme: Theme) => void;
}

const getContrastYIQ = (hexcolor: string) => {
  let hex = hexcolor.replace("#", "");
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  const r = parseInt(hex.substring(0,2),16);
  const g = parseInt(hex.substring(2,4),16);
  const b = parseInt(hex.substring(4,6),16);
  const yiq = ((r*299)+(g*587)+(b*114))/1000;
  return (yiq >= 128) ? '#2d2d2b' : '#ffffff';
};

const adjustColor = (color: string, amount: number) => {
    let hex = color.replace(/^#/, '');
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
    let r = parseInt(hex.substring(0,2), 16);
    let g = parseInt(hex.substring(2,4), 16);
    let b = parseInt(hex.substring(4,6), 16);
    r = Math.max(0, Math.min(255, r + amount));
    g = Math.max(0, Math.min(255, g + amount));
    b = Math.max(0, Math.min(255, b + amount));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

const APP_PALETTE = [
  '#faf9f8', // Default Light
  '#e6e1dc', // App Background
  '#fef3c7', // Warm Yellow
  '#dcfce7', // Soft Green
  '#dbeafe', // Soft Blue
  '#f3e8ff', // Soft Purple
  '#ffe4e6', // Soft Rose
  '#2d2d2b', // Dark
];

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  upiId,
  isValidUpi,
  upiUrl,
  amount,
  payeeName,
  remarks,
  qrRef,
  onDownload,
  onShare,
}) => {
  const [customBg, setCustomBg] = useState(() => localStorage.getItem('qrCustomBg') || '#faf9f8');
  
  useEffect(() => {
    localStorage.setItem('qrCustomBg', customBg);
  }, [customBg]);

  const customText = getContrastYIQ(customBg);
  
  const currentTheme: Theme = {
    id: 'custom',
    name: 'Custom',
    containerBg: customBg,
    cardBg: customText === '#ffffff' ? adjustColor(customBg, -20) : '#ffffff',
    qrFg: customText,
    text: customText,
    textMuted: customText === '#ffffff' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(45, 45, 43, 0.6)'
  };

  return (
    <div 
      className="p-8 flex flex-col items-center justify-center transition-colors duration-500 relative min-h-full"
      style={{ backgroundColor: currentTheme.containerBg, color: currentTheme.text }}
    >
      <div className="w-full flex flex-col items-center mb-8 gap-3">
        <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">Custom Color Maker</span>
        <div className="flex flex-wrap justify-center gap-2 bg-white/20 p-2 rounded-full backdrop-blur-sm border border-black/5">
          {APP_PALETTE.map(color => (
            <button
              key={color}
              onClick={() => setCustomBg(color)}
              className={`w-6 h-6 rounded-full border-2 transition-all hover:scale-110 ${customBg === color ? 'border-blue-500 scale-110 shadow-sm' : 'border-transparent shadow-sm'}`}
              style={{ backgroundColor: color }}
              aria-label={`Select color ${color}`}
            />
          ))}
          <div className="w-px h-6 bg-current opacity-20 mx-1"></div>
          <label 
            className={`relative w-6 h-6 rounded-full border-2 transition-all cursor-pointer flex items-center justify-center overflow-hidden hover:scale-110 ${!APP_PALETTE.includes(customBg) ? 'border-blue-500 scale-110 shadow-sm' : 'border-transparent shadow-sm'}`}
            style={{ 
              background: 'linear-gradient(45deg, #f87171, #fbbf24, #34d399, #60a5fa, #a78bfa)'
            }}
            title="Custom Color Picker"
          >
            <Palette className="w-3 h-3 text-white drop-shadow-md" />
            <input
              type="color"
              value={customBg}
              onChange={(e) => setCustomBg(e.target.value)}
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              aria-label="Custom color picker"
            />
          </label>
        </div>
      </div>

      {upiId && isValidUpi ? (
        <div className="flex flex-col items-center w-full">
          {payeeName && (
            <div className="flex items-baseline justify-center gap-1.5 mb-4 w-full px-4">
              <div className="text-xl font-bold uppercase tracking-tight whitespace-nowrap" style={{ color: currentTheme.textMuted }}>
                Paying To:
              </div>
              <div className="text-xl font-black uppercase tracking-tight truncate" style={{ color: currentTheme.text }}>
                {payeeName}
              </div>
            </div>
          )}
          <div 
            className="p-6 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-500 mb-6"
            style={{ backgroundColor: currentTheme.cardBg, borderColor: currentTheme.textMuted, borderWidth: '2px' }}
          >
            <QRCodeSVG
              id="upi-qr-code"
              value={upiUrl}
              size={200}
              level="H"
              includeMargin={false}
              ref={qrRef}
              fgColor={currentTheme.qrFg}
              bgColor="transparent"
              imageSettings={{
                src: `data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='20' fill='${encodeURIComponent(currentTheme.qrFg)}'/%3E%3Ctext x='50' y='50' font-family='Arial, sans-serif' font-weight='900' font-size='60' fill='${encodeURIComponent(currentTheme.cardBg)}' text-anchor='middle' dominant-baseline='central'%3EA%3C/text%3E%3C/svg%3E`,
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
              <div className="text-3xl font-black mb-1" style={{ color: currentTheme.text }}>
                ₹{amount}
              </div>
            )}
            {remarks && (
              <div className="text-xs mt-1 italic font-medium" style={{ color: currentTheme.textMuted }}>
                "{remarks}"
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full mt-4">
            <button
              onClick={() => onDownload(currentTheme)}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold uppercase tracking-wide transition-colors shadow-sm border-2"
              style={{ 
                backgroundColor: currentTheme.text, 
                color: currentTheme.containerBg,
                borderColor: currentTheme.text
              }}
            >
              <Download className="w-5 h-5" />
              Download
            </button>
            <button
              onClick={() => onShare(currentTheme)}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold uppercase tracking-wide transition-colors shadow-sm border-2"
              style={{ 
                backgroundColor: currentTheme.cardBg, 
                color: currentTheme.text,
                borderColor: currentTheme.text
              }}
            >
              <Share2 className="w-5 h-5" />
              Share
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center flex flex-col items-center justify-center h-full" style={{ color: currentTheme.textMuted }}>
          <QrCode className="w-16 h-16 mb-4 opacity-50" />
          <p className="text-sm font-bold uppercase tracking-wide opacity-80">
            {upiId && !isValidUpi 
              ? "Enter a valid UPI ID to generate your custom QR code."
              : "Enter a UPI ID to generate your custom QR code."}
          </p>
        </div>
      )}
    </div>
  );
};
