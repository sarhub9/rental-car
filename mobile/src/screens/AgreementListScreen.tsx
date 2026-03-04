import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useAgreementLifecycle } from '../hooks/useAgreementLifecycle';
import { useAuth } from '../hooks/useAuth';
import { Colors, Spacing, Typography, BorderRadius, Shadow3D } from '../theme';
import type { Agreement, AgreementStatus } from '../types';

const STATUS_TABS: { label: string; value: AgreementStatus | 'ALL'; icon: string }[] = [
  { label: 'All', value: 'ALL', icon: 'view-grid' },
  { label: 'Draft', value: 'DRAFT', icon: 'file-edit-outline' },
  { label: 'Active', value: 'ACTIVE', icon: 'check-circle-outline' },
  { label: 'Closed', value: 'CLOSED', icon: 'lock-outline' },
];

const getStatusColor = (status: AgreementStatus) => {
  switch (status) {
    case 'DRAFT': return Colors.fdSecondary;
    case 'ACTIVE': return Colors.fdPrimary;
    case 'CLOSED': return Colors.fdSecondary;
    default: return Colors.text;
  }
};

const getStatusIcon = (status: AgreementStatus) => {
  switch (status) {
    case 'DRAFT': return 'file-edit-outline';
    case 'ACTIVE': return 'check-circle';
    case 'CLOSED': return 'lock';
    default: return 'help-circle';
  }
};

const AgreementListScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const { listAgreements, loading, error } = useAgreementLifecycle();
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<AgreementStatus | 'ALL'>('ALL');
  const [refreshing, setRefreshing] = useState(false);

  const loadAgreements = useCallback(async () => {
    try {
      const filters: Record<string, string | number> = { limit: 50 };
      if (activeTab !== 'ALL') filters.status = activeTab;
      const result = await listAgreements(filters);
      setAgreements(result || []);
    } catch {
      // error handled by hook
    }
  }, [activeTab, listAgreements]);

  useEffect(() => { loadAgreements(); }, [loadAgreements]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', loadAgreements);
    return unsubscribe;
  }, [navigation, loadAgreements]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAgreements();
    setRefreshing(false);
  }, [loadAgreements]);

  const filteredAgreements = searchQuery
    ? agreements.filter((a) =>
        a.agreement_number?.toLowerCase().includes(searchQuery.toLowerCase()))
    : agreements;

  const renderAgreementCard = ({ item }: { item: Agreement }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => navigation.navigate('AgreementView', { agreementId: item.id })}
    >
      <View style={styles.cardInner}>
        <View style={[styles.cardIconWrap, { borderColor: getStatusColor(item.status) + '40' }]}>
          <MaterialCommunityIcons
            name={getStatusIcon(item.status) as any}
            size={28}
            color={getStatusColor(item.status)}
          />
        </View>
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.agreementNumber}>{item.agreement_number}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15', borderColor: getStatusColor(item.status) }]}>
              <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
            </View>
          </View>
          <View style={styles.cardBody}>
            <View style={styles.dateRow}>
              <Ionicons name="calendar-outline" size={14} color={Colors.fdSecondary} />
              <Text style={styles.cardDetail}>
                {' '}{new Date(item.rental_start_datetime).toLocaleDateString()} - {new Date(item.rental_end_datetime).toLocaleDateString()}
              </Text>
            </View>
            <Text style={styles.cardAmount}>
              AED {Number(item.actual_amount || item.estimated_amount || 0).toFixed(2)}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={Colors.fdSecondary} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* User Info Bar */}
      <View style={styles.userBar}>
        <View style={styles.userInfo}>
          <View style={styles.avatarWrap}>
            <FontAwesome5 name="user-tie" size={20} color={Colors.textDark} />
          </View>
          <View>
            <Text style={styles.userName}>{user?.full_name || 'Front Desk'}</Text>
            <Text style={styles.userRole}>{user?.role?.replace('_', ' ')}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={18} color={Colors.textDark} />
          <Text style={styles.logoutText}> Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={20} color={Colors.fdPrimary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by agreement number..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={Colors.fdSecondary}
        />
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {STATUS_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.value}
            style={[styles.tab, activeTab === tab.value && styles.activeTab]}
            onPress={() => setActiveTab(tab.value)}
          >
            <MaterialCommunityIcons
              name={tab.icon as any}
              size={18}
              color={activeTab === tab.value ? Colors.fdPrimary : Colors.fdSecondary}
            />
            <Text style={[styles.tabText, activeTab === tab.value && styles.activeTabText]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {error && (
        <View style={styles.errorWrap}>
          <Ionicons name="alert-circle" size={18} color={Colors.error} />
          <Text style={styles.error}> {error}</Text>
        </View>
      )}

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color={Colors.fdPrimary} style={styles.loader} />
      ) : (
        <FlatList
          data={filteredAgreements}
          renderItem={renderAgreementCard}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.fdPrimary} />}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <MaterialCommunityIcons name="file-document-outline" size={48} color={Colors.fdSecondary} />
              <Text style={styles.emptyText}>No agreements found</Text>
            </View>
          }
          contentContainerStyle={filteredAgreements.length === 0 && styles.emptyContainer}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('AgreementCreate')}
      >
        <Ionicons name="add" size={30} color={Colors.textDark} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.fdBackground },
  userBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.fdPrimary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.fdPrimaryDark,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userInfo: { flexDirection: 'row', alignItems: 'center' },
  avatarWrap: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center', alignItems: 'center',
    marginRight: Spacing.md,
  },
  userName: { ...Typography.body, fontWeight: '700', color: Colors.textDark },
  userRole: { ...Typography.caption, color: Colors.fdPrimaryLight, textTransform: 'capitalize' },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  logoutText: { ...Typography.bodySmall, color: Colors.textDark, fontWeight: '600' },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: Spacing.lg,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.fdPrimary + '30',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  searchIcon: { marginLeft: Spacing.md },
  searchInput: {
    flex: 1,
    padding: Spacing.md,
    fontSize: 16,
    color: Colors.text,
  },

  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  activeTab: { borderBottomColor: Colors.fdPrimary },
  tabText: { ...Typography.caption, color: Colors.fdSecondary },
  activeTabText: { color: Colors.fdPrimary, fontWeight: '700' },

  card: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.fdPrimary + '20',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  cardIconWrap: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.fdBackground,
    justifyContent: 'center', alignItems: 'center',
    marginRight: Spacing.md,
    borderWidth: 1,
  },
  cardContent: { flex: 1 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  agreementNumber: { ...Typography.body, color: Colors.fdPrimaryDark, fontWeight: '700' },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
  },
  statusText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateRow: { flexDirection: 'row', alignItems: 'center' },
  cardDetail: { ...Typography.caption, color: Colors.fdSecondary },
  cardAmount: { ...Typography.caption, fontWeight: '700', color: Colors.fdPrimaryDark },

  errorWrap: {
    flexDirection: 'row', alignItems: 'center',
    margin: Spacing.lg,
    padding: Spacing.md,
    backgroundColor: Colors.error + '10',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.error + '30',
  },
  error: { ...Typography.bodySmall, color: Colors.error },
  loader: { marginTop: 40 },

  emptyWrap: { alignItems: 'center', paddingTop: 60 },
  emptyText: {
    textAlign: 'center',
    color: Colors.fdSecondary,
    marginTop: Spacing.md,
    fontSize: 16,
  },
  emptyContainer: { flex: 1, justifyContent: 'center' },

  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.fdPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.fdPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
});

export default AgreementListScreen;
