import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { Colors, Spacing, Typography, BorderRadius } from '../../theme';
import { CustomerStackParamList, Invoice } from '../../types';
import CustomerPortalApiService from '../../services/customer-portal-api.service';

type RouteType = RouteProp<CustomerStackParamList, 'InvoiceDetail'>;

const InvoiceDetailScreen: React.FC = () => {
  const route = useRoute<RouteType>();
  const { invoiceId } = route.params;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadInvoice = useCallback(async () => {
    try {
      const data = await CustomerPortalApiService.getInvoiceDetail(invoiceId);
      setInvoice(data);
    } catch (err) {
      console.error('Failed to load invoice:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [invoiceId]);

  useEffect(() => { loadInvoice(); }, [loadInvoice]);

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }

  if (!invoice) {
    return <View style={styles.centered}><Text style={styles.errorText}>Invoice not found</Text></View>;
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadInvoice(); }} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.invoiceNumber}>{invoice.invoice_number}</Text>
        <Text style={styles.status}>{invoice.status.replace('_', ' ')}</Text>
      </View>

      {/* Dates */}
      <View style={styles.section}>
        {invoice.issued_at ? (
          <DetailRow label="Issued" value={new Date(invoice.issued_at).toLocaleDateString()} />
        ) : null}
        <DetailRow label="Due Date" value={new Date(invoice.due_date).toLocaleDateString()} />
      </View>

      {/* Line Items */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Items</Text>
        {invoice.line_items?.map((item) => (
          <View key={item.id} style={styles.lineItem}>
            <View style={styles.lineItemInfo}>
              <Text style={styles.lineItemDesc}>{item.description_en}</Text>
              {item.description_ar ? (
                <Text style={styles.lineItemDescAr}>{item.description_ar}</Text>
              ) : null}
              <Text style={styles.lineItemQty}>
                {item.quantity} x AED {Number(item.unit_price || 0).toFixed(2)}
              </Text>
            </View>
            <Text style={styles.lineItemAmount}>AED {Number(item.amount || 0).toFixed(2)}</Text>
          </View>
        ))}
      </View>

      {/* Totals */}
      <View style={styles.section}>
        <DetailRow label="Subtotal" value={`AED ${Number(invoice.subtotal || 0).toFixed(2)}`} />
        <DetailRow label={`VAT (${(Number(invoice.vat_rate || 0) * 100).toFixed(0)}%)`} value={`AED ${Number(invoice.vat_amount || 0).toFixed(2)}`} />
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalAmount}>AED {Number(invoice.total_amount || 0).toFixed(2)}</Text>
        </View>
        <DetailRow label="Amount Paid" value={`AED ${Number(invoice.amount_paid || 0).toFixed(2)}`} />
        {Number(invoice.balance_due || 0) > 0 ? (
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>Balance Due</Text>
            <Text style={styles.balanceAmount}>AED {Number(invoice.balance_due).toFixed(2)}</Text>
          </View>
        ) : null}
      </View>

      <View style={{ height: Spacing.xxl }} />
    </ScrollView>
  );
};

const DetailRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { ...Typography.body, color: Colors.error },
  header: {
    backgroundColor: Colors.background,
    padding: Spacing.xl,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  invoiceNumber: { ...Typography.h2, color: Colors.text, marginBottom: Spacing.sm },
  status: { ...Typography.body, color: Colors.primary, fontWeight: '600' },
  section: {
    backgroundColor: Colors.background,
    margin: Spacing.lg,
    marginBottom: 0,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  sectionTitle: {
    ...Typography.h3, color: Colors.text, marginBottom: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight, paddingBottom: Spacing.sm,
  },
  lineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  lineItemInfo: { flex: 1, marginRight: Spacing.lg },
  lineItemDesc: { ...Typography.body, color: Colors.text },
  lineItemDescAr: { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: Spacing.xs },
  lineItemQty: { ...Typography.caption, color: Colors.textLight, marginTop: Spacing.xs },
  lineItemAmount: { ...Typography.body, color: Colors.text, fontWeight: '600' },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  detailLabel: { ...Typography.bodySmall, color: Colors.textSecondary },
  detailValue: { ...Typography.bodySmall, color: Colors.text },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderTopWidth: 2,
    borderTopColor: Colors.border,
    marginTop: Spacing.sm,
  },
  totalLabel: { ...Typography.h3, color: Colors.text },
  totalAmount: { ...Typography.h3, color: Colors.primary },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    backgroundColor: '#FFF3F0',
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  balanceLabel: { ...Typography.body, color: Colors.error, fontWeight: '600' },
  balanceAmount: { ...Typography.body, color: Colors.error, fontWeight: '600' },
});

export default InvoiceDetailScreen;
