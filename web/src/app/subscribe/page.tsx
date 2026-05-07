'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlineCreditCard,
} from 'react-icons/hi2';
import { getPlans, subscribe, SubscriptionPlan } from '@/services/company.service';
import { useAuth } from '@/contexts/AuthContext';

const FEATURE_LABELS: Record<string, string> = {
  agreements: 'Rental Agreements',
  invoicing: 'Invoicing & Payments',
  disputes: 'Dispute Management',
  kpi_dashboard: 'KPI Dashboard',
  audit_logs: 'Audit Logs',
  api_access: 'API Access',
  multi_branch: 'Multi-Branch Support',
  customer_portal: 'Customer Portal',
};

export default function SubscribePage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
      return;
    }

    if (user && user.role !== 'OWNER_ADMIN' && user.role !== 'SUPER_ADMIN') {
      router.replace('/dashboard');
      return;
    }

    (async () => {
      try {
        const data = await getPlans();
        setPlans(data);
      } catch {
        toast.error('Failed to load subscription plans');
      } finally {
        setLoading(false);
      }
    })();
  }, [isAuthenticated, isLoading, user, router]);

  const handleSubscribe = useCallback(
    async (planId: string) => {
      setSubscribing(planId);
      try {
        await subscribe({ plan_id: planId });
        toast.success('Subscribed successfully!');
        router.replace('/dashboard');
      } catch (err: any) {
        const message =
          err?.response?.data?.error || err?.response?.data?.message || 'Subscription failed';
        toast.error(message);
      } finally {
        setSubscribing(null);
      }
    },
    [router]
  );

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-[#0E7490]/30 border-t-[#0E7490] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-[#0F172A]">Choose Your Plan</h1>
        <p className="text-sm text-[#64748B] mt-1">
          Select the subscription plan that fits your rental business
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const isFree = plan.price_monthly === 0;
          const isPopular = plan.name === 'Premium';

          return (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl border shadow-sm p-6 flex flex-col ${
                isPopular ? 'border-[#0E7490] ring-2 ring-[#0E7490]/20' : 'border-[#CBD5E1]'
              }`}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#0E7490] text-white text-xs font-bold px-3 py-1 rounded-full">
                  MOST POPULAR
                </div>
              )}

              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-[#0F172A]">{plan.name}</h2>
                <p className="text-sm text-[#64748B] mt-1">{plan.description}</p>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-[#0F172A]">
                    {isFree ? 'Free' : `AED ${plan.price_monthly}`}
                  </span>
                  {!isFree && <span className="text-sm text-[#64748B]">/month</span>}
                </div>
                {!isFree && plan.price_annual && (
                  <p className="text-xs text-[#059669] mt-1">
                    Save {(((plan.price_monthly * 12 - plan.price_annual) / (plan.price_monthly * 12)) * 100).toFixed(0)}% with annual billing (AED {plan.price_annual}/year)
                  </p>
                )}
              </div>

              {/* Features */}
              <div className="flex-1 space-y-3 mb-6">
                {Object.entries(plan.features || {}).map(([key, enabled]) => (
                  <div key={key} className="flex items-center gap-2">
                    {enabled ? (
                      <HiOutlineCheckCircle className="w-5 h-5 text-[#059669] shrink-0" />
                    ) : (
                      <HiOutlineXCircle className="w-5 h-5 text-gray-300 shrink-0" />
                    )}
                    <span className={`text-sm ${enabled ? 'text-[#334155]' : 'text-gray-400 line-through'}`}>
                      {FEATURE_LABELS[key] || key}
                    </span>
                  </div>
                ))}

                {/* Limits */}
                <div className="pt-3 border-t border-gray-100 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#64748B]">Vehicles</span>
                    <span className="font-medium text-[#0F172A]">
                      {plan.max_vehicles ?? 'Unlimited'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#64748B]">Users</span>
                    <span className="font-medium text-[#0F172A]">
                      {plan.max_users ?? 'Unlimited'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#64748B]">Agreements/mo</span>
                    <span className="font-medium text-[#0F172A]">
                      {plan.max_agreements_per_month ?? 'Unlimited'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Subscribe Button */}
              <button
                onClick={() => handleSubscribe(plan.id)}
                disabled={subscribing !== null}
                className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
                  isFree
                    ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    : 'bg-[#0E7490] text-white hover:bg-[#0C6680] disabled:opacity-60'
                }`}
              >
                {subscribing === plan.id ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                    Subscribing...
                  </>
                ) : isFree ? (
                  'Current Plan'
                ) : (
                  <>
                    <HiOutlineCreditCard className="w-4 h-4" />
                    Subscribe Now
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
