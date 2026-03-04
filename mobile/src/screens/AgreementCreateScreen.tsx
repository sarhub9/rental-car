import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, Platform, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import agreementApiService from '../services/agreement-api.service';
import CustomerSearchModal from '../components/CustomerSearchModal';
import VehicleSearchModal from '../components/VehicleSearchModal';
import { Colors, Spacing, BorderRadius, Shadow3D } from '../theme';
import type { Customer, Vehicle } from '../types';

const AgreementCreateScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [showVehicleSearch, setShowVehicleSearch] = useState(false);

  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d;
  });

  // Android needs separate date and time pickers
  const [pickerTarget, setPickerTarget] = useState<'start' | 'end' | null>(null);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');
  const [tempDate, setTempDate] = useState<Date>(new Date());

  const [dailyRate, setDailyRate] = useState('');
  const [weeklyRate, setWeeklyRate] = useState('');
  const [estimatedAmount, setEstimatedAmount] = useState<number>(0);

  const handleVehicleSelect = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setShowVehicleSearch(false);
    if (vehicle.daily_rate) setDailyRate(vehicle.daily_rate.toString());
    if (vehicle.weekly_rate) setWeeklyRate(vehicle.weekly_rate.toString());
  };

  useEffect(() => {
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    if (days <= 0) { setEstimatedAmount(0); return; }
    const daily = parseFloat(dailyRate) || 0;
    const weekly = parseFloat(weeklyRate) || 0;
    let amount = 0;
    if (weekly > 0 && days >= 7) {
      const weeks = Math.floor(days / 7);
      const rem = days % 7;
      amount = weeks * weekly + rem * (daily || weekly / 7);
    } else if (daily > 0) {
      amount = days * daily;
    }
    setEstimatedAmount(Number(amount.toFixed(2)));
  }, [startDate, endDate, dailyRate, weeklyRate]);

  const openDatePicker = (target: 'start' | 'end') => {
    setPickerTarget(target);
    setTempDate(target === 'start' ? startDate : endDate);
    setPickerMode('date');
  };

  const handlePickerChange = (_: any, selectedDate?: Date) => {
    if (!selectedDate) {
      setPickerTarget(null);
      return;
    }

    if (Platform.OS === 'android') {
      if (pickerMode === 'date') {
        // User picked date, now ask for time
        setTempDate(selectedDate);
        setPickerMode('time');
      } else {
        // User picked time, apply the full date+time
        const finalDate = new Date(tempDate);
        finalDate.setHours(selectedDate.getHours(), selectedDate.getMinutes());
        if (pickerTarget === 'start') setStartDate(finalDate);
        else setEndDate(finalDate);
        setPickerTarget(null);
      }
    } else {
      // iOS: spinner handles both
      if (pickerTarget === 'start') setStartDate(selectedDate);
      else setEndDate(selectedDate);
    }
  };

  const handleSubmit = async () => {
    try {
      if (!selectedCustomer) { Alert.alert('Validation Error', 'Please select a customer'); return; }
      if (!selectedVehicle) { Alert.alert('Validation Error', 'Please select a vehicle'); return; }
      if (!dailyRate && !weeklyRate) { Alert.alert('Validation Error', 'At least one rate (daily or weekly) is required'); return; }

      const now = new Date();
      const freshStart = Math.abs(now.getTime() - startDate.getTime()) < 5 * 60 * 1000 ? now : startDate;

      const data = {
        customer_id: selectedCustomer.id,
        vehicle_id: selectedVehicle.id,
        rental_start_datetime: freshStart.toISOString(),
        rental_end_datetime: endDate.toISOString(),
        daily_rate: dailyRate ? parseFloat(dailyRate) : null,
        weekly_rate: weeklyRate ? parseFloat(weeklyRate) : null,
      };

      setLoading(true);
      setError(null);
      const result = await agreementApiService.createAgreement(data);
      const agreement = result.data;
      Alert.alert('Success', `Agreement ${agreement.agreement_number} created`, [
        { text: 'OK', onPress: () => navigation.navigate('AgreementView', { agreementId: agreement.id }) },
      ]);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to create agreement';
      setError(msg);
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d: Date) =>
    `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

  const bottomPad = Math.max(insets.bottom, 34) + 40;
  const safeEstimatedAmount = Number.isFinite(estimatedAmount) ? estimatedAmount : 0;

  return (
    <View style={styles.safeArea}>
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: bottomPad }}>
        <View style={styles.headerCard}>
          <MaterialCommunityIcons name="file-document-plus-outline" size={32} color={Colors.fdPrimary} />
          <Text style={styles.title}>Create Rental Agreement</Text>
          <Text style={styles.subtitle}>Fill in the details to create a new rental agreement</Text>
        </View>

        {error && (
          <View style={styles.errorWrap}>
            <Ionicons name="alert-circle" size={16} color={Colors.error} />
            <Text style={styles.error}> {error}</Text>
          </View>
        )}

        {/* Customer */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>
            <MaterialCommunityIcons name="account" size={14} color={Colors.fdPrimary} /> Customer *
          </Text>
          <TouchableOpacity style={styles.selectorBtn} onPress={() => setShowCustomerSearch(true)}>
            {selectedCustomer ? (
              <View style={{ flex: 1 }}>
                <Text style={styles.selectorName}>{selectedCustomer.full_name_en}</Text>
                <Text style={styles.selectorDetail}>
                  {selectedCustomer.phone_number} | {selectedCustomer.driving_license_number}
                </Text>
              </View>
            ) : (
              <Text style={styles.selectorPlaceholder}>Tap to search customers...</Text>
            )}
            <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.fdSecondary} />
          </TouchableOpacity>
        </View>

        {/* Start Date */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>
            <MaterialCommunityIcons name="calendar-start" size={14} color={Colors.fdPrimary} /> Start Date & Time *
          </Text>
          <TouchableOpacity style={styles.dateInput} onPress={() => openDatePicker('start')}>
            <MaterialCommunityIcons name="calendar-clock" size={20} color={Colors.fdPrimary} />
            <Text style={styles.dateText}>  {formatDate(startDate)}</Text>
          </TouchableOpacity>
        </View>

        {/* End Date */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>
            <MaterialCommunityIcons name="calendar-end" size={14} color={Colors.fdPrimary} /> End Date & Time *
          </Text>
          <TouchableOpacity style={styles.dateInput} onPress={() => openDatePicker('end')}>
            <MaterialCommunityIcons name="calendar-clock" size={20} color={Colors.fdPrimary} />
            <Text style={styles.dateText}>  {formatDate(endDate)}</Text>
          </TouchableOpacity>
        </View>

        {/* Android DateTimePicker (shows as dialog) */}
        {pickerTarget && (
          <DateTimePicker
            value={pickerMode === 'date' ? (pickerTarget === 'start' ? startDate : endDate) : tempDate}
            mode={pickerMode}
            display="default"
            minimumDate={pickerTarget === 'end' ? startDate : undefined}
            onChange={handlePickerChange}
          />
        )}

        {/* Vehicle */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>
            <MaterialCommunityIcons name="car" size={14} color={Colors.fdPrimary} /> Vehicle *
          </Text>
          <TouchableOpacity style={styles.selectorBtn} onPress={() => setShowVehicleSearch(true)}>
            {selectedVehicle ? (
              <View style={{ flex: 1 }}>
                <Text style={styles.selectorName}>
                  {selectedVehicle.make} {selectedVehicle.model} ({selectedVehicle.year})
                </Text>
                <Text style={styles.selectorDetail}>
                  {selectedVehicle.plate_number} - {selectedVehicle.plate_emirate}
                  {selectedVehicle.color ? ` | ${selectedVehicle.color}` : ''}
                </Text>
              </View>
            ) : (
              <Text style={styles.selectorPlaceholder}>Tap to search vehicles...</Text>
            )}
            <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.fdSecondary} />
          </TouchableOpacity>
        </View>

        {/* Daily Rate */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>
            <MaterialCommunityIcons name="cash" size={14} color={Colors.fdPrimary} /> Daily Rate (AED)
          </Text>
          <View style={styles.inputWrap}>
            <Text style={styles.inputPrefix}>AED</Text>
            <TextInput
              style={styles.input}
              value={dailyRate}
              onChangeText={setDailyRate}
              placeholder="150.00"
              placeholderTextColor={Colors.fdSecondary}
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        {/* Weekly Rate */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>
            <MaterialCommunityIcons name="cash-multiple" size={14} color={Colors.fdPrimary} /> Weekly Rate (AED)
          </Text>
          <View style={styles.inputWrap}>
            <Text style={styles.inputPrefix}>AED</Text>
            <TextInput
              style={styles.input}
              value={weeklyRate}
              onChangeText={setWeeklyRate}
              placeholder="900.00"
              placeholderTextColor={Colors.fdSecondary}
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        {/* Estimated Amount */}
        {safeEstimatedAmount > 0 && (
          <View style={styles.estimateCard}>
            <View style={styles.estimateIconWrap}>
              <MaterialCommunityIcons name="calculator" size={24} color={Colors.textDark} />
            </View>
            <Text style={styles.estimateLabel}>Estimated Amount</Text>
            <Text style={styles.estimateValue}>AED {safeEstimatedAmount.toFixed(2)}</Text>
          </View>
        )}

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator size="small" color={Colors.textDark} />
          ) : (
            <>
              <MaterialCommunityIcons name="check-circle" size={20} color={Colors.textDark} />
              <Text style={styles.submitBtnText}>
                {' '}Create Agreement
              </Text>
            </>
          )}
        </TouchableOpacity>

        <CustomerSearchModal
          visible={showCustomerSearch}
          onSelect={(c) => { setSelectedCustomer(c); setShowCustomerSearch(false); }}
          onClose={() => setShowCustomerSearch(false)}
        />
        <VehicleSearchModal
          visible={showVehicleSearch}
          startDate={startDate.toISOString()}
          endDate={endDate.toISOString()}
          onSelect={handleVehicleSelect}
          onClose={() => setShowVehicleSearch(false)}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.fdBackground },
  container: { flex: 1, padding: Spacing.lg },
  
  headerCard: {
    alignItems: 'center',
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.fdPrimary + '20',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  title: { fontSize: 22, fontWeight: '800', color: Colors.fdPrimaryDark, marginTop: Spacing.md },
  subtitle: { fontSize: 14, color: Colors.fdSecondary, marginTop: Spacing.xs, textAlign: 'center' },

  errorWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.error + '10',
    borderWidth: 1, borderColor: Colors.error + '30',
    borderRadius: BorderRadius.md,
    padding: Spacing.md, marginBottom: Spacing.lg,
  },
  error: { fontSize: 14, color: Colors.error, flex: 1 },

  formGroup: { marginBottom: Spacing.lg },
  label: { fontSize: 14, fontWeight: '700', color: Colors.fdPrimaryDark, marginBottom: Spacing.sm, flexDirection: 'row', alignItems: 'center' },

  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.fdPrimary + '30',
    borderRadius: BorderRadius.lg,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  inputPrefix: {
    fontSize: 14, fontWeight: '700', color: Colors.fdPrimary,
    paddingLeft: Spacing.md,
  },
  input: {
    flex: 1,
    padding: Spacing.md,
    fontSize: 16,
    color: Colors.text,
  },

  dateInput: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.fdPrimary + '30',
    borderRadius: BorderRadius.lg,
    padding: 14,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  dateText: { fontSize: 16, color: Colors.text, flex: 1, fontWeight: '500' },

  selectorBtn: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.fdPrimary + '30',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md, minHeight: 54,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  selectorName: { fontSize: 16, fontWeight: '600', color: Colors.text },
  selectorDetail: { fontSize: 14, color: Colors.fdSecondary, marginTop: 2 },
  selectorPlaceholder: { color: Colors.fdSecondary, fontSize: 16, flex: 1, fontStyle: 'italic' },

  estimateCard: {
    backgroundColor: Colors.fdPrimary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg, marginBottom: Spacing.lg,
    alignItems: 'center',
    shadowColor: Colors.fdPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  estimateIconWrap: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  estimateLabel: { fontSize: 14, fontWeight: '600', color: 'rgba(255, 255, 255, 0.9)', marginTop: Spacing.sm },
  estimateValue: { fontSize: 32, fontWeight: '800', color: Colors.textDark, marginTop: Spacing.xs },

  submitBtn: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    backgroundColor: Colors.fdPrimary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg, marginBottom: Spacing.lg,
    shadowColor: Colors.fdPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: Colors.textDark, fontSize: 16, fontWeight: '700' },
});

export default AgreementCreateScreen;
