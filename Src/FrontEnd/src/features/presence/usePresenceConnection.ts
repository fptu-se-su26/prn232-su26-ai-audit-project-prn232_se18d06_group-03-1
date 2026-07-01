import { useEffect } from "react";
import { useAuthStore } from "@/features/auth/hooks/useAuth";
import { startPresenceConnection, stopPresenceConnection } from "@/features/presence/presenceConnection";

export function usePresenceConnection() {
  const token = useAuthStore((state) => state.token?.accessToken);
  const userId = useAuthStore((state) => state.user?.userId);

  useEffect(() => {
    if (!token || !userId) {
      void stopPresenceConnection().catch(() => undefined);
      return;
    }

    void startPresenceConnection().catch(() => undefined);
  }, [token, userId]);
}
