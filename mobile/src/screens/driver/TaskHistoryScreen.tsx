import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, FlatList, RefreshControl, ActivityIndicator,
} from 'react-native';
import driverTaskApiService from '../../services/driver-task-api.service';
import { Colors, Spacing, Typography } from '../../theme';

const TASK_TYPE_FILTERS = ['All', 'DELIVERY', 'PICKUP', 'RECOVERY'] as const;
const DATE_RANGE_FILTERS = [
  { label: 'Last 7 days', value: '7' },
  { label: 'Last 30 days', value: '30' },
  { label: 'All time', value: 'all' },
] as const;

const TYPE_COLORS: Record<string, string> = {
  DELIVERY: Colors.info,
  PICKUP: Colors.warning,
  RECOVERY: Colors.error,
};

const TaskHistoryScreen = ({ navigation }) => {
  const [tasks, setTasks] = useState<any[]>([]);
  const [performance, setPerformance] = useState({
    today: 0,
    this_week: 0,
    this_month: 0,
    deliveries: 0,
    pickups: 0,
    recoveries: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState({
    type: 'All' as string,
    dateRange: '7' as string,
  });
  const [meta, setMeta] = useState({ page: 1, total: 0, hasMore: true });
  const [loadingMore, setLoadingMore] = useState(false);

  const getDateParams = useCallback(() => {
    const now = new Date();
    if (filters.dateRange === 'all') {
      return {};
    }
    const days = parseInt(filters.dateRange, 10);
    const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return {
      from: from.toISOString().split('T')[0],
      to: now.toISOString().split('T')[0],
    };
  }, [filters.dateRange]);

  const fetchHistory = useCallback(async (page = 1, append = false) => {
    try {
      const dateParams = getDateParams();
      const params: any = {
        ...dateParams,
        page,
        limit: 20,
      };
      if (filters.type !== 'All') {
        params.type = filters.type;
      }

      const response = await driverTaskApiService.getHistory(params);
      const data = response.data || [];
      const responseMeta = response.meta || {};

      if (append) {
        setTasks((prev) => [...prev, ...data]);
      } else {
        setTasks(data);
      }

      if (response.performance) {
        setPerformance(response.performance);
      }

      setMeta({
        page,
        total: responseMeta.total || 0,
        hasMore: data.length === 20,
      });
    } catch (error: any) {
      console.error('Failed to fetch history:', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [filters, getDateParams]);

  useEffect(() => {
    setLoading(true);
    fetchHistory(1, false);
  }, [fetchHistory]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchHistory(1, false);
  }, [fetchHistory]);

  const onEndReached = useCallback(() => {
    if (!meta.hasMore || loadingMore) return;
    setLoadingMore(true);
    fetchHistory(meta.page + 1, true);
  }, [meta, loadingMore, fetchHistory]);

  const handleTaskPress = (task: any) => {
    navigation.navigate('TaskDetail', { taskId: task.id });
  };

  const handleTypeFilter = (type: string) => {
    setFilters((prev) => ({ ...prev, type }));
  };

  const handleDateFilter = (dateRange: string) => {
    setFilters((prev) => ({ ...prev, dateRange }));
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderTaskItem = ({ item }) => (
    <TouchableOpacity style={styles.taskItem} onPress={() => handleTaskPress(item)}>
      <View style={styles.taskItemHeader}>
        <View style={[styles.typeBadge, { backgroundColor: TYPE_COLORS[item.task_type] || Colors.info }]}>
          <Text style={styles.typeBadgeText}>{item.task_type}</Text>
        </View>
        <Text style={styles.taskDate}>
          {item.completed_at ? formatDate(item.completed_at) : 'N/A'}
        </Text>
      </View>
      <Text style={styles.taskPlate}>
        {item.vehicle_plate || item.vehicle?.plate_number || 'No plate'}
      </Text>
      <Text style={styles.taskCustomer}>
        {item.customer_name || item.customer?.name || 'N/A'}
      </Text>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No completed tasks found</Text>
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={Colors.primary} />
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Performance Summary Card */}
      <View style={styles.performanceCard}>
        <View style={styles.metricsRow}>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{performance.today}</Text>
            <Text style={styles.metricLabel}>Today</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{performance.this_week}</Text>
            <Text style={styles.metricLabel}>This Week</Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{performance.this_month}</Text>
            <Text style={styles.metricLabel}>This Month</Text>
          </View>
        </View>
        <View style={styles.breakdownRow}>
          <Text style={[styles.breakdownText, { color: Colors.info }]}>
            Deliveries {performance.deliveries}
          </Text>
          <Text style={styles.breakdownSeparator}>|</Text>
          <Text style={[styles.breakdownText, { color: Colors.warning }]}>
            Pickups {performance.pickups}
          </Text>
          <Text style={styles.breakdownSeparator}>|</Text>
          <Text style={[styles.breakdownText, { color: Colors.error }]}>
            Recoveries {performance.recoveries}
          </Text>
        </View>
      </View>

      {/* Filter Bar */}
      <View style={styles.filterSection}>
        {/* Type filters */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={TASK_TYPE_FILTERS as unknown as string[]}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.filterChips}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filterChip, filters.type === item && styles.filterChipActive]}
              onPress={() => handleTypeFilter(item)}
            >
              <Text style={[
                styles.filterChipText,
                filters.type === item && styles.filterChipTextActive,
              ]}>
                {item === 'All' ? 'All' : item.charAt(0) + item.slice(1).toLowerCase()}
              </Text>
            </TouchableOpacity>
          )}
        />

        {/* Date range filters */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={DATE_RANGE_FILTERS as unknown as Array<{ label: string; value: string }>}
          keyExtractor={(item: any) => item.value}
          contentContainerStyle={styles.filterChips}
          renderItem={({ item }: any) => (
            <TouchableOpacity
              style={[styles.filterChip, filters.dateRange === item.value && styles.filterChipActive]}
              onPress={() => handleDateFilter(item.value)}
            >
              <Text style={[
                styles.filterChipText,
                filters.dateRange === item.value && styles.filterChipTextActive,
              ]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Task List */}
      <FlatList
        data={tasks}
        renderItem={renderTaskItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },

  performanceCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: Spacing.md },
  metricItem: { alignItems: 'center' },
  metricValue: { fontSize: 24, fontWeight: 'bold', color: Colors.primary },
  metricLabel: { ...Typography.caption, color: Colors.textSecondary, marginTop: Spacing.xs },

  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  breakdownText: { ...Typography.bodySmall, fontWeight: '600' },
  breakdownSeparator: { color: Colors.textLight, marginHorizontal: Spacing.md },

  filterSection: {
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterChips: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.xs, gap: Spacing.sm },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    marginRight: Spacing.sm,
  },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterChipText: { ...Typography.bodySmall, color: Colors.textSecondary },
  filterChipTextActive: { color: Colors.textWhite },

  listContent: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },

  taskItem: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: Spacing.lg,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  taskItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  typeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeBadgeText: { ...Typography.caption, color: Colors.textWhite, fontWeight: '600' },
  taskDate: { ...Typography.caption, color: Colors.textLight },
  taskPlate: { ...Typography.body, color: Colors.text, fontWeight: '600' },
  taskCustomer: { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: Spacing.xs },

  emptyContainer: { alignItems: 'center', paddingVertical: Spacing.xxl },
  emptyText: { ...Typography.body, color: Colors.textSecondary },

  footerLoader: { paddingVertical: Spacing.lg, alignItems: 'center' },
});

export default TaskHistoryScreen;
