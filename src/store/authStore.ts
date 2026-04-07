import { create } from 'zustand';

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
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  login: async (email: string, _password: string) => {
    // Mock login
    await new Promise(r => setTimeout(r, 800));
    const role: UserRole = email.includes('admin') ? 'admin' : email.includes('staff') ? 'staff' : 'manager';
    set({
      user: { id: '1', name: 'John Doe', email, role, avatar: undefined },
      isAuthenticated: true,
    });
  },
  signup: async (name: string, email: string, _password: string, role: UserRole) => {
    await new Promise(r => setTimeout(r, 800));
    set({
      user: { id: '1', name, email, role, avatar: undefined },
      isAuthenticated: true,
    });
  },
  logout: () => set({ user: null, isAuthenticated: false }),
}));
