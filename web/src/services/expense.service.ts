import apiClient from '@/lib/api-client';

const extract = (r: any) => {
  const d = r.data;
  // Prefer d.data if it exists (even if empty array), else fall back to d itself
  return d !== null && typeof d === 'object' && 'data' in d ? d.data : d;
};

export const expenseService = {
  list:    (params?: any)               => apiClient.get('/v1/expenses', { params }).then(extract),
  create:  (payload: any)               => apiClient.post('/v1/expenses', payload).then(extract),
  getById: (id: string)                 => apiClient.get(`/v1/expenses/${id}`).then(extract),
  summary: (from?: string, to?: string) => apiClient.get('/v1/expenses/summary', { params: { from, to } }).then(extract),
};
