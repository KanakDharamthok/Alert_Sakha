import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable';
import { isDisposableEmail } from '@/lib/disposableEmails';
import type { Session } from '@supabase/supabase-js';

export type UserRole = 'guest' | 'staff' | 'manager' | 'security' | 'admin';
export type RequestableRole = Exclude<UserRole, 'admin'>;
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface RoleRequestPayload {
  requested_role: RequestableRole;
  hotel_name?: string;
  employee_id?: string;
  business_license_number?: string;
  organization_name?: string;
  id_proof_url?: string;
}

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
  resendVerification: (email: string) => Promise<void>;
  signup: (
    name: string,
    email: string,
    password: string,
    request: RoleRequestPayload
  ) => Promise<{ requiresEmailConfirmation: boolean }>;
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
    if (error) {
      // Normalise the verification error so the UI can react to it.
      const code = (error as { code?: string }).code;
      if (code === 'email_not_confirmed' || /confirm/i.test(error.message)) {
        const e = new Error('email_not_confirmed');
        (e as Error & { code?: string }).code = 'email_not_confirmed';
        throw e;
      }
      throw error;
    }
  },

  resendVerification: async (email) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) throw error;
  },

  signup: async (name, email, password, request) => {
    if (isDisposableEmail(email)) {
      throw new Error('Disposable or temporary email addresses are not allowed.');
    }
    const redirectUrl = `${window.location.origin}/dashboard`;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          display_name: name,
          requested_role: request.requested_role,
          hotel_name: request.hotel_name ?? '',
          employee_id: request.employee_id ?? '',
          business_license_number: request.business_license_number ?? '',
          organization_name: request.organization_name ?? '',
          id_proof_url: request.id_proof_url ?? '',
        },
      },
    });
    if (error) throw error;
    // If Supabase returns a user but no session, email confirmation is required.
    return { requiresEmailConfirmation: !data.session };
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
