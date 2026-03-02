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
  downloadLink.download = `abhi-link-qr-${amount ? amount + 'rs' : 'code'}.png`;
  downloadLink.href = pngFile;
  downloadLink.click();
};

export const handleShare = async (
  qrRef: React.RefObject<SVGSVGElement>,
  amount: string,
  payeeName: string,
  remarks: string
) => {
  const canvas = await generateCanvas(qrRef, amount, payeeName, remarks);
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
