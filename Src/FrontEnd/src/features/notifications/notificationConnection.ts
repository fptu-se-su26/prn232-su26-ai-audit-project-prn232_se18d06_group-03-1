import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from "@microsoft/signalr";
import { getAuthUser, getToken } from "@/features/auth/hooks/useAuth";
import { useNotificationStore } from "@/features/notifications/useNotifications";
import type { NotificationCreatedPayload, NotificationUnreadCountPayload } from "@/features/notifications/types";
import { getApiBaseUrl } from "@/services/apiClient";

let connection: HubConnection | null = null;
let startPromise: Promise<void> | null = null;
let connectionUserId: number | null = null;

function getNotificationHubUrl() {
  return `${getApiBaseUrl()}/hubs/notifications`;
}

export async function startNotificationConnection() {
  const token = getToken();
  const currentUser = getAuthUser();
  if (!token || !currentUser) return;

  if (connection?.state === HubConnectionState.Connected || connection?.state === HubConnectionState.Connecting) {
    if (connectionUserId === currentUser.userId) {
      return;
    }

    await stopNotificationConnection();
  }

  if (!connection) {
    connection = new HubConnectionBuilder()
      .withUrl(getNotificationHubUrl(), {
        accessTokenFactory: () => getToken() ?? "",
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    connection.on("notification.created", (payload: NotificationCreatedPayload) => {
      useNotificationStore.getState().prependNotification(payload.notification, payload.unreadCount);
    });

    connection.on("notification.unreadCountChanged", (payload: NotificationUnreadCountPayload) => {
      useNotificationStore.getState().setUnreadCount(payload.unreadCount);
    });
  }

  const activeConnection = connection;
  startPromise = activeConnection.start().finally(() => {
    startPromise = null;
  });

  await startPromise;
  if (connection !== activeConnection) {
    await activeConnection.stop();
    return;
  }

  connectionUserId = currentUser.userId;
}

export async function stopNotificationConnection() {
  useNotificationStore.getState().reset();

  if (!connection) return;

  const activeConnection = connection;
  if (startPromise) {
    await startPromise.catch(() => undefined);
  }

  await activeConnection.stop();
  if (connection === activeConnection) {
    connection = null;
    connectionUserId = null;
  }
}
