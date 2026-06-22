import apiClient from '@/lib/api-client';

export interface UploadResult {
  url: string;
  thumbnail_url?: string;
  file_size?: number;
}

/**
 * Uploads a single document/image file and returns its stored URL.
 * @param file   the file to upload
 * @param category folder/category (e.g. "customer-docs", "driver-docs", "vehicle-photos")
 * @param label  short label for the document (e.g. "EMIRATES_ID_FRONT")
 */
export async function uploadDocument(
  file: File,
  category: string,
  label: string
): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('category', category);
  formData.append('label', label);

  const response = await apiClient.post('/v1/uploads/document', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data || response.data;
}

export const uploadService = { uploadDocument };
