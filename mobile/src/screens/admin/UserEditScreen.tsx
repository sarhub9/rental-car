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
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Colors, Spacing, Typography, BorderRadius } from '../../theme';
import AdminApiService from '../../services/admin-api.service';
import { OwnerAdminStackParamList, StaffUser } from '../../types';

type RouteType = RouteProp<OwnerAdminStackParamList, 'UserEdit'>;

const ROLES = [
  { label: 'Owner Admin', value: 'OWNER_ADMIN' },
  { label: 'Front Desk', value: 'FRONT_DESK' },
  { label: 'Fleet Manager', value: 'FLEET_MANAGER' },
  { label: 'Accounts', value: 'ACCOUNTS' },
  { label: 'Driver/Recovery', value: 'DRIVER_RECOVERY' },
];

const UserEditScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteType>();
  const { userId } = route.params;

  const [user, setUser] = useState<StaffUser | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const data = await AdminApiService.getUser(userId);
        setUser(data);
        setFullName(data.full_name || '');
        setEmail(data.email || '');
        setPhoneNumber(data.phone_number || '');
        setRole(data.role || '');
      } catch (err) {
        Alert.alert('Error', 'Failed to load user');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, [userId, navigation]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const updates: any = {};
      if (fullName !== user?.full_name) updates.full_name = fullName;
      if (email !== user?.email) updates.email = email;
      if (phoneNumber !== user?.phone_number) updates.phone_number = phoneNumber;
      if (role !== user?.role) updates.role = role;

      if (Object.keys(updates).length === 0) {
        Alert.alert('Info', 'No changes to save');
        return;
      }

      await AdminApiService.updateUser(userId, updates);
      Alert.alert('Success', 'User updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  }, [fullName, email, phoneNumber, role, user, userId, navigation]);

  const handleDeactivate = useCallback(async () => {
    Alert.alert('Confirm', 'Are you sure you want to deactivate this user?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Deactivate',
        style: 'destructive',
        onPress: async () => {
          try {
            await AdminApiService.deactivateUser(userId);
            Alert.alert('Success', 'User deactivated', [
              { text: 'OK', onPress: () => navigation.goBack() },
            ]);
          } catch (err: any) {
            Alert.alert('Error', err?.response?.data?.error || 'Failed to deactivate');
          }
        },
      },
    ]);
  }, [userId, navigation]);

  const handleActivate = useCallback(async () => {
    try {
      await AdminApiService.activateUser(userId);
      Alert.alert('Success', 'User activated');
      setUser((prev) => prev ? { ...prev, status: 'ACTIVE' } : prev);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'Failed to activate');
    }
  }, [userId]);

  const handleResetPassword = useCallback(async () => {
    Alert.alert('Confirm', 'Send password reset to this user?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Send Reset',
        onPress: async () => {
          try {
            const result = await AdminApiService.resetUserPassword(userId);
            const msg = result.reset_token
              ? `Reset token (dev): ${result.reset_token}`
              : 'Password reset link sent';
            Alert.alert('Success', msg);
          } catch (err: any) {
            Alert.alert('Error', err?.response?.data?.error || 'Failed to send reset');
          }
        },
      },
    ]);
  }, [userId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.label}>Full Name</Text>
      <TextInput style={styles.input} value={fullName} onChangeText={setFullName} />

      <Text style={styles.label}>Email</Text>
      <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

      <Text style={styles.label}>Phone Number</Text>
      <TextInput style={styles.input} value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" />

      <Text style={styles.label}>Role</Text>
      <View style={styles.roleGrid}>
        {ROLES.map((r) => (
          <TouchableOpacity
            key={r.value}
            style={[styles.roleOption, role === r.value && styles.roleOptionActive]}
            onPress={() => setRole(r.value)}
          >
            <Text style={[styles.roleOptionText, role === r.value && styles.roleOptionTextActive]}>
              {r.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.button, saving && styles.buttonDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color={Colors.textWhite} />
        ) : (
          <Text style={styles.buttonText}>Save Changes</Text>
        )}
      </TouchableOpacity>

      {/* Action buttons */}
      <View style={styles.actionsSection}>
        <Text style={styles.actionsTitle}>Account Actions</Text>

        {user?.status === 'ACTIVE' ? (
          <TouchableOpacity style={styles.dangerButton} onPress={handleDeactivate}>
            <Text style={styles.dangerButtonText}>Deactivate User</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.successButton} onPress={handleActivate}>
            <Text style={styles.successButtonText}>Activate User</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.outlineButton} onPress={handleResetPassword}>
          <Text style={styles.outlineButtonText}>Send Password Reset</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  contentContainer: { padding: Spacing.lg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  label: { ...Typography.label, color: Colors.text, marginBottom: Spacing.sm, marginTop: Spacing.lg },
  input: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    ...Typography.body, color: Colors.text,
  },
  roleGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  roleOption: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border,
    marginRight: Spacing.sm, marginBottom: Spacing.sm,
  },
  roleOptionActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  roleOptionText: { ...Typography.bodySmall, color: Colors.textSecondary },
  roleOptionTextActive: { color: Colors.textWhite },
  button: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg, alignItems: 'center', marginTop: Spacing.xl,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { ...Typography.body, color: Colors.textWhite, fontWeight: '600' },
  actionsSection: { marginTop: Spacing.xxl, borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: Spacing.xl },
  actionsTitle: { ...Typography.h3, color: Colors.text, marginBottom: Spacing.lg },
  dangerButton: {
    backgroundColor: Colors.error, borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md, alignItems: 'center', marginBottom: Spacing.md,
  },
  dangerButtonText: { ...Typography.body, color: Colors.textWhite, fontWeight: '600' },
  successButton: {
    backgroundColor: Colors.success, borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md, alignItems: 'center', marginBottom: Spacing.md,
  },
  successButtonText: { ...Typography.body, color: Colors.textWhite, fontWeight: '600' },
  outlineButton: {
    borderWidth: 1, borderColor: Colors.primary, borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md, alignItems: 'center', marginBottom: Spacing.md,
  },
  outlineButtonText: { ...Typography.body, color: Colors.primary, fontWeight: '600' },
});

export default UserEditScreen;
