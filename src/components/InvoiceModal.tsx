import React, { useState, useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X, Plus, Trash2, Download, Share2, Briefcase, GraduationCap, ShoppingBag, User, IndianRupee, MessageSquare } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import QRCode from 'react-native-qrcode-svg';
import { BusinessType, InvoiceItem, InvoiceData, downloadInvoicePdf, shareInvoicePdf } from '../utils/invoicePdfGenerator';
import { PremiumBackground } from './PremiumBackground';

interface InvoiceModalProps {
  onClose: () => void;
  t: Record<string, string>;
  lang: string;
  onLanguageChange: (lang: string) => void;
}

const BUSINESS_TYPES: { type: BusinessType; label: string; icon: React.ReactNode }[] = [
  { type: 'shop', label: 'Shop', icon: <ShoppingBag size={18} color="#2d2d2b" /> },
  { type: 'freelancer', label: 'Freelancer', icon: <Briefcase size={18} color="#2d2d2b" /> },
  { type: 'tuition', label: 'Tuition', icon: <GraduationCap size={18} color="#2d2d2b" /> },
  { type: 'custom', label: 'Custom', icon: <User size={18} color="#2d2d2b" /> },
];

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ onClose, t }) => {
  const [businessType, setBusinessType] = useState<BusinessType>('shop');
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${Date.now().toString().slice(-6)}`);
  const [businessName, setBusinessName] = useState('');
  const [classesName, setClassesName] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [upiId, setUpiId] = useState('');
  const [payeeName, setPayeeName] = useState('');
  const [remarks, setRemarks] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [month, setMonth] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: '1', name: '', quantity: '', price: '', unit: 'Unit' },
  ]);

  useEffect(() => {
    const load = async () => {
      const savedName = await AsyncStorage.getItem('my_card_name');
      const savedUpi = await AsyncStorage.getItem('my_card_upi');
      const savedType = await AsyncStorage.getItem('my_card_business_type');
      if (savedName) { setBusinessName(savedName); setPayeeName(savedName); }
      if (savedUpi) setUpiId(savedUpi);
      if (savedType) setBusinessType(savedType as BusinessType);
    };
    load();
  }, []);

  const totalAmount = items.reduce(
    (sum, i) => sum + Number(i.quantity || 0) * Number(i.price || 0),
    0,
  );

  const generateUpiUrl = () => {
    if (!upiId) return '';
    let link = `upi://pay?pa=${encodeURIComponent(upiId.trim())}&pn=${encodeURIComponent(payeeName.trim())}&cu=INR&tr=${invoiceNumber}`;
    if (totalAmount > 0) link += `&am=${totalAmount.toFixed(2)}`;
    return link;
  };

  const upiUrl = generateUpiUrl();

  const buildInvoiceData = (): InvoiceData => ({
    invoiceNumber,
    customerName,
    businessName,
    classesName,
    items,
    totalAmount,
    upiId,
    payeeName,
    qrCenterText: businessType === 'tuition' ? 'T' : businessType === 'freelancer' ? 'F' : 'A',
    remarks,
    businessType,
    dueDate,
    month,
    projectTitle,
  });

  const handleAddItem = () =>
    setItems((prev) => [
      ...prev,
      { id: Date.now().toString(), name: '', quantity: '', price: '', unit: 'Unit' },
    ]);

  const handleRemoveItem = (id: string) => {
    if (items.length > 1) setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleItemChange = (id: string, field: keyof InvoiceItem, value: string) =>
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, [field]: value } : i)),
    );

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await downloadInvoicePdf(buildInvoiceData());
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    setIsSharing(true);
    try {
      await shareInvoicePdf(buildInvoiceData());
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Modal visible animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        <PremiumBackground />

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Create Invoice</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <X size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Business type selector */}
            <Text style={styles.label}>Business Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
              {BUSINESS_TYPES.map(({ type, label, icon }) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.typeChip, businessType === type && styles.typeChipActive]}
                  onPress={() => setBusinessType(type)}
                  activeOpacity={0.8}
                >
                  {icon}
                  <Text style={[styles.typeChipText, businessType === type && styles.typeChipTextActive]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Invoice number */}
            <FormField label="Invoice #" value={invoiceNumber} onChange={setInvoiceNumber} />

            {/* Business name */}
            <FormField label="Business / Your Name" value={businessName} onChange={setBusinessName} />

            {/* Tuition: classes name */}
            {businessType === 'tuition' && (
              <FormField label="Classes / Centre Name" value={classesName} onChange={setClassesName} />
            )}

            {/* Freelancer: project title */}
            {businessType === 'freelancer' && (
              <FormField label="Project Title" value={projectTitle} onChange={setProjectTitle} />
            )}

            {/* Customer name */}
            <FormField label="Customer / Student Name" value={customerName} onChange={setCustomerName} />

            {/* Month (tuition) */}
            {businessType === 'tuition' && (
              <FormField label="Month" value={month} onChange={setMonth} placeholder="e.g., March 2026" />
            )}

            {/* Due date */}
            <FormField label="Due Date (optional)" value={dueDate} onChange={setDueDate} placeholder="DD/MM/YYYY" />

            {/* Items */}
            <Text style={[styles.label, { marginTop: 16 }]}>Items</Text>
            {items.map((item, idx) => (
              <View key={item.id} style={styles.itemRow}>
                <TextInput
                  style={[styles.input, { flex: 2 }]}
                  value={item.name}
                  onChangeText={(v) => handleItemChange(item.id, 'name', v)}
                  placeholder="Item name"
                  placeholderTextColor="rgba(45,45,43,0.3)"
                />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={item.quantity}
                  onChangeText={(v) => handleItemChange(item.id, 'quantity', v)}
                  placeholder="Qty"
                  placeholderTextColor="rgba(45,45,43,0.3)"
                  keyboardType="numeric"
                />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={item.price}
                  onChangeText={(v) => handleItemChange(item.id, 'price', v)}
                  placeholder="₹"
                  placeholderTextColor="rgba(45,45,43,0.3)"
                  keyboardType="numeric"
                />
                {items.length > 1 && (
                  <TouchableOpacity onPress={() => handleRemoveItem(item.id)} hitSlop={8}>
                    <Trash2 size={18} color="#ef4444" />
                  </TouchableOpacity>
                )}
              </View>
            ))}

            <TouchableOpacity style={styles.addItemBtn} onPress={handleAddItem} activeOpacity={0.7}>
              <Plus size={16} color="#2d2d2b" />
              <Text style={styles.addItemText}>Add Item</Text>
            </TouchableOpacity>

            {/* Total */}
            {totalAmount > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>₹{totalAmount.toFixed(2)}</Text>
              </View>
            )}

            {/* UPI ID */}
            <FormField
              label="Your UPI ID"
              value={upiId}
              onChange={setUpiId}
              placeholder="name@bank"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <FormField label="Your Name (as on UPI)" value={payeeName} onChange={setPayeeName} />

            {/* Remarks */}
            <FormField label="Remarks (optional)" value={remarks} onChange={setRemarks} placeholder="Thank you for your business!" />

            {/* QR preview */}
            {upiUrl ? (
              <View style={styles.qrPreview}>
                <Text style={styles.label}>Payment QR</Text>
                <View style={styles.qrBox}>
                  <QRCode value={upiUrl} size={140} color="#2d2d2b" backgroundColor="#fff" ecl="H" />
                </View>
                <Text style={styles.qrNote}>Scan to pay ₹{totalAmount.toFixed(2)}</Text>
              </View>
            ) : null}

            {/* Action buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnSecondary]}
                onPress={handleShare}
                disabled={isSharing}
                activeOpacity={0.8}
              >
                {isSharing ? (
                  <ActivityIndicator size="small" color="#2d2d2b" />
                ) : (
                  <>
                    <Share2 size={18} color="#2d2d2b" />
                    <Text style={styles.actionBtnSecondaryText}>Share PDF</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnPrimary]}
                onPress={handleDownload}
                disabled={isDownloading}
                activeOpacity={0.8}
              >
                {isDownloading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Download size={18} color="#fff" />
                    <Text style={styles.actionBtnPrimaryText}>Download PDF</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

// ─── Tiny reusable form field ────────────────────────────────────────────────

interface FormFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'numeric';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  value,
  onChange,
  placeholder,
  keyboardType = 'default',
  autoCapitalize = 'words',
}) => (
  <View style={{ marginBottom: 14 }}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChange}
      placeholder={placeholder || label}
      placeholderTextColor="rgba(45,45,43,0.3)"
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize}
      autoCorrect={false}
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e6e1dc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#2d2d2b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 20,
    paddingBottom: 60,
  },
  typeScroll: {
    marginBottom: 16,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#d9d3ce',
    backgroundColor: '#fff',
    marginRight: 8,
  },
  typeChipActive: {
    borderColor: '#2d2d2b',
    backgroundColor: '#2d2d2b',
  },
  typeChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2d2d2b',
  },
  typeChipTextActive: {
    color: '#e6e1dc',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: 'rgba(45,45,43,0.7)',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#d9d3ce',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '600',
    color: '#2d2d2b',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  addItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#d9d3ce',
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  addItemText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2d2d2b',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2d2d2b',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#e6e1dc',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#e6e1dc',
  },
  qrPreview: {
    alignItems: 'center',
    marginVertical: 20,
  },
  qrBox: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginTop: 10,
  },
  qrNote: {
    fontSize: 12,
    color: 'rgba(45,45,43,0.6)',
    marginTop: 8,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  actionBtnPrimary: {
    backgroundColor: '#2d2d2b',
  },
  actionBtnPrimaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  actionBtnSecondary: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  actionBtnSecondaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2d2d2b',
  },
});
