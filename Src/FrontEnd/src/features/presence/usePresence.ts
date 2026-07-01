import { create } from "zustand";

export type PresenceStatus = {
  isOnline: boolean;
  lastSeenAt: string | null;
};

type PresenceState = {
  selfOnline: boolean;
  users: Record<number, PresenceStatus>;
  setSelfOnline: (isOnline: boolean) => void;
  setUserPresence: (userId: number, isOnline: boolean, lastSeenAt?: string | null) => void;
  hydrateUsers: (users: Array<{ userId: number; isOnline: boolean; lastSeenAt: string | null }>) => void;
};

export const usePresenceStore = create<PresenceState>((set) => ({
  selfOnline: false,
  users: {},
  setSelfOnline: (isOnline) => set({ selfOnline: isOnline }),
  setUserPresence: (userId, isOnline, lastSeenAt = null) =>
    set((state) => ({
      users: {
        ...state.users,
        [userId]: {
          isOnline,
          lastSeenAt,
        },
      },
    })),
  hydrateUsers: (users) =>
    set((state) => {
      const next = { ...state.users };
      for (const user of users) {
        next[user.userId] = {
          isOnline: user.isOnline,
          lastSeenAt: user.lastSeenAt,
        };
      }
      return { users: next };
    }),
}));
