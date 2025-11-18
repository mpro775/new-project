import React, { createContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store';
import type { AuthUser, LoginCredentials } from '@/services/auth';
import type { ReactNode } from 'react';

// Auth context types - now using store interface
interface AuthContextType {
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

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const navigate = useNavigate();
  const {
    user,
    isAuthenticated,
    isLoading,
    requiresTwoFactor,
    twoFactorMethod,
    login: storeLogin,
    logout: storeLogout,
    verifyTwoFactorCode: storeVerifyTwoFactorCode,
    sendTwoFactorCode: storeSendTwoFactorCode,
    setUser,
    setLoading,
  } = useAuthStore();

  // Check if user is authenticated on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('accessToken');

      if (token && !user) {
        try {
          setLoading(true);
          // The store will handle initialization through persistence
          // If we have a token but no user, try to get current user
          const { authApi } = await import('@/services/auth');
          const currentUser = await authApi.getCurrentUser();
          setUser(currentUser);
        } catch (error) {
          console.error('Failed to get current user:', error);
          // Clear invalid tokens
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          setUser(null);
        } finally {
          setLoading(false);
        }
      }
    };

    initializeAuth();
  }, [user, setUser, setLoading]);

  // Login function - delegates to store
  const login = async (credentials: LoginCredentials): Promise<void> => {
    await storeLogin(credentials);
    // Navigate to dashboard only if login was successful and no 2FA required
    if (!requiresTwoFactor) {
      navigate('/dashboard');
    }
  };

  // Verify 2FA code
  const verifyTwoFactorCode = async (code: string): Promise<void> => {
    await storeVerifyTwoFactorCode(code);
    navigate('/dashboard');
  };

  // Send 2FA code
  const sendTwoFactorCode = async (method: 'sms' | 'email'): Promise<void> => {
    await storeSendTwoFactorCode(method);
  };

  // Logout function - delegates to store
  const logout = async (): Promise<void> => {
    await storeLogout();
    navigate('/login');
  };

  // Refresh user data
  const refreshUser = async (): Promise<void> => {
    try {
      const { authApi } = await import('@/services/auth');
      if (localStorage.getItem('accessToken')) {
        const currentUser = await authApi.getCurrentUser();
        setUser(currentUser);
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
      // If refresh fails, logout
      await logout();
    }
  };

  // Context value
  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    requiresTwoFactor,
    twoFactorMethod,
    login,
    verifyTwoFactorCode,
    sendTwoFactorCode,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
