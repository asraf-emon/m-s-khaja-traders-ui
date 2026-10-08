'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut, type User } from 'firebase/auth';
import { Toaster } from 'sonner';
import { messages, type Locale, type MessageKey } from '@/i18n/messages';
import { api } from '@/lib/api';
import { getFirebaseAuth } from '@/lib/firebase';
import type { CartLine, Profile } from '@/types';

type I18nValue = { locale: Locale; setLocale: (locale: Locale) => void; t: (key: MessageKey) => string };
type ThemeValue = { theme: 'light' | 'dark'; toggle: () => void };
type AuthValue = {
  ready: boolean;
  user: User | null;
  profile: Profile | null;
  token: () => Promise<string | null>;
  signOut: () => Promise<void>;
  can: (permission: string) => boolean;
  refreshProfile: () => Promise<void>;
};
type CartValue = {
  lines: CartLine[];
  count: number;
  total: number;
  add: (line: CartLine) => void;
  setQty: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
};

const I18nContext = createContext<I18nValue | null>(null);
const ThemeContext = createContext<ThemeValue | null>(null);
const AuthContext = createContext<AuthValue | null>(null);
const CartContext = createContext<CartValue | null>(null);

export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) throw new Error('useI18n must be used inside Providers');
  return value;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used inside Providers');
  return value;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside Providers');
  return value;
}

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error('useCart must be used inside Providers');
  return value;
}

export function localized(locale: Locale, item: { name: string; nameBn?: string }) {
  return locale === 'bn' && item.nameBn ? item.nameBn : item.name;
}

export function Providers({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ready, setReady] = useState(false);
  const [lines, setLines] = useState<CartLine[]>([]);

  useEffect(() => {
    const storedLocale = localStorage.getItem('khaja-locale');
    const storedTheme = localStorage.getItem('khaja-theme');
    if (storedLocale === 'bn' || storedLocale === 'en') setLocaleState(storedLocale);
    if (storedTheme === 'dark' || storedTheme === 'light') setTheme(storedTheme);
    const storedCart = localStorage.getItem('khaja-cart');
    if (storedCart) {
      try {
        setLines(JSON.parse(storedCart) as CartLine[]);
      } catch {
        localStorage.removeItem('khaja-cart');
      }
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale === 'bn' ? 'bn' : 'en';
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [locale, theme]);

  useEffect(() => {
    localStorage.setItem('khaja-cart', JSON.stringify(lines));
  }, [lines]);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
      setReady(true);
      return;
    }
    return onAuthStateChanged(auth, async (next) => {
      setUser(next);
      if (!next) {
        setProfile(null);
        setReady(true);
        return;
      }
      try {
        const token = await next.getIdToken();
        setProfile(await api<Profile>('/api/auth/me', { token }));
      } catch {
        setProfile(null);
      } finally {
        setReady(true);
      }
    });
  }, []);

  const i18n = useMemo<I18nValue>(() => ({
    locale,
    setLocale: (next) => {
      setLocaleState(next);
      localStorage.setItem('khaja-locale', next);
    },
    t: (key) => messages[locale][key] ?? messages.en[key],
  }), [locale]);

  const themeValue = useMemo<ThemeValue>(() => ({
    theme,
    toggle: () => {
      const next = theme === 'dark' ? 'light' : 'dark';
      setTheme(next);
      localStorage.setItem('khaja-theme', next);
    },
  }), [theme]);

  const authValue = useMemo<AuthValue>(() => ({
    ready,
    user,
    profile,
    token: async () => user?.getIdToken() ?? null,
    signOut: async () => {
      const auth = getFirebaseAuth();
      if (auth) await firebaseSignOut(auth);
      setProfile(null);
    },
    can: (permission) => profile?.role === 'ADMIN' || Boolean(profile?.permissions.includes(permission)),
    refreshProfile: async () => {
      if (!user) return;
      const token = await user.getIdToken();
      setProfile(await api<Profile>('/api/auth/me', { token }));
    },
  }), [profile, ready, user]);

  const cartValue = useMemo<CartValue>(() => {
    const add = (line: CartLine) => {
      setLines((current) => {
        const existing = current.find((item) => item.productId === line.productId);
        if (!existing) return [...current, { ...line, quantity: Math.min(line.quantity, line.stock) }];
        const quantity = Math.min(existing.quantity + line.quantity, line.stock);
        return current.map((item) => item.productId === line.productId ? { ...item, quantity, stock: line.stock, price: line.price } : item);
      });
    };
    return {
      lines,
      count: lines.reduce((sum, line) => sum + line.quantity, 0),
      total: lines.reduce((sum, line) => sum + line.price * line.quantity, 0),
      add,
      setQty: (productId, quantity) => {
        setLines((current) => current.flatMap((item) => {
          if (item.productId !== productId) return [item];
          if (quantity <= 0) return [];
          return [{ ...item, quantity: Math.min(quantity, item.stock) }];
        }));
      },
      remove: (productId) => setLines((current) => current.filter((item) => item.productId !== productId)),
      clear: () => setLines([]),
    };
  }, [lines]);

  return (
    <I18nContext.Provider value={i18n}>
      <ThemeContext.Provider value={themeValue}>
        <AuthContext.Provider value={authValue}>
          <CartContext.Provider value={cartValue}>
            {children}
            <Toaster richColors position="top-center" theme={theme} />
          </CartContext.Provider>
        </AuthContext.Provider>
      </ThemeContext.Provider>
    </I18nContext.Provider>
  );
}
