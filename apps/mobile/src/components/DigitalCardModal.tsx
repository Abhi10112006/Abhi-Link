import React, { useState, useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { X, Share2, Check, Copy, Briefcase, Store, GraduationCap, PenTool, Eye, EyeOff } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import QRCode from 'react-native-qrcode-svg';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import { PremiumBackground } from './PremiumBackground';

type BusinessType = 'shop' | 'freelancer' | 'tuition' | 'custom';
type Step = 'setup' | 'card';

interface DigitalCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  t: Record<string, string>;
}

const BUSINESS_OPTIONS: { type: BusinessType; label: string; icon: React.ReactNode }[] = [
  { type: 'shop', label: 'Shop', icon: <Store size={16} color="#2d2d2b" /> },
  { type: 'freelancer', label: 'Freelancer', icon: <PenTool size={16} color="#2d2d2b" /> },
  { type: 'tuition', label: 'Tuition', icon: <GraduationCap size={16} color="#2d2d2b" /> },
  { type: 'custom', label: 'Custom', icon: <Briefcase size={16} color="#2d2d2b" /> },
];

const getGreeting = () => {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'Good Morning';
  if (h === 12) return 'Good Noon';
  if (h > 12 && h < 17) return 'Good Afternoon';
  if (h >= 17 && h < 21) return 'Good Evening';
  return 'Good Night';
};

