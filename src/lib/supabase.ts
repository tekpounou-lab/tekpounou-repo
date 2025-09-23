// src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";
import { env, validateEnv } from "./config";

// ✅ Validate environment
const isValidEnv = validateEnv();
if (!isValidEnv) {
  throw new Error("❌ Invalid Supabase environment configuration.");
}

// ✅ Always create Supabase client (non-null)
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// ✅ Database table types
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          role: "super_admin" | "admin" | "teacher" | "student" | "guest" | "sme_client";
          created_at: string;
          updated_at: string;
          last_login: string | null;
          is_active: boolean;
        };
        Insert: {
          id: string;
          email: string;
          role?: "super_admin" | "admin" | "teacher" | "student" | "guest" | "sme_client";
          is_active?: boolean;
        };
        Update: {
          email?: string;
          role?: "super_admin" | "admin" | "teacher" | "student" | "guest" | "sme_client";
          last_login?: string | null;
          is_active?: boolean;
        };
      };
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          roles: ("super_admin" | "admin" | "teacher" | "student" | "guest" | "sme_client")[];
          preferred_language: "ht-HT" | "en-US" | "fr-FR";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          roles?: ("super_admin" | "admin" | "teacher" | "student" | "guest" | "sme_client")[];
          preferred_language?: "ht-HT" | "en-US" | "fr-FR";
        };
        Update: {
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          roles?: ("super_admin" | "admin" | "teacher" | "student" | "guest" | "sme_client")[];
          preferred_language?: "ht-HT" | "en-US" | "fr-FR";
        };
      };
    };
  };
};

// ✅ DB Helpers
export const db = {
  // Users
  async getUser(id: string) {
    return supabase.from("users").select("*").eq("id", id).single();
  },

  async updateUser(id: string, updates: Database["public"]["Tables"]["users"]["Update"]) {
    return supabase.from("users").update(updates).eq("id", id);
  },

  async getUserWithProfile(id: string) {
    return supabase
      .from("users")
      .select(`*, profiles (*)`)
      .eq("id", id)
      .single();
  },

  // Profiles
  async getProfile(id: string) {
    return supabase.from("profiles").select("*").eq("id", id).single();
  },

  async updateProfile(id: string, updates: Database["public"]["Tables"]["profiles"]["Update"]) {
    return supabase.from("profiles").update(updates).eq("id", id);
  },

  async createProfile(profile: Database["public"]["Tables"]["profiles"]["Insert"]) {
    return supabase.from("profiles").insert(profile);
  },

  // Platform stats (for admin dashboard)
  async getPlatformStats() {
    return supabase.rpc("get_platform_stats");
  },
};

// ✅ Auth Helpers
export const auth = {
  async signUp(email: string, password: string, metadata?: Record<string, any>) {
    return supabase.auth.signUp({
      email,
      password,
      options: { data: metadata },
    });
  },

  async signIn(email: string, password: string) {
    return supabase.auth.signInWithPassword({ email, password });
  },

  async signOut() {
    return supabase.auth.signOut();
  },

  async getSession() {
    return supabase.auth.getSession();
  },

  async getUser() {
    return supabase.auth.getUser();
  },

  async updateUser(updates: { email?: string; password?: string; data?: Record<string, any> }) {
    return supabase.auth.updateUser(updates);
  },

  async resetPassword(email: string) {
    return supabase.auth.resetPasswordForEmail(email);
  },
};

// ✅ Storage Helpers
export const storage = {
  async uploadFile(bucket: string, path: string, file: File) {
    return supabase.storage.from(bucket).upload(path, file);
  },

  getPublicUrl(bucket: string, path: string) {
    return supabase.storage.from(bucket).getPublicUrl(path);
  },

  async deleteFile(bucket: string, path: string) {
    return supabase.storage.from(bucket).remove([path]);
  },
};

export default supabase;
