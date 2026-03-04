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
import VehicleApiService from '../../services/vehicle-api.service';
import { FleetManagerStackParamList, Vehicle, VehicleStatus } from '../../types';

type NavProp = NativeStackNavigationProp<FleetManagerStackParamList>;

const STATUS_CONFIG: Record<VehicleStatus, { color: string; icon: string }> = {
  AVAILABLE: { color: Colors.success, icon: 'check-circle' },
  RENTED: { color: Colors.primary, icon: 'car-key' },
  MAINTENANCE: { color: Colors.warning, icon: 'wrench' },
  OUT_OF_SERVICE: { color: Colors.error, icon: 'close-circle' },
};

const FleetDashboardScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const { user, logout } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const list = await VehicleApiService.listVehicles();
      setVehicles(list);
    } catch (err) {
      console.error('Fleet dashboard load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const statusCounts = vehicles.reduce((acc, v) => {
    acc[v.status] = (acc[v.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const utilization = vehicles.length
    ? Math.round(((statusCounts['RENTED'] || 0) / vehicles.length) * 100)
    : 0;

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      {/* Welcome Header */}
      <View style={styles.welcomeCard}>
        <View style={styles.welcomeLeft}>
          <View style={styles.avatarWrap}>
            <FontAwesome5 name="car" size={20} color={Colors.textDark} />
          </View>
          <View>
            <Text style={styles.welcomeLabel}>Fleet Manager</Text>
            <Text style={styles.userName}>{user?.full_name || 'Manager'}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={18} color={Colors.textDark} />
        </TouchableOpacity>
      </View>

      {/* KPI Cards */}
      <View style={styles.kpiGrid}>
        {[
          { icon: 'car-multiple', value: vehicles.length, label: 'Total Vehicles', color: Colors.info },
          { icon: 'check-decagram', value: statusCounts['AVAILABLE'] || 0, label: 'Available', color: Colors.success },
          { icon: 'car-key', value: statusCounts['RENTED'] || 0, label: 'Rented', color: Colors.primary },
          { icon: 'speedometer', value: `${utilization}%`, label: 'Utilization', color: Colors.accent },
        ].map((kpi, i) => (
          <View key={i} style={styles.kpiCard}>
            <View style={[styles.kpiIconWrap, { backgroundColor: kpi.color + '20' }]}>
              <MaterialCommunityIcons name={kpi.icon as any} size={24} color={kpi.color} />
            </View>
            <Text style={styles.kpiValue}>{kpi.value}</Text>
            <Text style={styles.kpiLabel}>{kpi.label}</Text>
          </View>
        ))}
      </View>

      {/* Status Breakdown */}
      <Text style={styles.sectionTitle}>
        <MaterialCommunityIcons name="chart-donut" size={18} color={Colors.primary} />
        {'  '}Status Breakdown
      </Text>
      <View style={styles.statusCard}>
        {(['AVAILABLE', 'RENTED', 'MAINTENANCE', 'OUT_OF_SERVICE'] as VehicleStatus[]).map((s) => {
          const cfg = STATUS_CONFIG[s];
          return (
            <View key={s} style={styles.statusItem}>
              <MaterialCommunityIcons name={cfg.icon as any} size={18} color={cfg.color} />
              <Text style={styles.statusLabel}>{s.replace('_', ' ')}</Text>
              <View style={[styles.statusCountBadge, { backgroundColor: cfg.color + '20' }]}>
                <Text style={[styles.statusCount, { color: cfg.color }]}>{statusCounts[s] || 0}</Text>
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
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionBtn} activeOpacity={0.8} onPress={() => navigation.navigate('FleetVehicleList')}>
          <MaterialCommunityIcons name="format-list-bulleted" size={22} color={Colors.textDark} />
          <Text style={styles.actionText}>All Vehicles</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} activeOpacity={0.8} onPress={() => navigation.navigate('FleetVehicleCreate')}>
          <Ionicons name="add-circle" size={22} color={Colors.textDark} />
          <Text style={styles.actionText}>Add Vehicle</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} activeOpacity={0.8} onPress={() => navigation.navigate('MaintenanceList')}>
          <MaterialCommunityIcons name="wrench-outline" size={22} color={Colors.textDark} />
          <Text style={styles.actionText}>Maintenance</Text>
        </TouchableOpacity>
      </View>

      {/* Maintenance Alerts */}
      <Text style={styles.sectionTitle}>
        <Ionicons name="warning-outline" size={18} color={Colors.error} />
        {'  '}Maintenance / Out of Service
      </Text>
      {vehicles.filter(v => v.status === 'MAINTENANCE' || v.status === 'OUT_OF_SERVICE').length ? (
        vehicles
          .filter(v => v.status === 'MAINTENANCE' || v.status === 'OUT_OF_SERVICE')
          .slice(0, 5)
          .map(v => {
            const cfg = STATUS_CONFIG[v.status];
            return (
              <TouchableOpacity
                key={v.id}
                style={styles.vehicleCard}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('FleetVehicleDetail', { vehicleId: v.id })}
              >
                <View style={styles.vehicleCardInner}>
                  <View style={[styles.vehicleIconWrap, { backgroundColor: cfg.color + '20' }]}>
                    <MaterialCommunityIcons name={cfg.icon as any} size={22} color={cfg.color} />
                  </View>
                  <View style={styles.vehicleInfo}>
                    <Text style={styles.vehicleName}>{v.make} {v.model} ({v.year})</Text>
                    <Text style={styles.vehiclePlate}>{v.plate_emirate} {v.plate_number}</Text>
                  </View>
                  <View style={[styles.vehicleStatusBadge, { backgroundColor: cfg.color + '20', borderColor: cfg.color }]}>
                    <Text style={[styles.vehicleStatusText, { color: cfg.color }]}>
                      {v.status.replace('_', ' ')}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
      ) : (
        <View style={styles.emptyWrap}>
          <MaterialCommunityIcons name="check-all" size={36} color={Colors.success} />
          <Text style={styles.emptyText}>All vehicles operational</Text>
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
  kpiValue: { ...Typography.h1, color: Colors.text },
  kpiLabel: { ...Typography.caption, color: Colors.textSecondary, marginTop: Spacing.xs },

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
  statusCount: { ...Typography.h3, fontWeight: '700' },

  actionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xl },
  actionBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    marginHorizontal: Spacing.xs,
    ...Shadow3D.button,
  },
  actionText: { ...Typography.caption, color: Colors.textDark, fontWeight: '700', marginTop: Spacing.xs },

  vehicleCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow3D.cardLight,
  },
  vehicleCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  vehicleIconWrap: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
    marginRight: Spacing.md,
  },
  vehicleInfo: { flex: 1 },
  vehicleName: { ...Typography.body, color: Colors.text, fontWeight: '600' },
  vehiclePlate: { ...Typography.bodySmall, color: Colors.textSecondary },
  vehicleStatusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
  },
  vehicleStatusText: { ...Typography.caption, fontWeight: '700' },

  emptyWrap: { alignItems: 'center', paddingVertical: Spacing.xl },
  emptyText: { ...Typography.body, color: Colors.textLight, textAlign: 'center', marginTop: Spacing.sm },
});

export default FleetDashboardScreen;
