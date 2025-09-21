// src/providers/AuthProvider.tsx
import { ReactNode, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { SessionContextProvider, useSupabaseClient } from "@supabase/auth-helpers-react";
import { useAuthStore } from "@/stores/authStore";

// Initialize a single supabase client for the whole app
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

interface Props {
  children: ReactNode;
}

export default function AuthProvider({ children }: Props) {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <SessionContextProvider supabaseClient={supabase}>
      {children}
    </SessionContextProvider>
  );
}

// Re-export the hook for convenience
export { useSupabaseClient };
