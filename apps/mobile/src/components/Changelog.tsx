import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Pressable,
} from 'react-native';
import { X } from 'lucide-react-native';
import { PremiumBackground } from './PremiumBackground';

interface ChangelogProps {
  onClose: () => void;
  t: Record<string, string>;
}

const CHANGELOG_ITEMS = [
  "Introduced 'My Digital Card' with premium animations.",
  "Added interactive Premium Background across the app.",
  "Centralized Business Type selection to the Digital Wallet.",
  "Added Transaction History support.",
];

export const Changelog: React.FC<ChangelogProps> = ({ onClose, t }) => {
  return (
    <Modal
      visible
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <PremiumBackground />
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>ABHI LINK</Text>
            </View>

            <Text style={styles.version}>v1.0</Text>
            <Text style={styles.date}>March 14, 2026</Text>

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>What's New</Text>

            {CHANGELOG_ITEMS.map((item, i) => (
              <Text key={i} style={styles.changeItem}>
                {item}
              </Text>
            ))}
          </Pressable>
        </ScrollView>

        <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
          <X size={22} color="#6b7280" />
        </TouchableOpacity>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 40,
  },
  badge: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: 'rgba(255,255,255,0.5)',
    marginBottom: 20,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 4,
    textTransform: 'uppercase',
    color: '#6b7280',
  },
  version: {
    fontSize: 96,
    fontWeight: '900',
    letterSpacing: -4,
    color: '#111827',
    lineHeight: 100,
    textAlign: 'center',
  },
  date: {
    fontSize: 16,
    fontWeight: '500',
    color: '#9ca3af',
    letterSpacing: 4,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 28,
  },
  divider: {
    width: 200,
    height: 1,
    backgroundColor: '#e5e7eb',
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 5,
    textTransform: 'uppercase',
    color: '#9ca3af',
    marginBottom: 24,
    textAlign: 'center',
  },
  changeItem: {
    fontSize: 22,
    fontWeight: '700',
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 30,
  },
  closeBtn: {
    position: 'absolute',
    top: 48,
    right: 24,
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
