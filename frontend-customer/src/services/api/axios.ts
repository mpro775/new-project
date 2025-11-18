import axios, { AxiosError } from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { toast } from 'react-hot-toast';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';
const TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT || '10000');

// Types for our API responses
export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
  statusCode?: number;
}

export interface ApiError {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const token = localStorage.getItem('accessToken');

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add request ID for tracing
    if (config.headers) {
      config.headers['X-Request-ID'] = Date.now().toString();
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors and token refresh
api.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => {
    return response;
  },
  async (error: AxiosError): Promise<AxiosResponse | AxiosError | undefined> => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Handle network errors
    if (!error.response) {
      toast.error('خطأ في الشبكة. يرجى التحقق من اتصال الإنترنت.');
      return Promise.reject(error);
    }

    const { status, data } = error.response;
    const errorMessage = (data as { message?: string })?.message || 'حدث خطأ غير متوقع';

    // Handle unauthorized errors
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data;

          // Save new tokens
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);

          // Retry original request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }

          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle specific error codes
    switch (status) {
      case 400:
        toast.error('بيانات غير صحيحة. يرجى التحقق من المدخلات.');
        break;
      case 403:
        toast.error('ليس لديك صلاحية للوصول إلى هذا المورد.');
        break;
      case 404:
        toast.error('المورد المطلوب غير موجود.');
        break;
      case 409:
        toast.error('حدث تعارض في البيانات.');
        break;
      case 422:
        toast.error('بيانات التحقق غير صحيحة.');
        break;
      case 429:
        toast.error('تم تجاوز الحد المسموح من الطلبات. يرجى المحاولة لاحقاً.');
        break;
      case 500:
        toast.error('خطأ في الخادم. يرجى المحاولة لاحقاً.');
        break;
      default:
        toast.error(errorMessage);
    }

    return Promise.reject(error);
  }
);

export default api;
