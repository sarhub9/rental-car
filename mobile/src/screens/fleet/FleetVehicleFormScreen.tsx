import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Spacing, Typography, BorderRadius } from '../../theme';
import VehicleApiService from '../../services/vehicle-api.service';
import { FleetManagerStackParamList } from '../../types';

type NavProp = NativeStackNavigationProp<FleetManagerStackParamList>;

const Field = ({ label, value, onChangeText, keyboardType, placeholder }: {
  label: string; value: string; onChangeText: (v: string) => void; keyboardType?: any; placeholder?: string;
}) => (
  <View style={styles.fieldGroup}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType || 'default'}
      placeholder={placeholder}
      placeholderTextColor={Colors.textLight}
    />
  </View>
);

const OptionPicker = ({ label, options, selectedValue, onSelect }: {
  label: string; options: string[]; selectedValue: string; onSelect: (v: string) => void;
}) => (
  <View style={styles.fieldGroup}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.optionRow}>
      {options.map(opt => (
        <TouchableOpacity
          key={opt}
          style={[styles.optionBtn, selectedValue === opt && styles.optionBtnActive]}
          onPress={() => onSelect(opt)}
        >
          <Text style={[styles.optionText, selectedValue === opt && styles.optionTextActive]}>
            {opt}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

const EMIRATES = ['Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 'Umm Al Quwain', 'Ras Al Khaimah', 'Fujairah'];
const TRANSMISSIONS = ['AUTOMATIC', 'MANUAL'];
const FUEL_TYPES = ['PETROL', 'DIESEL', 'HYBRID', 'ELECTRIC'];

interface Props {
  mode: 'create' | 'edit';
}

const FleetVehicleFormScreen: React.FC<Props> = ({ mode }) => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteProp<FleetManagerStackParamList, 'FleetVehicleEdit'>>();
  const vehicleId = mode === 'edit' ? route.params?.vehicleId : null;

  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    make: '', model: '', year: new Date().getFullYear().toString(),
    plate_number: '', plate_emirate: 'Dubai',
    color: '', chassis_number: '',
    transmission_type: 'AUTOMATIC', fuel_type: 'PETROL',
    daily_rate: '', weekly_rate: '',
    current_odometer: '0',
    registration_expiry: '', insurance_expiry: '',
  });

  useEffect(() => {
    if (mode === 'edit' && vehicleId) {
      VehicleApiService.getVehicle(vehicleId).then(v => {
        setForm({
          make: v.make, model: v.model, year: v.year.toString(),
          plate_number: v.plate_number, plate_emirate: v.plate_emirate,
          color: v.color || '', chassis_number: v.chassis_number || '',
          transmission_type: v.transmission_type, fuel_type: v.fuel_type,
          daily_rate: v.daily_rate?.toString() || '',
          weekly_rate: v.weekly_rate?.toString() || '',
          current_odometer: v.current_odometer?.toString() || '0',
          registration_expiry: v.registration_expiry || '',
          insurance_expiry: v.insurance_expiry || '',
        });
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [mode, vehicleId]);

  const update = useCallback((key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = async () => {
    if (!form.make.trim() || !form.model.trim() || !form.plate_number.trim()) {
      Alert.alert('Error', 'Make, Model, and Plate Number are required');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        make: form.make.trim(),
        model: form.model.trim(),
        year: parseInt(form.year, 10),
        plate_number: form.plate_number.trim(),
        plate_emirate: form.plate_emirate,
        color: form.color.trim() || undefined,
        chassis_number: form.chassis_number.trim() || undefined,
        transmission_type: form.transmission_type,
        fuel_type: form.fuel_type,
        daily_rate: form.daily_rate ? parseFloat(form.daily_rate) : undefined,
        weekly_rate: form.weekly_rate ? parseFloat(form.weekly_rate) : undefined,
        current_odometer: parseInt(form.current_odometer, 10) || 0,
        registration_expiry: form.registration_expiry || undefined,
        insurance_expiry: form.insurance_expiry || undefined,
      };

      if (mode === 'edit' && vehicleId) {
        await VehicleApiService.updateVehicle(vehicleId, payload as any);
      } else {
        await VehicleApiService.createVehicle(payload);
      }

      Alert.alert('Success', `Vehicle ${mode === 'edit' ? 'updated' : 'created'} successfully`);
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || `Failed to ${mode} vehicle`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Field label="Make *" value={form.make} onChangeText={(v) => update('make', v)} placeholder="e.g. Toyota" />
      <Field label="Model *" value={form.model} onChangeText={(v) => update('model', v)} placeholder="e.g. Camry" />
      <Field label="Year" value={form.year} onChangeText={(v) => update('year', v)} keyboardType="numeric" />
      <Field label="Plate Number *" value={form.plate_number} onChangeText={(v) => update('plate_number', v)} placeholder="e.g. A 12345" />
      <OptionPicker label="Plate Emirate" options={EMIRATES} selectedValue={form.plate_emirate} onSelect={(v) => update('plate_emirate', v)} />
      <Field label="Color" value={form.color} onChangeText={(v) => update('color', v)} placeholder="e.g. White" />
      <Field label="Chassis Number" value={form.chassis_number} onChangeText={(v) => update('chassis_number', v)} />
      <OptionPicker label="Transmission" options={TRANSMISSIONS} selectedValue={form.transmission_type} onSelect={(v) => update('transmission_type', v)} />
      <OptionPicker label="Fuel Type" options={FUEL_TYPES} selectedValue={form.fuel_type} onSelect={(v) => update('fuel_type', v)} />
      <Field label="Daily Rate (AED)" value={form.daily_rate} onChangeText={(v) => update('daily_rate', v)} keyboardType="decimal-pad" />
      <Field label="Weekly Rate (AED)" value={form.weekly_rate} onChangeText={(v) => update('weekly_rate', v)} keyboardType="decimal-pad" />
      <Field label="Current Odometer (km)" value={form.current_odometer} onChangeText={(v) => update('current_odometer', v)} keyboardType="numeric" />

      <TouchableOpacity
        style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color={Colors.textWhite} />
        ) : (
          <Text style={styles.saveBtnText}>{mode === 'edit' ? 'Update Vehicle' : 'Create Vehicle'}</Text>
        )}
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
    </KeyboardAvoidingView>
  );
};

export const FleetVehicleCreateScreen: React.FC = () => <FleetVehicleFormScreen mode="create" />;
export const FleetVehicleEditScreen: React.FC = () => <FleetVehicleFormScreen mode="edit" />;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: Spacing.lg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  fieldGroup: { marginBottom: Spacing.lg },
  label: { ...Typography.label, color: Colors.text, marginBottom: Spacing.sm },
  input: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    ...Typography.body, color: Colors.text,
  },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  optionBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.round, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border },
  optionBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  optionText: { ...Typography.caption, color: Colors.textSecondary },
  optionTextActive: { color: Colors.textWhite, fontWeight: '600' },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingVertical: Spacing.lg, alignItems: 'center', marginTop: Spacing.md },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { ...Typography.body, color: Colors.textWhite, fontWeight: '600' },
});
