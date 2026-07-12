import { apiClient } from "@/services/apiClient";
import { endpoints } from "@/services/endpoints";
import type { ApiResponse } from "@/features/auth/types";

export interface DashboardStats {
  totalCompletedBookings: number;
  totalRevenue: number;
  totalBookingValue: number;
  totalDeposit: number;
  pendingWithdrawalAmount: number;
  pendingWithdrawalCount: number;
  recentBookings: Array<{
    id: number;
    bookingCode: string;
    status: string;
    depositAmount: number;
    platformFee: number;
    totalAmount: number;
    updatedAt: string;
  }>;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const res = await apiClient.get<ApiResponse<DashboardStats>>(endpoints.admin.dashboardStats);
  return res.data.data!;
}
