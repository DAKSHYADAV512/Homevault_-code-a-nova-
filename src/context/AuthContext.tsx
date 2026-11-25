import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface User {
  name: string;
  email: string;
}

interface StoredUser {
  name: string;
  email: string;
  passwordHash: string;
}

interface AuthResult {
  ok: boolean;
  error?: string;
}

interface AuthContextProps {
  user: User | null;
  login: (email: string, password: string) => Promise<AuthResult>;
  signup: (name: string, email: string, password: string) => Promise<AuthResult>;
  logout: () => void;
}

const TOKEN_KEY = 'hmv_token';
const USER_KEY = 'hmv_user';
const USERS_DB_KEY = 'hmv_users_db';

async function hashPassword(password: string): Promise<string> {
  if (typeof window !== 'undefined' && window.crypto?.subtle) {
    const data = new TextEncoder().encode(`homevault_salt_${password}`);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  // Fallback for environments without SubtleCrypto
  return btoa(`homevault_salt_${password}`);
}

function createMockJwt(user: User): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(
    JSON.stringify({
      sub: user.email,
      name: user.name,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24 hours
    })
  );
  const signature = btoa(`hmv_sig_${user.email}_${Date.now()}`);
  return `${header}.${payload}.${signature}`;
}

function isTokenValid(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const payload = JSON.parse(atob(parts[1]));
    if (typeof payload.exp !== 'number') return false;
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

function loadInitialUser(): User | null {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const rawUser = localStorage.getItem(USER_KEY);
    if (!token || !rawUser || !isTokenValid(token)) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      return null;
    }
    const parsed = JSON.parse(rawUser);
    if (parsed && typeof parsed.email === 'string') {
      return {
        name: typeof parsed.name === 'string' ? parsed.name : parsed.email.split('@')[0],
        email: parsed.email,
      };
    }
  } catch {
    // Ignore storage errors
  }
  return null;
}

function getStoredUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_DB_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => loadInitialUser());

  const persistSession = (sessionUser: User) => {
    const token = createMockJwt(sessionUser);
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(sessionUser));
    setUser(sessionUser);
  };

  const login = async (email: string, password: string): Promise<AuthResult> => {
    const normalizedEmail = email.trim().toLowerCase();

    // Built-in demo account
    if (normalizedEmail === 'user@example.com' && password === 'password') {
      persistSession({ name: 'Demo User', email: normalizedEmail });
      return { ok: true };
    }

    const users = getStoredUsers();
    const matched = users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (!matched) {
      return { ok: false, error: 'Invalid email or password. Please try again.' };
    }

    const passwordHash = await hashPassword(password);
    if (matched.passwordHash !== passwordHash) {
      return { ok: false, error: 'Invalid email or password. Please try again.' };
    }

    persistSession({ name: matched.name, email: matched.email });
    return { ok: true };
  };

  const signup = async (name: string, email: string, password: string): Promise<AuthResult> => {
    const trimmedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!trimmedName) {
      return { ok: false, error: 'Please enter your full name.' };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return { ok: false, error: 'Please enter a valid email address.' };
    }
    if (password.length < 6) {
      return { ok: false, error: 'Password must be at least 6 characters long.' };
    }

    const users = getStoredUsers();
    if (
      normalizedEmail === 'user@example.com' ||
      users.some((u) => u.email.toLowerCase() === normalizedEmail)
    ) {
      return { ok: false, error: 'An account with this email already exists.' };
    }

    const passwordHash = await hashPassword(password);
    const newUser: StoredUser = {
      name: trimmedName,
      email: normalizedEmail,
      passwordHash,
    };

    localStorage.setItem(USERS_DB_KEY, JSON.stringify([...users, newUser]));
    persistSession({ name: newUser.name, email: newUser.email });
    return { ok: true };
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
