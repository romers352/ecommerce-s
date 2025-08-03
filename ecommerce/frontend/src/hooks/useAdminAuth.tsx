import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { api } from '../utils/api';

interface AdminUser {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  isActive: boolean;
  isSuperAdmin: boolean;
  permissions: string[];
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

interface AdminAuthState {
  admin: AdminUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AdminLoginForm {
  identifier: string; // email or username
  password: string;
}

interface AdminAuthContextType extends AdminAuthState {
  login: (credentials: AdminLoginForm) => Promise<void>;
  logout: () => void;
  updateAdmin: (adminData: Partial<AdminUser>) => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const useAdminAuth = (): AdminAuthContextType => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

interface AdminAuthProviderProps {
  children: ReactNode;
}

export const AdminAuthProvider: React.FC<AdminAuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AdminAuthState>({
    admin: null,
    token: localStorage.getItem('adminToken'),
    isAuthenticated: false,
    isLoading: true,
  });

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // Set up API interceptor for admin token
  useEffect(() => {
    if (authState.token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${authState.token}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
  }, [authState.token]);

  const checkAuth = async () => {
    const token = localStorage.getItem('adminToken');
    const storedAdmin = localStorage.getItem('adminUser');
    
    if (!token || !storedAdmin) {
      setAuthState({
        admin: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
      return;
    }

    try {
      // Validate token with backend
      const response = await api.get('/admin/auth/validate-token', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const { admin } = response.data.data;
      
      setAuthState({
        admin,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
      
      // Update stored admin data
      localStorage.setItem('adminUser', JSON.stringify(admin));
    } catch (error) {
      // Token is invalid, clear auth state
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      setAuthState({
        admin: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  };

  const login = async (credentials: AdminLoginForm) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      const response = await api.post('/admin/auth/login', credentials);
      const { admin, tokens } = response.data.data;
      
      localStorage.setItem('adminToken', tokens.accessToken);
      localStorage.setItem('adminUser', JSON.stringify(admin));
      
      setAuthState({
        admin,
        token: tokens.accessToken,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: unknown) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      const errorMessage = error instanceof Error && 'response' in error && 
        typeof error.response === 'object' && error.response !== null &&
        'data' in error.response && typeof error.response.data === 'object' &&
        error.response.data !== null && 'message' in error.response.data &&
        typeof error.response.data.message === 'string'
        ? error.response.data.message
        : 'Admin login failed';
      throw new Error(errorMessage);
    }
  };

  const logout = async () => {
    try {
      // Call logout endpoint to clear server-side session
      await api.post('/admin/auth/logout');
    } catch (error) {
      // Continue with logout even if server call fails
      console.error('Admin logout error:', error);
    } finally {
      // Clear local storage and auth state
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      delete api.defaults.headers.common['Authorization'];
      
      setAuthState({
        admin: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  };

  const updateAdmin = async (adminData: Partial<AdminUser>) => {
    try {
      const response = await api.put('/admin/auth/profile', adminData);
      const { admin } = response.data.data;
      
      setAuthState(prev => ({
        ...prev,
        admin,
      }));
      
      localStorage.setItem('adminUser', JSON.stringify(admin));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error && 
        typeof error.response === 'object' && error.response !== null &&
        'data' in error.response && typeof error.response.data === 'object' &&
        error.response.data !== null && 'message' in error.response.data &&
        typeof error.response.data.message === 'string'
        ? error.response.data.message
        : 'Failed to update admin profile';
      throw new Error(errorMessage);
    }
  };

  const value: AdminAuthContextType = {
    ...authState,
    login,
    logout,
    updateAdmin,
    checkAuth,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export default useAdminAuth;