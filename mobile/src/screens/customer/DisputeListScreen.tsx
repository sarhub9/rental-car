import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Spacing, Typography, BorderRadius } from '../../theme';
import { CustomerStackParamList, Dispute, DisputeStatus } from '../../types';
import CustomerPortalApiService from '../../services/customer-portal-api.service';

type NavProp = NativeStackNavigationProp<CustomerStackParamList>;

const STATUS_COLORS: Record<DisputeStatus, string> = {
  OPEN: Colors.info,
  IN_REVIEW: Colors.warning,
  RESOLVED: Colors.success,
  REJECTED: Colors.error,
};

const DisputeListScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDisputes = useCallback(async () => {
    try {
      const data = await CustomerPortalApiService.getDisputes();
      setDisputes(data || []);
    } catch (err) {
      console.error('Failed to load disputes:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadDisputes(); }, [loadDisputes]);

  const renderDispute = ({ item }: { item: Dispute }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('DisputeDetail', { disputeId: item.id })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.disputeNumber}>{item.dispute_number}</Text>
        <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] }]}>
          <Text style={styles.statusText}>{item.status.replace('_', ' ')}</Text>
        </View>
      </View>
      <Text style={styles.subject}>{item.subject}</Text>
      <Text style={styles.date} numberOfLines={1}>
        {new Date(item.created_at).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={disputes}
        renderItem={renderDispute}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadDisputes(); }} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No Disputes</Text>
            <Text style={styles.emptySubtitle}>You haven't raised any disputes yet.</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: Spacing.xl },
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
    marginBottom: Spacing.sm,
  },
  disputeNumber: { ...Typography.bodySmall, color: Colors.textSecondary },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  statusText: { ...Typography.caption, color: Colors.textWhite, fontWeight: '600' },
  subject: { ...Typography.body, color: Colors.text, fontWeight: '600' },
  date: { ...Typography.caption, color: Colors.textLight, marginTop: Spacing.sm },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  emptyTitle: { ...Typography.h3, color: Colors.textSecondary },
  emptySubtitle: { ...Typography.body, color: Colors.textLight, marginTop: Spacing.sm },
});

export default DisputeListScreen;
