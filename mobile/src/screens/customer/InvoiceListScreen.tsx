import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Spacing, Typography, BorderRadius } from '../../theme';
import { CustomerStackParamList, Invoice, InvoiceStatus } from '../../types';
import CustomerPortalApiService from '../../services/customer-portal-api.service';

type NavProp = NativeStackNavigationProp<CustomerStackParamList>;

const STATUS_COLORS: Record<InvoiceStatus, string> = {
  DRAFT: Colors.textLight,
  ISSUED: Colors.info,
  PAID: Colors.success,
  PARTIALLY_PAID: Colors.warning,
  VOIDED: Colors.statusClosed,
  OVERDUE: Colors.error,
};

const InvoiceListScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadInvoices = useCallback(async () => {
    try {
      const response = await CustomerPortalApiService.getInvoices();
      setInvoices(response || []);
    } catch (err) {
      console.error('Failed to load invoices:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadInvoices(); }, [loadInvoices]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadInvoices();
  }, [loadInvoices]);

  const renderInvoice = ({ item }: { item: Invoice }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('InvoiceDetail', { invoiceId: item.id })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.invoiceNumber}>{item.invoice_number}</Text>
        <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] }]}>
          <Text style={styles.statusText}>{item.status.replace('_', ' ')}</Text>
        </View>
      </View>
      <View style={styles.cardBody}>
        <View style={styles.row}>
          <Text style={styles.label}>Total</Text>
          <Text style={styles.amount}>AED {Number(item.total_amount || 0).toFixed(2)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Balance Due</Text>
          <Text style={[styles.amount, Number(item.balance_due || 0) > 0 && { color: Colors.error }]}>
            AED {Number(item.balance_due || 0).toFixed(2)}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Due Date</Text>
          <Text style={styles.value}>{new Date(item.due_date).toLocaleDateString()}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={invoices}
        renderItem={renderInvoice}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No Invoices</Text>
            <Text style={styles.emptySubtitle}>You don't have any invoices yet.</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: Spacing.xl },
  card: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  invoiceNumber: { ...Typography.body, color: Colors.text, fontWeight: '600' },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  statusText: { ...Typography.caption, color: Colors.textWhite, fontWeight: '600' },
  cardBody: { gap: Spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { ...Typography.bodySmall, color: Colors.textSecondary },
  value: { ...Typography.bodySmall, color: Colors.text },
  amount: { ...Typography.body, color: Colors.text, fontWeight: '600' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  emptyTitle: { ...Typography.h3, color: Colors.textSecondary },
  emptySubtitle: { ...Typography.body, color: Colors.textLight, marginTop: Spacing.sm },
});

export default InvoiceListScreen;
