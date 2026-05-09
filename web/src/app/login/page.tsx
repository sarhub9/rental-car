'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import {
  HiOutlineDevicePhoneMobile,
  HiOutlineEnvelope,
  HiOutlineLockClosed,
  HiOutlineKey,
  HiOutlineTruck,
  HiOutlineEye,
  HiOutlineEyeSlash,
  HiOutlineArrowRight,
  HiOutlineCheckCircle,
  HiOutlineDocumentText,
  HiOutlineChartBarSquare,
  HiOutlineShieldCheck,
} from 'react-icons/hi2';

type LoginTab = 'staff' | 'customer';

const FEATURES = [
  { icon: HiOutlineDocumentText, text: 'Rental agreement management' },
  { icon: HiOutlineTruck,        text: 'Full fleet tracking & control' },
  { icon: HiOutlineChartBarSquare, text: 'Real-time KPIs & reports' },
  { icon: HiOutlineShieldCheck,  text: 'Multi-role access control' },
];

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, requestOtp, verifyOtp, staffLogin } = useAuth();

  const [activeTab, setActiveTab]       = useState<LoginTab>('staff');
  const [mounted, setMounted]           = useState(false);

  // Staff
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPw, setShowPw]             = useState(false);
  const [loggingIn, setLoggingIn]       = useState(false);

  // Customer / OTP
  const [phoneNumber, setPhoneNumber]   = useState('');
  const [otpSent, setOtpSent]           = useState(false);
  const [otpCode, setOtpCode]           = useState('');
  const [otpTimer, setOtpTimer]         = useState(0);
  const [devOtp, setDevOtp]             = useState<string | null>(null);
  const [requestingOtp, setRequestingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!isLoading && isAuthenticated) router.replace('/dashboard');
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (otpTimer <= 0) return;
    const t = setInterval(() => setOtpTimer(p => (p <= 1 ? (clearInterval(t), 0) : p - 1)), 1000);
    return () => clearInterval(t);
  }, [otpTimer]);

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const handleRequestOtp = useCallback(async () => {
    if (!phoneNumber.trim()) { toast.error('Enter your phone number'); return; }
    setRequestingOtp(true);
    try {
      const phone = phoneNumber.startsWith('+') ? phoneNumber : `+971${phoneNumber}`;
      await requestOtp(phone, '');
      setOtpSent(true);
      setOtpTimer(120);
      toast.success('OTP sent!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to send OTP');
      if (err?.response?.data?.data?.otp_code) setDevOtp(err.response.data.data.otp_code);
    } finally { setRequestingOtp(false); }
  }, [phoneNumber, requestOtp]);

  const handleVerifyOtp = useCallback(async () => {
    if (otpCode.length !== 6) { toast.error('Enter the 6-digit OTP'); return; }
    setVerifyingOtp(true);
    try {
      const phone = phoneNumber.startsWith('+') ? phoneNumber : `+971${phoneNumber}`;
      await verifyOtp(phone, '', otpCode);
      toast.success('Welcome back!');
      router.replace('/dashboard');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Invalid OTP');
    } finally { setVerifyingOtp(false); }
  }, [otpCode, phoneNumber, verifyOtp, router]);

  const handleStaffLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) { toast.error('Fill in all fields'); return; }
    setLoggingIn(true);
    try {
      await staffLogin(email.trim(), password, '');
      const u = JSON.parse(localStorage.getItem('auth_user') || '{}');
      toast.success('Welcome back!');
      router.replace(u?.role === 'SUPER_ADMIN' ? '/superadmin' : '/dashboard');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Invalid credentials');
    } finally { setLoggingIn(false); }
  }, [email, password, staffLogin, router]);

  const switchTab = (tab: LoginTab) => {
    setActiveTab(tab);
    setOtpSent(false);
    setOtpCode('');
    setDevOtp(null);
    setOtpTimer(0);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0C1A2E]">
        <div className="w-10 h-10 border-3 border-[#0E7490]/30 border-t-[#0E7490] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes float1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(30px,-40px) scale(1.05)} }
        @keyframes float2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-20px,30px) scale(0.95)} }
        @keyframes float3 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(15px,20px) scale(1.08)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideIn { from{opacity:0;transform:translateX(-16px)} to{opacity:1;transform:translateX(0)} }
        @keyframes pulse-ring { 0%{transform:scale(0.9);opacity:0.8} 70%{transform:scale(1.3);opacity:0} 100%{transform:scale(1.3);opacity:0} }
        .anim-fadeup { animation: fadeUp 0.5s ease both; }
        .anim-fadeup-d1 { animation: fadeUp 0.5s 0.1s ease both; }
        .anim-fadeup-d2 { animation: fadeUp 0.5s 0.2s ease both; }
        .anim-slideIn { animation: slideIn 0.3s ease both; }
        .float1 { animation: float1 8s ease-in-out infinite; }
        .float2 { animation: float2 11s ease-in-out infinite; }
        .float3 { animation: float3 7s ease-in-out infinite; }
        .tab-content { animation: fadeUp 0.25s ease both; }
        input:-webkit-autofill { -webkit-box-shadow:0 0 0 50px white inset !important; }
      `}</style>

      <div className="min-h-screen flex bg-[#0C1A2E]">

        {/* ── LEFT PANEL ──────────────────────────────────────── */}
        <div className="hidden lg:flex lg:w-[52%] lg:sticky lg:top-0 lg:h-screen relative overflow-hidden flex-col justify-between p-12"
          style={{ background: 'linear-gradient(135deg, #0C1A2E 0%, #0E3A52 50%, #0C1A2E 100%)' }}>

          {/* Animated blobs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="float1 absolute top-[10%] left-[15%] w-72 h-72 rounded-full opacity-20"
              style={{ background: 'radial-gradient(circle, #0E7490, transparent 70%)' }} />
            <div className="float2 absolute bottom-[15%] right-[10%] w-96 h-96 rounded-full opacity-15"
              style={{ background: 'radial-gradient(circle, #0891B2, transparent 70%)' }} />
            <div className="float3 absolute top-[50%] left-[50%] w-48 h-48 rounded-full opacity-10"
              style={{ background: 'radial-gradient(circle, #06B6D4, transparent 70%)' }} />
            {/* Grid pattern */}
            <div className="absolute inset-0 opacity-[0.03]"
              style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
          </div>

          {/* Brand */}
          <div className={mounted ? 'anim-fadeup relative z-10' : 'opacity-0'}>
            <div className="flex items-center gap-3 mb-2">
              <div className="relative">
                <div className="w-12 h-12 bg-[#0E7490] rounded-2xl flex items-center justify-center shadow-lg shadow-[#0E7490]/30">
                  <HiOutlineTruck className="w-6 h-6 text-white" />
                </div>
                <div className="absolute inset-0 rounded-2xl border-2 border-[#0E7490]/40 scale-110 animate-ping" style={{ animationDuration: '3s' }} />
              </div>
              <div>
                <p className="text-xl font-bold text-white tracking-tight">Drivebx ERP</p>
                <p className="text-[11px] text-cyan-400 font-medium tracking-widest uppercase">Platform</p>
              </div>
            </div>
          </div>

          {/* Headline */}
          <div className={`relative z-10 ${mounted ? 'anim-fadeup-d1' : 'opacity-0'}`}>
            <h1 className="text-4xl font-bold text-white leading-tight mb-4">
              Manage your<br />
              <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(90deg, #22D3EE, #0E7490)' }}>
                rental fleet
              </span><br />
              with confidence
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed mb-8 max-w-xs">
              The complete ERP solution for UAE car rental businesses. From agreements to invoicing, all in one place.
            </p>

            {/* Feature list */}
            <div className="space-y-3">
              {FEATURES.map((f, i) => (
                <div key={i} className="flex items-center gap-3"
                  style={{ animation: `fadeUp 0.4s ${0.3 + i * 0.08}s ease both`, opacity: mounted ? undefined : 0 }}>
                  <div className="w-8 h-8 rounded-xl bg-[#0E7490]/20 border border-[#0E7490]/30 flex items-center justify-center shrink-0">
                    <f.icon className="w-4 h-4 text-cyan-400" />
                  </div>
                  <p className="text-sm text-slate-300">{f.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className={`relative z-10 ${mounted ? 'anim-fadeup-d2' : 'opacity-0'}`}>
            <p className="text-slate-500 text-xs">
              © {new Date().getFullYear()} Drivebx ERP · UAE Car Rental Management
            </p>
          </div>
        </div>

        {/* ── RIGHT PANEL ─────────────────────────────────────── */}
        <div className="flex-1 bg-white overflow-y-auto">
          <div className="min-h-screen flex flex-col items-center justify-center px-6 py-10 relative">

          {/* Subtle bg pattern */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(14,116,144,0.05) 0%, transparent 50%)' }} />

          <div className={`w-full max-w-sm relative z-10 ${mounted ? 'anim-fadeup' : 'opacity-0'}`}>

            {/* Mobile brand */}
            <div className="lg:hidden flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-[#0E7490] rounded-xl flex items-center justify-center">
                <HiOutlineTruck className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-[#0F172A] text-base">Drivebx ERP</p>
                <p className="text-xs text-[#64748B]">Car Rental Management</p>
              </div>
            </div>

            {/* Heading */}
            <div className="mb-7">
              <h2 className="text-2xl font-bold text-[#0F172A]">Welcome back</h2>
              <p className="text-sm text-[#64748B] mt-1">Sign in to continue to your dashboard</p>
            </div>

            {/* Tab switcher */}
            <div className="flex bg-[#F1F5F9] rounded-xl p-1 mb-6 gap-1">
              {(['staff', 'customer'] as LoginTab[]).map(tab => (
                <button key={tab} onClick={() => switchTab(tab)}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                    activeTab === tab
                      ? 'bg-white text-[#0E7490] shadow-sm'
                      : 'text-[#64748B] hover:text-[#374151]'
                  }`}>
                  {tab === 'staff' ? 'Staff / Admin' : 'Customer'}
                </button>
              ))}
            </div>

            {/* ── Staff form ── */}
            {activeTab === 'staff' && (
              <form onSubmit={handleStaffLogin} className="space-y-4 tab-content">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-[#374151]">Email Address</label>
                  <div className="relative">
                    <HiOutlineEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      autoComplete="email"
                      className="w-full pl-10 pr-4 py-3 border border-[#E2E8F0] rounded-xl text-sm bg-[#F8FAFC] focus:bg-white focus:border-[#0E7490] focus:ring-3 focus:ring-[#0E7490]/10 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-[#374151]">Password</label>
                  <div className="relative">
                    <HiOutlineLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      className="w-full pl-10 pr-11 py-3 border border-[#E2E8F0] rounded-xl text-sm bg-[#F8FAFC] focus:bg-white focus:border-[#0E7490] focus:ring-3 focus:ring-[#0E7490]/10 outline-none transition-all"
                    />
                    <button type="button" onClick={() => setShowPw(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B] transition-colors">
                      {showPw ? <HiOutlineEyeSlash className="w-4 h-4" /> : <HiOutlineEye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={loggingIn}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-60 active:scale-[0.98]"
                  style={{ background: loggingIn ? '#0E7490' : 'linear-gradient(135deg, #0E7490, #0891B2)', boxShadow: '0 4px 14px rgba(14,116,144,0.35)' }}>
                  {loggingIn ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Signing in...</>
                  ) : (
                    <>Sign In <HiOutlineArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </form>
            )}

            {/* ── Customer / OTP form ── */}
            {activeTab === 'customer' && (
              <div className="tab-content">
                {!otpSent ? (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-[#374151]">Phone Number</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 gap-2 pointer-events-none">
                          <HiOutlineDevicePhoneMobile className="w-4 h-4 text-[#94A3B8]" />
                          <span className="text-sm font-semibold text-[#64748B] border-r border-[#E2E8F0] pr-2">+971</span>
                        </div>
                        <input
                          type="tel"
                          value={phoneNumber}
                          onChange={e => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                          placeholder="5XXXXXXXX"
                          className="w-full pl-24 pr-4 py-3 border border-[#E2E8F0] rounded-xl text-sm bg-[#F8FAFC] focus:bg-white focus:border-[#0E7490] focus:ring-3 focus:ring-[#0E7490]/10 outline-none transition-all"
                        />
                      </div>
                    </div>
                    <button onClick={handleRequestOtp} disabled={requestingOtp || !phoneNumber.trim()}
                      className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-60 active:scale-[0.98]"
                      style={{ background: 'linear-gradient(135deg, #0E7490, #0891B2)', boxShadow: '0 4px 14px rgba(14,116,144,0.35)' }}>
                      {requestingOtp ? (
                        <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending...</>
                      ) : (
                        <>Send OTP <HiOutlineArrowRight className="w-4 h-4" /></>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4 anim-slideIn">
                    {/* OTP sent confirmation */}
                    <div className="flex items-start gap-3 p-3.5 bg-[#ECFEFF] border border-[#A5F3FC] rounded-xl">
                      <HiOutlineCheckCircle className="w-5 h-5 text-[#0E7490] shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-[#0E7490]">OTP sent successfully</p>
                        <p className="text-xs text-[#0E7490]/70 mt-0.5">
                          Sent to +971{phoneNumber}
                          {otpTimer > 0 && <> · Expires in <span className="font-mono font-bold">{fmt(otpTimer)}</span></>}
                          {otpTimer === 0 && <> · <button onClick={() => { setOtpSent(false); setOtpCode(''); }} className="underline font-semibold">Resend</button></>}
                        </p>
                      </div>
                    </div>

                    {devOtp && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center">
                        <p className="text-xs text-amber-700 font-medium">DEV · OTP: <span className="font-mono font-bold text-amber-900 text-base">{devOtp}</span></p>
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-[#374151]">Enter 6-digit OTP</label>
                      <div className="relative">
                        <HiOutlineKey className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                        <input
                          type="text"
                          value={otpCode}
                          onChange={e => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="· · · · · ·"
                          maxLength={6}
                          autoFocus
                          className="w-full pl-10 pr-4 py-3 border border-[#E2E8F0] rounded-xl text-sm text-center tracking-[0.6em] font-mono font-bold bg-[#F8FAFC] focus:bg-white focus:border-[#0E7490] focus:ring-3 focus:ring-[#0E7490]/10 outline-none transition-all"
                        />
                      </div>
                    </div>

                    <button onClick={handleVerifyOtp} disabled={verifyingOtp || otpCode.length !== 6}
                      className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-60 active:scale-[0.98]"
                      style={{ background: 'linear-gradient(135deg, #0E7490, #0891B2)', boxShadow: '0 4px 14px rgba(14,116,144,0.35)' }}>
                      {verifyingOtp ? (
                        <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Verifying...</>
                      ) : (
                        <>Verify & Sign In <HiOutlineArrowRight className="w-4 h-4" /></>
                      )}
                    </button>

                    <button onClick={() => { setOtpSent(false); setOtpCode(''); setDevOtp(null); setOtpTimer(0); }}
                      className="w-full py-2 text-xs text-[#64748B] hover:text-[#374151] transition-colors">
                      ← Back to phone number
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Register link */}
            <p className="text-center text-xs text-[#94A3B8] mt-8">
              New rental business?{' '}
              <a href="/register" className="text-[#0E7490] font-semibold hover:underline">
                Start free trial
              </a>
            </p>

          </div>
          </div>
        </div>
      </div>
    </>
  );
}
