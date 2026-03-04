import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Platform, ActivityIndicator, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography, BorderRadius, Shadow3D } from '../theme';
import { useAuth } from '../hooks/useAuth';
import { AuthStackParamList } from '../navigation/AuthStack';

type LoginStep = 'PHONE_INPUT' | 'OTP_INPUT';

const DEFAULT_TENANT_ID = process.env.EXPO_PUBLIC_DEFAULT_TENANT_ID || '00000000-0000-0000-0000-000000000001';

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const { requestOtp, verifyOtp } = useAuth();

  const [step, setStep] = useState<LoginStep>('PHONE_INPUT');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [tenantId, setTenantId] = useState(DEFAULT_TENANT_ID);
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [devOtp, setDevOtp] = useState('');

  const otpRefs = useRef<(TextInput | null)[]>([]);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (countdown > 0) {
      countdownRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (countdownRef.current) clearInterval(countdownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, [countdown]);

  const formatPhone = (phone: string): string => {
    if (phone.startsWith('+')) return phone;
    if (phone.startsWith('0')) return `+971${phone.substring(1)}`;
    return `+971${phone}`;
  };

  const handleRequestOtp = useCallback(async () => {
    if (!phoneNumber.trim()) { setError('Please enter your phone number'); return; }
    if (!tenantId.trim()) { setError('Tenant ID is required'); return; }
    setLoading(true);
    setError('');
    try {
      const formattedPhone = formatPhone(phoneNumber.trim());
      const result = await requestOtp(formattedPhone, tenantId.trim());
      setCountdown(result.expires_in_seconds);
      if (result.otp_code) setDevOtp(result.otp_code);
      setStep('OTP_INPUT');
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  }, [phoneNumber, tenantId, requestOtp]);

  const handleOtpChange = useCallback((index: number, value: string) => {
    if (value.length > 1) {
      const digits = value.replace(/[^0-9]/g, '').split('').slice(0, 6);
      const newOtp = [...otpDigits];
      digits.forEach((d, i) => { if (index + i < 6) newOtp[index + i] = d; });
      setOtpDigits(newOtp);
      otpRefs.current[Math.min(index + digits.length, 5)]?.focus();
      return;
    }
    const digit = value.replace(/[^0-9]/g, '');
    const newOtp = [...otpDigits];
    newOtp[index] = digit;
    setOtpDigits(newOtp);
    if (digit && index < 5) otpRefs.current[index + 1]?.focus();
  }, [otpDigits]);

  const handleOtpKeyPress = useCallback((index: number, key: string) => {
    if (key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
      const newOtp = [...otpDigits];
      newOtp[index - 1] = '';
      setOtpDigits(newOtp);
    }
  }, [otpDigits]);

  useEffect(() => {
    const code = otpDigits.join('');
    if (code.length === 6 && !loading) handleVerifyOtp(code);
  }, [otpDigits]);

  const handleVerifyOtp = useCallback(async (code?: string) => {
    const otpCode = code || otpDigits.join('');
    if (otpCode.length !== 6) { setError('Please enter all 6 digits'); return; }
    setLoading(true);
    setError('');
    try {
      await verifyOtp(formatPhone(phoneNumber.trim()), tenantId.trim(), otpCode);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Verification failed');
      setOtpDigits(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }, [otpDigits, phoneNumber, tenantId, verifyOtp]);

  const handleResendOtp = useCallback(async () => {
    if (countdown > 0) return;
    setOtpDigits(['', '', '', '', '', '']);
    setError('');
    await handleRequestOtp();
  }, [countdown, handleRequestOtp]);

  const handleChangeNumber = useCallback(() => {
    setStep('PHONE_INPUT');
    setOtpDigits(['', '', '', '', '', '']);
    setError('');
    setCountdown(0);
    setDevOtp('');
  }, []);

  const formatCountdown = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

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
            <MaterialCommunityIcons name="car-key" size={38} color={Colors.textDark} />
          </View>
          <Text style={styles.title}>Rental Customer</Text>
          <Text style={styles.subtitle}>
            {step === 'PHONE_INPUT'
              ? 'Sign in with your phone number'
              : 'Enter the verification code'}
          </Text>
        </View>

        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={16} color={Colors.error} />
            <Text style={styles.errorText}> {error}</Text>
          </View>
        ) : null}

        {step === 'PHONE_INPUT' ? (
          <View style={styles.form}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.phoneInputRow}>
              <View style={styles.countryCode}>
                <Text style={styles.countryCodeText}>+971</Text>
              </View>
              <TextInput
                style={styles.phoneInput}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="50 123 4567"
                placeholderTextColor={Colors.textLight}
                keyboardType="phone-pad"
                maxLength={15}
                autoFocus
              />
            </View>

            <Text style={[styles.label, { marginTop: Spacing.xl }]}>Tenant ID</Text>
            <View style={styles.inputWrap}>
              <MaterialCommunityIcons name="domain" size={20} color={Colors.textLight} style={{ marginLeft: Spacing.md }} />
              <TextInput
                style={styles.input}
                value={tenantId}
                onChangeText={setTenantId}
                placeholder="Enter your company's tenant ID"
                placeholderTextColor={Colors.textLight}
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleRequestOtp}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={Colors.textDark} />
              ) : (
                <>
                  <Ionicons name="send" size={18} color={Colors.textDark} />
                  <Text style={styles.buttonText}> Request OTP</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.staffLoginLink}
              onPress={() => navigation.navigate('StaffLogin')}
            >
              <MaterialCommunityIcons name="shield-account" size={16} color={Colors.primary} />
              <Text style={styles.link}> Staff Login (Email + Password)</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.form}>
            <Text style={styles.otpInfo}>
              Code sent to {formatPhone(phoneNumber.trim())}
            </Text>

            {devOtp ? (
              <View style={styles.devOtpContainer}>
                <MaterialCommunityIcons name="bug" size={16} color={Colors.primary} />
                <Text style={styles.devOtpLabel}> DEV MODE - OTP:</Text>
                <Text style={styles.devOtpCode}>{devOtp}</Text>
              </View>
            ) : null}

            <View style={styles.otpRow}>
              {otpDigits.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => { otpRefs.current[index] = ref; }}
                  style={[styles.otpInput, digit ? styles.otpInputFilled : null]}
                  value={digit}
                  onChangeText={(value) => handleOtpChange(index, value)}
                  onKeyPress={({ nativeEvent }) => handleOtpKeyPress(index, nativeEvent.key)}
                  keyboardType="number-pad"
                  maxLength={1}
                  textAlign="center"
                  selectTextOnFocus
                />
              ))}
            </View>

            <View style={styles.otpActions}>
              {countdown > 0 ? (
                <Text style={styles.countdown}>Resend in {formatCountdown(countdown)}</Text>
              ) : (
                <TouchableOpacity onPress={handleResendOtp}>
                  <Text style={styles.link}>Resend OTP</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={handleChangeNumber}>
                <Text style={styles.link}>Change Number</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={() => handleVerifyOtp()}
              disabled={loading || otpDigits.join('').length !== 6}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={Colors.textDark} />
              ) : (
                <>
                  <MaterialCommunityIcons name="check-circle" size={18} color={Colors.textDark} />
                  <Text style={styles.buttonText}> Verify</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
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
  subtitle: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center' },
  form: {},
  label: { ...Typography.label, color: Colors.textGold, marginBottom: Spacing.sm },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surface,
  },
  input: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 16,
    color: Colors.textDark,
  },
  phoneInputRow: { flexDirection: 'row', alignItems: 'center' },
  countryCode: {
    borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    marginRight: Spacing.sm,
    backgroundColor: Colors.surface,
  },
  countryCodeText: { fontSize: 16, color: Colors.primary, fontWeight: '700' },
  phoneInput: {
    flex: 1,
    borderWidth: 1, borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    fontSize: 16,
    color: Colors.textDark,
    backgroundColor: Colors.surface,
  },
  button: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
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
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  errorText: { fontSize: 14, color: Colors.error, flex: 1 },
  otpInfo: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xl },
  devOtpContainer: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    backgroundColor: Colors.primary + '15',
    borderRadius: BorderRadius.md, padding: Spacing.sm,
    marginBottom: Spacing.lg,
    borderWidth: 1, borderColor: Colors.primary + '30',
  },
  devOtpLabel: { fontSize: 12, color: Colors.primary, marginRight: Spacing.sm },
  devOtpCode: { fontSize: 18, fontWeight: '700', color: Colors.primary, letterSpacing: 4 },
  otpRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xl },
  otpInput: {
    width: 48, height: 56,
    borderWidth: 2, borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    fontSize: 22, fontWeight: '700',
    color: Colors.textDark,
    backgroundColor: Colors.surface,
  },
  otpInputFilled: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  otpActions: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.lg },
  countdown: { fontSize: 14, color: Colors.textLight },
  link: { fontSize: 14, color: Colors.primary, fontWeight: '700' },
  staffLoginLink: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: Spacing.xl, paddingBottom: Spacing.lg },
});

export default LoginScreen;
