import React, { createContext, useEffect, useReducer, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthApiService, { AuthResponse } from '../services/auth-api.service';

// Storage keys
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'auth_user',
};

// Auth user type
export interface AuthUser {
  id: string;
  tenant_id: string;
  role: string;
  customer_id?: string;
  full_name: string;
  phone_number: string;
  email?: string;
  profile_photo_url?: string;
}

// Auth state
interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
}

// Actions
type AuthAction =
  | { type: 'RESTORE_TOKEN'; accessToken: string; refreshToken: string; user: AuthUser }
  | { type: 'SIGN_IN'; accessToken: string; refreshToken: string; user: AuthUser }
  | { type: 'SIGN_OUT' }
  | { type: 'LOADING_COMPLETE' }
  | { type: 'TOKEN_REFRESHED'; accessToken: string; refreshToken: string };

// Context type
export interface AuthContextType extends AuthState {
  requestOtp: (phoneNumber: string, tenantId: string) => Promise<{ expires_in_seconds: number; otp_code?: string }>;
  verifyOtp: (phoneNumber: string, tenantId: string, otpCode: string) => Promise<void>;
  staffLogin: (email: string, password: string, tenantId: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
}

// Reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'RESTORE_TOKEN':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: true,
        accessToken: action.accessToken,
        refreshToken: action.refreshToken,
        user: action.user,
      };
    case 'SIGN_IN':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: true,
        accessToken: action.accessToken,
        refreshToken: action.refreshToken,
        user: action.user,
      };
    case 'SIGN_OUT':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: false,
        accessToken: null,
        refreshToken: null,
        user: null,
      };
    case 'LOADING_COMPLETE':
      return { ...state, isLoading: false };
    case 'TOKEN_REFRESHED':
      return {
        ...state,
        accessToken: action.accessToken,
        refreshToken: action.refreshToken,
      };
    default:
      return state;
  }
};

// Initial state
const initialState: AuthState = {
  isAuthenticated: false,
  isLoading: true,
  user: null,
  accessToken: null,
  refreshToken: null,
};

// Create context
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // On mount: restore tokens from storage
  useEffect(() => {
    const restoreAuth = async () => {
      try {
        const accessToken = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
        const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
        const userStr = await AsyncStorage.getItem(STORAGE_KEYS.USER);

        if (accessToken && refreshToken && userStr) {
          const user = JSON.parse(userStr) as AuthUser;
          dispatch({ type: 'RESTORE_TOKEN', accessToken, refreshToken, user });
        } else {
          dispatch({ type: 'LOADING_COMPLETE' });
        }
      } catch {
        dispatch({ type: 'LOADING_COMPLETE' });
      }
    };

    restoreAuth();
  }, []);

  // Save auth data to storage
  const saveAuthData = async (data: AuthResponse) => {
    await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.access_token);
    await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refresh_token);
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));
  };

  // Clear auth data from storage
  const clearAuthData = async () => {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.ACCESS_TOKEN,
      STORAGE_KEYS.REFRESH_TOKEN,
      STORAGE_KEYS.USER,
    ]);
  };

  // Request OTP
  const requestOtp = useCallback(async (phoneNumber: string, tenantId: string) => {
    const result = await AuthApiService.requestOtp(phoneNumber, tenantId);
    return {
      expires_in_seconds: result.expires_in_seconds,
      otp_code: result.otp_code,
    };
  }, []);

  // Verify OTP
  const verifyOtp = useCallback(async (phoneNumber: string, tenantId: string, otpCode: string) => {
    const data = await AuthApiService.verifyOtp(phoneNumber, tenantId, otpCode);
    await saveAuthData(data);
    dispatch({
      type: 'SIGN_IN',
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      user: data.user,
    });
  }, []);

  // Staff Login
  const staffLogin = useCallback(async (email: string, password: string, tenantId: string) => {
    const data = await AuthApiService.staffLogin(email, password, tenantId);
    await saveAuthData(data);
    dispatch({
      type: 'SIGN_IN',
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      user: data.user,
    });
  }, []);

  // Logout
  const logout = useCallback(async () => {
    try {
      if (state.accessToken) {
        await AuthApiService.logout(state.accessToken);
      }
    } catch {
      // Ignore logout API errors - still clear local state
    }
    await clearAuthData();
    dispatch({ type: 'SIGN_OUT' });
  }, [state.accessToken]);

  // Refresh session
  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      if (!state.refreshToken) return false;

      const data = await AuthApiService.refreshToken(state.refreshToken);
      await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.access_token);
      await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refresh_token);
      dispatch({
        type: 'TOKEN_REFRESHED',
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
      });
      return true;
    } catch {
      // Refresh failed - force logout
      await clearAuthData();
      dispatch({ type: 'SIGN_OUT' });
      return false;
    }
  }, [state.refreshToken]);

  const contextValue: AuthContextType = {
    ...state,
    requestOtp,
    verifyOtp,
    staffLogin,
    logout,
    refreshSession,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
