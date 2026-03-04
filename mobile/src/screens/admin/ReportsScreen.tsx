import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '../../theme';
import AdminApiService from '../../services/admin-api.service';

const PERIODS = ['week', 'month', 'quarter', 'year'];

const ReportsScreen: React.FC = () => {
  const [period, setPeriod] = useState('month');
  const [revenue, setRevenue] = useState<any>(null);
  const [receivables, setReceivables] = useState<any>(null);
  const [agreementStats, setAgreementStats] = useState<any>(null);
  const [vehicleStats, setVehicleStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadReports = useCallback(async () => {
    try {
      const [rev, rec, agr, veh] = await Promise.all([
        AdminApiService.getRevenueReport(period),
        AdminApiService.getReceivables(),
        AdminApiService.getAgreementStats(),
        AdminApiService.getVehicleStats(),
      ]);
      setRevenue(rev);
      setReceivables(rec);
      setAgreementStats(agr);
      setVehicleStats(veh);
    } catch (err) {
      console.error('Load reports error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period]);

  useEffect(() => { loadReports(); }, [loadReports]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadReports();
  }, [loadReports]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Period selector */}
      <Text style={styles.sectionTitle}>Revenue Report</Text>
      <View style={styles.periodRow}>
        {PERIODS.map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.periodBtn, period === p && styles.periodBtnActive]}
            onPress={() => setPeriod(p)}
          >
            <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {revenue && (
        <View style={styles.card}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Total Billed</Text>
            <Text style={styles.statValue}>AED {revenue.total_billed?.toLocaleString()}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Total Collected</Text>
            <Text style={[styles.statValue, { color: Colors.success }]}>
              AED {revenue.total_collected?.toLocaleString()}
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Outstanding</Text>
            <Text style={[styles.statValue, { color: Colors.error }]}>
              AED {revenue.total_outstanding?.toLocaleString()}
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>VAT Collected</Text>
            <Text style={styles.statValue}>AED {revenue.total_vat?.toLocaleString()}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Collection Rate</Text>
            <Text style={styles.statValue}>{revenue.collection_rate}%</Text>
          </View>
        </View>
      )}

      {/* Receivables */}
      <Text style={styles.sectionTitle}>Receivables</Text>
      {receivables && (
        <View style={styles.card}>
          <Text style={styles.totalLabel}>
            Total Receivable: AED {receivables.total_receivable?.toLocaleString()}
          </Text>
          {receivables.breakdown?.map((item: any) => (
            <View key={item.status} style={styles.statRow}>
              <Text style={styles.statLabel}>{item.status} ({item.count})</Text>
              <Text style={styles.statValue}>AED {item.total_due?.toLocaleString()}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Agreement Stats */}
      <Text style={styles.sectionTitle}>Agreement Stats</Text>
      {agreementStats && (
        <View style={styles.card}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Total Agreements</Text>
            <Text style={styles.statValue}>{agreementStats.total}</Text>
          </View>
          {Object.entries(agreementStats.by_status || {}).map(([status, count]) => (
            <View key={status} style={styles.statRow}>
              <Text style={styles.statLabel}>{status}</Text>
              <Text style={styles.statValue}>{count as number}</Text>
            </View>
          ))}
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Avg Rental Duration</Text>
            <Text style={styles.statValue}>{agreementStats.avg_rental_days} days</Text>
          </View>
        </View>
      )}

      {/* Fleet Stats */}
      <Text style={styles.sectionTitle}>Fleet Stats</Text>
      {vehicleStats && (
        <View style={styles.card}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Total Vehicles</Text>
            <Text style={styles.statValue}>{vehicleStats.total}</Text>
          </View>
          {Object.entries(vehicleStats.by_status || {}).map(([status, count]) => (
            <View key={status} style={styles.statRow}>
              <Text style={styles.statLabel}>{status}</Text>
              <Text style={styles.statValue}>{count as number}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: Spacing.lg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { ...Typography.h3, color: Colors.text, marginTop: Spacing.xl, marginBottom: Spacing.md },
  periodRow: { flexDirection: 'row', marginBottom: Spacing.md },
  periodBtn: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.round, marginRight: Spacing.sm,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
  },
  periodBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  periodText: { ...Typography.bodySmall, color: Colors.textSecondary },
  periodTextActive: { color: Colors.textWhite },
  card: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    padding: Spacing.lg, borderWidth: 1, borderColor: Colors.borderLight,
  },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.sm },
  statLabel: { ...Typography.body, color: Colors.textSecondary },
  statValue: { ...Typography.body, color: Colors.text, fontWeight: '600' },
  totalLabel: { ...Typography.h3, color: Colors.text, marginBottom: Spacing.md },
});

export default ReportsScreen;
