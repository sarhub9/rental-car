import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius, Shadow3D } from '../../theme';
import { useAuth } from '../../hooks/useAuth';
import AccountsApiService from '../../services/accounts-api.service';
import { AccountsStackParamList, Invoice, InvoiceStatus } from '../../types';

type NavProp = NativeStackNavigationProp<AccountsStackParamList>;

const STATUS_COLORS: Record<InvoiceStatus, string> = {
  DRAFT: Colors.textLight,
  ISSUED: Colors.info,
  PAID: Colors.success,
  PARTIALLY_PAID: Colors.warning,
  VOIDED: Colors.error,
  OVERDUE: Colors.error,
};

const STATUS_ICONS: Record<InvoiceStatus, string> = {
  DRAFT: 'file-edit-outline',
  ISSUED: 'send-outline',
  PAID: 'check-circle',
  PARTIALLY_PAID: 'clock-outline',
  VOIDED: 'close-circle',
  OVERDUE: 'alert-circle',
};

const AccountsDashboardScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const { user, logout } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const list = await AccountsApiService.listInvoices();
      setInvoices(list);
    } catch (err) {
      console.error('Accounts dashboard error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  const onRefresh = useCallback(() => { setRefreshing(true); loadData(); }, [loadData]);

  const totalInvoiced = invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
  const totalCollected = invoices.reduce((sum, inv) => sum + (inv.amount_paid || 0), 0);
  const totalOutstanding = invoices.reduce((sum, inv) => sum + (inv.balance_due || 0), 0);
  const totalVat = invoices.reduce((sum, inv) => sum + (inv.vat_amount || 0), 0);
  const overdueCount = invoices.filter(inv => inv.status === 'OVERDUE').length;

  const statusCounts = invoices.reduce((acc, inv) => {
    acc[inv.status] = (acc[inv.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }

  const kpis = [
    { icon: 'file-document-multiple', value: `AED ${totalInvoiced.toLocaleString()}`, label: 'Total Invoiced', color: Colors.info },
    { icon: 'cash-check', value: `AED ${totalCollected.toLocaleString()}`, label: 'Collected', color: Colors.success },
    { icon: 'cash-clock', value: `AED ${totalOutstanding.toLocaleString()}`, label: 'Outstanding', color: Colors.warning },
    { icon: 'percent-outline', value: `AED ${totalVat.toLocaleString()}`, label: 'VAT Collected', color: Colors.accent },
  ];

  const quickActions = [
    { icon: 'receipt', label: 'Invoices', screen: 'AccountsInvoiceList', color: Colors.primary },
    { icon: 'cash-multiple', label: 'Payments', screen: 'AccountsPaymentList', color: Colors.success },
    { icon: 'chart-line', label: 'Reports', screen: 'AccountsReports', color: Colors.accent },
    { icon: 'shield-check', label: 'Deposits', screen: 'DepositList', color: Colors.info },
    { icon: 'car-brake-alert', label: 'Tolls/Fines', screen: 'TollFineList', color: Colors.error },
  ];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      {/* Welcome Header */}
      <View style={styles.welcomeCard}>
        <View style={styles.welcomeLeft}>
          <View style={styles.avatarWrap}>
            <FontAwesome5 name="calculator" size={20} color={Colors.textDark} />
          </View>
          <View>
            <Text style={styles.welcomeLabel}>Accounts</Text>
            <Text style={styles.userName}>{user?.full_name || 'Accountant'}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={18} color={Colors.textDark} />
        </TouchableOpacity>
      </View>

      {/* KPI Grid */}
      <View style={styles.kpiGrid}>
        {kpis.map((kpi, i) => (
          <View key={i} style={styles.kpiCard}>
            <View style={[styles.kpiIconWrap, { backgroundColor: kpi.color + '20' }]}>
              <MaterialCommunityIcons name={kpi.icon as any} size={24} color={kpi.color} />
            </View>
            <Text style={styles.kpiValue}>{kpi.value}</Text>
            <Text style={styles.kpiLabel}>{kpi.label}</Text>
          </View>
        ))}
      </View>

      {/* Overdue Alert */}
      {overdueCount > 0 && (
        <View style={styles.alertBanner}>
          <Ionicons name="warning" size={20} color={Colors.error} />
          <Text style={styles.alertText}> {overdueCount} overdue invoice(s) need attention</Text>
        </View>
      )}

      {/* Invoice Status Breakdown */}
      <Text style={styles.sectionTitle}>
        <MaterialCommunityIcons name="chart-donut" size={18} color={Colors.primary} />
        {'  '}Invoice Status
      </Text>
      <View style={styles.statusCard}>
        {Object.entries(statusCounts).map(([status, count]) => {
          const clr = STATUS_COLORS[status as InvoiceStatus] || Colors.textLight;
          const ico = STATUS_ICONS[status as InvoiceStatus] || 'help-circle';
          return (
            <View key={status} style={styles.statusItem}>
              <MaterialCommunityIcons name={ico as any} size={18} color={clr} />
              <Text style={styles.statusLabel}>{status.replace('_', ' ')}</Text>
              <View style={[styles.statusCountBadge, { backgroundColor: clr + '20' }]}>
                <Text style={[styles.statusCountText, { color: clr }]}>{count}</Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>
        <MaterialCommunityIcons name="lightning-bolt" size={18} color={Colors.primary} />
        {'  '}Quick Actions
      </Text>
      <View style={styles.actionsGrid}>
        {quickActions.map((action, i) => (
          <TouchableOpacity
            key={i}
            style={styles.actionBtn}
            activeOpacity={0.8}
            onPress={() => navigation.navigate(action.screen as any)}
          >
            <View style={styles.actionIconWrap}>
              <MaterialCommunityIcons name={action.icon as any} size={22} color={action.color} />
            </View>
            <Text style={styles.actionText}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Recent Invoices */}
      <Text style={styles.sectionTitle}>
        <Ionicons name="time-outline" size={18} color={Colors.primary} />
        {'  '}Recent Invoices
      </Text>
      {invoices.slice(0, 5).map(inv => (
        <TouchableOpacity
          key={inv.id}
          style={styles.invoiceCard}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('AccountsInvoiceDetail', { invoiceId: inv.id })}
        >
          <View style={styles.invoiceInner}>
            <View style={[styles.invoiceIconWrap, { backgroundColor: (STATUS_COLORS[inv.status] || Colors.textLight) + '20' }]}>
              <MaterialCommunityIcons
                name={(STATUS_ICONS[inv.status] || 'file-document') as any}
                size={20}
                color={STATUS_COLORS[inv.status] || Colors.textLight}
              />
            </View>
            <View style={styles.invoiceContent}>
              <View style={styles.invoiceHeader}>
                <Text style={styles.invoiceNum}>{inv.invoice_number}</Text>
                <View style={[styles.badge, { backgroundColor: (STATUS_COLORS[inv.status] || Colors.textLight) + '22', borderColor: STATUS_COLORS[inv.status] || Colors.textLight }]}>
                  <Text style={[styles.badgeText, { color: STATUS_COLORS[inv.status] || Colors.textLight }]}>{inv.status.replace('_', ' ')}</Text>
                </View>
              </View>
              <Text style={styles.invoiceAmount}>AED {inv.total_amount?.toLocaleString()}</Text>
              <Text style={styles.invoiceMeta}>Due: {new Date(inv.due_date).toLocaleDateString()}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textLight} />
          </View>
        </TouchableOpacity>
      ))}

      {!invoices.length && (
        <View style={styles.emptyWrap}>
          <MaterialCommunityIcons name="file-document-outline" size={42} color={Colors.textLight} />
          <Text style={styles.emptyText}>No invoices yet</Text>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: Spacing.lg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },

  welcomeCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.borderGold,
    ...Shadow3D.card,
  },
  welcomeLeft: { flexDirection: 'row', alignItems: 'center' },
  avatarWrap: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
    marginRight: Spacing.md,
    ...Shadow3D.goldGlow,
  },
  welcomeLabel: { ...Typography.bodySmall, color: Colors.textSecondary },
  userName: { ...Typography.h2, color: Colors.textGold },
  logoutBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
    ...Shadow3D.button,
  },

  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: Spacing.xl },
  kpiCard: {
    width: '48%',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow3D.card,
  },
  kpiIconWrap: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  kpiValue: { ...Typography.h3, color: Colors.text, fontWeight: '700' },
  kpiLabel: { ...Typography.caption, color: Colors.textSecondary, marginTop: Spacing.xs, textAlign: 'center' },

  alertBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.error + '15',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.error,
    borderWidth: 1,
    borderColor: Colors.error + '30',
  },
  alertText: { ...Typography.bodySmall, color: Colors.error, fontWeight: '700' },

  sectionTitle: { ...Typography.h3, color: Colors.text, marginBottom: Spacing.md, marginTop: Spacing.sm },

  statusCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow3D.card,
  },
  statusItem: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  statusLabel: { ...Typography.body, color: Colors.text, flex: 1, marginLeft: Spacing.md },
  statusCountBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.round,
  },
  statusCountText: { ...Typography.h3, fontWeight: '700' },

  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: Spacing.xl },
  actionBtn: {
    width: '18%',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  actionIconWrap: {
    width: 50, height: 50, borderRadius: BorderRadius.lg,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 0,
    marginBottom: Spacing.xs,
  },
  actionText: { ...Typography.caption, color: Colors.textSecondary, textAlign: 'center', fontSize: 10 },

  invoiceCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow3D.cardLight,
  },
  invoiceInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  invoiceIconWrap: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
    marginRight: Spacing.md,
  },
  invoiceContent: { flex: 1 },
  invoiceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  invoiceNum: { ...Typography.body, fontWeight: '700', color: Colors.textGold },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
  },
  badgeText: { ...Typography.caption, fontWeight: '700', fontSize: 10 },
  invoiceAmount: { ...Typography.h3, color: Colors.text, marginTop: Spacing.xs },
  invoiceMeta: { ...Typography.caption, color: Colors.textLight, marginTop: 2 },

  emptyWrap: { alignItems: 'center', paddingVertical: Spacing.xl },
  emptyText: { ...Typography.body, color: Colors.textLight, textAlign: 'center', marginTop: Spacing.sm },
});

export default AccountsDashboardScreen;
