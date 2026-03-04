import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, ScrollView, Alert, ActivityIndicator, Linking,
} from 'react-native';
import driverTaskApiService from '../../services/driver-task-api.service';
import { Colors, Spacing, Typography } from '../../theme';

const TaskDetailScreen = ({ route, navigation }) => {
  const { taskId } = route.params;
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [evidence, setEvidence] = useState({ photos_count: 0 });

  useEffect(() => {
    fetchTask();
  }, []);

  const fetchTask = async () => {
    try {
      const response = await driverTaskApiService.getTask(taskId);
      setTask(response.data || response);

      try {
        const evidenceResponse = await driverTaskApiService.getEvidence(taskId);
        if (evidenceResponse.data) {
          setEvidence(evidenceResponse.data);
        }
      } catch {
        // Evidence may not exist yet
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ASSIGNED':
        return Colors.warning;
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

  const formatDateTime = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleCallCustomer = () => {
    if (task?.customer_phone) {
      Linking.openURL(`tel:${task.customer_phone}`);
    }
  };

  const handleNavigateToAddress = () => {
    if (task?.destination_address) {
      const encoded = encodeURIComponent(task.destination_address);
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encoded}`);
    }
  };

  const getTargetScreen = () => {
    switch (task?.task_type) {
      case 'DELIVERY':
        return 'Delivery';
      case 'PICKUP':
        return 'Pickup';
      case 'RECOVERY':
        return 'Recovery';
      default:
        return null;
    }
  };

  const handleStartTask = async () => {
    try {
      setLoading(true);
      await driverTaskApiService.startTask(taskId);
      const screen = getTargetScreen();
      if (screen) {
        navigation.navigate(screen, { taskId });
      } else {
        await fetchTask();
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
      setLoading(false);
    }
  };

  const handleContinueTask = () => {
    const screen = getTargetScreen();
    if (screen) {
      navigation.navigate(screen, { taskId });
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!task) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Task not found</Text>
      </View>
    );
  }

  const statusColor = getStatusColor(task.status);
  const typeColor = getTypeColor(task.task_type);

  return (
    <ScrollView style={styles.container}>
      {/* Status Badge */}
      <View style={styles.statusRow}>
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Text style={styles.statusBadgeText}>{task.status.replace('_', ' ')}</Text>
        </View>
      </View>

      {/* Task Type + Priority */}
      <View style={styles.typeRow}>
        <View style={[styles.typeBadge, { backgroundColor: typeColor }]}>
          <Text style={styles.typeBadgeText}>{task.task_type}</Text>
        </View>
        {task.priority && task.priority !== 'NORMAL' && (
          <View style={[styles.typeBadge, { backgroundColor: Colors.warning }]}>
            <Text style={styles.typeBadgeText}>{task.priority}</Text>
          </View>
        )}
      </View>

      {/* Vehicle Info Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Vehicle Information</Text>
        <Text style={styles.cardValue}>{task.plate_number}</Text>
        {task.vehicle_make && (
          <Text style={styles.cardDetail}>
            {task.vehicle_make} {task.vehicle_model} {task.vehicle_color ? `- ${task.vehicle_color}` : ''}
          </Text>
        )}
      </View>

      {/* Customer Info Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Customer Information</Text>
        <Text style={styles.cardValue}>{task.customer_name}</Text>
        {task.customer_phone && (
          <TouchableOpacity style={styles.actionRow} onPress={handleCallCustomer}>
            <Text style={styles.cardDetail}>{task.customer_phone}</Text>
            <View style={styles.inlineBtn}>
              <Text style={styles.inlineBtnText}>Call</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Address Card */}
      {task.destination_address && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Destination</Text>
          <Text style={styles.cardDetail}>{task.destination_address}</Text>
          <TouchableOpacity style={styles.navigateBtn} onPress={handleNavigateToAddress}>
            <Text style={styles.navigateBtnText}>Navigate</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Schedule Info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Schedule</Text>
        {task.scheduled_at && (
          <View style={styles.scheduleRow}>
            <Text style={styles.scheduleLabel}>Scheduled:</Text>
            <Text style={styles.scheduleValue}>{formatDateTime(task.scheduled_at)}</Text>
          </View>
        )}
        {task.started_at && (
          <View style={styles.scheduleRow}>
            <Text style={styles.scheduleLabel}>Started:</Text>
            <Text style={styles.scheduleValue}>{formatDateTime(task.started_at)}</Text>
          </View>
        )}
        {task.completed_at && (
          <View style={styles.scheduleRow}>
            <Text style={styles.scheduleLabel}>Completed:</Text>
            <Text style={styles.scheduleValue}>{formatDateTime(task.completed_at)}</Text>
          </View>
        )}
      </View>

      {/* Evidence Summary */}
      {(evidence.photos_count > 0 || task.odometer_reading || task.fuel_level) && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Evidence Summary</Text>
          {evidence.photos_count > 0 && (
            <Text style={styles.cardDetail}>Photos: {evidence.photos_count}</Text>
          )}
          {task.odometer_reading && (
            <Text style={styles.cardDetail}>Odometer: {task.odometer_reading} km</Text>
          )}
          {task.fuel_level && (
            <Text style={styles.cardDetail}>Fuel Level: {task.fuel_level}</Text>
          )}
        </View>
      )}

      {/* Admin Notes */}
      {task.admin_notes && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Admin Notes</Text>
          <Text style={styles.cardDetail}>{task.admin_notes}</Text>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionSection}>
        {task.status === 'ASSIGNED' && (
          <TouchableOpacity style={styles.submitBtn} onPress={handleStartTask}>
            <Text style={styles.submitBtnText}>Start Task</Text>
          </TouchableOpacity>
        )}
        {task.status === 'IN_PROGRESS' && (
          <TouchableOpacity style={styles.submitBtn} onPress={handleContinueTask}>
            <Text style={styles.submitBtnText}>Continue</Text>
          </TouchableOpacity>
        )}
        {task.status === 'COMPLETED' && (
          <View style={styles.completionInfo}>
            <Text style={styles.completionText}>Task completed</Text>
            {task.completed_at && (
              <Text style={styles.completionDate}>{formatDateTime(task.completed_at)}</Text>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  errorText: { ...Typography.body, color: Colors.textSecondary },
  statusRow: { padding: Spacing.lg, alignItems: 'flex-start' },
  statusBadge: {
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
    borderRadius: 8,
  },
  statusBadgeText: { color: Colors.textWhite, fontSize: 16, fontWeight: '600' },
  typeRow: {
    flexDirection: 'row', paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg, gap: Spacing.sm,
  },
  typeBadge: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    borderRadius: 8,
  },
  typeBadgeText: { ...Typography.caption, color: Colors.textWhite, fontWeight: 'bold' },
  card: {
    backgroundColor: Colors.surface, borderRadius: 8,
    padding: Spacing.lg, marginHorizontal: Spacing.lg, marginBottom: Spacing.md,
  },
  cardTitle: { ...Typography.label, color: Colors.textSecondary, marginBottom: Spacing.sm },
  cardValue: { ...Typography.h3, color: Colors.text, marginBottom: Spacing.xs },
  cardDetail: { ...Typography.body, color: Colors.text, marginBottom: Spacing.xs },
  actionRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: Spacing.xs,
  },
  inlineBtn: {
    backgroundColor: Colors.primary, borderRadius: 8,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
  },
  inlineBtnText: { color: Colors.textWhite, fontSize: 14, fontWeight: '600' },
  navigateBtn: {
    backgroundColor: Colors.primary, borderRadius: 8,
    padding: Spacing.md, alignItems: 'center', marginTop: Spacing.md,
  },
  navigateBtnText: { color: Colors.textWhite, fontSize: 16, fontWeight: '600' },
  scheduleRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  scheduleLabel: { ...Typography.bodySmall, color: Colors.textSecondary },
  scheduleValue: { ...Typography.bodySmall, color: Colors.text },
  actionSection: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  submitBtn: {
    backgroundColor: Colors.success, borderRadius: 8,
    padding: Spacing.lg, alignItems: 'center',
  },
  submitBtnText: { color: Colors.textWhite, fontSize: 16, fontWeight: '600' },
  completionInfo: {
    padding: Spacing.lg, backgroundColor: Colors.success + '15',
    borderRadius: 8, alignItems: 'center',
  },
  completionText: { ...Typography.body, color: Colors.success, fontWeight: '600' },
  completionDate: { ...Typography.bodySmall, color: Colors.success, marginTop: Spacing.xs },
});

export default TaskDetailScreen;
