import { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { messagingService } from '@/lib/unified-messaging.service';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error?: string; success?: boolean; message?: string }>;
  signIn: (email: string, password: string) => Promise<{ error?: string; success?: boolean; message?: string }>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  isEmailVerified: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const queryClient = useQueryClient();

  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        return { error: error.message };
      }

      if (data.user && !data.user.email_confirmed_at) {
        return { success: true, message: 'Please check your email to verify your account' };
      }

      return { success: true };
    } catch (error) {
      return { error: 'Signup failed' };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      if (data.user && !data.user.email_confirmed_at) {
        return { error: 'Please verify your email before signing in' };
      }

      // Mark user online immediately after successful sign-in (non-blocking)
      if (data.user?.id) {
        messagingService.updateUserStatus(data.user.id, true);
      }

      return { success: true };
    } catch (error) {
      return { error: 'Login failed' };
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      // Mark user offline before signing out (non-blocking)
      if (user?.id) {
        try {
          await messagingService.updateUserStatus(user.id, false);
          messagingService.cleanup();
        } catch (e) {
          console.warn('Messaging cleanup failed:', e);
        }
      }

      // Clear Supabase session
      await supabase.auth.signOut();

      // Clear any potential lingering items in localStorage
      localStorage.removeItem('supabase.auth.token');

    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      // Force clear local state regardless of API result
      setSession(null);
      setUser(null);
      setLoading(false);

      // Clear all react-query and memory cache
      queryClient.clear();

      // Optional: force reload to catch all leakages
      // window.location.href = '/signin';
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Presence lifecycle: mark online when we have a user; mark offline on unload
  useEffect(() => {
    if (!user?.id) return;

    // Ensure status is set to online when a session/user is present
    messagingService.updateUserStatus(user.id, true);

    const handleBeforeUnload = () => {
      // Fire-and-forget best effort to mark offline
      messagingService.updateUserStatus(user.id!, false);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user?.id]);

  const value = useMemo(() => ({
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    isAuthenticated: !!user,
    isEmailVerified: !!user?.email_confirmed_at,
  }), [user, session, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Custom hook for protecting routes
export function useRequireAuth() {
  const { isAuthenticated, loading } = useAuth();
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      setRedirectTo('/signin');
    }
  }, [isAuthenticated, loading]);

  return { redirectTo, loading };
}
