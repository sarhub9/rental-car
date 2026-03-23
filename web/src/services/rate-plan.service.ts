import apiClient from '@/lib/api-client';

export interface CreateRatePlanPayload {
  name: string;
  daily_rate: number;
  weekly_rate: number;
  monthly_rate: number;
  included_km_per_day: number;
  extra_km_rate: number;
  fuel_policy: string;
  late_return_rules: Record<string, unknown>;
  deposit_amount: number;
  add_ons: Record<string, unknown>[];
  terms_text: string;
}

export async function createRatePlan(payload: CreateRatePlanPayload) {
  const response = await apiClient.post('/rate-plans', payload);
  return response.data;
}

export async function getRatePlans() {
  const response = await apiClient.get('/rate-plans');
  return response.data;
}

export async function getRatePlanById(id: string) {
  const response = await apiClient.get(`/rate-plans/${id}`);
  return response.data;
}

export async function updateRatePlan(id: string, payload: Partial<CreateRatePlanPayload>) {
  const response = await apiClient.put(`/rate-plans/${id}`, payload);
  return response.data;
}

export async function deactivateRatePlan(id: string) {
  const response = await apiClient.delete(`/rate-plans/${id}`);
  return response.data;
}

export const ratePlanService = {
  createRatePlan,
  getRatePlans,
  getRatePlanById,
  updateRatePlan,
  deactivateRatePlan,
};
