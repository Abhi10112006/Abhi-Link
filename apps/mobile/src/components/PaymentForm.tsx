import React, { useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput as RNTextInput,
} from 'react-native';
import { IndianRupee, MessageSquare, User, Eraser, X } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';

const QUICK_AMOUNTS = [10, 20, 50, 100, 200, 500];

const COMMON_UPI_HANDLES = [
  '@ybl', '@paytm', '@okicici', '@okhdfcbank', '@oksbi',
  '@okaxis', '@apl', '@ibl', '@axl', '@icici', '@sbi',
  '@hdfcbank', '@kotak', '@axisbank', '@yesbank',
  '@upi', '@freecharge', '@mobikwik', '@slice', '@cred',
  '@amazonpay', '@airtel', '@airtelpaymentsbank', '@bajaj',
];

interface RecentPayee {
  upiId: string;
  payeeName: string;
}

interface PaymentFormProps {
  upiId: string;
  setUpiId: (v: string) => void;
  payeeName: string;
  setPayeeName: (v: string) => void;
  amount: string;
  setAmount: (v: string) => void;
  remarks: string;
  setRemarks: (v: string) => void;
  showUpiError: boolean;
  setTouchedUpiId: (v: boolean) => void;
  recentPayees: RecentPayee[];
  onSelectRecent: (p: RecentPayee) => void;
  onRemoveRecent: (upiId: string) => void;
  onSaveRecent: () => void;
  amountInputRef: React.RefObject<RNTextInput>;
  t: Record<string, string>;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({
  upiId,
  setUpiId,
  payeeName,
  setPayeeName,
  amount,
  setAmount,
  remarks,
  setRemarks,
  showUpiError,
  setTouchedUpiId,
  recentPayees,
  onSelectRecent,
  onRemoveRecent,
  onSaveRecent,
  amountInputRef,
  t,
}) => {
  const [showHandles, setShowHandles] = React.useState(false);
  const upiInputRef = useRef<RNTextInput>(null);

  const getFilteredHandles = () => {
    if (!upiId.includes('@')) return [];
    const searchPart = upiId.split('@')[1].toLowerCase();
    if (!searchPart) return COMMON_UPI_HANDLES.slice(0, 5);
    return COMMON_UPI_HANDLES.filter((h) =>
      h.toLowerCase().startsWith('@' + searchPart),
    ).slice(0, 5);
  };

  const filteredHandles = getFilteredHandles();

  const handleUpiChange = (val: string) => {
    setUpiId(val);
    setShowHandles(val.includes('@') && val.split('@')[1] !== undefined);
  };

  const selectHandle = (handle: string) => {
    const prefix = upiId.split('@')[0];
    setUpiId(prefix + handle);
    setTouchedUpiId(true);
    setShowHandles(false);
    onSaveRecent();
    amountInputRef.current?.focus();
  };

  const handleClear = () => {
    setUpiId('');
    setPayeeName('');
    setAmount('');
    setRemarks('');
    setTouchedUpiId(false);
    upiInputRef.current?.focus();
  };

  const handlePasteUpi = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text) {
        setUpiId(text.trim());
        setTouchedUpiId(true);
      }
    } catch {
      /* clipboard access denied */
    }
  };

  const formatAmount = (val: string) => {
    const raw = val.replace(/[^0-9]/g, '');
    if (!raw) return '';
    const num = parseInt(raw, 10);
    return num.toLocaleString('en-IN');
  };

  const handleAmountChange = (val: string) => {
    setAmount(formatAmount(val));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>{t.upiIdLabel || 'UPI ID'}</Text>

      {/* Recent payees */}
      {recentPayees.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.recentScroll}
          contentContainerStyle={styles.recentContent}
        >
          {recentPayees.map((p) => (
            <TouchableOpacity
              key={p.upiId}
              style={styles.recentChip}
              onPress={() => onSelectRecent(p)}
              activeOpacity={0.7}
            >
              <Text style={styles.recentChipText} numberOfLines={1}>
                {p.payeeName || p.upiId}
              </Text>
              <TouchableOpacity
                onPress={() => onRemoveRecent(p.upiId)}
                hitSlop={8}
              >
                <X size={12} color="rgba(45,45,43,0.5)" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* UPI ID input */}
      <View style={styles.inputWrapper}>
        <TextInput
          ref={upiInputRef}
          style={[styles.input, showUpiError && styles.inputError]}
          value={upiId}
          onChangeText={handleUpiChange}
          onBlur={() => {
            setTouchedUpiId(true);
            onSaveRecent();
            setTimeout(() => setShowHandles(false), 150);
          }}
          placeholder={t.upiIdPlaceholder || 'e.g., name@upi'}
          placeholderTextColor="rgba(45,45,43,0.3)"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          returnKeyType="next"
          onSubmitEditing={() => amountInputRef.current?.focus()}
        />
        <TouchableOpacity style={styles.pasteBtn} onPress={handlePasteUpi} activeOpacity={0.7}>
          <Text style={styles.pasteBtnText}>Paste</Text>
        </TouchableOpacity>
      </View>

      {showUpiError && (
        <Text style={styles.errorText}>{t.invalidUpi || 'Invalid UPI ID format'}</Text>
      )}

      {/* UPI handle autocomplete */}
      {showHandles && filteredHandles.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.autocompleteScroll}
          contentContainerStyle={styles.autocompleteContent}
          keyboardShouldPersistTaps="handled"
        >
          {filteredHandles.map((h) => (
            <TouchableOpacity
              key={h}
              style={styles.handleChip}
              onPress={() => selectHandle(h)}
              activeOpacity={0.7}
            >
              <Text style={styles.handleChipText}>{upiId.split('@')[0] + h}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Payee name */}
      <Text style={[styles.sectionTitle, { marginTop: 16 }]}>
        {t.nameLabel || "Receiver's Name"}
      </Text>
      <View style={styles.inputRow}>
        <User size={16} color="rgba(45,45,43,0.5)" style={styles.inputIcon} />
        <TextInput
          style={[styles.input, styles.inputWithIcon, { flex: 1 }]}
          value={payeeName}
          onChangeText={setPayeeName}
          placeholder={t.namePlaceholder || 'e.g., John Doe'}
          placeholderTextColor="rgba(45,45,43,0.3)"
          returnKeyType="next"
          onSubmitEditing={() => amountInputRef.current?.focus()}
        />
      </View>

      {/* Amount */}
      <Text style={[styles.sectionTitle, { marginTop: 16 }]}>
        {t.amountLabel || 'Amount'}
      </Text>
      <View style={styles.inputRow}>
        <IndianRupee size={16} color="rgba(45,45,43,0.5)" style={styles.inputIcon} />
        <TextInput
          ref={amountInputRef}
          style={[styles.input, styles.inputWithIcon, { flex: 1 }]}
          value={amount}
          onChangeText={handleAmountChange}
          placeholder={t.amountPlaceholder || '0'}
          placeholderTextColor="rgba(45,45,43,0.3)"
          keyboardType="numeric"
          returnKeyType="next"
        />
      </View>

      {/* Quick Amount Presets */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.quickAmountScroll}
        contentContainerStyle={styles.quickAmountContent}
        keyboardShouldPersistTaps="handled"
      >
        {QUICK_AMOUNTS.map((v) => (
          <TouchableOpacity
            key={v}
            style={styles.quickAmountBtn}
            onPress={() => {
              const current = parseFloat(amount.replace(/,/g, '')) || 0;
              const next = current + v;
              setAmount(next.toLocaleString('en-IN'));
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.quickAmountText}>+₹{v}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Remarks */}
      <Text style={[styles.sectionTitle, { marginTop: 16 }]}>
        {t.remarksLabel || 'Remarks'}
      </Text>
      <View style={styles.inputRow}>
        <MessageSquare size={16} color="rgba(45,45,43,0.5)" style={styles.inputIcon} />
        <TextInput
          style={[styles.input, styles.inputWithIcon, { flex: 1 }]}
          value={remarks}
          onChangeText={setRemarks}
          placeholder={t.remarksPlaceholder || 'e.g., Rent, Dinner'}
          placeholderTextColor="rgba(45,45,43,0.3)"
          returnKeyType="done"
        />
      </View>

      {/* Clear fields */}
      {(upiId || payeeName || amount || remarks) && (
        <TouchableOpacity style={styles.clearBtn} onPress={handleClear} activeOpacity={0.7}>
          <Eraser size={14} color="rgba(45,45,43,0.5)" />
          <Text style={styles.clearBtnText}>{t.clearFields || 'Clear Fields'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: 'rgba(45,45,43,0.7)',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f0',
    borderWidth: 2,
    borderColor: '#d9d3ce',
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  inputIcon: {
    marginRight: 4,
  },
  input: {
    backgroundColor: '#f5f5f0',
    borderWidth: 2,
    borderColor: '#d9d3ce',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '600',
    color: '#2d2d2b',
    flex: 1,
  },
  inputWithIcon: {
    borderWidth: 0,
    backgroundColor: 'transparent',
    paddingHorizontal: 4,
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: '600',
    marginTop: 4,
  },
  pasteBtn: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f5f5f0',
    borderWidth: 2,
    borderColor: '#d9d3ce',
  },
  pasteBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2d2d2b',
  },
  recentScroll: {
    marginBottom: 10,
  },
  recentContent: {
    gap: 8,
    paddingRight: 8,
  },
  recentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f5f5f0',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#d9d3ce',
    maxWidth: 150,
  },
  recentChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2d2d2b',
    flex: 1,
  },
  autocompleteScroll: {
    marginTop: 6,
    marginBottom: 4,
  },
  autocompleteContent: {
    gap: 8,
    paddingRight: 8,
  },
  handleChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fff',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#d9d3ce',
  },
  handleChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2d2d2b',
    fontFamily: 'monospace',
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    alignSelf: 'flex-start',
  },
  clearBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(45,45,43,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quickAmountScroll: {
    marginTop: 8,
  },
  quickAmountContent: {
    gap: 8,
    paddingRight: 8,
  },
  quickAmountBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#d9d3ce',
    shadowColor: '#b8b2ac',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  quickAmountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2d2d2b',
  },
});
