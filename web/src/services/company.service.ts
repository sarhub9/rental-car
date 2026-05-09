import apiClient from '@/lib/api-client';

// ============================================================================
// Company & Subscription Types
// ============================================================================

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  price_annual: number;
  features: Record<string, boolean>;
  max_vehicles: number | null;
  max_users: number | null;
  max_agreements_per_month: number | null;
  is_active: boolean;
  sort_order: number;
}

export interface CompanyProfile {
  id: string;
  name: string;
  contact_email: string;
  phone_number: string;
  address: string | null;
  logo_url: string | null;
  trade_license_number: string | null;
  status: string;
  trial_ends_at: string;
  subscription_status: string;
  subscription_end: string;
  plan_name: string;
  plan_features: Record<string, boolean>;
  created_at: string;
  updated_at: string;
  usage?: CompanyUsage;
}

export interface CompanyUsage {
  vehicles_count: number;
  users_count: number;
  agreements_total: number;
  agreements_active: number;
}

export interface RegisterPayload {
  name: string;
  contact_email: string;
  phone_number: string;
  password: string;
}

export interface RegisterResponse {
  company: {
    id: string;
    name: string;
    contact_email: string;
    status: string;
    trial_ends_at: string;
  };
  user: {
    id: string;
    tenant_id: string;
    role: string;
    full_name: string;
    email: string;
    phone_number: string;
  };
  access_token: string;
  expires_in: number;
}

export interface SubscribePayload {
  plan_id: string;
}

export interface SuperAdminCompany {
  id: string;
  name: string;
  contact_email: string;
  phone_number: string;
  address?: string | null;
  trade_license_number?: string | null;
  status: string;
  trial_ends_at: string;
  created_at: string;
  subscription_status?: string;
  plan_name?: string;
  usage?: CompanyUsage;
}

// ============================================================================
// Public APIs
// ============================================================================

export async function register(payload: RegisterPayload): Promise<RegisterResponse> {
  const response = await apiClient.post('/v1/companies', payload);
  return response.data.data;
}

export async function getPlans(): Promise<SubscriptionPlan[]> {
  const response = await apiClient.get('/v1/companies/plans');
  return response.data.data;
}

// ============================================================================
// Authenticated Company APIs
// ============================================================================

export async function getMyCompany(): Promise<CompanyProfile> {
  const response = await apiClient.get('/v1/companies/me');
  return response.data.data;
}

export async function updateMyCompany(data: Partial<{
  name: string;
  contact_email: string;
  phone_number: string;
  address: string;
  logo_url: string;
  trade_license_number: string;
}>): Promise<CompanyProfile> {
  const response = await apiClient.patch('/v1/companies/me', data);
  return response.data.data;
}

export async function subscribe(payload: SubscribePayload): Promise<{
  subscription: Record<string, unknown>;
  plan: SubscriptionPlan;
}> {
  const response = await apiClient.post('/v1/companies/subscribe', payload);
  return response.data.data;
}

// ============================================================================
// Super Admin APIs
// ============================================================================

export async function listCompanies(params?: {
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<{ items: SuperAdminCompany[]; count: number }> {
  const response = await apiClient.get('/v1/companies/super-admin/companies', { params });
  return { items: response.data.data, count: response.data.count };
}

export async function getCompanyById(id: string): Promise<SuperAdminCompany> {
  const response = await apiClient.get(`/v1/companies/super-admin/companies/${id}`);
  return response.data.data;
}

export async function updateCompanyStatus(id: string, status: 'ACTIVE' | 'SUSPENDED' | 'CANCELLED'): Promise<SuperAdminCompany> {
  const response = await apiClient.patch(`/v1/companies/super-admin/companies/${id}/status`, { status });
  return response.data.data;
}

// ============================================================================
// Feature Request
// ============================================================================

export interface FeatureRequestPayload {
  feature_title: string;
  message: string;
  company_name?: string;
  contact_email?: string;
}

export async function submitFeatureRequest(payload: FeatureRequestPayload) {
  const response = await apiClient.post('/v1/feature-requests', payload);
  return response.data.data;
}

// ============================================================================
// Super Admin Plan Management
// ============================================================================

export interface PlanPayload {
  name: string;
  description?: string;
  price_monthly: number;
  price_annual?: number;
  max_vehicles?: number | null;
  max_users?: number | null;
  max_agreements_per_month?: number | null;
  features?: Record<string, boolean>;
  sort_order?: number;
}

export async function getSuperAdminPlans(): Promise<SubscriptionPlan[]> {
  const response = await apiClient.get('/v1/companies/super-admin/plans');
  return response.data.data;
}

export async function createSuperAdminPlan(payload: PlanPayload): Promise<SubscriptionPlan> {
  const response = await apiClient.post('/v1/companies/super-admin/plans', payload);
  return response.data.data;
}

export async function updateSuperAdminPlan(id: string, payload: Partial<PlanPayload>): Promise<SubscriptionPlan> {
  const response = await apiClient.patch(`/v1/companies/super-admin/plans/${id}`, payload);
  return response.data.data;
}

export async function toggleSuperAdminPlan(id: string): Promise<SubscriptionPlan> {
  const response = await apiClient.patch(`/v1/companies/super-admin/plans/${id}/toggle`);
  return response.data.data;
}
