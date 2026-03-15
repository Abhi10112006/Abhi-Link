import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Globe, Check } from 'lucide-react-native';
import { languages } from '../locales/translations';

interface LanguageSelectorProps {
  currentLang: string;
  onLanguageChange: (langCode: string) => void;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  currentLang,
  onLanguageChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const currentLanguage = languages.find((l) => l.code === currentLang) || languages[0];

  return (
    <>
      <TouchableOpacity
        style={styles.trigger}
        onPress={() => setIsOpen(true)}
        activeOpacity={0.8}
      >
        <Globe size={16} color="#2d2d2b" />
        <Text style={styles.triggerText}>{currentLanguage.nativeName}</Text>
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setIsOpen(false)}>
          <Pressable style={styles.dropdown} onPress={(e) => e.stopPropagation()}>
            <FlatList
              data={languages}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.langItem,
                    item.code === currentLang && styles.langItemActive,
                  ]}
                  onPress={() => {
                    onLanguageChange(item.code);
                    setIsOpen(false);
                  }}
                  activeOpacity={0.7}
                >
                  <View>
                    <Text style={styles.nativeName}>{item.nativeName}</Text>
                    <Text style={styles.engName}>{item.name}</Text>
                  </View>
                  {item.code === currentLang && <Check size={16} color="#2d2d2b" />}
                </TouchableOpacity>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#d9d3ce',
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  triggerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2d2d2b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdown: {
    width: 240,
    maxHeight: 320,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d9d3ce',
    overflow: 'hidden',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
  },
  langItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  langItemActive: {
    backgroundColor: '#f5f5f0',
  },
  nativeName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2d2d2b',
  },
  engName: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(45,45,43,0.5)',
  },
});
