import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Spacing, Typography, BorderRadius } from '../../theme';
import { CustomerStackParamList, Agreement, AgreementStatus } from '../../types';
import CustomerPortalApiService from '../../services/customer-portal-api.service';

type NavProp = NativeStackNavigationProp<CustomerStackParamList>;

const STATUS_TABS: { label: string; value: AgreementStatus | 'ALL' }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Closed', value: 'CLOSED' },
];

const MyRentalsScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();

  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<AgreementStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const loadAgreements = useCallback(async () => {
    try {
      const params: Record<string, unknown> = { limit: 50, offset: 0 };
      if (activeTab !== 'ALL') params.status = activeTab;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const result = await CustomerPortalApiService.getMyAgreements(params as any);
      setAgreements(result.data || []);
    } catch (err) {
      console.error('Failed to load agreements:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, searchQuery]);

  useEffect(() => {
    loadAgreements();
  }, [loadAgreements]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadAgreements();
  }, [loadAgreements]);

  const statusColor = (status: AgreementStatus) => ({
    DRAFT: Colors.statusDraft,
    ACTIVE: Colors.statusActive,
    CLOSED: Colors.statusClosed,
  }[status]);

  const renderAgreement = ({ item }: { item: Agreement }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('AgreementDetail', { agreementId: item.id })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.agreementNumber}>{item.agreement_number}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.row}>
          <Text style={styles.label}>Period</Text>
          <Text style={styles.value}>
            {new Date(item.rental_start_datetime).toLocaleDateString()} -{' '}
            {new Date(item.rental_end_datetime).toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Amount</Text>
          <Text style={styles.valueHighlight}>
            AED {Number(item.actual_amount || item.estimated_amount || 0).toFixed(2)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No Rentals Found</Text>
      <Text style={styles.emptySubtitle}>
        {activeTab === 'ALL'
          ? 'You don\'t have any rental agreements yet.'
          : `No ${activeTab.toLowerCase()} rentals found.`}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by agreement number..."
          placeholderTextColor={Colors.textLight}
          returnKeyType="search"
          onSubmitEditing={loadAgreements}
        />
      </View>

      {/* Status Tabs */}
      <View style={styles.tabs}>
        {STATUS_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.value}
            style={[styles.tab, activeTab === tab.value && styles.tabActive]}
            onPress={() => setActiveTab(tab.value)}
          >
            <Text style={[styles.tabText, activeTab === tab.value && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={agreements}
          renderItem={renderAgreement}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={renderEmpty}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  searchContainer: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg },
  searchInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    ...Typography.body,
    color: Colors.text,
    backgroundColor: Colors.background,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  tab: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tabText: { ...Typography.bodySmall, color: Colors.textSecondary },
  tabTextActive: { color: Colors.textWhite, fontWeight: '600' },
  list: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xxl },
  card: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  agreementNumber: { ...Typography.body, color: Colors.text, fontWeight: '600' },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  statusText: { ...Typography.caption, color: Colors.textWhite, fontWeight: '600' },
  cardBody: { gap: Spacing.sm },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: { ...Typography.bodySmall, color: Colors.textSecondary },
  value: { ...Typography.bodySmall, color: Colors.text },
  valueHighlight: { ...Typography.body, color: Colors.primary, fontWeight: '600' },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyTitle: { ...Typography.h3, color: Colors.textSecondary, marginBottom: Spacing.sm },
  emptySubtitle: { ...Typography.body, color: Colors.textLight, textAlign: 'center' },
});

export default MyRentalsScreen;
