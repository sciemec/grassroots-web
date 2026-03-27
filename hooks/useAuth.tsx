'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// ─── Types ─────────────────────────────────────────────────────────────────

export interface GrassRootsUser {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'player' | 'club' | 'scout';
  phone: string | null;
  photo_url: string | null;
  is_verified: boolean;
  subscription: string;
  created_at: string;
}

interface AuthState {
  user: GrassRootsUser | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  googleLogin: (googleData: GoogleAuthData) => Promise<void>;
  clearError: () => void;
  isAdmin: boolean;
  isPlayer: boolean;
  isClub: boolean;
  isScout: boolean;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  role?: 'player' | 'club' | 'scout';
  phone?: string;
}

interface GoogleAuthData {
  email: string;
  name: string;
  firebase_uid: string;
  photo_url?: string;
}

// ─── Config ────────────────────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://bhora-ai.onrender.com/api/v1';
const TOKEN_KEY = 'grassroots_token';
const USER_KEY  = 'grassroots_user';

// ─── API Helper ────────────────────────────────────────────────────────────

async function apiCall(endpoint: string, options: RequestInit = {}, token?: string | null) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> || {}),
  };

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json();

  if (!res.ok) {
    // Laravel validation errors come as { errors: { field: ['message'] } }
    if (data.errors) {
      const firstError = Object.values(data.errors as Record<string, string[]>)[0][0];
      throw new Error(firstError);
    }
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
}

// ─── Context ───────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    loading: true,
    error: null,
  });

  // ─── Load saved session on mount ─────────────────────────────────────
  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY);
    const savedUser  = localStorage.getItem(USER_KEY);

    if (savedToken && savedUser) {
      try {
        const user = JSON.parse(savedUser) as GrassRootsUser;
        setState({ user, token: savedToken, loading: false, error: null });
        // Silently verify token is still valid
        verifyToken(savedToken);
      } catch {
        clearSession();
      }
    } else {
      setState(s => ({ ...s, loading: false }));
    }
  }, []);

  const verifyToken = async (token: string) => {
    try {
      const data = await apiCall('/auth/me', {}, token);
      if (data.user) {
        saveSession(token, data.user);
      }
    } catch {
      // Token expired or invalid — clear session
      clearSession();
    }
  };

  const saveSession = (token: string, user: GrassRootsUser) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    setState({ user, token, loading: false, error: null });
  };

  const clearSession = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setState({ user: null, token: null, loading: false, error: null });
  };

  // ─── Login ───────────────────────────────────────────────────────────
  const login = useCallback(async (email: string, password: string) => {
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const data = await apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      saveSession(data.token, data.user);
      redirectByRole(data.user.role);
    } catch (err) {
      setState(s => ({ ...s, loading: false, error: (err as Error).message }));
      throw err;
    }
  }, []);

  // ─── Register ────────────────────────────────────────────────────────
  const register = useCallback(async (formData: RegisterData) => {
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const data = await apiCall('/auth/register', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      saveSession(data.token, data.user);
      redirectByRole(data.user.role);
    } catch (err) {
      setState(s => ({ ...s, loading: false, error: (err as Error).message }));
      throw err;
    }
  }, []);

  // ─── Google Login (Firebase token → Laravel token) ───────────────────
  const googleLogin = useCallback(async (googleData: GoogleAuthData) => {
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const data = await apiCall('/auth/google', {
        method: 'POST',
        body: JSON.stringify(googleData),
      });
      saveSession(data.token, data.user);
      redirectByRole(data.user.role);
    } catch (err) {
      setState(s => ({ ...s, loading: false, error: (err as Error).message }));
      throw err;
    }
  }, []);

  // ─── Logout ──────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await apiCall('/auth/logout', { method: 'POST' }, state.token);
    } catch {
      // Continue logout even if API call fails
    } finally {
      clearSession();
      router.push('/login');
    }
  }, [state.token, router]);

  const clearError = useCallback(() => {
    setState(s => ({ ...s, error: null }));
  }, []);

  // ─── Role-based redirect ─────────────────────────────────────────────
  const redirectByRole = (role: string) => {
    switch (role) {
      case 'admin':  router.push('/admin/dashboard'); break;
      case 'club':   router.push('/club/dashboard');  break;
      case 'scout':  router.push('/scout/dashboard'); break;
      default:       router.push('/player/dashboard'); break;
    }
  };

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    googleLogin,
    clearError,
    isAdmin:  state.user?.role === 'admin',
    isPlayer: state.user?.role === 'player',
    isClub:   state.user?.role === 'club',
    isScout:  state.user?.role === 'scout',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook ──────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

// ─── Utility: get token for API calls outside the hook ─────────────────────

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}
