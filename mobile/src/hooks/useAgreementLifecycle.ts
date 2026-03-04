import { useState, useCallback } from 'react';
import agreementApiService from '../services/agreement-api.service';
import type { Agreement } from '../types';

export const useAgreementLifecycle = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agreement, setAgreement] = useState<Agreement | null>(null);

  const createDraft = useCallback(async (data: any): Promise<Agreement> => {
    setLoading(true);
    setError(null);
    try {
      const result = await agreementApiService.createAgreement(data);
      setAgreement(result.data);
      return result.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create agreement';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateDraft = useCallback(async (agreementId: string, data: any): Promise<Agreement> => {
    setLoading(true);
    setError(null);
    try {
      const result = await agreementApiService.updateAgreement(agreementId, data);
      setAgreement(result.data);
      return result.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update agreement';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAgreement = useCallback(async (agreementId: string): Promise<Agreement> => {
    setLoading(true);
    setError(null);
    try {
      const result = await agreementApiService.getAgreement(agreementId);
      setAgreement(result.data);
      return result.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load agreement';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const listAgreements = useCallback(async (filters: Record<string, string | number> = {}): Promise<Agreement[]> => {
    setLoading(true);
    setError(null);
    try {
      const result = await agreementApiService.listAgreements(filters);
      return result.data || [];
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to list agreements';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setAgreement(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    agreement,
    loading,
    error,
    createDraft,
    updateDraft,
    loadAgreement,
    listAgreements,
    reset,
  };
};
