import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { Wallet, History, ReceiptText } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import ViewShot from 'react-native-view-shot';

import { PaymentForm } from './components/PaymentForm';
import { QRCodeDisplay } from './components/QRCodeDisplay';
import { Changelog } from './components/Changelog';
import { LanguageSelector } from './components/LanguageSelector';
import { handleDownload, handleShare } from './utils/qrGenerator';
import { translations } from './locales/translations';
import { ReceiptConfirmationModal, SenderNameModal, PaymentCompletedModal } from './components/ReceiptModals';
import { generateReceiptHtml, ReceiptData } from './components/Receipt';
import { InvoiceModal } from './components/InvoiceModal';
import { DigitalCardModal } from './components/DigitalCardModal';
import { PremiumBackground } from './components/PremiumBackground';
import { TransactionHistory, Transaction } from './components/TransactionHistory';

// UPI ID validation regex
const UPI_REGEX = /^[\w.-]+@[\w.-]+$/;

export default function App() {
  // ─── Language ──────────────────────────────────────────────────────────────
  const [lang, setLang] = useState('en');

  useEffect(() => {
    AsyncStorage.getItem('abhi-link-lang').then((v) => { if (v) setLang(v); });
  }, []);

  const handleLangChange = useCallback((code: string) => {
    setLang(code);
    AsyncStorage.setItem('abhi-link-lang', code);
  }, []);

  const t = translations[lang] || translations['en'];

  // ─── Transactions ──────────────────────────────────────────────────────────
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    AsyncStorage.getItem('abhi-link-transactions').then((v) => {
      if (v) {
        try { setTransactions(JSON.parse(v)); } catch { /* ignore */ }
      }
    });
  }, []);

  const saveTransactions = (txs: Transaction[]) => {
    setTransactions(txs);
    AsyncStorage.setItem('abhi-link-transactions', JSON.stringify(txs));
  };

  // ─── Form State ────────────────────────────────────────────────────────────
  const [upiId, setUpiId] = useState('');
  const [payeeName, setPayeeName] = useState('');
  const [amount, setAmount] = useState('');
  const [remarks, setRemarks] = useState('');
  const [touchedUpiId, setTouchedUpiId] = useState(false);

  // Pre-fill from stored card info
  useEffect(() => {
    AsyncStorage.multiGet(['my_card_upi', 'my_card_name']).then((pairs) => {
      const upi = pairs[0][1];
      const name = pairs[1][1];
      if (upi) setUpiId(upi);
      if (name) setPayeeName(name);
    });
  }, []);

  const isValidUpi = upiId === '' || UPI_REGEX.test(upiId);
  const showUpiError = touchedUpiId && !isValidUpi && upiId.length > 0;

  const rawAmount = amount.replace(/,/g, '');

  const generateUpiUrl = () => {
    if (!upiId) return '';
    const trId = `ABHI${Date.now()}`;
    let link = `upi://pay?pa=${encodeURIComponent(upiId.trim()).replace(/%40/g, '@')}&pn=${encodeURIComponent(payeeName.trim())}&cu=INR&tr=${trId}`;
    if (rawAmount) link += `&am=${rawAmount}`;
    if (remarks) link += `&tn=${encodeURIComponent(remarks.trim())}`;
    return link;
  };

  const upiUrl = generateUpiUrl();

  // ─── Recent Payees ─────────────────────────────────────────────────────────
  const [recentPayees, setRecentPayees] = useState<{ upiId: string; payeeName: string }[]>([]);

  useEffect(() => {
    AsyncStorage.getItem('recentPayees').then((v) => {
      if (v) { try { setRecentPayees(JSON.parse(v)); } catch { /* ignore */ } }
    });
  }, []);

  const saveRecentPayee = useCallback(() => {
    if (!upiId || !isValidUpi) return;
    setRecentPayees((prev) => {
      const filtered = prev.filter((p) => p.upiId !== upiId);
      const updated = [{ upiId, payeeName }, ...filtered].slice(0, 4);
      AsyncStorage.setItem('recentPayees', JSON.stringify(updated));
      return updated;
    });
  }, [upiId, payeeName, isValidUpi]);

  const handleSelectRecent = useCallback((payee: { upiId: string; payeeName: string }) => {
    setUpiId(payee.upiId);
    setPayeeName(payee.payeeName);
    setTouchedUpiId(true);
  }, []);

  const handleRemoveRecent = useCallback((upiIdToRemove: string) => {
    setRecentPayees((prev) => {
      const updated = prev.filter((p) => p.upiId !== upiIdToRemove);
      AsyncStorage.setItem('recentPayees', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // ─── QR Ref ────────────────────────────────────────────────────────────────
  const qrRef = useRef<ViewShot>(null);
  const amountInputRef = useRef<TextInput>(null);

  // ─── Modals ────────────────────────────────────────────────────────────────
  const [showChangelog, setShowChangelog] = useState(false);
  const [showDigitalCard, setShowDigitalCard] = useState(false);
  const [showTransactionHistory, setShowTransactionHistory] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // ─── Receipt Flow ──────────────────────────────────────────────────────────
  const [showReceiptConfirmation, setShowReceiptConfirmation] = useState(false);
  const [showPaymentCompletedModal, setShowPaymentCompletedModal] = useState(false);
  const [showSenderNameInput, setShowSenderNameInput] = useState(false);
  const [isGeneratingReceipt, setIsGeneratingReceipt] = useState(false);

  const [pendingReceiptData, setPendingReceiptData] = useState<{
    payee: string;
    upiId: string;
    amount: string;
    remarks: string;
    isReceiver: boolean;
  } | null>(null);

  const handleGenerateReceiptClick = async () => {
    // Determine role based on whether user's UPI ID matches the payee's
    const storedUpi = await AsyncStorage.getItem('my_card_upi');
    const isReceiver = !!(storedUpi && storedUpi.trim() === upiId.trim());
    setPendingReceiptData({ payee: payeeName, upiId, amount: rawAmount, remarks, isReceiver });
    if (isReceiver) {
      setShowReceiptConfirmation(true);
    } else {
      setShowPaymentCompletedModal(true);
    }
  };

  const handleReceiptConfirmed = () => {
    setShowReceiptConfirmation(false);
    setTimeout(() => setShowSenderNameInput(true), 200);
  };

  const handlePaymentCompletedConfirmed = () => {
    setShowPaymentCompletedModal(false);
    setTimeout(() => setShowSenderNameInput(true), 200);
  };

  const handleSenderNameSubmit = async (senderName: string) => {
    setIsGeneratingReceipt(true);
    if (!pendingReceiptData) return;

    const { payee, upiId: pUpiId, amount: pAmount, remarks: pRemarks, isReceiver } = pendingReceiptData;
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const mon = String(now.getMonth() + 1).padStart(2, '0');
    const yr = now.getFullYear();
    const date = `${day}/${mon}/${yr}`;
    const hours = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');

    const receiptData: ReceiptData = {
      payeeName: payee,
      payeeUpiId: pUpiId,
      amount: Number(pAmount).toLocaleString('en-IN'),
      remarks: pRemarks,
      senderName,
      date,
      isReceiver,
    };

    // Record transaction
    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      payeeName: payee,
      payeeUpiId: pUpiId,
      amount: pAmount,
      remarks: pRemarks,
      date,
      time: `${hours}:${mins}`,
      isReceiver,
    };
    saveTransactions([newTx, ...transactions].slice(0, 50));

    try {
      const htmlEn = generateReceiptHtml(receiptData, 'en');
      const htmls = [{ html: htmlEn }];
      if (lang !== 'en') {
        htmls.push({ html: generateReceiptHtml(receiptData, lang) });
      }

      // Print all pages
      const { uri } = await Print.printToFileAsync({ html: htmlEn });
      const available = await Sharing.isAvailableAsync();
      if (available) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Receipt - ${payee}`,
          UTI: 'com.adobe.pdf',
        });
      }
    } catch (err: any) {
      if (err?.message !== 'User canceled') {
        console.error('Error generating receipt:', err);
      }
    } finally {
      setIsGeneratingReceipt(false);
      setShowSenderNameInput(false);
      setPendingReceiptData(null);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <PremiumBackground />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ─── Header ────────────────────────────────────────────────── */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.logo}>
                <Text style={styles.logoText}>A</Text>
              </View>
              <View>
                <Text style={styles.appName}>ABHI LINK</Text>
                <Text style={styles.appTagline}>UPI QR Generator</Text>
              </View>
            </View>
            <LanguageSelector currentLang={lang} onLanguageChange={handleLangChange} />
          </View>

          {/* ─── Toolbar ───────────────────────────────────────────────── */}
          <View style={styles.toolbar}>
            <TouchableOpacity style={styles.toolBtn} onPress={() => setShowDigitalCard(true)} activeOpacity={0.8}>
              <Wallet size={16} color="#2d2d2b" />
              <Text style={styles.toolBtnText}>My Card</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.toolBtn} onPress={() => setShowInvoiceModal(true)} activeOpacity={0.8}>
              <ReceiptText size={16} color="#2d2d2b" />
              <Text style={styles.toolBtnText}>Invoice</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toolBtn, transactions.length > 0 && styles.toolBtnBadge]}
              onPress={() => setShowTransactionHistory(true)}
              activeOpacity={0.8}
            >
              <History size={16} color="#2d2d2b" />
              <Text style={styles.toolBtnText}>
                History {transactions.length > 0 ? `(${transactions.length})` : ''}
              </Text>
            </TouchableOpacity>
          </View>

          {/* ─── Main Card ──────────────────────────────────────────────── */}
          <View style={styles.mainCard}>
            <PaymentForm
              upiId={upiId}
              setUpiId={setUpiId}
              payeeName={payeeName}
              setPayeeName={setPayeeName}
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
              amountInputRef={amountInputRef}
              t={t}
            />

            <View style={styles.divider} />

            <QRCodeDisplay
              upiId={upiId}
              isValidUpi={isValidUpi && upiId.length > 0}
              upiUrl={upiUrl}
              amount={amount}
              payeeName={payeeName}
              remarks={remarks}
              qrRef={qrRef}
              onDownload={async () => {
                await handleDownload(qrRef, rawAmount, payeeName, remarks);
              }}
              onShare={async () => {
                await handleShare(qrRef, rawAmount, payeeName, remarks, upiId);
              }}
              onGenerateReceipt={handleGenerateReceiptClick}
              t={t}
            />
          </View>

          {/* ─── Footer ────────────────────────────────────────────────── */}
          <TouchableOpacity style={styles.footer} onPress={() => setShowChangelog(true)} activeOpacity={0.7}>
            <Text style={styles.footerText}>Developer: Abhinav Yaduvanshi</Text>
            <Text style={styles.footerVersion}>v1.0 – What's New?</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ─── Modals ──────────────────────────────────────────────────────── */}
      {showChangelog && <Changelog onClose={() => setShowChangelog(false)} t={t} />}

      <TransactionHistory
        isOpen={showTransactionHistory}
        onClose={() => setShowTransactionHistory(false)}
        transactions={transactions}
        onClearAll={() => saveTransactions([])}
        onDeleteTransaction={(id) => saveTransactions(transactions.filter((tx) => tx.id !== id))}
        t={t}
      />

      {showDigitalCard && (
        <DigitalCardModal
          isOpen={showDigitalCard}
          onClose={() => setShowDigitalCard(false)}
          t={t}
        />
      )}

      {showInvoiceModal && (
        <InvoiceModal
          onClose={() => setShowInvoiceModal(false)}
          t={t}
          lang={lang}
          onLanguageChange={handleLangChange}
        />
      )}

      <ReceiptConfirmationModal
        isOpen={showReceiptConfirmation}
        onClose={() => setShowReceiptConfirmation(false)}
        onConfirm={handleReceiptConfirmed}
        isReceiver
        t={t}
      />

      <PaymentCompletedModal
        isOpen={showPaymentCompletedModal}
        onClose={() => setShowPaymentCompletedModal(false)}
        onConfirm={handlePaymentCompletedConfirmed}
        t={t}
      />

      <SenderNameModal
        isOpen={showSenderNameInput}
        onClose={() => setShowSenderNameInput(false)}
        onSubmit={handleSenderNameSubmit}
        t={t}
        isLoading={isGeneratingReceipt}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#e6e1dc',
  },
  flex: { flex: 1 },
  scroll: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingTop: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#2d2d2b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 26,
    fontWeight: '900',
    color: '#e6e1dc',
    lineHeight: 30,
  },
  appName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#2d2d2b',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  appTagline: {
    fontSize: 10,
    color: 'rgba(45,45,43,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  toolbar: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  toolBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#d9d3ce',
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  toolBtnBadge: {
    borderColor: '#2d2d2b',
  },
  toolBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2d2d2b',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  mainCard: {
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 20,
  },
  footer: {
    alignItems: 'center',
    marginTop: 32,
    gap: 2,
  },
  footerText: {
    fontSize: 11,
    color: 'rgba(45,45,43,0.5)',
  },
  footerVersion: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(45,45,43,0.4)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
