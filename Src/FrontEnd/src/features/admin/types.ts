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

export type AdminUserListParams = {
  keyword?: string;
  sortBy?: string;
  role?: string;
  status?: string;
  isOnline?: boolean;
  page?: number;
  pageSize?: number;
};

export type PagedResult<T> = {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
};
