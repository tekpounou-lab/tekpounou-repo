// src/providers/AuthProvider.tsx
import { ReactNode, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { SessionContextProvider, useSupabaseClient } from "@supabase/auth-helpers-react";
import { useAuthStore } from "@/stores/authStore";
import { validateEnv } from "@/lib/config";

// Initialize supabase client only if environment variables are valid
const isValidEnv = validateEnv();
const supabase = isValidEnv 
  ? createClient(
      import.meta.env.VITE_SUPABASE_URL!,
      import.meta.env.VITE_SUPABASE_ANON_KEY!
    )
  : null;

interface Props {
  children: ReactNode;
}

export default function AuthProvider({ children }: Props) {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    if (supabase) {
      initialize();
    }
  }, [initialize]);

  // If Supabase is not configured, show a configuration message
  if (!supabase) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Configuration Required</h2>
            <p className="text-gray-600 mb-4">
              Please configure your Supabase credentials to continue.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 text-left">
              <h3 className="text-sm font-medium text-yellow-800 mb-2">Steps to configure:</h3>
              <ol className="text-sm text-yellow-700 space-y-1">
                <li>1. Update your <code className="bg-yellow-100 px-1 rounded">.env.local</code> file</li>
                <li>2. Set <code className="bg-yellow-100 px-1 rounded">VITE_SUPABASE_URL</code> to your project URL</li>
                <li>3. Set <code className="bg-yellow-100 px-1 rounded">VITE_SUPABASE_ANON_KEY</code> to your anon key</li>
                <li>4. Restart the development server</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <SessionContextProvider supabaseClient={supabase}>
      {children}
    </SessionContextProvider>
  );
}

// Re-export the hook for convenience
export { useSupabaseClient };
