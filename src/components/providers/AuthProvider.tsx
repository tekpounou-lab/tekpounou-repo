import { ReactNode, useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";

interface Props {
  children: ReactNode;
}

export default function AuthProvider({ children }: Props) {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return <>{children}</>;
}
