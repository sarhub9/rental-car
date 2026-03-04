import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius, Shadow3D } from '../../theme';
import { useAuth } from '../../hooks/useAuth';
import { CustomerStackParamList, DashboardData, Agreement } from '../../types';
import CustomerPortalApiService from '../../services/customer-portal-api.service';

type NavProp = NativeStackNavigationProp<CustomerStackParamList>;

const CustomerDashboardScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const { user, logout } = useAuth();

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  const loadDashboard = useCallback(async () => {
    try {
      setError('');
      const [data, count] = await Promise.all([
        CustomerPortalApiService.getDashboard(),
        CustomerPortalApiService.getUnreadCount().catch(() => 0),
      ]);
      setDashboard(data);
      setUnreadCount(count);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to load dashboard');
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

  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const quickActions = [
    { icon: 'car-key', label: 'My Rentals', screen: 'MyRentals', color: Colors.primary },
    { icon: 'receipt', label: 'Invoices', screen: 'InvoiceList', color: Colors.accent },
    { icon: 'alert-decagram', label: 'Disputes', screen: 'Disputes', color: Colors.error },
    { icon: 'chat', label: 'Messages', screen: 'Messages', color: Colors.success },
    { icon: 'bell-ring', label: 'Notifications', screen: 'Notifications', color: Colors.info },
  ];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user ? getInitials(user.full_name) : 'RC'}
            </Text>
          </View>
          <View>
            <Text style={styles.greeting}>Hello,</Text>
            <Text style={styles.userName}>{user?.full_name || 'Customer'}</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.notificationButton} onPress={() => navigation.navigate('Notifications')}>
            <Ionicons name="notifications" size={22} color={Colors.primary} />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.profileButton} onPress={() => navigation.navigate('Profile')}>
            <Ionicons name="person-circle" size={20} color={Colors.primary} />
            <Text style={styles.profileButtonText}> Profile</Text>
          </TouchableOpacity>
        </View>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={18} color={Colors.error} />
          <Text style={styles.errorText}> {error}</Text>
          <TouchableOpacity onPress={loadDashboard}>
            <Text style={styles.retryText}>Tap to retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Summary Cards */}
      <View style={styles.cardsRow}>
        {[
          { icon: 'car', value: dashboard?.active_rentals_count ?? 0, label: 'Active Rentals', color: Colors.success },
          { icon: 'file-document-multiple', value: dashboard?.total_rentals ?? 0, label: 'Total Rentals', color: Colors.info },
          { icon: 'cash-clock', value: dashboard?.pending_charges ? `AED ${dashboard.pending_charges}` : '0', label: 'Pending', color: Colors.warning },
        ].map((c, i) => (
          <View key={i} style={styles.card}>
            <View style={[styles.cardIconWrap, { backgroundColor: c.color + '20' }]}>
              <MaterialCommunityIcons name={c.icon as any} size={22} color={c.color} />
            </View>
            <Text style={styles.cardValue}>{c.value}</Text>
            <Text style={styles.cardLabel}>{c.label}</Text>
          </View>
        ))}
      </View>

      {/* Upcoming Returns */}
      {dashboard?.upcoming_returns && dashboard.upcoming_returns.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="time-outline" size={18} color={Colors.warning} /> Upcoming Returns
          </Text>
          {dashboard.upcoming_returns.map((agreement) => (
            <TouchableOpacity
              key={agreement.id}
              style={styles.upcomingCard}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('AgreementDetail', { agreementId: agreement.id })}
            >
              <MaterialCommunityIcons name="calendar-clock" size={20} color={Colors.warning} />
              <View style={styles.upcomingInfo}>
                <Text style={styles.upcomingAgreement}>{agreement.agreement_number}</Text>
                <Text style={styles.upcomingDate}>
                  Return by: {new Date(agreement.rental_end_datetime).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>ACTIVE</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      {/* Recent Activity */}
      {dashboard?.recent_agreements && dashboard.recent_agreements.length > 0 ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              <MaterialCommunityIcons name="history" size={18} color={Colors.primary} /> Recent Activity
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('MyRentals')}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          {dashboard.recent_agreements.map((agreement) => (
            <AgreementCard
              key={agreement.id}
              agreement={agreement}
              onPress={() => navigation.navigate('AgreementDetail', { agreementId: agreement.id })}
            />
          ))}
        </View>
      ) : null}

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          <MaterialCommunityIcons name="lightning-bolt" size={18} color={Colors.primary} /> Quick Actions
        </Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action, i) => (
            <TouchableOpacity
              key={i}
              style={styles.actionCard}
              activeOpacity={0.8}
              onPress={() => navigation.navigate(action.screen as any)}
            >
              <View style={[styles.actionIconWrap, { backgroundColor: action.color + '20' }]}>
                <MaterialCommunityIcons name={action.icon as any} size={24} color={action.color} />
              </View>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} activeOpacity={0.8} onPress={logout}>
        <Ionicons name="log-out-outline" size={18} color={Colors.error} />
        <Text style={styles.logoutText}> Sign Out</Text>
      </TouchableOpacity>

      <View style={{ height: Spacing.xxl }} />
    </ScrollView>
  );
};

