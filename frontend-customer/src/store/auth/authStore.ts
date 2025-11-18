import { create } from 'zustand';
import { authApi } from '@/services/auth';
import type { AuthUser, LoginCredentials, LoginResponse } from '@/services/auth';
import { toast } from 'react-hot-toast';

// Combined store type
type AuthStore = {
  // State
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  requiresTwoFactor: boolean;
  twoFactorMethod?: 'sms' | 'app' | 'email';

  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<unknown>;
  verifyTwoFactorCode: (code: string) => Promise<void>;
  sendTwoFactorCode: (method: 'sms' | 'email') => Promise<void>;
  setUser: (user: AuthUser | null) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  clearTokens: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setRequiresTwoFactor: (requires: boolean, method?: 'sms' | 'app' | 'email' | undefined) => void;
};

// Auth store implementation
export const useAuthStore = create<AuthStore>()((set, get) => ({
      // Initial state
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      requiresTwoFactor: false,
      twoFactorMethod: undefined,

      // Actions
      login: async (credentials: LoginCredentials) => {
        try {
          set({ isLoading: true, error: null });

          const response: LoginResponse = await authApi.login(credentials);

          // Check if 2FA is required
          if (response.requiresTwoFactor) {
            set({
              requiresTwoFactor: true,
              twoFactorMethod: response.twoFactorMethod,
              isLoading: false,
            });
            return; // Don't complete login yet, wait for 2FA
          }

          // Complete login if no 2FA required
          set({
            user: response.user,
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            isAuthenticated: true,
            requiresTwoFactor: false,
            twoFactorMethod: undefined,
            isLoading: false,
            error: null,
          });

          // Save to localStorage
          localStorage.setItem('accessToken', response.accessToken);
          localStorage.setItem('refreshToken', response.refreshToken);

          toast.success('تم تسجيل الدخول بنجاح');
        } catch (error) {
          const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'فشل في تسجيل الدخول';
          set({
            error: message,
            isLoading: false,
            requiresTwoFactor: false,
            twoFactorMethod: undefined
          });
          toast.error(message);
          throw error;
        }
      },

      verifyTwoFactorCode: async (code: string) => {
        try {
          set({ isLoading: true, error: null });

          const response = await authApi.verifyTwoFactorCode(code);

          // Complete login after successful 2FA
          set({
            user: response.user,
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            isAuthenticated: true,
            requiresTwoFactor: false,
            twoFactorMethod: undefined,
            isLoading: false,
            error: null,
          });

          // Save to localStorage
          localStorage.setItem('accessToken', response.accessToken);
          localStorage.setItem('refreshToken', response.refreshToken);

          toast.success('تم التحقق من رمز الأمان بنجاح');
        } catch (error) {
          const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'رمز الأمان غير صحيح';
          set({ error: message, isLoading: false });
          toast.error(message);
          throw error;
        }
      },

      sendTwoFactorCode: async (method: 'sms' | 'email') => {
        try {
          set({ isLoading: true, error: null });

          await authApi.sendTwoFactorCode(method);

          toast.success(`تم إرسال رمز الأمان عبر ${method === 'sms' ? 'الرسائل النصية' : 'البريد الإلكتروني'}`);
          set({ isLoading: false });
        } catch (error) {
          const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'فشل في إرسال رمز الأمان';
          set({ error: message, isLoading: false });
          toast.error(message);
          throw error;
        }
      },

      logout: async () => {
        try {
          set({ isLoading: true });

          // Call API logout (optional, can fail silently)
          try {
            await authApi.logout();
          } catch (apiError) {
            console.warn('API logout failed:', apiError);
          }

          // Clear local storage
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');

          // Clear state
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            requiresTwoFactor: false,
            twoFactorMethod: undefined,
            isLoading: false,
            error: null,
          });

          toast.success('تم تسجيل الخروج بنجاح');
        } catch (error) {
          const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'فشل في تسجيل الخروج';
          set({ error: message, isLoading: false });
          toast.error(message);
        }
      },

      refreshAccessToken: async () => {
        try {
          const { refreshToken } = get();
          if (!refreshToken) {
            throw new Error('No refresh token available');
          }

          const response = await authApi.refreshToken(refreshToken);

          // Update tokens
          set({
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
          });

          // Update localStorage
          localStorage.setItem('accessToken', response.accessToken);
          localStorage.setItem('refreshToken', response.refreshToken);

          return response;
    } catch (error) {
      // If refresh fails, logout
      get().logout();
      throw error;
        }
      },

      setUser: (user: AuthUser | null) => {
        set({ user, isAuthenticated: !!user });
      },

      setTokens: (accessToken: string, refreshToken: string) => {
        set({ accessToken, refreshToken });
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
      },

      clearTokens: () => {
        set({ accessToken: null, refreshToken: null });
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      setRequiresTwoFactor: (requires: boolean, method?: 'sms' | 'app' | 'email') => {
        set({ requiresTwoFactor: requires, twoFactorMethod: method });
      },
    })
);
