'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import {
  HiOutlineTruck, HiOutlineEnvelope, HiOutlineLockClosed,
  HiOutlineEye, HiOutlineEyeSlash, HiOutlineShieldCheck,
} from 'react-icons/hi2';

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, staffLogin, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated && user?.role === 'SUPER_ADMIN') {
      router.replace('/superadmin');
    }
  }, [isAuthenticated, isLoading, user, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error('Please enter email and password');
      return;
    }
    setLoggingIn(true);
    try {
      await staffLogin(email.trim(), password, '');
      const storedUser = localStorage.getItem('auth_user');
      const loggedUser = storedUser ? JSON.parse(storedUser) : null;
      if (loggedUser?.role !== 'SUPER_ADMIN') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('auth_user');
        toast.error('Access denied. Super Admin credentials required.');
        return;
      }
      toast.success('Welcome, Super Admin');
      router.replace('/superadmin');
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error?.message ||
        'Invalid credentials. Please try again.';
      toast.error(msg);
    } finally {
      setLoggingIn(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#0E7490] via-[#155E75] to-[#164E63]">
        <div className="w-8 h-8 border-2 border-white/40 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#0E7490] via-[#155E75] to-[#164E63] p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-4">
            <HiOutlineTruck className="w-8 h-8 text-[#0E7490]" />
          </div>
          <h1 className="text-2xl font-bold text-white">Drivebx ERP</h1>
          <p className="text-white/60 text-sm mt-1">Super Admin Portal</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Top bar */}
          <div className="bg-[#ECFEFF] border-b border-[#0E7490]/20 px-6 py-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#0E7490] flex items-center justify-center flex-shrink-0">
              <HiOutlineShieldCheck className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#0E7490]">Platform Administration</p>
              <p className="text-xs text-[#0E7490]/60">Authorized personnel only</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="p-6 space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Admin Email
              </label>
              <div className="relative">
                <HiOutlineEnvelope className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="admin@yourdomain.com" required autoComplete="email"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0E7490] focus:border-transparent transition-all bg-gray-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Password
              </label>
              <div className="relative">
                <HiOutlineLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPass ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••" required autoComplete="current-password"
                  className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0E7490] focus:border-transparent transition-all bg-gray-50"
                />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {showPass ? <HiOutlineEyeSlash className="w-4 h-4" /> : <HiOutlineEye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loggingIn || !email.trim() || !password.trim()}
              className="w-full py-3 bg-[#0E7490] hover:bg-[#0C6680] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-md shadow-[#0E7490]/20 mt-2">
              {loggingIn ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <HiOutlineShieldCheck className="w-4 h-4" />
                  Access Admin Portal
                </>
              )}
            </button>
          </form>

          <div className="px-6 pb-5 border-t border-gray-100 pt-4 text-center">
            <p className="text-xs text-gray-400">
              Restricted to authorized platform administrators only.
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-white/30 mt-6">
          Drivebx ERP &copy; {new Date().getFullYear()} — Platform Management
        </p>
      </div>
    </div>
  );
}
