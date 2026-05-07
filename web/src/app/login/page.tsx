'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import {
  HiOutlineDevicePhoneMobile,
  HiOutlineEnvelope,
  HiOutlineLockClosed,
  HiOutlineBuildingOffice2,
  HiOutlineKey,
  HiOutlineTruck,
} from 'react-icons/hi2';

type LoginTab = 'customer' | 'staff';

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, requestOtp, verifyOtp, staffLogin } = useAuth();

  // Tab state
  const [activeTab, setActiveTab] = useState<LoginTab>('staff');

  // Customer login state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [requestingOtp, setRequestingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  // Staff login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  // OTP countdown timer
  useEffect(() => {
    if (otpTimer <= 0) return;
    const interval = setInterval(() => {
      setOtpTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [otpTimer]);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleRequestOtp = useCallback(async () => {
    if (!phoneNumber.trim()) {
      toast.error('Please enter your phone number');
      return;
    }

    setRequestingOtp(true);
    try {
      const fullPhone = phoneNumber.startsWith('+') ? phoneNumber : `+971${phoneNumber}`;
      await requestOtp(fullPhone, '');
      setOtpSent(true);
      setOtpTimer(120); // 2-minute countdown
      toast.success('OTP sent to your phone number');
    } catch (err: any) {
      const message =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        'Failed to send OTP. Please try again.';
      toast.error(message);

      // Dev mode: check if OTP is returned in error/response
      if (err?.response?.data?.data?.otp_code) {
        setDevOtp(err.response.data.data.otp_code);
      }
    } finally {
      setRequestingOtp(false);
    }
  }, [phoneNumber, requestOtp]);

  const handleVerifyOtp = useCallback(async () => {
    if (!otpCode.trim() || otpCode.length !== 6) {
      toast.error('Please enter the 6-digit OTP');
      return;
    }

    setVerifyingOtp(true);
    try {
      const fullPhone = phoneNumber.startsWith('+') ? phoneNumber : `+971${phoneNumber}`;
      await verifyOtp(fullPhone, '', otpCode.trim());
      toast.success('Login successful!');
      router.replace('/dashboard');
    } catch (err: any) {
      const message =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        'Invalid OTP. Please try again.';
      toast.error(message);
    } finally {
      setVerifyingOtp(false);
    }
  }, [otpCode, phoneNumber, verifyOtp, router]);

  const handleStaffLogin = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!email.trim() || !password.trim()) {
        toast.error('Please fill in all fields');
        return;
      }

      setLoggingIn(true);
      try {
        await staffLogin(email.trim(), password, '');
        toast.success('Login successful!');
        router.replace('/dashboard');
      } catch (err: any) {
        const message =
          err?.response?.data?.error?.message ||
          err?.response?.data?.message ||
          'Invalid credentials. Please try again.';
        toast.error(message);
      } finally {
        setLoggingIn(false);
      }
    },
    [email, password, staffLogin, router]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#0E7490] to-[#164E63]">
        <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#0E7490] via-[#155E75] to-[#164E63] p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo / Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-4">
            <HiOutlineTruck className="w-8 h-8 text-[#0E7490]" />
          </div>
          <h1 className="text-2xl font-bold text-white">CarRental ERP</h1>
          <p className="text-white/60 text-sm mt-1">Sign in to your account</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => {
                setActiveTab('customer');
                setOtpSent(false);
                setOtpCode('');
                setDevOtp(null);
              }}
              className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${
                activeTab === 'customer'
                  ? 'text-[#0E7490] border-b-2 border-[#0E7490] bg-[#ECFEFF]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Customer Login
            </button>
            <button
              onClick={() => setActiveTab('staff')}
              className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${
                activeTab === 'staff'
                  ? 'text-[#0E7490] border-b-2 border-[#0E7490] bg-[#ECFEFF]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Staff Login
            </button>
          </div>

          <div className="p-6">
            {/* ===== Customer Login ===== */}
            {activeTab === 'customer' && (
              <div className="space-y-4">
                {!otpSent ? (
                  <>
                    {/* Phone Number */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Phone Number
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                          <HiOutlineDevicePhoneMobile className="w-5 h-5 text-gray-400" />
                        </div>
                        <div className="absolute inset-y-0 left-10 flex items-center pointer-events-none">
                          <span className="text-sm text-gray-500 font-medium">+971</span>
                        </div>
                        <input
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) =>
                            setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))
                          }
                          placeholder="5XXXXXXXX"
                          className="w-full pl-[5.5rem] pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#0E7490]/20 focus:border-[#0E7490] outline-none transition-all"
                        />
                      </div>
                    </div>

                    {/* Request OTP Button */}
                    <button
                      onClick={handleRequestOtp}
                      disabled={requestingOtp}
                      className="w-full py-2.5 bg-[#0E7490] text-white rounded-xl text-sm font-semibold hover:bg-[#0C6680] disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                      {requestingOtp ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Sending OTP...
                        </>
                      ) : (
                        'Request OTP'
                      )}
                    </button>
                  </>
                ) : (
                  <>
                    {/* OTP Input */}
                    <div className="text-center mb-2">
                      <p className="text-sm text-gray-600">
                        OTP sent to{' '}
                        <span className="font-semibold text-gray-900">
                          +971{phoneNumber}
                        </span>
                      </p>
                      {otpTimer > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          Expires in{' '}
                          <span className="font-mono font-semibold text-[#0E7490]">
                            {formatTimer(otpTimer)}
                          </span>
                        </p>
                      )}
                      {otpTimer === 0 && (
                        <p className="text-xs text-red-500 mt-1">
                          OTP expired.{' '}
                          <button
                            onClick={() => {
                              setOtpSent(false);
                              setOtpCode('');
                            }}
                            className="text-[#0E7490] underline font-medium"
                          >
                            Request again
                          </button>
                        </p>
                      )}
                    </div>

                    {/* Dev mode OTP display */}
                    {devOtp && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-center">
                        <p className="text-xs text-yellow-700 font-medium">
                          DEV MODE - OTP:{' '}
                          <span className="font-mono text-base font-bold text-yellow-900">
                            {devOtp}
                          </span>
                        </p>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Enter OTP
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                          <HiOutlineKey className="w-5 h-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          value={otpCode}
                          onChange={(e) =>
                            setOtpCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))
                          }
                          placeholder="000000"
                          maxLength={6}
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm text-center tracking-[0.5em] font-mono font-bold focus:ring-2 focus:ring-[#0E7490]/20 focus:border-[#0E7490] outline-none transition-all"
                          autoFocus
                        />
                      </div>
                    </div>

                    {/* Verify OTP Button */}
                    <button
                      onClick={handleVerifyOtp}
                      disabled={verifyingOtp || otpCode.length !== 6}
                      className="w-full py-2.5 bg-[#0E7490] text-white rounded-xl text-sm font-semibold hover:bg-[#0C6680] disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                      {verifyingOtp ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        'Verify OTP'
                      )}
                    </button>

                    {/* Back button */}
                    <button
                      onClick={() => {
                        setOtpSent(false);
                        setOtpCode('');
                        setDevOtp(null);
                        setOtpTimer(0);
                      }}
                      className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      Back to phone number
                    </button>
                  </>
                )}
              </div>
            )}

            {/* ===== Staff Login ===== */}
            {activeTab === 'staff' && (
              <form onSubmit={handleStaffLogin} className="space-y-4">
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <HiOutlineEnvelope className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@company.com"
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#0E7490]/20 focus:border-[#0E7490] outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <HiOutlineLockClosed className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#0E7490]/20 focus:border-[#0E7490] outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={loggingIn}
                  className="w-full py-2.5 bg-[#0E7490] text-white rounded-xl text-sm font-semibold hover:bg-[#0C6680] disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {loggingIn ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-white/40 text-xs mt-6">
          CarRental ERP &mdash; Car Rental Management Platform
        </p>
        <p className="text-center text-white/60 text-sm mt-2">
          Want to start your own rental business?{' '}
          <a href="/register" className="text-white font-semibold hover:underline">
            Register your company
          </a>
        </p>
      </div>
    </div>
  );
}
