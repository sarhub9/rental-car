import React, { useState, useCallback } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, Typography, BorderRadius } from '../../theme';
import AdminApiService from '../../services/admin-api.service';

const ROLES = [
  { label: 'Owner Admin', value: 'OWNER_ADMIN' },
  { label: 'Front Desk', value: 'FRONT_DESK' },
  { label: 'Fleet Manager', value: 'FLEET_MANAGER' },
  { label: 'Accounts', value: 'ACCOUNTS' },
  { label: 'Driver/Recovery', value: 'DRIVER_RECOVERY' },
];

const UserCreateScreen: React.FC = () => {
  const navigation = useNavigation();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('FRONT_DESK');
  const [loading, setLoading] = useState(false);

  const handleCreate = useCallback(async () => {
    if (!fullName.trim() || !email.trim() || !phoneNumber.trim() || !password.trim()) {
      Alert.alert('Validation', 'All fields are required');
      return;
    }

    setLoading(true);
    try {
      await AdminApiService.createUser({
        full_name: fullName.trim(),
        email: email.trim(),
        phone_number: phoneNumber.trim(),
        role,
        password,
      });
      Alert.alert('Success', 'User created successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      const message = err?.response?.data?.error || 'Failed to create user';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  }, [fullName, email, phoneNumber, password, role, navigation]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.label}>Full Name</Text>
      <TextInput
        style={styles.input}
        value={fullName}
        onChangeText={setFullName}
        placeholder="John Doe"
        placeholderTextColor={Colors.textLight}
      />

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="john@company.com"
        placeholderTextColor={Colors.textLight}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Text style={styles.label}>Phone Number</Text>
      <TextInput
        style={styles.input}
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        placeholder="+971501234567"
        placeholderTextColor={Colors.textLight}
        keyboardType="phone-pad"
      />

      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        placeholder="Minimum 8 characters"
        placeholderTextColor={Colors.textLight}
        secureTextEntry
      />

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
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleCreate}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={Colors.textWhite} />
        ) : (
          <Text style={styles.buttonText}>Create User</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  contentContainer: { padding: Spacing.lg },
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
});

export default UserCreateScreen;
