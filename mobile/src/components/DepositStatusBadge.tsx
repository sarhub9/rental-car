import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  status: 'HELD' | 'USED' | 'RELEASED' | 'FORFEITED' | 'REFUNDED';
  amount?: number;
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  HELD: { color: '#F57F17', bg: '#FFF8E1', label: 'Held' },
  USED: { color: '#C62828', bg: '#FFEBEE', label: 'Used' },
  RELEASED: { color: '#2E7D32', bg: '#E8F5E9', label: 'Released' },
  FORFEITED: { color: '#616161', bg: '#F5F5F5', label: 'Forfeited' },
  REFUNDED: { color: '#1565C0', bg: '#E3F2FD', label: 'Refunded' },
};

const DepositStatusBadge: React.FC<Props> = ({ status, amount }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.HELD;

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.label, { color: config.color }]}>{config.label}</Text>
      {amount !== undefined && (
        <Text style={[styles.amount, { color: config.color }]}>AED {amount.toFixed(2)}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, gap: 6 },
  label: { fontSize: 12, fontWeight: '700' },
  amount: { fontSize: 12, fontWeight: '600' },
});

export default DepositStatusBadge;
