import React, { useEffect, useState, useCallback } from 'react';
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
import { CustomerStackParamList, Dispute, DisputeMessage } from '../../types';
import CustomerPortalApiService from '../../services/customer-portal-api.service';

type RouteType = RouteProp<CustomerStackParamList, 'DisputeDetail'>;

const DisputeDetailScreen: React.FC = () => {
  const route = useRoute<RouteType>();
  const { disputeId } = route.params;

  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const loadDispute = useCallback(async () => {
    try {
      const data = await CustomerPortalApiService.getDisputeDetail(disputeId);
      setDispute(data);
    } catch (err) {
      console.error('Failed to load dispute:', err);
    } finally {
      setLoading(false);
    }
  }, [disputeId]);

  useEffect(() => { loadDispute(); }, [loadDispute]);

  const handleSend = async () => {
    if (!message.trim() || sending) return;
    setSending(true);
    try {
      await CustomerPortalApiService.addDisputeMessage(disputeId, message.trim());
      setMessage('');
      loadDispute(); // Refresh messages
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: DisputeMessage }) => {
    const isCustomer = item.sender_role === 'RENTAL_CUSTOMER';
    return (
      <View style={[styles.bubble, isCustomer ? styles.bubbleRight : styles.bubbleLeft]}>
        <Text style={styles.senderRole}>
          {isCustomer ? 'You' : item.sender_role.replace('_', ' ')}
        </Text>
        <Text style={styles.messageText}>{item.message}</Text>
        <Text style={styles.messageTime}>
          {new Date(item.created_at).toLocaleString()}
        </Text>
      </View>
    );
  };

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }

  if (!dispute) {
    return <View style={styles.centered}><Text>Dispute not found</Text></View>;
  }

  const isClosed = ['RESOLVED', 'REJECTED'].includes(dispute.status);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.subject}>{dispute.subject}</Text>
        <Text style={styles.status}>{dispute.status.replace('_', ' ')}</Text>
      </View>

      {/* Messages */}
      <FlatList
        data={dispute.messages || []}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
      />

      {/* Input (if not closed) */}
      {!isClosed ? (
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={message}
            onChangeText={setMessage}
            placeholder="Type a message..."
            placeholderTextColor={Colors.textLight}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendButton, (!message.trim() || sending) && styles.sendDisabled]}
            onPress={handleSend}
            disabled={!message.trim() || sending}
          >
            <Text style={styles.sendText}>Send</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.closedBar}>
          <Text style={styles.closedText}>This dispute has been {dispute.status.toLowerCase()}</Text>
          {dispute.resolution_notes ? (
            <Text style={styles.resolutionNotes}>{dispute.resolution_notes}</Text>
          ) : null}
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: Colors.background,
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  subject: { ...Typography.h3, color: Colors.text },
  status: { ...Typography.caption, color: Colors.primary, marginTop: Spacing.xs },
  messagesList: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  bubble: {
    maxWidth: '80%',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  bubbleRight: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.primary,
  },
  bubbleLeft: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  senderRole: { ...Typography.caption, color: Colors.textLight, marginBottom: Spacing.xs },
  messageText: { ...Typography.body, color: Colors.text },
  messageTime: { ...Typography.caption, color: Colors.textLight, marginTop: Spacing.xs, textAlign: 'right' },
  inputBar: {
    flexDirection: 'row',
    padding: Spacing.md,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    ...Typography.body,
    color: Colors.text,
    maxHeight: 100,
    marginRight: Spacing.sm,
  },
  sendButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  sendDisabled: { opacity: 0.5 },
  sendText: { ...Typography.bodySmall, color: Colors.textWhite, fontWeight: '600' },
  closedBar: {
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    alignItems: 'center',
  },
  closedText: { ...Typography.bodySmall, color: Colors.textSecondary },
  resolutionNotes: { ...Typography.bodySmall, color: Colors.text, marginTop: Spacing.sm, fontStyle: 'italic' },
});

export default DisputeDetailScreen;
