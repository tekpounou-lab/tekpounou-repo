import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Profile, LanguageCode } from '@/types';
import { supabase, auth } from '@/lib/supabase';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Actions
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, displayName?: string, preferredLanguage?: LanguageCode) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error?: string }>;
  initialize: () => Promise<void>;
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      isLoading: true,
      isAuthenticated: false,

      signIn: async (email: string, password: string) => {
        set({ isLoading: true });
        
        try {
          const { data, error } = await auth.signIn(email, password);
          
          if (error) {
            set({ isLoading: false });
            return { error: error.message };
          }

          if (data.user) {
            // Get user data from our users table
            const { data: userData, error: userError } = await supabase
              .from('users')
              .select('*')
              .eq('id', data.user.id)
              .single();

            if (userError || !userData) {
              set({ isLoading: false });
              return { error: 'User data not found' };
            }

            // Get profile data
            const { data: profileData } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', data.user.id)
              .single();

            // Update last login
            await supabase
              .from('users')
              .update({ last_login: new Date().toISOString() })
              .eq('id', data.user.id);

            set({
              user: userData,
              profile: profileData,
              isAuthenticated: true,
              isLoading: false,
            });
          }

          return {};
        } catch (error) {
          set({ isLoading: false });
          return { error: 'An unexpected error occurred' };
        }
      },

      signUp: async (email: string, password: string, displayName?: string, preferredLanguage: LanguageCode = 'ht-HT') => {
        set({ isLoading: true });
        
        try {
          const { data, error } = await auth.signUp(email, password, {
            display_name: displayName,
            preferred_language: preferredLanguage,
          });
          
          if (error) {
            set({ isLoading: false });
            return { error: error.message };
          }

          if (data.user) {
            // Create user record
            const { error: userError } = await supabase
              .from('users')
              .insert({
                id: data.user.id,
                email: data.user.email!,
                role: 'student', // Default role
              });

            if (userError) {
              console.error('Error creating user record:', userError);
            }

            // Create profile record
            const { error: profileError } = await supabase
              .from('profiles')
              .insert({
                id: data.user.id,
                display_name: displayName || null,
                preferred_language: preferredLanguage,
                roles: ['student'],
              });

            if (profileError) {
              console.error('Error creating profile record:', profileError);
            }
          }

          set({ isLoading: false });
          return {};
        } catch (error) {
          set({ isLoading: false });
          return { error: 'An unexpected error occurred' };
        }
      },

      signOut: async () => {
        set({ isLoading: true });
        
        try {
          await auth.signOut();
          set({
            user: null,
            profile: null,
            isAuthenticated: false,
            isLoading: false,
          });
        } catch (error) {
          console.error('Error signing out:', error);
          set({ isLoading: false });
        }
      },

      updateProfile: async (updates: Partial<Profile>) => {
        const { user } = get();
        if (!user) return { error: 'Not authenticated' };

        try {
          const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', user.id);

          if (error) {
            return { error: error.message };
          }

          // Update local state
          set((state) => ({
            profile: state.profile ? { ...state.profile, ...updates } : null,
          }));

          return {};
        } catch (error) {
          return { error: 'An unexpected error occurred' };
        }
      },

      initialize: async () => {
        set({ isLoading: true });
        
        try {
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session?.user) {
            // Get user data
            const { data: userData } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();

            // Get profile data
            const { data: profileData } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            if (userData) {
              set({
                user: userData,
                profile: profileData,
                isAuthenticated: true,
                isLoading: false,
              });
            } else {
              set({ isLoading: false });
            }
          } else {
            set({ isLoading: false });
          }
        } catch (error) {
          console.error('Error initializing auth:', error);
          set({ isLoading: false });
        }
      },

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setProfile: (profile) => set({ profile }),
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        profile: state.profile,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Listen to auth state changes
supabase.auth.onAuthStateChange(async (event, session) => {
  const { setUser, setProfile, setLoading } = useAuthStore.getState();
  
  if (event === 'SIGNED_IN' && session?.user) {
    // Get user and profile data
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (userData) {
      setUser(userData);
      setProfile(profileData);
    }
  } else if (event === 'SIGNED_OUT') {
    setUser(null);
    setProfile(null);
  }
  
  setLoading(false);
});