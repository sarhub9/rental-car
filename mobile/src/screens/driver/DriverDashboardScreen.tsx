import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  FlatList, RefreshControl, ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import driverTaskApiService from '../../services/driver-task-api.service';
import TaskCard from '../../components/TaskCard';
import { useAuth } from '../../hooks/useAuth';
import { Colors, Spacing, Typography, BorderRadius, Shadow3D } from '../../theme';

const DriverDashboardScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({ completed_today: 0, pending: 0, in_progress: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchTasks = useCallback(async () => {
    try {
      const response = await driverTaskApiService.listTasks({ date });
      setTasks(response.data || []);
      if (response.stats) setStats(response.stats);
    } catch (error: any) {
      console.error('Failed to fetch tasks:', error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [date]);

  useEffect(() => { setLoading(true); fetchTasks(); }, [fetchTasks]);

  const onRefresh = useCallback(() => { setRefreshing(true); fetchTasks(); }, [fetchTasks]);

  const handleTaskPress = (task) => {
    const isActionable = task.status === 'ASSIGNED' || task.status === 'IN_PROGRESS';
    if (isActionable && task.task_type === 'DELIVERY') navigation.navigate('Delivery', { taskId: task.id });
    else if (isActionable && task.task_type === 'PICKUP') navigation.navigate('Pickup', { taskId: task.id });
    else if (isActionable && task.task_type === 'RECOVERY') navigation.navigate('Recovery', { taskId: task.id });
    else navigation.navigate('TaskDetail', { taskId: task.id });
  };

  const renderTaskCard = ({ item }) => (
    <TaskCard task={item} onPress={() => handleTaskPress(item)} />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="clipboard-check-outline" size={48} color={Colors.textLight} />
      <Text style={styles.emptyText}>No tasks for today</Text>
      <Text style={styles.emptySubtext}>Pull down to refresh</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const statCards = [
    { icon: 'check-circle', value: stats.completed_today, label: 'Completed', color: Colors.success },
    { icon: 'clock-outline', value: stats.pending, label: 'Pending', color: Colors.warning },
    { icon: 'play-circle', value: stats.in_progress, label: 'In Progress', color: Colors.info },
  ];

  return (
    <View style={styles.container}>
      {/* User Bar */}
      <View style={styles.userBar}>
        <View style={styles.userInfo}>
          <View style={styles.avatarWrap}>
            <FontAwesome5 name="truck" size={18} color={Colors.textDark} />
          </View>
          <View>
            <Text style={styles.userBarName}>{user?.full_name || 'Driver'}</Text>
            <Text style={styles.userBarRole}>Driver / Recovery</Text>
          </View>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={18} color={Colors.textDark} />
        </TouchableOpacity>
      </View>

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        {statCards.map((s, i) => (
          <View key={i} style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: s.color + '20' }]}>
              <MaterialCommunityIcons name={s.icon as any} size={22} color={s.color} />
            </View>
            <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <MaterialCommunityIcons name="clipboard-list" size={18} color={Colors.primary} />
          <Text style={styles.sectionTitle}> Today's Tasks</Text>
        </View>
        <View style={styles.taskCountBadge}>
          <Text style={styles.taskCount}>{tasks.length}</Text>
        </View>
      </View>

      {/* Task List */}
      <FlatList
        data={tasks}
        renderItem={renderTaskCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      />

      {/* Bottom Button */}
      <TouchableOpacity
        style={styles.historyBtn}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('TaskHistory')}
      >
        <MaterialCommunityIcons name="history" size={20} color={Colors.textDark} />
        <Text style={styles.historyBtnText}> View History</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },

  userBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  userInfo: { flexDirection: 'row', alignItems: 'center' },
  avatarWrap: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
    marginRight: Spacing.md,
    ...Shadow3D.goldGlow,
  },
  userBarName: { ...Typography.body, fontWeight: '700', color: Colors.text },
  userBarRole: { ...Typography.caption, color: Colors.textGold },
  logoutBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
    ...Shadow3D.button,
  },

  statsBar: {
    flexDirection: 'row', padding: Spacing.lg, gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  statCard: {
    flex: 1, padding: Spacing.md,
    borderRadius: BorderRadius.lg, alignItems: 'center',
    backgroundColor: Colors.card,
    borderWidth: 1, borderColor: Colors.border,
    ...Shadow3D.card,
  },
  statIconWrap: {
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  statValue: { fontSize: 24, fontWeight: '800' },
  statLabel: { ...Typography.caption, color: Colors.textSecondary, marginTop: Spacing.xs },

  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
  },
  sectionTitle: { ...Typography.h3, color: Colors.text },
  taskCountBadge: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.round,
  },
  taskCount: { ...Typography.bodySmall, color: Colors.primary, fontWeight: '700' },

  listContent: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
  emptyContainer: { alignItems: 'center', paddingVertical: Spacing.xxl },
  emptyText: { ...Typography.body, color: Colors.textSecondary, marginTop: Spacing.md },
  emptySubtext: { ...Typography.caption, color: Colors.textLight, marginTop: Spacing.xs },

  historyBtn: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg, marginBottom: Spacing.lg,
    ...Shadow3D.button,
  },
  historyBtnText: { color: Colors.textDark, fontSize: 16, fontWeight: '700' },
});

export default DriverDashboardScreen;
