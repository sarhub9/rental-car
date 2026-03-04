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
import AdminApiService from '../../services/admin-api.service';
import { OwnerAdminStackParamList, AdminDashboardData } from '../../types';

type NavProp = NativeStackNavigationProp<OwnerAdminStackParamList>;

const AdminDashboardScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const { user, logout } = useAuth();
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = useCallback(async () => {
    try {
      const result = await AdminApiService.getDashboard();
      setData(result);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadDashboard();
  }, [loadDashboard]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const kpis = [
    { icon: 'car-key', value: data?.active_agreements ?? 0, label: 'Active Rentals', color: Colors.primary },
    { icon: 'cash-multiple', value: data?.total_revenue ? `${data.total_revenue.toLocaleString()}` : '0', label: 'Revenue (AED)', color: Colors.success },
    { icon: 'speedometer', value: `${data?.fleet_utilization_percent ?? 0}%`, label: 'Fleet Utilization', color: Colors.accent },
    { icon: 'alert-circle-outline', value: data?.overdue_returns ?? 0, label: 'Overdue Returns', color: Colors.error },
  ];

  const actions = [
    { icon: 'account-group-outline', label: 'Users', screen: 'UserList', color: '#0E7490' },
    { icon: 'chart-box-outline', label: 'Reports', screen: 'Reports', color: '#047857' },
    { icon: 'cog-outline', label: 'Settings', screen: 'Settings', color: '#334155' },
    { icon: 'file-document-multiple-outline', label: 'Agreements', screen: 'AdminAgreementList', color: '#0F766E' },
    { icon: 'receipt', label: 'Invoices', screen: 'AdminInvoiceList', color: '#1E40AF' },
    { icon: 'car-multiple', label: 'Vehicles', screen: 'AdminVehicleList', color: '#7C2D12' },
    { icon: 'chart-line', label: 'KPIs', screen: 'KpiDashboard', color: '#7C3AED' },
    { icon: 'clipboard-text-outline', label: 'Audit Log', screen: 'AuditLog', color: '#475569' },
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
            <FontAwesome5 name="crown" size={22} color={Colors.textDark} />
          </View>
          <View>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.userName}>{user?.full_name || 'Admin'}</Text>
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

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>
        <MaterialCommunityIcons name="lightning-bolt" size={18} color={Colors.primary} />
        {'  '}Quick Actions
      </Text>
      <View style={styles.actionsGrid}>
        {actions.map((action, i) => (
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

      {/* Recent Activity */}
      <Text style={styles.sectionTitle}>
        <Ionicons name="time-outline" size={18} color={Colors.primary} />
        {'  '}Recent Activity
      </Text>
      {data?.recent_activity?.length ? (
        data.recent_activity.slice(0, 5).map((item: any) => (
          <View key={item.id} style={styles.activityItem}>
            <View style={styles.activityDot} />
            <View style={styles.activityContent}>
              <Text style={styles.activityType}>{item.event_type}</Text>
              <Text style={styles.activityDesc}>{item.event_description}</Text>
              <Text style={styles.activityTime}>
                {new Date(item.event_timestamp).toLocaleString()}
              </Text>
            </View>
          </View>
        ))
      ) : (
        <View style={styles.emptyWrap}>
          <MaterialCommunityIcons name="inbox-outline" size={36} color={Colors.textLight} />
          <Text style={styles.emptyText}>No recent activity</Text>
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
  welcomeText: { ...Typography.bodySmall, color: Colors.textSecondary },
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
  kpiLabel: { ...Typography.caption, color: Colors.textSecondary, marginTop: Spacing.xs, textAlign: 'center' },

  sectionTitle: { ...Typography.h3, color: Colors.text, marginBottom: Spacing.md },

  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: Spacing.xl },
  actionBtn: {
    width: '23%',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  actionIconWrap: {
    width: 52, height: 52, borderRadius: BorderRadius.lg,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 0,
    marginBottom: Spacing.xs,
  },
  actionText: { ...Typography.caption, color: Colors.textSecondary, textAlign: 'center' },

  activityItem: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow3D.cardLight,
  },
  activityDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: Colors.primary,
    marginTop: 6, marginRight: Spacing.md,
  },
  activityContent: { flex: 1 },
  activityType: { ...Typography.label, color: Colors.textGold },
  activityDesc: { ...Typography.bodySmall, color: Colors.textSecondary },
  activityTime: { ...Typography.caption, color: Colors.textLight, marginTop: 2 },

  emptyWrap: { alignItems: 'center', paddingVertical: Spacing.xl },
  emptyText: { ...Typography.body, color: Colors.textLight, textAlign: 'center', marginTop: Spacing.sm },
});

export default AdminDashboardScreen;
