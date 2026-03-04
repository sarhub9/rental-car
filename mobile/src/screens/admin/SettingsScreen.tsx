import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '../../theme';
import AdminApiService from '../../services/admin-api.service';

interface TenantSettings {
  km_allowance_per_day: number;
  rate_per_extra_km: number;
  fuel_refill_rate: number;
  late_fee_per_hour: number;
  grace_period_minutes: number;
}

const SettingsScreen: React.FC = () => {
  const [settings, setSettings] = useState<TenantSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editable fields
  const [kmAllowance, setKmAllowance] = useState('');
  const [extraKmRate, setExtraKmRate] = useState('');
  const [fuelRefillRate, setFuelRefillRate] = useState('');
  const [lateFeePerHour, setLateFeePerHour] = useState('');
  const [gracePeriod, setGracePeriod] = useState('');

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await AdminApiService.getSettings();
        setSettings(data);
        setKmAllowance(String(data.km_allowance_per_day));
        setExtraKmRate(String(data.rate_per_extra_km));
        setFuelRefillRate(String(data.fuel_refill_rate));
        setLateFeePerHour(String(data.late_fee_per_hour));
        setGracePeriod(String(data.grace_period_minutes));
      } catch (err) {
        Alert.alert('Error', 'Failed to load settings');
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const updates: any = {};
      const km = parseInt(kmAllowance, 10);
      const ekr = parseFloat(extraKmRate);
      const frr = parseFloat(fuelRefillRate);
      const lfph = parseFloat(lateFeePerHour);
      const gp = parseInt(gracePeriod, 10);

      if (km !== settings?.km_allowance_per_day) updates.km_allowance_per_day = km;
      if (ekr !== settings?.rate_per_extra_km) updates.rate_per_extra_km = ekr;
      if (frr !== settings?.fuel_refill_rate) updates.fuel_refill_rate = frr;
      if (lfph !== settings?.late_fee_per_hour) updates.late_fee_per_hour = lfph;
      if (gp !== settings?.grace_period_minutes) updates.grace_period_minutes = gp;

      if (Object.keys(updates).length === 0) {
        Alert.alert('Info', 'No changes to save');
        return;
      }

      const updated = await AdminApiService.updateSettings(updates);
      setSettings(updated);
      Alert.alert('Success', 'Settings updated successfully');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  }, [kmAllowance, extraKmRate, fuelRefillRate, lateFeePerHour, gracePeriod, settings]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.header}>Tenant Rules</Text>
      <Text style={styles.headerSubtitle}>
        These rules control how charges are automatically calculated for rental agreements.
      </Text>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>KM Allowance Per Day</Text>
        <TextInput
          style={styles.input}
          value={kmAllowance}
          onChangeText={setKmAllowance}
          keyboardType="numeric"
        />
        <Text style={styles.hint}>Maximum kilometers per day before extra charges</Text>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Rate Per Extra KM (AED)</Text>
        <TextInput
          style={styles.input}
          value={extraKmRate}
          onChangeText={setExtraKmRate}
          keyboardType="decimal-pad"
        />
        <Text style={styles.hint}>Charge per kilometer over the daily allowance</Text>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Fuel Refill Rate (AED)</Text>
        <TextInput
          style={styles.input}
          value={fuelRefillRate}
          onChangeText={setFuelRefillRate}
          keyboardType="decimal-pad"
        />
        <Text style={styles.hint}>Cost per full tank refill charge</Text>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Late Fee Per Hour (AED)</Text>
        <TextInput
          style={styles.input}
          value={lateFeePerHour}
          onChangeText={setLateFeePerHour}
          keyboardType="decimal-pad"
        />
        <Text style={styles.hint}>Charge per hour for late returns</Text>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Grace Period (Minutes)</Text>
        <TextInput
          style={styles.input}
          value={gracePeriod}
          onChangeText={setGracePeriod}
          keyboardType="numeric"
        />
        <Text style={styles.hint}>Time after expected return before late fees apply</Text>
      </View>

      <TouchableOpacity
        style={[styles.button, saving && styles.buttonDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color={Colors.textWhite} />
        ) : (
          <Text style={styles.buttonText}>Save Settings</Text>
        )}
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  contentContainer: { padding: Spacing.lg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { ...Typography.h2, color: Colors.text },
  headerSubtitle: { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: Spacing.sm, marginBottom: Spacing.xl },
  fieldGroup: { marginBottom: Spacing.lg },
  label: { ...Typography.label, color: Colors.text, marginBottom: Spacing.sm },
  input: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    ...Typography.body, color: Colors.text,
  },
  hint: { ...Typography.caption, color: Colors.textLight, marginTop: Spacing.xs },
  button: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg, alignItems: 'center', marginTop: Spacing.xl,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { ...Typography.body, color: Colors.textWhite, fontWeight: '600' },
});

export default SettingsScreen;
