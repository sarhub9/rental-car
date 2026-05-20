'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import apiClient from '../lib/api-client';
import { AuthUser } from '../types';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
}

interface AuthContextType extends AuthState {
  requestOtp: (phoneNumber: string, tenantId: string) => Promise<{ otp_code?: string } | undefined>;
  verifyOtp: (phoneNumber: string, tenantId: string, otpCode: string) => Promise<void>;
  staffLogin: (email: string, password: string, tenantId: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    accessToken: null,
    refreshToken: null,
  });

  const setAuthData = useCallback(
    (accessToken: string, refreshToken: string, user: AuthUser) => {
      localStorage.setItem('auth_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
      localStorage.setItem('auth_user', JSON.stringify(user));

      setState({
        isAuthenticated: true,
        isLoading: false,
        user,
        accessToken,
        refreshToken,
      });
    },
    []
  );

  const clearAuthData = useCallback(() => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('auth_user');

    setState({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      accessToken: null,
      refreshToken: null,
    });
  }, []);

  // Check for existing session on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = localStorage.getItem('auth_token');
        const storedRefreshToken = localStorage.getItem('refresh_token');
        const storedUser = localStorage.getItem('auth_user');

        if (!storedToken || !storedRefreshToken || !storedUser) {
          setState((prev) => ({ ...prev, isLoading: false }));
          return;
        }

        const user: AuthUser = JSON.parse(storedUser);

        // Validate the token by attempting a refresh
        try {
          const response = await apiClient.post('/v1/auth/refresh', {
            refresh_token: storedRefreshToken,
          });

          const {
            access_token,
            refresh_token: newRefreshToken,
            user: refreshedUser,
          } = response.data.data;

          setAuthData(access_token, newRefreshToken, refreshedUser || user);
        } catch {
          // If refresh fails, still try using existing token
          // The api-client interceptor will handle 401s
          setState({
            isAuthenticated: true,
            isLoading: false,
            user,
            accessToken: storedToken,
            refreshToken: storedRefreshToken,
          });
        }
      } catch {
        clearAuthData();
      }
    };

    initAuth();
  }, [setAuthData, clearAuthData]);

  const requestOtp = useCallback(async (phoneNumber: string, tenantId: string) => {
    const response = await apiClient.post('/v1/auth/customer/request-otp', {
      phone_number: phoneNumber,
      tenant_id: tenantId,
    });
    return response.data?.data;
  }, []);

  const verifyOtp = useCallback(
    async (phoneNumber: string, tenantId: string, otpCode: string) => {
      const response = await apiClient.post('/v1/auth/customer/verify-otp', {
        phone_number: phoneNumber,
        tenant_id: tenantId,
        otp_code: otpCode,
      });

      const { access_token, refresh_token, user } = response.data.data;
      setAuthData(access_token, refresh_token, user);
    },
    [setAuthData]
  );

  const staffLogin = useCallback(
    async (email: string, password: string, tenantId: string) => {
      const response = await apiClient.post('/v1/auth/staff/login', {
        email,
        password,
        tenant_id: tenantId,
      });

      const { access_token, refresh_token, user } = response.data.data;
      setAuthData(access_token, refresh_token, user);
    },
    [setAuthData]
  );

  const logout = useCallback(async () => {
    try {
      const currentRefreshToken = localStorage.getItem('refresh_token');
      if (currentRefreshToken) {
        await apiClient.post('/v1/auth/logout', {
          refresh_token: currentRefreshToken,
        });
      }
    } catch {
      // Ignore logout API errors - clear local state regardless
    } finally {
      clearAuthData();
    }
  }, [clearAuthData]);

  const refreshSession = useCallback(async () => {
    const currentRefreshToken = localStorage.getItem('refresh_token');
    if (!currentRefreshToken) {
      clearAuthData();
      return;
    }

    try {
      const response = await apiClient.post('/v1/auth/refresh', {
        refresh_token: currentRefreshToken,
      });

      const { access_token, refresh_token: newRefreshToken, user } = response.data.data;
      setAuthData(access_token, newRefreshToken, user);
    } catch {
      clearAuthData();
    }
  }, [setAuthData, clearAuthData]);

  const value: AuthContextType = {
    ...state,
    requestOtp,
    verifyOtp,
    staffLogin,
    logout,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
