// src/stores/authStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User, Profile, LanguageCode } from "@/types";
import { supabase } from "@/lib/supabase";

interface AuthState {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Actions
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error?: string }>;
  signUp: (
    email: string,
    password: string,
    displayName?: string,
    preferredLanguage?: LanguageCode
  ) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (
    updates: Partial<Profile>
  ) => Promise<{ error?: string }>;
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

      // Sign in with email + password
      signIn: async (email, password) => {
        set({ isLoading: true });

        if (!supabase) {
          set({ isLoading: false });
          return { error: "Supabase is not configured. Please check your environment variables." };
        }

        try {
          const { data, error } =
            await supabase.auth.signInWithPassword({
              email,
              password,
            });

          if (error) {
            set({ isLoading: false });
            return { error: error.message };
          }

          if (data.user) {
            // Fetch user
            const { data: userData, error: userError } =
              await supabase
                .from("users")
                .select("*")
                .eq("id", data.user.id)
                .single();

            if (userError || !userData) {
              set({ isLoading: false });
              return { error: "User data not found" };
            }

            // Fetch profile
            const { data: profileData } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", data.user.id)
              .single();

            // Update last login
            await supabase
              .from("users")
              .update({ last_login: new Date().toISOString() })
              .eq("id", data.user.id);

            set({
              user: userData,
              profile: profileData,
              isAuthenticated: true,
              isLoading: false,
            });
          }

          return {};
        } catch (err) {
          set({ isLoading: false });
          return { error: "An unexpected error occurred" };
        }
      },

      // Sign up with email + password
      signUp: async (
        email,
        password,
        displayName,
        preferredLanguage: LanguageCode = "ht-HT"
      ) => {
        set({ isLoading: true });

        if (!supabase) {
          set({ isLoading: false });
          return { error: "Supabase is not configured. Please check your environment variables." };
        }

        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                display_name: displayName,
                preferred_language: preferredLanguage,
              },
            },
          });

          if (error) {
            set({ isLoading: false });
            return { error: error.message };
          }

          if (data.user) {
            // Create user record
            const { error: userError } = await supabase
              .from("users")
              .insert({
                id: data.user.id,
                email: data.user.email!,
                role: "student", // default role
              });

            if (userError) {
              console.error("Error creating user record:", userError);
            }

            // Create profile record
            const { error: profileError } = await supabase
              .from("profiles")
              .insert({
                id: data.user.id,
                display_name: displayName || null,
                preferred_language: preferredLanguage,
                roles: ["student"],
              });

            if (profileError) {
              console.error(
                "Error creating profile record:",
                profileError
              );
            }
          }

          set({ isLoading: false });
          return {};
        } catch (err) {
          set({ isLoading: false });
          return { error: "An unexpected error occurred" };
        }
      },

      // Sign out
      signOut: async () => {
        set({ isLoading: true });
        
        if (!supabase) {
          set({
            user: null,
            profile: null,
            isAuthenticated: false,
            isLoading: false,
          });
          return;
        }
        
        try {
          await supabase.auth.signOut();
          set({
            user: null,
            profile: null,
            isAuthenticated: false,
            isLoading: false,
          });
        } catch (err) {
          console.error("Error signing out:", err);
          set({ isLoading: false });
        }
      },

      // Update profile
      updateProfile: async (updates) => {
        const { user } = get();
        if (!user) return { error: "Not authenticated" };

        if (!supabase) {
          return { error: "Supabase is not configured. Please check your environment variables." };
        }

        try {
          const { error } = await supabase
            .from("profiles")
            .update(updates)
            .eq("id", user.id);

          if (error) {
            return { error: error.message };
          }

          // Update local state
          set((state) => ({
            profile: state.profile
              ? { ...state.profile, ...updates }
              : null,
          }));

          return {};
        } catch (err) {
          return { error: "An unexpected error occurred" };
        }
      },

      // Initialize auth state
      initialize: async () => {
        set({ isLoading: true });

        try {
          const {
            data: { session },
          } = await supabase.auth.getSession();

          if (session?.user) {
            const { data: userData } = await supabase
              .from("users")
              .select("*")
              .eq("id", session.user.id)
              .single();

            const { data: profileData } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", session.user.id)
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
        } catch (err) {
          console.error("Error initializing auth:", err);
          set({ isLoading: false });
        }
      },

      // State setters
      setUser: (user) =>
        set({ user, isAuthenticated: !!user }),
      setProfile: (profile) => set({ profile }),
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        profile: state.profile,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Supabase auth state listener
if (supabase) {
  supabase.auth.onAuthStateChange(async (event, session) => {
    const { setUser, setProfile, setLoading } =
      useAuthStore.getState();

    if (event === "SIGNED_IN" && session?.user) {
      const { data: userData } = await supabase
        .from("users")
        .select("*")
        .eq("id", session.user.id)
        .single();

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (userData) {
        setUser(userData);
        setProfile(profileData);
      }
    } else if (event === "SIGNED_OUT") {
      setUser(null);
      setProfile(null);
    }

    setLoading(false);
  });
}
