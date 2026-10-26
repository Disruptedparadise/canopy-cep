import React, { createContext, useContext, useState, useEffect } from 'react';
import { getSupabase, isSupabaseConfigured } from '../services/supabaseClient';

export interface UserProfile {
  id: string; // Supabase UUID or local ID
  name: string;
  email: string;
  organization?: string;
  role?: 'steward' | 'admin';
  emailReminders: boolean;
  isSupabaseUser?: boolean;
  language?: 'en' | 'hi' | 'mr';
}

export interface AuthContextType {
  user: UserProfile | null;
  isGuest: boolean;
  isConfigured: boolean;
  isLoading: boolean;
  signInWithPassword: (email: string, password: string) => Promise<{ error?: string }>;
  signUpWithPassword: (
    email: string,
    password: string,
    name?: string
  ) => Promise<{ error?: string; requiresConfirmation?: boolean }>;
  signInWithMagicLink: (email: string) => Promise<{ error?: string }>;
  login: (name: string, email: string, organization?: string) => void;
  updateUser: (updates: Partial<UserProfile>) => void;
  requestEmailChange: (newEmail: string) => Promise<{ error?: string; success?: boolean }>;
  logout: () => Promise<void>;
  continueAsGuest: () => void;
}

const AUTH_STORAGE_KEY = 'rootguard_user_profile_v2';
const GUEST_STORAGE_KEY = 'rootguard_is_guest';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // If a previously stored profile derived the display name from the raw email prefix, normalize to Field Steward
        if (
          parsed &&
          parsed.email &&
          (parsed.name === parsed.email.split('@')[0] ||
            parsed.name === 'Planter Steward' ||
            parsed.name === 'Field Planter' ||
            parsed.name === 'Planter')
        ) {
          parsed.name = 'Field Steward';
        }
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  });

  const [isGuest, setIsGuest] = useState<boolean>(() => {
    try {
      const isGuestSaved = localStorage.getItem(GUEST_STORAGE_KEY);
      return isGuestSaved === 'true';
    } catch {
      return false;
    }
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Synchronize with Supabase Auth session if configured
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    // Get current session on load
    supabase.auth
      .getSession()
      .then(({ data: { session }, error }) => {
        if (error) {
          console.warn('Error fetching Supabase auth session:', error.message);
        }
        if (session?.user) {
          const profile: UserProfile = {
            id: session.user.id,
            name:
              session.user.user_metadata?.full_name ||
              session.user.user_metadata?.name ||
              'Field Steward',
            email: session.user.email || '',
            organization: session.user.user_metadata?.organization || 'Community Forestry Project',
            role: 'steward',
            emailReminders: true,
            isSupabaseUser: true,
          };
          setUser(profile);
          setIsGuest(false);
          try {
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(profile));
            localStorage.removeItem(GUEST_STORAGE_KEY);
          } catch (e) {
            console.warn(e);
          }
        }
      })
      .finally(() => {
        setIsLoading(false);
      });

    // Listen to real-time auth state changes (sign-in, sign-out, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        const profile: UserProfile = {
          id: session.user.id,
          name:
            session.user.user_metadata?.full_name ||
            session.user.user_metadata?.name ||
            'Field Steward',
          email: session.user.email || '',
          organization: session.user.user_metadata?.organization || 'Community Forestry Project',
          role: 'steward',
          emailReminders: true,
          isSupabaseUser: true,
        };
        setUser(profile);
        setIsGuest(false);
        try {
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(profile));
          localStorage.removeItem(GUEST_STORAGE_KEY);
        } catch (e) {
          console.warn(e);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        try {
          localStorage.removeItem(AUTH_STORAGE_KEY);
        } catch (e) {
          console.warn(e);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signInWithPassword = async (email: string, password: string): Promise<{ error?: string }> => {
    const supabase = getSupabase();
    if (!supabase) {
      // Fallback offline sign in
      login('Field Steward', email);
      return {};
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        return { error: error.message };
      }

      if (data.user) {
        const profile: UserProfile = {
          id: data.user.id,
          name:
            data.user.user_metadata?.full_name ||
            data.user.user_metadata?.name ||
            'Field Steward',
          email: data.user.email || email,
          organization: data.user.user_metadata?.organization || 'Watershed Canopy Trust',
          role: 'steward',
          emailReminders: true,
          isSupabaseUser: true,
        };
        setUser(profile);
        setIsGuest(false);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(profile));
        localStorage.removeItem(GUEST_STORAGE_KEY);
      }
      return {};
    } catch (err: any) {
      return { error: err?.message || 'Failed to sign in with Supabase.' };
    }
  };

  const signUpWithPassword = async (
    email: string,
    password: string,
    name?: string
  ): Promise<{ error?: string; requiresConfirmation?: boolean }> => {
    const resolvedName = name?.trim() || 'Field Steward';
    const supabase = getSupabase();
    if (!supabase) {
      login(resolvedName, email);
      return {};
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: resolvedName,
            name: resolvedName,
          },
        },
      });

      if (error) {
        return { error: error.message };
      }

      if (data.user && !data.session) {
        // Requires email confirmation
        return { requiresConfirmation: true };
      }

      if (data.user) {
        const profile: UserProfile = {
          id: data.user.id,
          name: resolvedName,
          email: data.user.email || email,
          organization: 'Watershed Canopy Trust',
          role: 'steward',
          emailReminders: true,
          isSupabaseUser: true,
        };
        setUser(profile);
        setIsGuest(false);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(profile));
        localStorage.removeItem(GUEST_STORAGE_KEY);
      }
      return {};
    } catch (err: any) {
      return { error: err?.message || 'Failed to sign up with Supabase.' };
    }
  };

  const signInWithMagicLink = async (email: string): Promise<{ error?: string }> => {
    const supabase = getSupabase();
    if (!supabase) {
      login('Field Steward', email);
      return {};
    }

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) {
        return { error: error.message };
      }
      return {};
    } catch (err: any) {
      return { error: err?.message || 'Failed to send magic link.' };
    }
  };

  const login = (name: string, email: string, organization?: string) => {
    const newUser: UserProfile = {
      id: user?.id || `steward-${Date.now()}`,
      name: name.trim() || 'Field Steward',
      email: email.trim() || 'planter@rootguard.org',
      organization: organization?.trim() || 'Watershed Canopy Trust',
      role: 'steward',
      emailReminders: user?.emailReminders ?? true,
      isSupabaseUser: false,
    };
    setUser(newUser);
    setIsGuest(false);
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
      localStorage.removeItem(GUEST_STORAGE_KEY);
    } catch (e) {
      console.warn('Could not persist auth to localStorage:', e);
    }
  };

  const updateUser = (updates: Partial<UserProfile>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      try {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('Could not persist updated auth to localStorage:', e);
      }
      return updated;
    });
  };

  const requestEmailChange = async (
    newEmail: string
  ): Promise<{ error?: string; success?: boolean }> => {
    const trimmed = newEmail.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@')) {
      return { error: 'Please provide a valid email address.' };
    }

    const supabase = getSupabase();
    if (supabase && user?.isSupabaseUser) {
      try {
        const { error } = await supabase.auth.updateUser(
          { email: trimmed },
          { emailRedirectTo: window.location.origin }
        );
        if (error) {
          return { error: error.message };
        }
        return { success: true };
      } catch (err: any) {
        return {
          error:
            err?.message ||
            'Failed to dispatch email change verification request.',
        };
      }
    }

    if (!user) {
      return { error: 'You must be signed in to modify your account email.' };
    }

    // Local / guest fallback
    return {
      error:
        'Email changes require an active Supabase Cloud session. Direct edits to unverified email addresses are disabled.',
    };
  };

  const logout = async () => {
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('Supabase sign out error:', e);
      }
    }
    setUser(null);
    setIsGuest(false);
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(GUEST_STORAGE_KEY);
    } catch (e) {
      console.warn('Could not clear auth from localStorage:', e);
    }
  };

  const continueAsGuest = () => {
    setUser(null);
    setIsGuest(true);
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.setItem(GUEST_STORAGE_KEY, 'true');
    } catch (e) {
      console.warn('Could not persist guest mode to localStorage:', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isGuest,
        isConfigured: isSupabaseConfigured,
        isLoading,
        signInWithPassword,
        signUpWithPassword,
        signInWithMagicLink,
        login,
        updateUser,
        requestEmailChange,
        logout,
        continueAsGuest,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