export const DigitalCardModal: React.FC<DigitalCardModalProps> = ({ isOpen, onClose, t }) => {
  const [step, setStep] = useState<Step>('setup');
  const [name, setName] = useState('');
  const [upi, setUpi] = useState('');
  const [businessType, setBusinessType] = useState<BusinessType>('shop');
  const [isStealthMode, setIsStealthMode] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const cardRef = useRef<ViewShot>(null);

  useEffect(() => {
    if (!isOpen) return;
    const load = async () => {
      const savedName = await AsyncStorage.getItem('my_card_name');
      const savedUpi = await AsyncStorage.getItem('my_card_upi');
      const savedType = await AsyncStorage.getItem('my_card_business_type') as BusinessType | null;
      if (savedName && savedUpi) {
        setName(savedName);
        setUpi(savedUpi);
        if (savedType) setBusinessType(savedType);
        setStep('card');
      } else {
        setStep('setup');
      }
    };
    load();
  }, [isOpen]);

  const upiUrl = `upi://pay?pa=${encodeURIComponent(upi)}&pn=${encodeURIComponent(name)}&cu=INR`;

  const handleSave = async () => {
    if (!name.trim() || !upi.includes('@')) {
      Alert.alert('Missing info', 'Please enter your name and a valid UPI ID.');
      return;
    }
    await AsyncStorage.setItem('my_card_name', name.trim());
    await AsyncStorage.setItem('my_card_upi', upi.trim());
    await AsyncStorage.setItem('my_card_business_type', businessType);
    setStep('card');
  };

  const copyUpi = async () => {
    await Clipboard.setStringAsync(upi);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareCard = async () => {
    if (!cardRef.current) return;
    setIsSharing(true);
    try {
      const uri = await (cardRef.current as any).capture();
      const available = await Sharing.isAvailableAsync();
      if (available) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: `${name}'s Digital Payment Card`,
        });
      } else {
        Alert.alert('Sharing unavailable', 'Your device does not support sharing.');
      }
    } catch (err: any) {
      if (err?.message !== 'User canceled') console.error(err);
    } finally {
      setIsSharing(false);
    }
  };

  const getBusinessLabel = () =>
    BUSINESS_OPTIONS.find((b) => b.type === businessType)?.label ?? 'Business';

  return (
    <Modal visible={isOpen} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        <PremiumBackground />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Digital Card</Text>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <X size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {step === 'setup' ? (
          // ─── Setup Step ────────────────────────────────────────────────────
          <ScrollView contentContainerStyle={styles.setupContent} keyboardShouldPersistTaps="handled">
            <Text style={styles.setupTitle}>Set up your card</Text>
            <Text style={styles.setupSubtitle}>
              Enter your name and UPI ID to create your personal digital payment card.
            </Text>

            <Text style={styles.label}>Your Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g., Ravi Kumar"
              placeholderTextColor="rgba(45,45,43,0.3)"
              autoCapitalize="words"
            />

            <Text style={[styles.label, { marginTop: 16 }]}>Your UPI ID</Text>
            <TextInput
              style={styles.input}
              value={upi}
              onChangeText={setUpi}
              placeholder="e.g., ravi@oksbi"
              placeholderTextColor="rgba(45,45,43,0.3)"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
            />

            <Text style={[styles.label, { marginTop: 16 }]}>Business Type</Text>
            <View style={styles.typeGrid}>
              {BUSINESS_OPTIONS.map(({ type, label, icon }) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.typeBtn, businessType === type && styles.typeBtnActive]}
                  onPress={() => setBusinessType(type)}
                  activeOpacity={0.8}
                >
                  {icon}
                  <Text style={[styles.typeBtnText, businessType === type && styles.typeBtnTextActive]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
              <Text style={styles.saveBtnText}>Create My Card</Text>
            </TouchableOpacity>
          </ScrollView>
        ) : (
          // ─── Card Step ─────────────────────────────────────────────────────
          <ScrollView contentContainerStyle={styles.cardContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.greeting}>{getGreeting()}</Text>

            {/* The card itself — captured by ViewShot for sharing */}
            <ViewShot ref={cardRef} options={{ format: 'png', quality: 1 }}>
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  <View>
                    <Text style={styles.cardName}>{name}</Text>
                    <Text style={styles.cardBusiness}>{getBusinessLabel()}</Text>
                  </View>
                  <View style={styles.aLogo}>
                    <Text style={styles.aLogoText}>A</Text>
                  </View>
                </View>

                <View style={styles.qrWrap}>
                  {upi ? (
                    <QRCode value={upiUrl} size={120} color="#e8c382" backgroundColor="transparent" ecl="Q" />
                  ) : null}
                </View>

                <View style={styles.cardBottom}>
                  <Text style={styles.cardUpiLabel}>UPI ID</Text>
                  <Text style={styles.cardUpiId}>
                    {isStealthMode ? '••••••••@••••' : upi}
                  </Text>
                </View>
              </View>
            </ViewShot>

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity style={styles.actionBtn} onPress={copyUpi} activeOpacity={0.8}>
                {copied ? <Check size={18} color="#16a34a" /> : <Copy size={18} color="#2d2d2b" />}
                <Text style={styles.actionBtnText}>{copied ? 'Copied!' : 'Copy UPI'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.actionBtnPrimary]}
                onPress={shareCard}
                disabled={isSharing}
                activeOpacity={0.8}
              >
                {isSharing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Share2 size={18} color="#fff" />
                    <Text style={styles.actionBtnPrimaryText}>Share Card</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Stealth toggle */}
            <TouchableOpacity
              style={styles.stealthBtn}
              onPress={() => setIsStealthMode((v) => !v)}
              activeOpacity={0.8}
            >
              {isStealthMode ? <EyeOff size={16} color="rgba(45,45,43,0.5)" /> : <Eye size={16} color="rgba(45,45,43,0.5)" />}
              <Text style={styles.stealthBtnText}>
                {isStealthMode ? 'Show UPI ID' : 'Hide UPI ID'}
              </Text>
            </TouchableOpacity>

            {/* Edit card */}
            <TouchableOpacity style={styles.editBtn} onPress={() => setStep('setup')} activeOpacity={0.8}>
              <Text style={styles.editBtnText}>Edit Card</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#e6e1dc' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#2d2d2b', textTransform: 'uppercase', letterSpacing: 0.5 },
  closeBtn: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 1, borderColor: '#e5e7eb',
    backgroundColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },

  // Setup step
  setupContent: { padding: 24, paddingBottom: 60 },
  setupTitle: { fontSize: 26, fontWeight: '900', color: '#2d2d2b', marginBottom: 8 },
  setupSubtitle: { fontSize: 14, color: 'rgba(45,45,43,0.6)', marginBottom: 24, lineHeight: 20 },
  label: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, color: 'rgba(45,45,43,0.7)', marginBottom: 6 },
  input: {
    backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#d9d3ce',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, fontWeight: '600', color: '#2d2d2b',
  },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  typeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 12, borderWidth: 2, borderColor: '#d9d3ce', backgroundColor: '#fff',
  },
  typeBtnActive: { borderColor: '#2d2d2b', backgroundColor: '#2d2d2b' },
  typeBtnText: { fontSize: 13, fontWeight: '700', color: '#2d2d2b' },
  typeBtnTextActive: { color: '#e6e1dc' },
  saveBtn: {
    backgroundColor: '#2d2d2b', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
  },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },

  // Card step
  cardContent: { padding: 24, alignItems: 'center', paddingBottom: 60 },
  greeting: { fontSize: 15, fontWeight: '600', color: 'rgba(45,45,43,0.6)', marginBottom: 20, alignSelf: 'flex-start' },
  card: {
    width: '100%',
    backgroundColor: '#1a1008',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  cardName: { fontSize: 22, fontWeight: '900', color: '#e8c382', letterSpacing: -0.5 },
  cardBusiness: { fontSize: 11, color: 'rgba(232,195,130,0.6)', textTransform: 'uppercase', letterSpacing: 2, marginTop: 2 },
  aLogo: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#e8c382', alignItems: 'center', justifyContent: 'center',
  },
  aLogoText: { fontSize: 26, fontWeight: '900', color: '#1a1008' },
  qrWrap: { alignItems: 'center', marginBottom: 20 },
  cardBottom: {},
  cardUpiLabel: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2, color: 'rgba(232,195,130,0.5)' },
  cardUpiId: { fontSize: 15, fontWeight: '700', color: '#e8c382', fontFamily: 'monospace', marginTop: 2 },

  actions: { flexDirection: 'row', gap: 12, width: '100%', marginBottom: 14 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 14, borderRadius: 14,
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb',
  },
  actionBtnText: { fontSize: 14, fontWeight: '700', color: '#2d2d2b' },
  actionBtnPrimary: { backgroundColor: '#2d2d2b', borderWidth: 0 },
  actionBtnPrimaryText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  stealthBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, marginBottom: 8 },
  stealthBtnText: { fontSize: 13, color: 'rgba(45,45,43,0.5)', fontWeight: '600' },
  editBtn: { paddingVertical: 10 },
  editBtnText: { fontSize: 13, fontWeight: '700', color: '#2d2d2b', textDecorationLine: 'underline' },
});
