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
const STEPS = ['Inspection', 'Handover', 'Confirm'];

const DeliveryScreen = ({ route, navigation }) => {
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

  const handlePhotoCapture = async (photoAngle: string) => {
    try {
      await capturePhoto(photoAngle);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const canProceedStep0 = hasMinimumPhotos(MIN_CHECKOUT_PHOTOS) && !!formData.odometer_reading;
  const canProceedStep1 = !!signature || (useOtp && !!otpCode);

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

      // 1. Build FormData with photos and metadata
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

      // 2. Upload evidence
      await driverTaskApiService.uploadEvidence(taskId, uploadData);

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
      await driverTaskApiService.completeTask(taskId, completeData);

      // 5. Success
      Alert.alert('Success', 'Delivery completed successfully', [
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
            <Text style={styles.nextBtnText}>Next: Handover</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Step 1: Customer Handover */}
      {currentStep === 1 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Handover</Text>

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
            style={[styles.nextBtn, !canProceedStep1 && styles.nextBtnDisabled]}
            onPress={() => setCurrentStep(2)}
            disabled={!canProceedStep1}
          >
            <Text style={styles.nextBtnText}>Next: Confirm</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Step 2: Confirm & Submit */}
      {currentStep === 2 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Confirm Delivery</Text>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryRow}>Photos: {photos.length}</Text>
            <Text style={styles.summaryRow}>Odometer: {formData.odometer_reading} km</Text>
            <Text style={styles.summaryRow}>Fuel Level: {formData.fuel_level}</Text>
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
              {loading ? 'Processing...' : 'Complete Delivery'}
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

export default DeliveryScreen;
