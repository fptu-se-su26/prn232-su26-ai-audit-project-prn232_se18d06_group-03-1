import type { UserRole } from "@/features/auth/types";

export type AdminUserListItem = {
  userId: number;
  fullName: string;
  email: string;
  phone?: string | null;
  status: string;
  isOnline: boolean;
  lastSeenAt: string | null;
  createdAt: string;
  roles: UserRole[];
};
