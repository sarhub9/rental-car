import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { Colors, Spacing, Typography, BorderRadius } from '../../theme';
import { MessageThread, Message, CustomerStackParamList } from '../../types';
import CustomerPortalApiService from '../../services/customer-portal-api.service';
import { useAuth } from '../../hooks/useAuth';

type ChatThreadRouteProp = RouteProp<CustomerStackParamList, 'ChatThread'>;

const ChatThreadScreen: React.FC = () => {
  const route = useRoute<ChatThreadRouteProp>();
  const { user } = useAuth();
  const { threadId } = route.params;

  const [thread, setThread] = useState<MessageThread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [error, setError] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const loadThread = useCallback(async () => {
    try {
      setError('');
      const data = await CustomerPortalApiService.getMessageThread(threadId);
      setThread(data);
      setMessages(data.messages || []);

      // Mark as read
      await CustomerPortalApiService.markThreadAsRead(threadId);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to load thread');
    } finally {
      setLoading(false);
    }
  }, [threadId]);

  useEffect(() => {
    loadThread();
  }, [loadThread]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || sending) return;

    const tempMessage = messageText.trim();
    setMessageText('');
    setSending(true);

    try {
      const newMessage = await CustomerPortalApiService.addMessageToThread(threadId, tempMessage);
      setMessages((prev) => [...prev, newMessage]);

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to send message');
      setMessageText(tempMessage); // Restore message on error
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString();
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isCustomer = item.sender_role === 'RENTAL_CUSTOMER';
    const showDateSeparator =
      index === 0 ||
      formatDate(messages[index - 1].created_at) !== formatDate(item.created_at);

    return (
      <View>
        {showDateSeparator && (
          <View style={styles.dateSeparator}>
            <Text style={styles.dateSeparatorText}>{formatDate(item.created_at)}</Text>
          </View>
        )}
        <View style={[styles.messageRow, isCustomer && styles.messageRowCustomer]}>
          <View style={[styles.messageBubble, isCustomer ? styles.messageBubbleCustomer : styles.messageBubbleSupport]}>
            {!isCustomer && (
              <Text style={styles.senderName}>{item.sender_name || 'Support'}</Text>
            )}
            <Text style={[styles.messageText, isCustomer && styles.messageTextCustomer]}>
              {item.message_text}
            </Text>
            <Text style={[styles.messageTime, isCustomer && styles.messageTimeCustomer]}>
              {formatTime(item.created_at)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!thread) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Thread not found</Text>
      </View>
    );
  }

  const isClosed = thread.status === 'CLOSED';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Thread header */}
      <View style={styles.threadHeader}>
        <Text style={styles.threadSubject} numberOfLines={1}>
          {thread.subject}
        </Text>
        {isClosed && (
          <View style={styles.closedBadge}>
            <Text style={styles.closedBadgeText}>CLOSED</Text>
          </View>
        )}
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{error}</Text>
        </View>
      ) : null}

      {/* Messages list */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No messages yet</Text>
          </View>
        }
      />

      {/* Input bar */}
      {!isClosed ? (
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor={Colors.textSecondary}
            value={messageText}
            onChangeText={setMessageText}
            multiline
            maxLength={1000}
            editable={!sending}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!messageText.trim() || sending) && styles.sendButtonDisabled]}
            onPress={handleSendMessage}
            disabled={!messageText.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color={Colors.textWhite} />
            ) : (
              <Text style={styles.sendButtonText}>Send</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.closedNotice}>
          <Text style={styles.closedNoticeText}>This conversation has been closed</Text>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  threadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  threadSubject: { ...Typography.body, color: Colors.text, fontWeight: '600', flex: 1 },
  closedBadge: {
    backgroundColor: Colors.textSecondary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginLeft: Spacing.sm,
  },
  closedBadgeText: { ...Typography.caption, color: Colors.textWhite, fontSize: 10, fontWeight: '600' },
  errorBanner: {
    backgroundColor: '#FFF3F0',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.error,
  },
  errorBannerText: { ...Typography.bodySmall, color: Colors.error },
  messagesList: { paddingVertical: Spacing.lg },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  dateSeparatorText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    backgroundColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  messageRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  messageRowCustomer: { justifyContent: 'flex-end' },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  messageBubbleSupport: {
    backgroundColor: '#F0F0F0',
    borderBottomLeftRadius: 4,
  },
  messageBubbleCustomer: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  senderName: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginBottom: 2,
  },
  messageText: { ...Typography.body, color: Colors.text },
  messageTextCustomer: { color: Colors.textWhite },
  messageTime: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 4,
    fontSize: 10,
  },
  messageTimeCustomer: { color: 'rgba(255, 255, 255, 0.7)' },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyText: { ...Typography.bodySmall, color: Colors.textSecondary },
  errorText: { ...Typography.body, color: Colors.error },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  input: {
    flex: 1,
    ...Typography.body,
    color: Colors.text,
    backgroundColor: '#F5F5F5',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    maxHeight: 100,
    marginRight: Spacing.sm,
  },
  sendButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 70,
  },
  sendButtonDisabled: { backgroundColor: Colors.border },
  sendButtonText: { ...Typography.body, color: Colors.textWhite, fontWeight: '600' },
  closedNotice: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  closedNoticeText: { ...Typography.bodySmall, color: Colors.textSecondary },
});

export default ChatThreadScreen;
