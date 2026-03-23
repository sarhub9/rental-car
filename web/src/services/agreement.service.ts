import apiClient from '@/lib/api-client';

export interface CreateAgreementPayload {
  customer_id: string;
  vehicle_id: string;
  rental_start_datetime: string;
  rental_end_datetime: string;
  daily_rate: number;
  weekly_rate: number;
  estimated_amount: number;
}

export interface AgreementListParams {
  status?: string;
  customer_id?: string;
  vehicle_id?: string;
  page?: number;
  limit?: number;
}

export interface CheckoutPayload {
  photos: File[];
  odometer_reading: number;
  fuel_level: string;
  accessories: string;
  customer_signature: File;
}

export interface ReturnPayload {
  photos: File[];
  odometer_reading: number;
  fuel_level: string;
  damage_documented: boolean;
  damage_description?: string;
  customer_acknowledgment: boolean;
}

export async function createAgreement(payload: CreateAgreementPayload) {
  const response = await apiClient.post('/agreements', payload);
  return response.data;
}

export async function getAgreements(params?: AgreementListParams) {
  const response = await apiClient.get('/agreements', { params });
  return response.data;
}

export async function getAgreementById(id: string) {
  const response = await apiClient.get(`/agreements/${id}`);
  return response.data;
}

export async function updateAgreement(id: string, payload: Partial<CreateAgreementPayload>) {
  const response = await apiClient.patch(`/agreements/${id}`, payload);
  return response.data;
}

export async function checkoutAgreement(agreementId: string, payload: CheckoutPayload | FormData) {
  let formData: FormData;
  if (payload instanceof FormData) {
    formData = payload;
  } else {
    formData = new FormData();
    payload.photos.forEach((photo) => {
      formData.append('photos', photo);
    });
    formData.append('odometer_reading', String(payload.odometer_reading));
    formData.append('fuel_level', payload.fuel_level);
    formData.append('accessories', payload.accessories);
    formData.append('customer_signature', payload.customer_signature);
  }

  const response = await apiClient.post(`/agreements/${agreementId}/checkout`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

export async function returnAgreement(agreementId: string, payload: ReturnPayload | FormData) {
  let formData: FormData;
  if (payload instanceof FormData) {
    formData = payload;
  } else {
    formData = new FormData();
    payload.photos.forEach((photo) => {
      formData.append('photos', photo);
    });
    formData.append('odometer_reading', String(payload.odometer_reading));
    formData.append('fuel_level', payload.fuel_level);
    formData.append('damage_documented', String(payload.damage_documented));
    if (payload.damage_description) {
      formData.append('damage_description', payload.damage_description);
    }
    formData.append('customer_acknowledgment', String(payload.customer_acknowledgment));
  }

  const response = await apiClient.post(`/agreements/${agreementId}/return`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

export async function getAgreementEvidence(agreementId: string) {
  const response = await apiClient.get(`/agreements/${agreementId}/evidence`);
  return response.data;
}

export async function getAgreementCharges(agreementId: string) {
  const response = await apiClient.get(`/agreements/${agreementId}/charges`);
  return response.data;
}

export const agreementService = {
  createAgreement,
  getAgreements,
  getAgreementById,
  updateAgreement,
  checkoutAgreement,
  returnAgreement,
  getAgreementEvidence,
  getAgreementCharges,
};
