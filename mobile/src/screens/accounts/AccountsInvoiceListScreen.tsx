import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Spacing, Typography, BorderRadius } from '../../theme';
import AccountsApiService from '../../services/accounts-api.service';
import { AccountsStackParamList, Invoice, InvoiceStatus } from '../../types';

type NavProp = NativeStackNavigationProp<AccountsStackParamList>;

const STATUS_COLORS: Record<InvoiceStatus, string> = {
  DRAFT: Colors.textLight, ISSUED: Colors.primary, PAID: Colors.success,
  PARTIALLY_PAID: Colors.warning, VOIDED: Colors.error, OVERDUE: '#D32F2F',
};

const AccountsInvoiceListScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filtered, setFiltered] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const loadData = useCallback(async () => {
    try {
      const list = await AccountsApiService.listInvoices();
      setInvoices(list);
      applyFilters(list, search, statusFilter);
    } catch (err) {
      console.error('Invoice list error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const applyFilters = (list: Invoice[], q: string, status: string) => {
    let result = list;
    if (status !== 'ALL') result = result.filter(inv => inv.status === status);
    if (q.trim()) {
      const lower = q.toLowerCase();
      result = result.filter(inv => inv.invoice_number?.toLowerCase().includes(lower));
    }
    setFiltered(result);
  };

  useEffect(() => { applyFilters(invoices, search, statusFilter); }, [search, statusFilter]);
  const onRefresh = useCallback(() => { setRefreshing(true); loadData(); }, [loadData]);

  const renderInvoice = ({ item }: { item: Invoice }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('AccountsInvoiceDetail', { invoiceId: item.id })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.invoice_number}</Text>
        <View style={[styles.badge, { backgroundColor: STATUS_COLORS[item.status] }]}>
          <Text style={styles.badgeText}>{item.status.replace('_', ' ')}</Text>
        </View>
      </View>
      <View style={styles.cardBody}>
        <View>
          <Text style={styles.amount}>AED {item.total_amount?.toLocaleString()}</Text>
          <Text style={styles.meta}>Paid: AED {item.amount_paid?.toLocaleString()}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.meta}>Due: {new Date(item.due_date).toLocaleDateString()}</Text>
          {item.balance_due > 0 && (
            <Text style={[styles.meta, { color: Colors.error, fontWeight: '600' }]}>
              Balance: AED {item.balance_due?.toLocaleString()}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        value={search}
        onChangeText={setSearch}
        placeholder="Search invoice number..."
        placeholderTextColor={Colors.textLight}
      />
      <View style={styles.filterRow}>
        {['ALL', 'DRAFT', 'ISSUED', 'PAID', 'PARTIALLY_PAID', 'OVERDUE', 'VOIDED'].map(s => (
          <TouchableOpacity
            key={s}
            style={[styles.filterTab, statusFilter === s && styles.filterTabActive]}
            onPress={() => setStatusFilter(s)}
          >
            <Text style={[styles.filterText, statusFilter === s && styles.filterTextActive]}>
              {s === 'PARTIALLY_PAID' ? 'Partial' : s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        renderItem={renderInvoice}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={styles.empty}>No invoices found</Text>}
        contentContainerStyle={{ paddingBottom: 40 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: Spacing.lg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  searchInput: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    ...Typography.body, color: Colors.text, marginBottom: Spacing.md,
  },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: Spacing.md, gap: Spacing.xs },
  filterTab: { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderRadius: BorderRadius.round, backgroundColor: Colors.surface },
  filterTabActive: { backgroundColor: Colors.primary },
  filterText: { ...Typography.caption, color: Colors.textSecondary },
  filterTextActive: { color: Colors.textWhite, fontWeight: '600' },
  card: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.md },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  cardTitle: { ...Typography.body, fontWeight: '600', color: Colors.text },
  badge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.sm },
  badgeText: { ...Typography.caption, color: Colors.textWhite, fontWeight: '600' },
  cardBody: { flexDirection: 'row', justifyContent: 'space-between' },
  amount: { ...Typography.h3, color: Colors.text },
  meta: { ...Typography.caption, color: Colors.textLight, marginTop: 2 },
  empty: { ...Typography.body, color: Colors.textLight, textAlign: 'center', paddingVertical: Spacing.xxl },
});

export default AccountsInvoiceListScreen;
