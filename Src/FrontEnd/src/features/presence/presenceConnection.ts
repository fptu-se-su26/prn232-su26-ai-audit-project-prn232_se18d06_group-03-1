import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";
import { getApiBaseUrl } from "@/services/apiClient";
import { getAuthUser, getToken } from "@/features/auth/hooks/useAuth";
import { usePresenceStore } from "@/features/presence/usePresence";

let connection: HubConnection | null = null;
let heartbeatTimer: number | null = null;
let startPromise: Promise<void> | null = null;
let connectionUserId: number | null = null;

function getPresenceHubUrl() {
  return `${getApiBaseUrl()}/hubs/presence`;
}

function stopHeartbeat() {
  if (heartbeatTimer) {
    window.clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}

function startHeartbeat() {
  stopHeartbeat();
  heartbeatTimer = window.setInterval(() => {
    if (connection?.state === HubConnectionState.Connected) {
      void connection.invoke("Heartbeat");
    }
  }, 30_000);
}

export async function startPresenceConnection() {
  const token = getToken();
  const currentUser = getAuthUser();
  if (!token || !currentUser) return;

  if (connection?.state === HubConnectionState.Connected || connection?.state === HubConnectionState.Connecting) {
    if (connectionUserId === currentUser.userId) {
      return;
    }

    await stopPresenceConnection();
  }

  if (!connection) {
    connection = new HubConnectionBuilder()
      .withUrl(getPresenceHubUrl(), {
        accessTokenFactory: () => getToken() ?? "",
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    connection.on("UserPresenceChanged", (userId: number, isOnline: boolean, lastSeenAt: string | null) => {
      usePresenceStore.getState().setUserPresence(userId, isOnline, lastSeenAt);
      if (getAuthUser()?.userId === userId) {
        usePresenceStore.getState().setSelfOnline(isOnline);
      }
    });

    connection.onreconnected(() => {
      usePresenceStore.getState().setSelfOnline(true);
      void connection?.invoke("Heartbeat");
      startHeartbeat();
    });

    connection.onreconnecting(() => {
      usePresenceStore.getState().setSelfOnline(false);
      stopHeartbeat();
    });

    connection.onclose(() => {
      usePresenceStore.getState().setSelfOnline(false);
      stopHeartbeat();
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

  usePresenceStore.getState().setSelfOnline(true);
  connectionUserId = currentUser.userId;
  usePresenceStore.getState().setUserPresence(currentUser.userId, true, new Date().toISOString());

  await activeConnection.invoke("Heartbeat");
  startHeartbeat();
}

export async function stopPresenceConnection() {
  stopHeartbeat();
  usePresenceStore.getState().setSelfOnline(false);
  if (connectionUserId) {
    usePresenceStore.getState().setUserPresence(connectionUserId, false, new Date().toISOString());
  }

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
