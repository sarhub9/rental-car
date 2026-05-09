'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  HiOutlineBuildingOffice2,
  HiOutlineEnvelope,
  HiOutlineDevicePhoneMobile,
  HiOutlineLockClosed,
  HiOutlineTruck,
  HiOutlineEye,
  HiOutlineEyeSlash,
  HiOutlineArrowRight,
  HiOutlineCheckCircle,
  HiOutlineSparkles,
  HiOutlineClock,
  HiOutlineShieldCheck,
  HiOutlineCurrencyDollar,
} from 'react-icons/hi2';
import { register, RegisterResponse } from '@/services/company.service';
import { useAuth } from '@/contexts/AuthContext';

const PERKS = [
  { icon: HiOutlineClock,          text: '14-day free trial, no card needed' },
  { icon: HiOutlineShieldCheck,    text: 'Secure multi-tenant platform' },
  { icon: HiOutlineCurrencyDollar, text: 'Cancel anytime, no lock-in' },
  { icon: HiOutlineSparkles,       text: 'Full access to all features' },
];

const STEPS = ['Company Info', 'Set Password', 'Done'];

export default function RegisterPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  const [mounted, setMounted]               = useState(false);
  const [step, setStep]                     = useState(0); // 0 = info, 1 = password

  const [name, setName]                     = useState('');
  const [contactEmail, setContactEmail]     = useState('');
  const [phoneNumber, setPhoneNumber]       = useState('');
  const [password, setPassword]             = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw]                 = useState(false);
  const [showConfirm, setShowConfirm]       = useState(false);
  const [submitting, setSubmitting]         = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (!isLoading && isAuthenticated) router.replace('/dashboard');
  }, [isAuthenticated, isLoading, router]);

  const goNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim())         { toast.error('Enter your company name'); return; }
    if (!contactEmail.trim()) { toast.error('Enter your email'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) { toast.error('Invalid email address'); return; }
    if (!phoneNumber.trim())  { toast.error('Enter your phone number'); return; }
    setStep(1);
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8)       { toast.error('Password must be at least 8 characters'); return; }
    if (password !== confirmPassword) { toast.error('Passwords do not match'); return; }

    setSubmitting(true);
    try {
      const result: RegisterResponse = await register({
        name: name.trim(),
        contact_email: contactEmail.trim(),
        phone_number: phoneNumber.startsWith('+') ? phoneNumber.trim() : `+971${phoneNumber.trim()}`,
        password,
      });
      localStorage.setItem('auth_token', result.access_token);
      localStorage.setItem('refresh_token', result.access_token);
      localStorage.setItem('auth_user', JSON.stringify(result.user));
      toast.success('Company registered! Welcome to Drivebx.');
      router.replace('/dashboard');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || err?.response?.data?.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  }, [name, contactEmail, phoneNumber, password, confirmPassword, router]);

  const pwStrength = (() => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 8)  s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  })();

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColor = ['', 'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-emerald-500'];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0C1A2E]">
        <div className="w-10 h-10 border-2 border-[#0E7490]/30 border-t-[#0E7490] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes float1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(30px,-40px) scale(1.05)} }
        @keyframes float2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-20px,30px) scale(0.95)} }
        @keyframes float3 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(15px,20px) scale(1.08)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideRight { from{opacity:0;transform:translateX(-16px)} to{opacity:1;transform:translateX(0)} }
        @keyframes slideLeft  { from{opacity:0;transform:translateX(16px)}  to{opacity:1;transform:translateX(0)} }
        .float1{animation:float1 8s ease-in-out infinite}
        .float2{animation:float2 11s ease-in-out infinite}
        .float3{animation:float3 7s ease-in-out infinite}
        .anim-up    {animation:fadeUp 0.45s ease both}
        .anim-right {animation:slideRight 0.3s ease both}
        .anim-left  {animation:slideLeft  0.3s ease both}
        input:-webkit-autofill{-webkit-box-shadow:0 0 0 50px white inset!important}
      `}</style>

      <div className="min-h-screen flex" style={{ background: 'linear-gradient(135deg, #0C1A2E 0%, #0E3A52 50%, #0C1A2E 100%)' }}>

        {/* ── LEFT PANEL ─────────────────────────────────── */}
        <div className="hidden lg:flex lg:w-[48%] lg:sticky lg:top-0 lg:h-screen relative overflow-hidden flex-col px-10 py-8">

          {/* Animated blobs */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="float1 absolute top-[8%] left-[10%] w-80 h-80 rounded-full opacity-20"
              style={{ background: 'radial-gradient(circle, #0E7490, transparent 70%)' }} />
            <div className="float2 absolute bottom-[10%] right-[5%] w-96 h-96 rounded-full opacity-15"
              style={{ background: 'radial-gradient(circle, #0891B2, transparent 70%)' }} />
            <div className="float3 absolute top-[45%] left-[55%] w-56 h-56 rounded-full opacity-10"
              style={{ background: 'radial-gradient(circle, #06B6D4, transparent 70%)' }} />
            <div className="absolute inset-0 opacity-[0.03]"
              style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
          </div>

          {/* Brand — top */}
          <div className={`relative z-10 shrink-0 ${mounted ? 'anim-up' : 'opacity-0'}`}>
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-11 h-11 bg-[#0E7490] rounded-2xl flex items-center justify-center shadow-lg shadow-[#0E7490]/30">
                  <HiOutlineTruck className="w-5 h-5 text-white" />
                </div>
                <div className="absolute inset-0 rounded-2xl border-2 border-[#0E7490]/40 scale-110 animate-ping" style={{ animationDuration: '3s' }} />
              </div>
              <div>
                <p className="text-lg font-bold text-white">Drivebx ERP</p>
                <p className="text-[10px] text-cyan-400 font-medium tracking-widest uppercase">Platform</p>
              </div>
            </div>
          </div>

          {/* Main copy — centred in remaining space */}
          <div className={`relative z-10 flex-1 flex flex-col justify-center ${mounted ? 'anim-up' : 'opacity-0'}`}
            style={{ animationDelay: '0.1s' }}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0E7490]/20 border border-[#0E7490]/30 mb-5 self-start">
              <HiOutlineSparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-xs font-semibold text-cyan-300">14-day free trial</span>
            </div>

            <h1 className="text-3xl font-bold text-white leading-tight mb-3">
              Start your<br />
              <span className="text-transparent bg-clip-text"
                style={{ backgroundImage: 'linear-gradient(90deg, #22D3EE, #0E7490)' }}>
                rental business
              </span><br />
              journey today
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed mb-6 max-w-xs">
              Set up your company in under 2 minutes and get full access to agreements, fleet, invoicing, and more.
            </p>

            {/* Perks */}
            <div className="space-y-3">
              {PERKS.map((p, i) => (
                <div key={i} className="flex items-center gap-3"
                  style={{ animation: mounted ? `fadeUp 0.4s ${0.25 + i * 0.07}s ease both` : undefined, opacity: mounted ? undefined : 0 }}>
                  <div className="w-8 h-8 rounded-xl bg-[#0E7490]/20 border border-[#0E7490]/30 flex items-center justify-center shrink-0">
                    <p.icon className="w-4 h-4 text-cyan-400" />
                  </div>
                  <span className="text-sm text-slate-300">{p.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer — bottom */}
          <p className={`relative z-10 shrink-0 text-slate-500 text-xs ${mounted ? 'anim-up' : 'opacity-0'}`}
            style={{ animationDelay: '0.2s' }}>
            © {new Date().getFullYear()} Drivebx ERP · UAE Car Rental Management
          </p>
        </div>

        {/* ── RIGHT PANEL ────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto">
          <div className="min-h-screen flex flex-col items-center justify-center px-6 py-10 relative">

          {/* Glow behind card */}
          <div className="absolute pointer-events-none w-96 h-96 rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, #0E7490, transparent 70%)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />

          <div className={`w-full max-w-sm relative z-10 ${mounted ? 'anim-up' : 'opacity-0'}`}>

            {/* Mobile brand */}
            <div className="lg:hidden flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-[#0E7490] rounded-xl flex items-center justify-center">
                <HiOutlineTruck className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-white text-base">Drivebx ERP</p>
                <p className="text-xs text-slate-400">Car Rental Management</p>
              </div>
            </div>

            {/* Card */}
            <div className="bg-white rounded-2xl shadow-2xl shadow-black/40 p-7">

            {/* Heading */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-[#0F172A]">Create your account</h2>
              <p className="text-sm text-[#64748B] mt-1">Get started with your free 14-day trial</p>
            </div>

            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-6">
              {STEPS.slice(0, 2).map((s, i) => (
                <div key={i} className="flex items-center gap-2 flex-1">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all duration-300 ${
                    i < step ? 'bg-emerald-500 text-white' :
                    i === step ? 'bg-[#0E7490] text-white' :
                    'bg-[#F1F5F9] text-[#94A3B8]'
                  }`}>
                    {i < step ? <HiOutlineCheckCircle className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className={`text-xs font-medium ${i === step ? 'text-[#0F172A]' : 'text-[#94A3B8]'}`}>{s}</span>
                  {i < STEPS.length - 2 && (
                    <div className="flex-1 h-px mx-1 transition-all duration-300"
                      style={{ background: i < step ? '#10B981' : '#E2E8F0' }} />
                  )}
                </div>
              ))}
            </div>

            {/* ── Step 0: Company Info ── */}
            {step === 0 && (
              <form onSubmit={goNext} className="space-y-4 anim-right">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-[#374151]">Company Name</label>
                  <div className="relative">
                    <HiOutlineBuildingOffice2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                    <input type="text" value={name} onChange={e => setName(e.target.value)}
                      placeholder="Your Rental Company LLC"
                      className="w-full pl-10 pr-4 py-3 border border-[#E2E8F0] rounded-xl text-sm bg-[#F8FAFC] focus:bg-white focus:border-[#0E7490] focus:ring-2 focus:ring-[#0E7490]/10 outline-none transition-all" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-[#374151]">Contact Email</label>
                  <div className="relative">
                    <HiOutlineEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                    <input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)}
                      placeholder="admin@company.com"
                      className="w-full pl-10 pr-4 py-3 border border-[#E2E8F0] rounded-xl text-sm bg-[#F8FAFC] focus:bg-white focus:border-[#0E7490] focus:ring-2 focus:ring-[#0E7490]/10 outline-none transition-all" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-[#374151]">Phone Number</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 gap-2 pointer-events-none">
                      <HiOutlineDevicePhoneMobile className="w-4 h-4 text-[#94A3B8]" />
                      <span className="text-sm font-semibold text-[#64748B] border-r border-[#E2E8F0] pr-2">+971</span>
                    </div>
                    <input type="tel" value={phoneNumber}
                      onChange={e => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                      placeholder="5XXXXXXXX"
                      className="w-full pl-24 pr-4 py-3 border border-[#E2E8F0] rounded-xl text-sm bg-[#F8FAFC] focus:bg-white focus:border-[#0E7490] focus:ring-2 focus:ring-[#0E7490]/10 outline-none transition-all" />
                  </div>
                </div>

                <button type="submit"
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98] mt-2"
                  style={{ background: 'linear-gradient(135deg, #0E7490, #0891B2)', boxShadow: '0 4px 14px rgba(14,116,144,0.35)' }}>
                  Continue <HiOutlineArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* ── Step 1: Set Password ── */}
            {step === 1 && (
              <form onSubmit={handleSubmit} className="space-y-4 anim-left">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-[#374151]">Password</label>
                  <div className="relative">
                    <HiOutlineLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                    <input type={showPw ? 'text' : 'password'} value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      autoFocus
                      className="w-full pl-10 pr-11 py-3 border border-[#E2E8F0] rounded-xl text-sm bg-[#F8FAFC] focus:bg-white focus:border-[#0E7490] focus:ring-2 focus:ring-[#0E7490]/10 outline-none transition-all" />
                    <button type="button" onClick={() => setShowPw(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B] transition-colors">
                      {showPw ? <HiOutlineEyeSlash className="w-4 h-4" /> : <HiOutlineEye className="w-4 h-4" />}
                    </button>
                  </div>
                  {/* Strength bar */}
                  {password && (
                    <div className="pt-1">
                      <div className="flex gap-1 mb-1">
                        {[1,2,3,4].map(n => (
                          <div key={n} className={`h-1 flex-1 rounded-full transition-all duration-300 ${n <= pwStrength ? strengthColor[pwStrength] : 'bg-[#E2E8F0]'}`} />
                        ))}
                      </div>
                      <p className={`text-[10px] font-medium ${pwStrength <= 1 ? 'text-red-500' : pwStrength === 2 ? 'text-orange-500' : pwStrength === 3 ? 'text-yellow-600' : 'text-emerald-600'}`}>
                        {strengthLabel[pwStrength]}
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-[#374151]">Confirm Password</label>
                  <div className="relative">
                    <HiOutlineLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
                    <input type={showConfirm ? 'text' : 'password'} value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className={`w-full pl-10 pr-11 py-3 border rounded-xl text-sm bg-[#F8FAFC] focus:bg-white outline-none transition-all ${
                        confirmPassword && confirmPassword !== password
                          ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100'
                          : confirmPassword && confirmPassword === password
                          ? 'border-emerald-300 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100'
                          : 'border-[#E2E8F0] focus:border-[#0E7490] focus:ring-2 focus:ring-[#0E7490]/10'
                      }`} />
                    <button type="button" onClick={() => setShowConfirm(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B] transition-colors">
                      {showConfirm ? <HiOutlineEyeSlash className="w-4 h-4" /> : <HiOutlineEye className="w-4 h-4" />}
                    </button>
                    {confirmPassword && confirmPassword === password && (
                      <HiOutlineCheckCircle className="absolute right-9 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                    )}
                  </div>
                  {confirmPassword && confirmPassword !== password && (
                    <p className="text-[10px] text-red-500 font-medium">Passwords don't match</p>
                  )}
                </div>

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setStep(0)}
                    className="flex-1 py-3 rounded-xl text-sm font-medium text-[#374151] bg-[#F8FAFC] hover:bg-[#E2E8F0] border border-[#E2E8F0] transition-colors">
                    Back
                  </button>
                  <button type="submit" disabled={submitting}
                    className="flex-[2] py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-60 active:scale-[0.98]"
                    style={{ background: 'linear-gradient(135deg, #0E7490, #0891B2)', boxShadow: '0 4px 14px rgba(14,116,144,0.35)' }}>
                    {submitting ? (
                      <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating...</>
                    ) : (
                      <>Create Account <HiOutlineArrowRight className="w-4 h-4" /></>
                    )}
                  </button>
                </div>
              </form>
            )}

            </div>{/* end card */}

            {/* Sign in link */}
            <p className="text-center text-xs text-slate-400 mt-5">
              Already have an account?{' '}
              <Link href="/login" className="text-cyan-400 font-semibold hover:text-cyan-300 transition-colors">
                Sign in →
              </Link>
            </p>
          </div>
          </div>
        </div>
      </div>
    </>
  );
}
