import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';
import type { Session } from '@supabase/supabase-js';

export type UserRole = 'guest' | 'staff' | 'manager' | 'security' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  loading: boolean;
  initialize: () => () => void;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

async function buildUser(session: Session | null): Promise<User | null> {
  if (!session?.user) return null;
  const u = session.user;
  const meta = (u.user_metadata ?? {}) as Record<string, unknown>;

  const [{ data: profile }, { data: roleRow }] = await Promise.all([
    supabase.from('profiles').select('display_name, avatar_url').eq('user_id', u.id).maybeSingle(),
    supabase.from('user_roles').select('role').eq('user_id', u.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
  ]);

  return {
    id: u.id,
    email: u.email ?? '',
    name: profile?.display_name || (meta.full_name as string) || (meta.display_name as string) || (u.email?.split('@')[0] ?? 'User'),
    avatar: profile?.avatar_url || (meta.avatar_url as string | undefined),
    role: (roleRow?.role as UserRole) ?? 'guest',
  };
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  isAuthenticated: false,
  loading: true,

  initialize: () => {
    // Listen first, then fetch existing session
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, isAuthenticated: !!session });
      // Defer Supabase calls to avoid deadlocks inside the callback
      setTimeout(async () => {
        const user = await buildUser(session);
        set({ user, loading: false });
      }, 0);
    });

    supabase.auth.getSession().then(async ({ data }) => {
      const session = data.session;
      const user = await buildUser(session);
      set({ session, user, isAuthenticated: !!session, loading: false });
    });

    return () => sub.subscription.unsubscribe();
  },

  login: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  },

  signup: async (name, email, password, role) => {
    const redirectUrl = `${window.location.origin}/dashboard`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { display_name: name, role },
      },
    });
    if (error) throw error;
  },

  loginWithGoogle: async () => {
    const result = await lovable.auth.signInWithOAuth('google', {
      redirect_uri: `${window.location.origin}/dashboard`,
    });
    if (result.error) throw result.error;
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, session: null, isAuthenticated: false });
    void get;
  },
}));
