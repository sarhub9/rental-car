import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { Colors, Spacing, Typography, BorderRadius } from '../../theme';
import { useAuth } from '../../hooks/useAuth';
import { UserProfile } from '../../types';
import CustomerPortalApiService from '../../services/customer-portal-api.service';

const ProfileScreen: React.FC = () => {
  const { user, logout } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Editable fields
  const [fullNameEn, setFullNameEn] = useState('');
  const [fullNameAr, setFullNameAr] = useState('');
  const [email, setEmail] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [emirate, setEmirate] = useState('');

  const loadProfile = useCallback(async () => {
    try {
      const data = await CustomerPortalApiService.getProfile();
      setProfile(data);
      // Populate editable fields
      setFullNameEn(data.customer?.full_name_en || data.full_name || '');
      setFullNameAr(data.customer?.full_name_ar || '');
      setEmail(data.customer?.email || data.email || '');
      setAddressLine1(data.customer?.address_line_1 || '');
      setAddressLine2(data.customer?.address_line_2 || '');
      setCity(data.customer?.city || '');
      setEmirate(data.customer?.emirate || '');
      setDirty(false);
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleSave = async () => {
    if (!dirty) return;

    setSaving(true);
    try {
      await CustomerPortalApiService.updateProfile({
        full_name_en: fullNameEn,
        full_name_ar: fullNameAr || undefined,
        email: email || undefined,
        address_line_1: addressLine1 || undefined,
        address_line_2: addressLine2 || undefined,
        city: city || undefined,
        emirate: emirate || undefined,
      });
      setDirty(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadProfile();
  }, [loadProfile]);

  const markDirty = (setter: (v: string) => void) => (value: string) => {
    setter(value);
    setDirty(true);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const customer = profile?.customer;
  const licenseExpiring = customer?.license_expiry_date
    ? new Date(customer.license_expiry_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    : false;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Avatar */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {fullNameEn.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.userName}>{fullNameEn}</Text>
        <Text style={styles.customerNumber}>{customer?.customer_number || ''}</Text>
      </View>

      {/* Editable Fields */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Personal Information</Text>

        <FieldInput label="Full Name (English)" value={fullNameEn} onChangeText={markDirty(setFullNameEn)} />
        <FieldInput label="Full Name (Arabic)" value={fullNameAr} onChangeText={markDirty(setFullNameAr)} placeholder="Optional" />
        <FieldInput label="Email" value={email} onChangeText={markDirty(setEmail)} keyboardType="email-address" />
      </View>

      {/* Read-only Fields */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Identity</Text>
        <ReadOnlyField label="Phone Number" value={profile?.phone_number || ''} note="Contact support to change" />
        <ReadOnlyField label="Emirates ID" value={customer?.emirates_id || '-'} />
        <ReadOnlyField label="Driving License" value={customer?.driving_license_number || '-'} />
        <ReadOnlyField
          label="License Expiry"
          value={customer?.license_expiry_date ? new Date(customer.license_expiry_date).toLocaleDateString() : '-'}
          warning={licenseExpiring ? 'Expiring soon!' : undefined}
        />
      </View>

      {/* Address Fields */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Address</Text>
        <FieldInput label="Address Line 1" value={addressLine1} onChangeText={markDirty(setAddressLine1)} />
        <FieldInput label="Address Line 2" value={addressLine2} onChangeText={markDirty(setAddressLine2)} placeholder="Optional" />
        <FieldInput label="City" value={city} onChangeText={markDirty(setCity)} />
        <FieldInput label="Emirate" value={emirate} onChangeText={markDirty(setEmirate)} />
      </View>

      {/* Save Button */}
      {dirty ? (
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={Colors.textWhite} />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      ) : null}

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>

      <View style={{ height: Spacing.xxl }} />
    </ScrollView>
  );
};

// Sub-components
const FieldInput: React.FC<{
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address';
}> = ({ label, value, onChangeText, placeholder, keyboardType }) => (
  <View style={styles.fieldContainer}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <TextInput
      style={styles.fieldInput}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={Colors.textLight}
      keyboardType={keyboardType || 'default'}
    />
  </View>
);

const ReadOnlyField: React.FC<{
  label: string;
  value: string;
  note?: string;
  warning?: string;
}> = ({ label, value, note, warning }) => (
  <View style={styles.fieldContainer}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <View style={styles.readOnlyField}>
      <Text style={styles.readOnlyValue}>{value}</Text>
      {note ? <Text style={styles.readOnlyNote}>{note}</Text> : null}
      {warning ? <Text style={styles.warningText}>{warning}</Text> : null}
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    backgroundColor: Colors.background,
  },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatarText: { ...Typography.h1, color: Colors.textWhite },
  userName: { ...Typography.h2, color: Colors.text },
  customerNumber: { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: Spacing.xs },
  section: {
    backgroundColor: Colors.background,
    margin: Spacing.lg,
    marginBottom: 0,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  sectionTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    paddingBottom: Spacing.sm,
  },
  fieldContainer: { marginBottom: Spacing.lg },
  fieldLabel: { ...Typography.label, color: Colors.textSecondary, marginBottom: Spacing.sm },
  fieldInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    ...Typography.body,
    color: Colors.text,
  },
  readOnlyField: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  readOnlyValue: { ...Typography.body, color: Colors.textSecondary },
  readOnlyNote: { ...Typography.caption, color: Colors.textLight, marginTop: Spacing.xs },
  warningText: { ...Typography.caption, color: Colors.warning, marginTop: Spacing.xs, fontWeight: '600' },
  saveButton: {
    backgroundColor: Colors.primary,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  saveButtonText: { ...Typography.body, color: Colors.textWhite, fontWeight: '600' },
  logoutButton: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.error,
    alignItems: 'center',
  },
  logoutText: { ...Typography.body, color: Colors.error },
});

export default ProfileScreen;
