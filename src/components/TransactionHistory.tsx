import React, { useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  Animated,
  PanResponder,
} from 'react-native';
import { X, History, IndianRupee, Trash2, ArrowDownLeft, ArrowUpRight } from 'lucide-react-native';
import { PremiumBackground } from './PremiumBackground';

export interface Transaction {
  id: string;
  payeeName: string;
  payeeUpiId: string;
  amount: string;
  remarks: string;
  date: string;
  time: string;
  isReceiver: boolean;
}

interface TransactionHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  onClearAll: () => void;
  onDeleteTransaction: (id: string) => void;
  t: Record<string, string>;
}

const DELETE_THRESHOLD = -80;

const SwipeableCard: React.FC<{
  tx: Transaction;
  onDelete: (id: string) => void;
}> = ({ tx, onDelete }) => {
  const translateX = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 8,
      onPanResponderMove: (_, gs) => {
        if (gs.dx < 0) translateX.setValue(Math.max(gs.dx, -120));
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dx < DELETE_THRESHOLD) {
          onDelete(tx.id);
        } else {
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    }),
  ).current;

  return (
    <View style={styles.swipeContainer}>
      {/* Delete background */}
      <View style={styles.deleteBg}>
        <Trash2 size={18} color="#e6e1dc" />
        <Text style={styles.deleteLabel}>Delete</Text>
      </View>

      <Animated.View
        style={[styles.card, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        <View style={styles.directionIcon}>
          {tx.isReceiver ? (
            <ArrowDownLeft size={18} color="#16a34a" />
          ) : (
            <ArrowUpRight size={18} color="#dc2626" />
          )}
        </View>

        <View style={styles.cardBody}>
          <View style={styles.cardRow}>
            <Text style={styles.payeeName} numberOfLines={1}>
              {tx.payeeName || tx.payeeUpiId}
            </Text>
            <Text style={[styles.amountText, { color: tx.isReceiver ? '#16a34a' : '#2d2d2b' }]}>
              {tx.isReceiver ? '+' : '-'}₹{tx.amount}
            </Text>
          </View>
          <View style={styles.cardRow}>
            <Text style={styles.upiId} numberOfLines={1}>
              {tx.payeeUpiId}
            </Text>
            <Text style={styles.dateText}>
              {tx.date} {tx.time}
            </Text>
          </View>
          {!!tx.remarks && (
            <Text style={styles.remarks} numberOfLines={1}>
              {tx.remarks}
            </Text>
          )}
        </View>
      </Animated.View>
    </View>
  );
};

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  isOpen,
  onClose,
  transactions,
  onClearAll,
  onDeleteTransaction,
  t,
}) => {
  const handleClearAll = () => {
    Alert.alert(
      t.clearAll || 'Clear All',
      t.confirmClearAll || 'Are you sure you want to delete all transaction history?',
      [
        { text: t.cancel || 'Cancel', style: 'cancel' },
        { text: t.clearAll || 'Clear All', onPress: onClearAll, style: 'destructive' },
      ],
    );
  };

  return (
    <Modal visible={isOpen} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.container}>
        <PremiumBackground />

        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <History size={20} color="#2d2d2b" />
            <Text style={styles.headerTitle}>{t.history || 'History'}</Text>
          </View>
          <View style={styles.headerRight}>
            {transactions.length > 0 && (
              <TouchableOpacity style={styles.clearBtn} onPress={handleClearAll} activeOpacity={0.7}>
                <Text style={styles.clearBtnText}>{t.clearAll || 'Clear All'}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <X size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>
        </View>

        {transactions.length === 0 ? (
          <View style={styles.emptyState}>
            <IndianRupee size={40} color="rgba(45,45,43,0.2)" />
            <Text style={styles.emptyTitle}>{t.noTransactions || 'No Transactions Yet'}</Text>
            <Text style={styles.emptyBody}>
              {t.noTransactionsDesc || 'Generate a receipt to record a transaction here.'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={transactions}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <SwipeableCard tx={item} onDelete={onDeleteTransaction} />
            )}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </Modal>
  );
};

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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#2d2d2b',
    letterSpacing: -0.5,
    textTransform: 'uppercase',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  clearBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#d9d3ce',
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  clearBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2d2d2b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2d2d2b',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyBody: {
    fontSize: 14,
    color: 'rgba(45,45,43,0.6)',
    textAlign: 'center',
  },
  list: {
    padding: 16,
    paddingBottom: 40,
    gap: 10,
  },
  swipeContainer: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
  },
  deleteBg: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 100,
    backgroundColor: '#2d2d2b',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 16,
  },
  deleteLabel: {
    color: '#e6e1dc',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  directionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f5f5f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    flex: 1,
    gap: 4,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  payeeName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2d2d2b',
    flex: 1,
    marginRight: 8,
  },
  amountText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#2d2d2b',
  },
  upiId: {
    fontSize: 11,
    color: 'rgba(45,45,43,0.6)',
    flex: 1,
    marginRight: 8,
    fontFamily: 'monospace',
  },
  dateText: {
    fontSize: 11,
    color: 'rgba(45,45,43,0.5)',
  },
  remarks: {
    fontSize: 11,
    color: 'rgba(45,45,43,0.5)',
    fontStyle: 'italic',
    marginTop: 2,
  },
});
