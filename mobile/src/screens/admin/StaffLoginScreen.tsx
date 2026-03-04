import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius, Shadow3D } from '../../theme';
import { useAuth } from '../../hooks/useAuth';
import { AuthStackParamList } from '../../navigation/AuthStack';

const DEFAULT_TENANT_ID = process.env.EXPO_PUBLIC_DEFAULT_TENANT_ID || '00000000-0000-0000-0000-000000000001';

const StaffLoginScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { staffLogin } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tenantId, setTenantId] = useState(DEFAULT_TENANT_ID);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = useCallback(async () => {
    if (!email.trim() || !password.trim()) { setError('Please enter email and password'); return; }
    if (!tenantId.trim()) { setError('Tenant ID is required'); return; }
    setLoading(true);
    setError('');
    try {
      await staffLogin(email.trim(), password, tenantId.trim());
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }, [email, password, tenantId, staffLogin]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <MaterialCommunityIcons name="shield-account" size={40} color={Colors.textDark} />
          </View>
          <Text style={styles.title}>Staff Login</Text>
          <Text style={styles.subtitle}>Sign in with your email and password</Text>
        </View>

        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={16} color={Colors.error} />
            <Text style={styles.errorText}> {error}</Text>
          </View>
        ) : null}

        <View style={styles.form}>
          {/* Email */}
          <Text style={styles.label}>Email</Text>
          <View style={styles.inputWrap}>
            <MaterialCommunityIcons name="email-outline" size={20} color={Colors.textLight} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="admin@company.com"
              placeholderTextColor={Colors.textLight}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Password */}
          <Text style={[styles.label, { marginTop: Spacing.xl }]}>Password</Text>
          <View style={styles.inputWrap}>
            <MaterialCommunityIcons name="lock-outline" size={20} color={Colors.textLight} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              placeholderTextColor={Colors.textLight}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
              <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color={Colors.textLight} />
            </TouchableOpacity>
          </View>

          {/* Tenant ID */}
          <Text style={[styles.label, { marginTop: Spacing.xl }]}>Tenant ID</Text>
          <View style={styles.inputWrap}>
            <MaterialCommunityIcons name="domain" size={20} color={Colors.textLight} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={tenantId}
              onChangeText={setTenantId}
              placeholder="Enter your company's tenant ID"
              placeholderTextColor={Colors.textLight}
              autoCapitalize="none"
            />
          </View>

          {/* Sign In Button */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={Colors.textDark} />
            ) : (
              <>
                <Ionicons name="log-in" size={20} color={Colors.textDark} />
                <Text style={styles.buttonText}> Sign In</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Switch to Customer Login */}
          <TouchableOpacity style={styles.switchLink} onPress={() => navigation.navigate('Login')}>
            <MaterialCommunityIcons name="cellphone" size={16} color={Colors.primary} />
            <Text style={styles.link}> Customer Login (Phone + OTP)</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  header: { alignItems: 'center', marginBottom: Spacing.xxl },
  logoContainer: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: Spacing.lg,
    ...Shadow3D.fab,
  },
  title: { ...Typography.h1, color: Colors.textGold, marginBottom: Spacing.sm },
  subtitle: { fontSize: 16, color: Colors.textSecondary, textAlign: 'center' },
  form: {},
  label: { fontSize: 14, fontWeight: '600', color: Colors.textGold, marginBottom: Spacing.sm },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surface,
  },
  inputIcon: { marginLeft: Spacing.md },
  input: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.textDark,
  },
  eyeBtn: { padding: Spacing.md },
  button: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: 16,
    alignItems: 'center', justifyContent: 'center',
    marginTop: Spacing.xl,
    ...Shadow3D.button,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { fontSize: 16, color: Colors.textDark, fontWeight: '700' },
  errorContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.error + '15',
    borderWidth: 1, borderColor: Colors.error + '30',
    borderRadius: BorderRadius.md,
    padding: Spacing.md, marginBottom: Spacing.lg,
  },
  errorText: { fontSize: 14, color: Colors.error, flex: 1 },
  switchLink: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    marginTop: Spacing.xl, paddingBottom: Spacing.lg,
  },
  link: { fontSize: 14, color: Colors.primary, fontWeight: '700' },
});

export default StaffLoginScreen;
