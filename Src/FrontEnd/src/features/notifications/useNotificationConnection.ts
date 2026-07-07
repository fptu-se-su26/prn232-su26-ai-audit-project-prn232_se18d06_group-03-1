import { useEffect } from "react";
import { useAuthStore } from "@/features/auth/hooks/useAuth";
import { startNotificationConnection, stopNotificationConnection } from "@/features/notifications/notificationConnection";

export function useNotificationConnection() {
  const token = useAuthStore((state) => state.token?.accessToken);
  const userId = useAuthStore((state) => state.user?.userId);

  useEffect(() => {
    if (!token || !userId) {
      void stopNotificationConnection().catch(() => undefined);
      return;
    }

    void startNotificationConnection().catch(() => undefined);
  }, [token, userId]);
}
