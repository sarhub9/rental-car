import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '../../theme';
import AccountsApiService from '../../services/accounts-api.service';
import { Invoice, PaymentMethod } from '../../types';

const METHOD_COLORS: Record<PaymentMethod, string> = {
  CASH: Colors.success, CARD: Colors.primary, BANK_TRANSFER: '#7B1FA2',
  CHEQUE: Colors.warning, ONLINE: Colors.info,
};

interface PaymentRow {
  id: string;
  invoice_number: string;
  amount_paid: number;
  total_amount: number;
  status: string;
  created_at: string;
}

const AccountsPaymentListScreen: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const list = await AccountsApiService.listInvoices();
      setInvoices(list.filter((inv: Invoice) => inv.amount_paid > 0));
    } catch (err) {
      console.error('Payment list error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  const onRefresh = useCallback(() => { setRefreshing(true); loadData(); }, [loadData]);

  const totalCollected = invoices.reduce((sum, inv) => sum + (inv.amount_paid || 0), 0);

  const renderPayment = ({ item }: { item: Invoice }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.invoice_number}</Text>
        <Text style={[styles.cardStatus, {
          color: item.status === 'PAID' ? Colors.success : Colors.warning,
        }]}>
          {item.status.replace('_', ' ')}
        </Text>
      </View>
      <View style={styles.cardBody}>
        <View>
          <Text style={styles.amountLabel}>Paid</Text>
          <Text style={styles.amountValue}>AED {item.amount_paid?.toLocaleString()}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.amountLabel}>of AED {item.total_amount?.toLocaleString()}</Text>
          <Text style={styles.meta}>{new Date(item.created_at).toLocaleDateString()}</Text>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }

  return (
    <View style={styles.container}>
      {/* Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Total Collected</Text>
        <Text style={styles.summaryValue}>AED {totalCollected.toLocaleString()}</Text>
        <Text style={styles.summaryMeta}>{invoices.length} invoice(s) with payments</Text>
      </View>

      <FlatList
        data={invoices}
        keyExtractor={item => item.id}
        renderItem={renderPayment}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={styles.empty}>No payments recorded yet</Text>}
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: Spacing.lg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  summaryCard: {
    backgroundColor: Colors.success, borderRadius: BorderRadius.lg,
    padding: Spacing.xl, marginBottom: Spacing.xl, alignItems: 'center',
  },
  summaryLabel: { ...Typography.bodySmall, color: 'rgba(255,255,255,0.8)' },
  summaryValue: { ...Typography.h1, color: Colors.textWhite, marginTop: Spacing.xs },
  summaryMeta: { ...Typography.caption, color: 'rgba(255,255,255,0.7)', marginTop: Spacing.xs },
  card: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.md },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  cardTitle: { ...Typography.body, fontWeight: '600', color: Colors.text },
  cardStatus: { ...Typography.bodySmall, fontWeight: '600' },
  cardBody: { flexDirection: 'row', justifyContent: 'space-between' },
  amountLabel: { ...Typography.caption, color: Colors.textLight },
  amountValue: { ...Typography.h3, color: Colors.success },
  meta: { ...Typography.caption, color: Colors.textLight, marginTop: 2 },
  empty: { ...Typography.body, color: Colors.textLight, textAlign: 'center', paddingVertical: Spacing.xxl },
});

export default AccountsPaymentListScreen;