const AgreementCard: React.FC<{ agreement: Agreement; onPress: () => void }> = ({ agreement, onPress }) => {
  const statusColor = {
    DRAFT: Colors.statusDraft,
    ACTIVE: Colors.statusActive,
    CLOSED: Colors.statusClosed,
  }[agreement.status] || Colors.textLight;

  return (
    <TouchableOpacity style={styles.agreementCard} activeOpacity={0.8} onPress={onPress}>
      <View style={[styles.agreementIcon, { backgroundColor: statusColor + '20' }]}>
        <MaterialCommunityIcons
          name={agreement.status === 'ACTIVE' ? 'car' : agreement.status === 'DRAFT' ? 'file-edit' : 'check-circle'}
          size={18}
          color={statusColor}
        />
      </View>
      <View style={styles.agreementCardLeft}>
        <Text style={styles.agreementNumber}>{agreement.agreement_number}</Text>
        <Text style={styles.agreementDate}>
          {new Date(agreement.rental_start_datetime).toLocaleDateString()} - {new Date(agreement.rental_end_datetime).toLocaleDateString()}
        </Text>
        <Text style={styles.agreementAmount}>
          AED {agreement.actual_amount || agreement.estimated_amount}
        </Text>
      </View>
      <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
    marginRight: Spacing.md,
    ...Shadow3D.goldGlow,
  },
  avatarText: { ...Typography.body, color: Colors.textDark, fontWeight: '700' },
  greeting: { ...Typography.bodySmall, color: Colors.textSecondary },
  userName: { ...Typography.h3, color: Colors.textGold },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  notificationButton: { position: 'relative', padding: Spacing.sm },
  badge: {
    position: 'absolute', top: 2, right: 0,
    backgroundColor: Colors.error, borderRadius: 8,
    minWidth: 16, height: 16,
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4,
  },
  badgeText: { color: Colors.textWhite, fontSize: 10, fontWeight: '700' },
  profileButton: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.primary,
  },
  profileButtonText: { ...Typography.bodySmall, color: Colors.primary, fontWeight: '700' },

  errorContainer: {
    flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap',
    margin: Spacing.xl, padding: Spacing.lg,
    backgroundColor: Colors.error + '15',
    borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.error + '30',
  },
  errorText: { ...Typography.bodySmall, color: Colors.error },
  retryText: { ...Typography.bodySmall, color: Colors.primary, marginTop: Spacing.sm, width: '100%' },

  cardsRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.lg, gap: Spacing.sm,
  },
  card: {
    flex: 1, padding: Spacing.md,
    borderRadius: BorderRadius.lg, alignItems: 'center',
    backgroundColor: Colors.card,
    borderWidth: 1, borderColor: Colors.border,
    ...Shadow3D.card,
  },
  cardIconWrap: {
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  cardValue: { ...Typography.h3, color: Colors.text, marginBottom: Spacing.xs },
  cardLabel: { ...Typography.caption, color: Colors.textSecondary, textAlign: 'center' },

  section: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: { ...Typography.h3, color: Colors.text, marginBottom: Spacing.md },
  seeAll: { ...Typography.bodySmall, color: Colors.primary, fontWeight: '700' },

  upcomingCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.card, padding: Spacing.lg,
    borderRadius: BorderRadius.lg, marginBottom: Spacing.sm,
    borderLeftWidth: 4, borderLeftColor: Colors.warning,
    borderWidth: 1, borderColor: Colors.border,
    ...Shadow3D.cardLight,
  },
  upcomingInfo: { flex: 1, marginLeft: Spacing.md },
  upcomingAgreement: { ...Typography.body, color: Colors.textGold, fontWeight: '700' },
  upcomingDate: { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: Spacing.xs },
  statusBadge: {
    backgroundColor: Colors.statusActive + '20',
    paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.round, borderWidth: 1, borderColor: Colors.statusActive,
  },
  statusText: { ...Typography.caption, color: Colors.statusActive, fontWeight: '700' },

  agreementCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.card, padding: Spacing.lg,
    borderRadius: BorderRadius.lg, marginBottom: Spacing.sm,
    borderWidth: 1, borderColor: Colors.border,
    ...Shadow3D.cardLight,
  },
  agreementIcon: {
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
    marginRight: Spacing.md,
  },
  agreementCardLeft: { flex: 1 },
  agreementNumber: { ...Typography.body, color: Colors.textGold, fontWeight: '700' },
  agreementDate: { ...Typography.caption, color: Colors.textSecondary, marginTop: Spacing.xs },
  agreementAmount: { ...Typography.bodySmall, color: Colors.primary, marginTop: Spacing.xs, fontWeight: '700' },
  statusDot: { width: 10, height: 10, borderRadius: 5 },

  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  actionCard: {
    width: '30%', alignItems: 'center',
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.card,
    borderWidth: 1, borderColor: Colors.border,
    ...Shadow3D.cardLight,
  },
  actionIconWrap: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  actionLabel: { ...Typography.caption, color: Colors.textSecondary, fontWeight: '600' },

  logoutButton: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    marginHorizontal: Spacing.lg, padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.error + '50',
    backgroundColor: Colors.error + '10',
  },
  logoutText: { ...Typography.body, color: Colors.error, fontWeight: '700' },
});

export default CustomerDashboardScreen;
