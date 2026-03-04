import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '../../theme';
import AccountsApiService from '../../services/accounts-api.service';

const PERIODS = ['week', 'month', 'quarter', 'year'];

const AccountsReportsScreen: React.FC = () => {
  const [period, setPeriod] = useState('month');
  const [revenue, setRevenue] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadReport = useCallback(async () => {
    try {
      const data = await AccountsApiService.getRevenueReport(period);
      setRevenue(data);
    } catch (err) {
      console.error('Report error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period]);

  useEffect(() => {
    setLoading(true);
    loadReport();
  }, [loadReport]);

  const onRefresh = useCallback(() => { setRefreshing(true); loadReport(); }, [loadReport]);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }

  const collectionRate = revenue?.collection_rate || 0;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Period Selector */}
      <View style={styles.periodRow}>
        {PERIODS.map(p => (
          <TouchableOpacity
            key={p}
            style={[styles.periodTab, period === p && styles.periodTabActive]}
            onPress={() => setPeriod(p)}
          >
            <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {revenue ? (
        <>
          {/* Revenue Summary */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Revenue Summary — {period}</Text>
            <ReportRow label="Total Invoices" value={revenue.total_invoices?.toString() || '0'} />
            <ReportRow label="Total Billed" value={`AED ${(revenue.total_billed || 0).toLocaleString()}`} />
            <ReportRow label="Total Collected" value={`AED ${(revenue.total_collected || 0).toLocaleString()}`} color={Colors.success} />
            <ReportRow label="Outstanding" value={`AED ${(revenue.total_outstanding || 0).toLocaleString()}`} color={Colors.error} />
            <ReportRow label="VAT Collected" value={`AED ${(revenue.total_vat || 0).toLocaleString()}`} />
          </View>

          {/* Collection Rate */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Collection Rate</Text>
            <View style={styles.rateContainer}>
              <Text style={[styles.rateValue, {
                color: collectionRate >= 80 ? Colors.success : collectionRate >= 50 ? Colors.warning : Colors.error,
              }]}>
                {collectionRate.toFixed(1)}%
              </Text>
              <View style={styles.rateBar}>
                <View style={[styles.rateBarFill, {
                  width: `${Math.min(collectionRate, 100)}%`,
                  backgroundColor: collectionRate >= 80 ? Colors.success : collectionRate >= 50 ? Colors.warning : Colors.error,
                }]} />
              </View>
            </View>
          </View>
        </>
      ) : (
        <View style={styles.section}>
          <Text style={styles.emptyText}>No report data available for this period</Text>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const ReportRow = ({ label, value, color }: { label: string; value: string; color?: string }) => (
  <View style={reportStyles.row}>
    <Text style={reportStyles.label}>{label}</Text>
    <Text style={[reportStyles.value, color ? { color } : null]}>{value}</Text>
  </View>
);

const reportStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  label: { ...Typography.body, color: Colors.textSecondary },
  value: { ...Typography.body, color: Colors.text, fontWeight: '600' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: Spacing.lg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  periodRow: { flexDirection: 'row', marginBottom: Spacing.xl },
  periodTab: { flex: 1, paddingVertical: Spacing.md, alignItems: 'center', borderRadius: BorderRadius.md, backgroundColor: Colors.surface, marginHorizontal: 2 },
  periodTabActive: { backgroundColor: Colors.primary },
  periodText: { ...Typography.bodySmall, color: Colors.textSecondary },
  periodTextActive: { color: Colors.textWhite, fontWeight: '600' },
  section: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.lg },
  sectionTitle: { ...Typography.h3, color: Colors.text, marginBottom: Spacing.md },
  rateContainer: { alignItems: 'center' },
  rateValue: { ...Typography.h1, marginBottom: Spacing.md },
  rateBar: { width: '100%', height: 12, backgroundColor: Colors.borderLight, borderRadius: 6, overflow: 'hidden' },
  rateBarFill: { height: '100%', borderRadius: 6 },
  emptyText: { ...Typography.body, color: Colors.textLight, textAlign: 'center' },
});

export default AccountsReportsScreen;
