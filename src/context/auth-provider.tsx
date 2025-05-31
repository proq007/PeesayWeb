// context/auth-provider.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

// Create an axios instance for API calls
const api = axios.create({
  baseURL: '/',
  withCredentials: true,
});

// Prevent infinite refresh loops by tracking refresh attempts
let isRefreshing = false;
let refreshAttempts = 0;
const MAX_REFRESH_ATTEMPTS = 3;

// Interceptor for handling token expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Only attempt refresh if:
    // 1. Error is 401 (Unauthorized)
    // 2. We haven't already tried to refresh for this request
    // 3. We haven't exceeded max refresh attempts
    // 4. We're not currently refreshing
    if (
      error.response?.status === 401 && 
      !originalRequest._retry && 
      refreshAttempts < MAX_REFRESH_ATTEMPTS && 
      !isRefreshing
    ) {
      isRefreshing = true;
      originalRequest._retry = true;
      refreshAttempts++;
      
      try {
        // Call our refresh token endpoint
        await api.post('/api/auth/refresh');
        
        // Reset refresh tracking after successful refresh
        isRefreshing = false;
        
        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, we're done - redirect to login
        isRefreshing = false;
        
        // Clear attempts after a delay
        setTimeout(() => {
          refreshAttempts = 0;
        }, 5000);
        
        // Redirect to login page
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Define user type based on backend response
type User = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
};

// Auth context type
type AuthContextType = {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  // Check authentication status on initial load
  useEffect(() => {
    const loadUser = async () => {
      try {
        // Check if we have a token by calling our user endpoint
        const { data } = await api.get('/api/auth/user');
        
        if (data) {
          setUser(data);
        } else {
          setUser(null);
        }
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    
    loadUser();
  }, []);
  
  // Login function
  const login = async (email: string, password: string) => {
    try {
      setError(null);
      const { data } = await api.post('/api/auth/login', { email, password });
      setUser(data);
      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    }
  };
  
  // Signup function
  const signup = async (userData: any) => {
    try {
      setError(null);
      const { data } = await api.post('/api/auth/signup', userData);
      
      // After signup, automatically log in
      await login(userData.email, userData.password);
    } catch (err: any) {
      console.error('Signup error:', err);
      setError(err.response?.data?.message || 'Signup failed. Please try again.');
    }
  };
  
  // Logout function
  const logout = async () => {
    try {
      await api.delete('/api/auth/logout');
      setUser(null);
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Logout error:', err);
      // Even if server logout fails, clear user on client
      setUser(null);
      router.push('/login');
      router.refresh();
    }
  };
  
  return (
    <AuthContext.Provider value={{ user, loading, error, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};