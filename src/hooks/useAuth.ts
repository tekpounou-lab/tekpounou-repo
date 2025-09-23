// File: src/hooks/useAuth.ts
import { useCallback } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import type { User as SupabaseUser, Session } from "@supabase/auth-js";
import type { User } from "@/types"; // your custom app user type

/**
 * Map Supabase user → App User
 */
function mapSupabaseUser(user: SupabaseUser): User {
  return {
    id: user.id,
    email: user.email ?? "",
    role: (user.user_metadata?.role as string) || "user",
    is_active: true, // default until managed in DB
    ...user.user_metadata, // include extra metadata if needed
  };
}

export function useAuth() {
  const supabase = useSupabaseClient();
  const { user, session, isLoading, setUser, setSession, setLoading, clearUser } =
    useAuthStore();

  /**
   * Sign in
   */
  const signIn = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.user && data.session) {
          setUser(mapSupabaseUser(data.user));
          setSession(data.session);
        }

        return { user: data.user, session: data.session };
      } catch (err) {
        console.error("❌ Error signing in:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [supabase, setLoading, setUser, setSession]
  );

  /**
   * Sign up
   */
  const signUp = useCallback(
    async (email: string, password: string, metadata?: Record<string, any>) => {
      setLoading(true);
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: metadata || {},
          },
        });

        if (error) throw error;

        if (data.user && data.session) {
          setUser(mapSupabaseUser(data.user));
          setSession(data.session);
        }

        return { user: data.user, session: data.session };
      } catch (err) {
        console.error("❌ Error signing up:", err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [supabase, setLoading, setUser, setSession]
  );

  /**
   * Sign out
   */
  const signOut = useCallback(async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      clearUser();
    } catch (err) {
      console.error("❌ Error signing out:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [supabase, setLoading, clearUser]);

  /**
   * Reset password
   */
  const resetPassword = useCallback(
    async (email: string) => {
      try {
        const { data, error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;
        return data;
      } catch (err) {
        console.error("❌ Error requesting password reset:", err);
        throw err;
      }
    },
    [supabase]
  );

  /**
   * Role check
   */
  const hasRole = useCallback(
    (roles: string[]) => {
      if (!user?.role) return false;
      return roles.includes(user.role);
    },
    [user]
  );

  return {
    user,
    session, // ✅ expose session (includes access_token)
    isLoading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    hasRole,
  };
}
