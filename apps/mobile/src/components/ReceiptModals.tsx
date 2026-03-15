import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { X, Check } from 'lucide-react-native';

// ─── ReceiptConfirmationModal ────────────────────────────────────────────────

interface ReceiptConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isReceiver: boolean;
  t: Record<string, string>;
}

export const ReceiptConfirmationModal: React.FC<ReceiptConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  t,
}) => (
  <Modal visible={isOpen} transparent animationType="fade" onRequestClose={onClose}>
    <View style={styles.overlay}>
      <View style={styles.card}>
        <Text style={styles.title}>{t.moneyArrivedTitle || 'Did you receive the money?'}</Text>
        <Text style={styles.body}>{t.checkBankMessage || 'Please check your bank account before generating a receipt.'}</Text>
        <View style={styles.row}>
          <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.btnSecondaryText}>{t.waitCheck || 'Not yet'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={onConfirm} activeOpacity={0.8}>
            <Check size={18} color="#fff" />
            <Text style={styles.btnPrimaryText}>{t.yesGenerate || 'Yes, Generate'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

// ─── PaymentCompletedModal ───────────────────────────────────────────────────

interface PaymentCompletedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  t: Record<string, string>;
}

export const PaymentCompletedModal: React.FC<PaymentCompletedModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  t,
}) => (
  <Modal visible={isOpen} transparent animationType="fade" onRequestClose={onClose}>
    <View style={styles.overlay}>
      <View style={styles.card}>
        <Text style={styles.title}>{t.paymentCompletedTitle || 'Payment Completed?'}</Text>
        <Text style={styles.body}>{t.paymentCompletedMessage || 'Has the payment been processed successfully?'}</Text>
        <View style={styles.row}>
          <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.btnSecondaryText}>{t.notYet || 'Not yet'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={onConfirm} activeOpacity={0.8}>
            <Check size={18} color="#fff" />
            <Text style={styles.btnPrimaryText}>{t.yesItsDone || "Yes, it's done"}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

// ─── SenderNameModal ─────────────────────────────────────────────────────────

interface SenderNameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
  t: Record<string, string>;
  isLoading?: boolean;
}

export const SenderNameModal: React.FC<SenderNameModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  t,
  isLoading = false,
}) => {
  const [name, setName] = useState('');

  const handleSubmit = () => {
    if (name.trim() && !isLoading) {
      onSubmit(name.trim());
    }
  };

  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.title}>{t.senderNameTitle || 'Your Name'}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={8}>
              <X size={22} color="rgba(45,45,43,0.5)" />
            </TouchableOpacity>
          </View>
          <Text style={styles.label}>{t.enterSenderNameLabel || 'Enter sender name'}</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder={t.senderNamePlaceholder || 'e.g. Ravi Kumar'}
            placeholderTextColor="rgba(45,45,43,0.3)"
            autoFocus
            editable={!isLoading}
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
          />
          <TouchableOpacity
            style={[styles.btn, styles.btnPrimary, styles.btnFull, (!name.trim() || isLoading) && styles.btnDisabled]}
            onPress={handleSubmit}
            disabled={!name.trim() || isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.btnPrimaryText}>{t.generateAndShare || 'Generate Receipt'}</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2d2d2b',
    marginBottom: 8,
  },
  body: {
    fontSize: 14,
    color: 'rgba(45,45,43,0.7)',
    marginBottom: 24,
    lineHeight: 20,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: 'rgba(45,45,43,0.7)',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f5f5f0',
    borderWidth: 2,
    borderColor: '#d9d3ce',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '700',
    color: '#2d2d2b',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  btnFull: {
    flex: 0,
    width: '100%',
  },
  btnPrimary: {
    backgroundColor: '#2d2d2b',
  },
  btnPrimaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  btnSecondary: {
    backgroundColor: '#f5f5f0',
  },
  btnSecondaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2d2d2b',
  },
  btnDisabled: {
    opacity: 0.5,
  },
});
