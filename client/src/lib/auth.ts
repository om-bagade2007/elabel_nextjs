import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from './supabase';
import type { User } from '@supabase/supabase-js';
import type { Profile, ProfileUpdate } from '@/types/profile';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  loginWithMagicLink: (email: string) => Promise<{ success: boolean; error?: string }>;
  loginWithPassword: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (password: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (profile: ProfileUpdate) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  fetchProfile: () => Promise<void>;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      isAuthenticated: false,
      loginWithMagicLink: async (email: string) => {
        try {
          console.log('Attempting magic link login for:', email);
          const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
          });

          if (error) {
            console.error('Magic link login error:', error);
            return { success: false, error: error.message };
          }

          return { success: true };
        } catch (error: any) {
          console.error('Magic link login error:', error);
          return { success: false, error: error.message || 'Login failed' };
        }
      },
      loginWithPassword: async (email: string, password: string) => {
        try {
          console.log('Attempting password login for:', email);

          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          console.log('Login response:', {
            session: data?.session ? 'Session created' : 'No session',
            user: data?.user ? 'User found' : 'No user',
            error: error?.message || 'No error',
          });

          if (error) {
            console.error('Password login error:', error);
            return { success: false, error: error.message };
          }

          if (!data?.user || !data?.session) {
            console.error('No user or session returned from login');
            return { success: false, error: 'Login failed' };
          }

          // Set the user in the store
          set({
            user: data.user,
            isAuthenticated: true,
          });

          // Fetch the user's profile
          await get().fetchProfile();

          return { success: true };
        } catch (error: any) {
          console.error('Password login error:', error);
          return { success: false, error: error.message || 'Login failed' };
        }
      },
      register: async (email: string, password: string) => {
        try {
          console.log('Starting registration process for:', email);

          // Attempt to sign up the user
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/auth/callback`,
              data: {
                email_confirm: true,
              },
            },
          });

          console.log('Registration response:', {
            user: data?.user?.id ? 'User created' : 'No user created',
            error: error?.message || 'No error',
          });

          if (error) {
            console.error('Registration error:', error);
            return { success: false, error: error.message };
          }

          // Verify user was created
          if (!data?.user?.id) {
            console.error('No user ID returned from registration');
            return {
              success: false,
              error: 'Failed to create user account',
            };
          }

          // Profile will be created automatically by the database trigger
          console.log('User created successfully:', {
            id: data.user.id,
            email: data.user.email,
            emailConfirmed: data.user.email_confirmed_at,
            createdAt: data.user.created_at,
          });

          return { success: true };
        } catch (error: any) {
          console.error('Registration error:', error);
          return {
            success: false,
            error: error.message || 'Registration failed',
          };
        }
      },
      fetchProfile: async () => {
        const { user } = get();
        if (!user) return;

        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (error) {
            console.error('Error fetching profile:', error);
            return;
          }

          set({ profile });
        } catch (error) {
          console.error('Error fetching profile:', error);
        }
      },
      updateProfile: async (profileData: ProfileUpdate) => {
        const { user } = get();
        if (!user) {
          return { success: false, error: 'Not authenticated' };
        }

        try {
          const { data, error } = await supabase
            .from('profiles')
            .update(profileData)
            .eq('id', user.id)
            .select()
            .single();

          if (error) {
            console.error('Profile update error:', error);
            return { success: false, error: error.message };
          }

          set({ profile: data });
          return { success: true };
        } catch (error: any) {
          console.error('Profile update error:', error);
          return {
            success: false,
            error: error.message || 'Failed to update profile',
          };
        }
      },
      resetPassword: async (email: string) => {
        try {
          console.log('Attempting password reset for:', email);
          const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/callback?reset=true`,
          });

          if (error) {
            console.error('Password reset error:', error);
            return { success: false, error: error.message };
          }

          return { success: true };
        } catch (error: any) {
          console.error('Password reset error:', error);
          return { success: false, error: error.message || 'Password reset failed' };
        }
      },
      updatePassword: async (password: string) => {
        try {
          console.log('Attempting password update');
          const { error } = await supabase.auth.updateUser({
            password,
          });

          if (error) {
            console.error('Password update error:', error);
            return { success: false, error: error.message };
          }

          return { success: true };
        } catch (error: any) {
          console.error('Password update error:', error);
          return { success: false, error: error.message || 'Password update failed' };
        }
      },
      logout: async () => {
        try {
          console.log('Attempting logout');
          await supabase.auth.signOut();
          set({ user: null, isAuthenticated: false });
        } catch (error) {
          console.error('Logout error:', error);
        }
      },
      setUser: (user: User | null) => {
        set({ user, isAuthenticated: !!user });
        if (user) {
          get().fetchProfile();
        } else {
          set({ profile: null });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: {
        getItem: async (name) => {
          const str = typeof window !== 'undefined' ? window.localStorage.getItem(name) : null;
          return str ? JSON.parse(str) : null;
        },
        setItem: async (name, value) => {
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(name, JSON.stringify(value));
          }
        },
        removeItem: async (name) => {
          if (typeof window !== 'undefined') {
            window.localStorage.removeItem(name);
          }
        },
      },
    },
  ),
);

// Keep the UI's persisted auth flag in sync with Supabase's actual session.
supabase.auth.onAuthStateChange((_event, session) => {
  useAuth.setState((state) => ({
    user: session?.user ?? null,
    isAuthenticated: !!session?.user,
    profile: session?.user?.id === state.user?.id ? state.profile : null,
  }));
});
