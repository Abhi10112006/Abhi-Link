import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import ViewShot from 'react-native-view-shot';
import { Download, Share2, ReceiptText, Copy, Check, QrCode } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';


interface QRCodeDisplayProps {
  upiId: string;
  isValidUpi: boolean;
  upiUrl: string;
  amount: string;
  payeeName: string;
  remarks: string;
  qrRef: React.RefObject<ViewShot | null>;
  onDownload: () => Promise<void>;
  onShare: () => Promise<void>;
  onGenerateReceipt: () => Promise<void>;
  t: Record<string, string>;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  upiId,
  isValidUpi,
  upiUrl,
  amount,
  payeeName,
  qrRef,
  onDownload,
  onShare,
  onGenerateReceipt,
  t,
}) => {
  const [isSharing, setIsSharing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [isSharingWhatsApp, setIsSharingWhatsApp] = useState(false);

  const handleShareClick = async () => {
    setIsSharing(true);
    try {
      await onShare();
    } finally {
      setIsSharing(false);
    }
  };

  const handleDownloadClick = async () => {
    setIsDownloading(true);
    try {
      await onDownload();
    } finally {
      setIsDownloading(false);
    }
  };

  const handleGenerateClick = async () => {
    setIsGenerating(true);
    try {
      await onGenerateReceipt();
    } catch (err) {
      console.error('Error generating receipt:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const buildPaymentLink = () => {
    const base = 'https://abhi-link.vercel.app/';
    const rawAmount = amount.replace(/,/g, '');
    const params = new URLSearchParams();
    params.set('upi', upiId);
    if (payeeName) params.set('name', payeeName);
    if (rawAmount) params.set('amount', rawAmount);
    return `${base}?${params.toString()}`;
  };

  const handleCopyLink = async () => {
    const link = buildPaymentLink();
    await Clipboard.setStringAsync(link);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2500);
  };

  const handleWhatsAppShare = async () => {
    setIsSharingWhatsApp(true);
    try {
      const link = buildPaymentLink();
      const rawAmount = amount.replace(/,/g, '');
      const text = payeeName
        ? `Pay ${payeeName}${rawAmount ? ` ₹${rawAmount}` : ''} via UPI: ${link}`
        : `Pay via UPI: ${link}`;
      const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
      await Linking.openURL(waUrl);
    } catch {
      // If WhatsApp is not installed, fall back to clipboard
      const link = buildPaymentLink();
      await Clipboard.setStringAsync(link);
    } finally {
      setIsSharingWhatsApp(false);
    }
  };

  if (!isValidUpi) {
    return (
      <View style={styles.placeholder}>
        <QrCode size={40} color="rgba(45,45,43,0.2)" />
        <Text style={styles.placeholderTitle}>{t.enterUpiId || 'Enter a UPI ID'}</Text>
        <Text style={styles.placeholderBody}>
          {t.upiIdFormat || 'Format: username@bank'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* QR Code captured by ViewShot */}
      <ViewShot ref={qrRef} options={{ format: 'png', quality: 1 }} style={styles.qrCapture}>
        <View style={styles.qrBox}>
          <QRCode
            value={upiUrl}
            size={180}
            color="#2d2d2b"
            backgroundColor="#ffffff"
            ecl="H"
          />
        </View>
      </ViewShot>

      {/* UPI ID label */}
      {payeeName ? (
        <Text style={styles.payeeLabel} numberOfLines={1}>
          {payeeName}
        </Text>
      ) : null}
      <Text style={styles.upiLabel} numberOfLines={1}>
        {upiId}
      </Text>
      {amount ? (
        <Text style={styles.amountLabel}>₹{amount}</Text>
      ) : null}

      {/* Action buttons */}
      <View style={styles.btnRow}>
        <TouchableOpacity
          style={[styles.btn, styles.btnSecondary]}
          onPress={handleShareClick}
          disabled={isSharing}
          activeOpacity={0.8}
        >
          {isSharing ? (
            <ActivityIndicator size="small" color="#2d2d2b" />
          ) : (
            <>
              <Share2 size={16} color="#2d2d2b" />
              <Text style={styles.btnSecondaryText}>{t.share || 'Share'}</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, styles.btnSecondary]}
          onPress={handleDownloadClick}
          disabled={isDownloading}
          activeOpacity={0.8}
        >
          {isDownloading ? (
            <ActivityIndicator size="small" color="#2d2d2b" />
          ) : (
            <>
              <Download size={16} color="#2d2d2b" />
              <Text style={styles.btnSecondaryText}>{t.save || 'Save'}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Copy link */}
      <TouchableOpacity style={styles.copyLinkBtn} onPress={handleCopyLink} activeOpacity={0.8}>
        {linkCopied ? (
          <Check size={14} color="#16a34a" />
        ) : (
          <Copy size={14} color="rgba(45,45,43,0.5)" />
        )}
        <Text style={[styles.copyLinkText, linkCopied && styles.copyLinkTextCopied]}>
          {linkCopied ? 'Link Copied!' : (t.shareLink || 'Copy Link')}
        </Text>
      </TouchableOpacity>

      {/* WhatsApp Share */}
      <TouchableOpacity
        style={[styles.btn, styles.whatsappBtn]}
        onPress={handleWhatsAppShare}
        disabled={isSharingWhatsApp}
        activeOpacity={0.8}
      >
        {isSharingWhatsApp ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Share2 size={16} color="#fff" />
            <Text style={styles.whatsappBtnText}>{t.whatsapp || 'WhatsApp'}</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Generate receipt */}
      <TouchableOpacity
        style={styles.receiptBtn}
        onPress={handleGenerateClick}
        disabled={isGenerating}
        activeOpacity={0.8}
      >
        {isGenerating ? (
          <ActivityIndicator size="small" color="#2d2d2b" />
        ) : (
          <>
            <ReceiptText size={16} color="#2d2d2b" />
            <Text style={styles.receiptBtnText}>{t.generateReceipt || 'Generate Receipt'}</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  placeholderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: 'rgba(45,45,43,0.4)',
    textAlign: 'center',
  },
  placeholderBody: {
    fontSize: 13,
    color: 'rgba(45,45,43,0.3)',
    textAlign: 'center',
  },
  container: {
    padding: 20,
    alignItems: 'center',
    gap: 12,
  },
  qrCapture: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  qrBox: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  payeeLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2d2d2b',
    textAlign: 'center',
  },
  upiLabel: {
    fontSize: 12,
    color: 'rgba(45,45,43,0.6)',
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  amountLabel: {
    fontSize: 22,
    fontWeight: '900',
    color: '#2d2d2b',
    textAlign: 'center',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 4,
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
  },
  btnSecondary: {
    backgroundColor: '#f5f5f0',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  btnSecondaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2d2d2b',
  },
  copyLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  copyLinkText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(45,45,43,0.5)',
  },
  copyLinkTextCopied: {
    color: '#16a34a',
  },
  receiptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    width: '100%',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  receiptBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2d2d2b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  whatsappBtn: {
    backgroundColor: '#25D366',
    width: '100%',
    flex: 0,
  },
  whatsappBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
});
