import React, { useState, useMemo, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, Image, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePhotoCapture } from '../hooks/usePhotoCapture';
import PhotoCapture from '../components/PhotoCapture';
import EvidenceChecklist from '../components/EvidenceChecklist';
import FuelLevelPicker from '../components/FuelLevelPicker';
import SignatureCapture from '../components/SignatureCapture';
import agreementApiService from '../services/agreement-api.service';
import customerApiService from '../services/customer-api.service';
import vehicleApiService from '../services/vehicle-api.service';
import { Colors, Spacing, Typography } from '../theme';
import { CHECKOUT_CHECKLIST_ITEMS } from '../constants';
import type { FuelLevel, Agreement, Customer, Vehicle } from '../types';

const STEPS = ['Photos', 'Details', 'Signature', 'Confirm'];

const CheckoutScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { agreementId } = route.params;
  const { photos, capturePhoto, removePhoto, hasMinimumPhotos } = usePhotoCapture();

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    odometer_reading: '',
    fuel_level: 'FULL' as FuelLevel,
    accessories: '',
  });
  const [signature, setSignature] = useState<string | null>(null);
  const [useOtp, setUseOtp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loadingAgreement, setLoadingAgreement] = useState(true);

  useEffect(() => {
    loadAgreementContext();
  }, [agreementId]);

  const loadAgreementContext = async () => {
    try {
      setLoadingAgreement(true);
      const response = await agreementApiService.getAgreement(agreementId);
      const agr = response.data;
      setAgreement(agr || null);

      if (agr?.customer_id) {
        customerApiService.getCustomer(agr.customer_id).then(setCustomer).catch(() => {});
      }
      if (agr?.vehicle_id) {
        vehicleApiService.getVehicle(agr.vehicle_id).then(setVehicle).catch(() => {});
      }
    } catch {
      setAgreement(null);
    } finally {
      setLoadingAgreement(false);
    }
  };

  // Track completed checklist items
  const completedItems = useMemo(() => {
    const items: string[] = [];
    if (hasMinimumPhotos(4)) items.push('photos');
    if (formData.odometer_reading) items.push('odometer');
    items.push('fuel'); // fuel always has default
    if (formData.accessories) items.push('accessories');
    if (signature || useOtp) items.push('signature');
    return items;
  }, [photos, formData, signature, useOtp]);

  const handlePhotoCapture = async (photoAngle: string) => {
    try {
      await capturePhoto(photoAngle);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleSubmit = async () => {
    try {
      if (!hasMinimumPhotos(4)) {
        Alert.alert('Validation', `Minimum 4 photos required. Current: ${photos.length}`);
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

      const uploadData = new FormData();
      uploadData.append('odometer_reading', formData.odometer_reading);
      uploadData.append('fuel_level', formData.fuel_level);
      uploadData.append('customer_otp_verified', useOtp ? 'true' : 'false');
      if (!useOtp && signature) {
        uploadData.append('customer_signature_url', signature);
      }
      if (useOtp) {
        uploadData.append('otp_verification_timestamp', new Date().toISOString());
      }

      if (formData.accessories) {
        uploadData.append('accessories', JSON.stringify(formData.accessories.split(',')));
      }

      // Add GPS from first photo as evidence location
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
        uploadData.append(`photo_${index}_angle`, photo.photoAngle || 'FRONT');
        uploadData.append(`photo_${index}_timestamp`, photo.capturedTimestamp);
        uploadData.append(`photo_${index}_latitude`, photo.gpsLatitude.toString());
        uploadData.append(`photo_${index}_longitude`, photo.gpsLongitude.toString());
        uploadData.append(`photo_${index}_accuracy`, photo.gpsAccuracy.toString());
      });

      await agreementApiService.uploadCheckoutEvidence(agreementId, uploadData);

      Alert.alert('Success', 'Checkout completed and agreement activated', [
        { text: 'OK', onPress: () => navigation.navigate('AgreementView', { agreementId }) },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const bottomPad = Math.max(insets.bottom, 34) + 40;

  if (loadingAgreement) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.safeArea}>
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: bottomPad }}
      scrollEnabled={!isSigning}
    >
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

      {/* Evidence Checklist */}
      <View style={styles.section}>
        {agreement && (
          <View style={styles.contextCard}>
            <Text style={styles.contextTitle}>{agreement.agreement_number}</Text>
            <Text style={styles.contextText}>
              {customer?.full_name_en || 'Customer'} | {vehicle ? `${vehicle.make} ${vehicle.model}` : 'Vehicle'}
            </Text>
            <Text style={styles.contextText}>
              {new Date(agreement.rental_start_datetime).toLocaleDateString()} - {new Date(agreement.rental_end_datetime).toLocaleDateString()}
            </Text>
          </View>
        )}
        <EvidenceChecklist items={CHECKOUT_CHECKLIST_ITEMS} completedItems={completedItems} />
        <Text style={styles.progressText}>
          {completedItems.length}/{CHECKOUT_CHECKLIST_ITEMS.length} completed
        </Text>
      </View>

      {/* Step 0: Photos */}
      {currentStep === 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vehicle Photos ({photos.length}/4 minimum)</Text>
          <Text style={styles.helperText}>Location must be enabled to capture verified evidence photos.</Text>
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

          <TouchableOpacity
            style={[styles.nextBtn, !hasMinimumPhotos(4) && styles.nextBtnDisabled]}
            onPress={() => setCurrentStep(1)}
            disabled={!hasMinimumPhotos(4)}
          >
            <Text style={styles.nextBtnText}>Next: Details</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Step 1: Details */}
      {currentStep === 1 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vehicle Details</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Odometer Reading (km) *</Text>
            <TextInput
              style={styles.input}
              value={formData.odometer_reading}
              onChangeText={(v) => setFormData((prev) => ({ ...prev, odometer_reading: v }))}
              placeholder={vehicle?.current_odometer ? String(vehicle.current_odometer) : 'Enter odometer'}
              placeholderTextColor={Colors.textLight}
              keyboardType="numeric"
            />
          </View>

          <FuelLevelPicker
            value={formData.fuel_level}
            onChange={(level) => setFormData((prev) => ({ ...prev, fuel_level: level }))}
          />

          <View style={styles.formGroup}>
            <Text style={styles.label}>Accessories (comma-separated)</Text>
            <TextInput
              style={styles.input}
              value={formData.accessories}
              onChangeText={(v) => setFormData((prev) => ({ ...prev, accessories: v }))}
              placeholder="GPS, Child Seat, Spare Key"
              placeholderTextColor={Colors.textLight}
            />
          </View>

          <TouchableOpacity
            style={[styles.nextBtn, !formData.odometer_reading && styles.nextBtnDisabled]}
            onPress={() => setCurrentStep(2)}
            disabled={!formData.odometer_reading}
          >
            <Text style={styles.nextBtnText}>Next: Signature</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Step 2: Signature */}
      {currentStep === 2 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Authorization</Text>

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
            <SignatureCapture
              onSignatureCapture={(sig: string) => setSignature(sig)}
              onSigningStateChange={(signing: boolean) => setIsSigning(signing)}
            />
          ) : (
            <View style={styles.otpConfirm}>
              <Text style={styles.otpText}>Customer identity verified via OTP</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.nextBtn, (!signature && !useOtp) && styles.nextBtnDisabled]}
            onPress={() => setCurrentStep(3)}
            disabled={!signature && !useOtp}
          >
            <Text style={styles.nextBtnText}>Next: Confirm</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Step 3: Confirm */}
      {currentStep === 3 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Confirm Checkout</Text>

          <View style={styles.summaryCard}>
            <Text style={styles.summaryRow}>Photos: {photos.length}</Text>
            <Text style={styles.summaryRow}>Odometer: {formData.odometer_reading} km</Text>
            <Text style={styles.summaryRow}>Fuel Level: {formData.fuel_level}</Text>
            {agreement?.agreement_number && (
              <Text style={styles.summaryRow}>Agreement: {agreement.agreement_number}</Text>
            )}
            <Text style={styles.summaryRow}>
              Authorization: {useOtp ? 'OTP Verified' : 'Signature Captured'}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitBtnText}>
              {loading ? 'Processing...' : 'Complete Checkout'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.fdBackground },
  container: { flex: 1, backgroundColor: Colors.fdBackground },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.fdBackground },
  stepBar: {
    flexDirection: 'row', padding: Spacing.lg,
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: Colors.fdPrimary + '20',
  },
  step: {
    flex: 1, alignItems: 'center', paddingVertical: Spacing.sm,
  },
  activeStep: {
    borderBottomWidth: 2, borderBottomColor: Colors.fdPrimary,
  },
  completedStep: {
    borderBottomWidth: 2, borderBottomColor: Colors.success,
  },
  stepText: { fontSize: 16, fontWeight: '600', color: Colors.fdSecondary },
  activeStepText: { color: Colors.fdPrimary },
  stepLabel: { ...Typography.caption, color: Colors.fdSecondary, marginTop: 2 },
  activeStepLabel: { color: Colors.fdPrimary },
  section: {
    padding: Spacing.lg,
    margin: Spacing.md,
    marginBottom: 0,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.fdPrimary + '15',
  },
  sectionTitle: { ...Typography.h3, marginBottom: Spacing.lg, color: Colors.fdPrimaryDark },
  helperText: { ...Typography.bodySmall, color: Colors.fdSecondary, marginBottom: Spacing.sm },
  contextCard: {
    borderWidth: 1,
    borderColor: Colors.fdPrimary + '20',
    borderRadius: 8,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    backgroundColor: '#FFFFFF',
  },
  contextTitle: { ...Typography.body, color: Colors.fdPrimaryDark, fontWeight: '700', marginBottom: 4 },
  contextText: { ...Typography.bodySmall, color: Colors.fdSecondary },
  progressText: { ...Typography.bodySmall, color: Colors.fdSecondary, marginTop: Spacing.sm, textAlign: 'center' },
  formGroup: { marginBottom: Spacing.lg },
  label: { ...Typography.label, marginBottom: Spacing.sm, color: Colors.fdPrimaryDark },
  input: {
    borderWidth: 1, borderColor: Colors.fdPrimary + '25', borderRadius: 8,
    padding: Spacing.md, fontSize: 16, color: Colors.text, backgroundColor: '#FFFFFF',
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
    borderWidth: 1, borderColor: Colors.fdPrimary + '25', borderRadius: 8, overflow: 'hidden',
  },
  toggleBtn: { flex: 1, paddingVertical: Spacing.md, alignItems: 'center', backgroundColor: '#FFFFFF' },
  toggleActive: { backgroundColor: Colors.fdPrimary },
  toggleText: { fontWeight: '600', color: Colors.fdSecondary },
  toggleActiveText: { color: Colors.textWhite },
  otpConfirm: {
    padding: Spacing.xl, backgroundColor: Colors.success + '15',
    borderRadius: 8, alignItems: 'center', marginBottom: Spacing.lg,
  },
  otpText: { ...Typography.body, color: Colors.success, fontWeight: '600' },
  summaryCard: {
    backgroundColor: Colors.fdBackground, borderRadius: 8,
    padding: Spacing.lg, marginBottom: Spacing.xl,
  },
  summaryRow: { ...Typography.body, marginBottom: Spacing.sm, color: Colors.fdPrimaryDark },
  nextBtn: {
    backgroundColor: Colors.fdPrimary, borderRadius: 8,
    padding: Spacing.md, alignItems: 'center', marginTop: Spacing.lg,
  },
  nextBtnDisabled: { opacity: 0.4 },
  nextBtnText: { color: Colors.textWhite, fontSize: 16, fontWeight: '600' },
  submitBtn: {
    backgroundColor: Colors.fdPrimaryDark, borderRadius: 8,
    padding: Spacing.lg, alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: Colors.textWhite, fontSize: 16, fontWeight: '600' },
});

export default CheckoutScreen;
