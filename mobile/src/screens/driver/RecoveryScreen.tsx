import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, TextInput,
  StyleSheet, ScrollView, ActivityIndicator, Alert, Linking,
} from 'react-native';
import driverTaskApiService from '../../services/driver-task-api.service';
import PhotoCapture from '../../components/PhotoCapture';
import FuelLevelPicker from '../../components/FuelLevelPicker';
import SignatureCapture from '../../components/SignatureCapture';
import { usePhotoCapture } from '../../hooks/usePhotoCapture';
import { Colors, Spacing, Typography } from '../../theme';

const ATTEMPT_TYPES = ['PHONE_CALL', 'SMS', 'VISIT'] as const;
const OUTCOMES = [
  'NO_ANSWER',
  'CUSTOMER_COOPERATIVE',
  'CUSTOMER_UNCOOPERATIVE',
  'VEHICLE_FOUND',
  'VEHICLE_NOT_FOUND',
] as const;

const ATTEMPT_TYPE_ICONS: Record<string, string> = {
  PHONE_CALL: 'Phone',
  SMS: 'SMS',
  VISIT: 'Visit',
};

const PHOTO_ANGLES = ['Front', 'Rear', 'Left Side', 'Right Side'];

const RecoveryScreen = ({ route, navigation }) => {
  const { taskId } = route.params;

  const [task, setTask] = useState<any>(null);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAttemptForm, setShowAttemptForm] = useState(false);
  const [attemptData, setAttemptData] = useState({
    attempt_type: '' as string,
    outcome: '' as string,
    notes: '',
  });
  const [showEvidenceCapture, setShowEvidenceCapture] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [odometer, setOdometer] = useState('');
  const [fuelLevel, setFuelLevel] = useState<any>('HALF');
  const [signature, setSignature] = useState<string | null>(null);

  const { photos, capturePhoto, uploadAllPhotos, hasMinimumPhotos, clearPhotos } = usePhotoCapture();

  const fetchData = useCallback(async () => {
    try {
      const [taskRes, attemptsRes] = await Promise.all([
        driverTaskApiService.getTask(taskId),
        driverTaskApiService.getRecoveryAttempts(taskId),
      ]);
      setTask(taskRes.data || taskRes);
      setAttempts(attemptsRes.data || []);
    } catch (error: any) {
      console.error('Failed to fetch recovery data:', error.message);
      Alert.alert('Error', 'Failed to load recovery task details.');
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStartTask = async () => {
    try {
      setSubmitting(true);
      await driverTaskApiService.startTask(taskId);
      await fetchData();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to start task.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitAttempt = async () => {
    if (!attemptData.attempt_type || !attemptData.outcome) {
      Alert.alert('Validation', 'Please select an attempt type and outcome.');
      return;
    }

    try {
      setSubmitting(true);
      const response = await driverTaskApiService.logRecoveryAttempt(taskId, attemptData);

      if (response.escalation_suggested === true) {
        Alert.alert(
          'Escalation Suggested',
          '3+ failed attempts. Consider involving management.',
        );
      }

      setAttemptData({ attempt_type: '', outcome: '', notes: '' });
      setShowAttemptForm(false);
      await fetchData();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to log recovery attempt.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteRecovery = async () => {
    if (!hasMinimumPhotos(4)) {
      Alert.alert('Photos Required', 'Please capture at least 4 photos of the vehicle.');
      return;
    }

    try {
      setSubmitting(true);

      // Upload evidence photos
      const formData = new FormData();
      photos.forEach((photo, index) => {
        formData.append('photos', {
          uri: photo.uri,
          type: 'image/jpeg',
          name: `recovery_${index}.jpg`,
        } as any);
      });
      formData.append('odometer_reading', odometer);
      formData.append('fuel_level', fuelLevel);

      await driverTaskApiService.uploadEvidence(taskId, formData);

      // Upload signature if captured
      if (signature) {
        const sigFormData = new FormData();
        sigFormData.append('signature', {
          uri: signature,
          type: 'image/png',
          name: 'signature.png',
        } as any);
        await driverTaskApiService.uploadSignature(taskId, sigFormData);
      }

      // Complete the task
      await driverTaskApiService.completeTask(taskId, {
        odometer_reading: parseInt(odometer, 10) || 0,
        fuel_level: fuelLevel,
        customer_confirmed: !!signature,
      });

      Alert.alert('Success', 'Vehicle recovery completed.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to complete recovery.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCallCustomer = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const getOverdueDays = () => {
    if (!task?.agreement?.rental_end_datetime) return null;
    const endDate = new Date(task.agreement.rental_end_datetime);
    const now = new Date();
    const diffMs = now.getTime() - endDate.getTime();
    if (diffMs <= 0) return null;
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toUpperCase()) {
      case 'URGENT': return Colors.warning;
      case 'CRITICAL': return Colors.error;
      default: return Colors.info;
    }
  };

  const formatTimestamp = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const vehicleFound = attempts.some((a) => a.outcome === 'VEHICLE_FOUND');

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Recovery Info Card */}
      {task && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recovery Details</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Customer</Text>
            <Text style={styles.infoValue}>{task.customer_name || task.customer?.name || 'N/A'}</Text>
          </View>

          {(task.customer_phone || task.customer?.phone) && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone</Text>
              <TouchableOpacity onPress={() => handleCallCustomer(task.customer_phone || task.customer?.phone)}>
                <Text style={[styles.infoValue, styles.linkText]}>
                  {task.customer_phone || task.customer?.phone}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Address</Text>
            <Text style={styles.infoValue}>{task.address || task.location?.address || 'N/A'}</Text>
          </View>

          {task.priority && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Priority</Text>
              <View style={[styles.badge, { backgroundColor: getPriorityColor(task.priority) }]}>
                <Text style={styles.badgeText}>{task.priority}</Text>
              </View>
            </View>
          )}

          {task.admin_notes && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Admin Notes</Text>
              <Text style={styles.infoValue}>{task.admin_notes}</Text>
            </View>
          )}

          {getOverdueDays() !== null && (
            <View style={[styles.overdueBar]}>
              <Text style={styles.overdueText}>
                Overdue since {getOverdueDays()} day{getOverdueDays()! > 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Recovery Attempts Section */}
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Text style={styles.cardTitle}>Recovery Attempts ({attempts.length})</Text>
          {task?.status === 'IN_PROGRESS' && (
            <TouchableOpacity
              style={styles.smallBtn}
              onPress={() => setShowAttemptForm(true)}
            >
              <Text style={styles.smallBtnText}>Log Attempt</Text>
            </TouchableOpacity>
          )}
        </View>

        {attempts.length === 0 && (
          <Text style={styles.emptyText}>No attempts logged yet.</Text>
        )}

        {attempts.map((attempt, index) => (
          <View key={attempt.id || index} style={styles.attemptItem}>
            <View style={styles.attemptHeader}>
              <View style={styles.attemptTypeBadge}>
                <Text style={styles.attemptTypeText}>
                  {ATTEMPT_TYPE_ICONS[attempt.attempt_type] || attempt.attempt_type}
                </Text>
              </View>
              <Text style={styles.attemptOutcome}>{attempt.outcome?.replace(/_/g, ' ')}</Text>
            </View>
            {attempt.notes && <Text style={styles.attemptNotes}>{attempt.notes}</Text>}
            <Text style={styles.attemptTimestamp}>{formatTimestamp(attempt.created_at)}</Text>
          </View>
        ))}
      </View>

      {/* Attempt Form */}
      {showAttemptForm && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Log Recovery Attempt</Text>

          <Text style={styles.formLabel}>Attempt Type</Text>
          <View style={styles.chipRow}>
            {ATTEMPT_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.chip,
                  attemptData.attempt_type === type && styles.chipActive,
                ]}
                onPress={() => setAttemptData((prev) => ({ ...prev, attempt_type: type }))}
              >
                <Text style={[
                  styles.chipText,
                  attemptData.attempt_type === type && styles.chipTextActive,
                ]}>
                  {type.replace(/_/g, ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.formLabel}>Outcome</Text>
          <View style={styles.chipRow}>
            {OUTCOMES.map((outcome) => (
              <TouchableOpacity
                key={outcome}
                style={[
                  styles.chip,
                  attemptData.outcome === outcome && styles.chipActive,
                ]}
                onPress={() => setAttemptData((prev) => ({ ...prev, outcome }))}
              >
                <Text style={[
                  styles.chipText,
                  attemptData.outcome === outcome && styles.chipTextActive,
                ]}>
                  {outcome.replace(/_/g, ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.formLabel}>Notes</Text>
          <TextInput
            style={styles.textInput}
            value={attemptData.notes}
            onChangeText={(text) => setAttemptData((prev) => ({ ...prev, notes: text }))}
            placeholder="Add notes about this attempt..."
            placeholderTextColor={Colors.textLight}
            multiline
            numberOfLines={3}
          />

          <View style={styles.formButtons}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => {
                setShowAttemptForm(false);
                setAttemptData({ attempt_type: '', outcome: '', notes: '' });
              }}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitBtn, submitting && styles.disabledBtn]}
              onPress={handleSubmitAttempt}
              disabled={submitting}
            >
              <Text style={styles.submitBtnText}>
                {submitting ? 'Submitting...' : 'Submit Attempt'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Vehicle Recovery Section */}
      {vehicleFound && task?.status === 'IN_PROGRESS' && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Vehicle Recovery</Text>

          {!showEvidenceCapture ? (
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => setShowEvidenceCapture(true)}
            >
              <Text style={styles.primaryBtnText}>Begin Vehicle Recovery</Text>
            </TouchableOpacity>
          ) : (
            <View>
              <Text style={styles.formLabel}>Vehicle Photos (minimum 4)</Text>
              {PHOTO_ANGLES.map((angle) => (
                <PhotoCapture
                  key={angle}
                  photoAngle={angle}
                  onPhotoCapture={() => capturePhoto(angle)}
                />
              ))}
              <Text style={styles.photoCount}>
                {photos.length} photo{photos.length !== 1 ? 's' : ''} captured
              </Text>

              <Text style={styles.formLabel}>Odometer Reading</Text>
              <TextInput
                style={styles.textInputSingle}
                value={odometer}
                onChangeText={setOdometer}
                placeholder="Enter odometer reading"
                placeholderTextColor={Colors.textLight}
                keyboardType="numeric"
              />

              <FuelLevelPicker value={fuelLevel} onChange={setFuelLevel} />

              <Text style={styles.formLabel}>Customer Confirmation</Text>
              <SignatureCapture onSignatureCapture={setSignature} />

              <TouchableOpacity
                style={[styles.primaryBtn, { marginTop: Spacing.lg }, submitting && styles.disabledBtn]}
                onPress={handleCompleteRecovery}
                disabled={submitting}
              >
                <Text style={styles.primaryBtnText}>
                  {submitting ? 'Completing...' : 'Complete Recovery'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionSection}>
        {task?.status === 'ASSIGNED' && (
          <TouchableOpacity
            style={[styles.primaryBtn, submitting && styles.disabledBtn]}
            onPress={handleStartTask}
            disabled={submitting}
          >
            <Text style={styles.primaryBtnText}>
              {submitting ? 'Starting...' : 'Start Recovery'}
            </Text>
          </TouchableOpacity>
        )}

        {task?.status === 'IN_PROGRESS' && !showAttemptForm && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.secondaryBtn, { flex: 1, marginRight: Spacing.sm }]}
              onPress={() => setShowAttemptForm(true)}
            >
              <Text style={styles.secondaryBtnText}>Log Attempt</Text>
            </TouchableOpacity>
            {vehicleFound && !showEvidenceCapture && (
              <TouchableOpacity
                style={[styles.primaryBtn, { flex: 1, marginLeft: Spacing.sm }]}
                onPress={() => setShowEvidenceCapture(true)}
              >
                <Text style={styles.primaryBtnText}>Begin Recovery</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  contentContainer: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTitle: { ...Typography.h3, color: Colors.text, marginBottom: Spacing.md },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  infoLabel: { ...Typography.label, color: Colors.textSecondary, flex: 1 },
  infoValue: { ...Typography.body, color: Colors.text, flex: 2, textAlign: 'right' },
  linkText: { color: Colors.primary, textDecorationLine: 'underline' },

  badge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 4,
  },
  badgeText: { ...Typography.caption, color: Colors.textWhite, fontWeight: '600' },

  overdueBar: {
    backgroundColor: Colors.error,
    borderRadius: 4,
    padding: Spacing.sm,
    marginTop: Spacing.md,
    alignItems: 'center',
  },
  overdueText: { ...Typography.bodySmall, color: Colors.textWhite, fontWeight: '600' },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },

  smallBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 4,
  },
  smallBtnText: { ...Typography.caption, color: Colors.textWhite, fontWeight: '600' },

  emptyText: { ...Typography.body, color: Colors.textLight, textAlign: 'center', paddingVertical: Spacing.lg },

  attemptItem: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    paddingVertical: Spacing.md,
  },
  attemptHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.xs },
  attemptTypeBadge: {
    backgroundColor: Colors.info,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: Spacing.sm,
  },
  attemptTypeText: { ...Typography.caption, color: Colors.textWhite, fontWeight: '600' },
  attemptOutcome: { ...Typography.bodySmall, color: Colors.text, fontWeight: '600' },
  attemptNotes: { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: Spacing.xs },
  attemptTimestamp: { ...Typography.caption, color: Colors.textLight, marginTop: Spacing.xs },

  formLabel: { ...Typography.label, color: Colors.text, marginTop: Spacing.md, marginBottom: Spacing.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    marginBottom: Spacing.xs,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { ...Typography.bodySmall, color: Colors.textSecondary },
  chipTextActive: { color: Colors.textWhite },

  textInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: Spacing.md,
    minHeight: 80,
    textAlignVertical: 'top',
    ...Typography.body,
    color: Colors.text,
  },
  textInputSingle: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: Spacing.md,
    ...Typography.body,
    color: Colors.text,
    marginBottom: Spacing.lg,
  },

  formButtons: { flexDirection: 'row', marginTop: Spacing.lg, gap: Spacing.sm },
  cancelBtn: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  cancelBtnText: { ...Typography.body, color: Colors.textSecondary, fontWeight: '600' },
  submitBtn: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  submitBtnText: { ...Typography.body, color: Colors.textWhite, fontWeight: '600' },

  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: Spacing.md,
    alignItems: 'center',
  },
  primaryBtnText: { color: Colors.textWhite, fontSize: 16, fontWeight: '600' },

  secondaryBtn: {
    borderRadius: 8,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  secondaryBtnText: { color: Colors.primary, fontSize: 16, fontWeight: '600' },

  disabledBtn: { opacity: 0.6 },

  actionSection: { marginTop: Spacing.sm },
  actionRow: { flexDirection: 'row' },

  photoCount: { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: Spacing.sm, marginBottom: Spacing.md },
});

export default RecoveryScreen;
