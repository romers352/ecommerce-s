import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, AuthState, LoginForm, RegisterForm } from '../types';
import { api } from '../utils/api';

interface AuthContextType extends AuthState {
  login: (credentials: LoginForm) => Promise<void>;
  register: (userData: RegisterForm) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: localStorage.getItem('token'),
    isAuthenticated: false,
    isLoading: true,
  });

  // Check if user is authenticated on app load
  useEffect(() => {
    const token = localStorage.getItem('token');
    console.log('[useAuth] Initial token check:', { token: !!token, tokenLength: token?.length });
    if (token) {
      validateToken(token);
    } else {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const validateToken = async (token: string) => {
    try {
      console.log('[useAuth] Validating token:', { tokenLength: token.length, tokenStart: token.substring(0, 20) + '...' });
      const response = await api.get('/auth/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('[useAuth] Token validation successful:', { user: response.data.data.user?.id });
      setAuthState({
        user: response.data.data.user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      console.error('[useAuth] Token validation failed:', { 
        status: error.response?.status, 
        message: error.response?.data?.message,
        error: error.message 
      });
      localStorage.removeItem('token');
      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  };

  const login = async (credentials: LoginForm) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      console.log('[useAuth] Attempting login for:', credentials.email);
      const response = await api.post('/auth/login', credentials);
      const { user, tokens } = response.data.data;
      
      console.log('[useAuth] Login successful:', { userId: user.id, tokenLength: tokens.accessToken.length });
      localStorage.setItem('token', tokens.accessToken);
      
      setAuthState({
        user,
        token: tokens.accessToken,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: unknown) {
      console.error('[useAuth] Login failed:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
      const errorMessage = error instanceof Error && 'response' in error && 
        typeof error.response === 'object' && error.response !== null &&
        'data' in error.response && typeof error.response.data === 'object' &&
        error.response.data !== null && 'message' in error.response.data &&
        typeof error.response.data.message === 'string'
        ? error.response.data.message
        : 'Login failed';
      throw new Error(errorMessage);
    }
  };

  const register = async (userData: RegisterForm) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      console.log('[useAuth] Attempting registration for:', userData.email);
      const response = await api.post('/auth/register', userData);
      
      console.log('[useAuth] Registration successful:', response.data.message);
      // Registration successful but user needs to verify email
      // Don't set authentication state since user isn't logged in yet
      setAuthState(prev => ({ ...prev, isLoading: false }));
    } catch (error: unknown) {
      console.error('[useAuth] Registration failed:', error);
      setAuthState(prev => ({ ...prev, isLoading: false }));
      const errorMessage = error instanceof Error && 'response' in error && 
        typeof error.response === 'object' && error.response !== null &&
        'data' in error.response && typeof error.response.data === 'object' &&
        error.response.data !== null && 'message' in error.response.data &&
        typeof error.response.data.message === 'string'
        ? error.response.data.message
        : 'Registration failed';
      throw new Error(errorMessage);
    }
  };

  const logout = () => {
    console.log('[useAuth] Logging out user');
    localStorage.removeItem('token');
    setAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  };

  const updateUser = async (userData: Partial<User>) => {
    try {
      const response = await api.put('/users/profile', userData, {
        headers: { Authorization: `Bearer ${authState.token}` }
      });
      
      setAuthState(prev => ({
        ...prev,
        user: response.data.data || response.data.user,
      }));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error && 
        typeof error.response === 'object' && error.response !== null &&
        'data' in error.response && typeof error.response.data === 'object' &&
        error.response.data !== null && 'message' in error.response.data &&
        typeof error.response.data.message === 'string'
        ? error.response.data.message
        : 'Update failed';
      throw new Error(errorMessage);
    }
  };

  const value: AuthContextType = {
    ...authState,
    login,
    register,
    logout,
    updateUser,
    updateProfile: updateUser, // Alias for updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default useAuth;