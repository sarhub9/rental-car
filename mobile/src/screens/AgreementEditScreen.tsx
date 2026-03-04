import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Alert, ActivityIndicator, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAgreementLifecycle } from '../hooks/useAgreementLifecycle';
import { Colors, Spacing, BorderRadius, Shadow3D } from '../theme';

const AgreementEditScreen = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { agreementId } = route.params;
  const { agreement, loadAgreement, updateDraft, loading, error } = useAgreementLifecycle();

  const [formData, setFormData] = useState({
    rental_start_datetime: new Date(),
    rental_end_datetime: new Date(),
    daily_rate: '',
    weekly_rate: '',
  });
  const [pickerTarget, setPickerTarget] = useState<'start' | 'end' | null>(null);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');
  const [tempDate, setTempDate] = useState<Date>(new Date());
  const [estimatedAmount, setEstimatedAmount] = useState<number>(0);

  useEffect(() => { loadAgreementData(); }, [agreementId]);

  const loadAgreementData = async () => {
    try {
      const agr = await loadAgreement(agreementId);
      if (agr) {
        setFormData({
          rental_start_datetime: new Date(agr.rental_start_datetime),
          rental_end_datetime: new Date(agr.rental_end_datetime),
          daily_rate: agr.daily_rate ? agr.daily_rate.toString() : '',
          weekly_rate: agr.weekly_rate ? agr.weekly_rate.toString() : '',
        });
        setEstimatedAmount(Number(agr.estimated_amount) || 0);
      }
    } catch {
      Alert.alert('Error', 'Failed to load agreement');
    }
  };

  useEffect(() => { calculateEstimate(); }, [formData.rental_start_datetime, formData.rental_end_datetime, formData.daily_rate, formData.weekly_rate]);

  const calculateEstimate = () => {
    const start = formData.rental_start_datetime;
    const end = formData.rental_end_datetime;
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (days <= 0) {
      setEstimatedAmount(0);
      return;
    }
    const dailyRate = parseFloat(formData.daily_rate) || 0;
    const weeklyRate = parseFloat(formData.weekly_rate) || 0;
    let amount = 0;
    if (weeklyRate > 0 && days >= 7) {
      const weeks = Math.floor(days / 7);
      const remainingDays = days % 7;
      amount = weeks * weeklyRate + remainingDays * (dailyRate || weeklyRate / 7);
    } else if (dailyRate > 0) {
      amount = days * dailyRate;
    }
    setEstimatedAmount(Number(amount.toFixed(2)));
  };

  const handleSubmit = async () => {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      if (formData.rental_start_datetime < oneHourAgo) {
        Alert.alert(
          'Validation Error',
          'Start date cannot be more than 1 hour in the past. Please choose a newer start time.'
        );
        return;
      }

      if (formData.rental_end_datetime <= formData.rental_start_datetime) {
        Alert.alert('Validation Error', 'End date must be after start date.');
        return;
      }

      const data: Record<string, unknown> = {
        rental_start_datetime: formData.rental_start_datetime.toISOString(),
        rental_end_datetime: formData.rental_end_datetime.toISOString(),
      };
      if (formData.daily_rate) data.daily_rate = parseFloat(formData.daily_rate);
      if (formData.weekly_rate) data.weekly_rate = parseFloat(formData.weekly_rate);
      await updateDraft(agreementId, data);
      Alert.alert('Success', 'Agreement updated', [
        { text: 'OK', onPress: () => navigation.navigate('AgreementView', { agreementId }) },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  if (loading && !agreement) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (agreement && agreement.status !== 'DRAFT') {
    return (
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons name="lock" size={48} color={Colors.error} />
        <Text style={styles.errorBigText}>Only DRAFT agreements can be edited</Text>
      </View>
    );
  }

  const bottomPad = Math.max(insets.bottom, 34) + 40;
  const safeEstimatedAmount = Number.isFinite(estimatedAmount) ? estimatedAmount : 0;

  return (
    <View style={styles.safeArea}>
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: bottomPad }}>
      <View style={styles.headerCard}>
        <MaterialCommunityIcons name="file-document-edit-outline" size={30} color={Colors.fdPrimary} />
        <Text style={styles.title}>Edit Agreement</Text>
        {agreement && (
          <Text style={styles.subtitle}>{agreement.agreement_number}</Text>
        )}
      </View>

      {error && (
        <View style={styles.errorWrap}>
          <Text style={styles.error}>{error}</Text>
        </View>
      )}

      {/* Start Date */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>
          <MaterialCommunityIcons name="calendar-start" size={14} color={Colors.fdPrimary} /> Start Date & Time
        </Text>
        <TouchableOpacity style={styles.dateInput} onPress={() => { setPickerTarget('start'); setTempDate(formData.rental_start_datetime); setPickerMode('date'); }}>
          <MaterialCommunityIcons name="calendar-clock" size={20} color={Colors.fdPrimary} />
          <Text style={styles.dateText}>  {formData.rental_start_datetime.toLocaleString()}</Text>
        </TouchableOpacity>
      </View>

      {/* End Date */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>
          <MaterialCommunityIcons name="calendar-end" size={14} color={Colors.fdPrimary} /> End Date & Time
        </Text>
        <TouchableOpacity style={styles.dateInput} onPress={() => { setPickerTarget('end'); setTempDate(formData.rental_end_datetime); setPickerMode('date'); }}>
          <MaterialCommunityIcons name="calendar-clock" size={20} color={Colors.fdPrimary} />
          <Text style={styles.dateText}>  {formData.rental_end_datetime.toLocaleString()}</Text>
        </TouchableOpacity>
      </View>

      {/* Android DateTimePicker */}
      {pickerTarget && (
        <DateTimePicker
          value={pickerMode === 'date' ? (pickerTarget === 'start' ? formData.rental_start_datetime : formData.rental_end_datetime) : tempDate}
          mode={pickerMode}
          display="default"
          minimumDate={pickerTarget === 'end' ? formData.rental_start_datetime : undefined}
          onChange={(_, selectedDate) => {
            if (!selectedDate) { setPickerTarget(null); return; }
            if (Platform.OS === 'android') {
              if (pickerMode === 'date') {
                setTempDate(selectedDate);
                setPickerMode('time');
              } else {
                const finalDate = new Date(tempDate);
                finalDate.setHours(selectedDate.getHours(), selectedDate.getMinutes());
                const key = pickerTarget === 'start' ? 'rental_start_datetime' : 'rental_end_datetime';
                setFormData((prev) => ({ ...prev, [key]: finalDate }));
                setPickerTarget(null);
              }
            } else {
              const key = pickerTarget === 'start' ? 'rental_start_datetime' : 'rental_end_datetime';
              setFormData((prev) => ({ ...prev, [key]: selectedDate }));
            }
          }}
        />
      )}

      {/* Daily Rate */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>
          <MaterialCommunityIcons name="cash" size={14} color={Colors.fdPrimary} /> Daily Rate (AED)
        </Text>
        <View style={styles.inputWrap}>
          <Text style={styles.inputPrefix}>AED</Text>
          <TextInput
            style={styles.input}
            value={formData.daily_rate}
            onChangeText={(v) => setFormData((prev) => ({ ...prev, daily_rate: v }))}
            placeholder="150.00"
            placeholderTextColor={Colors.textLight}
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
            value={formData.weekly_rate}
            onChangeText={(v) => setFormData((prev) => ({ ...prev, weekly_rate: v }))}
            placeholder="900.00"
            placeholderTextColor={Colors.textLight}
            keyboardType="decimal-pad"
          />
        </View>
      </View>

      {/* Estimate */}
      <View style={styles.estimateCard}>
        <MaterialCommunityIcons name="calculator" size={22} color={Colors.success} />
        <Text style={styles.estimateLabel}>Estimated Amount</Text>
        <Text style={styles.estimateValue}>AED {safeEstimatedAmount.toFixed(2)}</Text>
      </View>

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
            <MaterialCommunityIcons name="content-save" size={20} color={Colors.textDark} />
            <Text style={styles.submitBtnText}> Save Changes</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.fdBackground },
  container: { flex: 1, padding: Spacing.lg, backgroundColor: Colors.fdBackground },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.fdBackground },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.lg, backgroundColor: Colors.fdBackground },
  errorBigText: { fontSize: 18, color: Colors.error, marginTop: Spacing.md, textAlign: 'center' },
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
  title: { fontSize: 22, fontWeight: '800', color: Colors.fdPrimaryDark, marginTop: Spacing.sm },
  subtitle: { fontSize: 14, color: Colors.fdSecondary, marginTop: Spacing.xs },
  formGroup: { marginBottom: Spacing.lg },
  label: { fontSize: 14, fontWeight: '700', color: Colors.fdPrimaryDark, marginBottom: Spacing.sm },

  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.fdPrimary + '30',
    borderRadius: BorderRadius.lg,
    backgroundColor: '#FFFFFF',
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
    padding: Spacing.md,
    backgroundColor: '#FFFFFF',
  },
  dateText: { fontSize: 16, color: Colors.text },

  estimateCard: {
    backgroundColor: Colors.fdPrimary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg, marginBottom: Spacing.xl,
    alignItems: 'center',
    shadowColor: Colors.fdPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  estimateLabel: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.9)', marginTop: Spacing.sm },
  estimateValue: { fontSize: 28, fontWeight: '800', color: Colors.textDark, marginTop: Spacing.xs },

  submitBtn: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    backgroundColor: Colors.fdPrimary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg, marginBottom: Spacing.xxl,
    shadowColor: Colors.fdPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: Colors.textDark, fontSize: 16, fontWeight: '700' },

  errorWrap: {
    backgroundColor: Colors.error + '15',
    borderWidth: 1, borderColor: Colors.error + '30',
    borderRadius: BorderRadius.md,
    padding: Spacing.md, marginBottom: Spacing.lg,
  },
  error: { fontSize: 14, color: Colors.error },
});

export default AgreementEditScreen;
