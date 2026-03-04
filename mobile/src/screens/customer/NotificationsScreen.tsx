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
import { Colors, Spacing, Typography, BorderRadius } from '../../theme';
import { Notification } from '../../types';
import CustomerPortalApiService from '../../services/customer-portal-api.service';

const NOTIFICATION_TYPE_COLORS: Record<string, string> = {
  RENTAL_STATUS: '#E3F2FD',
  PAYMENT_DUE: '#FFF3E0',
  DISPUTE_UPDATE: '#FCE4EC',
  GENERAL: '#E8F5E9',
};

const NotificationsScreen: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadNotifications = useCallback(async () => {
    try {
      setError('');
      const data = await CustomerPortalApiService.getNotifications({ limit: 50 });
      setNotifications(data);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to load notifications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await CustomerPortalApiService.markNotificationAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n)),
      );
    } catch {
      // Silently fail - not critical
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await CustomerPortalApiService.markAllNotificationsAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() })),
      );
    } catch {
      // Silently fail
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const renderNotification = ({ item }: { item: Notification }) => {
    const bgColor = item.is_read ? Colors.surface : '#F5F9FF';
    const typeColor = NOTIFICATION_TYPE_COLORS[item.notification_type] || NOTIFICATION_TYPE_COLORS.GENERAL;

    return (
      <TouchableOpacity
        style={[styles.notificationCard, { backgroundColor: bgColor }]}
        onPress={() => !item.is_read && handleMarkAsRead(item.id)}
        activeOpacity={item.is_read ? 1 : 0.7}
      >
        <View style={styles.notificationRow}>
          {!item.is_read && <View style={styles.unreadDot} />}
          <View style={styles.notificationContent}>
            <View style={styles.notificationHeader}>
              <Text style={[styles.notificationTitle, !item.is_read && styles.unreadTitle]}>
                {item.title}
              </Text>
              <Text style={styles.notificationTime}>{formatTime(item.created_at)}</Text>
            </View>
            <Text style={styles.notificationBody} numberOfLines={2}>
              {item.body}
            </Text>
            <View style={[styles.typeBadge, { backgroundColor: typeColor }]}>
              <Text style={styles.typeText}>
                {item.notification_type.replace(/_/g, ' ')}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header bar with mark all read */}
      {unreadCount > 0 && (
        <View style={styles.headerBar}>
          <Text style={styles.unreadLabel}>{unreadCount} unread</Text>
          <TouchableOpacity onPress={handleMarkAllAsRead}>
            <Text style={styles.markAllText}>Mark all as read</Text>
          </TouchableOpacity>
        </View>
      )}

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={loadNotifications}>
            <Text style={styles.retryText}>Tap to retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderNotification}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={notifications.length === 0 ? styles.emptyContainer : undefined}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No Notifications</Text>
            <Text style={styles.emptySubtitle}>
              You'll receive updates about your rentals, invoices, and disputes here.
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  unreadLabel: { ...Typography.bodySmall, color: Colors.textSecondary },
  markAllText: { ...Typography.bodySmall, color: Colors.primary, fontWeight: '600' },
  errorContainer: {
    margin: Spacing.xl,
    padding: Spacing.lg,
    backgroundColor: '#FFF3F0',
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  errorText: { ...Typography.bodySmall, color: Colors.error },
  retryText: { ...Typography.bodySmall, color: Colors.primary, marginTop: Spacing.sm },
  notificationCard: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginTop: 6,
    marginRight: Spacing.sm,
  },
  notificationContent: { flex: 1 },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  notificationTitle: {
    ...Typography.body,
    color: Colors.text,
    flex: 1,
    marginRight: Spacing.sm,
  },
  unreadTitle: { fontWeight: '600' },
  notificationTime: { ...Typography.caption, color: Colors.textSecondary },
  notificationBody: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  typeText: { ...Typography.caption, color: Colors.text, fontSize: 10 },
  emptyContainer: { flex: 1 },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxl,
  },
  emptyTitle: { ...Typography.h3, color: Colors.text, marginBottom: Spacing.sm },
  emptySubtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});

export default NotificationsScreen;
