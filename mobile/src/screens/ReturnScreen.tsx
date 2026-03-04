import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, ActivityIndicator, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePhotoCapture } from '../hooks/usePhotoCapture';
import PhotoCapture from '../components/PhotoCapture';
import EvidenceChecklist from '../components/EvidenceChecklist';
import FuelLevelPicker from '../components/FuelLevelPicker';
import agreementApiService from '../services/agreement-api.service';
import customerApiService from '../services/customer-api.service';
import vehicleApiService from '../services/vehicle-api.service';
import { Colors, Spacing, Typography } from '../theme';
import { RETURN_CHECKLIST_ITEMS } from '../constants';
import type { FuelLevel, CheckoutEvidence, Agreement, Customer, Vehicle } from '../types';

const STEPS = ['Reference', 'Photos', 'Inspection', 'Confirm'];

const ReturnScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { agreementId } = route.params;
  const { photos, capturePhoto, hasMinimumPhotos, removePhoto } = usePhotoCapture();

  const [checkoutEvidence, setCheckoutEvidence] = useState<CheckoutEvidence | null>(null);
  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loadingEvidence, setLoadingEvidence] = useState(true);

  const [formData, setFormData] = useState({
    odometer_reading: '',
    fuel_level: 'FULL' as FuelLevel,
    damage_documented: false,
    damage_description: '',
    customer_acknowledgment: false,
  });
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    loadCheckoutEvidence();
  }, [agreementId]);

  const loadCheckoutEvidence = async () => {
    try {
      const [evidenceResult, agreementResult] = await Promise.all([
        agreementApiService.getEvidence(agreementId),
        agreementApiService.getAgreement(agreementId),
      ]);
      setCheckoutEvidence(evidenceResult.data?.checkout || null);
      const agr = agreementResult.data;
      setAgreement(agr || null);
      if (agr?.customer_id) customerApiService.getCustomer(agr.customer_id).then(setCustomer).catch(() => {});
      if (agr?.vehicle_id) vehicleApiService.getVehicle(agr.vehicle_id).then(setVehicle).catch(() => {});
    } catch {
      setCheckoutEvidence(null);
    } finally {
      setLoadingEvidence(false);
    }
  };

  const kmDriven = useMemo(() => {
    if (!checkoutEvidence || !formData.odometer_reading) return null;
    const driven = parseInt(formData.odometer_reading, 10) - checkoutEvidence.odometer_reading;
    return driven >= 0 ? driven : null;
  }, [formData.odometer_reading, checkoutEvidence]);

  const completedItems = useMemo(() => {
    const items: string[] = [];
    if (hasMinimumPhotos(4)) items.push('photos');
    if (formData.odometer_reading) items.push('odometer');
    items.push('fuel');
    items.push('damage');
    if (formData.customer_acknowledgment) items.push('acknowledgment');
    return items;
  }, [photos, formData, hasMinimumPhotos]);

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
      const odometerValue = parseInt(formData.odometer_reading, 10);
      if (Number.isNaN(odometerValue) || odometerValue < 0) {
        Alert.alert('Validation', 'Please enter a valid odometer reading');
        return;
      }
      if (checkoutEvidence && odometerValue < checkoutEvidence.odometer_reading) {
        Alert.alert(
          'Validation',
          `Return odometer cannot be less than checkout odometer (${checkoutEvidence.odometer_reading})`
        );
        return;
      }
      if (!formData.customer_acknowledgment) {
        Alert.alert('Validation', 'Customer acknowledgment is required');
        return;
      }
      if (formData.damage_documented && !formData.damage_description) {
        Alert.alert('Validation', 'Damage description is required when damage is documented');
        return;
      }

      setLoading(true);

      const uploadData = new FormData();
      uploadData.append('odometer_reading', formData.odometer_reading);
      uploadData.append('fuel_level', formData.fuel_level);
      uploadData.append('damage_documented', formData.damage_documented.toString());
      uploadData.append('customer_acknowledgment', 'true');

      if (formData.damage_documented && formData.damage_description) {
        uploadData.append('damage_description', formData.damage_description);
      }

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
        uploadData.append(`photo_${index}_angle`, photo.photoAngle || 'DAMAGE');
        uploadData.append(`photo_${index}_timestamp`, photo.capturedTimestamp);
        uploadData.append(`photo_${index}_latitude`, photo.gpsLatitude.toString());
        uploadData.append(`photo_${index}_longitude`, photo.gpsLongitude.toString());
        uploadData.append(`photo_${index}_accuracy`, photo.gpsAccuracy.toString());
      });

      const result = await agreementApiService.uploadReturnEvidence(agreementId, uploadData);

      Alert.alert(
        'Success',
        `Return completed. Total charges: AED ${result.data?.total_charges || 0}`,
        [{ text: 'View Details', onPress: () => navigation.navigate('AgreementView', { agreementId }) }]
      );
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to complete return';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  if (loadingEvidence) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const bottomPad = Math.max(insets.bottom, 34) + 40;
  const canProceedToConfirm =
    hasMinimumPhotos(4) &&
    !!formData.odometer_reading &&
    formData.customer_acknowledgment &&
    (!formData.damage_documented || !!formData.damage_description);

  return (
    <View style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: bottomPad }}>
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

        {currentStep === 0 && <View style={styles.section}>
          {agreement && (
            <View style={styles.contextCard}>
              <Text style={styles.contextTitle}>{agreement.agreement_number}</Text>
              <Text style={styles.contextText}>
                {customer?.full_name_en || 'Customer'} | {vehicle ? `${vehicle.make} ${vehicle.model}` : 'Vehicle'}
              </Text>
            </View>
          )}
          <EvidenceChecklist items={RETURN_CHECKLIST_ITEMS} completedItems={completedItems} />
          <TouchableOpacity style={styles.nextBtn} onPress={() => setCurrentStep(1)}>
            <Text style={styles.nextBtnText}>Next: Photos</Text>
          </TouchableOpacity>
        </View>}

        {currentStep === 0 && checkoutEvidence && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Checkout Reference</Text>
            <View style={styles.comparisonCard}>
              <View style={styles.compRow}>
                <Text style={styles.compLabel}>Checkout Odometer</Text>
                <Text style={styles.compValue}>{checkoutEvidence.odometer_reading} km</Text>
              </View>
              <View style={styles.compRow}>
                <Text style={styles.compLabel}>Checkout Fuel</Text>
                <Text style={styles.compValue}>{checkoutEvidence.fuel_level}</Text>
              </View>
              {kmDriven !== null && (
                <View style={[styles.compRow, styles.highlightRow]}>
                  <Text style={styles.compLabel}>KM Driven</Text>
                  <Text style={[styles.compValue, styles.highlightValue]}>{kmDriven} km</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {currentStep === 1 && <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vehicle Photos ({photos.length}/4 minimum)</Text>
          <Text style={styles.helperText}>Location must be enabled to capture verified evidence photos.</Text>
          <PhotoCapture photoAngle="FRONT" onPhotoCapture={() => handlePhotoCapture('FRONT')} />
          <PhotoCapture photoAngle="BACK" onPhotoCapture={() => handlePhotoCapture('BACK')} />
          <PhotoCapture photoAngle="LEFT" onPhotoCapture={() => handlePhotoCapture('LEFT')} />
          <PhotoCapture photoAngle="RIGHT" onPhotoCapture={() => handlePhotoCapture('RIGHT')} />
          {formData.damage_documented && (
            <PhotoCapture photoAngle="DAMAGE" onPhotoCapture={() => handlePhotoCapture('DAMAGE')} />
          )}
          {photos.length > 0 && (
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
          )}
          <TouchableOpacity
            style={[styles.nextBtn, !hasMinimumPhotos(4) && styles.nextBtnDisabled]}
            onPress={() => setCurrentStep(2)}
            disabled={!hasMinimumPhotos(4)}
          >
            <Text style={styles.nextBtnText}>Next: Inspection</Text>
          </TouchableOpacity>
        </View>}

        {currentStep === 2 && <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vehicle Details</Text>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Odometer Reading (km) *</Text>
            <TextInput
              style={styles.input}
              value={formData.odometer_reading}
              onChangeText={(v) => setFormData((prev) => ({ ...prev, odometer_reading: v }))}
              placeholder={checkoutEvidence ? `Min: ${checkoutEvidence.odometer_reading}` : 'Enter odometer'}
              placeholderTextColor={Colors.textLight}
              keyboardType="numeric"
            />
          </View>
          <FuelLevelPicker
            value={formData.fuel_level}
            onChange={(level) => setFormData((prev) => ({ ...prev, fuel_level: level }))}
          />
          <Text style={styles.sectionTitle}>Damage Inspection</Text>
          <TouchableOpacity
            style={[styles.damageToggle, formData.damage_documented && styles.damageToggleActive]}
            onPress={() => setFormData((prev) => ({ ...prev, damage_documented: !prev.damage_documented }))}
          >
            <Text style={[styles.damageToggleText, formData.damage_documented && styles.damageToggleTextActive]}>
              {formData.damage_documented ? 'Damage Found' : 'No Damage'}
            </Text>
          </TouchableOpacity>

          {formData.damage_documented && (
            <View style={styles.formGroup}>
              <Text style={styles.label}>Damage Description *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.damage_description}
                onChangeText={(v) => setFormData((prev) => ({ ...prev, damage_description: v }))}
                placeholder="Describe the damage in detail..."
                placeholderTextColor={Colors.textLight}
                multiline
                numberOfLines={4}
              />
            </View>
          )}
          <TouchableOpacity
            style={[styles.ackBtn, formData.customer_acknowledgment && styles.ackBtnActive]}
            onPress={() => setFormData((prev) => ({ ...prev, customer_acknowledgment: !prev.customer_acknowledgment }))}
          >
            <View style={[styles.ackCheckbox, formData.customer_acknowledgment && styles.ackCheckboxActive]}>
              {formData.customer_acknowledgment && <Text style={styles.ackCheck}>✓</Text>}
            </View>
            <Text style={styles.ackText}>
              Customer acknowledges the vehicle condition and agrees to any applicable charges
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.nextBtn, !canProceedToConfirm && styles.nextBtnDisabled]}
            onPress={() => setCurrentStep(3)}
            disabled={!canProceedToConfirm}
          >
            <Text style={styles.nextBtnText}>Next: Confirm</Text>
          </TouchableOpacity>
        </View>}

        {currentStep === 3 && <View style={styles.section}>
          <Text style={styles.sectionTitle}>Confirm Return</Text>
          <View style={styles.comparisonCard}>
            <Text style={styles.compValue}>Photos: {photos.length}</Text>
            <Text style={styles.compValue}>Odometer: {formData.odometer_reading || '-'}</Text>
            <Text style={styles.compValue}>Fuel: {formData.fuel_level}</Text>
            <Text style={styles.compValue}>
              Damage: {formData.damage_documented ? 'Reported' : 'No damage'}
            </Text>
            <Text style={styles.compValue}>
              Acknowledgment: {formData.customer_acknowledgment ? 'Yes' : 'No'}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.submitBtn, (loading || !hasMinimumPhotos(4) || !formData.customer_acknowledgment) && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading || !hasMinimumPhotos(4) || !formData.customer_acknowledgment}
          >
            <Text style={styles.submitBtnText}>
              {loading ? 'Processing...' : 'Complete Return'}
            </Text>
          </TouchableOpacity>
        </View>}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.fdBackground },
  container: { flex: 1, backgroundColor: Colors.fdBackground },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.fdBackground },
  stepBar: {
    flexDirection: 'row',
    padding: Spacing.lg,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: Colors.fdPrimary + '20',
  },
  step: { flex: 1, alignItems: 'center', paddingVertical: Spacing.sm },
  activeStep: { borderBottomWidth: 2, borderBottomColor: Colors.fdPrimary },
  completedStep: { borderBottomWidth: 2, borderBottomColor: Colors.success },
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
  formGroup: { marginBottom: Spacing.lg },
  label: { ...Typography.label, marginBottom: Spacing.sm, color: Colors.fdPrimaryDark },
  input: {
    borderWidth: 1, borderColor: Colors.fdPrimary + '25', borderRadius: 8,
    padding: Spacing.md, fontSize: 16, color: Colors.fdPrimaryDark, backgroundColor: '#FFFFFF',
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  comparisonCard: {
    backgroundColor: Colors.fdBackground, borderRadius: 8, padding: Spacing.lg,
  },
  compRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  compLabel: { ...Typography.bodySmall, color: Colors.fdSecondary },
  compValue: { ...Typography.bodySmall, fontWeight: '600', color: Colors.fdPrimaryDark },
  highlightRow: {
    borderTopWidth: 1, borderTopColor: Colors.fdPrimary + '20',
    marginTop: Spacing.sm, paddingTop: Spacing.md,
  },
  highlightValue: { color: Colors.fdPrimary, fontSize: 16 },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.md },
  photoThumb: { position: 'relative' },
  thumbImage: { width: 70, height: 70, borderRadius: 8 },
  removeBtn: {
    position: 'absolute', top: -4, right: -4,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: Colors.error, alignItems: 'center', justifyContent: 'center',
  },
  removeBtnText: { color: Colors.textWhite, fontSize: 10, fontWeight: 'bold' },
  damageToggle: {
    padding: Spacing.lg, borderRadius: 8, borderWidth: 2,
    borderColor: Colors.fdPrimary, alignItems: 'center', marginBottom: Spacing.lg,
  },
  damageToggleActive: { borderColor: Colors.error, backgroundColor: Colors.error + '10' },
  damageToggleText: { fontWeight: '600', color: Colors.fdPrimary, fontSize: 16 },
  damageToggleTextActive: { color: Colors.error },
  ackBtn: {
    flexDirection: 'row', alignItems: 'center',
    padding: Spacing.lg, borderRadius: 8, backgroundColor: Colors.fdBackground,
  },
  ackBtnActive: { backgroundColor: Colors.success + '15' },
  ackCheckbox: {
    width: 24, height: 24, borderWidth: 2, borderColor: Colors.border,
    borderRadius: 4, marginRight: Spacing.md,
    alignItems: 'center', justifyContent: 'center',
  },
  ackCheckboxActive: { backgroundColor: Colors.success, borderColor: Colors.success },
  ackCheck: { color: Colors.textWhite, fontWeight: 'bold' },
  ackText: { flex: 1, ...Typography.bodySmall, color: Colors.fdPrimaryDark },
  submitBtn: {
    backgroundColor: Colors.fdPrimaryDark, borderRadius: 8,
    padding: Spacing.lg, alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.4 },
  submitBtnText: { color: Colors.textWhite, fontSize: 16, fontWeight: '600' },
  nextBtn: {
    backgroundColor: Colors.fdPrimary,
    borderRadius: 8,
    padding: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  nextBtnDisabled: { opacity: 0.4 },
  nextBtnText: { color: Colors.textWhite, fontSize: 16, fontWeight: '600' },
});

export default ReturnScreen;
