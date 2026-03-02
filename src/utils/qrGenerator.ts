export const generateCanvas = async (
  qrRef: React.RefObject<SVGSVGElement>,
  amount: string,
  payeeName: string,
  remarks: string
): Promise<HTMLCanvasElement | null> => {
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

  // 3. Draw Header (Brand & Payee)
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  if (payeeName) {
    ctx.fillStyle = 'rgba(45, 45, 43, 0.5)';
    ctx.font = '900 28px "Archivo Black", sans-serif';
    ctx.fillText('ABHI LINK', 540, 140);

    ctx.textBaseline = 'alphabetic';
    const prefix = 'PAYING TO: ';
    const nameStr = payeeName.toUpperCase();
    
    let fontSize = 36;
    let prefixWidth = 0;
    let nameWidth = 0;
    let totalWidth = 0;
    const maxWidth = 800;

    // Calculate initial widths
    ctx.font = `bold ${fontSize}px "Inter", sans-serif`;
    prefixWidth = ctx.measureText(prefix).width;
    ctx.font = `900 ${fontSize}px "Inter", sans-serif`;
    nameWidth = ctx.measureText(nameStr).width;
    totalWidth = prefixWidth + nameWidth;

    let finalNameStr = nameStr;

    // Truncate with ellipsis if necessary
    if (totalWidth > maxWidth) {
      const ellipsis = '...';
      const ellipsisWidth = ctx.measureText(ellipsis).width;
      const availableNameWidth = maxWidth - prefixWidth - ellipsisWidth;
      
      let truncatedName = '';
      for (let i = 0; i < nameStr.length; i++) {
        const testStr = nameStr.substring(0, i + 1);
        if (ctx.measureText(testStr).width > availableNameWidth) {
          break;
        }
        truncatedName = testStr;
      }
      finalNameStr = truncatedName + ellipsis;
      nameWidth = ctx.measureText(finalNameStr).width;
      totalWidth = prefixWidth + nameWidth;
    }

    const startX = 540 - (totalWidth / 2);

    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(45, 45, 43, 0.6)';
    ctx.font = `bold ${fontSize}px "Inter", sans-serif`;
    ctx.fillText(prefix, startX, 240);

    ctx.fillStyle = '#2d2d2b';
    ctx.font = `900 ${fontSize}px "Inter", sans-serif`;
    ctx.fillText(finalNameStr, startX + prefixWidth, 240);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
  } else {
    ctx.fillStyle = '#2d2d2b';
    ctx.font = '900 80px "Archivo Black", sans-serif';
    ctx.fillText('ABHI LINK', 540, 170);
  }

  // 4. Draw QR Code
  const svgData = new XMLSerializer().serializeToString(qrRef.current);
  const img = new Image();
  
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  });

  const qrSize = 400;
  ctx.drawImage(img, 540 - qrSize / 2, 290, qrSize, qrSize);

  // 5. Draw Details
  let remarksY = 780; // Centered between QR and footer if no amount
  
  if (amount) {
    ctx.fillStyle = '#2d2d2b';
    ctx.font = '900 80px "Inter", sans-serif';
    ctx.fillText(`₹${amount}`, 540, 720);
    remarksY = 835; // Centered between amount (bottom ~800) and footer (top 900)
  }

  if (remarks) {
    ctx.font = 'italic 500 28px "Inter", sans-serif';
    ctx.fillStyle = 'rgba(45, 45, 43, 0.7)';
    ctx.fillText(`"${remarks}"`, 540, remarksY, 800);
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

export const handleDownload = async (
  qrRef: React.RefObject<SVGSVGElement>,
  amount: string,
  payeeName: string,
  remarks: string
) => {
  const canvas = await generateCanvas(qrRef, amount, payeeName, remarks);
  if (!canvas) return;
  
  const pngFile = canvas.toDataURL('image/png');
  const downloadLink = document.createElement('a');
  const cleanAmount = amount ? amount.replace(/,/g, '') : '';
  downloadLink.download = `abhi-link-qr-${cleanAmount ? cleanAmount + 'rs' : 'code'}.png`;
  downloadLink.href = pngFile;
  downloadLink.click();
};

export const handleShare = async (
  qrRef: React.RefObject<SVGSVGElement>,
  amount: string,
  payeeName: string,
  remarks: string,
  upiId: string
) => {
  const canvas = await generateCanvas(qrRef, amount, payeeName, remarks);
  if (!canvas) return;

  canvas.toBlob(async (blob) => {
    if (!blob) return;
    const cleanAmount = amount ? amount.replace(/,/g, '') : '';
    const file = new File([blob], `abhi-link-qr-${cleanAmount ? cleanAmount + 'rs' : 'code'}.png`, { type: 'image/png' });
    
    let shareText = 'Scan this QR code to pay.';
    if (upiId) {
      const upiParams = new URLSearchParams();
      upiParams.append('pa', upiId);
      if (payeeName) upiParams.append('pn', payeeName);
      if (cleanAmount) upiParams.append('am', cleanAmount);
      upiParams.append('cu', 'INR');
      if (remarks) upiParams.append('tn', remarks);
      const shareUrl = `upi://pay?${upiParams.toString()}`;
      shareText = `Scan this QR code or click on this Link to Pay.\n${shareUrl}`;
    }
    
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: 'ABHI LINK Payment QR',
          text: shareText,
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
