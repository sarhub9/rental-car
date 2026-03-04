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
import { MessageThread, CustomerStackParamList } from '../../types';
import CustomerPortalApiService from '../../services/customer-portal-api.service';

type NavProp = NativeStackNavigationProp<CustomerStackParamList, 'Messages'>;

const MessagesScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadThreads = useCallback(async () => {
    try {
      setError('');
      const data = await CustomerPortalApiService.getMessageThreads({ limit: 50 });
      setThreads(data);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to load messages');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadThreads();
  }, [loadThreads]);

  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
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

  const renderThread = ({ item }: { item: MessageThread }) => {
    const hasUnread = (item.unread_count || 0) > 0;
    const statusColor = item.status === 'OPEN' ? Colors.success : Colors.textSecondary;

    return (
      <TouchableOpacity
        style={[styles.threadCard, hasUnread && styles.threadCardUnread]}
        onPress={() => navigation.navigate('ChatThread', { threadId: item.id })}
      >
        <View style={styles.threadHeader}>
          <Text style={[styles.threadSubject, hasUnread && styles.unreadText]} numberOfLines={1}>
            {item.subject}
          </Text>
          <Text style={styles.threadTime}>{formatTime(item.last_message_at || item.created_at)}</Text>
        </View>
        <View style={styles.threadFooter}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
          {hasUnread && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{item.unread_count}</Text>
            </View>
          )}
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
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={loadThreads}>
            <Text style={styles.retryText}>Tap to retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <FlatList
        data={threads}
        keyExtractor={(item) => item.id}
        renderItem={renderThread}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={threads.length === 0 ? styles.emptyContainer : undefined}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No Messages</Text>
            <Text style={styles.emptySubtitle}>
              Start a conversation with support by tapping the button below.
            </Text>
            <TouchableOpacity
              style={styles.newThreadButton}
              onPress={() => {
                // Navigate to create thread (could be a modal or separate screen)
                // For now, we'll handle this in ChatThread screen with a "New Message" button
              }}
            >
              <Text style={styles.newThreadButtonText}>New Message</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorContainer: {
    margin: Spacing.xl,
    padding: Spacing.lg,
    backgroundColor: '#FFF3F0',
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  errorText: { ...Typography.bodySmall, color: Colors.error },
  retryText: { ...Typography.bodySmall, color: Colors.primary, marginTop: Spacing.sm },
  threadCard: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  threadCardUnread: { backgroundColor: '#F5F9FF' },
  threadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  threadSubject: { ...Typography.body, color: Colors.text, flex: 1, marginRight: Spacing.sm },
  unreadText: { fontWeight: '600' },
  threadTime: { ...Typography.caption, color: Colors.textSecondary },
  threadFooter: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  statusText: { ...Typography.caption, color: Colors.textWhite, fontSize: 10, fontWeight: '600' },
  unreadBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeText: { ...Typography.caption, color: Colors.textWhite, fontSize: 11, fontWeight: '700' },
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
    marginBottom: Spacing.xl,
  },
  newThreadButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  newThreadButtonText: { ...Typography.body, color: Colors.textWhite, fontWeight: '600' },
});

export default MessagesScreen;
