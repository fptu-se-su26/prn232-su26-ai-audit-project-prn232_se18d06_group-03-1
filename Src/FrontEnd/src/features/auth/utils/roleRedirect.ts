import type { UserRole } from "@/features/auth/types";

const rolePriority: Array<{ path: string; role: UserRole }> = [
  { role: "Admin", path: "/admin" },
  { role: "Staff", path: "/staff" },
  { role: "Owner", path: "/owner" },
  { role: "Customer", path: "/customer" },
];

export function getDashboardPath(roles: UserRole[] = []) {
  return rolePriority.find((item) => roles.includes(item.role))?.path ?? "/";
}
