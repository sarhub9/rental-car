import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '../theme';

/**
 * TaskCard Component
 * Displays a task summary card with type, priority, vehicle, and status info
 */
const TaskCard = ({ task, onPress }) => {
  const getTypeColor = (type) => {
    switch (type) {
      case 'DELIVERY':
        return Colors.info;
      case 'PICKUP':
        return Colors.success;
      case 'RECOVERY':
        return Colors.error;
      default:
        return Colors.textSecondary;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'URGENT':
        return Colors.warning;
      case 'CRITICAL':
        return Colors.error;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ASSIGNED':
        return Colors.statusDraft;
      case 'IN_PROGRESS':
        return Colors.info;
      case 'COMPLETED':
        return Colors.success;
      case 'CANCELLED':
        return Colors.statusClosed;
      default:
        return Colors.textSecondary;
    }
  };

  const formatScheduledTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const typeColor = getTypeColor(task.task_type);
  const priorityColor = getPriorityColor(task.priority);
  const statusColor = getStatusColor(task.status);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.topRow}>
        <View style={[styles.badge, { backgroundColor: typeColor }]}>
          <Text style={styles.badgeText}>{task.task_type}</Text>
        </View>
        {priorityColor && (
          <View style={[styles.badge, { backgroundColor: priorityColor }]}>
            <Text style={styles.badgeText}>{task.priority}</Text>
          </View>
        )}
      </View>

      <Text style={styles.plateNumber}>{task.plate_number}</Text>
      <Text style={styles.customerName}>{task.customer_name}</Text>
      <Text style={styles.address} numberOfLines={1}>{task.destination_address}</Text>
      <Text style={styles.scheduledTime}>{formatScheduledTime(task.scheduled_at)}</Text>

      <View style={styles.bottomRow}>
        <View style={styles.spacer} />
        <View style={[styles.statusChip, { backgroundColor: statusColor }]}>
          <Text style={styles.statusText}>{task.status.replace('_', ' ')}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  topRow: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.sm,
  },
  badgeText: {
    ...Typography.caption,
    color: Colors.textWhite,
    fontWeight: 'bold',
  },
  plateNumber: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  customerName: {
    ...Typography.body,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  address: {
    ...Typography.bodySmall,
    color: Colors.textLight,
    marginBottom: Spacing.sm,
  },
  scheduledTime: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  spacer: {
    flex: 1,
  },
  statusChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.round,
  },
  statusText: {
    ...Typography.caption,
    color: Colors.textWhite,
    fontWeight: '600',
  },
});

export default TaskCard;
