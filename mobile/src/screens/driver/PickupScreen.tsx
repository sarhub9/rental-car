import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, Image,
} from 'react-native';
import { usePhotoCapture } from '../../hooks/usePhotoCapture';
import PhotoCapture from '../../components/PhotoCapture';
import FuelLevelPicker from '../../components/FuelLevelPicker';
import SignatureCapture from '../../components/SignatureCapture';
import driverTaskApiService from '../../services/driver-task-api.service';
import { Colors, Spacing, Typography } from '../../theme';
import type { FuelLevel } from '../../types';

const MIN_CHECKOUT_PHOTOS = 4;
const STEPS = ['Inspection', 'Damages', 'Handover', 'Confirm'];

interface DamageEntry {
  description: string;
  severity: 'MINOR' | 'MODERATE' | 'MAJOR';
  vehicle_area: string;
}

const PickupScreen = ({ route, navigation }) => {
  const { taskId } = route.params;
  const { photos, capturePhoto, removePhoto, hasMinimumPhotos } = usePhotoCapture();

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    odometer_reading: '',
    fuel_level: 'FULL' as FuelLevel,
  });
  const [signature, setSignature] = useState<string | null>(null);
  const [useOtp, setUseOtp] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);

  // Damage assessment state
  const [hasDamage, setHasDamage] = useState(false);
  const [damages, setDamages] = useState<DamageEntry[]>([]);
  const [damageForm, setDamageForm] = useState<DamageEntry>({
    description: '',
    severity: 'MINOR',
    vehicle_area: '',
  });

  const handlePhotoCapture = async (photoAngle: string) => {
    try {
      await capturePhoto(photoAngle);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const canProceedStep0 = hasMinimumPhotos(MIN_CHECKOUT_PHOTOS) && !!formData.odometer_reading;
  const canProceedStep2 = !!signature || (useOtp && !!otpCode);

  const handleAddDamage = () => {
    if (!damageForm.description) {
      Alert.alert('Validation', 'Damage description is required');
      return;
    }
    if (!damageForm.vehicle_area) {
      Alert.alert('Validation', 'Vehicle area is required');
      return;
    }
    setDamages((prev) => [...prev, { ...damageForm }]);
    setDamageForm({ description: '', severity: 'MINOR', vehicle_area: '' });
  };

  const handleRemoveDamage = (index: number) => {
    setDamages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    try {
      if (!hasMinimumPhotos(MIN_CHECKOUT_PHOTOS)) {
        Alert.alert('Validation', `Minimum ${MIN_CHECKOUT_PHOTOS} photos required. Current: ${photos.length}`);
        return;
      }
      if (!formData.odometer_reading) {
        Alert.alert('Validation', 'Odometer reading is required');
        return;
      }
      if (!signature && !useOtp) {
        Alert.alert('Validation', 'Customer signature or OTP verification is required');
        return;
      }

      setLoading(true);

      // 1. Upload evidence (photos + readings)
      const uploadData = new FormData();
      uploadData.append('odometer_reading', formData.odometer_reading);
      uploadData.append('fuel_level', formData.fuel_level);

      if (photos.length > 0) {
        uploadData.append('gps_latitude', photos[0].gpsLatitude.toString());
        uploadData.append('gps_longitude', photos[0].gpsLongitude.toString());
        uploadData.append('gps_accuracy_meters', photos[0].gpsAccuracy.toString());
        uploadData.append('captured_timestamp', photos[0].capturedTimestamp);
      }

      photos.forEach((photo, index) => {
        uploadData.append('photos', {
          uri: photo.uri,
          type: photo.type,
          name: photo.fileName,
        } as any);
        uploadData.append(`photo_${index}_timestamp`, photo.capturedTimestamp);
        uploadData.append(`photo_${index}_latitude`, photo.gpsLatitude.toString());
        uploadData.append(`photo_${index}_longitude`, photo.gpsLongitude.toString());
        uploadData.append(`photo_${index}_accuracy`, photo.gpsAccuracy.toString());
      });

      await driverTaskApiService.uploadEvidence(taskId, uploadData);

      // 2. Upload damages if any
      if (damages.length > 0) {
        for (const damage of damages) {
          const damageData = new FormData();
          damageData.append('description', damage.description);
          damageData.append('severity', damage.severity);
          damageData.append('vehicle_area', damage.vehicle_area);
          await driverTaskApiService.addDamage(taskId, damageData);
        }
      }

      // 3. Upload signature if used
      if (signature) {
        const sigFormData = new FormData();
        sigFormData.append('signature', {
          uri: signature,
          type: 'image/png',
          name: 'signature.png',
        } as any);
        await driverTaskApiService.uploadSignature(taskId, sigFormData);
      }

      // 4. Complete task
      const completeData: any = {
        customer_confirmation_type: useOtp ? 'otp' : 'signature',
      };
      if (useOtp && otpCode) {
        completeData.otp_code = otpCode;
      }
      const result = await driverTaskApiService.completeTask(taskId, completeData);

      // 5. Success with charges info if returned
      const chargesMsg = result.data?.total_charges
        ? `\nTotal charges: AED ${result.data.total_charges}`
        : '';
      Alert.alert('Success', `Pickup completed successfully${chargesMsg}`, [
        { text: 'OK', onPress: () => navigation.navigate('DriverDashboard') },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Step Indicator */}
      <View style={styles.stepBar}>
        {STEPS.map((step, i) => (
          <TouchableOpacity
            key={step}
            style={[styles.step, i === currentStep && styles.activeStep, i < currentStep && styles.completedStep]}
            onPress={() => setCurrentStep(i)}
          >
            <Text style={[styles.stepText, (i === currentStep || i < currentStep) && styles.activeStepText]}>
              {i < currentStep ? '✓' : i + 1}
            </Text>
            <Text style={[styles.stepLabel, i === currentStep && styles.activeStepLabel]}>{step}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Step 0: Vehicle Inspection */}
      {currentStep === 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vehicle Photos ({photos.length}/{MIN_CHECKOUT_PHOTOS} minimum)</Text>
          <PhotoCapture photoAngle="FRONT" onPhotoCapture={() => handlePhotoCapture('FRONT')} />
          <PhotoCapture photoAngle="BACK" onPhotoCapture={() => handlePhotoCapture('BACK')} />
          <PhotoCapture photoAngle="LEFT" onPhotoCapture={() => handlePhotoCapture('LEFT')} />
          <PhotoCapture photoAngle="RIGHT" onPhotoCapture={() => handlePhotoCapture('RIGHT')} />
          <PhotoCapture photoAngle="INTERIOR" onPhotoCapture={() => handlePhotoCapture('INTERIOR')} />
          <PhotoCapture photoAngle="DASHBOARD" onPhotoCapture={() => handlePhotoCapture('DASHBOARD')} />

          {/* Photo preview thumbnails */}
          {photos.length > 0 && (
            <View style={styles.photoPreview}>
              <Text style={styles.label}>Captured Photos</Text>
              <View style={styles.photoGrid}>
                {photos.map((photo, i) => (
                  <View key={i} style={styles.photoThumb}>
                    <Image source={{ uri: photo.uri }} style={styles.thumbImage} />
                    <TouchableOpacity style={styles.removeBtn} onPress={() => removePhoto(i)}>
                      <Text style={styles.removeBtnText}>X</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.formGroup}>
            <Text style={styles.label}>Odometer Reading (km) *</Text>
            <TextInput
              style={styles.input}
              value={formData.odometer_reading}
              onChangeText={(v) => setFormData((prev) => ({ ...prev, odometer_reading: v }))}
              placeholder="50000"
              keyboardType="numeric"
            />
          </View>

          <FuelLevelPicker
            value={formData.fuel_level}
            onChange={(level) => setFormData((prev) => ({ ...prev, fuel_level: level }))}
          />

          <TouchableOpacity
            style={[styles.nextBtn, !canProceedStep0 && styles.nextBtnDisabled]}
            onPress={() => setCurrentStep(1)}
            disabled={!canProceedStep0}
          >
            <Text style={styles.nextBtnText}>Next: Damages</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Step 1: Damage Assessment */}
      {currentStep === 1 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Damage Assessment</Text>

          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleBtn, !hasDamage && styles.toggleActive]}
              onPress={() => setHasDamage(false)}
            >
              <Text style={[styles.toggleText, !hasDamage && styles.toggleActiveText]}>No Damage Found</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, hasDamage && styles.toggleActive]}
              onPress={() => setHasDamage(true)}
            >
              <Text style={[styles.toggleText, hasDamage && styles.toggleActiveText]}>Document Damage</Text>
            </TouchableOpacity>
          </View>

          {hasDamage && (
            <>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Description *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={damageForm.description}
                  onChangeText={(v) => setDamageForm((prev) => ({ ...prev, description: v }))}
                  placeholder="Describe the damage..."
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Severity</Text>
                <View style={styles.severityRow}>
                  <TouchableOpacity
                    style={[styles.severityBtn, { borderColor: Colors.success },
                      damageForm.severity === 'MINOR' && { backgroundColor: Colors.success }]}
                    onPress={() => setDamageForm((prev) => ({ ...prev, severity: 'MINOR' }))}
                  >
                    <Text style={[styles.severityText,
                      damageForm.severity === 'MINOR' && styles.severityTextActive]}>MINOR</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.severityBtn, { borderColor: Colors.warning },
                      damageForm.severity === 'MODERATE' && { backgroundColor: Colors.warning }]}
                    onPress={() => setDamageForm((prev) => ({ ...prev, severity: 'MODERATE' }))}
                  >
                    <Text style={[styles.severityText,
                      damageForm.severity === 'MODERATE' && styles.severityTextActive]}>MODERATE</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.severityBtn, { borderColor: Colors.error },
                      damageForm.severity === 'MAJOR' && { backgroundColor: Colors.error }]}
                    onPress={() => setDamageForm((prev) => ({ ...prev, severity: 'MAJOR' }))}
                  >
                    <Text style={[styles.severityText,
                      damageForm.severity === 'MAJOR' && styles.severityTextActive]}>MAJOR</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Vehicle Area *</Text>
                <TextInput
                  style={styles.input}
                  value={damageForm.vehicle_area}
                  onChangeText={(v) => setDamageForm((prev) => ({ ...prev, vehicle_area: v }))}
                  placeholder="e.g., Front bumper"
                />
              </View>

              <TouchableOpacity style={styles.addDamageBtn} onPress={handleAddDamage}>
                <Text style={styles.addDamageBtnText}>Add Damage</Text>
              </TouchableOpacity>

              {/* Damage list */}
              {damages.length > 0 && (
                <View style={styles.damageList}>
                  <Text style={styles.label}>Documented Damages ({damages.length})</Text>
                  {damages.map((damage, i) => (
                    <View key={i} style={styles.damageItem}>
                      <View style={styles.damageItemContent}>
                        <Text style={styles.damageItemTitle}>
                          [{damage.severity}] {damage.vehicle_area}
                        </Text>
                        <Text style={styles.damageItemDesc}>{damage.description}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.damageRemoveBtn}
                        onPress={() => handleRemoveDamage(i)}
                      >
                        <Text style={styles.removeBtnText}>X</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}

          <TouchableOpacity
            style={styles.nextBtn}
            onPress={() => setCurrentStep(2)}
          >
            <Text style={styles.nextBtnText}>Next: Handover</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Step 2: Customer Acknowledgment */}
      {currentStep === 2 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Acknowledgment</Text>

          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleBtn, !useOtp && styles.toggleActive]}
              onPress={() => setUseOtp(false)}
            >
              <Text style={[styles.toggleText, !useOtp && styles.toggleActiveText]}>Signature</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, useOtp && styles.toggleActive]}
              onPress={() => setUseOtp(true)}
            >
              <Text style={[styles.toggleText, useOtp && styles.toggleActiveText]}>OTP Verified</Text>
            </TouchableOpacity>
          </View>

          {!useOtp ? (
            <SignatureCapture onSignatureCapture={(sig: string) => setSignature(sig)} />
          ) : (
            <View style={styles.formGroup}>
              <Text style={styles.label}>OTP Code *</Text>
              <TextInput
                style={styles.input}
                value={otpCode}
                onChangeText={setOtpCode}
                placeholder="Enter OTP code"
                keyboardType="numeric"
              />
              <View style={styles.otpConfirm}>
                <Text style={styles.otpText}>Customer identity verified via OTP</Text>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[styles.nextBtn, !canProceedStep2 && styles.nextBtnDisabled]}
            onPress={() => setCurrentStep(3)}
            disabled={!canProceedStep2}
          >
            <Text style={styles.nextBtnText}>Next: Confirm</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Step 3: Confirm & Submit */}
      {currentStep === 3 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Confirm Pickup</Text>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryRow}>Photos: {photos.length}</Text>
            <Text style={styles.summaryRow}>Odometer: {formData.odometer_reading} km</Text>
            <Text style={styles.summaryRow}>Fuel Level: {formData.fuel_level}</Text>
            <Text style={styles.summaryRow}>Damages: {damages.length > 0 ? damages.length : 'None'}</Text>
            <Text style={styles.summaryRow}>
              Confirmation: {useOtp ? 'OTP Verified' : 'Signature Captured'}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitBtnText}>
              {loading ? 'Processing...' : 'Complete Pickup'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  stepBar: {
    flexDirection: 'row', padding: Spacing.lg,
    backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  step: {
    flex: 1, alignItems: 'center', paddingVertical: Spacing.sm,
  },
  activeStep: {
    borderBottomWidth: 2, borderBottomColor: Colors.primary,
  },
  completedStep: {
    borderBottomWidth: 2, borderBottomColor: Colors.success,
  },
  stepText: { fontSize: 16, fontWeight: '600', color: Colors.textLight },
  activeStepText: { color: Colors.primary },
  stepLabel: { ...Typography.caption, color: Colors.textLight, marginTop: 2 },
  activeStepLabel: { color: Colors.primary },
  section: { padding: Spacing.lg },
  sectionTitle: { ...Typography.h3, marginBottom: Spacing.lg, color: Colors.text },
  formGroup: { marginBottom: Spacing.lg },
  label: { ...Typography.label, marginBottom: Spacing.sm, color: Colors.text },
  input: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: 8,
    padding: Spacing.md, fontSize: 16,
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  photoPreview: { marginTop: Spacing.lg },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  photoThumb: { position: 'relative' },
  thumbImage: { width: 70, height: 70, borderRadius: 8 },
  removeBtn: {
    position: 'absolute', top: -4, right: -4,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: Colors.error, alignItems: 'center', justifyContent: 'center',
  },
  removeBtnText: { color: Colors.textWhite, fontSize: 10, fontWeight: 'bold' },
  toggleRow: {
    flexDirection: 'row', marginBottom: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border, borderRadius: 8, overflow: 'hidden',
  },
  toggleBtn: { flex: 1, paddingVertical: Spacing.md, alignItems: 'center' },
  toggleActive: { backgroundColor: Colors.primary },
  toggleText: { fontWeight: '600', color: Colors.textSecondary },
  toggleActiveText: { color: Colors.textWhite },
  otpConfirm: {
    padding: Spacing.xl, backgroundColor: Colors.success + '15',
    borderRadius: 8, alignItems: 'center', marginTop: Spacing.md,
  },
  otpText: { ...Typography.body, color: Colors.success, fontWeight: '600' },
  severityRow: {
    flexDirection: 'row', gap: Spacing.sm,
  },
  severityBtn: {
    flex: 1, paddingVertical: Spacing.md, alignItems: 'center',
    borderWidth: 2, borderRadius: 8,
  },
  severityText: { fontWeight: '600', color: Colors.text },
  severityTextActive: { color: Colors.textWhite },
  addDamageBtn: {
    backgroundColor: Colors.primary, borderRadius: 8,
    padding: Spacing.md, alignItems: 'center', marginBottom: Spacing.lg,
  },
  addDamageBtnText: { color: Colors.textWhite, fontSize: 16, fontWeight: '600' },
  damageList: { marginBottom: Spacing.lg },
  damageItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: 8,
    padding: Spacing.md, marginBottom: Spacing.sm,
  },
  damageItemContent: { flex: 1 },
  damageItemTitle: { ...Typography.label, color: Colors.text, marginBottom: 2 },
  damageItemDesc: { ...Typography.bodySmall, color: Colors.textSecondary },
  damageRemoveBtn: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: Colors.error, alignItems: 'center', justifyContent: 'center',
    marginLeft: Spacing.sm,
  },
  summaryCard: {
    backgroundColor: Colors.surface, borderRadius: 8,
    padding: Spacing.lg, marginBottom: Spacing.xl,
  },
  summaryRow: { ...Typography.body, marginBottom: Spacing.sm },
  nextBtn: {
    backgroundColor: Colors.primary, borderRadius: 8,
    padding: Spacing.md, alignItems: 'center', marginTop: Spacing.lg,
  },
  nextBtnDisabled: { opacity: 0.4 },
  nextBtnText: { color: Colors.textWhite, fontSize: 16, fontWeight: '600' },
  submitBtn: {
    backgroundColor: Colors.success, borderRadius: 8,
    padding: Spacing.lg, alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: Colors.textWhite, fontSize: 16, fontWeight: '600' },
});

export default PickupScreen;
