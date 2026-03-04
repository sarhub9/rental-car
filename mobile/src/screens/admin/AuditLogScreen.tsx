import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '../../theme';
import AdminApiService from '../../services/admin-api.service';

const EVENT_TYPES = ['ALL', 'CREATED', 'ACTIVATED', 'CLOSED', 'UPDATE_ATTEMPTED'];

const AuditLogScreen: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [eventFilter, setEventFilter] = useState('ALL');

  const loadLogs = useCallback(async () => {
    try {
      const filters: any = { limit: 50 };
      if (eventFilter !== 'ALL') filters.event_type = eventFilter;
      const result = await AdminApiService.getAuditLogs(filters);
      setLogs(result);
    } catch (err) {
      console.error('Load audit logs error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [eventFilter]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadLogs();
  }, [loadLogs]);

  const getEventColor = (type: string) => {
    switch (type) {
      case 'CREATED': return Colors.info;
      case 'ACTIVATED': return Colors.success;
      case 'CLOSED': return Colors.textLight;
      case 'UPDATE_ATTEMPTED': return Colors.warning;
      default: return Colors.primary;
    }
  };

  const renderLog = ({ item }: { item: any }) => (
    <View style={styles.logCard}>
      <View style={styles.logHeader}>
        <View style={[styles.eventBadge, { backgroundColor: getEventColor(item.event_type) }]}>
          <Text style={styles.eventBadgeText}>{item.event_type}</Text>
        </View>
        <Text style={styles.logTime}>
          {new Date(item.event_timestamp).toLocaleString()}
        </Text>
      </View>
      <Text style={styles.logDesc}>{item.event_description}</Text>
      {item.user_name && (
        <Text style={styles.logUser}>By: {item.user_name}</Text>
      )}
      {item.old_status && item.new_status && (
        <Text style={styles.logStatus}>
          {item.old_status} → {item.new_status}
        </Text>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Event type filter */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={EVENT_TYPES}
        keyExtractor={(item) => item}
        style={styles.filterBar}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.filterBtn, eventFilter === item && styles.filterBtnActive]}
            onPress={() => setEventFilter(item)}
          >
            <Text style={[styles.filterText, eventFilter === item && styles.filterTextActive]}>
              {item === 'ALL' ? 'All' : item}
            </Text>
          </TouchableOpacity>
        )}
      />

      <FlatList
        data={logs}
        keyExtractor={(item) => item.id}
        renderItem={renderLog}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No audit logs found</Text>
        }
        contentContainerStyle={logs.length === 0 ? styles.emptyContainer : undefined}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  filterBar: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, maxHeight: 52 },
  filterBtn: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.round, marginRight: Spacing.sm,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
  },
  filterBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { ...Typography.caption, color: Colors.textSecondary },
  filterTextActive: { color: Colors.textWhite },
  logCard: {
    padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  logHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  eventBadge: { borderRadius: BorderRadius.sm, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  eventBadgeText: { ...Typography.caption, color: Colors.textWhite, fontWeight: '600' },
  logTime: { ...Typography.caption, color: Colors.textLight },
  logDesc: { ...Typography.body, color: Colors.text },
  logUser: { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: Spacing.xs },
  logStatus: { ...Typography.caption, color: Colors.primary, marginTop: Spacing.xs },
  emptyText: { ...Typography.body, color: Colors.textLight, textAlign: 'center', paddingVertical: Spacing.xl },
  emptyContainer: { flex: 1, justifyContent: 'center' },
});

export default AuditLogScreen;
