import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  TouchableOpacity, Alert, TextInput,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { Colors, Spacing, Typography, BorderRadius } from '../../theme';
import AccountsApiService from '../../services/accounts-api.service';
import { AccountsStackParamList, Invoice, InvoiceStatus, PaymentMethod } from '../../types';

type RouteType = RouteProp<AccountsStackParamList, 'AccountsInvoiceDetail'>;

const STATUS_COLORS: Record<InvoiceStatus, string> = {
  DRAFT: Colors.textLight, ISSUED: Colors.primary, PAID: Colors.success,
  PARTIALLY_PAID: Colors.warning, VOIDED: Colors.error, OVERDUE: '#D32F2F',
};

const PAYMENT_METHODS: PaymentMethod[] = ['CASH', 'CARD', 'BANK_TRANSFER', 'CHEQUE', 'ONLINE'];

const AccountsInvoiceDetailScreen: React.FC = () => {
  const route = useRoute<RouteType>();
  const { invoiceId } = route.params;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [paymentRef, setPaymentRef] = useState('');
  const [saving, setSaving] = useState(false);

  const loadInvoice = useCallback(async () => {
    try {
      const data = await AccountsApiService.getInvoice(invoiceId);
      setInvoice(data);
    } catch (err) {
      console.error('Invoice detail error:', err);
    } finally {
      setLoading(false);
    }
  }, [invoiceId]);

  useEffect(() => { loadInvoice(); }, [loadInvoice]);

  const handleIssue = () => {
    Alert.alert('Issue Invoice', 'Mark this invoice as issued?', [
      { text: 'Cancel' },
      { text: 'Issue', onPress: async () => {
        try {
          const updated = await AccountsApiService.issueInvoice(invoiceId);
          setInvoice(updated);
        } catch (err: any) {
          Alert.alert('Error', err?.response?.data?.error || 'Failed to issue');
        }
      }},
    ]);
  };

  const handleVoid = () => {
    Alert.alert('Void Invoice', 'This cannot be undone. Void this invoice?', [
      { text: 'Cancel' },
      { text: 'Void', style: 'destructive', onPress: async () => {
        try {
          const updated = await AccountsApiService.voidInvoice(invoiceId);
          setInvoice(updated);
        } catch (err: any) {
          Alert.alert('Error', err?.response?.data?.error || 'Failed to void');
        }
      }},
    ]);
  };

  const handleRecordPayment = async () => {
    const amt = parseFloat(paymentAmount);
    if (!amt || amt <= 0) {
      Alert.alert('Error', 'Enter a valid payment amount');
      return;
    }
    setSaving(true);
    try {
      await AccountsApiService.recordPayment(invoiceId, {
        amount: amt,
        payment_method: paymentMethod,
        transaction_reference: paymentRef.trim() || undefined,
      });
      setShowPaymentForm(false);
      setPaymentAmount('');
      setPaymentRef('');
      loadInvoice();
      Alert.alert('Success', 'Payment recorded');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'Failed to record payment');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !invoice) {
    return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }

  const InfoRow = ({ label, value }: { label: string; value: string | number | undefined }) => (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value ?? '—'}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{invoice.invoice_number}</Text>
        <View style={[styles.badge, { backgroundColor: STATUS_COLORS[invoice.status] }]}>
          <Text style={styles.badgeText}>{invoice.status.replace('_', ' ')}</Text>
        </View>
      </View>

      {/* Financial Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Financial Summary</Text>
        <InfoRow label="Subtotal" value={`AED ${invoice.subtotal?.toLocaleString()}`} />
        <InfoRow label="VAT ({(invoice.vat_rate || 5)}%)" value={`AED ${invoice.vat_amount?.toLocaleString()}`} />
        <InfoRow label="Total Amount" value={`AED ${invoice.total_amount?.toLocaleString()}`} />
        <InfoRow label="Amount Paid" value={`AED ${invoice.amount_paid?.toLocaleString()}`} />
        <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
          <Text style={[styles.infoLabel, { fontWeight: '600' }]}>Balance Due</Text>
          <Text style={[styles.infoValue, { color: invoice.balance_due > 0 ? Colors.error : Colors.success, fontWeight: '700' }]}>
            AED {invoice.balance_due?.toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Line Items */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Line Items</Text>
        {invoice.line_items?.map((item, idx) => (
          <View key={item.id || idx} style={styles.lineItem}>
            <Text style={styles.lineDesc}>{item.description_en}</Text>
            <View style={styles.lineRow}>
              <Text style={styles.lineMeta}>{item.quantity} x AED {item.unit_price}</Text>
              <Text style={styles.lineAmount}>AED {item.amount?.toLocaleString()}</Text>
            </View>
          </View>
        ))}
        {!invoice.line_items?.length && <Text style={styles.emptyText}>No line items</Text>}
      </View>

      {/* Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Details</Text>
        <InfoRow label="Issue Date" value={invoice.issued_at ? new Date(invoice.issued_at).toLocaleDateString() : 'Not issued'} />
        <InfoRow label="Due Date" value={new Date(invoice.due_date).toLocaleDateString()} />
        <InfoRow label="Created" value={new Date(invoice.created_at).toLocaleDateString()} />
      </View>

      {/* Actions */}
      <View style={styles.actionsSection}>
        {invoice.status === 'DRAFT' && (
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.primary }]} onPress={handleIssue}>
            <Text style={styles.actionBtnText}>Issue Invoice</Text>
          </TouchableOpacity>
        )}

        {(invoice.status === 'ISSUED' || invoice.status === 'PARTIALLY_PAID' || invoice.status === 'OVERDUE') && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: Colors.success }]}
            onPress={() => {
              setPaymentAmount(invoice.balance_due?.toString() || '');
              setShowPaymentForm(true);
            }}
          >
            <Text style={styles.actionBtnText}>Record Payment</Text>
          </TouchableOpacity>
        )}

        {invoice.status !== 'VOIDED' && invoice.status !== 'PAID' && (
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.error }]} onPress={handleVoid}>
            <Text style={styles.actionBtnText}>Void Invoice</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Payment Form */}
      {showPaymentForm && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Record Payment</Text>
          <Text style={styles.fieldLabel}>Amount (AED)</Text>
          <TextInput
            style={styles.input}
            value={paymentAmount}
            onChangeText={setPaymentAmount}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor={Colors.textLight}
          />
          <Text style={styles.fieldLabel}>Payment Method</Text>
          <View style={styles.methodRow}>
            {PAYMENT_METHODS.map(m => (
              <TouchableOpacity
                key={m}
                style={[styles.methodBtn, paymentMethod === m && styles.methodBtnActive]}
                onPress={() => setPaymentMethod(m)}
              >
                <Text style={[styles.methodText, paymentMethod === m && styles.methodTextActive]}>{m}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.fieldLabel}>Reference (optional)</Text>
          <TextInput
            style={styles.input}
            value={paymentRef}
            onChangeText={setPaymentRef}
            placeholder="Transaction reference"
            placeholderTextColor={Colors.textLight}
          />
          <View style={{ flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.md }}>
            <TouchableOpacity
              style={[styles.actionBtn, { flex: 1, backgroundColor: Colors.textLight }]}
              onPress={() => setShowPaymentForm(false)}
            >
              <Text style={styles.actionBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { flex: 1, backgroundColor: Colors.success }, saving && { opacity: 0.6 }]}
              onPress={handleRecordPayment}
              disabled={saving}
            >
              {saving ? <ActivityIndicator color={Colors.textWhite} /> : <Text style={styles.actionBtnText}>Save Payment</Text>}
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: Spacing.lg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl },
  title: { ...Typography.h2, color: Colors.text },
  badge: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.sm },
  badgeText: { ...Typography.bodySmall, color: Colors.textWhite, fontWeight: '600' },
  section: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.lg },
  sectionTitle: { ...Typography.h3, color: Colors.text, marginBottom: Spacing.md },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  infoLabel: { ...Typography.bodySmall, color: Colors.textSecondary },
  infoValue: { ...Typography.bodySmall, color: Colors.text, fontWeight: '600' },
  lineItem: { paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  lineDesc: { ...Typography.body, color: Colors.text },
  lineRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: Spacing.xs },
  lineMeta: { ...Typography.caption, color: Colors.textLight },
  lineAmount: { ...Typography.bodySmall, color: Colors.text, fontWeight: '600' },
  emptyText: { ...Typography.bodySmall, color: Colors.textLight, textAlign: 'center' },
  actionsSection: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginBottom: Spacing.lg },
  actionBtn: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderRadius: BorderRadius.md, alignItems: 'center' },
  actionBtnText: { ...Typography.bodySmall, color: Colors.textWhite, fontWeight: '600' },
  fieldLabel: { ...Typography.label, color: Colors.text, marginBottom: Spacing.sm, marginTop: Spacing.md },
  input: { borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, ...Typography.body, color: Colors.text },
  methodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  methodBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.round, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  methodBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  methodText: { ...Typography.caption, color: Colors.textSecondary },
  methodTextActive: { color: Colors.textWhite, fontWeight: '600' },
});

export default AccountsInvoiceDetailScreen;
