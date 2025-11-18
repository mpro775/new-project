import { api } from '../api';
import type { ApiResponse } from '../api';

// Types based on backend DTOs
export interface LoginCredentials {
  username: string;
  password: string;
  twoFactorCode?: string;
}

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: string;
  branch?: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
  expiresIn: number;
  requiresTwoFactor?: boolean;
  twoFactorMethod?: 'sms' | 'app' | 'email' | undefined;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  requiresTwoFactor: boolean;
  twoFactorMethod?: 'sms' | 'app' | 'email';
  login: (credentials: LoginCredentials) => Promise<void>;
  verifyTwoFactorCode: (code: string) => Promise<void>;
  sendTwoFactorCode: (method: 'sms' | 'email') => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

// Auth API service
export const authApi = {
  /**
   * تسجيل الدخول
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await api.post<ApiResponse<LoginResponse>>('/auth/login', credentials);
    return response.data.data;
  },

  /**
   * تسجيل الخروج
   */
  async logout(): Promise<{ message: string }> {
    const response = await api.post<ApiResponse<{ message: string }>>('/auth/logout');
    return response.data.data;
  },

  /**
   * تحديث الرمز المميز
   */
  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    const response = await api.post<ApiResponse<RefreshTokenResponse>>('/auth/refresh', {
      refreshToken,
    });
    return response.data.data;
  },

  /**
   * الحصول على معلومات المستخدم الحالي
   */
  async getCurrentUser(): Promise<AuthUser> {
    const response = await api.get<ApiResponse<AuthUser>>('/auth/me');
    return response.data.data;
  },

  /**
   * التحقق من صحة الرمز المميز
   */
  async verifyToken(): Promise<{ valid: boolean; user: AuthUser }> {
    const response = await api.get<ApiResponse<{ valid: boolean; user: AuthUser }>>('/auth/verify');
    return response.data.data;
  },

  /**
   * إرسال رمز 2FA
   */
  async sendTwoFactorCode(method: 'sms' | 'email'): Promise<{ message: string }> {
    const response = await api.post<ApiResponse<{ message: string }>>('/auth/2fa/send', { method });
    return response.data.data;
  },

  /**
   * التحقق من رمز 2FA
   */
  async verifyTwoFactorCode(code: string): Promise<LoginResponse> {
    const response = await api.post<ApiResponse<LoginResponse>>('/auth/2fa/verify', { code });
    return response.data.data;
  },

  /**
   * تفعيل/إلغاء تفعيل 2FA
   */
  async toggleTwoFactor(enabled: boolean, method?: 'sms' | 'app' | 'email'): Promise<{ message: string }> {
    const response = await api.post<ApiResponse<{ message: string }>>('/auth/2fa/toggle', { enabled, method });
    return response.data.data;
  },

  /**
   * إعداد 2FA بالتطبيق
   */
  async setupTwoFactorApp(): Promise<{ secret: string; qrCodeUrl: string }> {
    const response = await api.post<ApiResponse<{ secret: string; qrCodeUrl: string }>>('/auth/2fa/setup/app');
    return response.data.data;
  },

  /**
   * تغيير كلمة المرور
   */
  async changePassword(data: ChangePasswordData): Promise<{ message: string }> {
    const response = await api.patch<ApiResponse<{ message: string }>>('/auth/password', data);
    return response.data.data;
  },
};

export default authApi;
