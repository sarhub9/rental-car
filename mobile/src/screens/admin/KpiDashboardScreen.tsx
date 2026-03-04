import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { Colors, Spacing, Typography, BorderRadius, Shadow3D } from '../../theme';

const API_URL = (process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.100.28:3000/v1').replace(/\/v1\/?$/, '');

const KpiCard: React.FC<{ title: string; value: string | number; icon: string; color: string }> = ({ title, value, icon, color }) => (
  <View style={styles.kpiCard}>
    <View style={[styles.kpiIconWrap, { backgroundColor: color + '20' }]}>
      <MaterialCommunityIcons name={icon as any} size={20} color={color} />
    </View>
    <Text style={[styles.kpiValue, { color }]}>{value}</Text>
    <Text style={styles.kpiTitle}>{title}</Text>
  </View>
);

const KpiDashboardScreen: React.FC<any> = () => {
  const { accessToken } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchKpis = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      if (!accessToken) {
        throw new Error('Session expired. Please login again.');
      }
      const res = await fetch(`${API_URL}/v1/kpis/summary`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) {
        throw new Error(`Failed to load KPIs (${res.status})`);
      }
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      } else {
        throw new Error(result.error || 'Failed to load KPI data');
      }
    } catch (err: any) {
      const message = err?.message || 'Failed to load KPI data';
      setError(message);
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => { fetchKpis(); }, [fetchKpis]);

  if (!data && loading) return (
    <View style={styles.loadingContainer}>
      <MaterialCommunityIcons name="chart-line" size={48} color={Colors.primary} />
      <Text style={styles.loadingText}>Loading KPIs...</Text>
    </View>
  );

  if (!data) {
    return (
      <View style={styles.loadingContainer}>
        <MaterialCommunityIcons name="alert-circle-outline" size={44} color={Colors.error} />
        <Text style={styles.loadingText}>{error || 'Unable to load KPI data.'}</Text>
      </View>
    );
  }

  const fleet = data.fleet || {};
  const revenue = data.revenue || {};
  const risk = data.risk || {};
  const profit = data.profit || {};

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchKpis} tintColor={Colors.primary} />}>
      {/* Fleet Section */}
      <View style={styles.sectionHeader}>
        <MaterialCommunityIcons name="car-multiple" size={20} color={Colors.primary} />
        <Text style={styles.sectionTitle}> Fleet</Text>
      </View>
      <View style={styles.row}>
        <KpiCard title="Utilization" value={`${fleet.utilization_percent ?? 0}%`} icon="speedometer" color={Colors.success} />
        <KpiCard title="Total Vehicles" value={fleet.total_vehicles ?? 0} icon="car" color={Colors.info} />
      </View>
      <View style={styles.row}>
        <KpiCard title="Rented Days" value={fleet.rented_days ?? 0} icon="calendar-check" color={Colors.primary} />
        <KpiCard title="Idle Days" value={fleet.idle_days ?? 0} icon="calendar-blank" color={Colors.warning} />
        <KpiCard title="Downtime" value={fleet.downtime_days ?? 0} icon="wrench-clock" color={Colors.error} />
      </View>

      {/* Revenue Section */}
      <View style={styles.sectionHeader}>
        <MaterialCommunityIcons name="cash-multiple" size={20} color={Colors.success} />
        <Text style={styles.sectionTitle}> Revenue</Text>
      </View>
      <View style={styles.row}>
        <KpiCard title="Total Revenue" value={`AED ${Number(revenue.total_revenue || 0).toFixed(0)}`} icon="trending-up" color={Colors.success} />
        <KpiCard title="Agreements" value={revenue.closed_agreements ?? 0} icon="file-document-check" color={Colors.primary} />
      </View>
      <View style={styles.row}>
        <KpiCard title="Base Rental" value={`AED ${Number(revenue.base_rental_revenue || 0).toFixed(0)}`} icon="car-key" color={Colors.primary} />
        <KpiCard title="Extra KM" value={`AED ${Number(revenue.extra_km_revenue || 0).toFixed(0)}`} icon="road-variant" color={Colors.accent} />
        <KpiCard title="Late Fees" value={`AED ${Number(revenue.late_fee_revenue || 0).toFixed(0)}`} icon="clock-alert" color={Colors.error} />
      </View>

      {/* Risk Section */}
      <View style={styles.sectionHeader}>
        <MaterialCommunityIcons name="shield-alert" size={20} color={Colors.error} />
        <Text style={styles.sectionTitle}> Risk</Text>
      </View>
      <View style={styles.row}>
        <KpiCard title="Damage Rate" value={`${risk.damage_frequency ?? 0}%`} icon="car-wrench" color={(risk.damage_frequency ?? 0) > 10 ? Colors.error : Colors.success} />
        <KpiCard title="Overdue Returns" value={risk.overdue_return_count ?? 0} icon="clock-alert-outline" color={Colors.warning} />
      </View>

      {/* Profit Section */}
      <View style={styles.sectionHeader}>
        <MaterialCommunityIcons name="chart-areaspline" size={20} color={Colors.primary} />
        <Text style={styles.sectionTitle}> Profit</Text>
      </View>
      <View style={styles.row}>
        <KpiCard title="Total Margin" value={`AED ${Number(profit.total_margin || 0).toFixed(0)}`} icon="arrow-up-bold-circle" color={(profit.total_margin ?? 0) > 0 ? Colors.success : Colors.error} />
        <KpiCard title="Total Cost" value={`AED ${Number(profit.total_cost || 0).toFixed(0)}`} icon="arrow-down-bold-circle" color={Colors.error} />
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  loadingText: { ...Typography.body, color: Colors.textLight, marginTop: Spacing.md },

  sectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.sm,
  },
  sectionTitle: { ...Typography.h3, color: Colors.text },

  row: { flexDirection: 'row', paddingHorizontal: Spacing.sm, gap: 8 },

  kpiCard: {
    flex: 1,
    backgroundColor: Colors.card,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow3D.card,
  },
  kpiIconWrap: {
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  kpiTitle: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2, textAlign: 'center' },
  kpiValue: { fontSize: 20, fontWeight: '800', letterSpacing: 0.3 },
});

export default KpiDashboardScreen;
